import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ClientRole, CompanyService } from '../../../../../../core/services/company.service';
import { ProductService, StockSucursalProducto } from '../../../../../../core/services/product.service';
import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../../shared/components/sidebar/sidebar';

type SalesTab = 'register' | 'history';
type DiscountType = 'percentage' | 'fixed';

interface ProductSearchItem {
  idProducto: number;
  nombre: string;
  unidadMedida: string;
  precio: number;
  stock: number;
  codigo: string;
  codigoBarras: string;
}

interface SaleDetailItem extends ProductSearchItem {
  cantidad: number;
  descuento: number;
  descuentoTipo: DiscountType;
}

interface ClientOption {
  id: number;
  nombre: string;
  correo: string;
}

type ProductStockRecord = StockSucursalProducto & {
  codigo?: string | number | null;
  codigo_producto?: string | number | null;
  codigo_barras?: string | number | null;
  barcode?: string | number | null;
};

@Component({
  selector: 'app-sales',
  imports: [FormsModule, Navbar, Sidebar],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sales implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly companyService = inject(CompanyService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('idEmpresa') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected readonly cashRegisterId = this.route.snapshot.paramMap.get('cashRegisterId') ?? '';

  protected activeTab: SalesTab = 'register';
  protected searchTerm = '';
  protected selectedClientId: number | null = null;
  protected saleDiscount = 0;

  protected loadingRegisterData = false;
  protected chargingSale = false;
  protected registerError = '';
  protected registerMessage = '';

  protected products: ProductSearchItem[] = [];
  protected clients: ClientOption[] = [];
  protected saleDetails: SaleDetailItem[] = [];

  ngOnInit(): void {
    this.loadRegisterData();
  }

  protected setActiveTab(tab: SalesTab): void {
    this.activeTab = tab;
  }

  protected get filteredProducts(): ProductSearchItem[] {
    const term = this.normalizeSearchTerm(this.searchTerm);

    if (!term) {
      return this.products.slice(0, 8);
    }

    return this.products
      .filter((product) => this.productMatchesSearch(product, term))
      .slice(0, 8);
  }

  protected get subtotal(): number {
    return this.roundCurrency(
      this.saleDetails.reduce((total, item) => total + item.precio * item.cantidad, 0),
    );
  }

  protected get detailDiscountTotal(): number {
    return this.roundCurrency(
      this.saleDetails.reduce((total, item) => total + this.getItemDiscountAmount(item), 0),
    );
  }

  protected get discountTotal(): number {
    return this.roundCurrency(Math.min(this.subtotal, this.detailDiscountTotal + this.normalizeMoney(this.saleDiscount)));
  }

  protected get total(): number {
    return this.roundCurrency(Math.max(this.subtotal - this.discountTotal, 0));
  }

  protected addProduct(product: ProductSearchItem): void {
    this.registerError = '';
    this.registerMessage = '';

    const existingItem = this.saleDetails.find((item) => item.idProducto === product.idProducto);

    if (existingItem) {
      this.updateQuantity(existingItem, existingItem.cantidad + 1);
      return;
    }

    this.saleDetails = [
      ...this.saleDetails,
      {
        ...product,
        cantidad: 1,
        descuento: 0,
        descuentoTipo: 'fixed',
      },
    ];
  }

  protected updateQuantity(item: SaleDetailItem, value: number | string): void {
    const quantity = Math.max(1, Math.floor(Number(value) || 1));

    if (item.stock > 0 && quantity > item.stock) {
      item.cantidad = item.stock;
      this.registerError = `Solo hay ${item.stock} unidades disponibles de ${item.nombre}.`;
      return;
    }

    item.cantidad = quantity;
    this.updateItemDiscount(item, item.descuento);
    this.registerError = '';
  }

  protected updateItemDiscount(item: SaleDetailItem, value: number | string): void {
    const discount = this.normalizeMoney(value);
    item.descuento = item.descuentoTipo === 'percentage'
      ? Math.min(discount, 100)
      : Math.min(discount, this.getItemSubtotal(item));
  }

  protected updateItemDiscountType(item: SaleDetailItem, type: DiscountType): void {
    item.descuentoTipo = type;
    this.updateItemDiscount(item, item.descuento);
  }

  protected getItemDiscountAmount(item: SaleDetailItem): number {
    const itemSubtotal = this.getItemSubtotal(item);

    if (item.descuentoTipo === 'percentage') {
      return this.roundCurrency(itemSubtotal * Math.min(this.normalizeMoney(item.descuento), 100) / 100);
    }

    return this.roundCurrency(Math.min(this.normalizeMoney(item.descuento), itemSubtotal));
  }

  protected getItemLineTotal(item: SaleDetailItem): number {
    return this.roundCurrency(Math.max(this.getItemSubtotal(item) - this.getItemDiscountAmount(item), 0));
  }

  protected removeProduct(item: SaleDetailItem): void {
    this.saleDetails = this.saleDetails.filter((detail) => detail.idProducto !== item.idProducto);
  }

  protected cobrar(): void {
    this.registerError = '';
    this.registerMessage = '';

    if (this.saleDetails.length === 0) {
      this.registerError = 'Agrega al menos un producto al detalle de venta.';
      return;
    }

    this.chargingSale = true;
    this.registerMessage = `Venta cobrada por Bs ${this.formatCurrency(this.total)}.`;
    this.saleDetails = [];
    this.searchTerm = '';
    this.selectedClientId = null;
    this.saleDiscount = 0;
    this.chargingSale = false;
  }

  protected formatCurrency(value: number): string {
    return this.roundCurrency(value).toFixed(2);
  }

  protected trackProduct(_: number, product: ProductSearchItem): number {
    return product.idProducto;
  }

  protected trackDetail(_: number, item: SaleDetailItem): number {
    return item.idProducto;
  }

  protected trackClient(_: number, client: ClientOption): number {
    return client.id;
  }

  private loadRegisterData(): void {
    this.loadingRegisterData = true;
    this.registerError = '';

    if (!this.companyId || !this.branchId) {
      this.loadingRegisterData = false;
      this.registerError = 'No se encontro la empresa o sucursal para cargar ventas.';
      return;
    }

    this.productService.getStockSucursal(this.companyId, this.branchId).subscribe({
      next: (stock) => {
        this.products = stock.map((item) => this.mapStockProduct(item));
        this.loadingRegisterData = false;
        this.loadClients();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.products = [];
        this.loadingRegisterData = false;
        this.registerError = error?.error?.detail ?? 'No se pudieron cargar los productos de la sucursal.';
        this.cdr.detectChanges();
      },
    });
  }

  private loadClients(): void {
    if (!this.companyId) {
      this.clients = [];
      return;
    }

    this.companyService.getClientesEmpresa(this.companyId).subscribe({
      next: (clients) => {
        this.clients = clients.map((client) => this.mapClient(client));
        this.cdr.detectChanges();
      },
      error: () => {
        this.clients = [];
        this.cdr.detectChanges();
      },
    });
  }

  private mapStockProduct(item: ProductStockRecord): ProductSearchItem {
    return {
      idProducto: item.id_producto,
      nombre: item.nombre_producto,
      unidadMedida: item.unidad_medida,
      precio: Number(item.precio ?? 0),
      stock: Number(item.cantidad ?? 0),
      codigo: this.stringifyOptional(item.codigo ?? item.codigo_producto ?? item.id_producto),
      codigoBarras: this.stringifyOptional(item.codigo_barras ?? item.barcode),
    };
  }

  private mapClient(client: ClientRole): ClientOption {
    return {
      id: client.id_usuario,
      nombre: client.usuario.persona?.nombre_completo ?? 'Sin nombre',
      correo: client.usuario.email,
    };
  }

  private productMatchesSearch(product: ProductSearchItem, term: string): boolean {
    const searchable = [
      product.nombre,
      product.codigo,
      product.codigoBarras,
      String(product.idProducto),
    ]
      .map((value) => this.normalizeSearchTerm(value))
      .join(' ');

    return searchable.includes(term);
  }

  private normalizeSearchTerm(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizeMoney(value: number | string): number {
    return Math.max(0, this.roundCurrency(Number(value) || 0));
  }

  private getItemSubtotal(item: SaleDetailItem): number {
    return this.roundCurrency(item.precio * item.cantidad);
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private stringifyOptional(value: string | number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }
}

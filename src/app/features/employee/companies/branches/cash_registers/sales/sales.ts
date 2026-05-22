import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CashRegisterMovementType,
  ClientRole,
  CompanyService,
} from '../../../../../../core/services/company.service';
import {
  CashRegisterMovementResponse,
  CashRegisterMovementListItem,
  CashRegisterService,
} from '../../../../../../core/services/cash-register.service';
import {
  MetodoPago,
  ProductService,
  StockSucursalProducto,
  TipoVenta,
} from '../../../../../../core/services/product.service';
import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../../shared/components/sidebar/sidebar';

type SessionViewMode = 'sales' | 'movements';
type SalesTab = 'register' | 'payment' | 'history';
type MovementTab = 'register' | 'list';
type DiscountType = 'percentage' | 'fixed';
type SalePaymentMethod = 'efectivo' | 'qr' | 'tarjeta';

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

interface SaleTypeOption {
  id: number;
  nombre: string;
  descripcion: string;
}

interface CashMovementTypeOption {
  id: number;
  nombre: string;
  descripcion: string;
}

interface PaymentMethodOption {
  id: number;
  nombre: string;
  descripcion: string;
}

interface SalePaymentRow {
  id: number;
  metodo: SalePaymentMethod;
  monto: number | null;
}

interface CashMovementItem {
  id: number;
  concepto: string;
  monto: number;
  tipoMovimientoId: number;
  tipoMovimiento: string;
  metodoPagoId: number | null;
  metodoPago: string;
  fecha: string;
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
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('idEmpresa') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected readonly cashRegisterId = this.route.snapshot.paramMap.get('cashRegisterId') ?? '';
  protected cashRegisterSessionId = this.route.snapshot.queryParamMap.get('sessionId') ?? '';

  protected viewMode: SessionViewMode = this.resolveViewMode(this.route.snapshot.queryParamMap.get('section'));
  protected sidebarActiveItemLabel = this.viewMode === 'movements' ? 'Movimientos' : 'Ventas';

  protected activeTab: SalesTab = 'register';
  protected movementActiveTab: MovementTab = 'register';
  protected searchTerm = '';
  protected selectedClientId: number | null = null;
  protected selectedSaleTypeId: number | null = null;
  protected saleDiscount = 0;
  protected movementConcept = '';
  protected movementAmount: number | null = null;
  protected selectedMovementTypeId: number | null = null;
  protected selectedPaymentMethodId: number | null = null;
  protected showPaymentTab = false;
  protected nextPaymentRowId = 1;

  protected loadingRegisterData = false;
  protected loadingSaleTypes = false;
  protected loadingMovementTypes = false;
  protected loadingPaymentMethods = false;
  protected loadingMovementItems = false;
  protected chargingSale = false;
  protected savingMovement = false;
  protected registerError = '';
  protected registerMessage = '';
  protected movementError = '';
  protected movementMessage = '';

  protected products: ProductSearchItem[] = [];
  protected clients: ClientOption[] = [];
  protected saleTypes: SaleTypeOption[] = [];
  protected saleDetails: SaleDetailItem[] = [];
  protected salePaymentRows: SalePaymentRow[] = [];
  protected movementTypes: CashMovementTypeOption[] = [];
  protected paymentMethods: PaymentMethodOption[] = [];
  protected movementItems: CashMovementItem[] = [];

  protected readonly salePaymentMethods: { value: SalePaymentMethod; label: string }[] = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'qr', label: 'QR' },
    { value: 'tarjeta', label: 'Tarjeta' },
  ];

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.cashRegisterSessionId = params.get('sessionId') ?? '';
      const nextMode = this.resolveViewMode(params.get('section'));

      if (nextMode !== this.viewMode) {
        this.viewMode = nextMode;
        this.sidebarActiveItemLabel = nextMode === 'movements' ? 'Movimientos' : 'Ventas';
        this.resetViewState();

        if (nextMode === 'sales') {
          this.loadSalesViewData();
        } else {
          this.loadMovementTypes();
          this.loadPaymentMethods();
        }

        this.cdr.detectChanges();
      }
    });

    if (this.viewMode === 'sales') {
      this.loadSalesViewData();
    } else {
      this.loadMovementTypes();
      this.loadPaymentMethods();
      this.loadMovementItems();
    }
  }

  protected setActiveTab(tab: SalesTab): void {
    if (tab !== 'payment') {
      this.closePaymentTab();
    }

    this.activeTab = tab;
  }

  protected setMovementTab(tab: MovementTab): void {
    this.movementActiveTab = tab;
    this.limpiarMensajesMovimientoCaja();

    if (tab === 'list') {
      this.loadMovementItems();
    }
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

    this.openPaymentTab();
  }

  protected addPaymentRow(): void {
    this.salePaymentRows = [
      ...this.salePaymentRows,
      this.createPaymentRow(),
    ];
  }

  protected removePaymentRow(row: SalePaymentRow): void {
    if (this.salePaymentRows.length === 1) {
      this.salePaymentRows = [this.createPaymentRow(this.salePaymentRows[0]?.id)];
      return;
    }

    this.salePaymentRows = this.salePaymentRows.filter((paymentRow) => paymentRow.id !== row.id);
  }

  protected trackPaymentRow(_: number, row: SalePaymentRow): number {
    return row.id;
  }

  protected registrarPago(): void {
    this.registerError = '';
    this.chargingSale = true;
    this.registerMessage = `Venta cobrada por Bs ${this.formatCurrency(this.total)}.`;
    this.resetSaleForm();
    this.closePaymentTab();
    this.activeTab = 'history';
    this.chargingSale = false;
  }

  protected cancelarPago(): void {
    this.registerError = '';
    this.closePaymentTab();
    this.activeTab = 'register';
  }

  private openPaymentTab(): void {
    this.showPaymentTab = true;
    this.salePaymentRows = [this.createPaymentRow(undefined, this.total)];
    this.activeTab = 'payment';
  }

  private closePaymentTab(): void {
    this.showPaymentTab = false;
    this.salePaymentRows = [];
  }

  private resetSaleForm(): void {
    this.saleDetails = [];
    this.searchTerm = '';
    this.selectedClientId = null;
    this.selectedSaleTypeId = this.saleTypes[0]?.id ?? null;
    this.saleDiscount = 0;
  }

  private createPaymentRow(id = this.nextPaymentRowId++, monto: number | null = null): SalePaymentRow {
    return {
      id,
      metodo: 'efectivo',
      monto,
    };
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

  protected trackMovementType(_: number, movementType: CashMovementTypeOption): number {
    return movementType.id;
  }

  protected trackMovementItem(_: number, movementItem: CashMovementItem): number {
    return movementItem.id;
  }

  protected registrarMovimientoCaja(event: SubmitEvent): void {
    event.preventDefault();
    this.limpiarMensajesMovimientoCaja();

    const concepto = this.movementConcept.trim();
    const monto = Number(this.movementAmount);
    const tipoMovimientoId = Number(this.selectedMovementTypeId);
    const metodoPagoId = Number(this.selectedPaymentMethodId);

    if (!concepto || !monto || monto <= 0 || !tipoMovimientoId || !metodoPagoId) {
      this.movementError = 'Completa concepto, monto, tipo de movimiento y metodo de pago.';
      return;
    }

    if (!this.cashRegisterSessionId) {
      this.movementError = 'No se encontro la sesion de caja para registrar el movimiento.';
      return;
    }

    const tipoMovimiento = this.movementTypes.find((movementType) => movementType.id === tipoMovimientoId);

    this.savingMovement = true;

    this.cashRegisterService
      .crearMovimientoCajaSesion(this.cashRegisterSessionId, {
        concepto,
        monto: this.roundCurrency(monto),
        id_tipo_movimiento_caja: tipoMovimientoId,
        id_metodo_pago: metodoPagoId,
      })
      .subscribe({
        next: () => {
          this.movementMessage = 'Movimiento de caja registrado correctamente.';
          this.movementConcept = '';
          this.movementAmount = null;
          this.selectedMovementTypeId = this.movementTypes[0]?.id ?? null;
          this.movementActiveTab = 'list';
          this.savingMovement = false;
          this.loadMovementItems();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.savingMovement = false;
          this.movementError = error?.error?.detail ?? 'No se pudo registrar el movimiento de caja.';
          this.cdr.detectChanges();
        },
      });
  }

  private loadSalesViewData(): void {
    this.loadRegisterData();
    this.loadSaleTypes();
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

  private loadSaleTypes(): void {
    this.loadingSaleTypes = true;

    this.productService.getTiposVenta().subscribe({
      next: (saleTypes) => {
        this.saleTypes = saleTypes.map((saleType) => this.mapSaleType(saleType));
        this.selectedSaleTypeId = this.saleTypes[0]?.id ?? null;
        this.loadingSaleTypes = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.saleTypes = [];
        this.selectedSaleTypeId = null;
        this.loadingSaleTypes = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadMovementTypes(): void {
    this.loadingMovementTypes = true;
    this.movementError = '';

    this.companyService.getTiposMovimientoCaja().subscribe({
      next: (types) => {
        this.movementTypes = types.map((type) => this.mapMovementType(type));
        this.selectedMovementTypeId = this.movementTypes[0]?.id ?? null;
        this.loadingMovementTypes = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.movementTypes = [];
        this.selectedMovementTypeId = null;
        this.loadingMovementTypes = false;
        this.movementError = 'No se pudieron cargar los tipos de movimiento de caja.';
        this.cdr.detectChanges();
      },
    });
  }

  private loadMovementItems(): void {
    if (!this.cashRegisterSessionId) {
      this.movementItems = [];
      this.loadingMovementItems = false;
      this.movementError = 'No se encontro la sesion de caja para cargar movimientos.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingMovementItems = true;

    this.cashRegisterService.getMovimientosCajaSesion(this.cashRegisterSessionId).subscribe({
      next: (movements) => {
        this.movementItems = movements.map((movement) => this.mapCashMovement(movement));
        this.loadingMovementItems = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.movementItems = [];
        this.loadingMovementItems = false;
        this.movementError = error?.error?.detail ?? 'No se pudieron cargar los movimientos de caja.';
        this.cdr.detectChanges();
      },
    });
  }

  private loadPaymentMethods(): void {
    this.loadingPaymentMethods = true;

    this.productService.getMetodosPago().subscribe({
      next: (methods) => {
        this.paymentMethods = methods.map((method) => this.mapPaymentMethod(method));
        this.selectedPaymentMethodId = this.paymentMethods[0]?.id ?? null;
        this.loadingPaymentMethods = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.paymentMethods = [];
        this.selectedPaymentMethodId = null;
        this.loadingPaymentMethods = false;
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

  private mapSaleType(saleType: TipoVenta): SaleTypeOption {
    return {
      id: saleType.id_tipo_venta,
      nombre: saleType.nombre,
      descripcion: saleType.descripcion ?? '',
    };
  }

  private mapMovementType(movementType: CashRegisterMovementType): CashMovementTypeOption {
    return {
      id: movementType.id_tipo_movimiento_caja,
      nombre: movementType.nombre,
      descripcion: movementType.descripcion ?? '',
    };
  }

  private mapPaymentMethod(method: MetodoPago): PaymentMethodOption {
    return {
      id: method.id_metodo_pago,
      nombre: method.nombre,
      descripcion: method.descripcion ?? '',
    };
  }

  private mapCashMovement(
    movement: CashRegisterMovementResponse | CashRegisterMovementListItem,
    defaultTipoMovimiento?: string,
    defaultMetodoPago?: string,
  ): CashMovementItem {
    const tipoMovimientoId = movement.id_tipo_movimiento_caja;
    const metodoPagoId = movement.id_metodo_pago;

    return {
      id: movement.id_movimiento_caja,
      concepto: movement.concepto,
      monto: Number(movement.monto ?? 0),
      tipoMovimientoId,
      tipoMovimiento:
        defaultTipoMovimiento ??
        this.movementTypes.find((type) => type.id === tipoMovimientoId)?.nombre ??
        `Tipo ${tipoMovimientoId}`,
      metodoPagoId,
      metodoPago:
        defaultMetodoPago ??
        (metodoPagoId
          ? this.paymentMethods.find((method) => method.id === metodoPagoId)?.nombre ?? `Metodo ${metodoPagoId}`
          : 'Sin metodo'),
      fecha: this.formatMovementDate(movement.fecha),
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

  private formatMovementDate(date: string): string {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsedDate);
  }

  private resolveViewMode(section: string | null): SessionViewMode {
    return section === 'movimientos' ? 'movements' : 'sales';
  }

  private resetViewState(): void {
    this.clearSalesMessages();
    this.limpiarMensajesMovimientoCaja();
    this.activeTab = 'register';
    this.movementActiveTab = 'register';
    this.closePaymentTab();
  }

  private clearSalesMessages(): void {
    this.registerError = '';
    this.registerMessage = '';
  }

  private limpiarMensajesMovimientoCaja(): void {
    this.movementError = '';
    this.movementMessage = '';
  }

  private stringifyOptional(value: string | number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }
}

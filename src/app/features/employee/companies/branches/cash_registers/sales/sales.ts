import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CashRegisterMovementType,
  ClientRole,
  CompanyService,
  ClientCategoryResponse,
} from '../../../../../../core/services/company.service';
import {
  CreateSaleRequest,
  CashRegisterMovementResponse,
  CashRegisterMovementListItem,
  SaleHistoryResponse,
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
  categoriaId?: number | null;
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
  metodoPagoId: number | null;
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

interface SaleHistoryRow {
  id: number;
  tipoVentaId: number | string;
  fecha: string;
  tipoVenta: string;
  cliente: string;
  clienteId: number | string | null;
  usuarioId: number | string;
  cajaSesionId: number | string;
  total: number;
  estado: string;
  metodosPago: string;
  metodosPagoIds: string;
  articulos: number;
  subtotal: number;
  descuentoTotal: number;
}

type ProductStockRecord = StockSucursalProducto & {
  codigo?: string | number | null;
  codigo_producto?: string | number | null;
  codigo_barra?: string | number | null;
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
  protected loadingSalesHistory = false;
  protected chargingSale = false;
  protected savingMovement = false;
  protected registerError = '';
  protected registerMessage = '';
  protected movementError = '';
  protected movementMessage = '';
  protected salesHistoryError = '';

  protected products: ProductSearchItem[] = [];
  protected clients: ClientOption[] = [];
  protected saleTypes: SaleTypeOption[] = [];
  protected saleDetails: SaleDetailItem[] = [];
  protected salePaymentRows: SalePaymentRow[] = [];
  protected salesHistory: SaleHistoryRow[] = [];
  protected movementTypes: CashMovementTypeOption[] = [];
  protected paymentMethods: PaymentMethodOption[] = [];
  protected movementItems: CashMovementItem[] = [];

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

    if (tab === 'history') {
      this.loadSalesHistory();
    }
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

    const clientDiscount = this.getClientDiscountPercentage();

    this.saleDetails = [
      ...this.saleDetails,
      {
        ...product,
        cantidad: 1,
        descuento: clientDiscount > 0 ? clientDiscount : 0,
        descuentoTipo: clientDiscount > 0 ? 'percentage' : 'fixed',
      },
    ];
  }

  protected onSearchEnter(event: Event): void {
    event.preventDefault();

    if (this.filteredProducts.length === 1) {
      this.addProduct(this.filteredProducts[0]);
    }
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

    if (!this.cashRegisterSessionId) {
      this.registerError = 'No se encontro la sesion de caja para registrar la venta.';
      return;
    }

    if (this.saleDetails.length === 0) {
      this.registerError = 'Agrega al menos un producto al detalle de venta.';
      return;
    }

    if (!this.selectedSaleTypeId) {
      this.registerError = 'Selecciona un tipo de venta.';
      return;
    }

    const paymentRow = this.salePaymentRows[0];
    const idMetodoPago = paymentRow?.metodoPagoId ?? null;

    if (!idMetodoPago) {
      this.registerError = 'Selecciona un metodo de pago.';
      return;
    }

    const payload: CreateSaleRequest = {
      id_tipo_venta: this.selectedSaleTypeId,
      id_cliente: this.selectedClientId,
      id_metodo_pago: idMetodoPago,
      subtotal: this.subtotal,
      descuento_total: this.discountTotal,
      total: this.total,
      estado: 'Pendiente',
      detalles: this.saleDetails.map((item) => ({
        id_producto: item.idProducto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        descuento: this.getItemDiscountAmount(item),
        subtotal: this.getItemLineTotal(item),
        descripcion: 'Venta de mostrador',
      })),
    };

    this.chargingSale = true;

    this.cashRegisterService.registrarVentaSesionCaja(this.cashRegisterSessionId, payload).subscribe({
      next: (response) => {
        this.registerMessage = `Venta registrada correctamente con el ID ${response.id_venta}.`;
        this.resetSaleForm();
        this.closePaymentTab();
        this.activeTab = 'register';
        this.chargingSale = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.chargingSale = false;
        this.registerError = error?.error?.detail ?? 'No se pudo registrar la venta.';
        this.cdr.detectChanges();
      },
    });
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
      metodoPagoId: this.paymentMethods[0]?.id ?? null,
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
    this.loadPaymentMethods();

    if (this.activeTab === 'history') {
      this.loadSalesHistory();
    }
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
        this.products = stock
          .map((item) => this.mapStockProduct(item))
          .filter((product) => product.stock > 0);
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
        if (this.salePaymentRows.length > 0) {
          this.salePaymentRows = this.salePaymentRows.map((row) => ({
            ...row,
            metodoPagoId: row.metodoPagoId ?? this.paymentMethods[0]?.id ?? null,
          }));
        }
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

  private loadSalesHistory(): void {
    if (!this.cashRegisterSessionId) {
      this.salesHistory = [];
      this.loadingSalesHistory = false;
      this.salesHistoryError = 'No se encontro la sesion de caja para cargar el historial de ventas.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingSalesHistory = true;
    this.salesHistoryError = '';

    this.cashRegisterService.getVentasSesionCaja(this.cashRegisterSessionId).subscribe({
      next: (sales) => {
        this.salesHistory = sales.map((sale) => this.mapSaleHistory(sale)).reverse();
        this.loadingSalesHistory = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.salesHistory = [];
        this.loadingSalesHistory = false;
        this.salesHistoryError = error?.error?.detail ?? 'No se pudo cargar el historial de ventas.';
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
      codigoBarras: this.stringifyOptional(item.codigo_barra),
    };
  }

  private mapClient(client: ClientRole): ClientOption {
    return {
      id: client.id_usuario,
      nombre: client.usuario.persona?.nombre_completo ?? 'Sin nombre',
      correo: client.usuario.email,
      categoriaId: client.cliente?.id_categoria_cliente ?? null,
    };
  }

  protected selectedClientCategory: ClientCategoryResponse | null = null;

  protected onClientSelected(clientId: number | null): void {
    if (!clientId) {
      this.selectedClientCategory = null;
      this.cdr.detectChanges();
      return;
    }

    const client = this.clients.find((c) => c.id === clientId);
    const categoriaId = client?.categoriaId ?? null;

    if (!categoriaId) {
      this.selectedClientCategory = null;
      this.cdr.detectChanges();
      return;
    }

    // Fetch categories and find the matching one
    this.companyService.getCategoriasCliente(this.companyId).subscribe({
      next: (categories) => {
        const found = categories.find((cat) => cat.id_categoria_cliente === categoriaId) ?? null;
        this.selectedClientCategory = found;

        // If a category with a base discount exists, apply it to current sale details
        const pct = this.getClientDiscountPercentage();
        if (pct > 0) {
          this.applyClientDiscountToSaleDetails(pct);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedClientCategory = null;
        this.cdr.detectChanges();
      },
    });
  }

  private getClientDiscountPercentage(): number {
    const raw = this.selectedClientCategory?.descuento_base ?? null;
    const value = Number(raw ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  }

  private applyClientDiscountToSaleDetails(percentage: number): void {
    if (!percentage || percentage <= 0) return;

    this.saleDetails = this.saleDetails.map((item) => {
      const updated: SaleDetailItem = { ...item };
      updated.descuentoTipo = 'percentage';
      // set descuento as percentage number (bounded by updateItemDiscount logic below)
      updated.descuento = percentage;
      // ensure discount value is normalized
      this.updateItemDiscount(updated, updated.descuento);
      return updated;
    });
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

  private mapSaleHistory(sale: SaleHistoryResponse): SaleHistoryRow {
    const rawSale = sale as SaleHistoryResponse & {
      tipo_venta?: { nombre?: string };
      tipoVenta?: { nombre?: string };
      cliente?: { nombre?: string };
    };

    const salePayments = sale.pagos ?? [];
    const saleDetails = sale.detalles ?? [];

    const paymentLabels = salePayments.length > 0
      ? salePayments
          .map((payment) => {
            const methodName = this.paymentMethods.find((method) => method.id === payment.id_metodo_pago)?.nombre;
            const amount = this.formatCurrency(Number(payment.monto ?? 0));
            return `${methodName ?? `Metodo ${payment.id_metodo_pago}`}: Bs ${amount}`;
          })
          .join(' | ')
      : 'Sin pagos';

    const tipoVentaId =
      sale.id_tipo_venta ??
      (sale as unknown as Record<string, number | string | undefined>)['id_tipo_venta'] ??
      (sale as unknown as Record<string, number | string | undefined>)['idTipoVenta'] ??
      'Sin tipo';

    const saleTypeLabel =
      rawSale.tipo_venta?.nombre ??
      rawSale.tipoVenta?.nombre ??
      this.saleTypes.find((type) => type.id === Number(tipoVentaId))?.nombre ??
      `Tipo ${tipoVentaId}`;

    const client = sale.id_cliente
      ? String(sale.id_cliente)
      : 'Consumidor';

    const paymentMethodIds = salePayments.length > 0
      ? salePayments.map((payment) => String(payment.id_venta_pago)).join(' | ')
      : 'Sin metodo';

    return {
      id: sale.id_venta,
      tipoVentaId,
      fecha: this.formatDateOnly(sale.fecha),
      tipoVenta: saleTypeLabel,
      cliente: client,
      clienteId: sale.id_cliente,
      usuarioId: sale.id_usuario,
      cajaSesionId: sale.id_caja_sesion,
      total: Number(sale.total ?? 0),
      estado: sale.estado,
      metodosPago: paymentLabels,
      metodosPagoIds: paymentMethodIds,
      articulos: saleDetails.reduce((total, detail) => total + Number(detail.cantidad ?? 0), 0),
      subtotal: Number(sale.subtotal ?? 0),
      descuentoTotal: Number(sale.descuento_total ?? 0),
    };
  }

  private productMatchesSearch(product: ProductSearchItem, term: string): boolean {
    const normalizedTerm = this.normalizeSearchTerm(term);
    const normalizedBarcodeTerm = this.normalizeBarcode(normalizedTerm);
    const searchable = [
      product.nombre,
      product.codigo,
      product.codigoBarras,
      String(product.idProducto),
    ]
      .map((value) => this.normalizeSearchTerm(value))
      .join(' ');

    if (searchable.includes(normalizedTerm)) {
      return true;
    }

    if (!normalizedBarcodeTerm) {
      return false;
    }

    return this.normalizeBarcode(searchable).includes(normalizedBarcodeTerm);
  }

  private normalizeSearchTerm(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizeBarcode(value: string): string {
    return value.replace(/\D+/g, '');
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

  private formatDateOnly(date: string): string {
    // If the API returns an ISO-like date string without timezone (e.g. "2026-05-24T18:30:00"),
    // extract the date part directly to avoid timezone surprises and always show dd/mm/yyyy.
    const isoMatch = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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

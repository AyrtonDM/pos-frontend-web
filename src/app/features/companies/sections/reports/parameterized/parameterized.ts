import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../shared/components/sidebar/sidebar';
import { Branch, CompanyService, CompanyStaffMember, CashRegisterMovementType } from '../../../../../core/services/company.service';
import { ProductService, TipoVenta, MetodoPago, Producto, TipoMovimiento, CategoriaProducto } from '../../../../../core/services/product.service';
import {
  CashRegisterListResponse,
  CashRegisterResponse,
  CashRegisterService,
} from '../../../../../core/services/cash-register.service';
import { ApiService } from '../../../../../core/services/api.service';

type ParameterizedReportTab = 'sale' | 'inventory' | 'cash';

@Component({
  selector: 'app-parameterized-reports',
  imports: [Navbar, Sidebar, FormsModule],
  templateUrl: './parameterized.html',
  styleUrl: './parameterized.css',
})
export class ParameterizedReports implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private readonly productService = inject(ProductService);
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly apiService = inject(ApiService);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected activeTab: ParameterizedReportTab = 'sale';
  protected branchOptions = ['Todas'];
  protected saleTypeOptions = ['Todas'];
  protected paymentMethodOptions = ['Todos'];
  protected productOptions = ['Todos'];
  protected staffOptions = ['Todos'];
  protected inventoryMovementTypeOptions = ['Todos'];
  protected categoryOptions = ['Todas'];
  protected cashOptions = ['Todas'];
  protected cashMovementTypeOptions = ['Todos'];

  private branchesList: Branch[] = [];
  private saleTypesList: TipoVenta[] = [];
  private paymentMethodsList: MetodoPago[] = [];
  private productsList: Producto[] = [];
  private staffList: CompanyStaffMember[] = [];
  private movementTypesList: TipoMovimiento[] = [];
  private categoriesList: CategoriaProducto[] = [];
  private cashRegistersList: CashRegisterResponse[] = [];
  private cashMovementTypesList: CashRegisterMovementType[] = [];

  protected saleFilters = {
    startDate: '01/05/2026',
    endDate: '31/05/2026',
    branch: 'Todas',
    saleType: 'Todas',
    paymentMethod: 'Todos',
    product: 'Todos',
    staff: 'Todos',
  };

  protected salesReport: null | any = null;
  protected loadingSalesReport = false;

  protected inventoryFilters = {
    startDate: '01/05/2026',
    endDate: '31/05/2026',
    branch: 'Todas',
    movementType: 'Todos',
    product: 'Todos',
    category: 'Todas',
  };

  protected inventoryReport: null | any = null;
  protected loadingInventoryReport = false;

  protected cashFilters = {
    startDate: '01/05/2026',
    endDate: '31/05/2026',
    branch: 'Todas',
    cash: 'Todas',
    movementType: 'Todos',
    sessionStatus: 'Todas',
  };

  protected cashReport: null | any = null;
  protected loadingCashReport = false;

  ngOnInit(): void {
    this.loadFilterOptions();
  }

  protected setActiveTab(tab: ParameterizedReportTab): void {
    this.activeTab = tab;
    this.salesReport = null;
  }

  protected clearSaleFilters(): void {
    this.saleFilters = {
      startDate: '01/05/2026',
      endDate: '31/05/2026',
      branch: 'Todas',
      saleType: 'Todas',
      paymentMethod: 'Todos',
      product: 'Todos',
      staff: 'Todos',
    };
    this.salesReport = null;
  }

  protected clearInventoryFilters(): void {
    this.inventoryFilters = {
      startDate: '01/05/2026',
      endDate: '31/05/2026',
      branch: 'Todas',
      movementType: 'Todos',
      product: 'Todos',
      category: 'Todas',
    };
    this.inventoryReport = null;
  }

  protected clearCashFilters(): void {
    this.cashFilters = {
      startDate: '01/05/2026',
      endDate: '31/05/2026',
      branch: 'Todas',
      cash: 'Todas',
      movementType: 'Todos',
      sessionStatus: 'Todas',
    };
    this.cashReport = null;
  }

  protected generateSalesReport(): void {
    this.loadingSalesReport = true;
    const normalizeStr = (str: string) =>
      str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';

    const selectedBranch = this.saleFilters.branch;
    const branchObj = normalizeStr(selectedBranch) === 'todas'
      ? null
      : this.branchesList.find((b) => normalizeStr(b.nombre) === normalizeStr(selectedBranch));
    const branchId = branchObj ? (branchObj.id_sucursal ?? branchObj.idSucursal ?? branchObj.id) : null;

    const selectedSaleType = this.saleFilters.saleType;
    const saleTypeObj = normalizeStr(selectedSaleType) === 'todas'
      ? null
      : this.saleTypesList.find((t) => normalizeStr(t.nombre) === normalizeStr(selectedSaleType));
    const saleTypeId = saleTypeObj ? saleTypeObj.id_tipo_venta : null;

    const selectedPaymentMethod = this.saleFilters.paymentMethod;
    const paymentMethodObj = normalizeStr(selectedPaymentMethod) === 'todos'
      ? null
      : this.paymentMethodsList.find((m) => normalizeStr(m.nombre) === normalizeStr(selectedPaymentMethod));
    const paymentMethodId = paymentMethodObj ? paymentMethodObj.id_metodo_pago : null;

    const selectedProduct = this.saleFilters.product;
    const productObj = normalizeStr(selectedProduct) === 'todos'
      ? null
      : this.productsList.find((p) => normalizeStr(p.nombre) === normalizeStr(selectedProduct));
    const productId = productObj ? productObj.id_producto : null;

    const selectedStaff = this.saleFilters.staff;
    const staffObj = normalizeStr(selectedStaff) === 'todos'
      ? null
      : this.staffList.find(
          (s) => normalizeStr(s.usuario.persona?.nombre_completo ?? s.usuario.email) === normalizeStr(selectedStaff)
        );
    const staffId = staffObj ? staffObj.id_usuario : null;

    const parseDateToYYYYMMDD = (dateStr: string): string => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };

    const payload = {
      fecha_inicial: parseDateToYYYYMMDD(this.saleFilters.startDate),
      fecha_final: parseDateToYYYYMMDD(this.saleFilters.endDate),
      id_sucursal: branchId ? Number(branchId) : null,
      id_tipo_venta: saleTypeId ? Number(saleTypeId) : null,
      id_metodo_pago: paymentMethodId ? Number(paymentMethodId) : null,
      id_producto: productId ? Number(productId) : null,
      id_usuario: staffId ? Number(staffId) : null,
    };

    const formatCurrency = (v: number) => {
      try {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(v);
      } catch {
        return `Bs ${v.toFixed(2)}`;
      }
    };

    this.apiService.post<any, any>(`/api/reportes/${this.companyId}/ventasparametrizado`, payload).subscribe({
      next: (response) => {
        this.loadingSalesReport = false;
        const totalSalesObj = response.resumen_gerencial?.find(
          (r: any) =>
            r.indicador?.toLowerCase().includes('total de ventas') ||
            r.indicador?.toLowerCase().includes('ventas realizadas')
        );
        const totalSales = totalSalesObj ? totalSalesObj.valor : 0;

        const totalAmountObj = response.resumen_gerencial?.find(
          (r: any) =>
            r.indicador?.toLowerCase().includes('monto') ||
            r.indicador?.toLowerCase().includes('total vendido')
        );
        const totalAmountVal = totalAmountObj ? totalAmountObj.valor : 0;
        const totalAmount = formatCurrency(totalAmountVal);

        const totalProductsObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('productos')
        );
        const totalProducts = totalProductsObj ? totalProductsObj.valor : 0;

        this.salesReport = {
          company: response.empresa || 'Supermercado La Estrella',
          generatedAt: response.fecha_generacion,
          filters: this.saleFilters,
          summary: {
            totalSales,
            totalAmount,
            totalProducts,
          },
          details: (response.detalle_analitico || []).map((item: any) => ({
            nro: item.numero_venta,
            datetime: item.fecha_hora,
            staff: item.personal,
            type: item.tipo,
            method: item.metodo_pago,
            products: item.productos,
            total: formatCurrency(Number(item.total)),
          })),
        };
      },
      error: (err) => {
        this.loadingSalesReport = false;
        console.error('Error generating sales report:', err);
      },
    });
  }

  protected generateInventoryReport(): void {
    this.loadingInventoryReport = true;
    const normalizeStr = (str: string) =>
      str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';

    const selectedBranch = this.inventoryFilters.branch;
    const branchObj = normalizeStr(selectedBranch) === 'todas'
      ? null
      : this.branchesList.find((b) => normalizeStr(b.nombre) === normalizeStr(selectedBranch));
    const branchId = branchObj ? (branchObj.id_sucursal ?? branchObj.idSucursal ?? branchObj.id) : null;

    const selectedMovementType = this.inventoryFilters.movementType;
    const movementTypeObj = normalizeStr(selectedMovementType) === 'todos'
      ? null
      : this.movementTypesList.find((t) => normalizeStr(t.nombre) === normalizeStr(selectedMovementType));
    const movementTypeId = movementTypeObj ? movementTypeObj.id_tipo_movimiento : null;

    const selectedProduct = this.inventoryFilters.product;
    const productObj = normalizeStr(selectedProduct) === 'todos'
      ? null
      : this.productsList.find((p) => normalizeStr(p.nombre) === normalizeStr(selectedProduct));
    const productId = productObj ? productObj.id_producto : null;

    const selectedCategory = this.inventoryFilters.category;
    const categoryObj = normalizeStr(selectedCategory) === 'todas'
      ? null
      : this.categoriesList.find((c) => normalizeStr(c.nombre) === normalizeStr(selectedCategory));
    const categoryId = categoryObj ? categoryObj.id_categoria_producto : null;

    const parseDateToYYYYMMDD = (dateStr: string): string => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };

    const payload = {
      fecha_inicial: parseDateToYYYYMMDD(this.inventoryFilters.startDate),
      fecha_final: parseDateToYYYYMMDD(this.inventoryFilters.endDate),
      id_sucursal: branchId ? Number(branchId) : null,
      id_tipo_movimiento: movementTypeId ? Number(movementTypeId) : null,
      id_producto: productId ? Number(productId) : null,
      id_categoria_producto: categoryId ? Number(categoryId) : null,
    };

    this.apiService.post<any, any>(`/api/reportes/${this.companyId}/inventarioparametrizado`, payload).subscribe({
      next: (response) => {
        this.loadingInventoryReport = false;
        
        const totalMovementsObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('movimientos')
        );
        const totalMovements = totalMovementsObj ? totalMovementsObj.valor : 0;

        const availableStockObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('disponible')
        );
        const availableStock = availableStockObj ? availableStockObj.valor : 0;

        const lowStockObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('bajo')
        );
        const lowStock = lowStockObj ? lowStockObj.valor : 0;

        const outOfStockObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('agotados')
        );
        const outOfStock = outOfStockObj ? outOfStockObj.valor : 0;

        this.inventoryReport = {
          company: response.empresa || 'Supermercado La Estrella',
          generatedAt: response.fecha_generacion,
          filters: this.inventoryFilters,
          summary: {
            totalMovements,
            availableStock,
            lowStock,
            outOfStock,
          },
          details: (response.detalle_analitico || []).map((item: any) => ({
            nro: item.numero_movimiento,
            datetime: item.fecha_hora,
            product: item.producto,
            category: item.categoria,
            type: item.tipo,
            quantity: item.cantidad,
          })),
        };
      },
      error: (err) => {
        this.loadingInventoryReport = false;
        console.error('Error generating inventory report:', err);
      },
    });
  }

  protected generateCashReport(): void {
    this.loadingCashReport = true;
    const normalizeStr = (str: string) =>
      str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';

    const selectedBranch = this.cashFilters.branch;
    const branchObj = normalizeStr(selectedBranch) === 'todas'
      ? null
      : this.branchesList.find((b) => normalizeStr(b.nombre) === normalizeStr(selectedBranch));
    const branchId = branchObj ? (branchObj.id_sucursal ?? branchObj.idSucursal ?? branchObj.id) : null;

    const selectedCash = this.cashFilters.cash;
    const cashObj = normalizeStr(selectedCash) === 'todas'
      ? null
      : this.cashRegistersList.find((c) => normalizeStr(c.nombre) === normalizeStr(selectedCash));
    const cashId = cashObj ? cashObj.id_caja : null;

    const selectedMovementType = this.cashFilters.movementType;
    const movementTypeObj = normalizeStr(selectedMovementType) === 'todos'
      ? null
      : this.cashMovementTypesList.find((t) => normalizeStr(t.nombre) === normalizeStr(selectedMovementType));
    const movementTypeId = movementTypeObj ? movementTypeObj.id_tipo_movimiento_caja : null;

    const selectedSessionStatus = this.cashFilters.sessionStatus;
    let sessionStatusPayload: string | null = null;
    if (normalizeStr(selectedSessionStatus) === 'abierta') {
      sessionStatusPayload = 'Abierto';
    } else if (normalizeStr(selectedSessionStatus) === 'cerrada') {
      sessionStatusPayload = 'Cerrado';
    }

    const parseDateToYYYYMMDD = (dateStr: string): string => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };

    const payload = {
      fecha_inicial: parseDateToYYYYMMDD(this.cashFilters.startDate),
      fecha_final: parseDateToYYYYMMDD(this.cashFilters.endDate),
      id_sucursal: branchId ? Number(branchId) : null,
      id_caja: cashId ? Number(cashId) : null,
      id_tipo_movimiento_caja: movementTypeId ? Number(movementTypeId) : null,
      estado_sesion: sessionStatusPayload,
    };

    const formatCurrency = (v: number) => {
      try {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(v);
      } catch {
        return `Bs ${v.toFixed(2)}`;
      }
    };

    this.apiService.post<any, any>(`/api/reportes/${this.companyId}/cajasparametrizado`, payload).subscribe({
      next: (response) => {
        this.loadingCashReport = false;

        const totalSessionsObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('sesiones de caja')
        );
        const totalSessions = totalSessionsObj ? totalSessionsObj.valor : 0;

        const openSessionsObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('abiertas')
        );
        const openSessions = openSessionsObj ? openSessionsObj.valor : 0;

        const closedSessionsObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('cerradas')
        );
        const closedSessions = closedSessionsObj ? closedSessionsObj.valor : 0;

        const totalOpeningAmountObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('aperturas')
        );
        const totalOpeningAmount = totalOpeningAmountObj ? formatCurrency(totalOpeningAmountObj.valor) : formatCurrency(0);

        const expectedTotalAmountObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('esperado')
        );
        const expectedTotalAmount = expectedTotalAmountObj ? formatCurrency(expectedTotalAmountObj.valor) : formatCurrency(0);

        const declaredTotalAmountObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('declarado')
        );
        const declaredTotalAmount = declaredTotalAmountObj ? formatCurrency(declaredTotalAmountObj.valor) : formatCurrency(0);

        const totalDifferenceObj = response.resumen_gerencial?.find(
          (r: any) => r.indicador?.toLowerCase().includes('diferencia')
        );
        const totalDifference = totalDifferenceObj ? formatCurrency(totalDifferenceObj.valor) : formatCurrency(0);

        this.cashReport = {
          company: response.empresa || 'Supermercado La Estrella',
          generatedAt: response.fecha_generacion,
          filters: this.cashFilters,
          summary: {
            totalSessions,
            openSessions,
            closedSessions,
            totalOpeningAmount,
            expectedTotalAmount,
            declaredTotalAmount,
            totalDifference,
          },
          details: (response.detalle_analitico || []).map((item: any) => ({
            nro: item.numero_movimiento,
            datetime: item.fecha_hora,
            cash: item.caja,
            type: item.tipo,
            concept: item.concepto,
            amount: formatCurrency(Number(item.monto)),
          })),
        };
      },
      error: (err) => {
        this.loadingCashReport = false;
        console.error('Error generating cash report:', err);
      },
    });
  }

  private loadFilterOptions(): void {
    if (!this.companyId) {
      return;
    }

    this.companyService.getSucursales(this.companyId).subscribe({
      next: (branches) => {
        this.branchesList = branches;
        this.branchOptions = ['Todas', ...this.uniqueLabels(branches.map((branch) => branch.nombre))];
        this.loadCashOptions(branches);
      },
      error: () => {
        this.branchesList = [];
        this.branchOptions = ['Todas'];
        this.cashOptions = ['Todas'];
      },
    });

    this.productService.getTiposVenta().subscribe({
      next: (types) => {
        this.saleTypesList = types;
        this.saleTypeOptions = ['Todas', ...this.uniqueLabels(types.map((type) => type.nombre))];
      },
      error: () => {
        this.saleTypesList = [];
        this.saleTypeOptions = ['Todas'];
      },
    });

    this.productService.getMetodosPago().subscribe({
      next: (methods) => {
        this.paymentMethodsList = methods;
        this.paymentMethodOptions = ['Todos', ...this.uniqueLabels(methods.map((method) => method.nombre))];
      },
      error: () => {
        this.paymentMethodsList = [];
        this.paymentMethodOptions = ['Todos'];
      },
    });

    this.productService.getProductos(this.companyId).subscribe({
      next: (products) => {
        this.productsList = products;
        this.productOptions = ['Todos', ...this.uniqueLabels(products.map((product) => product.nombre))];
      },
      error: () => {
        this.productsList = [];
        this.productOptions = ['Todos'];
      },
    });

    this.companyService.getPersonalEmpresa(this.companyId).subscribe({
      next: (staff) => {
        this.staffList = staff;
        this.staffOptions = [
          'Todos',
          ...this.uniqueLabels(staff.map((member) => member.usuario.persona?.nombre_completo ?? member.usuario.email)),
        ];
      },
      error: () => {
        this.staffList = [];
        this.staffOptions = ['Todos'];
      },
    });

    this.productService.getTiposMovimiento().subscribe({
      next: (types) => {
        this.movementTypesList = types;
        this.inventoryMovementTypeOptions = ['Todos', ...this.uniqueLabels(types.map((type) => type.nombre))];
      },
      error: () => {
        this.movementTypesList = [];
        this.inventoryMovementTypeOptions = ['Todos'];
      },
    });

    this.productService.getCategorias(this.companyId).subscribe({
      next: (categories) => {
        this.categoriesList = categories;
        this.categoryOptions = ['Todas', ...this.uniqueLabels(categories.map((category) => category.nombre))];
      },
      error: () => {
        this.categoriesList = [];
        this.categoryOptions = ['Todas'];
      },
    });

    this.companyService.getTiposMovimientoCaja().subscribe({
      next: (types) => {
        this.cashMovementTypesList = types;
        this.cashMovementTypeOptions = ['Todos', ...this.uniqueLabels(types.map((type) => type.nombre))];
      },
      error: () => {
        this.cashMovementTypesList = [];
        this.cashMovementTypeOptions = ['Todos'];
      },
    });
  }

  private loadCashOptions(branches: Branch[]): void {
    const branchIds = branches
      .map((branch) => this.getBranchId(branch))
      .filter((id): id is string => id !== null);

    if (branchIds.length === 0) {
      this.cashOptions = ['Todas'];
      return;
    }

    forkJoin(branchIds.map((branchId) => this.cashRegisterService.getCajasSucursal(this.companyId, branchId))).subscribe({
      next: (responses) => {
        const cashRegisters = responses.flatMap((response) => this.normalizeCashRegisterListResponse(response));
        this.cashRegistersList = cashRegisters;
        this.cashOptions = ['Todas', ...this.uniqueLabels(cashRegisters.map((cashRegister) => cashRegister.nombre))];
      },
      error: () => {
        this.cashRegistersList = [];
        this.cashOptions = ['Todas'];
      },
    });
  }

  private normalizeCashRegisterListResponse(response: CashRegisterListResponse): CashRegisterResponse[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.cajas)) {
      return response.cajas;
    }

    if (Array.isArray(response.items)) {
      return response.items;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data && Array.isArray(response.data.cajas)) {
      return response.data.cajas;
    }

    if (response.data && Array.isArray(response.data.items)) {
      return response.data.items;
    }

    return [];
  }

  private getBranchId(branch: Branch): string | null {
    const rawId = branch.id_sucursal ?? branch.idSucursal ?? branch.id;
    const parsedId = typeof rawId === 'number' ? rawId : Number(rawId);

    return Number.isFinite(parsedId) ? String(parsedId) : null;
  }

  private uniqueLabels(labels: Array<string | null | undefined>): string[] {
    return Array.from(new Set(labels.map((label) => label?.trim()).filter((label): label is string => Boolean(label))));
  }
}


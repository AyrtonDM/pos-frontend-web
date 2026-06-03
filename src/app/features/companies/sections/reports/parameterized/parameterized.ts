import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../shared/components/sidebar/sidebar';
import { Branch, CompanyService } from '../../../../../core/services/company.service';
import { ProductService } from '../../../../../core/services/product.service';
import {
  CashRegisterListResponse,
  CashRegisterResponse,
  CashRegisterService,
} from '../../../../../core/services/cash-register.service';

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

  protected inventoryFilters = {
    startDate: '01/05/2026',
    endDate: '31/05/2026',
    branch: 'Todas',
    movementType: 'Todos',
    product: 'Todos',
    category: 'Todas',
  };

  protected inventoryReport: null | any = null;

  protected cashFilters = {
    startDate: '01/05/2026',
    endDate: '31/05/2026',
    branch: 'Todas',
    cash: 'Todas',
    movementType: 'Todos',
    sessionStatus: 'Todas',
  };

  protected cashReport: null | any = null;

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
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDateTime = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const formatCurrency = (v: number) => {
      try {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(v);
      } catch {
        return `Bs ${v.toFixed(2)}`;
      }
    };

    this.salesReport = {
      company: 'Supermercado La Estrella',
      generatedAt: formatDateTime(now),
      filters: this.saleFilters,
      summary: {
        totalSales: 684,
        totalAmount: formatCurrency(185430.5),
        totalProducts: 2745,
      },
      details: [
        { nro: 'V-000684', datetime: '31/05/2026 19:42', staff: 'María Pérez', type: 'Contado', method: 'Efectivo', products: 4, total: formatCurrency(185.5) },
        { nro: 'V-000683', datetime: '31/05/2026 19:38', staff: 'Carlos Rojas', type: 'Crédito', method: 'QR', products: 7, total: formatCurrency(420.0) },
        { nro: 'V-000682', datetime: '31/05/2026 19:30', staff: 'María Pérez', type: 'Contado', method: 'QR', products: 2, total: formatCurrency(64.0) },
        { nro: 'V-000681', datetime: '31/05/2026 19:21', staff: 'Laura Gómez', type: 'Contado', method: 'QR', products: 12, total: formatCurrency(865.8) },
        { nro: 'V-000680', datetime: '31/05/2026 19:10', staff: 'Carlos Rojas', type: 'Contado', method: 'Tarjeta', products: 5, total: formatCurrency(230.0) },
      ],
    };
  }

  protected generateInventoryReport(): void {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDateTime = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;

    this.inventoryReport = {
      company: 'Supermercado La Estrella',
      generatedAt: formatDateTime(now),
      filters: this.inventoryFilters,
      summary: {
        totalMovements: 472,
        availableStock: 348,
        lowStock: 24,
        outOfStock: 13,
      },
      details: [
        { nro: 'M-000472', datetime: '31/05/2026 18:35', product: 'Coca-Cola 2 L', category: 'Bebidas', type: 'Salida', quantity: 10 },
        { nro: 'M-000471', datetime: '31/05/2026 17:50', product: 'Aceite Fino 900 ml', category: 'Abarrotes', type: 'Entrada', quantity: 40 },
        { nro: 'M-000470', datetime: '31/05/2026 16:20', product: 'Leche Pil 1 L', category: 'Lácteos', type: 'Salida', quantity: 15 },
        { nro: 'M-000469', datetime: '31/05/2026 15:45', product: 'Detergente Omo 3 kg', category: 'Limpieza', type: 'Ajuste', quantity: -2 },
        { nro: 'M-000468', datetime: '31/05/2026 14:10', product: 'Arroz Grano de Oro 1 kg', category: 'Abarrotes', type: 'Salida', quantity: 8 },
      ],
    };
  }

  protected generateCashReport(): void {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDateTime = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const formatCurrency = (v: number) => {
      try {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(v);
      } catch {
        return `Bs ${v.toFixed(2)}`;
      }
    };

    this.cashReport = {
      company: 'Supermercado La Estrella',
      generatedAt: formatDateTime(now),
      filters: this.cashFilters,
      summary: {
        totalSessions: 96,
        openSessions: 3,
        closedSessions: 93,
        totalOpeningAmount: formatCurrency(28800),
        expectedTotalAmount: formatCurrency(218060.5),
        declaredTotalAmount: formatCurrency(217940.5),
        totalDifference: formatCurrency(-120),
      },
      details: [
        { nro: 'MC-000785', datetime: '31/05/2026 19:45', cash: 'Caja 02', type: 'Ingreso', concept: 'Venta V-000684', amount: formatCurrency(185.5) },
        { nro: 'MC-000784', datetime: '31/05/2026 19:38', cash: 'Caja 01', type: 'Ingreso', concept: 'Pago de crédito', amount: formatCurrency(420) },
        { nro: 'MC-000783', datetime: '31/05/2026 18:50', cash: 'Caja 02', type: 'Egreso', concept: 'Compra de bolsas', amount: formatCurrency(80) },
        { nro: 'MC-000782', datetime: '31/05/2026 17:30', cash: 'Caja 03', type: 'Ajuste', concept: 'Corrección de monto', amount: formatCurrency(-20) },
        { nro: 'MC-000781', datetime: '31/05/2026 08:00', cash: 'Caja 01', type: 'Apertura', concept: 'Fondo inicial', amount: formatCurrency(300) },
      ],
    };
  }

  private loadFilterOptions(): void {
    if (!this.companyId) {
      return;
    }

    this.companyService.getSucursales(this.companyId).subscribe({
      next: (branches) => {
        this.branchOptions = ['Todas', ...this.uniqueLabels(branches.map((branch) => branch.nombre))];
        this.loadCashOptions(branches);
      },
      error: () => {
        this.branchOptions = ['Todas'];
        this.cashOptions = ['Todas'];
      },
    });

    this.productService.getTiposVenta().subscribe({
      next: (types) => {
        this.saleTypeOptions = ['Todas', ...this.uniqueLabels(types.map((type) => type.nombre))];
      },
      error: () => {
        this.saleTypeOptions = ['Todas'];
      },
    });

    this.productService.getMetodosPago().subscribe({
      next: (methods) => {
        this.paymentMethodOptions = ['Todos', ...this.uniqueLabels(methods.map((method) => method.nombre))];
      },
      error: () => {
        this.paymentMethodOptions = ['Todos'];
      },
    });

    this.productService.getProductos(this.companyId).subscribe({
      next: (products) => {
        this.productOptions = ['Todos', ...this.uniqueLabels(products.map((product) => product.nombre))];
      },
      error: () => {
        this.productOptions = ['Todos'];
      },
    });

    this.companyService.getPersonalEmpresa(this.companyId).subscribe({
      next: (staff) => {
        this.staffOptions = [
          'Todos',
          ...this.uniqueLabels(staff.map((member) => member.usuario.persona?.nombre_completo ?? member.usuario.email)),
        ];
      },
      error: () => {
        this.staffOptions = ['Todos'];
      },
    });

    this.productService.getTiposMovimiento().subscribe({
      next: (types) => {
        this.inventoryMovementTypeOptions = ['Todos', ...this.uniqueLabels(types.map((type) => type.nombre))];
      },
      error: () => {
        this.inventoryMovementTypeOptions = ['Todos'];
      },
    });

    this.productService.getCategorias(this.companyId).subscribe({
      next: (categories) => {
        this.categoryOptions = ['Todas', ...this.uniqueLabels(categories.map((category) => category.nombre))];
      },
      error: () => {
        this.categoryOptions = ['Todas'];
      },
    });

    this.companyService.getTiposMovimientoCaja().subscribe({
      next: (types) => {
        this.cashMovementTypeOptions = ['Todos', ...this.uniqueLabels(types.map((type) => type.nombre))];
      },
      error: () => {
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
        this.cashOptions = ['Todas', ...this.uniqueLabels(cashRegisters.map((cashRegister) => cashRegister.nombre))];
      },
      error: () => {
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


import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  CompanyPermissionCode,
  CompanyPermissionsService,
} from '../../../../../core/services/company-permissions.service';
import { ApiService } from '../../../../../core/services/api.service';
import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../shared/components/sidebar/sidebar';

type StaticReportTab = 'sales' | 'inventory' | 'cash-registers';

interface SalesSummaryBranch {
  id_sucursal: number;
  sucursal: string;
  ventas_dia: {
    total_ventas: number;
    monto_vendido: number;
    ticket_promedio: number;
    productos_vendidos: number;
  };
  top_productos: Array<{
    posicion: number;
    id_producto: number;
    producto: string;
    unidades: number;
  }>;
}

interface SalesSummaryReportResponse {
  id_empresa: number;
  fecha: string;
  sucursales: SalesSummaryBranch[];
  total_empresa: {
    total_ventas: number;
    monto_vendido: number;
    ticket_promedio: number;
    productos_vendidos: number;
  };
}

interface SalesSummaryReportView {
  date: string;
  branches: Array<{
    name: string;
    totalSales: number;
    amount: string;
    averageTicket: string;
    productsSold: number;
    topProducts: Array<{
      rank: number;
      name: string;
      quantity: number;
    }>;
  }>;
  companyTotal: {
    totalSales: number;
    amount: string;
    averageTicket: string;
    productsSold: number;
  };
}

interface SalesDetailsBranch {
  id_sucursal: number;
  sucursal: string;
  ventas: Array<{
    id_venta: number;
    numero_venta: string;
    hora: string;
    cliente: string;
    subtotal: number;
    descuento: number;
    total: number;
  }>;
  resumen_sucursal: {
    total_registros: number;
    total_vendido: number;
  };
}

interface SalesDetailsReportResponse {
  id_empresa: number;
  fecha: string;
  sucursales: SalesDetailsBranch[];
  total_empresa: {
    total_registros: number;
    total_vendido: number;
  };
}

interface SalesDetailsReportView {
  date: string;
  branches: Array<{
    name: string;
    sales: Array<{
      id: string;
      time: string;
      client: string;
      subtotal: string;
      discount: string;
      total: string;
    }>;
    summary: {
      records: number;
      total: string;
    };
  }>;
  companyTotal: {
    records: number;
    total: string;
  };
}

interface InventoryStatusBranch {
  id_sucursal: number;
  sucursal: string;
  productos: Array<{
    id_producto: number;
    producto: string;
    stock_actual: number;
    stock_minimo: number;
    stock_maximo: number | null;
    estado: string;
  }>;
  resumen_sucursal: {
    total_productos: number;
    productos_bajo_stock: number;
    productos_sobre_stock: number;
    productos_agotados: number;
  };
}

interface InventoryStatusReportResponse {
  id_empresa: number;
  fecha: string;
  sucursales: InventoryStatusBranch[];
  total_empresa: {
    total_productos: number;
    productos_bajo_stock: number;
    productos_sobre_stock: number;
    productos_agotados: number;
  };
}

interface InventoryStatusReportView {
  date: string;
  branches: Array<{
    name: string;
    items: Array<{
      product: string;
      actual: number;
      minimum: number;
      maximum: number | string;
      status: string;
    }>;
    summary: {
      totalProducts: number;
      lowStock: number;
      overStock: number;
      outOfStock: number;
    };
  }>;
  companyTotal: {
    totalProducts: number;
    lowStock: number;
    overStock: number;
    outOfStock: number;
  };
}

interface InventoryMovementsBranch {
  id_sucursal: number;
  sucursal: string;
  movimientos: Array<{
    id_movimiento_inventario: number;
    fecha: string;
    tipo_movimiento: string;
    direccion: string;
    producto: string;
    cantidad: number;
  }>;
  resumen_sucursal: {
    total_entradas: number;
    total_salidas: number;
  };
}

interface InventoryMovementsReportResponse {
  id_empresa: number;
  fecha_inicio: string;
  fecha_fin: string;
  sucursales: InventoryMovementsBranch[];
  total_empresa: {
    total_entradas: number;
    total_salidas: number;
  };
}

interface InventoryMovementsReportView {
  period: string;
  branches: Array<{
    name: string;
    movements: Array<{
      date: string;
      type: string;
      product: string;
      quantity: number;
    }>;
    summary: {
      entries: number;
      exits: number;
    };
  }>;
  companyTotal: {
    entries: number;
    exits: number;
  };
}

interface CashSummaryBranch {
  id_sucursal: number;
  sucursal: string;
  cajas: Array<{
    id_caja: number;
    id_caja_sesion: number;
    caja: string;
    estado: string;
    apertura: string;
    cierre: string | null;
  }>;
  resumen_sucursal: {
    total_cajas: number;
    cajas_abiertas: number;
    cajas_cerradas: number;
    ingresos: number;
    egresos: number;
    flujo_neto: number;
  };
}

interface CashSummaryReportResponse {
  id_empresa: number;
  fecha: string;
  sucursales: CashSummaryBranch[];
  total_empresa: {
    total_cajas: number;
    cajas_abiertas: number;
    cajas_cerradas: number;
    ingresos: number;
    egresos: number;
    flujo_neto: number;
  };
}

interface CashSummaryReportView {
  date: string;
  branches: Array<{
    name: string;
    boxes: Array<{
      name: string;
      state: string;
      opening: string;
      closing: string;
    }>;
    summary: {
      totalBoxes: number;
      openBoxes: number;
      closedBoxes: number;
      income: string;
      expenses: string;
      netFlow: string;
    };
  }>;
  companyTotal: {
    totalBoxes: number;
    openBoxes: number;
    closedBoxes: number;
    income: string;
    expenses: string;
    netFlow: string;
  };
}

interface CashMovementsBranch {
  id_sucursal: number;
  sucursal: string;
  movimientos: Array<{
    id_movimiento_caja: number;
    hora: string;
    caja: string;
    tipo: string;
    concepto: string;
    monto: number;
  }>;
  resumen_sucursal: {
    total_movimientos: number;
    total_ingresos: number;
    total_egresos: number;
  };
}

interface CashMovementsReportResponse {
  id_empresa: number;
  fecha: string;
  sucursales: CashMovementsBranch[];
  total_empresa: {
    total_movimientos: number;
    total_ingresos: number;
    total_egresos: number;
  };
}

interface CashMovementsReportView {
  date: string;
  branches: Array<{
    name: string;
    movements: Array<{
      time: string;
      box: string;
      type: string;
      concept: string;
      amount: string;
    }>;
    summary: {
      totalMovements: number;
      totalIncome: string;
      totalExpenses: string;
    };
  }>;
  companyTotal: {
    totalMovements: number;
    totalIncome: string;
    totalExpenses: string;
  };
}

@Component({
  selector: 'app-static-reports',
  imports: [CommonModule, Navbar, Sidebar],
  templateUrl: './static.html',
  styleUrl: './static.css',
})
export class StaticReports {
  private readonly route = inject(ActivatedRoute);
  private readonly companyPermissionsService = inject(CompanyPermissionsService);
  private readonly apiService = inject(ApiService);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected activeTab: StaticReportTab = 'sales';
  protected salesReportType: 'none' | 'summary' | 'details' = 'none';
  protected inventoryReportType: 'none' | 'status' | 'movements' = 'none';
  protected cashReportType: 'none' | 'summary' | 'movements' = 'none';
  protected salesSummaryReport: SalesSummaryReportView = this.createEmptySalesSummaryReport();
  protected loadingSalesSummary = false;
  protected salesSummaryError = '';
  protected salesDetailsReport: SalesDetailsReportView = this.createEmptySalesDetailsReport();
  protected loadingSalesDetails = false;
  protected salesDetailsError = '';
  protected inventoryStatusReport: InventoryStatusReportView = this.createEmptyInventoryStatusReport();
  protected loadingInventoryStatus = false;
  protected inventoryStatusError = '';
  protected inventoryMovementsReport: InventoryMovementsReportView = this.createEmptyInventoryMovementsReport();
  protected loadingInventoryMovements = false;
  protected inventoryMovementsError = '';
  protected cashSummaryReport: CashSummaryReportView = this.createEmptyCashSummaryReport();
  protected loadingCashSummary = false;
  protected cashSummaryError = '';
  protected cashMovementsReport: CashMovementsReportView = this.createEmptyCashMovementsReport();
  protected loadingCashMovements = false;
  protected cashMovementsError = '';

  protected readonly salesSummaryReportMock = {
    date: '30/05/2026',
    branches: [
      {
        name: 'Central',
        totalSales: 45,
        amount: 'Bs 12.850',
        averageTicket: 'Bs 285,56',
        productsSold: 120,
        topProducts: [
          { rank: 1, name: 'Coca Cola 2L', quantity: 25 },
          { rank: 2, name: 'Arroz 5kg', quantity: 18 },
          { rank: 3, name: 'Aceite 1L', quantity: 15 },
        ],
      },
      {
        name: 'Norte',
        totalSales: 32,
        amount: 'Bs 8.450',
        averageTicket: 'Bs 264,06',
        productsSold: 87,
        topProducts: [
          { rank: 1, name: 'Coca Cola 2L', quantity: 19 },
          { rank: 2, name: 'Aceite 1L', quantity: 14 },
          { rank: 3, name: 'Azúcar 5kg', quantity: 11 },
        ],
      },
    ],
    companyTotal: {
      totalSales: 77,
      amount: 'Bs 21.300',
      productsSold: 207,
    },
  };

  protected readonly salesDetailsReportMock = {
    date: '30/05/2026',
    branches: [
      {
        name: 'Central',
        sales: [
          { id: '001', time: '08:12', client: 'Juan Pérez', subtotal: 'Bs 150', discount: 'Bs 0', total: 'Bs 150' },
          { id: '002', time: '09:45', client: 'María López', subtotal: 'Bs 300', discount: 'Bs 15', total: 'Bs 285' },
          { id: '003', time: '11:20', client: 'Carlos Gómez', subtotal: 'Bs 420', discount: 'Bs 20', total: 'Bs 400' },
        ],
        summary: {
          records: 45,
          total: 'Bs 12.850',
        },
      },
      {
        name: 'Norte',
        sales: [
          { id: 'A01', time: '08:30', client: 'Ana Ruiz', subtotal: 'Bs 120', discount: 'Bs 0', total: 'Bs 120' },
          { id: 'A02', time: '10:05', client: 'Luis Castillo', subtotal: 'Bs 250', discount: 'Bs 10', total: 'Bs 240' },
          { id: 'A03', time: '14:10', client: 'Patricia Díaz', subtotal: 'Bs 380', discount: 'Bs 30', total: 'Bs 350' },
        ],
        summary: {
          records: 32,
          total: 'Bs 8.450',
        },
      },
    ],
  };

  protected readonly inventoryStatusReportMock = {
    date: '30/05/2026',
    branches: [
      {
        name: 'Central',
        items: [
          { product: 'Coca Cola 2L', actual: 25, minimum: 10, maximum: 20, status: 'Sobre stock' },
          { product: 'Arroz 5kg', actual: 8, minimum: 10, maximum: '-', status: 'Bajo stock' },
          { product: 'Aceite 1L', actual: 0, minimum: 5, maximum: 10, status: 'Agotado' },
          { product: 'Azúcar 5kg', actual: 15, minimum: 8, maximum: 25, status: 'Normal' },
        ],
        summary: {
          totalProducts: 120,
          lowStock: 8,
          overStock: 5,
          outOfStock: 3,
        },
      },
      {
        name: 'Norte',
        items: [
          { product: 'Coca Cola 2L', actual: 25, minimum: 10, maximum: 20, status: 'Sobre stock' },
          { product: 'Arroz 5kg', actual: 8, minimum: 10, maximum: '-', status: 'Bajo stock' },
          { product: 'Aceite 1L', actual: 0, minimum: 5, maximum: 10, status: 'Agotado' },
          { product: 'Azúcar 5kg', actual: 15, minimum: 8, maximum: 25, status: 'Normal' },
        ],
        summary: {
          totalProducts: 95,
          lowStock: 6,
          overStock: 5,
          outOfStock: 1,
        },
      },
    ],
    companyTotal: {
      totalProducts: 215,
      lowStock: 14,
      overStock: 10,
      outOfStock: 4,
    },
  };

  protected readonly inventoryMovementsReportMock = {
    period: '26/05/2026 - 01/06/2026',
    branches: [
      {
        name: 'Central',
        movements: [
          { date: '30/05/2026', type: 'Entrada manual', product: 'Arroz 5kg', quantity: 20 },
          { date: '30/05/2026', type: 'Salida', product: 'Coca Cola 2L', quantity: 10 },
          { date: '29/05/2026', type: 'Ajuste positivo', product: 'Aceite 1L', quantity: 2 },
        ],
        summary: {
          entries: 25,
          exits: 12,
        },
      },
      {
        name: 'Norte',
        movements: [
          { date: '30/05/2026', type: 'Entrada', product: 'Azúcar 5kg', quantity: 15 },
          { date: '29/05/2026', type: 'Salida', product: 'Arroz 5kg', quantity: 8 },
          { date: '28/05/2026', type: 'Ajuste', product: 'Coca Cola 2L', quantity: 1 },
        ],
        summary: {
          entries: 18,
          exits: 10,
        },
      },
    ],
  };

  protected readonly cashSummaryReportMock = {
    date: '30/05/2026',
    branches: [
      {
        name: 'Central',
        boxes: [
          { name: 'Caja Principal', state: 'Cerrada', opening: '08:00', closing: '18:00' },
          { name: 'Caja Secundaria', state: 'Abierta', opening: '09:00', closing: '--' },
        ],
        summary: {
          totalBoxes: 2,
          openBoxes: 1,
          closedBoxes: 1,
          income: 'Bs 15.200',
          expenses: 'Bs 1.250',
          netFlow: 'Bs 13.950',
        },
      },
      {
        name: 'Norte',
        boxes: [
          { name: 'Caja Principal', state: 'Cerrada', opening: '08:30', closing: '17:30' },
        ],
        summary: {
          totalBoxes: 1,
          openBoxes: 0,
          closedBoxes: 1,
          income: 'Bs 8.400',
          expenses: 'Bs 600',
          netFlow: 'Bs 7.800',
        },
      },
    ],
    companyTotal: {
      totalBoxes: 3,
      openBoxes: 1,
      closedBoxes: 2,
      income: 'Bs 23.600',
      expenses: 'Bs 1.850',
      netFlow: 'Bs 21.750',
    },
  };

  protected readonly cashMovementsReportMock = {
    date: '30/05/2026',
    branches: [
      {
        name: 'Central',
        movements: [
          { time: '08:00', box: 'Caja Principal', type: 'Apertura', concept: 'Fondo inicial', amount: 'Bs 500' },
          { time: '10:30', box: 'Caja Principal', type: 'Ingreso', concept: 'Venta contado', amount: 'Bs 350' },
          { time: '12:15', box: 'Caja Principal', type: 'Egreso', concept: 'Compra insumos', amount: 'Bs 120' },
          { time: '18:00', box: 'Caja Principal', type: 'Cierre', concept: 'Cierre de caja', amount: 'Bs 0' },
        ],
        summary: {
          totalMovements: 25,
          totalIncome: 'Bs 15.200',
          totalExpenses: 'Bs 1.250',
        },
      },
      {
        name: 'Norte',
        movements: [
          { time: '08:30', box: 'Caja Principal', type: 'Apertura', concept: 'Fondo inicial', amount: 'Bs 500' },
          { time: '11:00', box: 'Caja Principal', type: 'Ingreso', concept: 'Venta contado', amount: 'Bs 420' },
          { time: '14:00', box: 'Caja Principal', type: 'Egreso', concept: 'Transporte', amount: 'Bs 80' },
        ],
        summary: {
          totalMovements: 14,
          totalIncome: 'Bs 8.400',
          totalExpenses: 'Bs 600',
        },
      },
    ],
  };

  protected showSalesReport(type: 'summary' | 'details'): void {
    if (!this.hasPermission('REPORTE_GENERAR')) {
      return;
    }

    this.salesReportType = type;

    if (type === 'summary') {
      this.loadSalesSummaryReport();
    } else {
      this.loadSalesDetailsReport();
    }
  }

  protected showInventoryReport(type: 'status' | 'movements'): void {
    if (!this.hasPermission('REPORTE_GENERAR')) {
      return;
    }

    this.inventoryReportType = type;

    if (type === 'status') {
      this.loadInventoryStatusReport();
    } else {
      this.loadInventoryMovementsReport();
    }
  }

  protected showCashReport(type: 'summary' | 'movements'): void {
    if (!this.hasPermission('REPORTE_GENERAR')) {
      return;
    }

    this.cashReportType = type;

    if (type === 'summary') {
      this.loadCashSummaryReport();
    } else {
      this.loadCashMovementsReport();
    }
  }

  protected setActiveTab(tab: StaticReportTab): void {
    this.activeTab = tab;
  }

  protected hasPermission(permission: CompanyPermissionCode): boolean {
    return this.companyPermissionsService.permissions()[permission] === true;
  }

  protected hasSalesSummaryData(): boolean {
    const report = this.salesSummaryReport;

    return (
      report.branches.length > 0 ||
      report.companyTotal.totalSales > 0 ||
      report.companyTotal.productsSold > 0
    );
  }

  protected hasSalesDetailsData(): boolean {
    const report = this.salesDetailsReport;

    return (
      report.branches.some((branch) => branch.sales.length > 0) ||
      report.companyTotal.records > 0
    );
  }

  protected hasInventoryStatusData(): boolean {
    const report = this.inventoryStatusReport;

    return (
      report.branches.some((branch) => branch.items.length > 0) ||
      report.companyTotal.totalProducts > 0
    );
  }

  protected hasInventoryMovementsData(): boolean {
    const report = this.inventoryMovementsReport;

    return (
      report.branches.some((branch) => branch.movements.length > 0) ||
      report.companyTotal.entries > 0 ||
      report.companyTotal.exits > 0
    );
  }

  protected hasCashSummaryData(): boolean {
    const report = this.cashSummaryReport;

    return (
      report.branches.some((branch) => branch.boxes.length > 0) ||
      report.companyTotal.totalBoxes > 0 ||
      report.companyTotal.openBoxes > 0 ||
      report.companyTotal.closedBoxes > 0
    );
  }

  protected hasCashMovementsData(): boolean {
    const report = this.cashMovementsReport;

    return (
      report.branches.some((branch) => branch.movements.length > 0) ||
      report.companyTotal.totalMovements > 0
    );
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(value ?? 0);
  }

  protected formatReportDate(value: string): string {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private loadSalesSummaryReport(): void {
    if (!this.companyId || this.loadingSalesSummary) {
      return;
    }

    this.loadingSalesSummary = true;
    this.salesSummaryError = '';
    this.salesSummaryReport = this.createEmptySalesSummaryReport();

    this.apiService
      .get<SalesSummaryReportResponse>(`/api/reportes/${this.companyId}/resumenventas`)
      .subscribe({
        next: (report) => {
          this.salesSummaryReport = this.mapSalesSummaryReport(report);
          this.loadingSalesSummary = false;
        },
        error: () => {
          this.salesSummaryReport = this.createEmptySalesSummaryReport();
          this.salesSummaryError = 'No se pudo generar el resumen de ventas. Intenta nuevamente.';
          this.loadingSalesSummary = false;
        },
      });
  }

  private loadSalesDetailsReport(): void {
    if (!this.companyId || this.loadingSalesDetails) {
      return;
    }

    this.loadingSalesDetails = true;
    this.salesDetailsError = '';
    this.salesDetailsReport = this.createEmptySalesDetailsReport();

    this.apiService
      .get<SalesDetailsReportResponse>(`/api/reportes/${this.companyId}/detallesventas`)
      .subscribe({
        next: (report) => {
          this.salesDetailsReport = this.mapSalesDetailsReport(report);
          this.loadingSalesDetails = false;
        },
        error: () => {
          this.salesDetailsReport = this.createEmptySalesDetailsReport();
          this.salesDetailsError = 'No se pudo generar el detalle de ventas. Intenta nuevamente.';
          this.loadingSalesDetails = false;
        },
      });
  }

  private loadInventoryStatusReport(): void {
    if (!this.companyId || this.loadingInventoryStatus) {
      return;
    }

    this.loadingInventoryStatus = true;
    this.inventoryStatusError = '';
    this.inventoryStatusReport = this.createEmptyInventoryStatusReport();

    this.apiService
      .get<InventoryStatusReportResponse>(`/api/reportes/${this.companyId}/estadoinventario`)
      .subscribe({
        next: (report) => {
          this.inventoryStatusReport = this.mapInventoryStatusReport(report);
          this.loadingInventoryStatus = false;
        },
        error: () => {
          this.inventoryStatusReport = this.createEmptyInventoryStatusReport();
          this.inventoryStatusError = 'No se pudo generar el estado de inventario. Intenta nuevamente.';
          this.loadingInventoryStatus = false;
        },
      });
  }

  private loadInventoryMovementsReport(): void {
    if (!this.companyId || this.loadingInventoryMovements) {
      return;
    }

    this.loadingInventoryMovements = true;
    this.inventoryMovementsError = '';
    this.inventoryMovementsReport = this.createEmptyInventoryMovementsReport();

    this.apiService
      .get<InventoryMovementsReportResponse>(`/api/reportes/${this.companyId}/movimientosinventario`)
      .subscribe({
        next: (report) => {
          this.inventoryMovementsReport = this.mapInventoryMovementsReport(report);
          this.loadingInventoryMovements = false;
        },
        error: () => {
          this.inventoryMovementsReport = this.createEmptyInventoryMovementsReport();
          this.inventoryMovementsError = 'No se pudieron generar los movimientos de inventario. Intenta nuevamente.';
          this.loadingInventoryMovements = false;
        },
      });
  }

  private loadCashSummaryReport(): void {
    if (!this.companyId || this.loadingCashSummary) {
      return;
    }

    this.loadingCashSummary = true;
    this.cashSummaryError = '';
    this.cashSummaryReport = this.createEmptyCashSummaryReport();

    this.apiService
      .get<CashSummaryReportResponse>(`/api/reportes/${this.companyId}/resumencajas`)
      .subscribe({
        next: (report) => {
          this.cashSummaryReport = this.mapCashSummaryReport(report);
          this.loadingCashSummary = false;
        },
        error: () => {
          this.cashSummaryReport = this.createEmptyCashSummaryReport();
          this.cashSummaryError = 'No se pudo generar el resumen de cajas. Intenta nuevamente.';
          this.loadingCashSummary = false;
        },
      });
  }

  private loadCashMovementsReport(): void {
    if (!this.companyId || this.loadingCashMovements) {
      return;
    }

    this.loadingCashMovements = true;
    this.cashMovementsError = '';
    this.cashMovementsReport = this.createEmptyCashMovementsReport();

    this.apiService
      .get<CashMovementsReportResponse>(`/api/reportes/${this.companyId}/movimientoscaja`)
      .subscribe({
        next: (report) => {
          this.cashMovementsReport = this.mapCashMovementsReport(report);
          this.loadingCashMovements = false;
        },
        error: () => {
          this.cashMovementsReport = this.createEmptyCashMovementsReport();
          this.cashMovementsError = 'No se pudieron generar los movimientos de caja. Intenta nuevamente.';
          this.loadingCashMovements = false;
        },
      });
  }

  private mapSalesSummaryReport(report: SalesSummaryReportResponse): SalesSummaryReportView {
    const totalEmpresa = report.total_empresa ?? {
      total_ventas: 0,
      monto_vendido: 0,
      ticket_promedio: 0,
      productos_vendidos: 0,
    };

    return {
      date: this.formatReportDate(report.fecha),
      branches: (report.sucursales ?? []).map((branch) => ({
        name: branch.sucursal,
        totalSales: branch.ventas_dia?.total_ventas ?? 0,
        amount: this.formatCurrency(branch.ventas_dia?.monto_vendido ?? 0),
        averageTicket: this.formatCurrency(branch.ventas_dia?.ticket_promedio ?? 0),
        productsSold: branch.ventas_dia?.productos_vendidos ?? 0,
        topProducts: (branch.top_productos ?? []).map((product) => ({
          rank: product.posicion,
          name: product.producto,
          quantity: product.unidades,
        })),
      })),
      companyTotal: {
        totalSales: totalEmpresa.total_ventas,
        amount: this.formatCurrency(totalEmpresa.monto_vendido),
        averageTicket: this.formatCurrency(totalEmpresa.ticket_promedio),
        productsSold: totalEmpresa.productos_vendidos,
      },
    };
  }

  private createEmptySalesSummaryReport(): SalesSummaryReportView {
    return {
      date: '',
      branches: [],
      companyTotal: {
        totalSales: 0,
        amount: this.formatCurrency(0),
        averageTicket: this.formatCurrency(0),
        productsSold: 0,
      },
    };
  }

  private mapSalesDetailsReport(report: SalesDetailsReportResponse): SalesDetailsReportView {
    const totalEmpresa = report.total_empresa ?? {
      total_registros: 0,
      total_vendido: 0,
    };

    return {
      date: this.formatReportDate(report.fecha),
      branches: (report.sucursales ?? []).map((branch) => ({
        name: branch.sucursal,
        sales: (branch.ventas ?? []).map((sale) => ({
          id: sale.numero_venta,
          time: sale.hora,
          client: sale.cliente,
          subtotal: this.formatCurrency(sale.subtotal),
          discount: this.formatCurrency(sale.descuento),
          total: this.formatCurrency(sale.total),
        })),
        summary: {
          records: branch.resumen_sucursal?.total_registros ?? 0,
          total: this.formatCurrency(branch.resumen_sucursal?.total_vendido ?? 0),
        },
      })),
      companyTotal: {
        records: totalEmpresa.total_registros,
        total: this.formatCurrency(totalEmpresa.total_vendido),
      },
    };
  }

  private createEmptySalesDetailsReport(): SalesDetailsReportView {
    return {
      date: '',
      branches: [],
      companyTotal: {
        records: 0,
        total: this.formatCurrency(0),
      },
    };
  }

  private mapInventoryStatusReport(report: InventoryStatusReportResponse): InventoryStatusReportView {
    const totalEmpresa = report.total_empresa ?? {
      total_productos: 0,
      productos_bajo_stock: 0,
      productos_sobre_stock: 0,
      productos_agotados: 0,
    };

    return {
      date: this.formatReportDate(report.fecha),
      branches: (report.sucursales ?? []).map((branch) => ({
        name: branch.sucursal,
        items: (branch.productos ?? []).map((product) => ({
          product: product.producto,
          actual: product.stock_actual,
          minimum: product.stock_minimo,
          maximum: product.stock_maximo ?? '-',
          status: product.estado,
        })),
        summary: {
          totalProducts: branch.resumen_sucursal?.total_productos ?? 0,
          lowStock: branch.resumen_sucursal?.productos_bajo_stock ?? 0,
          overStock: branch.resumen_sucursal?.productos_sobre_stock ?? 0,
          outOfStock: branch.resumen_sucursal?.productos_agotados ?? 0,
        },
      })),
      companyTotal: {
        totalProducts: totalEmpresa.total_productos,
        lowStock: totalEmpresa.productos_bajo_stock,
        overStock: totalEmpresa.productos_sobre_stock,
        outOfStock: totalEmpresa.productos_agotados,
      },
    };
  }

  private createEmptyInventoryStatusReport(): InventoryStatusReportView {
    return {
      date: '',
      branches: [],
      companyTotal: {
        totalProducts: 0,
        lowStock: 0,
        overStock: 0,
        outOfStock: 0,
      },
    };
  }

  private mapInventoryMovementsReport(report: InventoryMovementsReportResponse): InventoryMovementsReportView {
    const totalEmpresa = report.total_empresa ?? {
      total_entradas: 0,
      total_salidas: 0,
    };

    return {
      period: `${this.formatReportDate(report.fecha_inicio)} - ${this.formatReportDate(report.fecha_fin)}`,
      branches: (report.sucursales ?? []).map((branch) => ({
        name: branch.sucursal,
        movements: (branch.movimientos ?? []).map((movement) => ({
          date: this.formatReportDate(movement.fecha),
          type: movement.tipo_movimiento,
          product: movement.producto,
          quantity: movement.cantidad,
        })),
        summary: {
          entries: branch.resumen_sucursal?.total_entradas ?? 0,
          exits: branch.resumen_sucursal?.total_salidas ?? 0,
        },
      })),
      companyTotal: {
        entries: totalEmpresa.total_entradas,
        exits: totalEmpresa.total_salidas,
      },
    };
  }

  private createEmptyInventoryMovementsReport(): InventoryMovementsReportView {
    return {
      period: '',
      branches: [],
      companyTotal: {
        entries: 0,
        exits: 0,
      },
    };
  }

  private mapCashSummaryReport(report: CashSummaryReportResponse): CashSummaryReportView {
    const totalEmpresa = report.total_empresa ?? {
      total_cajas: 0,
      cajas_abiertas: 0,
      cajas_cerradas: 0,
      ingresos: 0,
      egresos: 0,
      flujo_neto: 0,
    };

    return {
      date: this.formatReportDate(report.fecha),
      branches: (report.sucursales ?? []).map((branch) => ({
        name: branch.sucursal,
        boxes: (branch.cajas ?? []).map((box) => ({
          name: box.caja,
          state: box.estado,
          opening: box.apertura,
          closing: box.cierre ?? '--',
        })),
        summary: {
          totalBoxes: branch.resumen_sucursal?.total_cajas ?? 0,
          openBoxes: branch.resumen_sucursal?.cajas_abiertas ?? 0,
          closedBoxes: branch.resumen_sucursal?.cajas_cerradas ?? 0,
          income: this.formatCurrency(branch.resumen_sucursal?.ingresos ?? 0),
          expenses: this.formatCurrency(branch.resumen_sucursal?.egresos ?? 0),
          netFlow: this.formatCurrency(branch.resumen_sucursal?.flujo_neto ?? 0),
        },
      })),
      companyTotal: {
        totalBoxes: totalEmpresa.total_cajas,
        openBoxes: totalEmpresa.cajas_abiertas,
        closedBoxes: totalEmpresa.cajas_cerradas,
        income: this.formatCurrency(totalEmpresa.ingresos),
        expenses: this.formatCurrency(totalEmpresa.egresos),
        netFlow: this.formatCurrency(totalEmpresa.flujo_neto),
      },
    };
  }

  private createEmptyCashSummaryReport(): CashSummaryReportView {
    return {
      date: '',
      branches: [],
      companyTotal: {
        totalBoxes: 0,
        openBoxes: 0,
        closedBoxes: 0,
        income: this.formatCurrency(0),
        expenses: this.formatCurrency(0),
        netFlow: this.formatCurrency(0),
      },
    };
  }

  private mapCashMovementsReport(report: CashMovementsReportResponse): CashMovementsReportView {
    const totalEmpresa = report.total_empresa ?? {
      total_movimientos: 0,
      total_ingresos: 0,
      total_egresos: 0,
    };

    return {
      date: this.formatReportDate(report.fecha),
      branches: (report.sucursales ?? []).map((branch) => ({
        name: branch.sucursal,
        movements: (branch.movimientos ?? []).map((movement) => ({
          time: movement.hora,
          box: movement.caja,
          type: movement.tipo,
          concept: movement.concepto,
          amount: this.formatCurrency(movement.monto),
        })),
        summary: {
          totalMovements: branch.resumen_sucursal?.total_movimientos ?? 0,
          totalIncome: this.formatCurrency(branch.resumen_sucursal?.total_ingresos ?? 0),
          totalExpenses: this.formatCurrency(branch.resumen_sucursal?.total_egresos ?? 0),
        },
      })),
      companyTotal: {
        totalMovements: totalEmpresa.total_movimientos,
        totalIncome: this.formatCurrency(totalEmpresa.total_ingresos),
        totalExpenses: this.formatCurrency(totalEmpresa.total_egresos),
      },
    };
  }

  private createEmptyCashMovementsReport(): CashMovementsReportView {
    return {
      date: '',
      branches: [],
      companyTotal: {
        totalMovements: 0,
        totalIncome: this.formatCurrency(0),
        totalExpenses: this.formatCurrency(0),
      },
    };
  }
}


import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { CompanyService, Branch } from '../../../../core/services/company.service';
import { CompanyWebSocketService } from '../../../../core/services/company-websocket.service';

type DashboardState = 'loading' | 'ready' | 'empty' | 'error';

interface BranchDashboardMock {
  id: number;
  name: string;
  ticketsToday: number;
  openRegisters: number;
  topProductName: string;
  topProductUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  incomeToday: number;
  expensesToday: number;
  salesLast30Days: number[];
}

interface KpiCard {
  title: string;
  value: string;
  icon: string;
}

interface BranchSalesBar {
  name: string;
  value: number;
  percent: number;
  formattedValue: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [Navbar, Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private readonly wsService = inject(CompanyWebSocketService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected companyName = 'Comercial Nova';

  protected uiState: DashboardState = 'loading';
  protected selectedBranchFilter = 'all';

  private readonly dayLabels = this.buildDayLabels();
  private branchData: BranchDashboardMock[] = [];
  private realBranches: Branch[] = [];
  private wsSubscription: Subscription | null = null;
  protected receivedDashboardData: any = null;

  ngOnInit(): void {
    const mockState = this.route.snapshot.queryParamMap.get('mockState');

    this.wsSubscription = this.wsService.messages$.subscribe({
      next: (msg) => {
        this.handleWsMessage(msg);
      }
    });

    if (this.companyId) {
      this.companyService.obtenerEmpresa(this.companyId).subscribe({
        next: (company) => {
          if (company && company.nombre) {
            this.companyName = company.nombre;
          }
        },
        error: (err) => {
          console.error('Error fetching company details:', err);
        }
      });

      this.companyService.getSucursales(this.companyId).subscribe({
        next: (branches) => {
          this.realBranches = branches;
          this.simulateLoad(mockState);
        },
        error: (err) => {
          console.error('Error fetching branches:', err);
          this.realBranches = [];
          this.simulateLoad(mockState);
        }
      });
    } else {
      this.simulateLoad(mockState);
    }
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  private handleWsMessage(msg: any): void {
    if (msg && msg.tipo === 'dashboard') {
      const data = Array.isArray(msg.datos) ? msg.datos[0] : msg.datos;
      if (data) {
        this.receivedDashboardData = data;
        this.cdr.detectChanges();
      }
    }
  }

  protected onBranchFilterChange(value: string): void {
    this.selectedBranchFilter = value;
  }

  protected get branchOptions(): Array<{ id: string; name: string }> {
    return [
      { id: 'all', name: 'Todas las sucursales' },
      ...this.branchData.map((branch) => ({ id: String(branch.id), name: branch.name })),
    ];
  }

  protected get shouldShowEmptyState(): boolean {
    return this.uiState === 'empty';
  }

  protected get shouldShowErrorState(): boolean {
    return this.uiState === 'error';
  }

  protected get shouldShowLoadingState(): boolean {
    return this.uiState === 'loading';
  }

  protected get shouldShowDashboard(): boolean {
    return this.uiState === 'ready';
  }

  protected get kpiCards(): KpiCard[] {
    if (this.receivedDashboardData) {
      const ind = this.receivedDashboardData.indicadores || {};
      const salesToday = Number(ind.ventas_hoy ?? 0);
      const averageTicket = Number(ind.ticket_promedio ?? 0);
      const openRegisters = Number(ind.cajas_abiertas ?? 0);
      const topProd = ind.producto_estrella
        ? `${ind.producto_estrella.nombre || ''} (${ind.producto_estrella.unidades ?? 0} uds)`
        : '-';
      const lowStock = Number(ind.productos_bajo_stock ?? 0);
      const outOfStock = Number(ind.productos_agotados ?? 0);
      const income = Number(ind.ingresos_dia ?? 0);
      const expenses = Number(ind.egresos_dia ?? 0);
      const netFlow = Number(ind.flujo_neto ?? 0);

      return [
        { title: 'Ventas de hoy', value: this.formatCurrency(salesToday), icon: 'VEN' },
        { title: 'Ticket promedio', value: this.formatCurrency(averageTicket), icon: 'AVG' },
        { title: 'Cajas abiertas', value: this.formatInteger(openRegisters), icon: 'CAJ' },
        { title: 'Producto estrella', value: topProd, icon: 'TOP' },
        { title: 'Productos con bajo stock', value: this.formatInteger(lowStock), icon: 'LOW' },
        { title: 'Productos agotados', value: this.formatInteger(outOfStock), icon: 'OUT' },
        { title: 'Ingresos del dia', value: this.formatCurrency(income), icon: 'ING' },
        { title: 'Egresos del dia', value: this.formatCurrency(expenses), icon: 'EGR' },
        { title: 'Flujo neto', value: this.formatCurrency(netFlow), icon: 'NET' },
      ];
    }

    const selected = this.selectedData;
    const salesToday = this.sum(selected.map((branch) => this.getSalesToday(branch)));
    const ticketsToday = this.sum(selected.map((branch) => branch.ticketsToday));
    const averageTicket = ticketsToday > 0 ? salesToday / ticketsToday : 0;
    const openRegisters = this.sum(selected.map((branch) => branch.openRegisters));
    const lowStock = this.sum(selected.map((branch) => branch.lowStockCount));
    const outOfStock = this.sum(selected.map((branch) => branch.outOfStockCount));
    const income = this.sum(selected.map((branch) => branch.incomeToday));
    const expenses = this.sum(selected.map((branch) => branch.expensesToday));
    const netFlow = income - expenses;

    return [
      { title: 'Ventas de hoy', value: this.formatCurrency(salesToday), icon: 'VEN' },
      { title: 'Ticket promedio', value: this.formatCurrency(averageTicket), icon: 'AVG' },
      { title: 'Cajas abiertas', value: this.formatInteger(openRegisters), icon: 'CAJ' },
      { title: 'Producto estrella', value: this.topProductName, icon: 'TOP' },
      { title: 'Productos con bajo stock', value: this.formatInteger(lowStock), icon: 'LOW' },
      { title: 'Productos agotados', value: this.formatInteger(outOfStock), icon: 'OUT' },
      { title: 'Ingresos del dia', value: this.formatCurrency(income), icon: 'ING' },
      { title: 'Egresos del dia', value: this.formatCurrency(expenses), icon: 'EGR' },
      { title: 'Flujo neto', value: this.formatCurrency(netFlow), icon: 'NET' },
    ];
  }

  protected get salesLinePath(): string {
    const values = this.salesSeriesLast30Days;

    if (values.length <= 1) {
      return '0,90 100,90';
    }

    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 100;
        const normalized = (value - min) / range;
        const y = 90 - normalized * 70;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }

  protected get salesSeriesTotalLabel(): string {
    if (this.receivedDashboardData) {
      return this.formatCurrency(this.receivedDashboardData.evolucion_ventas_30_dias?.total_periodo ?? 0);
    }
    return this.formatCurrency(this.sum(this.salesSeriesLast30Days));
  }

  protected get salesSeriesPeakLabel(): string {
    if (this.receivedDashboardData) {
      return this.formatCurrency(this.receivedDashboardData.evolucion_ventas_30_dias?.pico_diario ?? 0);
    }
    const values = this.salesSeriesLast30Days;
    return this.formatCurrency(values.length ? Math.max(...values) : 0);
  }

  protected get firstDayLabel(): string {
    return this.dayLabels[0] ?? '-';
  }

  protected get lastDayLabel(): string {
    return this.dayLabels[this.dayLabels.length - 1] ?? '-';
  }

  protected get branchSalesBars(): BranchSalesBar[] {
    if (this.receivedDashboardData) {
      const rawBars = this.receivedDashboardData.ventas_por_sucursal || [];
      let values = rawBars.map((item: any) => ({
        name: item.nombre || item.name || 'Sucursal',
        value: Number(item.ventas ?? item.sales ?? item.value ?? 0),
        id: item.id_sucursal ?? item.id ?? null,
      }));

      if (!this.isAllBranchesSelected) {
        values = values.filter((item: any) =>
          String(item.id) === this.selectedBranchFilter ||
          item.name === this.obtenerNombreSucursal(this.selectedBranchFilter)
        );
      }

      values.sort((a: any, b: any) => b.value - a.value);
      const max = Math.max(...values.map((item: any) => item.value), 1);

      return values.map((item: any) => ({
        name: item.name,
        value: item.value,
        percent: (item.value / max) * 100,
        formattedValue: this.formatCurrency(item.value),
      }));
    }

    const branches = this.isAllBranchesSelected
      ? this.branchData
      : this.branchData.filter((branch) => String(branch.id) === this.selectedBranchFilter);

    const values = branches
      .map((branch) => ({
        name: branch.name,
        value: this.sum(branch.salesLast30Days),
      }))
      .sort((a, b) => b.value - a.value);

    const max = Math.max(...values.map((item) => item.value), 1);

    return values.map((item) => ({
      name: item.name,
      value: item.value,
      percent: (item.value / max) * 100,
      formattedValue: this.formatCurrency(item.value),
    }));
  }

  protected get shouldShowBranchChart(): boolean {
    return this.branchSalesBars.length > 0;
  }

  protected get branchChartSubtitle(): string {
    return this.isAllBranchesSelected
      ? 'Ordenado de mayor a menor facturacion acumulada.'
      : 'Visualizando la sucursal seleccionada.';
  }

  private get selectedData(): BranchDashboardMock[] {
    if (this.isAllBranchesSelected) {
      return this.branchData;
    }

    return this.branchData.filter((branch) => String(branch.id) === this.selectedBranchFilter);
  }

  private get isAllBranchesSelected(): boolean {
    return this.selectedBranchFilter === 'all';
  }

  private get topProductName(): string {
    const selected = this.selectedData;

    if (selected.length === 0) {
      return '-';
    }

    const winner = [...selected].sort((a, b) => b.topProductUnits - a.topProductUnits)[0];
    return winner?.topProductName ?? '-';
  }

  private get salesSeriesLast30Days(): number[] {
    if (this.receivedDashboardData) {
      const puntos = this.receivedDashboardData.evolucion_ventas_30_dias?.puntos || [];
      return puntos.map((p: any) => typeof p === 'number' ? p : Number(p.monto ?? p.valor ?? p.value ?? p.sales ?? 0));
    }

    const selected = this.selectedData;

    if (selected.length === 0) {
      return [];
    }

    return this.dayLabels.map((_, index) => this.sum(selected.map((branch) => branch.salesLast30Days[index] ?? 0)));
  }

  private obtenerNombreSucursal(idSucursal: string): string {
    return this.realBranches.find(
      (branch) => String(branch.id ?? branch.idSucursal ?? branch.id_sucursal) === idSucursal
    )?.nombre ?? idSucursal;
  }

  private getSalesToday(branch: BranchDashboardMock): number {
    return branch.salesLast30Days[branch.salesLast30Days.length - 1] ?? 0;
  }

  private sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
  }

  private formatCurrency(value: number): string {
    return `Bs ${new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;
  }

  private formatInteger(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      maximumFractionDigits: 0,
    }).format(value);
  }

  private simulateLoad(mockState: string | null): void {
    this.uiState = 'loading';

    setTimeout(() => {
      if (mockState === 'error') {
        this.uiState = 'error';
        this.branchData = [];
        return;
      }

      if (mockState === 'empty') {
        this.uiState = 'empty';
        this.branchData = [];
        return;
      }

      this.branchData = this.buildMockData();
      this.uiState = this.branchData.length ? 'ready' : 'empty';
    }, 700);
  }

  private buildDayLabels(): string[] {
    const labels: string[] = [];
    const now = new Date();

    for (let index = 29; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index);

      labels.push(
        new Intl.DateTimeFormat('es-BO', {
          day: '2-digit',
          month: '2-digit',
        }).format(date),
      );
    }

    return labels;
  }

  private buildMockData(): BranchDashboardMock[] {
    const templates = [
      {
        ticketsToday: 74,
        openRegisters: 3,
        topProductName: 'Cafe Molido Premium 500g',
        topProductUnits: 126,
        lowStockCount: 14,
        outOfStockCount: 4,
        incomeToday: 25500,
        expensesToday: 3900,
        salesLast30Days: [
          5400, 5800, 5600, 6100, 6200, 5900, 6400, 6700, 6500, 6900,
          7100, 7350, 7200, 7450, 7600, 7800, 8000, 7900, 8300, 8500,
          8700, 8800, 9200, 9400, 9100, 9550, 9800, 9950, 10200, 10500,
        ],
      },
      {
        ticketsToday: 51,
        openRegisters: 2,
        topProductName: 'Gaseosa 2L',
        topProductUnits: 98,
        lowStockCount: 9,
        outOfStockCount: 2,
        incomeToday: 18400,
        expensesToday: 2600,
        salesLast30Days: [
          3200, 3400, 3300, 3550, 3600, 3500, 3700, 3900, 3850, 4100,
          4200, 4300, 4400, 4450, 4500, 4700, 4800, 4750, 4900, 5050,
          5100, 5200, 5300, 5450, 5500, 5600, 5750, 5900, 6000, 6150,
        ],
      },
      {
        ticketsToday: 39,
        openRegisters: 1,
        topProductName: 'Arroz 1kg',
        topProductUnits: 81,
        lowStockCount: 12,
        outOfStockCount: 5,
        incomeToday: 12100,
        expensesToday: 1900,
        salesLast30Days: [
          2200, 2100, 2300, 2400, 2350, 2450, 2500, 2600, 2700, 2750,
          2850, 2900, 3000, 3100, 3200, 3250, 3300, 3400, 3500, 3600,
          3700, 3750, 3800, 3900, 3950, 4000, 4100, 4200, 4300, 4400,
        ],
      },
    ];

    if (!this.realBranches || this.realBranches.length === 0) {
      return templates.map((t, i) => ({
        ...t,
        id: i + 1,
        name: `Sucursal Muck ${i + 1}`,
      }));
    }

    return this.realBranches.map((branch, index) => {
      const template = templates[index % templates.length]!;
      const branchId = branch.id ?? branch.idSucursal ?? branch.id_sucursal ?? index + 1;
      return {
        ...template,
        id: Number(branchId),
        name: branch.nombre,
      };
    });
  }
}

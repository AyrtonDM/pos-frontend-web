import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';

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
export class Dashboard implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly companyName = 'Comercial Nova';

  protected uiState: DashboardState = 'loading';
  protected selectedBranchFilter = 'all';

  private readonly dayLabels = this.buildDayLabels();
  private branchData: BranchDashboardMock[] = [];

  ngOnInit(): void {
    const mockState = this.route.snapshot.queryParamMap.get('mockState');
    this.simulateLoad(mockState);
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
    return this.formatCurrency(this.sum(this.salesSeriesLast30Days));
  }

  protected get salesSeriesPeakLabel(): string {
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
    const selected = this.selectedData;

    if (selected.length === 0) {
      return [];
    }

    return this.dayLabels.map((_, index) => this.sum(selected.map((branch) => branch.salesLast30Days[index] ?? 0)));
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
    return [
      {
        id: 1,
        name: 'Sucursal Centro',
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
        id: 2,
        name: 'Sucursal Norte',
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
        id: 3,
        name: 'Sucursal Sur',
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
  }
}

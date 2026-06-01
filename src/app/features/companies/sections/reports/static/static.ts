import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../shared/components/sidebar/sidebar';

type StaticReportTab = 'sales' | 'inventory' | 'cash-registers';

@Component({
  selector: 'app-static-reports',
  imports: [CommonModule, Navbar, Sidebar],
  templateUrl: './static.html',
  styleUrl: './static.css',
})
export class StaticReports {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected activeTab: StaticReportTab = 'sales';
  protected salesReportType: 'none' | 'summary' | 'details' = 'none';
  protected inventoryReportType: 'none' | 'status' | 'movements' = 'none';
  protected cashReportType: 'none' | 'summary' | 'movements' = 'none';

  protected readonly salesSummaryReport = {
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

  protected readonly salesDetailsReport = {
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

  protected readonly inventoryStatusReport = {
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

  protected readonly inventoryMovementsReport = {
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

  protected readonly cashSummaryReport = {
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

  protected readonly cashMovementsReport = {
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
    this.salesReportType = type;
  }

  protected showInventoryReport(type: 'status' | 'movements'): void {
    this.inventoryReportType = type;
  }

  protected showCashReport(type: 'summary' | 'movements'): void {
    this.cashReportType = type;
  }

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Sucursales',
      link: ['/company', this.companyId, 'branches'],
      active: true,
    },
    {
      label: 'Usuarios',
      link: ['/company', this.companyId, 'users'],
    },
    {
      label: 'Productos',
      link: ['/company', this.companyId, 'products'],
    },
    {
      label: 'Clientes',
      link: ['/company', this.companyId, 'clients'],
    },
    {
      label: 'Reportes',
      active: true,
      expanded: true,
      children: [
        {
          label: 'Estaticos',
          link: ['/company', this.companyId, 'reports', 'static'],
          active: true,
        },
        {
          label: 'Parametrizados',
          link: ['/company', this.companyId, 'reports', 'parameterized'],
        },
        {
          label: 'Dinamicos',
          link: ['/company', this.companyId, 'reports', 'dynamic'],
        },
      ],
    },
  ];

  protected setActiveTab(tab: StaticReportTab): void {
    this.activeTab = tab;
  }
}


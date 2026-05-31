import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../shared/components/sidebar/sidebar';

type StaticReportTab = 'sales' | 'inventory' | 'cash-registers';

@Component({
  selector: 'app-static-reports',
  imports: [Navbar, Sidebar],
  templateUrl: './static.html',
  styleUrl: './static.css',
})
export class StaticReports {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected activeTab: StaticReportTab = 'sales';

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Sucursales',
      link: ['/administrator/company', this.companyId, 'branches'],
      active: true,
    },
    {
      label: 'Usuarios',
      link: ['/administrator/company', this.companyId, 'users'],
    },
    {
      label: 'Productos',
      link: ['/administrator/company', this.companyId, 'products'],
    },
    {
      label: 'Clientes',
      link: ['/administrator/company', this.companyId, 'clients'],
    },
    {
      label: 'Reportes',
      active: true,
      expanded: true,
      children: [
        {
          label: 'Estaticos',
          link: ['/administrator/company', this.companyId, 'reports', 'static'],
          active: true,
        },
        {
          label: 'Parametrizados',
          link: ['/administrator/company', this.companyId, 'reports', 'parameterized'],
        },
        {
          label: 'Dinamicos',
          link: ['/administrator/company', this.companyId, 'reports', 'dynamic'],
        },
      ],
    },
  ];

  protected setActiveTab(tab: StaticReportTab): void {
    this.activeTab = tab;
  }
}

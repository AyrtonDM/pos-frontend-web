import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../shared/components/sidebar/sidebar';

type DynamicReportTab = 'test1' | 'test2';

@Component({
  selector: 'app-dynamic-reports',
  imports: [Navbar, Sidebar],
  templateUrl: './dynamic.html',
  styleUrl: './dynamic.css',
})
export class DynamicReports {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected activeTab: DynamicReportTab = 'test1';

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
        },
        {
          label: 'Parametrizados',
          link: ['/administrator/company', this.companyId, 'reports', 'parameterized'],
        },
        {
          label: 'Dinamicos',
          link: ['/administrator/company', this.companyId, 'reports', 'dynamic'],
          active: true,
        },
      ],
    },
  ];

  protected setActiveTab(tab: DynamicReportTab): void {
    this.activeTab = tab;
  }
}

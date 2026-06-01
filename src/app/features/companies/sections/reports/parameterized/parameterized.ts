import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../shared/components/sidebar/sidebar';

type ParameterizedReportTab = 'test1' | 'test2';

@Component({
  selector: 'app-parameterized-reports',
  imports: [Navbar, Sidebar],
  templateUrl: './parameterized.html',
  styleUrl: './parameterized.css',
})
export class ParameterizedReports {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected activeTab: ParameterizedReportTab = 'test1';

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
        },
        {
          label: 'Parametrizados',
          link: ['/company', this.companyId, 'reports', 'parameterized'],
          active: true,
        },
        {
          label: 'Dinamicos',
          link: ['/company', this.companyId, 'reports', 'dynamic'],
        },
      ],
    },
  ];

  protected setActiveTab(tab: ParameterizedReportTab): void {
    this.activeTab = tab;
  }
}


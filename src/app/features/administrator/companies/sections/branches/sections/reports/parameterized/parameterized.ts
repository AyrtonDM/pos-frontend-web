import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../../shared/components/sidebar/sidebar';

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
      label: 'Personal',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'staff'],
    },
    {
      label: 'Cajas',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'cash-register'],
    },
    {
      label: 'Inventario',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'inventario'],
    },
    {
      label: 'Ventas',
    },
    {
      label: 'Reportes',
      active: true,
      expanded: true,
      children: [
        {
          label: 'Estaticos',
          link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'reports', 'static'],
        },
        {
          label: 'Parametrizados',
          link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'reports', 'parameterized'],
          active: true,
        },
        {
          label: 'Dinamicos',
          link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'reports', 'dynamic'],
        },
      ],
    },
  ];

  protected setActiveTab(tab: ParameterizedReportTab): void {
    this.activeTab = tab;
  }
}

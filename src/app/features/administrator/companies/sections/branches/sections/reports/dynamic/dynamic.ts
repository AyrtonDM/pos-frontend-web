import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../../shared/components/sidebar/sidebar';

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
        },
        {
          label: 'Dinamicos',
          link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'reports', 'dynamic'],
          active: true,
        },
      ],
    },
  ];

  protected setActiveTab(tab: DynamicReportTab): void {
    this.activeTab = tab;
  }
}

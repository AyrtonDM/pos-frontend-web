import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../../shared/components/sidebar/sidebar';

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
          active: true,
        },
        {
          label: 'Parametrizados',
          link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'reports', 'parameterized'],
        },
        {
          label: 'Dinamicos',
          link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'reports', 'dynamic'],
        },
      ],
    },
  ];

  protected setActiveTab(tab: StaticReportTab): void {
    this.activeTab = tab;
  }
}

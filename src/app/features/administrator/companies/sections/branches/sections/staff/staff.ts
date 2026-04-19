import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Navbar } from '../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-staff',
  imports: [Navbar, Sidebar],
  templateUrl: './staff.html',
  styleUrl: './staff.css',
})
export class Staff {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Sucursales',
      link: ['/administrator/company', this.companyId, 'branches'],
      active: true,
    },
    {
      label: 'Productos',
      link: ['/administrator/company', this.companyId, 'products'],
    },
  ];
}

import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../shared/components/sidebar/sidebar';

type Branch = {
  nombre: string;
  activo: boolean;
};

@Component({
  selector: 'app-branches',
  imports: [Navbar, Sidebar],
  templateUrl: './branches.html',
  styleUrl: './branches.css',
})
export class Branches {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected activeTab: 'register' | 'list' = 'list';

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

  protected readonly branches: Branch[] = [
    {
      nombre: 'Sucursal Central',
      activo: true,
    },
    {
      nombre: 'Sucursal Norte',
      activo: true,
    },
    {
      nombre: 'Sucursal Sur',
      activo: false,
    },
  ];

  protected setActiveTab(tab: 'register' | 'list'): void {
    this.activeTab = tab;
  }
}

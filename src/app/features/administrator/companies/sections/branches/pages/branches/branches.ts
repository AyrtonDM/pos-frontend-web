import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../shared/components/sidebar/sidebar';

type Branch = {
  id: string;
  nombre: string;
  activo: boolean;
};

@Component({
  selector: 'app-branches',
  imports: [Navbar, Sidebar, RouterLink],
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
      id: 'central',
      nombre: 'Sucursal Central',
      activo: true,
    },
    {
      id: 'norte',
      nombre: 'Sucursal Norte',
      activo: true,
    },
    {
      id: 'sur',
      nombre: 'Sucursal Sur',
      activo: false,
    },
  ];

  protected setActiveTab(tab: 'register' | 'list'): void {
    this.activeTab = tab;
  }
}

import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Navbar } from '../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-view-branch',
  imports: [Navbar, Sidebar, RouterLink],
  templateUrl: './view-branch.html',
  styleUrl: './view-branch.css',
})
export class ViewBranch {
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

  protected readonly branch = {
    nombre: 'Sucursal Central',
    direccion: 'Av. Principal 1245',
    telefono: '61524977',
    ciudad: 'La Paz',
    activo: true,
    fecha_registro: '2026-04-18',
  };
}

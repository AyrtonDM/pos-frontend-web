import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Navbar } from '../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../shared/components/sidebar/sidebar';

type StaffMember = {
  nombre: string;
  telefono: string;
};

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
  protected activeTab: 'invite' | 'list' = 'list';

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Personal',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'staff'],
      active: true,
    },
    {
      label: 'Inventario',
    },
    {
      label: 'Ventas',
    },
  ];

  protected readonly staffMembers: StaffMember[] = [
    {
      nombre: 'Mariana Flores',
      telefono: '71234567',
    },
    {
      nombre: 'Luis Mercado',
      telefono: '69874512',
    },
    {
      nombre: 'Camila Rojas',
      telefono: '76549821',
    },
  ];

  protected setActiveTab(tab: 'invite' | 'list'): void {
    this.activeTab = tab;
  }
}

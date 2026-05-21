import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Params, Router, RouterLink } from '@angular/router';

export type SidebarRole = 'administrator' | 'employee';

export type SidebarItem = {
  label: string;
  link?: string | unknown[];
  queryParams?: Params;
  active?: boolean;
  expanded?: boolean;
  children?: SidebarItem[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly router = inject(Router);

  @Input() items: SidebarItem[] = [];
  @Input() role?: SidebarRole;
  @Input() companyId = '';
  @Input() branchId = '';
  @Input() cashRegisterId = '';
  @Input() activeItemLabel = '';

  openGroups: Record<string, boolean> = {};

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncOpenGroups();
  }

  toggleGroup(label: string): void {
    this.openGroups[label] = !this.openGroups[label];
  }

  openGroup(label: string): void {
    this.openGroups[label] = true;
  }

  isGroupOpen(item: SidebarItem): boolean {
    return this.openGroups[item.label] ?? false;
  }

  get displayedItems(): SidebarItem[] {
    if (this.items.length > 0) {
      return this.items;
    }

    if (!this.isBranchView()) {
      return [];
    }

    return this.buildBranchItems();
  }

  get backButtonLabel(): string {
    return this.isBranchView() ? 'Volver a Mis Sucursales' : 'Volver a Mis Empresas';
  }

  get backButtonLink(): string[] {
    const role = this.getRole();

    if (this.isBranchView()) {
      const companyId = this.companyId || this.getCompanyIdFromUrl(role);

      if (role === 'employee') {
        return companyId ? ['/employee/company', companyId, 'branches'] : ['/employee/my-companies'];
      }

      return companyId ? ['/administrator/company', companyId, 'branches'] : ['/administrator/my-companies'];
    }

    return role === 'employee' ? ['/employee/my-companies'] : ['/administrator/my-companies'];
  }

  private isBranchView(): boolean {
    return this.router.url.includes('/branch/');
  }

  private getRole(): SidebarRole {
    if (this.role) {
      return this.role;
    }

    return this.router.url.startsWith('/employee/') ? 'employee' : 'administrator';
  }

  private getCompanyIdFromUrl(role: SidebarRole): string {
    const match = this.router.url.match(new RegExp(`/${role}/company/([^/]+)`));
    return match?.[1] ?? '';
  }

  private buildBranchItems(): SidebarItem[] {
    const role = this.getRole();
    const companyId = this.companyId || this.getCompanyIdFromUrl(role);
    const branchId = this.branchId || this.getBranchIdFromUrl();
    const cashRegisterId = this.cashRegisterId || this.getCashRegisterIdFromUrl();

    if (role === 'employee') {
      if (this.isCashRegisterSessionView()) {
        return [
          {
            label: 'Ventas',
            link: [
              '/employee/company',
              companyId,
              'branch',
              branchId,
              'cash_register',
              cashRegisterId,
              'sales',
            ],
            active: this.isActiveItem('Ventas'),
          },
          {
            label: 'Movimientos',
            active: this.isActiveItem('Movimientos'),
          },
        ];
      }

      return [
        {
          label: 'Cajas',
          link: ['/employee/company', companyId, 'branch', branchId, 'cash_registers'],
          active: this.isActiveItem('Cajas'),
        },
      ];
    }

    return [
      {
        label: 'Personal',
        link: ['/administrator/company', companyId, 'branch', branchId, 'staff'],
        active: this.isActiveItem('Personal'),
      },
      {
        label: 'Cajas',
        link: ['/administrator/company', companyId, 'branch', branchId, 'cash-register'],
        active: this.isActiveItem('Cajas'),
      },
      {
        label: 'Inventario',
        link: ['/administrator/company', companyId, 'branch', branchId, 'inventario'],
        active: this.isActiveItem('Inventario'),
      },
      {
        label: 'Ventas',
        active: this.isActiveItem('Ventas'),
      },
    ];
  }

  private getBranchIdFromUrl(): string {
    const match = this.router.url.match(/\/branch\/([^/]+)/);
    return match?.[1] ?? '';
  }

  private getCashRegisterIdFromUrl(): string {
    const match = this.router.url.match(/\/cash_register\/([^/]+)/);
    return match?.[1] ?? '';
  }

  private isCashRegisterSessionView(): boolean {
    const activeItem = this.activeItemLabel.toLowerCase();

    return (
      this.getRole() === 'employee' &&
      this.router.url.includes('/cash_register/') &&
      (this.router.url.endsWith('/sales') || activeItem === 'ventas' || activeItem === 'movimientos')
    );
  }

  private isActiveItem(label: string): boolean {
    return this.activeItemLabel.toLowerCase() === label.toLowerCase();
  }

  private syncOpenGroups(): void {
    for (const item of this.displayedItems) {
      if (!item.children?.length) {
        continue;
      }

      const hasActiveChild = item.children.some((child) => child.active);
      this.openGroups[item.label] = item.expanded ?? hasActiveChild;
    }
  }
}

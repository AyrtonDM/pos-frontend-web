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
  @Input() cashRegisterSessionId = '';
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
      return this.getRole() === 'administrator'
        ? this.withAdministratorCompanyNavigation(this.items)
        : this.items;
    }

    if (!this.isBranchView()) {
      return [];
    }

    return this.getRole() === 'administrator'
      ? this.withAdministratorCompanyNavigation(this.buildBranchItems())
      : this.buildBranchItems();
  }

  get backButtonLabel(): string {
    if (this.isCashRegisterSessionView()) {
      return 'Volver a Cajas';
    }

    return this.isBranchView() ? 'Volver a Mis Sucursales' : 'Volver a Mis Empresas';
  }

  get backButtonLink(): string[] {
    const role = this.getRole();

    if (this.isCashRegisterSessionView() && role === 'employee') {
      const companyId = this.companyId || this.getCompanyIdFromUrl(role);
      const branchId = this.branchId || this.getBranchIdFromUrl();

      return companyId && branchId
        ? ['/employee/company', companyId, 'branch', branchId, 'cash_registers']
        : ['/employee/my-companies'];
    }

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
        const salesLink = [
          '/employee/company',
          companyId,
          'branch',
          branchId,
          'cash_register',
          cashRegisterId,
          'sales',
        ];

        const sharedQueryParams = this.cashRegisterSessionId ? { sessionId: this.cashRegisterSessionId } : undefined;

        return [
          {
            label: 'Ventas',
            link: salesLink,
            queryParams: {
              section: 'sales',
              ...(sharedQueryParams ?? {}),
            },
            active: this.isActiveItem('Ventas'),
          },
          {
            label: 'Movimientos',
            link: salesLink,
            queryParams: {
              section: 'movimientos',
              ...(sharedQueryParams ?? {}),
            },
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

  private withAdministratorCompanyNavigation(items: SidebarItem[]): SidebarItem[] {
    const companyId = this.companyId || this.getCompanyIdFromUrl('administrator');

    if (!companyId) {
      return items;
    }

    const filteredItems = items.filter((item) => item.label.toLowerCase() !== 'personal');
    const itemsByLabel = new Map(filteredItems.map((item) => [item.label.toLowerCase(), item]));

    const reportsItem = this.buildReportsItem(itemsByLabel.get('reportes'), companyId);
    const usersItem = this.buildUsersItem(itemsByLabel.get('usuarios'), companyId);
    const clientsItem = this.buildClientsItem(itemsByLabel.get('clientes'), companyId);
    const productsItem = this.buildProductsItem(itemsByLabel.get('productos'), companyId);
    const orderedLabels = ['sucursales', 'reportes', 'usuarios', 'clientes', 'productos'];
    const orderedItems = orderedLabels
      .map((label) => {
        if (label === 'reportes') {
          return reportsItem;
        }

        if(label === 'usuarios') {
          return usersItem;
        }

        if (label === 'clientes') {
          return clientsItem;
        }

        if (label === 'productos') {
          return productsItem;
        }

        return itemsByLabel.get(label);
      })
      .filter((item): item is SidebarItem => Boolean(item));

    const remainingItems = filteredItems.filter(
      (item) => !orderedLabels.includes(item.label.toLowerCase()),
    );

    return [...orderedItems, ...remainingItems];
  }

    private buildReportsItem(item: SidebarItem | undefined, companyId: string): SidebarItem | undefined {
    if (!item) {
      return undefined;
    }

    return {
      ...item,
      label: 'Reportes',
      link: ['/administrator/company', companyId, 'reports', 'static'],
      active:
        this.router.url.includes('/reports') ||
        item.active ||
        item.children?.some((child) => child.active) ||
        this.isActiveItem('Reportes') ||
        this.isActiveItem('Estaticos') ||
        this.isActiveItem('Parametrizados') ||
        this.isActiveItem('Dinamicos'),
      children: item.children?.length
        ? item.children
        : [
            {
              label: 'Estaticos',
              link: ['/administrator/company', companyId, 'reports', 'static'],
              active: this.router.url.endsWith('/reports/static') || this.isActiveItem('Estaticos'),
            },
            {
              label: 'Parametrizados',
              link: ['/administrator/company', companyId, 'reports', 'parameterized'],
              active: this.router.url.endsWith('/reports/parameterized') || this.isActiveItem('Parametrizados'),
            },
            {
              label: 'Dinamicos',
              link: ['/administrator/company', companyId, 'reports', 'dynamic'],
              active: this.router.url.endsWith('/reports/dynamic') || this.isActiveItem('Dinamicos'),
            },
          ],
    };
  }

  private buildUsersItem(item: SidebarItem | undefined, companyId: string): SidebarItem | undefined {
    if (!item) {
      return undefined;
    }

    return {
      ...item,
      label: 'Usuarios',
      link: ['/administrator/company', companyId, 'users', 'staff'],
      active:
        this.router.url.includes('/users') ||
        item.active ||
        item.children?.some((child) => child.active) ||
        this.isActiveItem('Usuarios') ||
        this.isActiveItem('Personal') ||
        this.isActiveItem('Roles'),
      children: item.children?.length
        ? item.children
        : [
            {
              label: 'Personal',
              link: ['/administrator/company', companyId, 'users', 'staff'],
              active: this.router.url.endsWith('/users/staff') || this.isActiveItem('Personal'),
            },
            {
              label: 'Roles',
              link: ['/administrator/company', companyId, 'users', 'rols'],
              active: this.router.url.includes('/users/rols') || this.isActiveItem('Roles'),
            },
          ],
    };
  }

  private buildClientsItem(item: SidebarItem | undefined, companyId: string): SidebarItem | undefined {
    if (!item) {
      return undefined;
    }

    return {
      ...item,
      label: 'Clientes',
      link: ['/administrator/company', companyId, 'clients'],
      active:
        this.router.url.includes('/clients') ||
        item.active ||
        item.children?.some((child) => child.active) ||
        this.isActiveItem('Clientes') ||
        this.isActiveItem('Agenda') ||
        this.isActiveItem('Categorias'),
      children: item.children?.length
        ? item.children
        : [
            {
              label: 'Agenda',
              link: ['/administrator/company', companyId, 'clients'],
              active: this.router.url.endsWith('/clients') || this.isActiveItem('Agenda'),
            },
            {
              label: 'Categorias',
              link: ['/administrator/company', companyId, 'clients', 'categories'],
              active: this.router.url.includes('/clients/categories') || this.isActiveItem('Categorias'),
            },
          ],
    };
  }

  private buildProductsItem(item: SidebarItem | undefined, companyId: string): SidebarItem | undefined {
    if (!item) {
      return undefined;
    }

    return {
      ...item,
      label: 'Productos',
      link: ['/administrator/company', companyId, 'products'],
      active:
        this.router.url.includes('/products') ||
        this.router.url.includes('/product/') ||
        this.router.url.includes('/category/') ||
        item.active ||
        item.children?.some((child) => child.active) ||
        this.isActiveItem('Productos') ||
        this.isActiveItem('Catalogo') ||
        this.isActiveItem('Categoria') ||
        this.isActiveItem('Categorias'),
      children: item.children?.length
        ? item.children
        : [
            {
              label: 'Catalogo',
              link: ['/administrator/company', companyId, 'products'],
              active: this.router.url.endsWith('/products') || this.isActiveItem('Catalogo'),
            },
            {
              label: 'Categoria',
              link: ['/administrator/company', companyId, 'products', 'categories'],
              active:
                this.router.url.includes('/products/categories') ||
                this.router.url.includes('/category/') ||
                this.isActiveItem('Categoria') ||
                this.isActiveItem('Categorias'),
            },
          ],
    };
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

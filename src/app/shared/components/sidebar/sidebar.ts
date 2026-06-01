import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import { NavigationEnd, Params, Router, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SidebarStateService } from './sidebar-state.service';

export type SidebarContext = 'company' | 'branch' | 'cash_register';

export type SidebarItem = {
  label: string;
  link?: string | unknown[];
  queryParams?: Params;
  active?: boolean;
  expanded?: boolean;
  children?: SidebarItem[];
  permission?: string | string[];
};

type SidebarResolvedContext = {
  context: SidebarContext;
  companyId: string;
  branchId: string;
  cashRegisterId: string;
  cashRegisterSessionId: string;
  activeItemLabel: string;
  permissions: string[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent implements OnChanges, OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly sidebarState = inject(SidebarStateService);
  private readonly navigationSubscription = new Subscription();
  private currentStateKey = '';

  @Input() context: SidebarContext = 'company';
  @Input() companyId = '';
  @Input() branchId = '';
  @Input() cashRegisterId = '';
  @Input() cashRegisterSessionId = '';
  @Input() activeItemLabel = '';
  @Input() permissions: string[] = [];

  openGroups: Record<string, boolean> = {};

  ngOnInit(): void {
    this.navigationSubscription.add(
      this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => {
        this.syncOpenGroups();
      }),
    );

    this.syncOpenGroups();
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncOpenGroups();
  }

  toggleGroup(label: string): void {
    const nextState = !this.isGroupOpenByLabel(label);
    this.openGroups[label] = nextState;
    this.sidebarState.setGroupState(this.getStateKey(), label, nextState);
  }

  isGroupOpen(item: SidebarItem): boolean {
    return this.isGroupOpenByLabel(item.label);
  }

  get displayedItems(): SidebarItem[] {
    return this.decorateItems(this.buildItems(), this.resolveContext());
  }

  get backButtonLabel(): string {
    switch (this.resolveContext().context) {
      case 'cash_register':
        return 'Volver a Cajas';
      case 'branch':
        return 'Volver a Mis Sucursales';
      default:
        return 'Volver a Mis Empresas';
    }
  }

  get backButtonLink(): string[] {
    const context = this.resolveContext();

    if (context.context === 'cash_register') {
      return context.companyId && context.branchId
        ? ['/company', context.companyId, 'branch', context.branchId, 'cash-register']
        : ['/my-companies'];
    }

    if (context.context === 'branch') {
      return context.companyId ? ['/company', context.companyId, 'branches'] : ['/my-companies'];
    }

    return ['/my-companies'];
  }

  private buildItems(): SidebarItem[] {
    const context = this.resolveContext();

    switch (context.context) {
      case 'branch':
        return this.buildBranchItems(context);
      case 'cash_register':
        return this.buildCashRegisterItems(context);
      default:
        return this.buildCompanyItems(context);
    }
  }

  private buildCompanyItems(context: SidebarResolvedContext): SidebarItem[] {
    return [
      {
        label: 'Panel',
      },
      {
        label: 'Sucursales',
        link: ['/company', context.companyId, 'branches'],
      },
      {
        label: 'Usuarios',
        link: ['/company', context.companyId, 'users', 'staff'],
        children: [
          {
            label: 'Personal',
            link: ['/company', context.companyId, 'users', 'staff'],
          },
          {
            label: 'Roles',
            link: ['/company', context.companyId, 'users', 'rols'],
          },
        ],
      },
      {
        label: 'Clientes',
        link: ['/company', context.companyId, 'clients'],
        children: [
          {
            label: 'Agenda',
            link: ['/company', context.companyId, 'clients'],
          },
          {
            label: 'Categorias',
            link: ['/company', context.companyId, 'clients', 'categories'],
          },
        ],
      },
      {
        label: 'Productos',
        link: ['/company', context.companyId, 'products'],
        children: [
          {
            label: 'Catalogo',
            link: ['/company', context.companyId, 'products'],
          },
          {
            label: 'Categoria',
            link: ['/company', context.companyId, 'products', 'categories'],
          },
        ],
      },
      {
        label: 'Reportes',
        link: ['/company', context.companyId, 'reports', 'static'],
        children: [
          {
            label: 'Estaticos',
            link: ['/company', context.companyId, 'reports', 'static'],
          },
          {
            label: 'Parametrizados',
            link: ['/company', context.companyId, 'reports', 'parameterized'],
          },
          {
            label: 'Dinamicos',
            link: ['/company', context.companyId, 'reports', 'dynamic'],
          },
        ],
      },
    ];
  }

  private buildBranchItems(context: SidebarResolvedContext): SidebarItem[] {
    return [
      {
        label: 'Cajas',
        link: ['/company', context.companyId, 'branch', context.branchId, 'cash-register'],
      },
      {
        label: 'Inventario',
        link: ['/company', context.companyId, 'branch', context.branchId, 'inventario'],
      },
    ];
  }

  private buildCashRegisterItems(context: SidebarResolvedContext): SidebarItem[] {
    const cashRegisterPath = ['/company', context.companyId, 'branch', context.branchId, 'cash-register', context.cashRegisterId];

    if (!context.cashRegisterSessionId) {
      return [
        {
          label: 'Apertura de caja',
          link: [...cashRegisterPath, 'open-cash-register'],
        },
      ];
    }

    return [
      {
        label: 'Venta rapida',
        link: [...cashRegisterPath, 'sales'],
        queryParams: {
          section: 'sales',
          sessionId: context.cashRegisterSessionId,
        },
      },
      {
        label: 'Movimientos de caja',
        link: [...cashRegisterPath, 'sales'],
        queryParams: {
          section: 'movimientos',
          sessionId: context.cashRegisterSessionId,
        },
      },
      {
        label: 'Cierre de caja',
        link: [...cashRegisterPath, 'close-cash-register'],
        queryParams: {
          sessionId: context.cashRegisterSessionId,
        },
      },
    ];
  }

  private decorateItems(items: SidebarItem[], context: SidebarResolvedContext): SidebarItem[] {
    return items
      .map((item) => this.decorateItem(item, context))
      .filter((item): item is SidebarItem => Boolean(item));
  }

  private decorateItem(item: SidebarItem, context: SidebarResolvedContext): SidebarItem | undefined {
    if (!this.hasPermission(item)) {
      return undefined;
    }

    const children = item.children?.length ? this.decorateItems(item.children, context) : undefined;
    const hasActiveChild = children?.some((child) => child.active) ?? false;
    const isActive = this.isItemActive(item, hasActiveChild);

    return {
      ...item,
      active: item.active === true || isActive || hasActiveChild,
      expanded: item.expanded,
      children,
    };
  }

  private isItemActive(item: SidebarItem, hasActiveChild = false): boolean {
    if (item.active) {
      return true;
    }

    if (hasActiveChild) {
      return true;
    }

    if (item.link && this.isLinkActive(item.link, item.queryParams, Boolean(item.children?.length))) {
      return true;
    }

    return false;
  }

  private isLinkActive(link: string | unknown[], queryParams?: Params, allowDescendants = false): boolean {
    const currentPath = this.normalizeUrl(this.router.url);
    const linkPath = this.normalizeUrl(this.router.serializeUrl(this.router.createUrlTree(this.normalizeCommands(link))));

    const matchesPath = allowDescendants ? currentPath === linkPath || currentPath.startsWith(`${linkPath}/`) : currentPath === linkPath;

    if (!matchesPath) {
      return false;
    }

    if (!queryParams) {
      return true;
    }

    const currentQueryParams = this.router.parseUrl(this.router.url).queryParams;
    return Object.entries(queryParams).every(([key, value]) => currentQueryParams[key] === String(value));
  }

  private normalizeCommands(link: string | unknown[]): unknown[] {
    return Array.isArray(link) ? link : [link];
  }

  private normalizeUrl(url: string): string {
    return url.split('?')[0].split('#')[0].replace(/\/+$/, '');
  }

  private hasPermission(item: SidebarItem): boolean {
    if (!item.permission || this.permissions.length === 0) {
      return true;
    }

    const requiredPermissions = Array.isArray(item.permission) ? item.permission : [item.permission];
    return requiredPermissions.some((permission) => this.permissions.includes(permission));
  }

  private resolveContext(): SidebarResolvedContext {
    return {
      context: this.context,
      companyId: this.companyId || this.getCompanyIdFromUrl(),
      branchId: this.branchId || this.getBranchIdFromUrl(),
      cashRegisterId: this.cashRegisterId || this.getCashRegisterIdFromUrl(),
      cashRegisterSessionId: this.cashRegisterSessionId,
      activeItemLabel: this.activeItemLabel,
      permissions: this.permissions,
    };
  }

  private getCompanyIdFromUrl(): string {
    const match = this.router.url.match(/\/company\/([^/]+)/);
    return match?.[1] ?? '';
  }

  private getBranchIdFromUrl(): string {
    const match = this.router.url.match(/\/branch\/([^/]+)/);
    return match?.[1] ?? '';
  }

  private getCashRegisterIdFromUrl(): string {
    const match = this.router.url.match(/\/cash[-_]register\/([^/]+)/);
    return match?.[1] ?? '';
  }

  private getStateKey(): string {
    const context = this.resolveContext();
    return [context.context, context.companyId, context.branchId, context.cashRegisterId].join(':');
  }

  private isGroupOpenByLabel(label: string): boolean {
    return this.openGroups[label] ?? false;
  }

  private syncOpenGroups(): void {
    const stateKey = this.getStateKey();

    if (stateKey !== this.currentStateKey) {
      this.currentStateKey = stateKey;
      this.openGroups = this.sidebarState.getState(stateKey);
    }

    for (const item of this.displayedItems) {
      if (!item.children?.length) {
        continue;
      }

      this.sidebarState.ensureGroupState(stateKey, item.label, this.shouldOpenGroupByDefault(item));
      this.openGroups[item.label] = this.sidebarState.getGroupState(stateKey, item.label) ?? false;
    }
  }

  private shouldOpenGroupByDefault(item: SidebarItem): boolean {
    if (item.expanded === true) {
      return true;
    }

    return item.children?.some((child) => child.active) ?? false;
  }
}

export { SidebarComponent as Sidebar };


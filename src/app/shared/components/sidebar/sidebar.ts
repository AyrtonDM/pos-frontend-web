import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Params, Router, RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly router = inject(Router);

  @Input() items: SidebarItem[] = [];

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

  get backButtonLabel(): string {
    return this.isBranchView() ? 'Volver a Mis Sucursales' : 'Volver a Mis Empresas';
  }

  get backButtonLink(): string[] {
    if (this.isBranchView()) {
      const companyId = this.getCompanyIdFromUrl();
      return companyId
        ? ['/administrator/company', companyId, 'branches']
        : ['/administrator/my-companies'];
    }

    return ['/administrator/my-companies'];
  }

  private isBranchView(): boolean {
    return this.router.url.includes('/branch/');
  }

  private getCompanyIdFromUrl(): string {
    const match = this.router.url.match(/\/administrator\/company\/([^/]+)/);
    return match?.[1] ?? '';
  }

  private syncOpenGroups(): void {
    for (const item of this.items) {
      if (!item.children?.length) {
        continue;
      }

      const hasActiveChild = item.children.some((child) => child.active);
      this.openGroups[item.label] = item.expanded ?? hasActiveChild;
    }
  }
}

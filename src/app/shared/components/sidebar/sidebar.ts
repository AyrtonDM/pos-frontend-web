import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

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

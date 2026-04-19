import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type SidebarItem = {
  label: string;
  link?: string | unknown[];
  active?: boolean;
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Input() items: SidebarItem[] = [];
}

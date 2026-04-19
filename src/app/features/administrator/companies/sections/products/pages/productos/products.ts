import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Navbar } from '../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../shared/components/sidebar/sidebar';
import { CategoriasPanel } from '../../sections/categorias/categorias';
import { ProductosPanel } from '../../sections/productos/productos';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [Navbar, Sidebar, ProductosPanel, CategoriasPanel],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected activeView: 'categorias' | 'productos' = 'productos';

  protected sidebarItems: SidebarItem[] = [];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.activeView = this.resolveView(params.get('view'));
      this.sidebarItems = this.buildSidebarItems();
    });
  }

  private resolveView(rawView: string | null): 'categorias' | 'productos' {
    if (rawView === 'categorias') {
      return rawView;
    }

    return 'productos';
  }

  private buildSidebarItems(): SidebarItem[] {
    return [
      {
        label: 'Sucursales',
        link: ['/administrator/company', this.companyId, 'branches'],
      },
      {
        label: 'Productos',
        active: true,
        expanded: true,
        children: [
          {
            label: 'Productos',
            link: ['/administrator/company', this.companyId, 'products'],
            queryParams: { view: 'productos' },
            active: this.activeView === 'productos',
          },
          {
            label: 'Categorias',
            link: ['/administrator/company', this.companyId, 'products'],
            queryParams: { view: 'categorias' },
            active: this.activeView === 'categorias',
          },
        ],
      },
    ];
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CompanyService } from '../../../../../core/services/company.service';
import { CategoriasPanel } from './sections/categorias/categorias';
import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { ProductosPanel } from './sections/productos/productos';
import { Sidebar, SidebarItem } from '../../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [Navbar, Sidebar, ProductosPanel, CategoriasPanel],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected companyName = '';
  protected activeView: 'categorias' | 'productos' = 'productos';

  protected sidebarItems: SidebarItem[] = [];

  ngOnInit(): void {
    this.cargarNombreEmpresa();

    this.route.queryParamMap.subscribe((params) => {
      this.activeView = this.resolveView(params.get('view'));
      this.sidebarItems = this.buildSidebarItems();
    });
  }

  private cargarNombreEmpresa(): void {
    if (!this.companyId) {
      this.companyName = 'Empresa';
      return;
    }

    this.companyService.obtenerEmpresa(this.companyId).subscribe({
      next: (empresa) => {
        this.companyName = empresa.nombre;
      },
      error: () => {
        this.companyName = 'Empresa';
      },
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
            label: 'Catálogo de Productos',
            link: ['/administrator/company', this.companyId, 'products'],
            queryParams: { view: 'productos' },
            active: this.activeView === 'productos',
          },
          {
            label: 'Categoría',
            link: ['/administrator/company', this.companyId, 'products'],
            queryParams: { view: 'categorias' },
            active: this.activeView === 'categorias',
          },
        ],
      },
    ];
  }
}

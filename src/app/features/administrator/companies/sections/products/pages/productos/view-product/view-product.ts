import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ProductService,
  Producto,
  SubcategoriaProducto,
} from '../../../../../../../../core/services/product.service';
import { Navbar } from '../../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-view-product',
  standalone: true,
  imports: [Navbar, Sidebar, RouterLink],
  templateUrl: './view-product.html',
  styleUrl: './view-product.css',
})
export class ViewProduct implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly productId = Number(this.route.snapshot.paramMap.get('productId') ?? 0);
  protected cargandoProducto = false;
  protected errorProducto = '';
  protected producto: Producto | null = null;
  protected subcategorias: SubcategoriaProducto[] = [];

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Sucursales',
      link: ['/administrator/company', this.companyId, 'branches'],
    },
    {
      label: 'Productos',
      link: ['/administrator/company', this.companyId, 'products'],
      active: true,
    },
  ];

  ngOnInit(): void {
    this.cargarProducto();
    this.cargarSubcategorias();
  }

  protected subcategoriaDelProducto(): SubcategoriaProducto | null {
    if (!this.producto) {
      return null;
    }

    return this.subcategorias.find((item) => item.id_subcategoria === this.producto?.id_subcategoria) ?? null;
  }

  private cargarProducto(): void {
    this.errorProducto = '';

    if (!this.productId) {
      this.errorProducto = 'No se encontro el producto solicitado.';
      return;
    }

    this.cargandoProducto = true;

    this.productService.obtenerProducto(this.productId).subscribe({
      next: (producto) => {
        this.producto = producto;
        this.cargandoProducto = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoProducto = false;
        this.errorProducto = 'No se pudieron cargar los datos del producto.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarSubcategorias(): void {
    this.productService.getSubcategorias().subscribe({
      next: (subcategorias) => {
        this.subcategorias = subcategorias;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }
}

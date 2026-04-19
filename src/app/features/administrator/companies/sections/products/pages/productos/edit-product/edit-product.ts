import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ActualizarProductoRequest,
  ProductService,
  Producto,
  SubcategoriaProducto,
} from '../../../../../../../../core/services/product.service';
import { Navbar } from '../../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [FormsModule, Navbar, Sidebar, RouterLink],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.css',
})
export class EditProduct implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly productId = Number(this.route.snapshot.paramMap.get('productId') ?? 0);
  protected cargandoProducto = false;
  protected guardandoProducto = false;
  protected guardandoImagen = false;
  protected errorEdicion = '';
  protected mensajeEdicion = '';
  protected subcategorias: SubcategoriaProducto[] = [];
  protected imagenActual: string | null = null;
  protected imagenSeleccionada: File | null = null;

  protected readonly form: ActualizarProductoRequest = {
    id_empresa: 0,
    id_subcategoria: 0,
    nombre: '',
    costo: 0,
    precio: 0,
    stock: {
      cantidad: 0,
      stock_min: 0,
      stock_max: 0,
    },
  };

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

  protected guardarProducto(event: SubmitEvent): void {
    event.preventDefault();
    this.errorEdicion = '';
    this.mensajeEdicion = '';

    if (!this.productId) {
      this.errorEdicion = 'No se encontro el producto a editar.';
      return;
    }

    const payload: ActualizarProductoRequest = {
      id_empresa: Number(this.companyId),
      id_subcategoria: Number(this.form.id_subcategoria),
      nombre: this.form.nombre?.trim(),
      costo: this.form.costo,
      precio: this.form.precio,
      stock: this.form.stock,
    };

    if (!payload.id_empresa || !payload.id_subcategoria || !payload.nombre) {
      this.errorEdicion = 'Completa empresa, subcategoria y nombre del producto.';
      return;
    }

    this.guardandoProducto = true;

    this.productService.actualizarProducto(this.productId, payload).subscribe({
      next: () => {
        if (this.imagenSeleccionada) {
          this.actualizarImagenDespuesDeGuardar();
          return;
        }

        this.guardandoProducto = false;
        this.mensajeEdicion = 'Producto actualizado correctamente.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoProducto = false;
        this.errorEdicion = 'No se pudo actualizar el producto.';
        this.cdr.detectChanges();
      },
    });
  }

  protected onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imagenSeleccionada = input.files?.[0] ?? null;
  }

  protected volverListado(): void {
    void this.router.navigate(['/administrator/company', this.companyId, 'products']);
  }

  private cargarProducto(): void {
    this.errorEdicion = '';

    if (!this.productId) {
      this.errorEdicion = 'No se encontro el producto a editar.';
      return;
    }

    this.cargandoProducto = true;

    this.productService.obtenerProducto(this.productId).subscribe({
      next: (producto: Producto) => {
        this.cargandoProducto = false;
        this.imagenActual = producto.imagen ?? null;
        this.form.id_empresa = producto.id_empresa;
        this.form.id_subcategoria = producto.id_subcategoria;
        this.form.nombre = producto.nombre;
        this.form.costo = producto.costo;
        this.form.precio = producto.precio;
        this.form.stock = {
          cantidad: producto.stock.cantidad,
          stock_min: producto.stock.stock_min,
          stock_max: producto.stock.stock_max,
        };
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoProducto = false;
        this.errorEdicion = 'No se pudieron cargar los datos del producto.';
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

  private actualizarImagenDespuesDeGuardar(): void {
    if (!this.imagenSeleccionada) {
      this.guardandoProducto = false;
      this.cdr.detectChanges();
      return;
    }

    this.guardandoImagen = true;
    this.productService.actualizarImagenProducto(this.productId, this.imagenSeleccionada).subscribe({
      next: (productoActualizado) => {
        this.guardandoImagen = false;
        this.guardandoProducto = false;
        this.imagenSeleccionada = null;
        this.imagenActual = productoActualizado.imagen ?? null;
        this.mensajeEdicion = 'Producto e imagen actualizados correctamente.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardandoImagen = false;
        this.guardandoProducto = false;
        this.errorEdicion = 'Se actualizo el producto, pero no se pudo actualizar la imagen.';
        this.cdr.detectChanges();
      },
    });
  }
}

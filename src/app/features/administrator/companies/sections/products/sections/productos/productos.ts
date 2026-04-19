import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CrearProductoRequest,
  ProductService,
  Producto,
  SubcategoriaProducto,
} from '../../../../../../../core/services/product.service';

@Component({
  selector: 'app-productos-panel',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class ProductosPanel implements OnChanges {
  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) companyId = '';
  protected activeTab: 'list' | 'register' = 'list';

  protected readonly productoForm: CrearProductoRequest = {
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

  protected subcategorias: SubcategoriaProducto[] = [];
  protected productos: Producto[] = [];

  protected cargandoDatos = false;
  protected guardandoProducto = false;
  protected eliminandoProductoId: number | null = null;
  protected mostrarModalEliminarProducto = false;
  protected productoPendienteEliminar: Producto | null = null;

  protected errorGeneral = '';
  protected mensajeGeneral = '';
  protected imagenProductoSeleccionada: File | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companyId'] && this.companyId) {
      this.productoForm.id_empresa = this.obtenerIdEmpresaNumerico();
      this.cargarDatos();
    }
  }

  protected setActiveTab(tab: 'list' | 'register'): void {
    this.activeTab = tab;
    this.limpiarMensajes();

    if (tab === 'list') {
      this.cargarProductos();
    }
  }

  protected registrarProducto(event: SubmitEvent): void {
    event.preventDefault();
    this.limpiarMensajes();

    const payload: CrearProductoRequest = {
      id_empresa: this.obtenerIdEmpresaNumerico(),
      id_subcategoria: Number(this.productoForm.id_subcategoria),
      nombre: this.productoForm.nombre.trim(),
      costo: Number(this.productoForm.costo),
      precio: Math.round(Number(this.productoForm.precio) * 100) / 100,
      stock: {
        cantidad: Number(this.productoForm.stock.cantidad),
        stock_min: Number(this.productoForm.stock.stock_min),
        stock_max: Number(this.productoForm.stock.stock_max),
      },
    };

    if (!payload.id_empresa || !payload.id_subcategoria || !payload.nombre) {
      this.errorGeneral = 'Completa empresa, subcategoria y nombre del producto.';
      return;
    }

    this.guardandoProducto = true;

    const request$ = this.imagenProductoSeleccionada
      ? this.productService.crearProductoConImagen(this.construirFormDataProducto(payload, this.imagenProductoSeleccionada))
      : this.productService.crearProducto(payload);

    request$.subscribe({
      next: () => {
        this.guardandoProducto = false;
        this.mensajeGeneral = 'Producto registrado correctamente.';
        this.productoForm.id_subcategoria = 0;
        this.productoForm.nombre = '';
        this.productoForm.costo = 0;
        this.productoForm.precio = 0;
        this.productoForm.stock.cantidad = 0;
        this.productoForm.stock.stock_min = 0;
        this.productoForm.stock.stock_max = 0;
        this.imagenProductoSeleccionada = null;
        this.activeTab = 'list';
        this.cargarProductos();
      },
      error: () => {
        this.guardandoProducto = false;
        this.errorGeneral = 'No se pudo registrar el producto.';
        this.cdr.detectChanges();
      },
    });
  }


  protected cancelarRegistroProducto(): void {
    this.activeTab = 'list';
    this.limpiarMensajes();
    this.productoForm.id_subcategoria = 0;
    this.productoForm.nombre = '';
    this.productoForm.costo = 0;
    this.productoForm.precio = 0;
    this.productoForm.stock.cantidad = 0;
    this.productoForm.stock.stock_min = 0;
    this.productoForm.stock.stock_max = 0;
    this.imagenProductoSeleccionada = null;
  }

  protected onImagenProductoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imagenProductoSeleccionada = input.files?.[0] ?? null;
  }

  protected resolverImagenUrl(producto: Producto): string {
    return producto.imagen ?? '';
  }

  protected eliminarProducto(idProducto: number, nombreProducto: string): void {
    this.limpiarMensajes();

    const producto = this.productos.find((item) => item.id_producto === idProducto);
    if (!producto) {
      this.errorGeneral = 'No se encontro el producto seleccionado.';
      return;
    }

    this.productoPendienteEliminar = producto;
    this.mostrarModalEliminarProducto = true;
  }

  protected cancelarEliminarProducto(): void {
    this.mostrarModalEliminarProducto = false;
    this.productoPendienteEliminar = null;
  }

  protected confirmarEliminarProducto(): void {
    if (!this.productoPendienteEliminar) {
      this.cancelarEliminarProducto();
      return;
    }

    const idProducto = this.productoPendienteEliminar.id_producto;
    this.mostrarModalEliminarProducto = false;

    this.eliminandoProductoId = idProducto;
    this.productService.eliminarProducto(idProducto).subscribe({
      next: () => {
        this.eliminandoProductoId = null;
        this.productoPendienteEliminar = null;
        this.mensajeGeneral = 'Producto eliminado correctamente.';
        this.cargarProductos();
      },
      error: () => {
        this.eliminandoProductoId = null;
        this.productoPendienteEliminar = null;
        this.errorGeneral = 'No se pudo eliminar el producto.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarDatos(): void {
    this.cargandoDatos = true;
    this.limpiarMensajes();

    this.cargarSubcategorias();
    this.cargarProductos(() => {
      this.cargandoDatos = false;
    });
  }

  private cargarSubcategorias(): void {
    this.productService.getSubcategorias().subscribe({
      next: (subcategorias) => {
        this.subcategorias = subcategorias;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorGeneral = 'No se pudieron cargar las subcategorias.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarProductos(onDone?: () => void): void {
    const idEmpresa = this.obtenerIdEmpresaNumerico();
    if (!idEmpresa) {
      this.errorGeneral = 'No se encontro el id de empresa para cargar productos.';
      onDone?.();
      return;
    }

    this.productService.getProductosPorEmpresa(idEmpresa).subscribe({
      next: (productos) => {
        this.productos = productos;
        onDone?.();
        this.cdr.detectChanges();
      },
      error: () => {
        this.productos = [];
        this.errorGeneral = 'No se pudieron cargar los productos.';
        onDone?.();
        this.cdr.detectChanges();
      },
    });
  }

  private obtenerIdEmpresaNumerico(): number {
    const parsed = Number(this.companyId);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private limpiarMensajes(): void {
    this.errorGeneral = '';
    this.mensajeGeneral = '';
  }

  private construirFormDataProducto(payload: CrearProductoRequest, imagen: File): FormData {
    const formData = new FormData();
    formData.append('id_empresa', String(payload.id_empresa));
    formData.append('id_subcategoria', String(payload.id_subcategoria));
    formData.append('nombre', payload.nombre);
    formData.append('costo', String(payload.costo));
    formData.append('precio', String(payload.precio));
    formData.append('cantidad', String(payload.stock.cantidad));
    formData.append('stock_min', String(payload.stock.stock_min));
    formData.append('stock_max', String(payload.stock.stock_max));
    formData.append('imagen', imagen);
    return formData;
  }
}

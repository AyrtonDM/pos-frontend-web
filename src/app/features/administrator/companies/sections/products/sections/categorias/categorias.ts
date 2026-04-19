import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CategoriaProducto,
  CrearCategoriaRequest,
  CrearSubcategoriaRequest,
  ProductService,
  SubcategoriaProducto,
} from '../../../../../../../core/services/product.service';

@Component({
  selector: 'app-categorias-panel',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class CategoriasPanel implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';

  protected activeTab: 'list' | 'register' = 'list';

  protected readonly categoriaForm: CrearCategoriaRequest = {
    nombre: '',
    descripcion: '',
    activo: true,
  };

  protected readonly subcategoriaForm: CrearSubcategoriaRequest = {
    id_categoria_producto: 0,
    nombre: '',
    descripcion: '',
    activo: true,
  };

  protected categorias: CategoriaProducto[] = [];
  protected subcategorias: SubcategoriaProducto[] = [];
  protected subcategoriasTemporales: CrearSubcategoriaRequest[] = [];

  protected cargandoDatos = false;
  protected guardandoCategoria = false;
  protected eliminandoCategoriaId: number | null = null;
  protected mostrarModalEliminarCategoria = false;
  protected categoriaPendienteEliminar: CategoriaProducto | null = null;

  protected errorGeneral = '';
  protected mensajeGeneral = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  protected setActiveTab(tab: 'list' | 'register'): void {
    this.activeTab = tab;
    this.limpiarMensajes();

    if (tab === 'list') {
      this.cargarDatos();
    }
  }

  protected registrarCategoria(event: SubmitEvent): void {
    event.preventDefault();
    this.limpiarMensajes();

    const payload: CrearCategoriaRequest = {
      nombre: this.categoriaForm.nombre.trim(),
      descripcion: this.categoriaForm.descripcion?.trim() ?? '',
      activo: this.categoriaForm.activo,
    };

    if (!payload.nombre) {
      this.errorGeneral = 'El nombre de la categoria es obligatorio.';
      return;
    }

    this.guardandoCategoria = true;
    this.productService.crearCategoria(payload).subscribe({
      next: (nuevaCategoria) => {
        this.crearSubcategoriasDespuesDeCategoria(nuevaCategoria.id_categoria_producto);
      },
      error: () => {
        this.guardandoCategoria = false;
        this.errorGeneral = 'No se pudo registrar la categoria.';
        this.cdr.detectChanges();
      },
    });
  }


  protected registrarSubcategoriaTemporal(): void {
    if (!this.subcategoriaForm.nombre.trim()) {
      this.errorGeneral = 'El nombre de la subcategoria es obligatorio.';
      return;
    }

    this.subcategoriasTemporales.push({
      id_categoria_producto: 0,
      nombre: this.subcategoriaForm.nombre.trim(),
      descripcion: this.subcategoriaForm.descripcion?.trim() ?? '',
      activo: this.subcategoriaForm.activo,
    });

    this.subcategoriaForm.nombre = '';
    this.subcategoriaForm.descripcion = '';
    this.subcategoriaForm.activo = true;
    this.limpiarMensajes();
  }

  protected eliminarSubcategoriaTemporal(index: number): void {
    this.subcategoriasTemporales.splice(index, 1);
  }

  protected eliminarCategoria(idCategoriaProducto: number): void {
    this.limpiarMensajes();
    const categoria = this.categorias.find((item) => item.id_categoria_producto === idCategoriaProducto);
    if (!categoria) {
      this.errorGeneral = 'No se encontro la categoria seleccionada.';
      return;
    }

    this.categoriaPendienteEliminar = categoria;
    this.mostrarModalEliminarCategoria = true;
  }

  protected cancelarEliminarCategoria(): void {
    this.mostrarModalEliminarCategoria = false;
    this.categoriaPendienteEliminar = null;
  }

  protected confirmarEliminarCategoria(): void {
    if (!this.categoriaPendienteEliminar) {
      this.cancelarEliminarCategoria();
      return;
    }

    const idCategoriaProducto = this.categoriaPendienteEliminar.id_categoria_producto;
    this.mostrarModalEliminarCategoria = false;

    this.eliminandoCategoriaId = idCategoriaProducto;
    this.productService.eliminarCategoria(idCategoriaProducto).subscribe({
      next: () => {
        this.eliminandoCategoriaId = null;
        this.categoriaPendienteEliminar = null;
        this.mensajeGeneral = 'Categoria eliminada correctamente.';
        this.cargarDatos();
      },
      error: () => {
        this.eliminandoCategoriaId = null;
        this.categoriaPendienteEliminar = null;
        this.errorGeneral = 'No se pudo eliminar la categoria.';
        this.cdr.detectChanges();
      },
    });
  }

  private crearSubcategoriasDespuesDeCategoria(idCategoria: number): void {
    if (this.subcategoriasTemporales.length === 0) {
      this.guardandoCategoria = false;
      this.mensajeGeneral = 'Categoria registrada correctamente.';
      this.limpiarFormulariosRegistro();
      this.activeTab = 'list';
      this.cargarDatos();
      return;
    }

    const crearSubcategorias = (index: number) => {
      if (index >= this.subcategoriasTemporales.length) {
        this.guardandoCategoria = false;
        this.mensajeGeneral = 'Categoria y subcategorias registradas correctamente.';
        this.limpiarFormulariosRegistro();
        this.activeTab = 'list';
        this.cargarDatos();
        return;
      }

      const subcategoria = this.subcategoriasTemporales[index];
      const payload: CrearSubcategoriaRequest = {
        id_categoria_producto: idCategoria,
        nombre: subcategoria.nombre.trim(),
        descripcion: subcategoria.descripcion?.trim() ?? '',
        activo: subcategoria.activo,
      };

      this.productService.crearSubcategoria(payload).subscribe({
        next: () => {
          crearSubcategorias(index + 1);
        },
        error: () => {
          this.guardandoCategoria = false;
          this.errorGeneral = `Error al crear la subcategoria: ${subcategoria.nombre}`;
          this.cdr.detectChanges();
        },
      });
    };

    crearSubcategorias(0);
  }

  private cargarDatos(): void {
    this.cargandoDatos = true;
    this.limpiarMensajes();

    this.cargarCategorias();
    this.cargarSubcategorias(() => {
      this.cargandoDatos = false;
    });
  }

  private cargarCategorias(): void {
    this.productService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorGeneral = 'No se pudieron cargar las categorias.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarSubcategorias(onDone?: () => void): void {
    this.productService.getSubcategorias().subscribe({
      next: (subcategorias) => {
        this.subcategorias = subcategorias;
        onDone?.();
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorGeneral = 'No se pudieron cargar las subcategorias.';
        onDone?.();
        this.cdr.detectChanges();
      },
    });
  }

  private limpiarFormulariosRegistro(): void {
    this.categoriaForm.nombre = '';
    this.categoriaForm.descripcion = '';
    this.categoriaForm.activo = true;
    this.subcategoriaForm.nombre = '';
    this.subcategoriaForm.descripcion = '';
    this.subcategoriaForm.activo = true;
    this.subcategoriasTemporales = [];
  }

  protected limpiarMensajes(): void {
    this.errorGeneral = '';
    this.mensajeGeneral = '';
  }
}

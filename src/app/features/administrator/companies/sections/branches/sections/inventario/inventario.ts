import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { Producto, ProductService, StockProducto } from '../../../../../../../core/services/product.service';
import { Navbar } from '../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../shared/components/sidebar/sidebar';

type InventoryTab = 'stock' | 'movements';

interface StockItemRow {
  idProducto: number;
  nombre: string;
  cantidad: number;
  stockMin: number | null;
  stockMax: number | null;
}

interface MovementRow {
  id: number | string;
  idProducto: number;
  producto: string;
  cantidad: number;
  tipoMovimiento: string;
  observacion?: string;
}

@Component({
  selector: 'app-inventario',
  imports: [FormsModule, Navbar, Sidebar],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';

  protected activeTab: InventoryTab = 'stock';
  protected showRegisterMovementTab = false;

  protected cargandoStock = false;
  protected cargandoMovimientos = false;
  protected guardandoMovimiento = false;

  protected errorStock = '';
  protected errorMovimientos = '';
  protected errorMovimiento = '';
  protected mensajeMovimiento = '';

  protected productos: Producto[] = [];
  protected stockItems: StockItemRow[] = [];
  protected movements: MovementRow[] = [];

  protected movimientoProductoId: number | null = null;
  protected movimientoCantidad = 1;
  protected movimientoTipoId: number | null = null;
  protected movimientoObservacion = '';

  protected readonly movementTypes: Array<{ id: number; nombre: string }> = [
    { id: 1, nombre: 'Entrada manual' },
    { id: 2, nombre: 'Salida manual' },
    { id: 3, nombre: 'Venta' },
    { id: 4, nombre: 'Ajuste positivo' },
    { id: 5, nombre: 'Ajuste negativo' },
    { id: 6, nombre: 'Merma' },
  ];

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Personal',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'staff'],
    },
    {
      label: 'Inventario',
      active: true,
    },
    {
      label: 'Ventas',
    },
  ];

  ngOnInit(): void {
    this.movimientoTipoId = this.movementTypes[0]?.id ?? null;
    this.cargarInventario();
  }

  protected setActiveTab(tab: InventoryTab): void {
    this.activeTab = tab;
    this.limpiarMensajesMovimiento();

    if (tab === 'stock') {
      this.showRegisterMovementTab = false;
      this.cargarStock();
      return;
    }

    this.cargarMovimientos();
  }

  protected openRegisterMovementTab(): void {
    this.activeTab = 'movements';
    this.showRegisterMovementTab = true;
    this.limpiarMensajesMovimiento();

    if (!this.movimientoProductoId && this.productos.length > 0) {
      this.movimientoProductoId = this.productos[0].id_producto;
    }
  }

  protected closeRegisterMovementTab(): void {
    this.showRegisterMovementTab = false;
    this.limpiarMensajesMovimiento();
  }

  protected registrarMovimiento(event: SubmitEvent): void {
    event.preventDefault();
    this.limpiarMensajesMovimiento();

    const idProducto = Number(this.movimientoProductoId);
    const cantidad = Number(this.movimientoCantidad);
    const idTipoMovimiento = Number(this.movimientoTipoId);

    if (!idProducto || !cantidad || cantidad <= 0 || !idTipoMovimiento) {
      this.errorMovimiento = 'Completa producto, cantidad y tipo de movimiento.';
      return;
    }

    this.guardandoMovimiento = true;

    this.productService
      .crearMovimientoProducto(idProducto, {
        cantidad,
        id_tipo_movimiento: idTipoMovimiento,
        observacion: this.movimientoObservacion.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.guardandoMovimiento = false;
          this.mensajeMovimiento = 'Movimiento registrado correctamente.';
          this.resetMovimientoForm();
          this.showRegisterMovementTab = false;
          this.cargarInventario();
        },
        error: () => {
          this.guardandoMovimiento = false;
          this.errorMovimiento = 'No se pudo registrar el movimiento. Intenta nuevamente.';
          this.cdr.detectChanges();
        },
      });
  }

  private cargarInventario(): void {
    this.cargarStock();
    this.cargarMovimientos();
  }

  private cargarStock(): void {
    this.errorStock = '';
    this.cargandoStock = true;

    this.productService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.movimientoProductoId = this.movimientoProductoId ?? productos[0]?.id_producto ?? null;

        if (productos.length === 0) {
          this.stockItems = [];
          this.cargandoStock = false;
          this.cdr.detectChanges();
          return;
        }

        forkJoin(
          productos.map((producto) =>
            this.productService.getStockProducto(producto.id_producto).pipe(
              catchError(() => of(null as StockProducto | null)),
            ),
          ),
        ).subscribe({
          next: (stocks) => {
            this.stockItems = productos.map((producto, index) => {
              const stock = stocks[index];

              return {
                idProducto: producto.id_producto,
                nombre: producto.nombre,
                cantidad: stock?.cantidad ?? 0,
                stockMin: stock?.stock_min ?? null,
                stockMax: stock?.stock_max ?? null,
              };
            });

            this.cargandoStock = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.stockItems = [];
            this.cargandoStock = false;
            this.errorStock = 'No se pudo cargar el stock de los productos.';
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        this.productos = [];
        this.stockItems = [];
        this.cargandoStock = false;
        this.errorStock = 'No se pudieron cargar los productos del inventario.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarMovimientos(): void {
    this.errorMovimientos = '';
    this.cargandoMovimientos = true;

    this.productService.getProductos().subscribe({
      next: (productos) => {
        if (productos.length === 0) {
          this.movements = [];
          this.cargandoMovimientos = false;
          this.cdr.detectChanges();
          return;
        }

        forkJoin(
          productos.map((producto) =>
            this.productService.getMovimientosProducto(producto.id_producto).pipe(
              catchError(() => of([] as any[])),
            ),
          ),
        ).subscribe({
          next: (movementsByProduct) => {
            this.movements = movementsByProduct
              .flatMap((movimientos, index) =>
                movimientos.map((movimiento, movementIndex) =>
                  this.mapMovimiento(productos[index], movimiento, movementIndex),
                ),
              )
              .reverse();

            this.cargandoMovimientos = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.movements = [];
            this.cargandoMovimientos = false;
            this.errorMovimientos = 'No se pudieron cargar los movimientos del inventario.';
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        this.movements = [];
        this.cargandoMovimientos = false;
        this.errorMovimientos = 'No se pudieron cargar los productos para los movimientos.';
        this.cdr.detectChanges();
      },
    });
  }

  private mapMovimiento(
    producto: Producto,
    movimiento: any,
    fallbackIndex: number,
  ): MovementRow {
    const tipoMovimiento =
      movimiento?.tipo_movimiento?.nombre ??
      movimiento?.tipoMovimiento?.nombre ??
      movimiento?.tipo_movimiento ??
      movimiento?.tipo ??
      'Sin tipo';

    return {
      id: movimiento?.id_movimiento ?? movimiento?.id ?? `${producto.id_producto}-${fallbackIndex}`,
      idProducto: producto.id_producto,
      producto: movimiento?.producto?.nombre ?? producto.nombre,
      cantidad: Number(movimiento?.cantidad ?? 0),
      tipoMovimiento: String(tipoMovimiento),
      observacion: movimiento?.observacion ?? '',
    };
  }

  private resetMovimientoForm(): void {
    this.movimientoCantidad = 1;
    this.movimientoTipoId = this.movementTypes[0]?.id ?? null;
    this.movimientoObservacion = '';
    this.movimientoProductoId = this.productos[0]?.id_producto ?? null;
  }

  private limpiarMensajesMovimiento(): void {
    this.errorMovimiento = '';
    this.mensajeMovimiento = '';
  }
}

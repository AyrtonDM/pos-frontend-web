import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import {
  Producto,
  ProductService,
  StockSucursalProducto,
  TipoMovimiento,
} from '../../../../../../../core/services/product.service';
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
  protected errorTiposMovimiento = '';

  protected productos: Producto[] = [];
  protected stockItems: StockItemRow[] = [];
  protected movements: MovementRow[] = [];
  protected movementTypes: TipoMovimiento[] = [];

  protected movimientoProductoId: number | null = null;
  protected movimientoCantidad = 1;
  protected movimientoTipoId: number | null = null;
  protected movimientoObservacion = '';

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
    this.cargarTiposMovimiento();
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

    if (!this.companyId || !this.branchId) {
      this.errorMovimiento = 'No se encontro la empresa o sucursal para registrar el movimiento.';
      return;
    }

    const idProducto = Number(this.movimientoProductoId);
    const cantidad = Number(this.movimientoCantidad);
    const idTipoMovimiento = Number(this.movimientoTipoId);

    if (!idProducto || !cantidad || cantidad <= 0 || !idTipoMovimiento) {
      this.errorMovimiento = 'Completa producto, cantidad y tipo de movimiento.';
      return;
    }

    this.guardandoMovimiento = true;

    this.productService
      .crearMovimientoProducto(this.companyId, this.branchId, {
        id_producto: idProducto,
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

  private cargarTiposMovimiento(): void {
    this.errorTiposMovimiento = '';

    this.productService.getTiposMovimiento().subscribe({
      next: (tiposMovimiento) => {
        this.movementTypes = tiposMovimiento;

        if (tiposMovimiento.length > 0) {
          const tipoSeleccionadoExiste = tiposMovimiento.some(
            (tipo) => tipo.id_tipo_movimiento === this.movimientoTipoId,
          );

          if (!tipoSeleccionadoExiste) {
            this.movimientoTipoId = tiposMovimiento[0].id_tipo_movimiento;
          }
        } else {
          this.movimientoTipoId = null;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.movementTypes = [];
        this.movimientoTipoId = null;
        this.errorTiposMovimiento = 'No se pudieron cargar los tipos de movimiento.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarStock(): void {
    this.errorStock = '';
    this.cargandoStock = true;

    if (!this.companyId || !this.branchId) {
      this.productos = [];
      this.stockItems = [];
      this.movimientoProductoId = null;
      this.cargandoStock = false;
      this.errorStock = 'No se encontro la empresa o sucursal para cargar el stock.';
      this.cdr.detectChanges();
      return;
    }

    this.productService.getStockSucursal(this.companyId, this.branchId).subscribe({
      next: (stocks: StockSucursalProducto[]) => {
        this.stockItems = stocks.map((stock) => ({
          idProducto: stock.id_producto,
          nombre: stock.nombre_producto,
          cantidad: Number(stock.cantidad ?? 0),
          stockMin: stock.stock_minimo ?? null,
          stockMax: stock.stock_maximo ?? null,
        }));

        this.productos = stocks.map((stock) => ({
          id_producto: stock.id_producto,
          id_subcategoria: null,
          nombre: stock.nombre_producto,
          descripcion: null,
          unidad_medida: stock.unidad_medida,
          precio: stock.precio,
          imagen: stock.imagen ?? null,
          activo: stock.activo,
        }));

        this.movimientoProductoId = this.movimientoProductoId ?? this.productos[0]?.id_producto ?? null;
        this.cargandoStock = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.productos = [];
        this.stockItems = [];
        this.movimientoProductoId = null;
        this.cargandoStock = false;
        this.errorStock = 'No se pudo cargar el stock de la sucursal.';
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
    this.movimientoTipoId = this.movementTypes[0]?.id_tipo_movimiento ?? null;
    this.movimientoObservacion = '';
    this.movimientoProductoId = this.productos[0]?.id_producto ?? null;
  }

  private limpiarMensajesMovimiento(): void {
    this.errorMovimiento = '';
    this.mensajeMovimiento = '';
  }
}

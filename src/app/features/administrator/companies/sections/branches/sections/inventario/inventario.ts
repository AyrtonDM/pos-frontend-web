import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Navbar } from '../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-inventario',
  imports: [FormsModule, Navbar, Sidebar],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected activeTab: 'stock' | 'movements' = 'stock';
  protected cargandoStock = false;
  protected cargandoMovimientos = false;
  protected errorStock = '';
  protected errorMovimientos = '';
  protected stockItems: Array<{ id?: string | number; nombre: string; cantidad: number }> = [];
  protected movements: Array<{
    id?: string | number;
    producto: string;
    tipo: string;
    tipoNombre?: string;
    observacion?: string;
    cantidad: number;
    fecha: string;
  }> = [];

  protected movimientoProducto = '';
  protected movimientoTipo = '';
  protected movimientoObservacion = '';

  protected readonly movementTypes: Array<{ id: number; code: string; nombre: string }> = [
    { id: 1, code: 'ENTRADA', nombre: 'Entrada manual' },
    { id: 2, code: 'SALIDA', nombre: 'Salida manual' },
    { id: 3, code: 'SALIDA', nombre: 'Venta' },
    { id: 4, code: 'ENTRADA', nombre: 'Ajuste positivo' },
    { id: 5, code: 'SALIDA', nombre: 'Ajuste negativo' },
    { id: 6, code: 'SALIDA', nombre: 'Merma' },
  ];
  protected movimientoCantidad = 1;
  protected mensajeMovimiento = '';
  protected errorMovimiento = '';

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
    this.cargarStock();
    if (!this.movimientoTipo && this.movementTypes && this.movementTypes.length) {
      this.movimientoTipo = this.movementTypes[0].code;
    }
  }

  protected movementsView: 'register' | 'list' = 'register';

  protected setMovementsView(view: 'register' | 'list'): void {
    this.movementsView = view;
    if (view === 'list') this.cargarMovimientos();
  }

  protected setActiveTab(tab: 'stock' | 'movements'): void {
    this.activeTab = tab;

    if (tab === 'stock') {
      this.cargarStock();
    } else {
      this.cargarMovimientos();
    }
  }

  private cargarStock(): void {
    this.errorStock = '';

    if (!this.companyId || !this.branchId) {
      this.errorStock = 'No se encontro la sucursal para cargar el stock.';
      return;
    }

    this.cargandoStock = true;

    // No cargar stock simulado: dejar la lista vacía hasta que el backend provea datos
    this.stockItems = [];
    this.cargandoStock = false;
    this.cdr.detectChanges();
  }

  private cargarMovimientos(): void {
    this.errorMovimientos = '';

    if (!this.companyId || !this.branchId) {
      this.errorMovimientos = 'No se encontro la sucursal para cargar los movimientos.';
      return;
    }

    this.cargandoMovimientos = true;

    setTimeout(() => {
      this.movements = [];
      this.cargandoMovimientos = false;
      this.cdr.detectChanges();
    }, 150);
  }

  protected realizarMovimiento(event: SubmitEvent): void {
    event.preventDefault();
    this.errorMovimiento = '';
    this.mensajeMovimiento = '';

    if (!this.movimientoProducto || !this.movimientoCantidad || this.movimientoCantidad <= 0) {
      this.errorMovimiento = 'Completa los campos del movimiento.';
      return;
    }

    const cantidad = Number(this.movimientoCantidad);

    const existente = this.stockItems.find((s) => s.nombre === this.movimientoProducto);

    if (this.movimientoTipo === 'salida' && existente && existente.cantidad < cantidad) {
      this.errorMovimiento = 'Stock insuficiente.';
      return;
    }

    if (existente) {
      existente.cantidad =
        this.movimientoTipo === 'entrada' ? existente.cantidad + cantidad : existente.cantidad - cantidad;
    } else if (this.movimientoTipo === 'entrada') {
      this.stockItems.push({ id: Date.now(), nombre: this.movimientoProducto, cantidad });
    } else {
      this.errorMovimiento = 'No existe el producto para realizar una salida.';
      return;
    }

    const tipoObj = this.movementTypes.find((t) => t.code === this.movimientoTipo) ??
      this.movementTypes[0];

    const movimiento = {
      id: Date.now(),
      producto: this.movimientoProducto,
      tipo: tipoObj?.code ?? 'DESCONOCIDO',
      tipoNombre: tipoObj?.nombre ?? this.movimientoTipo,
      observacion: this.movimientoObservacion || undefined,
      cantidad,
      fecha: new Date().toISOString(),
    };

    this.movements.unshift(movimiento);
    this.mensajeMovimiento = 'Movimiento registrado correctamente.';
    this.movimientoProducto = '';
    this.movimientoCantidad = 1;
    this.movimientoTipo = '';
    this.movimientoObservacion = '';
    this.setMovementsView('list');
    this.cdr.detectChanges();
  }
}

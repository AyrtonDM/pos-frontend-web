import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import {
  CashRegisterResponse,
  CashRegisterService,
} from '../../../../../../../core/services/cash-register.service';
import { Navbar } from '../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../shared/components/sidebar/sidebar';

type CashRegisterTab = 'list' | 'register' | 'edit';

interface CashRegisterItem {
  id: number;
  codigo: string;
  nombre: string;
  fechaCreacion: string;
  activo: boolean;
}

interface CashRegisterForm {
  codigo: string;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-cash-register',
  imports: [FormsModule, Navbar, Sidebar],
  templateUrl: './cash_register.html',
  styleUrl: './cash_register.css',
})
export class CashRegister implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';

  protected activeTab: CashRegisterTab = 'list';
  protected mensaje = '';
  protected error = '';
  protected cargandoCajas = false;
  protected cargandoRegistro = false;
  protected cargandoEdicion = false;
  protected editingCashRegisterId: number | null = null;

  protected registerForm: Omit<CashRegisterForm, 'activo'> = {
    codigo: '',
    nombre: '',
  };

  protected editForm: CashRegisterForm = {
    codigo: '',
    nombre: '',
    activo: true,
  };

  protected cashRegisters: CashRegisterItem[] = [];

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Personal',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'staff'],
    },
    {
      label: 'Cajas',
      active: true,
    },
    {
      label: 'Inventario',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'inventario'],
    },
    {
      label: 'Ventas',
    },
  ];

  ngOnInit(): void {
    this.cargarCajas();
  }

  protected setActiveTab(tab: CashRegisterTab): void {
    if (tab === 'edit' && this.editingCashRegisterId === null) {
      return;
    }

    this.activeTab = tab;
    this.clearMessages();
  }

  private cargarCajas(): void {
    this.clearMessages();

    if (!this.companyId || !this.branchId) {
      this.error = 'No se encontro la empresa o sucursal para cargar las cajas.';
      return;
    }

    this.cargandoCajas = true;

    this.cashRegisterService.getCajasSucursal(this.companyId, this.branchId).subscribe({
      next: (cashRegisters) => {
        this.cashRegisters = cashRegisters.map((cashRegister) =>
          this.mapCashRegisterResponse(cashRegister),
        );
        this.cargandoCajas = false;
      },
      error: () => {
        this.cashRegisters = [];
        this.cargandoCajas = false;
        this.error = 'No se pudieron cargar las cajas registradoras.';
      },
    });
  }

  protected registrarCaja(event: SubmitEvent): void {
    event.preventDefault();
    this.clearMessages();

    const codigo = this.registerForm.codigo.trim();
    const nombre = this.registerForm.nombre.trim();

    if (!codigo || !nombre) {
      this.error = 'Completa el codigo y nombre de la caja.';
      return;
    }

    if (!this.branchId) {
      this.error = 'No se encontro la sucursal para registrar la caja.';
      return;
    }

    if (this.cashRegisters.some((cashRegister) => cashRegister.codigo.toLowerCase() === codigo.toLowerCase())) {
      this.error = 'Ya existe una caja con ese codigo.';
      return;
    }

    this.cargandoRegistro = true;

    this.cashRegisterService
      .crearCaja(this.branchId, { nombre, codigo })
      .pipe(
        finalize(() => {
          this.cargandoRegistro = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
      next: (cashRegister) => {
        this.cargandoRegistro = false;
        const registeredCashRegister = cashRegister ?? ({} as CashRegisterResponse);

        this.cashRegisters = [
          ...this.cashRegisters,
          this.mapCashRegisterResponse({
            ...registeredCashRegister,
            nombre: registeredCashRegister.nombre ?? nombre,
            codigo: registeredCashRegister.codigo ?? codigo,
          }),
        ];
        this.registerForm = {
          codigo: '',
          nombre: '',
        };
        this.mensaje = 'Caja registrada correctamente.';
        this.activeTab = 'list';
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoRegistro = false;
        this.error = 'No se pudo registrar la caja. Intenta nuevamente.';
        this.cdr.detectChanges();
      },
    });
  }

  protected abrirEdicion(cashRegister: CashRegisterItem): void {
    this.clearMessages();
    this.editingCashRegisterId = cashRegister.id;
    this.editForm = {
      codigo: cashRegister.codigo,
      nombre: cashRegister.nombre,
      activo: cashRegister.activo,
    };
    this.activeTab = 'edit';
  }

  protected cancelarEdicion(): void {
    this.clearMessages();
    this.editingCashRegisterId = null;
    this.editForm = {
      codigo: '',
      nombre: '',
      activo: true,
    };
    this.activeTab = 'list';
  }

  protected guardarCambios(event: SubmitEvent): void {
    event.preventDefault();
    this.clearMessages();

    const codigo = this.editForm.codigo.trim();
    const nombre = this.editForm.nombre.trim();

    if (this.editingCashRegisterId === null) {
      this.error = 'Selecciona una caja para editar.';
      return;
    }

    if (!this.companyId || !this.branchId) {
      this.error = 'No se encontro la empresa o sucursal para actualizar la caja.';
      return;
    }

    if (!codigo || !nombre) {
      this.error = 'Completa el codigo y nombre de la caja.';
      return;
    }

    const codigoRepetido = this.cashRegisters.some(
      (cashRegister) =>
        cashRegister.id !== this.editingCashRegisterId &&
        cashRegister.codigo.toLowerCase() === codigo.toLowerCase(),
    );

    if (codigoRepetido) {
      this.error = 'Ya existe otra caja con ese codigo.';
      return;
    }

    const editingCashRegisterId = this.editingCashRegisterId;

    this.cargandoEdicion = true;

    this.cashRegisterService
      .actualizarCaja(this.companyId, this.branchId, editingCashRegisterId, {
        nombre,
        codigo,
        activo: this.editForm.activo,
      })
      .pipe(
        finalize(() => {
          this.cargandoEdicion = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (cashRegister) => {
          this.cargandoEdicion = false;
          const updatedCashRegister = this.mapCashRegisterResponse({
            ...cashRegister,
            id_caja: cashRegister.id_caja ?? editingCashRegisterId,
            nombre: cashRegister.nombre ?? nombre,
            codigo: cashRegister.codigo ?? codigo,
            activo: cashRegister.activo ?? this.editForm.activo,
          });

          this.cashRegisters = this.cashRegisters.map((currentCashRegister) =>
            currentCashRegister.id === editingCashRegisterId
              ? updatedCashRegister
              : currentCashRegister,
          );

          this.editingCashRegisterId = null;
          this.activeTab = 'list';
          this.mensaje = 'Caja actualizada correctamente.';
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargandoEdicion = false;
          this.error = 'No se pudo actualizar la caja. Intenta nuevamente.';
          this.cdr.detectChanges();
        },
      });
  }

  private getNextId(): number {
    return Math.max(0, ...this.cashRegisters.map((cashRegister) => cashRegister.id)) + 1;
  }

  private mapCashRegisterResponse(cashRegister: CashRegisterResponse): CashRegisterItem {
    return {
      id: cashRegister.id_caja ?? cashRegister.id ?? this.getNextId(),
      codigo: cashRegister.codigo,
      nombre: cashRegister.nombre,
      fechaCreacion: this.formatDate(cashRegister.fecha_creacion ?? cashRegister.fecha_registro),
      activo: cashRegister.activo ?? true,
    };
  }

  private formatDate(date?: string): string {
    if (!date) {
      return this.getCurrentDate();
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsedDate);
  }

  private getCurrentDate(): string {
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date());
  }

  private clearMessages(): void {
    this.error = '';
    this.mensaje = '';
  }
}

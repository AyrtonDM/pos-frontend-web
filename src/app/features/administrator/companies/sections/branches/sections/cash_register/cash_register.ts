import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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
export class CashRegister {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';

  protected activeTab: CashRegisterTab = 'list';
  protected mensaje = '';
  protected error = '';
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

  protected cashRegisters: CashRegisterItem[] = [
    {
      id: 1,
      codigo: 'CJ-001',
      nombre: 'Caja principal',
      fechaCreacion: '15/05/2026',
      activo: true,
    },
    {
      id: 2,
      codigo: 'CJ-002',
      nombre: 'Caja auxiliar',
      fechaCreacion: '15/05/2026',
      activo: true,
    },
  ];

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

  protected setActiveTab(tab: CashRegisterTab): void {
    if (tab === 'edit' && this.editingCashRegisterId === null) {
      return;
    }

    this.activeTab = tab;
    this.clearMessages();
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

    if (this.cashRegisters.some((cashRegister) => cashRegister.codigo.toLowerCase() === codigo.toLowerCase())) {
      this.error = 'Ya existe una caja con ese codigo.';
      return;
    }

    this.cashRegisters = [
      ...this.cashRegisters,
      {
        id: this.getNextId(),
        codigo,
        nombre,
        fechaCreacion: this.getCurrentDate(),
        activo: true,
      },
    ];

    this.registerForm = {
      codigo: '',
      nombre: '',
    };
    this.mensaje = 'Caja registrada correctamente.';
    this.activeTab = 'list';
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

  protected guardarCambios(event: SubmitEvent): void {
    event.preventDefault();
    this.clearMessages();

    const codigo = this.editForm.codigo.trim();
    const nombre = this.editForm.nombre.trim();

    if (this.editingCashRegisterId === null) {
      this.error = 'Selecciona una caja para editar.';
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

    this.cashRegisters = this.cashRegisters.map((cashRegister) =>
      cashRegister.id === this.editingCashRegisterId
        ? {
            ...cashRegister,
            codigo,
            nombre,
            activo: this.editForm.activo,
          }
        : cashRegister,
    );

    this.editingCashRegisterId = null;
    this.activeTab = 'list';
    this.mensaje = 'Caja actualizada correctamente.';
  }

  private getNextId(): number {
    return Math.max(0, ...this.cashRegisters.map((cashRegister) => cashRegister.id)) + 1;
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

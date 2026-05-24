import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  CashRegisterResponse,
  CashRegisterService,
} from '../../../../../../core/services/cash-register.service';
import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../../shared/components/sidebar/sidebar';

interface CashRegisterItem {
  id: number;
  codigo: string;
  nombre: string;
  fechaCreacion: string;
  activo: boolean;
  canOpen: boolean;
  actionLabel: 'Abrir Caja' | 'Continuar Sesion';
  sessionId: number | null;
}

interface CashRegisterOpenPolicy {
  mode: 'none' | 'single-allowed';
  allowedCashRegisterId: number | null;
  sessionId: number | null;
  blockedCashRegisterIds: number[];
  message?: string;
}

@Component({
  selector: 'app-employee-cash-register',
  imports: [Navbar, RouterLink, Sidebar],
  templateUrl: './cash_register.html',
  styleUrl: './cash_register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeCashRegister implements OnInit {
  private static readonly OPEN_POLICY_STORAGE_PREFIX = 'cash-register-open-policy';

  private readonly route = inject(ActivatedRoute);
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('idEmpresa') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';

  protected activeTab: 'list' = 'list';
  protected cashRegisters: CashRegisterItem[] = [];
  protected cargandoCajas = false;
  protected error = '';
  protected mensaje = '';

  private openPolicy: CashRegisterOpenPolicy = {
    mode: 'none',
    allowedCashRegisterId: null,
    sessionId: null,
    blockedCashRegisterIds: [],
  };

  ngOnInit(): void {
    this.openPolicy = this.getOpenPolicy();
    this.mensaje = this.openPolicy.message ?? '';
    this.cargarCajas();
  }

  private cargarCajas(): void {
    this.error = '';

    if (!this.mensaje) {
      this.mensaje = '';
    }

    if (!this.companyId || !this.branchId) {
      this.error = 'No se encontro la empresa o sucursal para cargar las cajas.';
      return;
    }

    this.cargandoCajas = true;

    this.cashRegisterService.getCajasSucursal(this.companyId, this.branchId).subscribe({
      next: (cashRegisters) => {
        this.cashRegisters = cashRegisters
          .map((cashRegister) => this.mapCashRegisterResponse(cashRegister))
          .map((cashRegister) => ({
            ...cashRegister,
            ...this.getCashRegisterActionState(cashRegister),
          }));
        this.cargandoCajas = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cashRegisters = [];
        this.cargandoCajas = false;
        this.error = 'No se pudieron cargar las cajas registradoras.';
        this.cdr.detectChanges();
      },
    });
  }

  private mapCashRegisterResponse(cashRegister: CashRegisterResponse): CashRegisterItem {
    return {
      id: cashRegister.id_caja ?? cashRegister.id ?? 0,
      codigo: cashRegister.codigo,
      nombre: cashRegister.nombre,
      fechaCreacion: this.formatDate(cashRegister.fecha_creacion ?? cashRegister.fecha_registro),
      activo: cashRegister.activo ?? true,
      canOpen: cashRegister.activo ?? true,
      actionLabel: 'Abrir Caja',
      sessionId: null,
    };
  }

  private getCashRegisterActionState(cashRegister: CashRegisterItem): Pick<CashRegisterItem, 'canOpen' | 'actionLabel' | 'sessionId'> {
    if (!cashRegister.activo) {
      return {
        canOpen: false,
        actionLabel: 'Abrir Caja',
        sessionId: null,
      };
    }

    if (this.openPolicy.mode === 'single-allowed') {
      const isAllowedCashRegister = this.openPolicy.allowedCashRegisterId === cashRegister.id;

      return {
        canOpen: isAllowedCashRegister,
        actionLabel: isAllowedCashRegister ? 'Continuar Sesion' : 'Abrir Caja',
        sessionId: isAllowedCashRegister ? this.openPolicy.sessionId : null,
      };
    }

    const isBlocked = this.openPolicy.blockedCashRegisterIds.includes(cashRegister.id);

    return {
      canOpen: !isBlocked,
      actionLabel: 'Abrir Caja',
      sessionId: null,
    };
  }

  private getOpenPolicy(): CashRegisterOpenPolicy {
    const rawPolicy = sessionStorage.getItem(this.getPolicyStorageKey());

    if (!rawPolicy) {
      return {
        mode: 'none',
        allowedCashRegisterId: null,
        sessionId: null,
        blockedCashRegisterIds: [],
      };
    }

    try {
      const parsedPolicy = JSON.parse(rawPolicy) as Partial<CashRegisterOpenPolicy>;
      return {
        mode: parsedPolicy.mode === 'single-allowed' ? 'single-allowed' : 'none',
        allowedCashRegisterId:
          typeof parsedPolicy.allowedCashRegisterId === 'number' ? parsedPolicy.allowedCashRegisterId : null,
        sessionId: typeof parsedPolicy.sessionId === 'number' ? parsedPolicy.sessionId : null,
        blockedCashRegisterIds: Array.isArray(parsedPolicy.blockedCashRegisterIds)
          ? parsedPolicy.blockedCashRegisterIds.filter((id): id is number => typeof id === 'number')
          : [],
        message: typeof parsedPolicy.message === 'string' ? parsedPolicy.message : undefined,
      };
    } catch {
      return {
        mode: 'none',
        allowedCashRegisterId: null,
        sessionId: null,
        blockedCashRegisterIds: [],
      };
    }
  }

  private getPolicyStorageKey(): string {
    return `${EmployeeCashRegister.OPEN_POLICY_STORAGE_PREFIX}:${this.companyId}:${this.branchId}`;
  }

  private formatDate(date?: string): string {
    if (!date) {
      return 'Sin fecha';
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
}

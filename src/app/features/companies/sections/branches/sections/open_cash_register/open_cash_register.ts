import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CashRegisterService } from '../../../../../../core/services/cash-register.service';
import { Navbar } from '../../../../../../shared/components/navbar/navbar';

interface OpenSessionConflictDetail {
  id_caja: number;
  id_caja_sesion: number;
  detail: string;
}

interface CashRegisterOpenPolicy {
  mode: 'none' | 'single-allowed';
  allowedCashRegisterId: number | null;
  sessionId: number | null;
  blockedCashRegisterIds: number[];
  message?: string;
}

@Component({
  selector: 'app-open-cash-register',
  imports: [CommonModule, FormsModule, Navbar, RouterLink],
  templateUrl: './open_cash_register.html',
  styleUrl: './open_cash_register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenCashRegister {
  private static readonly OPEN_POLICY_STORAGE_PREFIX = 'cash-register-open-policy';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cashRegisterService = inject(CashRegisterService);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected readonly cashRegisterId = this.route.snapshot.paramMap.get('cashRegisterId') ?? '';

  protected initialAmount: number | null = null;
  protected note = '';
  protected cargando = false;
  protected mensajeError = '';

  protected abrirCaja(event: SubmitEvent): void {
    event.preventDefault();
    this.mensajeError = '';

    if (this.initialAmount === null || this.initialAmount === undefined || Number.isNaN(this.initialAmount)) {
      this.mensajeError = 'Ingresa un monto inicial valido.';
      return;
    }

    if (!this.cashRegisterId) {
      this.mensajeError = 'No se encontro la caja para abrir la sesion.';
      return;
    }

    this.cargando = true;

    this.cashRegisterService
      .abrirSesionCaja(this.cashRegisterId, {
        monto_inicial: this.initialAmount,
        nota: this.note.trim() || 'Apertura de caja',
      })
      .pipe(
        finalize(() => {
          this.cargando = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.saveOpenPolicy({
            mode: 'single-allowed',
            allowedCashRegisterId: response.id_caja,
            sessionId: response.id_caja_sesion,
            blockedCashRegisterIds: [],
          });

          void this.router.navigate([
            '/company',
            this.companyId,
            'branch',
            this.branchId,
            'cash-register',
            this.cashRegisterId,
            'sales',
          ], {
            queryParams: { sessionId: response.id_caja_sesion },
          });
        },
        error: (error) => {
          const detail = error?.error?.detail;

          if (error?.status === 409 && this.handleConflictDetail(detail)) {
            return;
          }

          this.mensajeError = this.getErrorMessage(detail);
        },
      });
  }

  private getErrorMessage(detail?: string): string {
    switch (detail) {
      case 'Caja no encontrada.':
        return 'No se encontro la caja seleccionada.';
      case 'Empresa no encontrada para este usuario.':
        return 'No se encontro la empresa asociada a este usuario.';
      case 'Usuario no autorizado o inactivo.':
        return 'Tu usuario no esta autorizado o se encuentra inactivo.';
      case 'No se pudo crear la sesion de caja.':
        return 'No se pudo crear la sesion de caja. Intenta nuevamente.';
      default:
        return detail ?? 'No se pudo abrir la caja.';
    }
  }

  private handleConflictDetail(detail: unknown): boolean {
    if (!this.isOpenSessionConflictDetail(detail)) {
      return false;
    }

    if (detail.detail === 'Tienes una sesion abierta aun') {
      const policy: CashRegisterOpenPolicy = {
        mode: 'single-allowed',
        allowedCashRegisterId: detail.id_caja,
        sessionId: detail.id_caja_sesion,
        blockedCashRegisterIds: [],
      };

      this.saveOpenPolicy(policy);
      void this.router.navigate(['/company', this.companyId, 'branch', this.branchId, 'cash-register']);
      return true;
    }

    if (detail.detail === 'Esta caja tiene ya una sesion abierta') {
      const currentPolicy = this.getOpenPolicy();
      const blockedIds = Array.from(new Set([...currentPolicy.blockedCashRegisterIds, detail.id_caja]));

      this.saveOpenPolicy({
        ...currentPolicy,
        blockedCashRegisterIds: blockedIds,
        sessionId: currentPolicy.sessionId,
      });

      void this.router.navigate(['/company', this.companyId, 'branch', this.branchId, 'cash-register']);
      return true;
    }

    return false;
  }

  private isOpenSessionConflictDetail(detail: unknown): detail is OpenSessionConflictDetail {
    if (!detail || typeof detail !== 'object') {
      return false;
    }

    const candidate = detail as Partial<OpenSessionConflictDetail>;
    return typeof candidate.id_caja === 'number' && typeof candidate.detail === 'string';
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

  private saveOpenPolicy(policy: CashRegisterOpenPolicy): void {
    sessionStorage.setItem(this.getPolicyStorageKey(), JSON.stringify(policy));
  }

  private getPolicyStorageKey(): string {
    return `${OpenCashRegister.OPEN_POLICY_STORAGE_PREFIX}:${this.companyId}:${this.branchId}`;
  }
}


import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CashRegisterClosingRequestItem,
  CashRegisterClosingResponse,
  CashRegisterClosingSummaryResponse,
  CashRegisterService,
} from '../../../../../../core/services/cash-register.service';

import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../../shared/components/sidebar/sidebar';

interface CashRegisterClosePolicy {
  mode: 'none' | 'single-allowed';
  allowedCashRegisterId: number | null;
  sessionId: number | null;
  blockedCashRegisterIds: number[];
  message?: string;
}

interface ClosingMethodRow {
  id_metodo_pago: number;
  metodo_pago: string;
  total_ingresos: number;
  total_egresos: number;
  monto_esperado: number;
  montoReal: number | null;
  observacion: string;
}

@Component({
  selector: 'app-close-cash-register',
  imports: [CommonModule, FormsModule, Navbar, Sidebar],
  templateUrl: './close_cash_register.html',
  styleUrl: './close_cash_register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloseCashRegister {
  private static readonly OPEN_POLICY_STORAGE_PREFIX = 'cash-register-open-policy';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('idEmpresa') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected readonly cashRegisterId = this.route.snapshot.paramMap.get('cashRegisterId') ?? '';
  protected cashRegisterSessionId = this.route.snapshot.queryParamMap.get('sessionId') ?? '';

  protected loadingResumen = false;
  protected resumenError = '';
  protected cerrandoCaja = false;
  protected resumenCierre: CashRegisterClosingSummaryResponse | null = null;
  protected cierresMetodoPago: ClosingMethodRow[] = [];

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.cashRegisterSessionId = params.get('sessionId') ?? this.cashRegisterSessionId;
    });

    this.cargarResumenCierre();
  }

  protected get totalEsperado(): number {
    return this.roundCurrency(this.resumenCierre?.monto_esperado_total ?? this.sumExpectedFromCards());
  }

  protected get totalReal(): number {
    return this.roundCurrency(
      this.cierresMetodoPago.reduce((total, cierre) => total + this.normalizeMoney(cierre.montoReal), 0),
    );
  }

  protected get diferenciaTotal(): number {
    return this.roundCurrency(this.totalReal - this.totalEsperado);
  }

  protected getDiferencia(cierre: ClosingMethodRow): number {
    return this.roundCurrency(this.normalizeMoney(cierre.montoReal) - cierre.monto_esperado);
  }

  protected formatCurrency(value: number): string {
    return this.roundCurrency(value).toFixed(2);
  }

  protected trackCierreMetodoPago(_: number, cierre: ClosingMethodRow): number {
    return cierre.id_metodo_pago;
  }

  protected cancelar(): void {
    void this.router.navigate(['/employee/company', this.companyId, 'branch', this.branchId, 'cash_registers']);
  }

  protected cerrarCaja(): void {
    if (this.cerrandoCaja) {
      return;
    }

    if (!this.cashRegisterSessionId) {
      this.resumenError = 'No se encontro la sesion de caja para cerrar.';
      return;
    }

    if (this.cierresMetodoPago.length === 0) {
      this.resumenError = 'No hay metodos de pago disponibles para cerrar la caja.';
      return;
    }

    const payload = this.cierresMetodoPago.map((cierre): CashRegisterClosingRequestItem => {
      const montoReal = this.normalizeMoney(cierre.montoReal);

      return {
        id_metodo_pago: cierre.id_metodo_pago,
        monto_esperado: this.roundCurrency(cierre.monto_esperado),
        monto_real: montoReal,
        diferencia: this.roundCurrency(montoReal - cierre.monto_esperado),
        observacion: cierre.observacion.trim() ? cierre.observacion.trim() : null,
      };
    });

    this.cerrandoCaja = true;
    this.resumenError = '';

    this.cashRegisterService.cerrarSesionCaja(this.cashRegisterSessionId, payload).subscribe({
      next: (_response: CashRegisterClosingResponse) => {
        this.saveOpenPolicy({
          mode: 'none',
          allowedCashRegisterId: null,
          sessionId: null,
          blockedCashRegisterIds: [],
          message: 'Caja cerrada correctamente.',
        });

        void this.router.navigate(['/employee/company', this.companyId, 'branch', this.branchId, 'cash_registers']);
      },
      error: () => {
        this.cerrandoCaja = false;
        this.resumenError = 'No se pudo cerrar la caja. Intenta nuevamente.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarResumenCierre(): void {
    if (!this.cashRegisterSessionId) {
      this.resumenError = 'No se encontro la sesion de caja para cargar el cierre.';
      return;
    }

    this.loadingResumen = true;
    this.resumenError = '';

    this.cashRegisterService.getResumenCierreCajaSesion(this.cashRegisterSessionId).subscribe({
      next: (resumen) => {
        this.resumenCierre = resumen;
        this.cierresMetodoPago = (resumen.resumen_por_metodo_pago ?? []).map((metodo) => ({
          id_metodo_pago: metodo.id_metodo_pago,
          metodo_pago: metodo.metodo_pago,
          total_ingresos: Number(metodo.total_ingresos ?? 0),
          total_egresos: Number(metodo.total_egresos ?? 0),
          monto_esperado: Number(metodo.monto_esperado ?? 0),
          montoReal: null,
          observacion: '',
        }));
        this.loadingResumen = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.resumenCierre = null;
        this.cierresMetodoPago = [];
        this.loadingResumen = false;
        this.resumenError = 'No se pudo cargar el resumen de cierre de caja.';
        this.cdr.detectChanges();
      },
    });
  }

  private sumExpectedFromCards(): number {
    return this.cierresMetodoPago.reduce((total, cierre) => total + Number(cierre.monto_esperado ?? 0), 0);
  }

  private normalizeMoney(value: number | null): number {
    return Math.max(0, this.roundCurrency(Number(value) || 0));
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private saveOpenPolicy(policy: CashRegisterClosePolicy): void {
    sessionStorage.setItem(this.getPolicyStorageKey(), JSON.stringify(policy));
  }

  private getPolicyStorageKey(): string {
    return `${CloseCashRegister.OPEN_POLICY_STORAGE_PREFIX}:${this.companyId}:${this.branchId}`;
  }

}

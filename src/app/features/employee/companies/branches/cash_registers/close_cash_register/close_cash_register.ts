import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../../shared/components/sidebar/sidebar';

interface CashRegisterClosePolicy {
  mode: 'none' | 'single-allowed';
  allowedCashRegisterId: number | null;
  sessionId: number | null;
  blockedCashRegisterIds: number[];
  message?: string;
}

interface PaymentCloseSummary {
  id: number;
  metodoPago: string;
  montoEsperado: number;
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

  protected readonly companyId = this.route.snapshot.paramMap.get('idEmpresa') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected readonly cashRegisterId = this.route.snapshot.paramMap.get('cashRegisterId') ?? '';

  protected cerrandoCaja = false;

  protected readonly cierresMetodoPago: PaymentCloseSummary[] = [
    {
      id: 1,
      metodoPago: 'Efectivo',
      montoEsperado: 845.5,
      montoReal: null,
      observacion: '',
    },
    {
      id: 2,
      metodoPago: 'QR',
      montoEsperado: 320,
      montoReal: null,
      observacion: '',
    },
    {
      id: 3,
      metodoPago: 'Tarjeta',
      montoEsperado: 510.75,
      montoReal: null,
      observacion: '',
    },
  ];

  protected get totalEsperado(): number {
    return this.roundCurrency(
      this.cierresMetodoPago.reduce((total, cierre) => total + cierre.montoEsperado, 0),
    );
  }

  protected get totalReal(): number {
    return this.roundCurrency(
      this.cierresMetodoPago.reduce((total, cierre) => total + this.normalizeMoney(cierre.montoReal), 0),
    );
  }

  protected get diferenciaTotal(): number {
    return this.roundCurrency(this.totalReal - this.totalEsperado);
  }

  protected getDiferencia(cierre: PaymentCloseSummary): number {
    return this.roundCurrency(this.normalizeMoney(cierre.montoReal) - cierre.montoEsperado);
  }

  protected formatCurrency(value: number): string {
    return this.roundCurrency(value).toFixed(2);
  }

  protected trackCierreMetodoPago(_: number, cierre: PaymentCloseSummary): number {
    return cierre.id;
  }

  protected cancelar(): void {
    void this.router.navigate(['/employee/company', this.companyId, 'branch', this.branchId, 'cash_registers']);
  }

  protected cerrarCaja(): void {
    this.cerrandoCaja = true;
    this.saveOpenPolicy({
      mode: 'none',
      allowedCashRegisterId: null,
      sessionId: null,
      blockedCashRegisterIds: [],
      message: 'Caja cerrada correctamente.',
    });

    void this.router.navigate(['/employee/company', this.companyId, 'branch', this.branchId, 'cash_registers']);
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

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CashRegisterService } from '../../../../../../core/services/cash-register.service';
import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-open-cash-register',
  imports: [CommonModule, FormsModule, Navbar, RouterLink, Sidebar],
  templateUrl: './open_cash_register.html',
  styleUrl: './open_cash_register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenCashRegister {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cashRegisterService = inject(CashRegisterService);

  protected readonly companyId = this.route.snapshot.paramMap.get('idEmpresa') ?? '';
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
        next: () => {
          void this.router.navigate([
            '/employee/company',
            this.companyId,
            'branch',
            this.branchId,
            'cash_register',
            this.cashRegisterId,
            'sales',
          ]);
        },
        error: (error) => {
          this.mensajeError = error?.error?.detail ?? 'No se pudo abrir la caja.';
        },
      });
  }
}

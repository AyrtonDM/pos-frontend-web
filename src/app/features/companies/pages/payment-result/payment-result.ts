import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ConfirmarResponse, PagoService, SuscripcionActiva } from '../../../../core/services/pago.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.css',
})
export class PaymentResultComponent implements OnInit {
  estado: 'cargando' | 'exito' | 'error' | 'cancelado' = 'cargando';
  mensajeError: string | null = null;
  suscripcion: SuscripcionActiva | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pagoService: PagoService,
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('/cancel')) {
      this.estado = 'cancelado';
      return;
    }

    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!sessionId) {
      this.estado = 'error';
      this.mensajeError = 'No se encontro el ID de sesion del pago.';
      return;
    }

    this.confirmarPago(sessionId);
  }

  confirmarPago(sessionId: string, intentos = 0): void {
    const maxIntentos = 5;
    this.estado = 'cargando';

    this.pagoService.confirmarPago({ session_id: sessionId }).subscribe({
      next: (response: ConfirmarResponse) => {
        if (response.mensaje?.includes('ya fue procesado')) {
          this.volverMisEmpresas();
          return;
        }

        this.estado = 'exito';
        this.suscripcion = response.suscripcion ?? null;
      },
      error: (err: any) => {
        const errorBody = err.error?.detail || err.error;

        if (errorBody?.mensaje?.includes('ya fue procesado')) {
          this.volverMisEmpresas();
          return;
        }

        if (intentos < maxIntentos) {
          setTimeout(() => this.confirmarPago(sessionId, intentos + 1), 3000);
          return;
        }

        this.estado = 'error';
        this.mensajeError =
          errorBody?.mensaje || errorBody || 'Ocurrio un error al confirmar el pago. Por favor contacte a soporte.';
        console.error('Error al confirmar pago', err);
      },
    });
  }

  volverMisEmpresas(): void {
    void this.router.navigate(['/my-companies']);
  }
}

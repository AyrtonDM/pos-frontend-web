import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PagoService, SuscripcionActiva, ConfirmarResponse } from '../../../../../core/services/pago.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.css'
})
export class PaymentResultComponent implements OnInit {
  estado: 'cargando' | 'exito' | 'error' | 'cancelado' = 'cargando';
  mensajeError: string | null = null;
  suscripcion: SuscripcionActiva | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagoService: PagoService
  ) {}

  ngOnInit(): void {
    const url = this.router.url;
    
    if (url.includes('/cancel')) {
      this.estado = 'cancelado';
      return;
    }

    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    
    if (!sessionId) {
      this.estado = 'error';
      this.mensajeError = 'No se encontró el ID de sesión del pago.';
      return;
    }

    this.confirmarPago(sessionId);
  }

  confirmarPago(sessionId: string): void {
    this.estado = 'cargando';
    this.pagoService.confirmarPago({ session_id: sessionId }).subscribe({
      next: (response: ConfirmarResponse) => {
        this.estado = 'exito';
        if (response.suscripcion) {
          this.suscripcion = response.suscripcion;
        }
      },
      error: (err: any) => {
        this.estado = 'error';
        this.mensajeError = err.error?.detail || 'Ocurrió un error al confirmar el pago. Por favor contacte a soporte.';
        console.error('Error al confirmar pago', err);
      }
    });
  }

  volverMisEmpresas(): void {
    this.router.navigate(['/administrator/my-companies']);
  }
}

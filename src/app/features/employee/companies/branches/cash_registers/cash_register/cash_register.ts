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
}

@Component({
  selector: 'app-employee-cash-register',
  imports: [Navbar, RouterLink, Sidebar],
  templateUrl: './cash_register.html',
  styleUrl: './cash_register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeCashRegister implements OnInit {
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

  ngOnInit(): void {
    this.cargarCajas();
  }

  private cargarCajas(): void {
    this.error = '';
    this.mensaje = '';

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
    };
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

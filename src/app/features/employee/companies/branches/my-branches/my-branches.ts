import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Navbar } from '../../../../../shared/components/navbar/navbar';

import {
  EmployeeBranchAssignment,
  EmployeeBranchService,
} from '../../../../../core/services/employee-branch.service';

@Component({
  selector: 'app-employee-branches',
  imports: [Navbar, RouterLink],
  templateUrl: './my-branches.html',
  styleUrl: './my-branches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeBranches implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeBranchService = inject(EmployeeBranchService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly companyId = this.route.snapshot.paramMap.get('idEmpresa') ?? '';

  protected sucursales: EmployeeBranchAssignment[] = [];
  protected cargandoSucursales = false;
  protected errorSucursales = '';

  ngOnInit(): void {
    this.cargarMisSucursales();
  }

  protected obtenerIdAsignacion(asignacion: EmployeeBranchAssignment): number {
    return asignacion.id_usuario_rol;
  }

  protected obtenerIdSucursal(asignacion: EmployeeBranchAssignment): number {
    return asignacion.sucursal.id_sucursal ?? asignacion.id_sucursal;
  }

  private cargarMisSucursales(): void {
    this.cargandoSucursales = true;
    this.errorSucursales = '';

    if (!this.companyId) {
      this.sucursales = [];
      this.cargandoSucursales = false;
      this.errorSucursales = 'No se encontro la empresa para cargar tus sucursales.';
      return;
    }

    this.employeeBranchService.getMisSucursalesEmpleado(this.companyId).subscribe({
      next: (sucursales) => {
        this.sucursales = sucursales;
        this.cargandoSucursales = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.sucursales = [];
        this.cargandoSucursales = false;
        this.errorSucursales = 'No se pudieron cargar tus sucursales. Intenta nuevamente.';
        this.cdr.detectChanges();
      },
    });
  }
}

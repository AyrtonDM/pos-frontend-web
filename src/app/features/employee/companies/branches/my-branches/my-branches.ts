import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Navbar } from '../../../../../shared/components/navbar/navbar';

import {
  EmployeeBranchAssignment,
  EmployeeBranchService,
} from '../../../../../core/services/employee-branch.service';

@Component({
  selector: 'app-employee-branches',
  imports: [Navbar],
  templateUrl: './my-branches.html',
  styleUrl: './my-branches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeBranches implements OnInit {
  private readonly employeeBranchService = inject(EmployeeBranchService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected sucursales: EmployeeBranchAssignment[] = [];
  protected cargandoSucursales = false;
  protected errorSucursales = '';

  ngOnInit(): void {
    this.cargarMisSucursales();
  }

  protected obtenerIdAsignacion(asignacion: EmployeeBranchAssignment): number {
    return asignacion.id_usuario_rol;
  }

  private cargarMisSucursales(): void {
    this.cargandoSucursales = true;
    this.errorSucursales = '';

    this.employeeBranchService.getMisSucursalesEmpleado().subscribe({
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

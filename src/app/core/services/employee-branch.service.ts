import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface EmployeeCompany {
  id_empresa: number;
  nombre: string;
  razon_social: string;
  nit: string;
  correo: string;
  fecha_creacion: string;
  activo: boolean;
}

export interface EmployeeBranch {
  id_sucursal: number;
  id_empresa: number;
  nombre: string;
  direccion: string;
  telefono: string;
  ciudad: string;
  fecha_registro: string;
  activo: boolean;
}

export interface EmployeeBranchAssignment {
  id_usuario_rol: number;
  id_usuario: number;
  id_rol: number;
  id_empresa: number;
  id_sucursal: number;
  activo: boolean;
  empresa: EmployeeCompany;
  sucursal: EmployeeBranch;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeBranchService {
  constructor(private readonly apiService: ApiService) {}

  getMisSucursalesEmpleado(idEmpresa?: string | number): Observable<EmployeeBranchAssignment[]> {
    const path = typeof idEmpresa !== 'undefined' && idEmpresa !== null
      ? `/api/sucursales/mis-sucursales-empleado/${idEmpresa}`
      : `/api/sucursales/mis-sucursales-empleado`;
    return this.apiService.get<EmployeeBranchAssignment[]>(path);
  }
}

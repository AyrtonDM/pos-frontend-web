import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface Company {
  idEmpresa?: string | number;
  id_empresa?: string | number;
  empresa_id?: string | number;
  id?: string | number;
  nombre: string;
  razon_social: string;
  nit: string;
  correo: string;
  fecha_registro?: string;
  activo?: boolean;
}

export interface CreateCompanyRequest {
  nombre: string;
  razon_social: string;
  nit: string;
  correo: string;
}

export interface UpdateCompanyRequest extends CreateCompanyRequest {
  activo: boolean;
}

export interface CreateBranchRequest {
  nombre: string;
  direccion: string;
  telefono: string;
  ciudad: string;
}

export interface UpdateBranchRequest extends CreateBranchRequest {
  activo: boolean;
}

export interface Branch {
  id?: string | number;
  idSucursal?: string | number;
  id_sucursal?: string | number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  ciudad?: string;
  activo?: boolean;
  fecha_registro?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  constructor(private readonly apiService: ApiService) {}

  getMisEmpresas(): Observable<Company[]> {
    return this.apiService.get<Company[]>('/api/empresas/mis-empresas');
  }

  obtenerEmpresa(idEmpresa: string): Observable<Company> {
    return this.apiService.get<Company>(`/api/empresas/${idEmpresa}`);
  }

  crearEmpresa(payload: CreateCompanyRequest): Observable<Company> {
    return this.apiService.post<Company, CreateCompanyRequest>('/api/empresas/crear', payload);
  }

  actualizarEmpresa(idEmpresa: string, payload: UpdateCompanyRequest): Observable<Company> {
    return this.apiService.put<Company, UpdateCompanyRequest>(
      `/api/empresas/${idEmpresa}`,
      payload,
    );
  }

  crearSucursal(idEmpresa: string, payload: CreateBranchRequest): Observable<Branch> {
    return this.apiService.post<Branch, CreateBranchRequest>(
      `/api/empresas/${idEmpresa}/sucursales`,
      payload,
    );
  }

  getSucursales(idEmpresa: string): Observable<Branch[]> {
    return this.apiService.get<Branch[]>(`/api/empresas/${idEmpresa}/sucursales`);
  }

  obtenerSucursal(idEmpresa: string, idSucursal: string): Observable<Branch> {
    return this.apiService.get<Branch>(`/api/empresas/${idEmpresa}/sucursales/${idSucursal}`);
  }

  actualizarSucursal(idSucursal: string, payload: UpdateBranchRequest): Observable<Branch> {
    return this.apiService.put<Branch, UpdateBranchRequest>(
      `/api/sucursales/${idSucursal}`,
      payload,
    );
  }
}

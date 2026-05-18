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
  fecha_creacion?: string;
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

export interface InviteEmployeeRequest {
  email: string;
}

export interface InviteEmployeeResponse {
  mensaje?: string;
  message?: string;
  [key: string]: unknown;
}

export interface InviteClientRequest {
  email: string;
}

export interface InviteClientResponse {
  mensaje: string;
  email: string;
  link_invitacion: string;
}

export interface ClientPerson {
  id_persona: number;
  nombre_completo: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  documento: string;
}

export interface ClientUser {
  id_usuario: number;
  email: string;
  activo: boolean;
  persona?: ClientPerson;
}

export interface ClientRole {
  id_usuario_rol: number;
  id_usuario: number;
  id_rol: number;
  id_empresa: number;
  id_sucursal: number | null;
  activo: boolean;
  usuario: ClientUser;
}

export interface EmployeeRole {
  id_usuario_rol: number;
  id_usuario: number;
  id_rol: number;
  id_empresa: number;
  id_sucursal: number;
  activo: boolean;
  usuario: {
    id_usuario: number;
    email: string;
    activo: boolean;
    persona?: {
      id_persona: number;
      nombre_completo: string;
      fecha_nacimiento: string;
      genero: string;
      telefono: string;
      documento: string;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  constructor(private readonly apiService: ApiService) {}

  getMisEmpresas(): Observable<Company[]> {
    return this.apiService.get<Company[]>('/api/empresas/mis-empresas');
  }

  getMisEmpresasEmpleado(): Observable<Company[]> {
    return this.apiService.get<Company[]>('/api/empresas/mis-empresas-empleado');
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

  invitarEmpleado(
    idEmpresa: string,
    idSucursal: string,
    payload: InviteEmployeeRequest,
  ): Observable<InviteEmployeeResponse> {
    return this.apiService.post<InviteEmployeeResponse, InviteEmployeeRequest>(
      `/api/empresas/${idEmpresa}/sucursales/${idSucursal}/invitar-empleado`,
      payload,
    );
  }

  invitarCliente(idEmpresa: string, payload: InviteClientRequest): Observable<InviteClientResponse> {
    return this.apiService.post<InviteClientResponse, InviteClientRequest>(
      `/api/empresas/${idEmpresa}/invitar-cliente`,
      payload,
    );
  }

  getClientesEmpresa(idEmpresa: string): Observable<ClientRole[]> {
    return this.apiService.get<ClientRole[]>(`/api/empresas/${idEmpresa}/clientes`);
  }

  getEmpleadosSucursal(idEmpresa: string, idSucursal: string): Observable<EmployeeRole[]> {
    return this.apiService.get<EmployeeRole[]>(
      `/api/empresas/${idEmpresa}/sucursales/${idSucursal}/empleados`,
    );
  }
}

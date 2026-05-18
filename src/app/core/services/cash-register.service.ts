import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface CreateCashRegisterRequest {
  nombre: string;
  codigo: string;
}

export interface UpdateCashRegisterRequest extends CreateCashRegisterRequest {
  activo: boolean;
}

export interface CashRegisterResponse {
  id?: number;
  id_caja: number;
  id_sucursal: number;
  codigo: string;
  nombre: string;
  fecha_creacion: string;
  fecha_registro?: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CashRegisterService {
  constructor(private readonly apiService: ApiService) {}

  getCajasSucursal(idEmpresa: string, idSucursal: string): Observable<CashRegisterResponse[]> {
    return this.apiService.get<CashRegisterResponse[]>(
      `/api/empresas/${idEmpresa}/sucursales/${idSucursal}/cajas`,
    );
  }

  crearCaja(idSucursal: string, payload: CreateCashRegisterRequest): Observable<CashRegisterResponse> {
    return this.apiService.post<CashRegisterResponse, CreateCashRegisterRequest>(
      `/api/sucursales/${idSucursal}/cajas`,
      payload,
    );
  }

  actualizarCaja(
    idEmpresa: string,
    idSucursal: string,
    idCaja: number,
    payload: UpdateCashRegisterRequest,
  ): Observable<CashRegisterResponse> {
    return this.apiService.put<CashRegisterResponse, UpdateCashRegisterRequest>(
      `/api/empresas/${idEmpresa}/sucursales/${idSucursal}/cajas/${idCaja}`,
      payload,
    );
  }
}

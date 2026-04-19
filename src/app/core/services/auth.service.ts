import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface RegisterRequest {
  email: string;
  contrasena: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  documento: string;
}

export interface RegisterResponse {
  usuario_id?: number;
  email?: string;
  activo?: boolean;
  mensaje?: string;
  message?: string;
  email_enviado?: boolean | string | number;
  emailEnviado?: boolean | string | number;
  registered?: boolean | string | number;
  data?: {
    email_enviado?: boolean | string | number;
    emailEnviado?: boolean | string | number;
    registered?: boolean | string | number;
  };
}

export interface VerifyCodeRequest {
  email: string;
  codigo: string;
}

export interface VerifyCodeResponse {
  mensaje?: string;
  activo?: boolean;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly apiService: ApiService) {}

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.apiService.post<RegisterResponse, RegisterRequest>('/api/auth/register', payload);
  }

  verifyCode(payload: VerifyCodeRequest): Observable<VerifyCodeResponse> {
    return this.apiService.post<VerifyCodeResponse, VerifyCodeRequest>(
      '/api/auth/verify-code',
      payload,
    );
  }
}

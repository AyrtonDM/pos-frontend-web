import { Injectable } from '@angular/core';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { CompanyService } from '../services/company.service';
import { EmployeeBranchService } from '../services/employee-branch.service';

@Injectable({ providedIn: 'root' })
export class FcmService {
  private vapidKey = 'REPLACE_WITH_VAPID_KEY';
  private firebaseConfig = {
    apiKey: 'AIzaSyA-wTcvwf5gh8mtYFaYXN8VeY-kxYiQ8v8',
    authDomain: 'pos-si2.firebaseapp.com',
    projectId: 'pos-si2',
    storageBucket: 'pos-si2.firebasestorage.app',
    messagingSenderId: '181449830908',
    appId: '1:181449830908:web:eab5f979040782aa218279'
  };

  constructor(
    private readonly authService: AuthService,
    private readonly companyService: CompanyService,
    private readonly employeeBranchService: EmployeeBranchService,
  ) {}

  async registerToken(apiBase: string, idEmpresa?: number | null) {
    // request permission
    if (!('Notification' in window)) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // load firebase scripts dynamically
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { initializeApp } = await import('firebase/app');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    const app = initializeApp(this.firebaseConfig);
    const messaging = getMessaging(app);
    const serviceWorkerRegistration = 'serviceWorker' in navigator
      ? await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      : null;
    onMessage(messaging, (payload: any) => {
      window.dispatchEvent(
        new CustomEvent('stock-notification', {
          detail: payload,
        }),
      );
    });
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: serviceWorkerRegistration || undefined,
      });
      if (currentToken) {
        const idsEmpresa = await this.obtenerEmpresasContexto(idEmpresa);
        if (idsEmpresa.length === 0) {
          return currentToken;
        }

        await Promise.all(
          idsEmpresa.map((empresaId) =>
            axios.post(`${apiBase}/notifications/register-token`, {
              token: currentToken,
              id_empresa: empresaId,
            }),
          ),
        );
        return currentToken;
      }
    } catch (err) {
      console.error('FCM getToken error', err);
    }
    return null;
  }

  async obtenerEmpresasContexto(idEmpresa?: number | null): Promise<number[]> {
    if (typeof idEmpresa === 'number' && Number.isFinite(idEmpresa)) {
      return [idEmpresa];
    }

    if (!this.authService.isAuthenticated()) {
      return [];
    }

    const roles = this.authService.getUserRoles();
    const idsEmpresa = new Set<number>();

    if (roles.includes('administrador') || roles.includes('admin')) {
      const companies = await firstValueFrom(this.companyService.getMisEmpresas());
      for (const company of companies) {
        const companyId = this.extraerIdEmpresa(company);
        if (companyId !== null) {
          idsEmpresa.add(companyId);
        }
      }
      return Array.from(idsEmpresa);
    }

    const assignments = await firstValueFrom(this.employeeBranchService.getMisSucursalesEmpleado());
    for (const assignment of assignments) {
      if (typeof assignment.id_empresa === 'number' && Number.isFinite(assignment.id_empresa)) {
        idsEmpresa.add(assignment.id_empresa);
      }
    }

    return Array.from(idsEmpresa);
  }

  private extraerIdEmpresa(company: {
    idEmpresa?: string | number;
    id_empresa?: string | number;
    empresa_id?: string | number;
    id?: string | number;
  }): number | null {
    const rawId = company.idEmpresa ?? company.id_empresa ?? company.empresa_id ?? company.id;
    const parsedId = typeof rawId === 'number' ? rawId : Number(rawId);
    return Number.isFinite(parsedId) ? parsedId : null;
  }

}

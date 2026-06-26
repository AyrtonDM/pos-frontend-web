import { Injectable } from '@angular/core';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { CompanyService } from '../services/company.service';
import { ApiService } from '../services/api.service';
import { environments } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class FcmService {
  private vapidKey = environments.firebaseVapidKey;
  private firebaseConfig = environments.firebase;

  constructor(
    private readonly authService: AuthService,
    private readonly companyService: CompanyService,
    private readonly apiService: ApiService,
  ) {}

  async registerToken(apiBase?: string, idEmpresa?: number | null) {
    const base = apiBase ?? this.apiService.getBaseUrl();
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
    const { getMessaging, getToken, onMessage, isSupported } = await import('firebase/messaging');

    // Salir silenciosamente en browsers que no soportan FCM (Safari antiguo, Firefox sin Push API, etc.)
    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.warn('[FCM] Firebase Messaging no soportado en este navegador.');
      return null;
    }

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
            axios.post(`${base}/notifications/register-token`, {
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

  getApiBase(): string {
    return this.apiService.getBaseUrl();
  }

  async obtenerEmpresasContexto(idEmpresa?: number | null): Promise<number[]> {
    if (typeof idEmpresa === 'number' && Number.isFinite(idEmpresa)) {
      return [idEmpresa];
    }

    if (!this.authService.isAuthenticated()) {
      return [];
    }

    const idsEmpresa = new Set<number>();
    const companies = await firstValueFrom(this.companyService.getMisEmpresas());

    for (const company of companies) {
      const companyId = this.extraerIdEmpresa(company);
      if (companyId !== null) {
        idsEmpresa.add(companyId);
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

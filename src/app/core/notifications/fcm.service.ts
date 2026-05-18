import { Injectable } from '@angular/core';
import axios from 'axios';

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

  constructor() {}

  async registerToken(apiBase: string) {
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
    try {
      const currentToken = await getToken(messaging, { vapidKey: this.vapidKey });
      if (currentToken) {
        await axios.post(`${apiBase}/notifications/register-token`, { token: currentToken, id_empresa: 1 });
        return currentToken;
      }
    } catch (err) {
      console.error('FCM getToken error', err);
    }
    return null;
  }

}

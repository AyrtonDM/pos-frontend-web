import { Component, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { FcmService } from '../../../core/notifications/fcm.service';
import { NotificationDetailModalComponent } from '../notification-center/notification-detail-modal/notification-detail-modal.component';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';
import { NotificationToastComponent } from '../notification-center/notification-toast/notification-toast.component';
import { NotificationDetailModel } from '../notification-center/stock-alerts/stock-alerts';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, NotificationCenterComponent, NotificationToastComponent, NotificationDetailModalComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  protected readonly menuLoginAbierto = signal(false);
  protected readonly notifsOpen = signal(false);
  protected readonly unreadNotifications = signal(0);
  protected activeDetail: NotificationDetailModel | null = null;
  private notificationsEnabled = false;

  @ViewChild(NotificationCenterComponent) private notificationCenter?: NotificationCenterComponent;
  @ViewChild(NotificationToastComponent) private notificationToast?: NotificationToastComponent;

  private readonly stockNotificationListener = (event: Event) => {
    const customEvent = event as CustomEvent<any>;
    const item = this.notificationCenter?.handleIncoming(customEvent.detail);
    if (item) {
      this.notificationToast?.show(item);
    }
  };

  constructor(
    protected readonly authService: AuthService,
    private readonly router: Router,
    private readonly fcmService: FcmService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.notificationsEnabled = this.authService.isAuthenticated() && this.authService.isAdmin();
    if (!this.notificationsEnabled) {
      return;
    }

    await this.loadUnreadNotifications();
    await this.fcmService.registerToken('http://127.0.0.1:8000');
    window.addEventListener('stock-notification', this.stockNotificationListener);
  }

  ngOnDestroy(): void {
    if (this.notificationsEnabled) {
      window.removeEventListener('stock-notification', this.stockNotificationListener);
    }
  }

  protected alternarMenuLogin(): void {
    this.menuLoginAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenuLogin(): void {
    this.menuLoginAbierto.set(false);
  }

  protected cerrarSesion(): void {
    this.authService.logout();
    this.cerrarMenuLogin();
    void this.router.navigate(['/']);
  }

  protected toggleNotifs(): void {
    this.notifsOpen.update(v => !v);
  }

  protected closeNotifs(): void {
    this.notifsOpen.set(false);
  }

  protected updateUnreadNotifications(count: number): void {
    this.unreadNotifications.set(count);
  }

  protected actualizarAlertaEmergente(item: any): void {
    this.notificationToast?.show(item);
  }

  protected abrirDetalleAlerta(item: any): void {
    if (!item) {
      return;
    }
    // If we received a canonical detail model (has fields), show it directly.
    if (item && typeof item === 'object' && Array.isArray(item.fields)) {
      this.activeDetail = item as NotificationDetailModel;
      return;
    }

    // Otherwise assume it's a NotificationViewModel; delegate to the notification center
    // so it can build the detail model, mark the notification as read, and emit the
    // canonical detailRequested event which will be handled by this same method.
    try {
      this.notificationCenter?.openDetail(item as any);
    } catch {
      // Fallback: if notificationCenter isn't available, set activeDetail if item
      this.activeDetail = item as any;
    }
  }

  protected cerrarDetalleAlerta(): void {
    this.activeDetail = null;
  }

  private async loadUnreadNotifications(): Promise<void> {
    try {
      const idsEmpresa = await this.fcmService.obtenerEmpresasContexto();
      const responses = await Promise.all(
        idsEmpresa.map((idEmpresa) => fetch(`http://127.0.0.1:8000/notifications/history/empresas/${idEmpresa}`)),
      );

      const payloads = await Promise.all(
        responses
          .filter((response) => response.ok)
          .map((response) => response.json() as Promise<{ items?: Array<{ leido?: boolean }> }>),
      );

      const unreadCount = payloads
        .flatMap((data) => data.items || [])
        .filter((item) => !item.leido).length;
      this.unreadNotifications.set(unreadCount);
    } catch {
      this.unreadNotifications.set(0);
    }
  }
}

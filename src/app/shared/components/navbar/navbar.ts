import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, NotificationCenterComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  protected readonly menuLoginAbierto = signal(false);
  protected readonly notifsOpen = signal(false);
  protected readonly unreadNotifications = signal(0);

  constructor(
    protected readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUnreadNotifications();
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

  protected updateUnreadNotifications(count: number): void {
    this.unreadNotifications.set(count);
  }

  private async loadUnreadNotifications(): Promise<void> {
    try {
      const response = await fetch('http://127.0.0.1:8000/notifications/history/empresas/1');
      if (!response.ok) return;

      const data = (await response.json()) as { items?: Array<{ leido?: boolean }> };
      const unreadCount = (data.items || []).filter((item) => !item.leido).length;
      this.unreadNotifications.set(unreadCount);
    } catch {
      this.unreadNotifications.set(0);
    }
  }
}

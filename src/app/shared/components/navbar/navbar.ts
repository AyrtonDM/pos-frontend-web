import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly menuLoginAbierto = signal(false);

  constructor(
    protected readonly authService: AuthService,
    private readonly router: Router,
  ) {}

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
}

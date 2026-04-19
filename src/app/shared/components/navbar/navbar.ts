import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly sesionIniciada = signal(false);
  protected readonly menuLoginAbierto = signal(false);

  protected alternarMenuLogin(): void {
    this.menuLoginAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenuLogin(): void {
    this.menuLoginAbierto.set(false);
  }

  protected cerrarSesion(): void {
    this.sesionIniciada.set(false);
    this.cerrarMenuLogin();
  }
}

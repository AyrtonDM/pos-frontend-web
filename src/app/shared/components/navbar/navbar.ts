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

  protected iniciarSesion(): void {
    this.sesionIniciada.set(true);
  }

  protected cerrarSesion(): void {
    this.sesionIniciada.set(false);
  }
}

import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  protected iniciarSesion(event: SubmitEvent): void {
    event.preventDefault();

    const rol = this.route.snapshot.queryParamMap.get('rol');

    if (rol === 'administrador') {
      void this.router.navigate(['/administrator/my-companies']);
    }
  }
}

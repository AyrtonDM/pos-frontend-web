import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CompanyWebSocketService } from './core/services/company-websocket.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly wsService = inject(CompanyWebSocketService);
  private readonly themeService = inject(ThemeService);
  protected readonly title = signal('pos-frontend-web');

  constructor() {
    this.themeService.initializeTheme();
  }
}

import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CompanyService, SystemConfiguration } from '../../../../core/services/company.service';
import { CompanyPermissionsService } from '../../../../core/services/company-permissions.service';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly companyPermissionsService = inject(CompanyPermissionsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly themeService = inject(ThemeService);

  protected activeTab: 'general' | 'appearance' | 'notifications' | 'printing' | 'security' = 'general';
  protected companyId = '';
  protected companyName = 'Cargando...';
  
  protected config: SystemConfiguration = {
    tema: 'claro',
    idioma: 'es',
    zona_horaria: 'America/La_Paz',
    moneda: 'BOB',
    activar_notificaciones_push: true,
    activar_sonido: true,
    activar_vibracion: true,
    confirmar_antes_de_eliminar: true,
    cerrar_sesion_por_inactividad: false,
    minutos_inactividad: 15,
    imprimir_automaticamente: false,
    numero_copias: 1,
    tamano_ticket: '80mm'
  };

  protected loading = false;
  protected saving = false;
  protected errorMsg = '';
  protected successMsg = '';

  ngOnInit(): void {
    // Try to get from query params, otherwise from active subscription (context)
    this.companyId = this.route.snapshot.queryParamMap.get('companyId') || 
                      String(this.companyPermissionsService.activeSubscription()?.id_empresa || '');

    if (!this.companyId) {
      this.errorMsg = 'No se ha detectado el contexto de la empresa actual.';
      return;
    }

    this.loadCompanyDetails();
    this.loadSettings();
  }

  setTab(tab: 'general' | 'appearance' | 'notifications' | 'printing' | 'security'): void {
    this.activeTab = tab;
    this.successMsg = '';
    this.errorMsg = '';
  }

  loadCompanyDetails(): void {
    this.companyService.obtenerEmpresa(this.companyId).subscribe({
      next: (comp) => {
        this.companyName = comp.nombre;
        this.cdr.detectChanges();
      },
      error: () => {
        this.companyName = 'Mi Empresa';
        this.cdr.detectChanges();
      }
    });
  }

  loadSettings(): void {
    this.loading = true;
    this.companyService.getConfiguracionSistema(this.companyId).subscribe({
      next: (data) => {
        this.config = { ...data };
        this.applyTheme(this.config.tema);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'Error al cargar la configuración del sistema.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveSettings(): void {
    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.companyService.actualizarConfiguracionSistema(this.companyId, this.config).subscribe({
      next: (data) => {
        this.config = { ...data };
        this.applyTheme(this.config.tema);
        this.successMsg = 'Configuración guardada exitosamente.';
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'No se pudo guardar la configuración.';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyTheme(tema: string): void {
    this.themeService.setTheme(tema);
  }
}

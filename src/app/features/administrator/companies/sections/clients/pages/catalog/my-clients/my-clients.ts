import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import {
  ClientRole,
  CompanyService,
  InviteClientResponse,
} from '../../../../../../../../core/services/company.service';
import { Navbar } from '../../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../../shared/components/sidebar/sidebar';

type ClientCatalogTab = 'invite' | 'list';

interface ClientInviteForm {
  correo: string;
}

interface ClientInvitation {
  correo: string;
  mensaje: string;
  link_invitacion: string;
}

interface ClientRow {
  nombre: string;
  correo: string;
}

@Component({
  selector: 'app-clientes-catalogo',
  imports: [FormsModule, Navbar, Sidebar],
  templateUrl: './my-clients.html',
  styleUrl: './my-clients.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesCatalogo {
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected companyName = 'Empresa';
  protected activeTab: ClientCatalogTab = 'invite';
  protected cargandoClientes = false;
  protected cargandoInvitacion = false;
  protected errorClientes = '';
  protected errorInvitacion = '';
  protected mensajeInvitacion = '';

  protected readonly inviteForm: ClientInviteForm = {
    correo: '',
  };

  protected invitations: ClientInvitation[] = [
    {
      correo: 'cliente.demo@correo.com',
      mensaje: 'Invitacion enviada',
      link_invitacion: 'http://localhost:8000/api/invitaciones/cliente/aceptar/5/12',
    },
  ];

  protected clients: ClientRow[] = [];

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Sucursales',
      link: ['/administrator/company', this.companyId, 'branches'],
    },
    {
      label: 'Productos',
      link: ['/administrator/company', this.companyId, 'products'],
    },
    {
      label: 'Clientes',
      active: true,
      expanded: true,
      children: [
        {
          label: 'Catalogo',
          link: ['/administrator/company', this.companyId, 'clients'],
          active: true,
        },
        {
          label: 'Categorias',
          link: ['/administrator/company', this.companyId, 'clients', 'categories'],
        },
      ],
    },
  ];

  protected setActiveTab(tab: ClientCatalogTab): void {
    this.activeTab = tab;
    this.errorInvitacion = '';
    this.mensajeInvitacion = '';

    if (tab === 'list' && this.clients.length === 0 && !this.cargandoClientes) {
      this.cargarClientes();
    }
  }

  protected invitarCliente(event: SubmitEvent): void {
    event.preventDefault();

    this.errorInvitacion = '';
    this.mensajeInvitacion = '';

    if (!this.companyId) {
      this.errorInvitacion = 'No se encontro la empresa para invitar al cliente.';
      return;
    }

    const correo = this.inviteForm.correo.trim();
    if (!correo) {
      this.errorInvitacion = 'Ingresa el correo del cliente.';
      return;
    }

    this.cargandoInvitacion = true;

    this.companyService
      .invitarCliente(this.companyId, { email: correo })
      .pipe(
        finalize(() => {
          this.cargandoInvitacion = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: InviteClientResponse) => {
          this.invitations = [
            {
              correo: response.email,
              mensaje: response.mensaje,
              link_invitacion: response.link_invitacion,
            },
            ...this.invitations,
          ];
          this.inviteForm.correo = '';
          this.mensajeInvitacion = response.mensaje;
          this.activeTab = 'list';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorInvitacion = error?.error?.detail ?? 'No se pudo enviar la invitacion.';
          this.cdr.detectChanges();
        },
      });
  }

  private cargarClientes(): void {
    if (!this.companyId) {
      this.errorClientes = 'No se encontro la empresa para cargar los clientes.';
      return;
    }

    this.errorClientes = '';
    this.cargandoClientes = true;

    this.companyService
      .getClientesEmpresa(this.companyId)
      .pipe(
        finalize(() => {
          this.cargandoClientes = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (clientes) => {
          this.clients = clientes.map((client) => this.mapClientRole(client));
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.clients = [];
          this.errorClientes = error?.error?.detail ?? 'Error al obtener los clientes.';
          this.cdr.detectChanges();
        },
      });
  }

  private mapClientRole(client: ClientRole): ClientRow {
    return {
      nombre: client.usuario.persona?.nombre_completo ?? 'Sin nombre',
      correo: client.usuario.email,
    };
  }
}
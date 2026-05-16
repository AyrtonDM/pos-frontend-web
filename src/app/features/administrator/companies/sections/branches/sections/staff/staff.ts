import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CompanyService, EmployeeRole } from '../../../../../../../core/services/company.service';
import { Navbar } from '../../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-staff',
  imports: [FormsModule, Navbar, Sidebar],
  templateUrl: './staff.html',
  styleUrl: './staff.css',
})
export class Staff implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  protected activeTab: 'invite' | 'list' = 'list';
  protected emailInvitacion = '';
  protected cargandoInvitacion = false;
  protected cargandoPersonal = false;
  protected errorInvitacion = '';
  protected errorPersonal = '';
  protected mensajeInvitacion = '';
  protected staffMembers: EmployeeRole[] = [];

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Personal',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'staff'],
      active: true,
    },
    {
      label: 'Cajas',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'cash-register'],
    },
    {
      label: 'Inventario',
      link: ['/administrator/company', this.companyId, 'branch', this.branchId, 'inventario'],
    },
    {
      label: 'Ventas',
    },
  ];

  ngOnInit(): void {
    this.cargarPersonal();
  }

  protected setActiveTab(tab: 'invite' | 'list'): void {
    this.activeTab = tab;

    if (tab === 'list') {
      this.cargarPersonal();
    }
  }

  protected enviarInvitacion(event: SubmitEvent): void {
    event.preventDefault();
    this.errorInvitacion = '';
    this.mensajeInvitacion = '';

    const email = this.emailInvitacion.trim();

    if (!this.companyId || !this.branchId) {
      this.errorInvitacion = 'No se encontro la empresa o sucursal para enviar la invitacion.';
      return;
    }

    if (!email) {
      this.errorInvitacion = 'Ingresa el correo del empleado.';
      return;
    }

    this.cargandoInvitacion = true;

    this.companyService.invitarEmpleado(this.companyId, this.branchId, { email }).subscribe({
      next: (response) => {
        this.cargandoInvitacion = false;
        this.mensajeInvitacion =
          response.mensaje ?? response.message ?? 'Invitacion enviada correctamente.';
        this.emailInvitacion = '';
        this.cargarPersonal();
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoInvitacion = false;
        this.errorInvitacion = 'No se pudo enviar la invitacion. Intenta nuevamente.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarPersonal(): void {
    this.errorPersonal = '';

    if (!this.companyId || !this.branchId) {
      this.errorPersonal = 'No se encontro la empresa o sucursal para cargar el personal.';
      return;
    }

    this.cargandoPersonal = true;

    this.companyService.getEmpleadosSucursal(this.companyId, this.branchId).subscribe({
      next: (staffMembers) => {
        this.staffMembers = staffMembers;
        this.cargandoPersonal = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.staffMembers = [];
        this.cargandoPersonal = false;
        this.errorPersonal = 'No se pudo cargar el personal de la sucursal.';
        this.cdr.detectChanges();
      },
    });
  }
}

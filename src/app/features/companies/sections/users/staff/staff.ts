import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  Branch,
  CompanyService,
  EmployeeRole,
  RoleListItem,
} from '../../../../../core/services/company.service';
import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../shared/components/sidebar/sidebar';

type StaffTab = 'invite' | 'list' | 'edit';

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
  protected selectedBranchId = '';
  protected activeTab: StaffTab = 'list';
  protected emailInvitacion = '';
  protected selectedRole = '1';
  protected selectedInvitationBranchIds: string[] = [];
  protected editingStaffId: number | null = null;
  protected editEmail = '';
  protected editRole = '1';
  protected editBranchIds: string[] = [];
  protected editStaffActive = true;
  protected cargandoSucursales = false;
  protected cargandoInvitacion = false;
  protected cargandoPersonal = false;
  protected errorSucursales = '';
  protected errorInvitacion = '';
  protected errorPersonal = '';
  protected errorRoles = '';
  protected mensajeInvitacion = '';
  protected branches: Branch[] = [];
  protected staffMembers: EmployeeRole[] = [];
  protected roles: Array<{ value: string; label: string }> = [];

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Sucursales',
      link: ['/company', this.companyId, 'branches'],
    },
    {
      label: 'Usuarios',
      active: true,
      expanded: true,
      children: [
        {
          label: 'Personal',
          link: ['/company', this.companyId, 'users', 'staff'],
          active: true,
        },
        {
          label: 'Roles',
          link: ['/company', this.companyId, 'users', 'rols'],
        },
      ],
    },
    {
      label: 'Productos',
      link: ['/company', this.companyId, 'products'],
    },
    {
      label: 'Clientes',
      link: ['/company', this.companyId, 'clients'],
    },
  ];

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarSucursales();
  }

  protected setActiveTab(tab: StaffTab): void {
    if (tab === 'edit' && this.editingStaffId === null) {
      return;
    }

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

    if (!this.companyId || this.selectedInvitationBranchIds.length === 0) {
      this.errorInvitacion = 'Selecciona al menos una sucursal para enviar la invitacion.';
      return;
    }

    if (!email) {
      this.errorInvitacion = 'Ingresa el correo del empleado.';
      return;
    }

    this.cargandoInvitacion = true;

    const invitations = this.selectedInvitationBranchIds.map((branchId) =>
      this.companyService.invitarEmpleado(this.companyId, branchId, { email }),
    );

    forkJoin(invitations).subscribe({
      next: (responses) => {
        this.cargandoInvitacion = false;
        const firstResponse = responses[0];
        this.mensajeInvitacion =
          firstResponse?.mensaje ??
          firstResponse?.message ??
          `Invitacion enviada correctamente a ${responses.length} sucursal(es).`;
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

  protected onBranchChange(): void {
    this.errorInvitacion = '';
    this.mensajeInvitacion = '';
    this.cargarPersonal();
  }

  protected isInvitationBranchSelected(branchId: string): boolean {
    return this.selectedInvitationBranchIds.includes(branchId);
  }

  protected toggleInvitationBranch(branchId: string, checked: boolean): void {
    if (checked) {
      this.selectedInvitationBranchIds = Array.from(new Set([...this.selectedInvitationBranchIds, branchId]));
      return;
    }

    this.selectedInvitationBranchIds = this.selectedInvitationBranchIds.filter((id) => id !== branchId);
  }

  protected editarPersonal(member: EmployeeRole): void {
    this.editingStaffId = member.id_usuario_rol;
    this.editEmail = member.usuario.email;
    this.editRole = this.roles.find((role) => role.value === String(member.id_rol))?.value ?? this.selectedRole;
    this.editBranchIds = [String(member.id_sucursal)];
    this.editStaffActive = Boolean(member.activo && member.usuario.activo);
    this.activeTab = 'edit';
  }

  protected cancelarEdicion(): void {
    this.editingStaffId = null;
    this.editEmail = '';
    this.editRole = '1';
    this.editBranchIds = [];
    this.editStaffActive = true;
    this.activeTab = 'list';
  }

  protected guardarEdicion(event: SubmitEvent): void {
    event.preventDefault();

    if (this.editingStaffId === null || this.editBranchIds.length === 0) {
      return;
    }

    this.staffMembers = this.staffMembers
      .map((member) => {
        if (member.id_usuario_rol !== this.editingStaffId) {
          return member;
        }

        return {
          ...member,
          id_rol: Number(this.editRole),
          id_sucursal: Number(this.editBranchIds[0]),
          activo: this.editStaffActive,
          usuario: {
            ...member.usuario,
            activo: this.editStaffActive,
          },
        };
      })
      .filter((member) => String(member.id_sucursal) === this.selectedBranchId);

    this.cancelarEdicion();
  }

  protected isEditBranchSelected(branchId: string): boolean {
    return this.editBranchIds.includes(branchId);
  }

  protected toggleEditBranch(branchId: string, checked: boolean): void {
    if (checked) {
      this.editBranchIds = Array.from(new Set([...this.editBranchIds, branchId]));
      return;
    }

    this.editBranchIds = this.editBranchIds.filter((id) => id !== branchId);
  }

  protected obtenerIdSucursal(branch: Partial<Branch>): string {
    return String(branch.idSucursal ?? branch.id_sucursal ?? branch.id ?? '');
  }

  protected obtenerNombreSucursal(idSucursal: string): string {
    return this.branches.find((branch) => this.obtenerIdSucursal(branch) === idSucursal)?.nombre ?? idSucursal;
  }

  private cargarSucursales(): void {
    this.errorSucursales = '';

    if (!this.companyId) {
      this.errorSucursales = 'No se encontro la empresa para cargar sus sucursales.';
      return;
    }

    this.cargandoSucursales = true;

    this.companyService.getSucursales(this.companyId).subscribe({
      next: (branches) => {
        this.branches = branches;
        this.selectedBranchId = this.obtenerIdSucursal(branches[0] ?? {});
        this.selectedInvitationBranchIds = this.selectedBranchId ? [this.selectedBranchId] : [];
        this.cargandoSucursales = false;
        this.cargarPersonal();
        this.cdr.detectChanges();
      },
      error: () => {
        this.branches = [];
        this.staffMembers = [];
        this.cargandoSucursales = false;
        this.errorSucursales = 'No se pudieron cargar las sucursales de la empresa.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarRoles(): void {
    this.errorRoles = '';

    if (!this.companyId) {
      this.roles = [];
      this.errorRoles = 'No se encontro la empresa para cargar sus roles.';
      return;
    }

    this.companyService.getRoles(this.companyId).subscribe({
      next: (roles) => {
        this.roles = roles
          .filter((role) => this.shouldShowRole(role))
          .map((role) => ({
            value: String(role.id_rol),
            label: role.nombre,
          }));

        if (!this.roles.some((role) => role.value === this.selectedRole)) {
          this.selectedRole = this.roles[0]?.value ?? '';
        }

        if (!this.roles.some((role) => role.value === this.editRole)) {
          this.editRole = this.selectedRole;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.roles = [];
        this.errorRoles = 'No se pudieron cargar los roles de la empresa.';
        this.cdr.detectChanges();
      },
    });
  }

  private shouldShowRole(role: RoleListItem): boolean {
    return role.nombre.trim().toUpperCase() !== 'CLIENTE';
  }

  private cargarPersonal(): void {
    this.errorPersonal = '';

    if (!this.companyId || !this.selectedBranchId) {
      this.staffMembers = [];
      this.errorPersonal = 'Selecciona una sucursal para cargar el personal.';
      return;
    }

    this.cargandoPersonal = true;

    this.companyService.getEmpleadosSucursal(this.companyId, this.selectedBranchId).subscribe({
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


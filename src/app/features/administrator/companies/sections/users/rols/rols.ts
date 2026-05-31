import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Navbar } from '../../../../../../shared/components/navbar/navbar';
import { Sidebar, SidebarItem } from '../../../../../../shared/components/sidebar/sidebar';

type RolesTab = 'create' | 'list' | 'edit';

interface PermissionAction {
  key: string;
  label: string;
  enabled: boolean;
}

interface PermissionModule {
  key: string;
  label: string;
  enabled: boolean;
  actions: PermissionAction[];
}

interface RoleRow {
  nombre: string;
  descripcion: string;
  permisos: string[];
  activo: boolean;
}

@Component({
  selector: 'app-rols',
  imports: [FormsModule, Navbar, Sidebar],
  templateUrl: './rols.html',
  styleUrl: './rols.css',
})
export class Rols {
  private readonly route = inject(ActivatedRoute);

  protected readonly companyId = this.route.snapshot.paramMap.get('id') ?? '';
  protected activeTab: RolesTab = 'create';
  protected roleName = '';
  protected roleDescription = '';
  protected editRoleName = '';
  protected editRoleDescription = '';
  protected editRoleActive = true;
  protected editingRoleIndex: number | null = null;
  protected roles: RoleRow[] = [];
  protected permissionModules: PermissionModule[] = this.createPermissionModules();
  protected editPermissionModules: PermissionModule[] = this.createPermissionModules();

  protected readonly sidebarItems: SidebarItem[] = [
    {
      label: 'Sucursales',
      link: ['/administrator/company', this.companyId, 'branches'],
    },
    {
      label: 'Usuarios',
      active: true,
      expanded: true,
      children: [
        {
          label: 'Personal',
          link: ['/administrator/company', this.companyId, 'users', 'staff'],
        },
        {
          label: 'Roles',
          link: ['/administrator/company', this.companyId, 'users', 'rols'],
          active: true,
        },
      ],
    },
    {
      label: 'Productos',
      link: ['/administrator/company', this.companyId, 'products'],
    },
    {
      label: 'Clientes',
      link: ['/administrator/company', this.companyId, 'clients'],
    },
  ];
  protected setActiveTab(tab: RolesTab): void {
    if (tab === 'edit' && this.editingRoleIndex === null) {
      return;
    }

    this.activeTab = tab;
  }

  protected onModuleToggle(module: PermissionModule): void {
    if (module.enabled) {
      return;
    }

    for (const action of module.actions) {
      action.enabled = false;
    }
  }

  protected crearRol(event: SubmitEvent): void {
    event.preventDefault();

    const nombre = this.roleName.trim();
    const descripcion = this.roleDescription.trim();
    const permisos = this.obtenerPermisosSeleccionados();

    if (!nombre) {
      return;
    }

    this.roles = [{ nombre, descripcion, permisos, activo: true }, ...this.roles];
    this.roleName = '';
    this.roleDescription = '';
    this.limpiarPermisos(this.permissionModules);
    this.activeTab = 'list';
  }

  protected editarRol(index: number): void {
    const role = this.roles[index];

    this.editingRoleIndex = index;
    this.editRoleName = role.nombre;
    this.editRoleDescription = role.descripcion;
    this.editRoleActive = role.activo;
    this.editPermissionModules = this.createPermissionModules(role.permisos);
    this.activeTab = 'edit';
  }

  protected cancelarEdicion(): void {
    this.editingRoleIndex = null;
    this.editRoleName = '';
    this.editRoleDescription = '';
    this.editRoleActive = true;
    this.editPermissionModules = this.createPermissionModules();
    this.activeTab = 'list';
  }

  protected guardarEdicion(event: SubmitEvent): void {
    event.preventDefault();

    if (this.editingRoleIndex === null) {
      return;
    }

    const nombre = this.editRoleName.trim();

    if (!nombre) {
      return;
    }

    this.roles = this.roles.map((role, index) => {
      if (index !== this.editingRoleIndex) {
        return role;
      }

      return {
        nombre,
        descripcion: this.editRoleDescription.trim(),
        permisos: this.obtenerPermisosSeleccionados(this.editPermissionModules),
        activo: this.editRoleActive,
      };
    });

    this.cancelarEdicion();
  }

  private obtenerPermisosSeleccionados(modules = this.permissionModules): string[] {
    return modules.flatMap((module) => {
      if (!module.enabled) {
        return [];
      }

      return module.actions
        .filter((action) => action.enabled)
        .map((action) => `${module.label}: ${action.label}`);
    });
  }

  private limpiarPermisos(modules: PermissionModule[]): void {
    for (const module of modules) {
      module.enabled = false;

      for (const action of module.actions) {
        action.enabled = false;
      }
    }
  }

  private createPermissionModules(selectedPermissions: string[] = []): PermissionModule[] {
    const selected = new Set(selectedPermissions);

    return [
      {
        key: 'products',
        label: 'Productos',
        enabled: selectedPermissions.some((permission) => permission.startsWith('Productos:')),
        actions: [
          {
            key: 'create-product',
            label: 'Crear producto',
            enabled: selected.has('Productos: Crear producto'),
          },
          {
            key: 'edit-product',
            label: 'Editar producto',
            enabled: selected.has('Productos: Editar producto'),
          },
        ],
      },
      {
        key: 'sales',
        label: 'Ventas',
        enabled: selectedPermissions.some((permission) => permission.startsWith('Ventas:')),
        actions: [
          {
            key: 'create-sale',
            label: 'Crear venta',
            enabled: selected.has('Ventas: Crear venta'),
          },
          {
            key: 'view-sale',
            label: 'Ver venta',
            enabled: selected.has('Ventas: Ver venta'),
          },
        ],
      },
      {
        key: 'reports',
        label: 'Reportes',
        enabled: selectedPermissions.some((permission) => permission.startsWith('Reportes:')),
        actions: [
          {
            key: 'export-reports',
            label: 'Exportar reportes',
            enabled: selected.has('Reportes: Exportar reportes'),
          },
          {
            key: 'generate-reports',
            label: 'Generar reportes',
            enabled: selected.has('Reportes: Generar reportes'),
          },
        ],
      },
    ];
  }
}

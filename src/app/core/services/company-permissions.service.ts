import { Injectable, signal } from '@angular/core';

export const COMPANY_PERMISSION_CODES = [
  'EMPRESA_EDITAR',
  'SUCURSAL_VER',
  'SUCURSAL_CREAR',
  'SUCURSAL_EDITAR',
  'USUARIO_VER',
  'USUARIO_CREAR',
  'USUARIO_EDITAR',
  'ROL_VER',
  'ROL_CREAR',
  'ROL_EDITAR',
  'CLIENTE_VER',
  'CLIENTE_CREAR',
  'CLIENTE_EDITAR',
  'CATEGORIA_VER',
  'CATEGORIA_CREAR',
  'CATEGORIA_EDITAR',
  'PRODUCTO_VER',
  'PRODUCTO_CREAR',
  'PRODUCTO_EDITAR',
  'STOCK_VER',
  'STOCK_CONFIGURAR',
  'MOVIMIENTO_VER',
  'MOVIMIENTO_REGISTRAR',
  'ALERTA_VER',
  'CAJA_VER',
  'CAJA_EDITAR',
  'CAJA_ABRIR',
  'CAJA_CERRAR',
  'VENTA_VER',
  'VENTA_CREAR',
  'VENTA_ANULAR',
  'VENTA_DESCUENTO',
  'FACTURA_EMITIR',
  'FACTURA_REIMPRIMIR',
  'REPORTE_GENERAR',
  'REPORTE_EXPORTAR',
  'DASHBOARD_VER',
] as const;

export type CompanyPermissionCode = (typeof COMPANY_PERMISSION_CODES)[number];
export type CompanyPermissionsByCode = Record<CompanyPermissionCode, boolean>;

export interface CompanyPermissionModule {
  id_modulo: number;
  codigo: string;
  nombre: string;
}

export interface CompanyPermission {
  id_permiso: number;
  codigo: string;
  nombre: string;
  id_modulo: number;
  modulo: CompanyPermissionModule;
  activo_rol_permiso: boolean;
}

const STORAGE_KEY = 'company_permissions_by_code';

export const EMPTY_COMPANY_PERMISSIONS: CompanyPermissionsByCode =
  COMPANY_PERMISSION_CODES.reduce((permissions, code) => {
    permissions[code] = false;
    return permissions;
  }, {} as CompanyPermissionsByCode);

@Injectable({
  providedIn: 'root',
})
export class CompanyPermissionsService {
  private readonly permissionsSignal = signal<CompanyPermissionsByCode>(
    this.readStoredPermissions(),
  );

  readonly permissions = this.permissionsSignal.asReadonly();

  savePermissions(permissions: CompanyPermission[]): CompanyPermissionsByCode {
    const permissionsByCode = this.createEmptyPermissions();

    for (const permission of permissions) {
      if (this.isCompanyPermissionCode(permission.codigo)) {
        permissionsByCode[permission.codigo] = permission.activo_rol_permiso === true;
      }
    }

    this.permissionsSignal.set(permissionsByCode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissionsByCode));

    return permissionsByCode;
  }

  getPermissionCodes(): string[] {
    return Object.entries(this.permissionsSignal())
      .filter(([, enabled]) => enabled === true)
      .map(([code]) => code);
  }

  clearPermissions(): void {
    const emptyPermissions = this.createEmptyPermissions();
    this.permissionsSignal.set(emptyPermissions);
    localStorage.removeItem(STORAGE_KEY);
  }

  private createEmptyPermissions(): CompanyPermissionsByCode {
    return { ...EMPTY_COMPANY_PERMISSIONS };
  }

  private isCompanyPermissionCode(code: string): code is CompanyPermissionCode {
    return COMPANY_PERMISSION_CODES.includes(code as CompanyPermissionCode);
  }

  private readStoredPermissions(): CompanyPermissionsByCode {
    const emptyPermissions = this.createEmptyPermissions();
    const storedPermissions = localStorage.getItem(STORAGE_KEY);

    if (!storedPermissions) {
      return emptyPermissions;
    }

    try {
      const parsedPermissions = JSON.parse(storedPermissions) as Partial<Record<CompanyPermissionCode, unknown>>;

      return COMPANY_PERMISSION_CODES.reduce((permissions, code) => {
        permissions[code] = Boolean(parsedPermissions[code]);
        return permissions;
      }, { ...emptyPermissions });
    } catch {
      return emptyPermissions;
    }
  }
}

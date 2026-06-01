import { Routes } from '@angular/router';
import { EditCompany } from './features/administrator/companies/pages/edit-company/edit-company';
import { MyCompanies } from './features/administrator/companies/pages/my-companies/my-companies';
import { RegisterCompany } from './features/administrator/companies/pages/register-company/register-company';
import { Branches } from './features/administrator/companies/sections/branches/pages/branches/branches';
import { EditBranch } from './features/administrator/companies/sections/branches/pages/edit-branch/edit-branch';
import { ViewBranch } from './features/administrator/companies/sections/branches/pages/view-branch/view-branch';
import { CashRegister } from './features/administrator/companies/sections/branches/sections/cash_register/cash_register';
import { CloseCashRegister as AdminCloseCashRegister } from './features/administrator/companies/sections/branches/sections/close_cash_register/close_cash_register';
import { Staff } from './features/administrator/companies/sections/users/staff/staff';
import { Rols } from './features/administrator/companies/sections/users/rols/rols';

import { Inventario } from './features/administrator/companies/sections/branches/sections/inventario/inventario';
import { OpenCashRegister as AdminOpenCashRegister } from './features/administrator/companies/sections/branches/sections/open_cash_register/open_cash_register';
import { Sales as AdminSales } from './features/administrator/companies/sections/branches/sections/sales/sales';
import { DynamicReports } from './features/administrator/companies/sections/reports/dynamic/dynamic';
import { ParameterizedReports } from './features/administrator/companies/sections/reports/parameterized/parameterized';
import { StaticReports } from './features/administrator/companies/sections/reports/static/static';
import { CategoriasPanel } from './features/administrator/companies/sections/products/pages/categories/my-categories/my-categories';
import { EditCategory } from './features/administrator/companies/sections/products/pages/categories/edit-category/edit-category';
import { EditProduct } from './features/administrator/companies/sections/products/pages/catalog/edit-product/edit-product';
import { ProductosPanel } from './features/administrator/companies/sections/products/pages/catalog/my-catalog/my-catalog';
import { ViewCategory } from './features/administrator/companies/sections/products/pages/categories/view-category/view-category';
import { ViewProduct } from './features/administrator/companies/sections/products/pages/catalog/view-product/view-product';
import { CategoriasClientes } from './features/administrator/companies/sections/clients/pages/categories/my-categories/my-categories';
import { EditClientCategory } from './features/administrator/companies/sections/clients/pages/categories/edit-category/edit-category';
import { EditClient } from './features/administrator/companies/sections/clients/pages/edit-client';
import { ClientesCatalogo } from './features/administrator/companies/sections/clients/pages/catalog/my-clients/my-clients';
import { EmployeeBranches } from './features/employee/companies/branches/my-branches/my-branches';
import { EmployeeCashRegister } from './features/employee/companies/branches/cash_registers/cash_register/cash_register';
import { CloseCashRegister } from './features/employee/companies/branches/cash_registers/close_cash_register/close_cash_register';
import { OpenCashRegister } from './features/employee/companies/branches/cash_registers/open_cash_register/open_cash_register';
import { Sales } from './features/employee/companies/branches/cash_registers/sales/sales';
import { EmployeeMyCompanies } from './features/employee/companies/my-companies/my-companies';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { HomePage } from './features/landing/home_page/home_page';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'administrator/my-companies',
    component: MyCompanies,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/register-company',
    component: RegisterCompany,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/edit-company/:idEmpresa',
    component: EditCompany,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/branches',
    component: Branches,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/branch/:branchId/view-branch',
    component: ViewBranch,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/branch/:branchId/edit-branch',
    component: EditBranch,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/users/staff',
    component: Staff,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/users/rols',
    component: Rols,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/branch/:branchId/cash-register',
    component: CashRegister,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/branch/:branchId/cash-register/:cashRegisterId/open-cash-register',
    component: AdminOpenCashRegister,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/branch/:branchId/cash-register/:cashRegisterId/close-cash-register',
    component: AdminCloseCashRegister,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/branch/:branchId/cash-register/:cashRegisterId/sales',
    component: AdminSales,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/branch/:branchId/inventario',
    component: Inventario,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/reports/static',
    component: StaticReports,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/reports/parameterized',
    component: ParameterizedReports,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/reports/dynamic',
    component: DynamicReports,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/products/categories',
    component: CategoriasPanel,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/products',
    component: ProductosPanel,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/clients',
    component: ClientesCatalogo,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/clients/categories',
    component: CategoriasClientes,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/clients/categories/:categoryId/edit-category',
    component: EditClientCategory,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/clients/:clientId/edit-client',
    component: EditClient,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/product/:productId/view-product',
    component: ViewProduct,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/product/:productId/edit-product',
    component: EditProduct,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/category/:categoryId/view-category',
    component: ViewCategory,
    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/category/:categoryId/edit-category',
    component: EditCategory,
    canActivate: [authGuard],
  },
  {
    path: 'employee/my-companies',
    component: EmployeeMyCompanies,
    canActivate: [authGuard],
  },
  {
    path: 'employee/company/:idEmpresa/branches',
    component: EmployeeBranches,
    canActivate: [authGuard],
  },
  {
    path: 'employee/company/:idEmpresa/branch/:branchId/cash_registers',
    component: EmployeeCashRegister,
    canActivate: [authGuard],
  },
  {
    path: 'employee/company/:idEmpresa/branch/:branchId/cash_register/:cashRegisterId/open_cash_register',
    component: OpenCashRegister,
    canActivate: [authGuard],
  },
  {
    path: 'employee/company/:idEmpresa/branch/:branchId/cash_register/:cashRegisterId/close_cash_register',
    component: CloseCashRegister,
    canActivate: [authGuard],
  },
  {
    path: 'employee/company/:idEmpresa/branch/:branchId/cash_register/:cashRegisterId/sales',
    component: Sales,
    canActivate: [authGuard],
  },
];

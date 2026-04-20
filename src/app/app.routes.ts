import { Routes } from '@angular/router';
import { EditCompany } from './features/administrator/companies/pages/edit-company/edit-company';
import { MyCompanies } from './features/administrator/companies/pages/my-companies/my-companies';
import { RegisterCompany } from './features/administrator/companies/pages/register-company/register-company';
import { Branches } from './features/administrator/companies/sections/branches/pages/branches/branches';
import { EditBranch } from './features/administrator/companies/sections/branches/pages/edit-branch/edit-branch';
import { ViewBranch } from './features/administrator/companies/sections/branches/pages/view-branch/view-branch';
import { Staff } from './features/administrator/companies/sections/branches/sections/staff/staff';

import { Inventario } from './features/administrator/companies/sections/branches/sections/inventario/inventario';
import { CategoriasPanel } from './features/administrator/companies/sections/products/pages/categories/my-categories/my-categories';
import { EditCategory } from './features/administrator/companies/sections/products/pages/categories/edit-category/edit-category';
import { EditProduct } from './features/administrator/companies/sections/products/pages/catalog/edit-product/edit-product';
import { ProductosPanel } from './features/administrator/companies/sections/products/pages/catalog/my-catalog/my-catalog';
import { ViewCategory } from './features/administrator/companies/sections/products/pages/categories/view-category/view-category';
import { ViewProduct } from './features/administrator/companies/sections/products/pages/catalog/view-product/view-product';
import { EmployeeBranches } from './features/employee/branches/pages/employee-branches/employee-branches';
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
    path: 'administrator/company/:id/branch/:branchId/staff',
    component: Staff,
/*  */    canActivate: [authGuard],
  },
  {
    path: 'administrator/company/:id/branch/:branchId/inventario',
    component: Inventario,
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
    path: 'employee/my-branches',
    component: EmployeeBranches,
    canActivate: [authGuard],
  },
];

import { Routes } from '@angular/router';
import { EditCompany } from './features/administrator/companies/pages/edit-company/edit-company';
import { MyCompanies } from './features/administrator/companies/pages/my-companies/my-companies';
import { RegisterCompany } from './features/administrator/companies/pages/register-company/register-company';
import { Branches } from './features/administrator/companies/sections/branches/pages/branches/branches';
import { EditBranch } from './features/administrator/companies/sections/branches/pages/edit-branch/edit-branch';
import { ViewBranch } from './features/administrator/companies/sections/branches/pages/view-branch/view-branch';
import { Staff } from './features/administrator/companies/sections/branches/sections/staff/staff';
import { Products } from './features/administrator/companies/sections/products/products';
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
    path: 'administrator/company/:id/products',
    component: Products,
    canActivate: [authGuard],
  },
];

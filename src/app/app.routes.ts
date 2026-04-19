import { Routes } from '@angular/router';
import { EditCompany } from './features/administrator/companies/pages/edit-company/edit-company';
import { MyCompanies } from './features/administrator/companies/pages/my-companies/my-companies';
import { RegisterCompany } from './features/administrator/companies/pages/register-company/register-company';
import { Branches } from './features/administrator/companies/sections/branches/branches';
import { Products } from './features/administrator/companies/sections/products/products';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { HomePage } from './features/landing/home_page/home_page';

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
  },
  {
    path: 'administrator/register-company',
    component: RegisterCompany,
  },
  {
    path: 'administrator/edit-company/:nit',
    component: EditCompany,
  },
  {
    path: 'administrator/company/:id/branches',
    component: Branches,
  },
  {
    path: 'administrator/company/:id/products',
    component: Products,
  },
];

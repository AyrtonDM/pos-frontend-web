import { Routes } from '@angular/router';
import { EditCompany } from './features/administrator/edit-company/edit-company';
import { MyCompanies } from './features/administrator/my-companies/my-companies';
import { RegisterCompany } from './features/administrator/register-company/register-company';
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
];

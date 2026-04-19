import { Routes } from '@angular/router';
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
];

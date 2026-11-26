import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const employeeRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.EmployeeLogin),
    title: 'Selling System POS | Acceso Colaborador',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.EmployeeDashboard),
    canActivate: [authGuard],
    title: 'Selling System POS | Terminal Colaborador',
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];

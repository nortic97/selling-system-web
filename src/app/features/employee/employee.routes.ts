import { Routes } from '@angular/router';

export const employeeRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.EmployeeLogin),
    title: 'Selling System POS | Acceso Cajero'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

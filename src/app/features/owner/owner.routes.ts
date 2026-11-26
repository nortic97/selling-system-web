import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ownerRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    title: 'Selling System POS | Acceso Propietario',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
    title: 'Selling System B2B | Panel Propietario',
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];

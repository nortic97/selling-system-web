import { Routes } from '@angular/router';

export const ownerRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    title: 'Selling System POS | Acceso Propietario',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];

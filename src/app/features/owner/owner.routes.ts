import { Routes } from '@angular/router';

export const ownerRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
    title: 'login'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

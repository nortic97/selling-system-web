import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.Home),
    title: 'Selling System POS | Punto de Venta y Gestión'
  },
  {
    path: 'owner',
    loadChildren: () => import('./features/owner/owner.routes').then(m => m.ownerRoutes)
  },
  {
    path: 'employee',
    loadChildren: () => import('./features/employee/employee.routes').then(m => m.employeeRoutes)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

// Alias para compatibilidad
export const routes = appRoutes;

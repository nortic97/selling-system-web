import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Guard de autenticación para proteger rutas privadas (Dashboard, POS, configuración, etc.).
 * Nota: Siguiendo los requerimientos, el guard está creado y vinculado en las rutas,
 * pero no bloquea el acceso en esta etapa (retorna true) para permitir la navegación mientras se completa el backend.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // MODO DESARROLLO / PREPARACIÓN DE TERRENO:
  // Se deja en true para que todo sea accesible mientras no está conectado el microservicio de autenticación.
  const bypassForDevelopment = true;
  if (bypassForDevelopment) {
    return true;
  }

  // --- LÓGICA DE PRODUCCIÓN PREPARADA ---
  if (tokenService.isAuthenticated()) {
    return true;
  }

  // Redirección al login correspondiente
  if (state.url.includes('/employee')) {
    return router.createUrlTree(['/employee/login']);
  }

  return router.createUrlTree(['/owner/login']);
};

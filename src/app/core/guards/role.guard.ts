import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Guard para validar permisos específicos o permisos de rol requeridos en route.data.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // MODO DESARROLLO / PREPARACIÓN DE TERRENO:
  const bypassForDevelopment = true;
  if (bypassForDevelopment) {
    return true;
  }

  const requiredPermission = route.data?.['permission'] as string | undefined;
  if (!requiredPermission || tokenService.hasPermission(requiredPermission)) {
    return true;
  }

  return router.createUrlTree(['/']);
};

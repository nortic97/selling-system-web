import { Injectable, computed, inject, signal } from '@angular/core';
import { CookieService } from './cookie.service';
import { AuthTokenPayload } from '../models/auth-token-payload.model';
import { AuthResponse } from '../models/auth-response.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly cookieService = inject(CookieService);

  private readonly TOKEN_COOKIE_KEY = 'ss_auth_token';
  private readonly REFRESH_COOKIE_KEY = 'ss_refresh_token';

  // Signals para estado reactivo del token y payload
  private readonly _token = signal<string | null>(this.cookieService.get(this.TOKEN_COOKIE_KEY));
  readonly token = this._token.asReadonly();

  // Payload computado decodificado del JWT
  readonly payload = computed<AuthTokenPayload | null>(() => {
    const currentToken = this._token();
    if (!currentToken) return null;
    return this.decodeJwtPayload(currentToken);
  });

  // Permisos computados desde el token
  readonly permissions = computed<string[]>(() => {
    return this.payload()?.permissions ?? [];
  });

  // Identificador de usuario (sub)
  readonly userId = computed<string | null>(() => {
    return this.payload()?.sub ?? null;
  });

  // Estado de expiración
  readonly isExpired = computed<boolean>(() => {
    const payload = this.payload();
    if (!payload || !payload.exp) return true;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds;
  });

  // Estado de autenticación activo y válido
  readonly isAuthenticated = computed<boolean>(() => {
    return !!this._token() && !this.isExpired();
  });

  /**
   * Almacena la respuesta de autenticación en cookies.
   * La cookie del token expira exactamente según el campo 'exp' del JWT.
   */
  saveSession(authResponse: AuthResponse): void {
    const { token, refreshToken } = authResponse;
    const payload = this.decodeJwtPayload(token);

    if (payload && payload.exp) {
      // exp viene en segundos UNIX (ej. 1796179188)
      const expirationDate = new Date(payload.exp * 1000);

      this.cookieService.set(this.TOKEN_COOKIE_KEY, token, {
        expires: expirationDate,
        path: '/',
        sameSite: 'Lax'
      });

      // El refreshToken usualmente tiene mayor vigencia o 7 días de respaldo
      const refreshExpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      this.cookieService.set(this.REFRESH_COOKIE_KEY, refreshToken, {
        expires: refreshExpDate,
        path: '/',
        sameSite: 'Lax'
      });
    } else {
      // Fallback si no tiene exp válido (1 día)
      this.cookieService.set(this.TOKEN_COOKIE_KEY, token, {
        expires: 86400,
        path: '/',
        sameSite: 'Lax'
      });
      this.cookieService.set(this.REFRESH_COOKIE_KEY, refreshToken, {
        expires: 86400 * 7,
        path: '/',
        sameSite: 'Lax'
      });
    }

    this._token.set(token);
  }

  /**
   * Retorna el token JWT en memoria o cookie.
   */
  getToken(): string | null {
    return this._token() ?? this.cookieService.get(this.TOKEN_COOKIE_KEY);
  }

  /**
   * Retorna el refresh token desde la cookie.
   */
  getRefreshToken(): string | null {
    return this.cookieService.get(this.REFRESH_COOKIE_KEY);
  }

  /**
   * Verifica si el usuario posee un permiso específico.
   */
  hasPermission(permission: string): boolean {
    const perms = this.permissions();
    return perms.includes(permission) || perms.includes('system.all');
  }

  /**
   * Verifica si el usuario posee al menos uno de los permisos requeridos.
   */
  hasAnyPermission(requiredPermissions: string[]): boolean {
    const perms = this.permissions();
    if (perms.includes('system.all')) return true;
    return requiredPermissions.some((perm) => perms.includes(perm));
  }

  /**
   * Elimina las cookies de sesión y limpia el estado.
   */
  clearSession(): void {
    this.cookieService.delete(this.TOKEN_COOKIE_KEY, '/');
    this.cookieService.delete(this.REFRESH_COOKIE_KEY, '/');
    this._token.set(null);
  }

  /**
   * Genera y guarda un token simulado para pruebas de desarrollo alineado con el esquema exacto.
   */
  simulateSession(customPayload?: Partial<AuthTokenPayload>): void {
    const now = Math.floor(Date.now() / 1000);
    const simulatedPayload: AuthTokenPayload = {
      iss: 'ms-auth',
      sub: 'ae250ea2-29df-4166-ab3f-62722667f135',
      type: 'access',
      permissions: [
        'employee_workspace.all',
        'store.create',
        'store.read',
        'store.all',
        'branch.delete',
        'store.delete',
        'system.all',
        'store.update',
        'branch.read',
        'branch.all',
        'employee.create',
        'employee.read',
        'branch.update',
        'branch.create',
        'employee.all',
        'employee.delete',
        'employee.update'
      ],
      iat: now,
      exp: now + 3600 * 24, // 24 horas por defecto
      ...customPayload
    };

    // Header simulado JWT
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(simulatedPayload));
    const simulatedToken = `${encodedHeader}.${encodedPayload}.simulatedSignature12345`;

    this.saveSession({
      token: simulatedToken,
      refreshToken: 'simulated-refresh-token-xyz',
      tokenType: 'Bearer'
    });
  }

  /**
   * Decodifica de manera segura el payload de un token JWT.
   */
  decodeJwtPayload(token: string): AuthTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      const decodedStr = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(decodedStr) as AuthTokenPayload;
    } catch {
      return null;
    }
  }

  private base64UrlEncode(str: string): string {
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

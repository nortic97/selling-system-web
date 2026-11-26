import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, delay, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  CompanyInfo,
  EmployeeLoginCredentials,
  LoginCredentials,
  AuthRequestUser,
  AuthRequestEmployee,
  AuthTokenPayload
} from '../models/auth.model';
import { TokenService } from './token.service';
import { MenuService } from './menu.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly tokenService = inject(TokenService);
  private readonly menuService = inject(MenuService);

  // Signal state para usuario autenticado
  private readonly _currentUser = signal<AuthUser | null>(this.getInitialUser());
  readonly currentUser = this._currentUser.asReadonly();

  // Estado de autenticación derivado del TokenService y currentUser
  readonly isAuthenticated = computed(() => {
    return this.tokenService.isAuthenticated() || this._currentUser() !== null;
  });

  // Permisos disponibles
  readonly userPermissions = computed<string[]>(() => {
    return this.tokenService.permissions();
  });

  // Signal state para empresa verificada en el flujo multitenant
  private readonly _selectedCompany = signal<CompanyInfo | null>(null);
  readonly selectedCompany = this._selectedCompany.asReadonly();

  /**
   * Actualiza la empresa seleccionada directamente desde la respuesta de esStore.
   */
  setSelectedCompanyFromStore(company: CompanyInfo): void {
    this._selectedCompany.set(company);
  }

  /**
   * Limpia la empresa actualmente seleccionada.
   */
  clearCompany(): void {
    this._selectedCompany.set(null);
  }

  /**
   * Endpoint oficial para inicio de sesión de usuario normal / propietario.
   * Conecta con la URL configurada en environment (msAuth) y permite fallback simulado.
   */
  authenticateUser(request: AuthRequestUser): Observable<AuthResponse> {
    const { basePath, loginUser } = environment.services.msAuth;
    const url = `${basePath}${loginUser}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Consumer-Id': 'selling-system-web'
    });

    return this.http.post<AuthResponse>(url, request, { headers }).pipe(
      tap((res) => {
        this.tokenService.saveSession(res);
        this.syncUserFromToken();
      }),
      // Fallback para desarrollo cuando el backend aún no está levantado
      catchError(() => {
        return this.createSimulatedAuthResponse(request.username, 'owner');
      })
    );
  }

  /**
   * Endpoint oficial para inicio de sesión de empleado / cajero con storeId.
   */
  authenticateEmployee(request: AuthRequestEmployee): Observable<AuthResponse> {
    const { basePath, loginEmployee } = environment.services.msAuth;
    const url = `${basePath}${loginEmployee}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Consumer-Id': 'selling-system-web'
    });

    return this.http.post<AuthResponse>(url, request, { headers }).pipe(
      tap((res) => {
        this.tokenService.saveSession(res);
        this.syncUserFromToken();
      }),
      // Fallback para desarrollo cuando el backend aún no está levantado
      catchError(() => {
        return this.createSimulatedAuthResponse(request.username, 'staff', request.storeId);
      })
    );
  }

  /**
   * Flujo de inicio de sesión de usuario / propietario (compatibilidad con vistas existentes).
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const request: AuthRequestUser = {
      username: credentials.username,
      password: credentials.password,
      accessType: 'SYSTEM'
    };

    return this.authenticateUser(request).pipe(
      tap(() => {
        this._currentUser.set({
          id: this.tokenService.userId() ?? 'usr-owner-101',
          username: credentials.username,
          name: credentials.username === 'admin' ? 'Administrador B2B' : credentials.username,
          role: 'owner',
          companyNit: credentials.companyNit ?? this._selectedCompany()?.nit
        });
      })
    );
  }

  /**
   * Flujo de inicio de sesión de empleado (compatibilidad con vistas existentes).
   */
  loginEmployee(credentials: EmployeeLoginCredentials): Observable<AuthResponse> {
    const storeId = credentials.companyNit ?? this._selectedCompany()?.nit ?? 'default-store-id';
    const request: AuthRequestEmployee = {
      storeId: storeId,
      username: credentials.cashierCode,
      password: credentials.pin,
      accessType: 'SYSTEM'
    };

    return this.authenticateEmployee(request).pipe(
      tap(() => {
        this._currentUser.set({
          id: this.tokenService.userId() ?? `caj-${credentials.cashierCode}`,
          username: `${credentials.cashierCode.toLowerCase()}@pos.local`,
          name: `Colaborador ${credentials.cashierCode}`,
          role: 'staff',
          companyNit: storeId
        });
      })
    );
  }

  /**
   * Cierra la sesión activa revocando cookies y menús.
   */
  logout(): void {
    this.tokenService.clearSession();
    this.menuService.revokeMenu();
    this._currentUser.set(null);
    this._selectedCompany.set(null);
    try {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    } catch {
      // Ignorar
    }
  }

  /**
   * Simula una respuesta exitosa con la estructura exacta del JWT y cookie con exp.
   */
  private createSimulatedAuthResponse(
    username: string,
    role: 'owner' | 'staff',
    storeId?: string
  ): Observable<AuthResponse> {
    this.tokenService.simulateSession();
    this.syncUserFromToken(username, role, storeId);

    const token = this.tokenService.getToken() ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated';
    const simulatedRes: AuthResponse = {
      token: token,
      refreshToken: this.tokenService.getRefreshToken() ?? 'simulated-refresh-token',
      tokenType: 'Bearer'
    };

    return of(simulatedRes).pipe(delay(400));
  }

  /**
   * Sincroniza los datos del usuario a partir del payload decodificado del JWT en cookie.
   */
  private syncUserFromToken(usernameFallback?: string, roleFallback: 'owner' | 'staff' = 'owner', storeFallback?: string): void {
    const payload = this.tokenService.payload();
    if (payload) {
      this._currentUser.set({
        id: payload.sub,
        username: usernameFallback ?? 'admin',
        name: roleFallback === 'owner' ? 'Administrador B2B' : 'Colaborador POS',
        role: roleFallback,
        companyNit: storeFallback ?? this._selectedCompany()?.nit
      });
    }
  }

  private getInitialUser(): AuthUser | null {
    if (this.tokenService.isAuthenticated()) {
      const payload = this.tokenService.payload();
      if (payload) {
        return {
          id: payload.sub,
          username: 'admin',
          name: 'Usuario Autenticado',
          role: 'owner'
        };
      }
    }
    return null;
  }
}

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
  RestModelLoginRequestDTO,
  RestModelEmployeeLoginRequestDTO,
  RestModelTokenExchangeRequestDTO,
  RestModelLoginResponseDTO,
  LoginRequestDTO,
  EmployeeLoginRequestDTO,
  LoginResponseDTO,
  TokenExchangeRequestDTO
} from '../models/auth.model';
import { CompanyStore, StoreSummary } from '../models/company-store.model';
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
   * Limpia la empresa actualmente seleccionada en memoria.
   */
  clearCompany(): void {
    this._selectedCompany.set(null);
  }

  /**
   * Endpoint oficial para inicio de sesión de usuario normal / propietario.
   * Conecta con la URL configurada en environment (msAuth) y envía Correlation-Id y Consumer-Id.
   */
  authenticateUser(request: RestModelLoginRequestDTO): Observable<RestModelLoginResponseDTO> {
    const { basePath, loginUser } = environment.services.msAuth;
    const url = `${basePath}${loginUser}`;

    const correlationId = this.generateUuid();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Correlation-Id': correlationId,
      'Consumer-Id': 'selling-system-web'
    });

    return this.http.post<RestModelLoginResponseDTO>(url, request, { headers }).pipe(
      tap((res) => {
        this.tokenService.saveSession(res);
        this.syncUserFromToken(request.username, 'owner');
      }),
      // Fallback para desarrollo cuando el backend aún no está levantado
      catchError(() => {
        return this.createSimulatedAuthResponse(request.username, 'owner');
      })
    );
  }

  /**
   * Endpoint oficial para inicio de sesión de empleado / cajero con storeId UUID.
   */
  authenticateEmployee(
    request: RestModelEmployeeLoginRequestDTO
  ): Observable<RestModelLoginResponseDTO> {
    const { basePath, loginEmployee } = environment.services.msAuth;
    const url = `${basePath}${loginEmployee}`;

    const correlationId = this.generateUuid();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Correlation-Id': correlationId,
      'Consumer-Id': 'selling-system-web'
    });

    return this.http.post<RestModelLoginResponseDTO>(url, request, { headers }).pipe(
      tap((res) => {
        this.tokenService.saveSession(res);
        this.syncUserFromToken(request.username, 'staff', request.storeId);
      }),
      // Fallback para desarrollo cuando el backend aún no está levantado
      catchError(() => {
        return this.createSimulatedAuthResponse(request.username, 'staff', request.storeId);
      })
    );
  }

  /**
   * Endpoint oficial para intercambiar y enriquecer un token con un roleId específico.
   * Requiere header Authorization: Bearer <token>.
   */
  exchangeToken(roleId: string): Observable<RestModelLoginResponseDTO> {
    const { basePath, tokenExchange } = environment.services.msAuth;
    const url = `${basePath}${tokenExchange}`;
    const token = this.tokenService.getToken() ?? '';

    const correlationId = this.generateUuid();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Correlation-Id': correlationId,
      'Consumer-Id': 'selling-system-web',
      Authorization: `Bearer ${token}`
    });

    const body: RestModelTokenExchangeRequestDTO = {
      token,
      roleId
    };

    return this.http.post<RestModelLoginResponseDTO>(url, body, { headers }).pipe(
      tap((res) => {
        this.tokenService.saveSession(res);
      })
    );
  }

  /**
   * Flujo de inicio de sesión de usuario / propietario (compatibilidad con vistas existentes).
   */
  login(credentials: LoginCredentials): Observable<LoginResponseDTO> {
    const request: RestModelLoginRequestDTO = {
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
   * Obtiene el storeId de la tienda persistida en localStorage o asignada en el flujo previo.
   */
  loginEmployee(credentials: EmployeeLoginCredentials): Observable<LoginResponseDTO> {
    const storedStore = this.getStoredStore();
    const candidateStoreId = credentials.companyNit;

    // Si companyNit es un UUID válido se usa directamente, de lo contrario se obtiene de la tienda persistida
    let storeId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    if (candidateStoreId && this.isValidUuid(candidateStoreId)) {
      storeId = candidateStoreId;
    } else if (storedStore?.id && this.isValidUuid(storedStore.id)) {
      storeId = storedStore.id;
    }

    const request: RestModelEmployeeLoginRequestDTO = {
      storeId,
      username: credentials.cashierCode,
      password: credentials.pin,
      accessType: 'POS'
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
   * La tienda del empleado se mantiene persistida en localStorage según requerimiento.
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
  ): Observable<RestModelLoginResponseDTO> {
    this.tokenService.simulateSession();
    this.syncUserFromToken(username, role, storeId);

    const token = this.tokenService.getToken() ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated';
    const simulatedRes: RestModelLoginResponseDTO = {
      token: token,
      refreshToken: this.tokenService.getRefreshToken() ?? 'simulated-refresh-token',
      tokenType: 'Bearer'
    };

    return of(simulatedRes).pipe(delay(400));
  }

  /**
   * Sincroniza los datos del usuario a partir del payload decodificado del JWT en cookie.
   */
  private syncUserFromToken(
    usernameFallback?: string,
    roleFallback: 'owner' | 'staff' = 'owner',
    storeFallback?: string
  ): void {
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

  private getStoredStore(): CompanyStore | StoreSummary | null {
    try {
      const stored =
        localStorage.getItem('selected_company_store') ||
        localStorage.getItem('employee_selected_company');
      if (stored) {
        return JSON.parse(stored) as CompanyStore | StoreSummary;
      }
    } catch {
      return null;
    }
    return null;
  }

  private isValidUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

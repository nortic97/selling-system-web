import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, delay, of, throwError } from 'rxjs';
import {
  AuthResponse,
  AuthUser,
  CompanyInfo,
  EmployeeLoginCredentials,
  LoginCredentials
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  // Signal state para usuario autenticado
  private readonly _currentUser = signal<AuthUser | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

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
   * Consulta y valida la existencia de la empresa a partir del NIT o identificador.
   */
  verifyCompany(nit: string): Observable<CompanyInfo> {
    const cleanNit = nit.trim().toUpperCase();

    // Simulación de validación: si está vacío o es un identificador inválido
    if (!cleanNit || cleanNit.length < 5 || cleanNit === '000000000') {
      return throwError(() => ({
        error: { message: 'El NIT o identificador no se encuentra registrado en el sistema.' }
      })).pipe(delay(500));
    }

    const mockCompany: CompanyInfo = {
      nit: cleanNit,
      name: 'Comercializadora y Distribuciones del Norte S.A.S.',
      tradeName: 'Nortic Retail & POS',
      status: 'active'
    };

    return of(mockCompany).pipe(
      delay(500),
      tap((company) => {
        this._selectedCompany.set(company);
      })
    );
  }

  /**
   * Limpia la empresa actualmente seleccionada para permitir cambiarla.
   */
  clearCompany(): void {
    this._selectedCompany.set(null);
  }

  /**
   * Realiza la autenticación del propietario/administrador.
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const mockResponse: AuthResponse = {
      token: 'jwt-owner-token-sample',
      user: {
        id: 'usr-owner-101',
        username: credentials.username,
        name: 'Administrador Propietario',
        role: 'owner',
        companyNit: credentials.companyNit ?? this._selectedCompany()?.nit
      }
    };

    return of(mockResponse).pipe(
      delay(600),
      tap((res) => {
        this._currentUser.set(res.user);
        if (credentials.rememberMe) {
          localStorage.setItem('auth_token', res.token);
        } else {
          sessionStorage.setItem('auth_token', res.token);
        }
      })
    );
  }

  /**
   * Realiza la autenticación del empleado / cajero en terminal POS.
   */
  loginEmployee(credentials: EmployeeLoginCredentials): Observable<AuthResponse> {
    const mockResponse: AuthResponse = {
      token: 'jwt-staff-token-sample',
      user: {
        id: `caj-${credentials.cashierCode}`,
        username: `${credentials.cashierCode.toLowerCase()}@pos.local`,
        name: `Colaborador ${credentials.cashierCode}`,
        role: 'staff',
        companyNit: credentials.companyNit ?? this._selectedCompany()?.nit
      }
    };

    return of(mockResponse).pipe(
      delay(500),
      tap((res) => {
        this._currentUser.set(res.user);
        if (credentials.rememberMe) {
          localStorage.setItem('auth_token', res.token);
        } else {
          sessionStorage.setItem('auth_token', res.token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    this._currentUser.set(null);
    this._selectedCompany.set(null);
  }
}

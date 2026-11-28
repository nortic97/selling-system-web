import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, delay, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RestModelEmployeeWorkspaceResponseDTO,
  RestModelCreateEmployeeWorkspaceRequestDTO,
  RestModelUpdateEmployeeWorkspaceRequestDTO,
  RestModelPaginatedEmployeeWorkspaceResponseDTO,
  EmployeeWorkspaceResponseDTO,
  CreateEmployeeWorkspaceRequestDTO,
  UpdateEmployeeWorkspaceRequestDTO,
  PaginatedEmployeeWorkspaceResponseDTO
} from '../models/employee-workspace.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  // Signal reactivo para los espacios de trabajo del empleado actual
  private readonly _currentWorkspaces = signal<EmployeeWorkspaceResponseDTO[]>([]);
  readonly currentWorkspaces = this._currentWorkspaces.asReadonly();

  // Espacio de trabajo activo por defecto
  private readonly _activeWorkspace = signal<EmployeeWorkspaceResponseDTO | null>(null);
  readonly activeWorkspace = this._activeWorkspace.asReadonly();

  /**
   * Obtiene un espacio de trabajo por su UUID.
   */
  getWorkspaceById(id: string): Observable<RestModelEmployeeWorkspaceResponseDTO> {
    const { basePath, getById } = environment.services.esEmployeeWorkspace;
    const url = `${basePath}${(getById || '/:id').replace(':id', encodeURIComponent(id))}`;
    const headers = this.createHeaders();

    return this.http.get<RestModelEmployeeWorkspaceResponseDTO>(url, { headers });
  }

  /**
   * Obtiene los espacios de trabajo asociados a un empleado específico (paginado).
   */
  getWorkspacesByEmployee(
    employeeId: string,
    page: number = 0,
    size: number = 5,
    sort?: string[]
  ): Observable<RestModelPaginatedEmployeeWorkspaceResponseDTO> {
    const { basePath, getByEmployee } = environment.services.esEmployeeWorkspace;
    const url = `${basePath}${(getByEmployee || '/employee/:employeeId').replace(':employeeId', encodeURIComponent(employeeId))}`;
    const headers = this.createHeaders();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort && sort.length > 0) {
      sort.forEach((s) => {
        params = params.append('sort', s);
      });
    }

    return this.http
      .get<RestModelPaginatedEmployeeWorkspaceResponseDTO>(url, { headers, params })
      .pipe(
        tap((res) => {
          this._currentWorkspaces.set(res.content || []);
          const defaultWs = res.content?.find((w) => w.isDefault) ?? res.content?.[0] ?? null;
          this._activeWorkspace.set(defaultWs);
        }),
        // Fallback simulado cuando el backend aún no está disponible
        catchError(() => {
          return this.createSimulatedWorkspaces(employeeId, page, size);
        })
      );
  }

  /**
   * Registra una nueva asignación de empleado a tienda, sucursal y rol.
   */
  createWorkspace(
    request: RestModelCreateEmployeeWorkspaceRequestDTO
  ): Observable<RestModelEmployeeWorkspaceResponseDTO> {
    const { basePath, create } = environment.services.esEmployeeWorkspace;
    const url = `${basePath}${create || ''}`;
    const headers = this.createHeaders();

    return this.http.post<RestModelEmployeeWorkspaceResponseDTO>(url, request, { headers });
  }

  /**
   * Actualiza sucursal, rol o estado default de un espacio de trabajo.
   */
  updateWorkspace(
    id: string,
    request: RestModelUpdateEmployeeWorkspaceRequestDTO
  ): Observable<RestModelEmployeeWorkspaceResponseDTO> {
    const { basePath, update } = environment.services.esEmployeeWorkspace;
    const url = `${basePath}${(update || '/:id').replace(':id', encodeURIComponent(id))}`;
    const headers = this.createHeaders();

    return this.http.put<RestModelEmployeeWorkspaceResponseDTO>(url, request, { headers });
  }

  /**
   * Eliminación lógica (Soft delete) de un espacio de trabajo.
   */
  deleteWorkspace(id: string): Observable<void> {
    const { basePath, delete: delPath } = environment.services.esEmployeeWorkspace;
    const url = `${basePath}${(delPath || '/:id').replace(':id', encodeURIComponent(id))}`;
    const headers = this.createHeaders();

    return this.http.delete<void>(url, { headers });
  }

  /**
   * Restaura un espacio de trabajo eliminado lógicamente.
   */
  restoreWorkspace(id: string): Observable<RestModelEmployeeWorkspaceResponseDTO> {
    const { basePath, restore } = environment.services.esEmployeeWorkspace;
    const url = `${basePath}${(restore || '/:id/restore').replace(':id', encodeURIComponent(id))}`;
    const headers = this.createHeaders();

    return this.http.patch<RestModelEmployeeWorkspaceResponseDTO>(url, {}, { headers });
  }

  /**
   * Actualiza el timestamp de último acceso del espacio de trabajo.
   */
  updateLastAccess(id: string): Observable<RestModelEmployeeWorkspaceResponseDTO> {
    const { basePath, updateLastAccess } = environment.services.esEmployeeWorkspace;
    const url = `${basePath}${(updateLastAccess || '/:id/last-access').replace(':id', encodeURIComponent(id))}`;
    const headers = this.createHeaders();

    return this.http.patch<RestModelEmployeeWorkspaceResponseDTO>(url, {}, { headers });
  }

  /**
   * Obtiene los espacios de trabajo por tienda.
   */
  getWorkspacesByStore(
    storeId: string,
    page: number = 0,
    size: number = 5,
    sort?: string[]
  ): Observable<RestModelPaginatedEmployeeWorkspaceResponseDTO> {
    const { basePath, getByStore } = environment.services.esEmployeeWorkspace;
    const url = `${basePath}${(getByStore || '/store/:storeId').replace(':storeId', encodeURIComponent(storeId))}`;
    const headers = this.createHeaders();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort && sort.length > 0) {
      sort.forEach((s) => {
        params = params.append('sort', s);
      });
    }

    return this.http.get<RestModelPaginatedEmployeeWorkspaceResponseDTO>(url, { headers, params });
  }

  setActiveWorkspace(workspace: EmployeeWorkspaceResponseDTO): void {
    this._activeWorkspace.set(workspace);
  }

  private createHeaders(): HttpHeaders {
    const correlationId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : this.generateUuid();

    let headers = new HttpHeaders({
      'Correlation-Id': correlationId,
      'Consumer-Id': 'selling-system-web',
      'Content-Type': 'application/json'
    });

    const token = this.tokenService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private createSimulatedWorkspaces(
    employeeId: string,
    page: number,
    size: number
  ): Observable<RestModelPaginatedEmployeeWorkspaceResponseDTO> {
    const mockWorkspaces: RestModelEmployeeWorkspaceResponseDTO[] = [
      {
        id: '9c58b456-42d1-4be3-a8df-6bf9618c7d01',
        storeId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        employeeId: employeeId,
        branchId: 'b75f9211-1c3a-4be3-9d22-55af1982b101',
        roleId: 'c82301ef-52b3-4679-b143-6df182103a01',
        isDefault: true,
        lastAccessAt: new Date().toISOString(),
        isActive: true,
        createdAt: '2026-01-15T08:00:00Z',
        updatedAt: '2026-02-10T14:30:00Z',
        deletedAt: null
      },
      {
        id: '9c58b456-42d1-4be3-a8df-6bf9618c7d02',
        storeId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        employeeId: employeeId,
        branchId: 'b75f9211-1c3a-4be3-9d22-55af1982b102',
        roleId: 'c82301ef-52b3-4679-b143-6df182103a02',
        isDefault: false,
        lastAccessAt: '2026-02-20T10:15:00Z',
        isActive: true,
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-02-15T11:20:00Z',
        deletedAt: null
      }
    ];

    const response: RestModelPaginatedEmployeeWorkspaceResponseDTO = {
      content: mockWorkspaces,
      totalElements: mockWorkspaces.length,
      totalPages: 1,
      size: size,
      number: page,
      first: page === 0,
      last: true
    };

    this._currentWorkspaces.set(mockWorkspaces);
    this._activeWorkspace.set(mockWorkspaces[0]);

    return of(response).pipe(delay(250));
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

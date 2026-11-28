import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, delay, finalize, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompanyStore,
  StorePageResponse,
  StoreSummary,
  TaxType,
  RestModelStoreResponseDTO,
  RestModelStoreBasicResponseDTO,
  RestModelStoreRequestDTO,
  RestModelUpdateStoreRequestDTO,
  RestModelStatusRequest,
  RestModelPhoneRequestDTO,
  RestModelEmailRequestDTO,
  RestModelPaginatedStoreResponseDTO
} from '../models/company-store.model';
import { LoaderService } from './loader.service';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly loaderService = inject(LoaderService);
  private readonly tokenService = inject(TokenService);

  private readonly STORAGE_KEY = 'selected_company_store';
  private readonly LEGACY_STORAGE_KEY = 'employee_selected_company';

  // Signal reactivo para la tienda / empresa actualmente seleccionada
  private readonly _currentStore = signal<CompanyStore | StoreSummary | null>(this.getStoredStore());
  readonly currentStore = this._currentStore.asReadonly();
  readonly hasStore = computed(() => this._currentStore() !== null);

  // Alias para interoperabilidad
  readonly selectedCompany = this.currentStore;
  readonly hasSelectedCompany = this.hasStore;

  // Estado del modal de selección de tienda para Owner
  readonly isStoreModalOpen = signal<boolean>(false);

  openStoreModal(): void {
    this.isStoreModalOpen.set(true);
  }

  closeStoreModal(): void {
    this.isStoreModalOpen.set(false);
  }

  /**
   * Consulta las tiendas asociadas al Owner autenticado en esStore con paginación y headers requeridos:
   * Headers: Owner-Id (desde sub del token), Consumer-Id, Correlation-Id.
   */
  getStoresByOwner(
    page: number = 0,
    size: number = 10,
    sort: string = 'name,asc'
  ): Observable<StorePageResponse> {
    return this.getAllStores(page, size, [sort]);
  }

  /**
   * Listar todas las tiendas del propietario (GET /api/v1/es/store)
   */
  getAllStores(
    page: number = 0,
    size: number = 10,
    sort?: string[]
  ): Observable<RestModelPaginatedStoreResponseDTO> {
    const { basePath, getAllStores } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const url = `${cleanBasePath}${getAllStores || ''}`;

    const ownerId = this.tokenService.userId() || 'ae250ea2-29df-4166-ab3f-62722667f135';
    const correlationId = this.generateUuid();

    const headers = new HttpHeaders({
      'Owner-Id': ownerId,
      'Consumer-Id': 'selling-system-web',
      'Correlation-Id': correlationId
    });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort && sort.length > 0) {
      sort.forEach((s) => {
        params = params.append('sort', s);
      });
    }

    this.loaderService.show('Cargando sucursales disponibles...');

    return this.http.get<RestModelPaginatedStoreResponseDTO>(url, { headers, params }).pipe(
      catchError(() => {
        return this.createSimulatedStorePage(page, size, ownerId);
      }),
      finalize(() => {
        this.loaderService.hide();
      })
    );
  }

  /**
   * Obtener una tienda por ID (GET /api/v1/es/store/{id})
   */
  getStoreById(id: string): Observable<RestModelStoreResponseDTO> {
    const { basePath, getStoreById } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const path = (getStoreById || '/:id').replace(':id', encodeURIComponent(id));
    const url = `${cleanBasePath}${path.startsWith('/') ? path : `/${path}`}`;

    const headers = this.createDefaultHeaders();
    return this.http.get<RestModelStoreResponseDTO>(url, { headers });
  }

  /**
   * Crear una nueva tienda (POST /api/v1/es/store)
   */
  createStore(request: RestModelStoreRequestDTO): Observable<RestModelStoreResponseDTO> {
    const { basePath, createStore } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const url = `${cleanBasePath}${createStore || ''}`;

    const headers = this.createDefaultHeaders();
    return this.http.post<RestModelStoreResponseDTO>(url, request, { headers });
  }

  /**
   * Actualizar una tienda (PUT /api/v1/es/store/{id})
   */
  updateStore(
    id: string,
    request: RestModelUpdateStoreRequestDTO
  ): Observable<RestModelStoreResponseDTO> {
    const { basePath, updateStore } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const path = (updateStore || '/:id').replace(':id', encodeURIComponent(id));
    const url = `${cleanBasePath}${path.startsWith('/') ? path : `/${path}`}`;

    const headers = this.createDefaultHeaders();
    return this.http.put<RestModelStoreResponseDTO>(url, request, { headers });
  }

  /**
   * Eliminar una tienda (soft delete) (DELETE /api/v1/es/store/{id})
   */
  deleteStore(id: string): Observable<void> {
    const { basePath, deleteStore } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const path = (deleteStore || '/:id').replace(':id', encodeURIComponent(id));
    const url = `${cleanBasePath}${path.startsWith('/') ? path : `/${path}`}`;

    const headers = this.createDefaultHeaders();
    return this.http.delete<void>(url, { headers });
  }

  /**
   * Actualizar estado de una tienda (PATCH /api/v1/es/store/{id}/status)
   */
  changeStatus(id: string, active: boolean): Observable<RestModelStoreResponseDTO> {
    const { basePath, changeStatus } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const path = (changeStatus || '/:id/status').replace(':id', encodeURIComponent(id));
    const url = `${cleanBasePath}${path.startsWith('/') ? path : `/${path}`}`;

    const headers = this.createDefaultHeaders();
    const body: RestModelStatusRequest = { active };
    return this.http.patch<RestModelStoreResponseDTO>(url, body, { headers });
  }

  /**
   * Restaurar una tienda eliminada (PATCH /api/v1/es/store/{id}/restore)
   */
  restoreStore(id: string): Observable<RestModelStoreResponseDTO> {
    const { basePath, restoreStore } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const path = (restoreStore || '/:id/restore').replace(':id', encodeURIComponent(id));
    const url = `${cleanBasePath}${path.startsWith('/') ? path : `/${path}`}`;

    const headers = this.createDefaultHeaders();
    return this.http.patch<RestModelStoreResponseDTO>(url, {}, { headers });
  }

  /**
   * Cambiar número de teléfono de una tienda (PATCH /api/v1/es/store/{id}/phone)
   */
  changePhone(id: string, phoneNumber: string): Observable<RestModelStoreResponseDTO> {
    const { basePath, changePhone } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const path = (changePhone || '/:id/phone').replace(':id', encodeURIComponent(id));
    const url = `${cleanBasePath}${path.startsWith('/') ? path : `/${path}`}`;

    const headers = this.createDefaultHeaders();
    const body: RestModelPhoneRequestDTO = { phoneNumber };
    return this.http.patch<RestModelStoreResponseDTO>(url, body, { headers });
  }

  /**
   * Cambiar correo electrónico de una tienda (PATCH /api/v1/es/store/{id}/email)
   */
  changeEmail(id: string, contactEmail: string): Observable<RestModelStoreResponseDTO> {
    const { basePath, changeEmail } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const path = (changeEmail || '/:id/email').replace(':id', encodeURIComponent(id));
    const url = `${cleanBasePath}${path.startsWith('/') ? path : `/${path}`}`;

    const headers = this.createDefaultHeaders();
    const body: RestModelEmailRequestDTO = { contactEmail };
    return this.http.patch<RestModelStoreResponseDTO>(url, body, { headers });
  }

  /**
   * Consulta los datos de la tienda/empresa en es-store por tipo e identificación fiscal.
   */
  getStoreByTax(taxType: TaxType | string, taxId: string): Observable<CompanyStore> {
    const cleanTaxType = taxType.trim().toUpperCase();
    const cleanTaxId = taxId.trim();

    const { basePath, getStoreByTaxIdAndTaxType } = environment.services.esStore;
    const pathTemplate = getStoreByTaxIdAndTaxType || '/tax-id/:taxType/:taxId';

    const resolvedPath = pathTemplate
      .replace(':taxType', encodeURIComponent(cleanTaxType))
      .replace(':taxId', encodeURIComponent(cleanTaxId));

    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const cleanPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`;
    const url = `${cleanBasePath}${cleanPath}`;

    const correlationId = this.generateUuid();

    const headers = new HttpHeaders({
      'Correlation-Id': correlationId,
      'Consumer-Id': 'selling-system-web'
    });

    this.loaderService.show('Consultando datos de la empresa...');

    return this.http.get<CompanyStore>(url, { headers }).pipe(
      tap((store) => {
        this.setCurrentStore(store);
      }),
      finalize(() => {
        this.loaderService.hide();
      })
    );
  }

  /**
   * Alias de getStoreByTax según la operación del contrato.
   */
  getStoreByTaxIdAndTaxType(taxType: TaxType | string, taxId: string): Observable<CompanyStore> {
    return this.getStoreByTax(taxType, taxId);
  }

  /**
   * Asigna la tienda al Signal reactivo y persiste en localStorage.
   */
  setCurrentStore(store: CompanyStore | StoreSummary): void {
    this._currentStore.set(store);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
      localStorage.setItem(this.LEGACY_STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Manejo silencioso en entornos restringidos
    }
  }

  setSelectedCompany(store: CompanyStore | StoreSummary): void {
    this.setCurrentStore(store);
  }

  /**
   * Limpia la tienda en memoria y elimina del almacenamiento persistente.
   */
  clearStore(): void {
    this._currentStore.set(null);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.LEGACY_STORAGE_KEY);
    } catch {
      // Manejo silencioso
    }
  }

  clearCompany(): void {
    this.clearStore();
  }

  /**
   * Recupera la tienda persistida desde localStorage si existe.
   */
  getStoredStore(): CompanyStore | StoreSummary | null {
    try {
      const stored =
        localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as CompanyStore | StoreSummary;
      }
    } catch {
      return null;
    }
    return null;
  }

  private createDefaultHeaders(): HttpHeaders {
    const correlationId = this.generateUuid();
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

  /**
   * Genera datos simulados respetando la estructura exacta del backend.
   */
  private createSimulatedStorePage(
    page: number,
    size: number,
    ownerId: string
  ): Observable<StorePageResponse> {
    const demoStores: StoreSummary[] = [
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa1',
        ownerId: ownerId,
        taxType: 'NIT',
        taxId: '900.123.456-1',
        legalName: 'Comercializadora Nortic Central S.A.S.',
        name: 'Sucursal Principal Centro B2B',
        description: 'Sede matriz y centro de operaciones logísticas',
        slogan: 'Líderes en distribución comercial',
        logoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=128&q=80',
        address: 'Calle 50 # 45-20, Centro Empresarial',
        country: 'Colombia',
        stateProvince: 'Antioquia',
        city: 'Medellín',
        phoneNumber: '+57 604 444 5566',
        contactEmail: 'central@nortic.com.co',
        currencyCode: 'COP',
        isActive: true,
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-02-15T16:20:00Z'
      },
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa2',
        ownerId: ownerId,
        taxType: 'NIT',
        taxId: '900.123.456-2',
        legalName: 'Nortic Retail Mall Plaza S.A.S.',
        name: 'Punto de Venta Norte Mall',
        description: 'Tienda directa a retail y atención de clientes corporativos',
        slogan: 'Calidad y atención inmediata',
        logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=128&q=80',
        address: 'Cra 43A # 1-50, Local 204',
        country: 'Colombia',
        stateProvince: 'Antioquia',
        city: 'Medellín',
        phoneNumber: '+57 604 321 9988',
        contactEmail: 'mallplaza@nortic.com.co',
        currencyCode: 'COP',
        isActive: true,
        createdAt: '2026-01-20T11:30:00Z',
        updatedAt: '2026-02-18T09:15:00Z'
      }
    ];

    const response: StorePageResponse = {
      content: demoStores,
      totalElements: demoStores.length,
      totalPages: 1,
      size: size,
      number: page,
      first: page === 0,
      last: true
    };

    return of(response).pipe(delay(350));
  }
}

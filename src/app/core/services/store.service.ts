import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, finalize, tap, catchError, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanyStore, StorePageResponse, StoreSummary, TaxType } from '../models/company-store.model';
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
    const { basePath } = environment.services.esStore;
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const url = cleanBasePath;

    // Owner-Id extraído del sub del token JWT (o fallback UUID del usuario según requerimiento)
    const ownerId = this.tokenService.userId() || 'ae250ea2-29df-4166-ab3f-62722667f135';

    const correlationId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : this.generateUuidFallback();

    const headers = new HttpHeaders({
      'Owner-Id': ownerId,
      'Consumer-Id': 'selling-system-web',
      'Correlation-Id': correlationId
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    this.loaderService.show('Cargando sucursales disponibles...');

    return this.http.get<StorePageResponse>(url, { headers, params }).pipe(
      catchError(() => {
        // Fallback simulado cuando el backend aún no está levantado en localhost:8082
        return this.createSimulatedStorePage(page, size, ownerId);
      }),
      finalize(() => {
        this.loaderService.hide();
      })
    );
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

    const correlationId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : this.generateUuidFallback();

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

  private generateUuidFallback(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Genera datos simulados respetando la estructura exacta del backend:
   * content, totalElements, totalPages, size, number, first, last.
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
        slogan: 'Líderes en distribución y retail mayorista',
        logoUrl: '',
        address: 'Cra 15 # 85-32, Zona Rosa',
        country: 'Colombia',
        stateProvince: 'Bogotá D.C.',
        city: 'Bogotá',
        phoneNumber: '+57 601 745 2200',
        contactEmail: 'centro@nortic.com.co',
        currencyCode: 'COP',
        isActive: true,
        createdAt: '2026-11-26T14:44:18.161Z',
        updatedAt: '2026-11-26T14:44:18.161Z'
      },
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa2',
        ownerId: ownerId,
        taxType: 'NIT',
        taxId: '900.123.456-2',
        legalName: 'Distribuidora del Norte Mall S.A.S.',
        name: 'Sucursal Norte Mall Plaza',
        description: 'Punto de venta y showroom comercial',
        slogan: 'Tecnología y experiencia de compra premium',
        logoUrl: '',
        address: 'Calle 134 # 9-45, Local 204',
        country: 'Colombia',
        stateProvince: 'Bogotá D.C.',
        city: 'Bogotá',
        phoneNumber: '+57 601 745 2202',
        contactEmail: 'mallplaza@nortic.com.co',
        currencyCode: 'COP',
        isActive: true,
        createdAt: '2026-11-26T14:44:18.161Z',
        updatedAt: '2026-11-26T14:44:18.161Z'
      },
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa3',
        ownerId: ownerId,
        taxType: 'NIT',
        taxId: '900.123.456-3',
        legalName: 'Nortic Industrial & Bodegas S.A.S.',
        name: 'Sucursal Zona Industrial Álamos',
        description: 'Despacho mayorista y almacenamiento central',
        slogan: 'Eficiencia en abastecimiento corporativo',
        logoUrl: '',
        address: 'Av. El Dorado # 68C-61',
        country: 'Colombia',
        stateProvince: 'Cundinamarca',
        city: 'Bogotá',
        phoneNumber: '+57 601 745 2203',
        contactEmail: 'alamos@nortic.com.co',
        currencyCode: 'COP',
        isActive: true,
        createdAt: '2026-11-26T14:44:18.161Z',
        updatedAt: '2026-11-26T14:44:18.161Z'
      },
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa4',
        ownerId: ownerId,
        taxType: 'NIT',
        taxId: '900.123.456-4',
        legalName: 'Puntos Express Nortic S.A.S.',
        name: 'Punto Express Aeropuerto El Dorado',
        description: 'Punto de conveniencia y entrega rápida 24/7',
        slogan: 'Rapidez y atención permanente',
        logoUrl: '',
        address: 'Terminal 1, Muelle Nacional L-12',
        country: 'Colombia',
        stateProvince: 'Bogotá D.C.',
        city: 'Bogotá',
        phoneNumber: '+57 601 745 2204',
        contactEmail: 'aeropuerto@nortic.com.co',
        currencyCode: 'COP',
        isActive: true,
        createdAt: '2026-11-26T14:44:18.161Z',
        updatedAt: '2026-11-26T14:44:18.161Z'
      }
    ];

    const totalElements = 4;
    const totalPages = Math.ceil(totalElements / size);

    const mockResponse: StorePageResponse = {
      content: demoStores,
      totalElements: totalElements,
      totalPages: totalPages,
      size: size,
      number: page,
      first: page === 0,
      last: page >= totalPages - 1
    };

    return of(mockResponse);
  }
}

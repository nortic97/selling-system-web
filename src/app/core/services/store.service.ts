import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanyStore, TaxType } from '../models/company-store.model';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly loaderService = inject(LoaderService);

  private readonly STORAGE_KEY = 'selected_company_store';
  private readonly LEGACY_STORAGE_KEY = 'employee_selected_company';

  // Signal reactivo para la tienda / empresa actualmente seleccionada
  private readonly _currentStore = signal<CompanyStore | null>(this.getStoredStore());
  readonly currentStore = this._currentStore.asReadonly();
  readonly hasStore = computed(() => this._currentStore() !== null);

  // Alias para interoperabilidad
  readonly selectedCompany = this.currentStore;
  readonly hasSelectedCompany = this.hasStore;

  /**
   * Consulta los datos de la tienda/empresa en es-store por tipo e identificación fiscal.
   * Envía los headers de trazabilidad requeridos (Correlation-Id random y Consumer-Id).
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

    const correlationId = typeof crypto !== 'undefined' && crypto.randomUUID
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
  setCurrentStore(store: CompanyStore): void {
    this._currentStore.set(store);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
      localStorage.setItem(this.LEGACY_STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Manejo silencioso en entornos restringidos
    }
  }

  setSelectedCompany(store: CompanyStore): void {
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
  getStoredStore(): CompanyStore | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as CompanyStore;
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
}

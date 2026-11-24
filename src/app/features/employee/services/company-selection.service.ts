import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CompanyStore, TaxType } from '../../../core/models/company-store.model';
import { StoreService } from '../../../core/services/store.service';

/**
 * Servicio de selección de empresa para el módulo de empleados.
 * Delega en StoreService para mantener cohesión de dominio.
 */
@Injectable({
  providedIn: 'root'
})
export class CompanySelectionService {
  private readonly storeService = inject(StoreService);

  readonly selectedCompany = this.storeService.currentStore;
  readonly hasSelectedCompany = this.storeService.hasStore;

  getCompanyByTax(taxType: TaxType | string, taxId: string): Observable<CompanyStore> {
    return this.storeService.getStoreByTax(taxType, taxId);
  }

  setSelectedCompany(company: CompanyStore): void {
    this.storeService.setCurrentStore(company);
  }

  clearCompany(): void {
    this.storeService.clearStore();
  }

  getStoredCompany(): CompanyStore | null {
    return this.storeService.getStoredStore();
  }
}

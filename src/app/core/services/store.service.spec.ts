import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { StoreService } from './store.service';
import { CompanyStore, TaxTypeEnum } from '../models/company-store.model';
import { LoaderService } from './loader.service';
import { environment } from '../../../environments/environment';

describe('StoreService', () => {
  let service: StoreService;
  let httpTesting: HttpTestingController;
  let loaderService: LoaderService;

  const mockStore: CompanyStore = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    taxType: 'NIT',
    taxId: '901234567-1',
    legalName: 'Nortic SAS',
    name: 'Nortic POS',
    description: 'Punto de venta y distribución',
    slogan: 'Tecnología comercial',
    logoUrl: 'https://example.com/logo.png',
    country: 'Colombia',
    stateProvince: 'Antioquia',
    city: 'Medellín'
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        StoreService,
        LoaderService
      ]
    });
    service = TestBed.inject(StoreService);
    httpTesting = TestBed.inject(HttpTestingController);
    loaderService = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created with initial empty store', () => {
    expect(service).toBeTruthy();
    expect(service.currentStore()).toBeNull();
    expect(service.hasStore()).toBe(false);
  });

  it('should request store by taxType and taxId with correlation headers', () => {
    service.getStoreByTax(TaxTypeEnum.NIT, '901234567-1').subscribe((res) => {
      expect(res).toEqual(mockStore);
      expect(service.currentStore()).toEqual(mockStore);
      expect(service.hasStore()).toBe(true);
    });

    const expectedUrl = `${environment.services.esStore.basePath}/tax-id/NIT/901234567-1`;
    const req = httpTesting.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Correlation-Id')).toBe(true);
    expect(req.request.headers.get('Consumer-Id')).toBe('selling-system-web');

    req.flush(mockStore);

    expect(localStorage.getItem('selected_company_store')).toBeTruthy();
  });

  it('should activate loader during request and hide upon completion', () => {
    expect(loaderService.isLoading()).toBe(false);

    service.getStoreByTax('RUT', '12345678').subscribe();

    const expectedUrl = `${environment.services.esStore.basePath}/tax-id/RUT/12345678`;
    const req = httpTesting.expectOne(expectedUrl);

    expect(loaderService.isLoading()).toBe(true);
    req.flush(mockStore);
    expect(loaderService.isLoading()).toBe(false);
  });

  it('should clear store from memory and localStorage', () => {
    service.setCurrentStore(mockStore);
    expect(service.currentStore()).toEqual(mockStore);

    service.clearStore();
    expect(service.currentStore()).toBeNull();
    expect(localStorage.getItem('selected_company_store')).toBeNull();
  });
});

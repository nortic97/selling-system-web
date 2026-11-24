import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CompanySelectionService } from './company-selection.service';
import { CompanyStore, TaxTypeEnum } from '../../../core/models/company-store.model';
import { LoaderService } from '../../../core/services/loader.service';
import { environment } from '../../../../environments/environment';

describe('CompanySelectionService', () => {
  let service: CompanySelectionService;
  let httpTesting: HttpTestingController;
  let loaderService: LoaderService;

  const mockCompany: CompanyStore = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    taxType: 'NIT',
    taxId: '901234567',
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
        CompanySelectionService,
        LoaderService
      ]
    });
    service = TestBed.inject(CompanySelectionService);
    httpTesting = TestBed.inject(HttpTestingController);
    loaderService = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created with no company selected initially', () => {
    expect(service).toBeTruthy();
    expect(service.selectedCompany()).toBeNull();
    expect(service.hasSelectedCompany()).toBe(false);
  });

  it('should request company with Correlation-Id and Consumer-Id headers and path params', () => {
    service.getCompanyByTax(TaxTypeEnum.NIT, '901234567').subscribe((res) => {
      expect(res).toEqual(mockCompany);
      expect(service.selectedCompany()).toEqual(mockCompany);
      expect(service.hasSelectedCompany()).toBe(true);
    });

    const expectedUrl = `${environment.services.esStore.basePath}/tax-id/NIT/901234567`;
    const req = httpTesting.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');

    // Validación de Headers requeridos
    expect(req.request.headers.has('Correlation-Id')).toBe(true);
    expect(req.request.headers.get('Consumer-Id')).toBe('selling-system-web');

    req.flush(mockCompany);

    // Debe persistirse en localStorage
    const stored = localStorage.getItem('employee_selected_company');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual(mockCompany);
  });

  it('should activate and deactivate loader when fetching company', () => {
    expect(loaderService.isLoading()).toBe(false);

    service.getCompanyByTax('RFC', 'ABC123456').subscribe();

    const expectedUrl = `${environment.services.esStore.basePath}/tax-id/RFC/ABC123456`;
    const req = httpTesting.expectOne(expectedUrl);

    // Loader debe estar activo durante la llamada
    expect(loaderService.isLoading()).toBe(true);

    req.flush(mockCompany);

    // Loader se desactiva al completar
    expect(loaderService.isLoading()).toBe(false);
  });

  it('should clear company from memory and localStorage', () => {
    service.setSelectedCompany(mockCompany);
    expect(service.selectedCompany()).toEqual(mockCompany);
    expect(localStorage.getItem('employee_selected_company')).toBeTruthy();

    service.clearCompany();
    expect(service.selectedCompany()).toBeNull();
    expect(localStorage.getItem('employee_selected_company')).toBeNull();
  });
});

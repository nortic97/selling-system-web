import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';
import {
  RestModelLoginRequestDTO,
  RestModelEmployeeLoginRequestDTO,
  RestModelLoginResponseDTO
} from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let tokenService: TokenService;
  let httpTesting: HttpTestingController;

  const mockLoginResponse: RestModelLoginResponseDTO = {
    token: 'header.eyJzdWIiOiJ1c3ItMTAxIiwiZXhwIjoxNzk2MTc5MTg4fQ.signature',
    refreshToken: 'mock-refresh-token',
    tokenType: 'Bearer'
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        TokenService
      ]
    });
    service = TestBed.inject(AuthService);
    tokenService = TestBed.inject(TokenService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created and not authenticated initially', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
  });

  it('should authenticate user and store session in cookie', () => {
    const request: RestModelLoginRequestDTO = {
      username: 'admin',
      password: 'password123',
      accessType: 'SYSTEM'
    };

    service.authenticateUser(request).subscribe((res) => {
      expect(res).toEqual(mockLoginResponse);
      expect(service.currentUser()?.username).toBe('admin');
      expect(service.currentUser()?.role).toBe('owner');
    });

    const expectedUrl = `${environment.services.msAuth.basePath}${environment.services.msAuth.loginUser}`;
    const req = httpTesting.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Correlation-Id')).toBe(true);
    expect(req.request.headers.get('Consumer-Id')).toBe('selling-system-web');
    expect(req.request.body).toEqual(request);

    req.flush(mockLoginResponse);
  });

  it('should authenticate employee and maintain store', () => {
    const request: RestModelEmployeeLoginRequestDTO = {
      storeId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      username: 'cajero01',
      password: 'password123',
      accessType: 'POS'
    };

    service.authenticateEmployee(request).subscribe((res) => {
      expect(res).toEqual(mockLoginResponse);
      expect(service.currentUser()?.role).toBe('staff');
    });

    const expectedUrl = `${environment.services.msAuth.basePath}${environment.services.msAuth.loginEmployee}`;
    const req = httpTesting.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Correlation-Id')).toBe(true);
    expect(req.request.headers.get('Consumer-Id')).toBe('selling-system-web');
    expect(req.request.body).toEqual(request);

    req.flush(mockLoginResponse);
  });

  it('should exchange token with roleId', () => {
    service.exchangeToken('role-uuid-101').subscribe((res) => {
      expect(res).toEqual(mockLoginResponse);
    });

    const expectedUrl = `${environment.services.msAuth.basePath}${environment.services.msAuth.tokenExchange}`;
    const req = httpTesting.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Correlation-Id')).toBe(true);
    expect(req.request.headers.get('Consumer-Id')).toBe('selling-system-web');
    expect(req.request.body.roleId).toBe('role-uuid-101');

    req.flush(mockLoginResponse);
  });
});

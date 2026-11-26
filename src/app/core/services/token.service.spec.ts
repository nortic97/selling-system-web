import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { AuthTokenPayload } from '../models/auth-token-payload.model';

describe('TokenService', () => {
  let service: TokenService;
  let cookieService: CookieService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenService, CookieService]
    });
    service = TestBed.inject(TokenService);
    cookieService = TestBed.inject(CookieService);
  });

  afterEach(() => {
    service.clearSession();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should simulate session and correctly decode JWT payload matching the schema', () => {
    service.simulateSession();

    expect(service.token()).toBeTruthy();
    const payload = service.payload();
    expect(payload).toBeTruthy();
    expect(payload?.iss).toBe('ms-auth');
    expect(payload?.sub).toBe('ae250ea2-29df-4166-ab3f-62722667f135');
    expect(payload?.type).toBe('access');
    expect(payload?.permissions).toContain('employee_workspace.all');
    expect(payload?.permissions).toContain('store.create');
    expect(payload?.permissions).toContain('system.all');
    expect(service.hasPermission('employee_workspace.all')).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should clear session cookies on clearSession()', () => {
    service.simulateSession();
    expect(service.isAuthenticated()).toBe(true);

    service.clearSession();
    expect(service.token()).toBeNull();
    expect(service.payload()).toBeNull();
  });
});

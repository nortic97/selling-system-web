import { TestBed } from '@angular/core/testing';
import { CookieService } from './cookie.service';

describe('CookieService', () => {
  let service: CookieService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CookieService]
    });
    service = TestBed.inject(CookieService);
  });

  afterEach(() => {
    service.delete('test_key');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get a cookie value', () => {
    service.set('test_key', 'test_value', { path: '/' });
    expect(service.get('test_key')).toBe('test_value');
    expect(service.has('test_key')).toBe(true);
  });

  it('should delete a cookie', () => {
    service.set('test_key', 'test_value', { path: '/' });
    expect(service.has('test_key')).toBe(true);

    service.delete('test_key', '/');
    expect(service.get('test_key')).toBeNull();
    expect(service.has('test_key')).toBe(false);
  });
});

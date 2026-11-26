import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { TokenService } from '../services/token.service';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        TokenService
      ]
    });
  });

  it('should allow access in development preparation mode', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/employee/dashboard' } as any)
    );
    expect(result).toBe(true);
  });
});

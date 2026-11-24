import { TestBed } from '@angular/core/testing';
import { LoaderService } from './loader.service';

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoaderService);
  });

  it('should be created with initial idle state', () => {
    expect(service).toBeTruthy();
    expect(service.isLoading()).toBe(false);
    expect(service.activeRequests()).toBe(0);
    expect(service.message()).toBeNull();
  });

  it('should set isLoading to true and record message when show() is called', () => {
    service.show('Cargando datos...');
    expect(service.isLoading()).toBe(true);
    expect(service.activeRequests()).toBe(1);
    expect(service.message()).toBe('Cargando datos...');
  });

  it('should handle concurrent requests and turn off only when all finish', () => {
    service.show('Request 1');
    service.show('Request 2');
    expect(service.activeRequests()).toBe(2);
    expect(service.isLoading()).toBe(true);

    service.hide();
    expect(service.activeRequests()).toBe(1);
    expect(service.isLoading()).toBe(true);

    service.hide();
    expect(service.activeRequests()).toBe(0);
    expect(service.isLoading()).toBe(false);
    expect(service.message()).toBeNull();
  });

  it('should not allow negative request count on multiple hide() calls', () => {
    service.hide();
    service.hide();
    expect(service.activeRequests()).toBe(0);
    expect(service.isLoading()).toBe(false);
  });

  it('should reset state completely when forceHide() is invoked', () => {
    service.show('Operación en progreso');
    service.show('Segunda operación');
    service.forceHide();
    expect(service.activeRequests()).toBe(0);
    expect(service.isLoading()).toBe(false);
    expect(service.message()).toBeNull();
  });
});

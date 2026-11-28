import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EmployeeWorkspaceService } from './employee-workspace.service';
import { environment } from '../../../environments/environment';
import {
  RestModelEmployeeWorkspaceResponseDTO,
  RestModelPaginatedEmployeeWorkspaceResponseDTO
} from '../models/employee-workspace.model';

describe('EmployeeWorkspaceService', () => {
  let service: EmployeeWorkspaceService;
  let httpTesting: HttpTestingController;

  const mockWorkspace: RestModelEmployeeWorkspaceResponseDTO = {
    id: '9c58b456-42d1-4be3-a8df-6bf9618c7d01',
    storeId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    employeeId: 'emp-101',
    branchId: 'b75f9211-1c3a-4be3-9d22-55af1982b101',
    roleId: 'c82301ef-52b3-4679-b143-6df182103a01',
    isDefault: true,
    lastAccessAt: '2026-02-28T12:00:00Z',
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-02-10T14:30:00Z',
    deletedAt: null
  };

  const mockPageResponse: RestModelPaginatedEmployeeWorkspaceResponseDTO = {
    content: [mockWorkspace],
    totalElements: 1,
    totalPages: 1,
    size: 5,
    number: 0,
    first: true,
    last: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EmployeeWorkspaceService
      ]
    });
    service = TestBed.inject(EmployeeWorkspaceService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created with empty workspaces', () => {
    expect(service).toBeTruthy();
    expect(service.currentWorkspaces()).toEqual([]);
    expect(service.activeWorkspace()).toBeNull();
  });

  it('should get workspaces by employee with headers and update signals', () => {
    service.getWorkspacesByEmployee('emp-101').subscribe((res) => {
      expect(res.content.length).toBe(1);
      expect(service.currentWorkspaces()).toEqual([mockWorkspace]);
      expect(service.activeWorkspace()).toEqual(mockWorkspace);
    });

    const expectedUrl = `${environment.services.esEmployeeWorkspace.basePath}/employee/emp-101?page=0&size=5`;
    const req = httpTesting.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Correlation-Id')).toBe(true);
    expect(req.request.headers.get('Consumer-Id')).toBe('selling-system-web');

    req.flush(mockPageResponse);
  });

  it('should get workspace by id', () => {
    service.getWorkspaceById('9c58b456-42d1-4be3-a8df-6bf9618c7d01').subscribe((res) => {
      expect(res).toEqual(mockWorkspace);
    });

    const expectedUrl = `${environment.services.esEmployeeWorkspace.basePath}/9c58b456-42d1-4be3-a8df-6bf9618c7d01`;
    const req = httpTesting.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');

    req.flush(mockWorkspace);
  });
});

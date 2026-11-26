import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { StoreSelectionModal } from './store-selection-modal';
import { StoreService } from '../../../../core/services/store.service';
import { StorePageResponse } from '../../../../core/models/company-store.model';

describe('StoreSelectionModal', () => {
  let component: StoreSelectionModal;
  let fixture: ComponentFixture<StoreSelectionModal>;
  let storeService: StoreService;

  const mockPage: StorePageResponse = {
    content: [
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa1',
        ownerId: 'owner-1',
        taxType: 'NIT',
        taxId: '900.123.456-1',
        name: 'Sucursal Principal Centro B2B',
        isActive: true,
        city: 'Bogotá'
      },
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa2',
        ownerId: 'owner-1',
        taxType: 'NIT',
        taxId: '900.123.456-2',
        name: 'Sucursal Norte Mall Plaza',
        isActive: true,
        city: 'Bogotá'
      }
    ],
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreSelectionModal],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        StoreService
      ]
    }).compileComponents();

    storeService = TestBed.inject(StoreService);
    vi.spyOn(storeService, 'getStoresByOwner').mockReturnValue(of(mockPage));

    fixture = TestBed.createComponent(StoreSelectionModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create store selection modal', () => {
    expect(component).toBeTruthy();
  });

  it('should load stores on initialization', () => {
    component.loadStores();
    expect(component.storePage()).toBeTruthy();
    expect(component.filteredStores().length).toBe(2);
  });

  it('should filter stores by search query', () => {
    component.loadStores();
    const event = { target: { value: 'Centro' } } as unknown as Event;
    component.onSearchChange(event);
    expect(component.filteredStores().length).toBe(1);
    expect(component.filteredStores()[0].name).toContain('Centro');
  });

  it('should emit storeSelected and close modal when store chosen', () => {
    const selectSpy = vi.spyOn(component.storeSelected, 'emit');
    const closeSpy = vi.spyOn(component.closeModal, 'emit');

    component.onSelectStore(mockPage.content[0]);

    expect(selectSpy).toHaveBeenCalledWith(mockPage.content[0]);
    expect(closeSpy).toHaveBeenCalled();
  });
});

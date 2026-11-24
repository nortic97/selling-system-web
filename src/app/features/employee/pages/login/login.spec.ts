import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { StoreService } from '../../../../core/services/store.service';
import { EmployeeLogin } from './login';
import { TaxTypeEnum } from '../../../../core/models/company-store.model';

describe('EmployeeLogin', () => {
  let component: EmployeeLogin;
  let fixture: ComponentFixture<EmployeeLogin>;
  let authService: AuthService;
  let storeService: StoreService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [EmployeeLogin],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    storeService = TestBed.inject(StoreService);
    fixture = TestBed.createComponent(EmployeeLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the employee login component', () => {
    expect(component).toBeTruthy();
  });

  it('should start at company verification step with default NIT taxType and empty inputs', () => {
    expect(component.currentStep()).toBe('company');
    expect(component.taxTypeControl.value).toBe(TaxTypeEnum.NIT);
    expect(component.taxNumberControl.value).toBe('');
    expect(component.verificationDigitControl.value).toBe('');
    expect(component.companyForm.valid).toBe(false);
  });

  it('should validate tax number and verification digit format', () => {
    component.taxNumberControl.setValue('12');
    expect(component.taxNumberControl.valid).toBe(false);

    component.taxNumberControl.setValue('901234567');
    expect(component.taxNumberControl.valid).toBe(true);

    component.verificationDigitControl.setValue('9');
    expect(component.verificationDigitControl.valid).toBe(true);

    component.verificationDigitControl.setValue('A');
    expect(component.verificationDigitControl.valid).toBe(false);
  });

  it('should advance to credentials step upon successful company verification combining number and DV', () => {
    const spy = vi.spyOn(storeService, 'getStoreByTax').mockReturnValue(
      of({
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        taxType: 'NIT',
        taxId: '901234567-1',
        name: 'Nortic SAS',
        legalName: 'Nortic Retail S.A.S.'
      })
    );

    component.taxNumberControl.setValue('901234567');
    component.verificationDigitControl.setValue('1');
    component.onVerifyCompany();

    expect(spy).toHaveBeenCalledWith(TaxTypeEnum.NIT, '901234567-1');
    expect(component.currentStep()).toBe('credentials');
    expect(authService.selectedCompany()?.nit).toBe('901234567-1');
  });

  it('should validate cashier code and pin length in credentials step', () => {
    const cashierControl = component.cashierControl;
    const pinControl = component.pinControl;

    cashierControl.setValue('12');
    pinControl.setValue('12');
    expect(cashierControl.valid).toBe(false);
    expect(pinControl.valid).toBe(false);

    cashierControl.setValue('CAJ-101');
    pinControl.setValue('1234');
    expect(cashierControl.valid).toBe(true);
    expect(pinControl.valid).toBe(true);
  });

  it('should toggle pin visibility signal', () => {
    expect(component.showPin()).toBe(false);
    component.togglePinVisibility();
    expect(component.showPin()).toBe(true);
  });

  it('should reset company and return to company step when onChangeCompany is called', () => {
    component.currentStep.set('credentials');
    component.onChangeCompany();

    expect(component.currentStep()).toBe('company');
    expect(storeService.currentStore()).toBeNull();
  });

  it('should handle logo load error and display fallback default icon', () => {
    expect(component.logoLoadFailed()).toBe(false);
    component.onLogoError();
    expect(component.logoLoadFailed()).toBe(true);
  });
});

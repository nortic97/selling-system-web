import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { EmployeeLogin } from './login';

describe('EmployeeLogin', () => {
  let component: EmployeeLogin;
  let fixture: ComponentFixture<EmployeeLogin>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLogin],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(EmployeeLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the employee login component', () => {
    expect(component).toBeTruthy();
  });

  it('should start at company verification step', () => {
    expect(component.currentStep()).toBe('company');
    expect(component.companyForm.valid).toBe(false);
  });

  it('should advance to credentials step upon successful company verification', () => {
    vi.spyOn(authService, 'verifyCompany').mockReturnValue(
      of({ nit: '901234567', name: 'Nortic SAS', status: 'active' })
    );

    component.nitControl.setValue('901234567');
    component.onVerifyCompany();
    expect(component.currentStep()).toBe('credentials');
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
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login (Owner)', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the owner login component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values and invalid state', () => {
    expect(component.loginForm.value.username).toBe('');
    expect(component.loginForm.value.password).toBe('');
    expect(component.loginForm.valid).toBe(false);
  });

  it('should validate username field', () => {
    const emailControl = component.emailControl;
    emailControl.setValue('');
    expect(emailControl.valid).toBe(false);

    emailControl.setValue('admin');
    expect(emailControl.valid).toBe(true);
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.passwordControl;
    passwordControl.setValue('12345');
    expect(passwordControl.valid).toBe(false);

    passwordControl.setValue('123456');
    expect(passwordControl.valid).toBe(true);
  });

  it('should toggle password visibility signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
  });
});

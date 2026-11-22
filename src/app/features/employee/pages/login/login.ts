import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-employee-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class EmployeeLogin {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Pasos del flujo: 'company' (Paso 1: NIT) | 'credentials' (Paso 2: Cajero y PIN)
  readonly currentStep = signal<'company' | 'credentials'>('company');

  // Señales reactivas de estado
  readonly isVerifyingCompany = signal(false);
  readonly isLoading = signal(false);
  readonly showPin = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Formulario Paso 1: Identificación de Empresa
  readonly companyForm = this.fb.group({
    nit: ['', [Validators.required, Validators.minLength(5)]]
  });

  // Formulario Paso 2: Autenticación de Colaborador
  readonly employeeForm = this.fb.group({
    cashierCode: ['', [Validators.required, Validators.minLength(3)]],
    pin: ['', [Validators.required, Validators.minLength(4)]],
    rememberMe: [false]
  });

  constructor() {
    // Si ya existe una empresa seleccionada, avanza al paso de credenciales
    if (this.authService.selectedCompany()) {
      this.currentStep.set('credentials');
    }
  }

  get nitControl() {
    return this.companyForm.controls.nit;
  }

  get cashierControl() {
    return this.employeeForm.controls.cashierCode;
  }

  get pinControl() {
    return this.employeeForm.controls.pin;
  }

  isCompanyFieldInvalid(): boolean {
    const control = this.nitControl;
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  isFieldInvalid(fieldName: 'cashierCode' | 'pin'): boolean {
    const control = this.employeeForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  togglePinVisibility(): void {
    this.showPin.update((visible) => !visible);
  }

  /**
   * Paso 1: Valida la existencia de la empresa asociada al NIT.
   */
  onVerifyCompany(): void {
    this.errorMessage.set(null);

    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.isVerifyingCompany.set(true);
    const { nit } = this.companyForm.getRawValue();

    this.authService.verifyCompany(nit).subscribe({
      next: () => {
        this.isVerifyingCompany.set(false);
        this.currentStep.set('credentials');
      },
      error: (err: unknown) => {
        this.isVerifyingCompany.set(false);
        const backendMessage =
          err && typeof err === 'object' && 'error' in err
            ? (err as { error?: { message?: string } }).error?.message
            : undefined;

        this.errorMessage.set(
          backendMessage ?? 'No se encontró la empresa registrada con ese NIT o identificador.'
        );
      }
    });
  }

  /**
   * Permite volver al paso 1 para modificar el NIT.
   */
  onChangeCompany(): void {
    this.authService.clearCompany();
    this.errorMessage.set(null);
    this.employeeForm.reset();
    this.currentStep.set('company');
  }

  /**
   * Paso 2: Autenticación del colaborador con la empresa confirmada.
   */
  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const credentials = this.employeeForm.getRawValue();
    const companyNit = this.authService.selectedCompany()?.nit;

    this.authService.loginEmployee({ ...credentials, companyNit }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const backendMessage =
          err && typeof err === 'object' && 'error' in err
            ? (err as { error?: { message?: string } }).error?.message
            : undefined;

        this.errorMessage.set(
          backendMessage ?? 'Credenciales de empleado o PIN incorrectos. Verifique sus datos.'
        );
      }
    });
  }
}

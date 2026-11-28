import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StoreService } from '../../../../core/services/store.service';
import { TaxTypeEnum, TaxType } from '../../../../core/models/company-store.model';

@Component({
  selector: 'app-employee-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class EmployeeLogin {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly authService = inject(AuthService);
  readonly storeService = inject(StoreService);
  private readonly router = inject(Router);

  // Opciones de tipo de identificación tributaria (NIT, RFC, NIF, CUIT, SSN, RUT)
  readonly taxTypeOptions = Object.values(TaxTypeEnum);

  // Pasos del flujo: 'company' (Paso 1: Empresa) | 'credentials' (Paso 2: Cajero y PIN)
  readonly currentStep = signal<'company' | 'credentials'>('company');

  // Señales reactivas de estado
  readonly isVerifyingCompany = signal(false);
  readonly isLoading = signal(false);
  readonly showPin = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly logoLoadFailed = signal(false);

  // Formulario Paso 1: Identificación de Empresa (Tipo, Número y Dígito de Verificación)
  readonly companyForm = this.fb.group({
    taxType: [TaxTypeEnum.NIT as TaxType, [Validators.required]],
    taxNumber: ['', [Validators.required, Validators.minLength(3)]],
    verificationDigit: ['', [Validators.maxLength(1), Validators.pattern(/^[0-9]?$/)]],
  });

  // Formulario Paso 2: Autenticación de Colaborador
  readonly employeeForm = this.fb.group({
    cashierCode: ['', [Validators.required, Validators.minLength(3)]],
    pin: ['', [Validators.required, Validators.minLength(4)]],
    rememberMe: [false],
  });

  constructor() {
    // Si ya existe una empresa seleccionada (memoria o localStorage), avanza al paso de credenciales
    const stored = this.storeService.currentStore();
    if (stored) {
      this.authService.setSelectedCompanyFromStore({
        nit: stored.taxId ?? '',
        name: stored.name ?? '',
        tradeName: stored.legalName,
        status: 'active',
      });
      this.currentStep.set('credentials');
    }
  }

  get taxTypeControl() {
    return this.companyForm.controls.taxType;
  }

  get taxNumberControl() {
    return this.companyForm.controls.taxNumber;
  }

  get verificationDigitControl() {
    return this.companyForm.controls.verificationDigit;
  }

  // Getters de compatibilidad con pruebas unitarias
  get nitControl() {
    return this.companyForm.controls.taxNumber;
  }

  get taxIdControl() {
    return this.companyForm.controls.taxNumber;
  }

  get cashierControl() {
    return this.employeeForm.controls.cashierCode;
  }

  get pinControl() {
    return this.employeeForm.controls.pin;
  }

  isCompanyFieldInvalid(
    fieldName: 'taxType' | 'taxNumber' | 'verificationDigit' = 'taxNumber',
  ): boolean {
    const control = this.companyForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  isFieldInvalid(fieldName: 'cashierCode' | 'pin'): boolean {
    const control = this.employeeForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  togglePinVisibility(): void {
    this.showPin.update((visible) => !visible);
  }

  onLogoError(): void {
    this.logoLoadFailed.set(true);
  }

  /**
   * Paso 1: Valida la existencia de la empresa asociada al taxType, taxNumber y verificationDigit contra esStore.
   */
  onVerifyCompany(): void {
    this.errorMessage.set(null);

    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.isVerifyingCompany.set(true);
    const { taxType, taxNumber, verificationDigit } = this.companyForm.getRawValue();

    // Si tiene dígito de verificación, se concatena con guion como identificador completo
    const cleanNumber = taxNumber.trim();
    const cleanDv = verificationDigit ? verificationDigit.trim() : '';
    const fullTaxId = cleanDv ? `${cleanNumber}-${cleanDv}` : cleanNumber;

    this.storeService.getStoreByTax(taxType, fullTaxId).subscribe({
      next: (store) => {
        this.isVerifyingCompany.set(false);
        this.logoLoadFailed.set(false);
        this.authService.setSelectedCompanyFromStore({
          nit: store.taxId ?? '',
          name: store.name ?? '',
          tradeName: store.legalName,
          status: 'active',
        });
        this.currentStep.set('credentials');
      },
      error: (err: unknown) => {
        this.isVerifyingCompany.set(false);
        const backendMessage =
          err && typeof err === 'object' && 'error' in err
            ? (err as { error?: { message?: string } }).error?.message
            : undefined;

        this.errorMessage.set(
          backendMessage ??
            'No se encontró la empresa registrada con el tipo y número de identificación suministrados.',
        );
      },
    });
  }

  /**
   * Permite volver al paso 1 para modificar la empresa seleccionada.
   */
  onChangeCompany(): void {
    this.storeService.clearStore();
    this.authService.clearCompany();
    this.errorMessage.set(null);
    this.logoLoadFailed.set(false);
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
    const companyNit =
      this.storeService.currentStore()?.taxId ?? this.authService.selectedCompany()?.nit;

    this.authService.loginEmployee({ ...credentials, companyNit }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/employee/dashboard']);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const backendMessage =
          err && typeof err === 'object' && 'error' in err
            ? (err as { error?: { message?: string } }).error?.message
            : undefined;

        this.errorMessage.set(
          backendMessage ?? 'Credenciales de empleado o PIN incorrectos. Verifique sus datos.',
        );
      },
    });
  }
}

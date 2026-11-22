import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Señales reactivas para estados de carga y visibilidad
  readonly isLoading = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Formulario directo de Credenciales de Propietario (Email y Contraseña)
  readonly loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  get emailControl() {
    return this.loginForm.controls.username;
  }

  get passwordControl() {
    return this.loginForm.controls.password;
  }

  isFieldInvalid(fieldName: 'username' | 'password'): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { username, password, rememberMe } = this.loginForm.getRawValue();

    this.authService.login({ email: username, password, rememberMe }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/owner']);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const backendMessage =
          err && typeof err === 'object' && 'error' in err
            ? (err as { error?: { message?: string } }).error?.message
            : undefined;

        this.errorMessage.set(
          backendMessage ?? 'Credenciales inválidas. Por favor verifique sus datos.'
        );
      }
    });
  }
}

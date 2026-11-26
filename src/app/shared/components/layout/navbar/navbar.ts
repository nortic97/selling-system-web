import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StoreService } from '../../../../core/services/store.service';
import { TokenService } from '../../../../core/services/token.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  readonly title = input<string>('Selling System POS');
  readonly subtitle = input<string>('');
  readonly variant = input<'owner' | 'employee'>('owner');

  readonly toggleSidebar = output<void>();

  readonly authService = inject(AuthService);
  readonly storeService = inject(StoreService);
  readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  // Datos reactivos de la tienda y usuario
  readonly currentStore = computed(() => {
    return this.storeService.currentStore() ?? this.authService.selectedCompany();
  });

  readonly currentUser = computed(() => {
    return this.authService.currentUser();
  });

  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (user?.name) return user.name;
    return this.variant() === 'owner' ? 'Administrador B2B' : 'Colaborador POS';
  });

  readonly userRoleLabel = computed(() => {
    return this.variant() === 'owner' ? 'Propietario / Admin' : 'Cajero / Terminal';
  });

  readonly storeTaxIdentifier = computed(() => {
    const store = this.currentStore();
    if (!store) return '';
    if ('taxId' in store && store.taxId) return store.taxId;
    if ('nit' in store && store.nit) return store.nit;
    return '';
  });

  onToggle(): void {
    this.toggleSidebar.emit();
  }

  onLogout(): void {
    const isEmployee = this.variant() === 'employee';
    this.authService.logout();
    if (isEmployee) {
      this.router.navigate(['/employee/login']);
    } else {
      this.router.navigate(['/owner/login']);
    }
  }

  onChangeStore(): void {
    this.storeService.openStoreModal();
  }
}

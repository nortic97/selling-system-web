import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { B2bShell } from '../../../../shared/components/layout/b2b-shell/b2b-shell';
import { AuthService } from '../../../../core/services/auth.service';
import { StoreService } from '../../../../core/services/store.service';
import { TokenService } from '../../../../core/services/token.service';
import { StoreSelectionModal } from '../../components/store-selection-modal/store-selection-modal';
import { StoreSummary } from '../../../../core/models/company-store.model';

export interface BranchPerformance {
  id: string;
  name: string;
  nit: string;
  manager: string;
  todaySales: number;
  goalTarget: number;
  activeStaff: number;
  status: 'OPERATIVA' | 'MANTENIMIENTO' | 'CERRADA';
}

@Component({
  selector: 'app-owner-dashboard',
  imports: [B2bShell, CurrencyPipe, DecimalPipe, StoreSelectionModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  readonly storeService = inject(StoreService);
  readonly tokenService = inject(TokenService);

  readonly currentStore = computed(() => {
    return this.storeService.currentStore() ?? this.authService.selectedCompany();
  });

  readonly hasSelectedStore = computed(() => {
    return this.storeService.hasStore();
  });

  readonly currentUser = computed(() => {
    return this.authService.currentUser();
  });

  constructor() {
    // Al arrancar, si el owner no tiene tienda seleccionada, se abre el modal automáticamente
    if (!this.storeService.currentStore()) {
      this.storeService.openStoreModal();
    }
  }

  onStoreSelected(store: StoreSummary): void {
    // Al seleccionar la tienda, se cargan las métricas correspondientes
    this.storeService.closeStoreModal();
  }

  // KPIs globales para el propietario
  readonly globalMetrics = signal({
    totalRevenueToday: 18450000,
    activeBranchesCount: 4,
    totalBranchesCount: 4,
    activeEmployees: 12,
    averageTicket: 84500
  });

  // Lista de sucursales monitoreadas
  readonly branches = signal<BranchPerformance[]>([
    {
      id: 'br-01',
      name: 'Sucursal Principal Centro',
      nit: '900.123.456-1',
      manager: 'Carlos Eduardo Mendoza',
      todaySales: 7850000,
      goalTarget: 8000000,
      activeStaff: 4,
      status: 'OPERATIVA'
    },
    {
      id: 'br-02',
      name: 'Sucursal Norte Mall Plaza',
      nit: '900.123.456-2',
      manager: 'Laura Sofia Gómez',
      todaySales: 5200000,
      goalTarget: 6000000,
      activeStaff: 3,
      status: 'OPERATIVA'
    },
    {
      id: 'br-03',
      name: 'Sucursal Zona Industrial',
      nit: '900.123.456-3',
      manager: 'Andrés Felipe Morales',
      todaySales: 3900000,
      goalTarget: 4000000,
      activeStaff: 3,
      status: 'OPERATIVA'
    },
    {
      id: 'br-04',
      name: 'Punto Express Aeropuerto',
      nit: '900.123.456-4',
      manager: 'María Camila Restrepo',
      todaySales: 1500000,
      goalTarget: 2500000,
      activeStaff: 2,
      status: 'OPERATIVA'
    }
  ]);
}


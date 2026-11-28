import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { B2bShell } from '../../../../shared/components/layout/b2b-shell/b2b-shell';
import { AuthService } from '../../../../core/services/auth.service';
import { StoreService } from '../../../../core/services/store.service';
import { TokenService } from '../../../../core/services/token.service';
import { EmployeeWorkspaceService } from '../../../../core/services/employee-workspace.service';

export interface PosTransaction {
  id: string;
  invoiceNumber: string;
  timestamp: Date;
  customerName: string;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  itemsCount: number;
  total: number;
  status: 'COMPLETADA' | 'PENDIENTE' | 'ANULADA';
}

@Component({
  selector: 'app-employee-dashboard',
  imports: [B2bShell, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class EmployeeDashboard {
  private readonly authService = inject(AuthService);
  private readonly storeService = inject(StoreService);
  readonly tokenService = inject(TokenService);
  readonly workspaceService = inject(EmployeeWorkspaceService);

  readonly currentStore = computed(() => {
    return this.storeService.currentStore() ?? this.authService.selectedCompany();
  });

  readonly currentUser = computed(() => {
    return this.authService.currentUser();
  });

  readonly workspaces = this.workspaceService.currentWorkspaces;
  readonly activeWorkspace = this.workspaceService.activeWorkspace;

  constructor() {
    const employeeId = this.tokenService.userId() || '9c58b456-42d1-4be3-a8df-6bf9618c7d00';
    this.workspaceService.getWorkspacesByEmployee(employeeId).subscribe();
  }

  // Métricas de turno en Signals
  readonly shiftStats = signal({
    shiftTotal: 1420500,
    transactionsCount: 38,
    cashInDrawer: 650000,
    shiftStartTime: new Date(Date.now() - 4 * 3600 * 1000),
    shiftStatus: 'Abierto'
  });

  // Lista de transacciones recientes
  readonly recentTransactions = signal<PosTransaction[]>([
    {
      id: 'tx-1001',
      invoiceNumber: 'FAC-2026-0045',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      customerName: 'Distribuidora San Mateo S.A.',
      paymentMethod: 'TRANSFERENCIA',
      itemsCount: 14,
      total: 345000,
      status: 'COMPLETADA'
    },
    {
      id: 'tx-1002',
      invoiceNumber: 'FAC-2026-0044',
      timestamp: new Date(Date.now() - 42 * 60 * 1000),
      customerName: 'Comercializadora El Triunfo',
      paymentMethod: 'TARJETA',
      itemsCount: 8,
      total: 182000,
      status: 'COMPLETADA'
    },
    {
      id: 'tx-1003',
      invoiceNumber: 'FAC-2026-0043',
      timestamp: new Date(Date.now() - 68 * 60 * 1000),
      customerName: 'Cliente General Mostrador',
      paymentMethod: 'EFECTIVO',
      itemsCount: 3,
      total: 45000,
      status: 'COMPLETADA'
    },
    {
      id: 'tx-1004',
      invoiceNumber: 'FAC-2026-0042',
      timestamp: new Date(Date.now() - 110 * 60 * 1000),
      customerName: 'Inversiones Los Andes SAS',
      paymentMethod: 'TARJETA',
      itemsCount: 22,
      total: 780000,
      status: 'COMPLETADA'
    },
    {
      id: 'tx-1005',
      invoiceNumber: 'FAC-2026-0041',
      timestamp: new Date(Date.now() - 155 * 60 * 1000),
      customerName: 'Almacén Central Ltda.',
      paymentMethod: 'TRANSFERENCIA',
      itemsCount: 5,
      total: 68500,
      status: 'PENDIENTE'
    }
  ]);
}

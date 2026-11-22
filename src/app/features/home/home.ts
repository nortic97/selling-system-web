import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface PosFeature {
  id: string;
  title: string;
  description: string;
  icon: 'terminal' | 'inventory' | 'cash' | 'analytics' | 'security' | 'sync';
}

export interface SecurityPillar {
  id: string;
  title: string;
  description: string;
  tag: string;
}

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  host: {
    '(document:keydown.escape)': 'onEscapePress()'
  }
})
export class Home {
  private readonly router = inject(Router);

  // Estado del modal de acceso
  readonly isAuthModalOpen = signal(false);

  // Características destacadas de la plataforma POS
  readonly features = signal<PosFeature[]>([
    {
      id: 'terminal',
      title: 'Punto de Venta Ágil',
      description: 'Facturación en segundos con soporte para lector de código de barras, atajos de teclado y múltiples formas de cobro.',
      icon: 'terminal'
    },
    {
      id: 'inventory',
      title: 'Inventario Multisede',
      description: 'Control de existencias sincronizado en tiempo real, alertas preventivas de stock mínimo y trazabilidad de movimientos.',
      icon: 'inventory'
    },
    {
      id: 'cash',
      title: 'Arqueo y Cierre de Caja',
      description: 'Aperturas de turno, control de entradas y salidas de efectivo, cortes ciegos y conciliación automática sin descuadres.',
      icon: 'cash'
    },
    {
      id: 'analytics',
      title: 'Analítica en Tiempo Real',
      description: 'Métricas de ventas, márgenes de ganancia, productos con mayor rotación y reportes financieros exportables al instante.',
      icon: 'analytics'
    },
    {
      id: 'security',
      title: 'Permisos y Auditoría',
      description: 'Restricción de operaciones delicadas (descuentos, anulaciones) según el rol asignado a cada colaborador.',
      icon: 'security'
    },
    {
      id: 'sync',
      title: 'Alta Disponibilidad Cloud',
      description: 'Infraestructura resiliente con continuidad operativa y resguardo continuo de información transaccional.',
      icon: 'sync'
    }
  ]);

  // Pilares de seguridad corporativa
  readonly securityPillars = signal<SecurityPillar[]>([
    {
      id: 'blind-cash',
      title: 'Arqueo y Corte Ciego de Caja',
      description: 'Evite mermas forzando al cajero a contar y declarar el efectivo físico sin conocer de antemano el saldo teórico calculado por el sistema.',
      tag: 'Prevención de Mermas'
    },
    {
      id: 'rbac',
      title: 'Control de Permisos RBAC',
      description: 'Las anulaciones de tickets, cancelaciones de ítems y descuentos fuera de rango exigen clave de autorización de supervisor.',
      tag: 'Supervisión en Tiempo Real'
    },
    {
      id: 'audit',
      title: 'Trazabilidad y Auditoría Forense',
      description: 'Registro histórico inmutable de cada transacción con fecha, hora exacta, estación de trabajo, usuario e IP de origen.',
      tag: 'Bitácora Inalterable'
    },
    {
      id: 'encryption',
      title: 'Cifrado E2EE y Respaldo Cloud',
      description: 'Comunicaciones seguras bajo protocolo TLS 1.3 con almacenamiento cifrado de datos y copias de seguridad automáticas continuas.',
      tag: 'Protección de Datos'
    }
  ]);

  openAuthModal(): void {
    this.isAuthModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.isAuthModalOpen.set(false);
  }

  navigateToOwnerLogin(): void {
    this.closeAuthModal();
    this.router.navigate(['/owner/login']);
  }

  navigateToEmployeeLogin(): void {
    this.closeAuthModal();
    this.router.navigate(['/employee/login']);
  }

  onEscapePress(): void {
    if (this.isAuthModalOpen()) {
      this.closeAuthModal();
    }
  }
}

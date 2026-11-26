import { Injectable, inject, signal } from '@angular/core';
import { CookieService } from './cookie.service';
import { TokenService } from './token.service';
import { MenuItem, MenuGroup } from '../models/menu-item.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly cookieService = inject(CookieService);
  private readonly tokenService = inject(TokenService);

  private readonly MENU_COOKIE_KEY = 'ss_app_menu';

  // Menú reactivo para la interfaz
  private readonly _ownerMenu = signal<MenuGroup[]>(this.getInitialOwnerMenu());
  readonly ownerMenu = this._ownerMenu.asReadonly();

  private readonly _employeeMenu = signal<MenuGroup[]>(this.getInitialEmployeeMenu());
  readonly employeeMenu = this._employeeMenu.asReadonly();

  constructor() {
    // Intenta restaurar menú desde cookie si existe
    this.restoreMenuFromCookie();
  }

  /**
   * Menú inicial hardcodeado para Owner / Administrador B2B
   */
  private getInitialOwnerMenu(): MenuGroup[] {
    return [
      {
        groupName: 'Principal',
        items: [
          {
            id: 'owner-dashboard',
            label: 'Dashboard General',
            icon: 'dashboard',
            route: '/owner/dashboard',
            requiredPermission: 'system.all'
          },
          {
            id: 'owner-stores',
            label: 'Sucursales & Tiendas',
            icon: 'store',
            route: '/owner/stores',
            requiredPermission: 'store.read',
            badge: 'Multi-sede'
          }
        ]
      },
      {
        groupName: 'Gestión & Equipos',
        items: [
          {
            id: 'owner-employees',
            label: 'Colaboradores',
            icon: 'users',
            route: '/owner/employees',
            requiredPermission: 'employee.read'
          },
          {
            id: 'owner-roles',
            label: 'Roles & Permisos',
            icon: 'shield',
            route: '/owner/roles',
            requiredPermission: 'system.all'
          }
        ]
      },
      {
        groupName: 'Analítica & Finanzas',
        items: [
          {
            id: 'owner-analytics',
            label: 'Reportes de Ventas',
            icon: 'chart',
            route: '/owner/reports',
            requiredPermission: 'store.read'
          },
          {
            id: 'owner-settings',
            label: 'Configuración B2B',
            icon: 'settings',
            route: '/owner/settings',
            requiredPermission: 'system.all'
          }
        ]
      }
    ];
  }

  /**
   * Menú inicial hardcodeado para Colaborador / POS Employee
   */
  private getInitialEmployeeMenu(): MenuGroup[] {
    return [
      {
        groupName: 'Punto de Venta',
        items: [
          {
            id: 'employee-dashboard',
            label: 'Panel de Caja',
            icon: 'dashboard',
            route: '/employee/dashboard',
            requiredPermission: 'employee_workspace.all'
          },
          {
            id: 'employee-pos',
            label: 'Terminal de Venta',
            icon: 'pos',
            route: '/employee/pos',
            badge: 'En vivo',
            badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
            requiredPermission: 'employee_workspace.all'
          }
        ]
      },
      {
        groupName: 'Operaciones de Turno',
        items: [
          {
            id: 'employee-shift',
            label: 'Control de Caja & Turno',
            icon: 'cash',
            route: '/employee/shift',
            requiredPermission: 'employee_workspace.all'
          },
          {
            id: 'employee-orders',
            label: 'Órdenes & Facturas',
            icon: 'receipt',
            route: '/employee/orders',
            requiredPermission: 'employee_workspace.all'
          },
          {
            id: 'employee-catalog',
            label: 'Catálogo de Productos',
            icon: 'box',
            route: '/employee/catalog',
            requiredPermission: 'store.read'
          }
        ]
      }
    ];
  }

  /**
   * Persiste el menú en cookie sincronizado con la expiración del token.
   * Preparado para la futura respuesta de la base de datos / backend.
   */
  persistMenuInCookie(menuData: { owner?: MenuGroup[]; employee?: MenuGroup[] }): void {
    const payload = this.tokenService.payload();
    const expSeconds = payload?.exp ? new Date(payload.exp * 1000) : 86400;

    try {
      this.cookieService.set(this.MENU_COOKIE_KEY, JSON.stringify(menuData), {
        expires: expSeconds,
        path: '/',
        sameSite: 'Lax'
      });
    } catch {
      // Ignora en caso de exceder longitud o restricciones
    }

    if (menuData.owner) this._ownerMenu.set(menuData.owner);
    if (menuData.employee) this._employeeMenu.set(menuData.employee);
  }

  /**
   * Revoca y limpia los permisos y el menú almacenado en caso de acceso no autorizado.
   */
  revokeMenu(): void {
    this.cookieService.delete(this.MENU_COOKIE_KEY, '/');
    this._ownerMenu.set(this.getInitialOwnerMenu());
    this._employeeMenu.set(this.getInitialEmployeeMenu());
  }

  /**
   * Restaura el menú desde la cookie si existe.
   */
  private restoreMenuFromCookie(): void {
    const raw = this.cookieService.get(this.MENU_COOKIE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.owner) this._ownerMenu.set(parsed.owner);
      if (parsed.employee) this._employeeMenu.set(parsed.employee);
    } catch {
      this.cookieService.delete(this.MENU_COOKIE_KEY, '/');
    }
  }
}

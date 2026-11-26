import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuService } from '../../../../core/services/menu.service';
import { TokenService } from '../../../../core/services/token.service';
import { MenuGroup, MenuItem } from '../../../../core/models/menu-item.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: {
    class: 'block h-full flex-shrink-0'
  }
})
export class Sidebar {
  readonly variant = input<'owner' | 'employee'>('owner');
  readonly isOpen = input<boolean>(false);

  readonly closeSidebar = output<void>();

  private readonly menuService = inject(MenuService);
  private readonly tokenService = inject(TokenService);

  readonly menuGroups = computed<MenuGroup[]>(() => {
    const isEmployee = this.variant() === 'employee';
    const groups = isEmployee ? this.menuService.employeeMenu() : this.menuService.ownerMenu();

    // Filtra items según permisos si el usuario ya tiene token decodificado
    return groups.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.requiredPermission) return true;
        // Permite todo en desarrollo si no hay permisos estrictos
        return this.tokenService.hasPermission(item.requiredPermission);
      })
    })).filter((group) => group.items.length > 0);
  });

  onLinkClick(): void {
    // Al hacer click en móvil, cierra el drawer
    this.closeSidebar.emit();
  }

  onBackdropClick(): void {
    this.closeSidebar.emit();
  }
}

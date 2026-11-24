import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private readonly _activeRequests = signal<number>(0);
  private readonly _message = signal<string | null>(null);

  readonly activeRequests = this._activeRequests.asReadonly();
  readonly isLoading = computed(() => this._activeRequests() > 0);
  readonly message = this._message.asReadonly();

  /**
   * Muestra el loader incrementando el contador de solicitudes activas.
   * Permite establecer un mensaje descriptivo opcional.
   */
  show(message?: string): void {
    if (message) {
      this._message.set(message);
    }
    this._activeRequests.update((count) => count + 1);
  }

  /**
   * Oculta el loader decrementando el contador de solicitudes activas.
   * Cuando llega a 0, se apaga el loader y se limpia el mensaje.
   */
  hide(): void {
    this._activeRequests.update((count) => {
      const updated = Math.max(0, count - 1);
      if (updated === 0) {
        this._message.set(null);
      }
      return updated;
    });
  }

  /**
   * Fuerza el reseteo del loader sin importar solicitudes pendientes.
   */
  forceHide(): void {
    this._activeRequests.set(0);
    this._message.set(null);
  }
}

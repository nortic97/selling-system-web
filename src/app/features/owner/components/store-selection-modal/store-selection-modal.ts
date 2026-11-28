import { Component, computed, inject, input, output, signal } from '@angular/core';
import { StoreService } from '../../../../core/services/store.service';
import { StorePageResponse, StoreSummary } from '../../../../core/models/company-store.model';

@Component({
  selector: 'app-store-selection-modal',
  imports: [],
  templateUrl: './store-selection-modal.html',
  styleUrl: './store-selection-modal.scss',
  host: {
    '(document:keydown.escape)': 'onEscapePress()'
  }
})
export class StoreSelectionModal {
  readonly isOpen = input<boolean>(false);
  readonly allowClose = input<boolean>(true);

  readonly storeSelected = output<StoreSummary>();
  readonly closeModal = output<void>();

  private readonly storeService = inject(StoreService);

  readonly isLoading = signal(false);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly sort = signal('name,asc');
  readonly storePage = signal<StorePageResponse | null>(null);
  readonly searchQuery = signal('');
  readonly errorMessage = signal<string | null>(null);

  // Filtro reactivo en el contenido actual
  readonly filteredStores = computed<StoreSummary[]>(() => {
    const pageData = this.storePage();
    if (!pageData || !pageData.content) return [];
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return pageData.content;

    return pageData.content.filter((store) => {
      const nameMatch = store.name ? store.name.toLowerCase().includes(query) : false;
      const nitMatch = store.taxId ? store.taxId.toLowerCase().includes(query) : false;
      const cityMatch = store.city ? store.city.toLowerCase().includes(query) : false;
      return nameMatch || nitMatch || cityMatch;
    });
  });

  readonly selectedStoreId = computed(() => {
    return this.storeService.currentStore()?.id ?? null;
  });

  constructor() {
    this.loadStores();
  }

  loadStores(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.storeService
      .getStoresByOwner(this.page(), this.size(), this.sort())
      .subscribe({
        next: (response) => {
          this.storePage.set(response);
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          this.isLoading.set(false);
          const msg =
            err && typeof err === 'object' && 'error' in err
              ? (err as { error?: { message?: string } }).error?.message
              : undefined;
          this.errorMessage.set(msg ?? 'No fue posible consultar las sucursales del propietario.');
        }
      });
  }

  onSelectStore(store: StoreSummary): void {
    this.storeService.setCurrentStore(store);
    this.storeSelected.emit(store);
    this.closeModal.emit();
  }

  onNextPage(): void {
    const pageData = this.storePage();
    if (pageData && !pageData.last) {
      this.page.update((p) => p + 1);
      this.loadStores();
    }
  }

  onPrevPage(): void {
    const pageData = this.storePage();
    if (pageData && !pageData.first) {
      this.page.update((p) => Math.max(0, p - 1));
      this.loadStores();
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onBackdropClick(): void {
    if (this.allowClose()) {
      this.closeModal.emit();
    }
  }

  onEscapePress(): void {
    if (this.isOpen() && this.allowClose()) {
      this.closeModal.emit();
    }
  }
}

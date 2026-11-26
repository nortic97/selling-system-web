import { TaxType } from './company-store.model';

export interface StoreSummary {
  id: string;
  ownerId: string;
  taxType: TaxType | string;
  taxId: string;
  legalName?: string;
  name: string;
  description?: string;
  slogan?: string;
  logoUrl?: string;
  address?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  phoneNumber?: string;
  contactEmail?: string;
  currencyCode?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface StorePageResponse {
  content: StoreSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

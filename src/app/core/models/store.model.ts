import { TaxType } from './company-store.model';

export enum CurrencyCodeEnum {
  COP = 'COP',
  USD = 'USD',
  EUR = 'EUR',
}

export type CurrencyCode = 'COP' | 'USD' | 'EUR';

export interface RestModelStoreResponseDTO {
  id: string | null;
  ownerId: string | null;
  taxType: TaxType | string | null;
  taxId: string | null;
  legalName?: string | null;
  name: string | null;
  description?: string | null;
  slogan?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  country?: string | null;
  stateProvince?: string | null;
  city?: string | null;
  phoneNumber?: string | null;
  contactEmail?: string | null;
  currencyCode?: CurrencyCode | string | null;
  isActive: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export type StoreResponseDTO = RestModelStoreResponseDTO;

export interface RestModelStoreBasicResponseDTO {
  id: string | null;
  taxType: TaxType | string | null;
  taxId: string | null;
  legalName?: string | null;
  name: string | null;
  description?: string | null;
  slogan?: string | null;
  logoUrl?: string | null;
  country?: string | null;
  stateProvince?: string | null;
  city?: string | null;
}

export type StoreBasicResponseDTO = RestModelStoreBasicResponseDTO;

export interface RestModelStoreRequestDTO {
  ownerId: string;
  taxType: TaxType | string;
  taxId: string;
  legalName?: string | null;
  name: string;
  description?: string | null;
  slogan?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  country?: string | null;
  stateProvince?: string | null;
  city?: string | null;
  phoneNumber?: string | null;
  contactEmail?: string | null;
  currencyCode?: CurrencyCode | string;
}

export type StoreRequestDTO = RestModelStoreRequestDTO;

export interface RestModelUpdateStoreRequestDTO {
  taxType: TaxType | string;
  taxId: string;
  legalName?: string | null;
  name: string;
  description?: string | null;
  slogan?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  country?: string | null;
  stateProvince?: string | null;
  city?: string | null;
  currencyCode?: CurrencyCode | string;
}

export type UpdateStoreRequestDTO = RestModelUpdateStoreRequestDTO;

export interface RestModelStatusRequest {
  active: boolean;
}

export type StatusRequestDTO = RestModelStatusRequest;

export interface RestModelPhoneRequestDTO {
  phoneNumber: string;
}

export type PhoneRequestDTO = RestModelPhoneRequestDTO;

export interface RestModelEmailRequestDTO {
  contactEmail: string;
}

export type EmailRequestDTO = RestModelEmailRequestDTO;

export interface RestModelPaginatedStoreResponseDTO {
  content: RestModelStoreResponseDTO[];
  totalElements?: number | null;
  totalPages?: number | null;
  size?: number | null;
  number?: number | null;
  first?: boolean | null;
  last?: boolean | null;
}

export type PaginatedStoreResponseDTO = RestModelPaginatedStoreResponseDTO;

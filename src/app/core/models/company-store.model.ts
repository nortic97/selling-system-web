export * from './store-page.model';

export enum TaxTypeEnum {
  NIT = 'NIT',
  RFC = 'RFC',
  NIF = 'NIF',
  CUIT = 'CUIT',
  SSN = 'SSN',
  RUT = 'RUT'
}

export type TaxType = 'NIT' | 'RFC' | 'NIF' | 'CUIT' | 'SSN' | 'RUT';

export interface CompanyStore {
  id: string;
  taxType: TaxType | string;
  taxId: string;
  legalName?: string;
  name: string;
  description?: string;
  slogan?: string;
  logoUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
}

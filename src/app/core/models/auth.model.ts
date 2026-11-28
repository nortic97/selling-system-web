export * from './auth-token-payload.model';
export * from './auth-response.model';
export * from './auth-request-user.model';
export * from './auth-request-employee.model';
export * from './menu-item.model';

export type AccessType = 'SYSTEM' | 'POS' | 'ADMIN';

export interface RestModelLoginRequestDTO {
  username: string; // minLength 4, maxLength 100
  password: string; // minLength 8, maxLength 255
  accessType: AccessType;
}

export type LoginRequestDTO = RestModelLoginRequestDTO;

export interface RestModelEmployeeLoginRequestDTO {
  storeId: string; // UUID v4
  username: string; // minLength 4, maxLength 100
  password: string; // minLength 8, maxLength 255
  accessType: AccessType;
}

export type EmployeeLoginRequestDTO = RestModelEmployeeLoginRequestDTO;

export interface RestModelTokenExchangeRequestDTO {
  token: string;
  roleId: string; // UUID v4
}

export type TokenExchangeRequestDTO = RestModelTokenExchangeRequestDTO;

export interface RestModelLoginResponseDTO {
  token: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
}

export type LoginResponseDTO = RestModelLoginResponseDTO;

export interface RestModelFieldErrorDetailDTO {
  field: string;
  rejectedValue?: string | null;
  message: string;
}

export type FieldErrorDetailDTO = RestModelFieldErrorDetailDTO;

export interface RestModelErrorResponseDTO {
  code: string;
  message: string;
  timestamp: string;
  details?: RestModelFieldErrorDetailDTO[];
}

export type ErrorResponseDTO = RestModelErrorResponseDTO;

export interface CompanyInfo {
  nit: string;
  name: string;
  tradeName?: string | null;
  status: 'active' | 'inactive';
}

export interface LoginCredentials {
  companyNit?: string;
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface EmployeeLoginCredentials {
  companyNit?: string;
  cashierCode: string;
  pin: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'owner' | 'admin' | 'staff';
  companyNit?: string;
}

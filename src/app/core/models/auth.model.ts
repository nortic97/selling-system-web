export * from './auth-token-payload.model';
export * from './auth-response.model';
export * from './auth-request-user.model';
export * from './auth-request-employee.model';
export * from './menu-item.model';

export interface CompanyInfo {
  nit: string;
  name: string;
  tradeName?: string;
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


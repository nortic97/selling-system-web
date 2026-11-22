export interface CompanyInfo {
  nit: string;
  name: string;
  tradeName?: string;
  status: 'active' | 'inactive';
}

export interface LoginCredentials {
  companyNit?: string;
  email: string;
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

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

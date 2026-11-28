export interface RestModelEmployeeWorkspaceResponseDTO {
  id: string; // UUID v4
  storeId: string; // UUID v4
  employeeId: string; // UUID v4
  branchId: string; // UUID v4
  roleId: string; // UUID v4
  isDefault: boolean;
  lastAccessAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type EmployeeWorkspaceResponseDTO = RestModelEmployeeWorkspaceResponseDTO;

export interface RestModelCreateEmployeeWorkspaceRequestDTO {
  storeId: string; // UUID v4
  employeeId: string; // UUID v4
  branchId: string; // UUID v4
  roleId: string; // UUID v4
  isDefault: boolean;
}

export type CreateEmployeeWorkspaceRequestDTO = RestModelCreateEmployeeWorkspaceRequestDTO;

export interface RestModelUpdateEmployeeWorkspaceRequestDTO {
  branchId: string; // UUID v4
  roleId: string; // UUID v4
  isDefault?: boolean | null;
}

export type UpdateEmployeeWorkspaceRequestDTO = RestModelUpdateEmployeeWorkspaceRequestDTO;

export interface RestModelPaginatedEmployeeWorkspaceResponseDTO {
  content: RestModelEmployeeWorkspaceResponseDTO[];
  totalElements?: number | null;
  totalPages?: number | null;
  size?: number | null;
  number?: number | null;
  first?: boolean | null;
  last?: boolean | null;
}

export type PaginatedEmployeeWorkspaceResponseDTO = RestModelPaginatedEmployeeWorkspaceResponseDTO;

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  branchId?: string;
  iat?: number;
  exp?: number;
}

export interface AuditContext {
  userId: string;
  organizationId: string;
  branchId?: string;
  ipAddress?: string;
  userAgent?: string;
}

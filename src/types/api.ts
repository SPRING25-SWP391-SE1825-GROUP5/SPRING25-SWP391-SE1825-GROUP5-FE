// Common API response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
  expiresAt: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Common entity types
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// Error types
export interface ApiError {
  message: string
  code?: string
  details?: any
}

// Request/Response types for common operations
export interface CreateRequest<T> {
  data: Omit<T, keyof BaseEntity>
}

export interface UpdateRequest<T> {
  id: string
  data: Partial<Omit<T, keyof BaseEntity>>
}

export interface DeleteRequest {
  id: string
}

// Pagination parameters
export interface PaginationParams {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  search?: string
}

// Filter parameters (extend as needed)
export interface FilterParams {
  [key: string]: any
}

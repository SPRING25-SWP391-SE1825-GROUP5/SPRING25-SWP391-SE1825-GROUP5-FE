import { api } from './api'
import type { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  LoginRequest, 
  LoginResponse,
  PaginationParams,
  CreateRequest,
  UpdateRequest
} from '../types/api'

// User service for API calls
export class UserService {
  private static readonly BASE_PATH = '/users'

  // Authentication
  static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
    return response.data
  }

  static async logout(): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/logout')
    return response.data
  }

  static async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken })
    return response.data
  }

  // User CRUD operations
  static async getUsers(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>(this.BASE_PATH, params)
    return response.data
  }

  static async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>(`${this.BASE_PATH}/${id}`)
    return response.data
  }

  static async createUser(userData: CreateRequest<User>): Promise<ApiResponse<User>> {
    const response = await api.post<ApiResponse<User>>(this.BASE_PATH, userData)
    return response.data
  }

  static async updateUser(id: string, userData: UpdateRequest<User>): Promise<ApiResponse<User>> {
    const response = await api.put<ApiResponse<User>>(`${this.BASE_PATH}/${id}`, userData)
    return response.data
  }

  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`${this.BASE_PATH}/${id}`)
    return response.data
  }

  // Profile operations
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data
  }

  static async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put<ApiResponse<User>>('/auth/profile', userData)
    return response.data
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/change-password', {
      oldPassword,
      newPassword
    })
    return response.data
  }
}

export default UserService

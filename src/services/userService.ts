import api from './api'
import type { User } from '@/store/authSlice'

export type UpdateUserProfileRequest = {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  avatar?: string
}

export type GetUsersRequest = {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  role?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type CreateUserRequest = {
  email: string
  firstName: string
  lastName: string
  role: string
  phone?: string
  isActive?: boolean
}

export type CreateUserByAdminRequest = {
  fullName: string
  email: string
  password: string
  phoneNumber: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  address: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'MANAGER' | 'TECHNICIAN'
  isActive: boolean
  emailVerified: boolean
}

export type UserListResponse = {
  success: boolean
  message: string
  data: {
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}


/**
 * User Service
 * Handles user management operations (non-auth related)
 * 
 * @class UserService
 * @description Service responsible for user profile management,
 * user listing, user administration operations
 */
export const UserService = {
  /**
   * Update current user profile
   * 
   * @param userData - Partial user data to update
   * @returns Promise with updated user data
   * @throws {Error} When update fails
   */
  async updateProfile(userData: UpdateUserProfileRequest): Promise<User> {
    const { data } = await api.put<User>('/users/me', userData)
    return data
  },

  /**
   * Get user profile by ID
   * 
   * @param userId - User ID to fetch
   * @returns Promise with user data
   * @throws {Error} When user not found or request fails
   */
  async getUserById(userId: string): Promise<User> {
    const { data } = await api.get<User>(`/users/${userId}`)
    return data
  },

  /**
   * Get paginated list of users (Admin only)
   * 
   * @param params - Query parameters for filtering, pagination and sorting        
   * @returns Promise with user list and pagination info
   * @throws {Error} When request fails or unauthorized
   */
  async getUsers(params: GetUsersRequest = {}): Promise<UserListResponse> {
    const defaultParams = { 
      pageNumber: 1, 
      pageSize: 100, 
      sortBy: 'fullName',
      sortOrder: 'asc',
      ...params 
    }
    const { data } = await api.get<UserListResponse>('/user', { params: defaultParams })
    return data
  },


  /**
   * Create new user (Admin only)
   * 
   * @param userData - User creation data
   * @returns Promise with created user
   * @throws {Error} When creation fails or unauthorized
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const { data } = await api.post<User>('/users', userData)
    return data
  },

  /**
   * Create new user by admin with full details
   * 
   * @param userData - Complete user creation data
   * @returns Promise with created user
   * @throws {Error} When creation fails or unauthorized
   */
  async createUserByAdmin(userData: CreateUserByAdminRequest): Promise<any> {
    const response = await api.post('/User', userData)
    // API returns { data: User, message: string, success: boolean }
    return response.data
  },

  /**
   * Update user by ID (Admin only)
   * 
   * @param userId - User ID to update
   * @param userData - User data to update
   * @returns Promise with updated user
   * @throws {Error} When update fails or unauthorized
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const { data } = await api.put<User>(`/users/${userId}`, userData)
    return data
  },

  /**
   * Delete user by ID (Admin only)
   * 
   * @param userId - User ID to delete
   * @returns Promise that resolves when user deleted
   * @throws {Error} When deletion fails or unauthorized
   */
  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`)
  },

  /**
   * Activate user account (Admin only)
   * 
   * @param userId - User ID to activate
   * @returns Promise with updated user
   * @throws {Error} When activation fails or unauthorized
   */
  async activateUser(userId: string): Promise<User> {
    // Deprecated per new API contract; use updateUserStatus instead
    const { data } = await api.patch<User>(`/User/${userId}/status`, { isActive: true })
    return data
  },

  /**
   * Deactivate user account (Admin only)
   * 
   * @param userId - User ID to deactivate
   * @returns Promise with updated user
   * @throws {Error} When deactivation fails or unauthorized
   */
  async deactivateUser(userId: string): Promise<User> {
    // Deprecated per new API contract; use updateUserStatus instead
    const { data } = await api.patch<User>(`/User/${userId}/status`, { isActive: false })
    return data
  },

  /**
   * Cập nhật trạng thái hoạt động của người dùng theo API mới
   * PATCH /api/User/{id}/status
   */
  async updateUserStatus(userId: string | number, isActive: boolean): Promise<User> {
    const { data } = await api.patch<User>(`/User/${userId}/status`, { isActive })
    return data
  },

  /**
   * Toggle user status (convenience method)
   * 
   * @param userId - User ID to update
   * @param isActive - Active status
   * @returns Promise with updated user
   * @throws {Error} When update fails or unauthorized
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    return this.updateUserStatus(userId, isActive)
  },

  /**
   * Upload user avatar
   * 
   * @param file - Avatar image file
   * @returns Promise with uploaded avatar URL
   * @throws {Error} When upload fails
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const { data } = await api.post<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  },

  /**
   * Get user preferences
   * 
   * @returns Promise with user preferences
   * @throws {Error} When request fails
   */
  async getPreferences(): Promise<Record<string, any>> {
    const { data } = await api.get('/users/me/preferences')
    return data
  },

  /**
   * Update user preferences
   * 
   * @param preferences - User preferences object
   * @returns Promise with updated preferences
   * @throws {Error} When update fails
   */
  async updatePreferences(preferences: Record<string, any>): Promise<Record<string, any>> {
    const { data } = await api.put('/users/me/preferences', preferences)
    return data
  }
}


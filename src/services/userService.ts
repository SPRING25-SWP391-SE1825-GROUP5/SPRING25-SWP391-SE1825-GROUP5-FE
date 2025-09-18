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
  page?: number
  limit?: number
  search?: string
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

export type UserListResponse = {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
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
   * @param params - Query parameters for filtering and pagination
   * @returns Promise with user list and pagination info
   * @throws {Error} When request fails or unauthorized
   */
  async getUsers(params: GetUsersRequest = {}): Promise<UserListResponse> {
    const { data } = await api.get<UserListResponse>('/users', { params })
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
   * Activate/Deactivate user account (Admin only)
   * 
   * @param userId - User ID to update
   * @param isActive - Active status
   * @returns Promise with updated user
   * @throws {Error} When update fails or unauthorized
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    const { data } = await api.patch<User>(`/users/${userId}/status`, { isActive })
    return data
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


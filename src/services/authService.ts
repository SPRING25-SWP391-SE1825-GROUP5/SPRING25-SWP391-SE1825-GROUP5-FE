import api from './api'
import type { User } from '@/store/authSlice'

export type LoginRequest = { 
  email: string; 
  password: string 
}

export type GoogleLoginRequest = {
  token: string // Google ID token from GIS
}

export type RegisterRequest = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export type LoginResponse = {
  id: string
  fullName: string
  email: string
  role: string
  emailVerified: boolean
  avatar?: string
  accessToken: string
  refreshToken: string
}

export type RefreshTokenResponse = {
  accessToken: string
}

export type ResetPasswordRequest = {
  email: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

/**
 * Authentication Service
 * Handles all authentication-related operations
 * 
 * @class AuthService
 * @description Service responsible for authentication operations including
 * login, logout, registration, token refresh, and password management
 */
export const AuthService = {
  /**
   * Authenticate user with email and password
   * 
   * @param payload - Login credentials
   * @returns Promise with authentication response
   * @throws {Error} When login fails
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', payload)
    return data
  },

  /**
   * Authenticate user with Google ID token
   * 
   * @param payload - Google ID token
   * @returns Promise with authentication response
   * @throws {Error} When Google login fails
   */
  async loginWithGoogle(payload: GoogleLoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login-google', payload)
    return data
  },

  /**
   * Register new user account
   * 
   * @param payload - Registration data
   * @returns Promise with authentication response
   * @throws {Error} When registration fails
   */
  async register(payload: RegisterRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/register', payload)
    return data
  },

  /**
   * Logout current user
   * Invalidates refresh token on server
   * 
   * @param refreshToken - Refresh token to invalidate
   * @returns Promise that resolves when logout completes
   * @throws {Error} When logout fails
   */
  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken })
  },

  /**
   * Refresh access token using refresh token
   * 
   * @param refreshToken - Valid refresh token
   * @returns Promise with new access token
   * @throws {Error} When refresh fails
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const { data } = await api.post<RefreshTokenResponse>('/auth/refresh-token', { 
      refreshToken 
    })
    return data
  },

  /**
   * Get current authenticated user profile
   * 
   * @returns Promise with user data
   * @throws {Error} When request fails or user not authenticated
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  /**
   * Request password reset email
   * 
   * @param payload - Email for password reset
   * @returns Promise that resolves when email sent
   * @throws {Error} When request fails
   */
  async forgotPassword(payload: ResetPasswordRequest): Promise<void> {
    await api.post('/auth/forgot-password', payload)
  },

  /**
   * Reset password with token from email
   * 
   * @param token - Reset token from email
   * @param newPassword - New password
   * @returns Promise that resolves when password reset
   * @throws {Error} When reset fails
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword })
  },

  /**
   * Change password for authenticated user
   * 
   * @param payload - Current and new passwords
   * @returns Promise that resolves when password changed
   * @throws {Error} When change fails
   */
  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await api.put('/auth/change-password', payload)
  },

  /**
   * Verify email with token
   * 
   * @param token - Email verification token
   * @returns Promise that resolves when email verified
   * @throws {Error} When verification fails
   */
  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', { token })
  },

  /**
   * Resend email verification
   * 
   * @returns Promise that resolves when verification email sent
   * @throws {Error} When request fails
   */
  async resendVerification(): Promise<void> {
    await api.post('/auth/resend-verification')
  }
}

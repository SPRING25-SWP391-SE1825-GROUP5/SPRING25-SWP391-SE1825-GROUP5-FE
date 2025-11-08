import api from './api'
import type { User } from '@/store/authSlice'

// Google Auth Types
export interface GoogleCredentialResponse {
  credential: string
}

export interface GooglePromptNotification {
  isNotDisplayed(): boolean
  isSkippedMoment(): boolean
  j?: string // suppressed_by_user status
  atg?: string // display status
  h?: boolean // hidden status
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: GoogleConfig) => void
          renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void
          disableAutoSelect?: () => void
        }
      }
    }
  }
}

interface GoogleConfig {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select: boolean
  cancel_on_tap_outside: boolean
  context: string
  use_fedcm_for_prompt: boolean
  itp_support: boolean
}

interface GoogleButtonOptions {
  type: string
  theme: string
  size: string
  shape: string
  text: string
  logo_alignment: string
  width: number
}

// Types aligned with backend docs
export type LoginRequest = {
  emailOrPhone: string
  password: string
}

export type GoogleLoginRequest = { token: string }

export type RegisterRequest = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  dateOfBirth: string // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE'
  address?: string
  avatarUrl?: string
}

export type AuthSuccess = {
  success: true
  message: string
  data: {
    token: string
    refreshToken?: string | null
    userId?: number | null
    customerId?: number | null
    staffId?: number | null
    technicianId?: number | null
    user: {
      id: number
      userId?: number
      customerId?: number | null
      fullName: string
      email: string
      role: string
      emailVerified: boolean
      avatar?: string | null
    }
  }
}

export type BasicSuccess<T> = {
  success: true
  message: string
  data: T
}

export type BasicError = {
  success: false
  message: string
  errors?: string[]
  data?: null
}


export type LoginResponse = ReturnType<typeof AuthService.login> extends Promise<infer R> ? R : never

export type RefreshTokenResponse = {
  token: string
  refreshToken: string | null
}

export type ResetPasswordRequest = {
  email: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export const AuthService = {
  async register(payload: RegisterRequest) {
    try {
      const { data } = await api.post<BasicSuccess<{ email: string; fullName: string; registeredAt: string }>>(
        '/auth/register',
        payload
      )
      return data
    } catch (error: any) {

      // Extract errors from response
      const response = error?.response?.data
      const errors = response?.errors || []
      const message = response?.message || error?.userMessage || error?.message || 'Đăng ký thất bại. Vui lòng thử lại.'

      return {
        success: false,
        message,
        errors,
        data: null
      }
    }
  },

  async login(payload: LoginRequest) {
    try {
      // Map frontend field names to backend field names
      const requestPayload = {
        Email: payload.emailOrPhone,
        Password: payload.password
      }

      const { data } = await api.post<any>('/auth/login', requestPayload)

      // Normalize backend response into FE-standard shape
      // Accepted backend shapes (examples):
      // 1) { success, message, data: { accessToken, refreshToken, userId, fullName, role, emailVerified, ... } }
      // 2) { token, refreshToken, user: { ... } }
      const src = data || {}
      const d = src.data ?? src

      const token = d.accessToken ?? d.token ?? null
      const refreshToken = d.refreshToken ?? null

      const user = {
        id: d.userId ?? d.user?.id ?? d.user?.userId ?? d.id ?? null,
        userId: d.userId ?? d.user?.userId ?? d.user?.id ?? d.id ?? null,
        customerId: d.customerId ?? d.user?.customerId ?? d.customer?.id ?? null,
        fullName: d.fullName ?? d.user?.fullName ?? '',
        email: d.email ?? d.user?.email ?? '',
        role: (d.role ?? d.user?.role ?? 'customer'),
        emailVerified: Boolean(d.emailVerified ?? d.user?.emailVerified ?? false),
        avatar: d.avatar ?? d.user?.avatar ?? d.user?.avatarUrl ?? null,
        centerId: d.centerId ?? d.user?.centerId ?? d.center?.id ?? d.center?.centerId ?? null,
        centerName: d.centerName ?? d.user?.centerName ?? d.center?.name ?? d.center?.centerName ?? null,
      }

      return {
        success: src.success !== false,
        message: src.message ?? 'Đăng nhập thành công',
        errors: src.errors || null,
        data: {
          token,
          refreshToken,
          user,
        },
      }
    } catch (error: any) {

      // Return user-friendly error message
      return {
        success: false,
        message: error?.userMessage || error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.',
        errors: error?.response?.data?.errors || [error?.userMessage || error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'],
        data: null
      }
    }
  },

  async loginWithGoogle(payload: GoogleLoginRequest) {
    try {
      const response = await api.post<any>('/auth/login-google', payload)
      
      // Normalize backend response (similar to login method)
      const src = response.data || {}
      const d = src.data ?? src
      
      const token = d.accessToken ?? d.token ?? null
      const refreshToken = d.refreshToken ?? null
      
      const user = {
        id: d.userId ?? d.user?.id ?? d.user?.userId ?? d.id ?? null,
        userId: d.userId ?? d.user?.userId ?? d.user?.id ?? d.id ?? null,
        customerId: d.customerId ?? d.user?.customerId ?? d.customer?.id ?? null,
        fullName: d.fullName ?? d.user?.fullName ?? '',
        email: d.email ?? d.user?.email ?? '',
        role: (d.role ?? d.user?.role ?? 'customer'),
        emailVerified: Boolean(d.emailVerified ?? d.user?.emailVerified ?? false),
        avatar: d.avatar ?? d.user?.avatar ?? d.user?.avatarUrl ?? null,
        centerId: d.centerId ?? d.user?.centerId ?? d.center?.id ?? d.center?.centerId ?? null,
        centerName: d.centerName ?? d.user?.centerName ?? d.center?.name ?? d.center?.centerName ?? null,
      }
      
      return {
        success: src.success !== false,
        message: src.message ?? 'Đăng nhập thành công',
        data: {
          token,
          refreshToken,
          user,
        },
      }
    } catch (error: any) {

      return {
        success: false,
        message: error?.userMessage || error?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.',
        errors: error?.response?.data?.errors || [error?.userMessage || error?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.'],
        data: null
      }
    }
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async getProfile() {
    const { data } = await api.get<any>('/Auth/profile')
    const src = data || {}
    const d = src.data ?? src
    const user: User = {
      id: d.userId ?? d.id ?? null,
      customerId: d.customerId ?? d.customer?.id ?? null,
      fullName: d.fullName ?? '',
      email: d.email ?? '',
      role: d.role ?? 'customer',
      emailVerified: Boolean(d.emailVerified ?? false),
      phoneNumber: d.phoneNumber ?? d.phone ?? null,
      avatar: d.avatar ?? d.avatarUrl ?? d.imageUrl ?? null,
      address: d.address ?? null,
      dateOfBirth: d.dateOfBirth ?? d.dob ?? null,
      gender: d.gender ?? null,
      centerId: d.centerId ?? d.center?.id ?? d.center?.centerId ?? null,
      centerName: d.centerName ?? d.center?.name ?? d.center?.centerName ?? null,
    }
    return {
      success: src.success !== false,
      message: src.message ?? 'OK',
      data: user,
    }
  },

  async updateProfile(payload: Partial<{
    fullName: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE'
    address?: string
    email?: string
    phoneNumber?: string
  }>) {
    // Map frontend field names to backend field names
    const requestPayload = {
      FullName: payload.fullName,
      DateOfBirth: payload.dateOfBirth,
      Gender: payload.gender,
      Address: payload.address || '',
      Email: payload.email,
      PhoneNumber: payload.phoneNumber
    }

    const { data } = await api.put<BasicSuccess<User>>('/Auth/profile', requestPayload)
    return data
  },

  async changePassword(payload: { currentPassword: string; newPassword: string; confirmNewPassword: string }) {
    const { data } = await api.post<BasicSuccess<{}>>('/Auth/change-password', payload)
    return data
  },

  async requestResetPassword(email: string) {
    const { data } = await api.post<BasicSuccess<{}>>('/auth/reset-password/request', { email })
    return data
  },

  async confirmResetPassword(payload: { email: string; otpCode: string; newPassword: string; confirmPassword: string }) {
    const { data } = await api.post<BasicSuccess<{}>>('/auth/reset-password/confirm', payload)
    return data
  },

  async verifyEmail(payload: { userId: number; otpCode: string }) {
    const { data } = await api.post<BasicSuccess<{}>>('/auth/verify-email', payload)
    return data
  },

  async resendVerification(email: string) {
    const { data } = await api.post<BasicSuccess<{}>>('/auth/resend-verification', { email })
    return data
  },

  async uploadAvatar(file: File) {
    const form = new FormData()
    // Append common field names to maximize compatibility with backend expectation
    form.append('file', file)
    form.append('avatar', file)
    const { data } = await api.post<any>('/Auth/upload-avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async checkEmailExists(email: string) {
    try {
      const { data } = await api.post<{ exists: boolean; message?: string }>('/auth/check-email', { email })
      return {
        success: true,
        exists: data.exists,
        message: data.message
      }
    } catch (error: any) {

      return {
        success: false,
        exists: false,
        message: error?.userMessage || error?.message || 'Không thể kiểm tra email'
      }
    }
  },

  async checkPhoneExists(phoneNumber: string) {
    try {
      const { data } = await api.post<{ exists: boolean; message?: string }>('/auth/check-phone', { phoneNumber })
      return {
        success: true,
        exists: data.exists,
        message: data.message
      }
    } catch (error: any) {

      return {
        success: false,
        exists: false,
        message: error?.userMessage || error?.message || 'Không thể kiểm tra số điện thoại'
      }
    }
  },
}

// Google Auth Service
export class GoogleAuthService {
  private static instance: GoogleAuthService
  private initialized = false
  private clientId: string

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '377266049123-rjuk203bgm9d81q2o90vccvg0vstpva7.apps.googleusercontent.com'
  }

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService()
    }
    return GoogleAuthService.instance
  }

  async initialize(callback: (response: GoogleCredentialResponse) => void): Promise<boolean> {
    if (this.initialized) return true

    // Check if client ID is available
    if (!this.clientId) {

      return false
    }


    return new Promise((resolve) => {
      let attempts = 0
      const maxAttempts = 20
      const retryDelay = 1000

      const tryInit = () => {
        attempts++

        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: this.clientId,
              callback,
              auto_select: false,
              cancel_on_tap_outside: true,
              context: 'signin',
              use_fedcm_for_prompt: false,
              itp_support: false,
            })
            this.initialized = true
            resolve(true)
          } catch (error) {

            resolve(false)
          }
        } else {
          if (attempts < maxAttempts) {
            setTimeout(tryInit, retryDelay)
          } else {

            resolve(false)
          }
        }
      }

      tryInit()

      setTimeout(() => {
        if (!this.initialized) {

          resolve(false)
        }
      }, 20000)
    })
  }

  renderButton(element: HTMLElement): boolean {
    if (!this.initialized || !window.google?.accounts?.id) {

      return false
    }

    try {
      window.google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
        width: 280,
      })
      return true
    } catch (error) {

      this.showFallbackButton()
      return false
    }
  }

  async prompt(): Promise<boolean> {
    if (!this.initialized || !window.google?.accounts?.id) {

      return false
    }

    return new Promise((resolve) => {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            // Check if it's suppressed by user
            if (notification.j === 'suppressed_by_user') {
              // User needs to reset their consent
            }
            resolve(false)
          } else if (notification.isSkippedMoment()) {
            resolve(false)
          } else {
            resolve(true)
          }
        })
      } catch (error) {

        resolve(false)
      }
    })
  }

  // Method to reset Google consent (useful when user has suppressed it)
  resetGoogleConsent(): void {
    try {
      if (window.google?.accounts?.id) {
        // Clear any stored consent
        if (window.google.accounts.id.disableAutoSelect) {
          window.google.accounts.id.disableAutoSelect()
        }
        // Re-enable auto select
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: () => { }, // Empty callback for reset
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          use_fedcm_for_prompt: true,
          itp_support: true,
        })
      }
    } catch (error) {

    }
  }

  getGoogleAuthUrl(redirect?: string): string {
    const base = import.meta.env.VITE_API_BASE_URL
    if (!base) {
      throw new Error('VITE_API_BASE_URL not configured')
    }
    const url = new URL('/auth/google', base)
    if (redirect) {
      url.searchParams.set('redirect', redirect)
    }
    return url.toString()
  }

  async loginWithGoogle(idToken: string) {
    return AuthService.loginWithGoogle({ token: idToken })
  }

  private showFallbackButton(): void {
    const fallbackButton = document.querySelector('.btn--google-enhanced') as HTMLElement
    if (fallbackButton) {
      fallbackButton.style.display = 'flex'
    }
  }

  redirectToGoogleAuth(redirect?: string): void {
    try {
      const url = this.getGoogleAuthUrl(redirect)
      window.location.href = url
    } catch (error) {

    }
  }
}

// Export singleton instance
export const googleAuthService = GoogleAuthService.getInstance()

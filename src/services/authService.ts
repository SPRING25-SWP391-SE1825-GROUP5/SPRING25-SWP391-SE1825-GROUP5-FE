import api from './api'
import type { User } from '@/store/authSlice'

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
    user: {
      id: number
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
    const { data } = await api.post<BasicSuccess<{ email: string; fullName: string; registeredAt: string }>>(
      '/auth/register',
      payload
    )
    return data
  },

  async login(payload: LoginRequest) {
    const { data } = await api.post<any>('/auth/login', payload)

    // Normalize backend response into FE-standard shape
    // Accepted backend shapes (examples):
    // 1) { success, message, data: { accessToken, refreshToken, userId, fullName, role, emailVerified, ... } }
    // 2) { token, refreshToken, user: { ... } }
    const src = data || {}
    const d = src.data ?? src

    const token = d.accessToken ?? d.token ?? null
    const refreshToken = d.refreshToken ?? null

    const user = {
      id: d.userId ?? d.user?.id ?? d.id ?? null,
      fullName: d.fullName ?? d.user?.fullName ?? '',
      email: d.email ?? d.user?.email ?? '',
      role: (d.role ?? d.user?.role ?? 'customer'),
      emailVerified: Boolean(d.emailVerified ?? d.user?.emailVerified ?? false),
      avatar: d.avatar ?? d.user?.avatar ?? null,
    }

    return {
      success: src.success !== false,
      message: src.message ?? 'Login success',
      data: {
        token,
        refreshToken,
        user,
      },
    }
  },

  async loginWithGoogle(payload: GoogleLoginRequest) {
    const { data } = await api.post<AuthSuccess>('/auth/login-google', payload)
    return data
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
      fullName: d.fullName ?? '',
      email: d.email ?? '',
      role: d.role ?? 'customer',
      emailVerified: Boolean(d.emailVerified ?? false),
      avatar: d.avatar ?? d.avatarUrl ?? d.imageUrl ?? null,
      address: d.address ?? null,
      dateOfBirth: d.dateOfBirth ?? d.dob ?? null,
      gender: d.gender ?? null,
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
  }>) {
    const { data } = await api.put<BasicSuccess<User>>('/Auth/profile', payload)
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
}

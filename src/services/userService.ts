import api from './api'
import type { User } from '@/store/authSlice'

export type LoginRequest = { email: string; password: string }

export type LoginResponse = {
  token: string
  refreshToken: string
  user: User
}

export const UserService = {
  async login(payload: LoginRequest) {
    const { data } = await api.post<LoginResponse>('/auth/login', payload)
    return data
  },
  async logout() {
    await api.post('/auth/logout')
  },
  async refresh(refreshToken: string) {
    const { data } = await api.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken })
    return data
  },
  async getCurrentUser() {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
  async updateProfile(userData: Partial<User>) {
    const { data } = await api.put<User>('/users/me', userData)
    return data
  },
}


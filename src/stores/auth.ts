import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { UserService } from '../services/userService'
import type { User, LoginRequest } from '../types/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('authToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || '')
  const userName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`.trim()
  })

  // Actions
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const response = await UserService.login(credentials)
      
      if (response.success && response.data) {
        token.value = response.data.token
        refreshToken.value = response.data.refreshToken
        user.value = response.data.user

        // Store in localStorage
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        
        return true
      } else {
        error.value = response.message || 'Login failed'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      if (token.value) {
        await UserService.logout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear state regardless of API call success
      user.value = null
      token.value = null
      refreshToken.value = null
      error.value = null
      
      // Clear localStorage
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
    }
  }

  const refreshAuthToken = async (): Promise<boolean> => {
    try {
      if (!refreshToken.value) return false

      const response = await UserService.refreshToken(refreshToken.value)
      
      if (response.success && response.data) {
        token.value = response.data.token
        refreshToken.value = response.data.refreshToken
        user.value = response.data.user

        // Update localStorage
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        
        return true
      }
      
      return false
    } catch (err) {
      console.error('Token refresh failed:', err)
      await logout() // Clear invalid tokens
      return false
    }
  }

  const getCurrentUser = async (): Promise<void> => {
    try {
      if (!token.value) return

      const response = await UserService.getCurrentUser()
      
      if (response.success && response.data) {
        user.value = response.data
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshAuthToken()
        if (!refreshed) {
          await logout()
        }
      }
    }
  }

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const response = await UserService.updateProfile(userData)
      
      if (response.success && response.data) {
        user.value = response.data
        return true
      } else {
        error.value = response.message || 'Profile update failed'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Profile update failed'
      return false
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Initialize auth state on store creation
  const initializeAuth = async () => {
    if (token.value) {
      await getCurrentUser()
    }
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    userRole,
    userName,
    
    // Actions
    login,
    logout,
    refreshAuthToken,
    getCurrentUser,
    updateProfile,
    clearError,
    initializeAuth
  }
})

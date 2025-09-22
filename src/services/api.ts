import axios from 'axios'
import { store } from '@/store'
import { logout } from '@/store/authSlice'

const api = axios.create({
  // Default to backend at port 5000 if env not provided
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: false, // No cookies needed for JWT authentication
})

api.interceptors.request.use((config) => {
  const state = store.getState()
  const token = state.auth.token
  if (token) {
    config.headers = (config.headers || {}) as any
    ;(config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})

// Simple 401 handler: auto-logout. Refresh flow can be added if backend supports it.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    if (status === 401) {
      store.dispatch(logout())
    }
    return Promise.reject(error)
  }
)

export default api


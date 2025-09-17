import axios from 'axios'
import { store } from '@/store'
import { refreshAuthToken, logout } from '@/store/authSlice'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const state = store.getState()
  const token = state.auth.token
  if (token) {
    config.headers = config.headers || {} as any
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let queuedRequests: Array<(token: string | null) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const state = store.getState()
          const currentRefresh = state.auth.refreshToken
          if (!currentRefresh) throw new Error('No refresh token')
          const result = await store.dispatch(refreshAuthToken(currentRefresh))
          const newToken = (result as any)?.payload?.token || null
          queuedRequests.forEach((cb) => cb(newToken))
          queuedRequests = []
          return api(original)
        } catch (e) {
          store.dispatch(logout())
          queuedRequests = []
          return Promise.reject(error)
        } finally {
          isRefreshing = false
        }
      }
      return new Promise((resolve, reject) => {
        queuedRequests.push((token) => {
          if (!token) {
            reject(error)
            return
          }
          original.headers = original.headers || {}
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }
    return Promise.reject(error)
  }
)

export default api


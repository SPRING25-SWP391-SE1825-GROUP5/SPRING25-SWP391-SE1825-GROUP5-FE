import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    
    if (error.response?.status === 403) {
      // Forbidden
      console.error('Access denied')
    }
    
    if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

// Generic API methods
export const api = {
  // GET request
  get: <T>(url: string, params?: any): Promise<AxiosResponse<T>> => {
    return apiClient.get(url, { params })
  },

  // POST request
  post: <T>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return apiClient.post(url, data)
  },

  // PUT request
  put: <T>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return apiClient.put(url, data)
  },

  // DELETE request
  delete: <T>(url: string): Promise<AxiosResponse<T>> => {
    return apiClient.delete(url)
  },

  // PATCH request
  patch: <T>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return apiClient.patch(url, data)
  }
}

export default apiClient

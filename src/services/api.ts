import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { HealthService } from './healthService'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001/api',
  withCredentials: false,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

let tokenGetter: (() => string | null) | null = null
let unauthorizedHandler: (() => void) | null = null

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds
const BACKEND_RESTART_ERROR_CODES = [404, 500, 502, 503, 504]
const AUTH_ERROR_CODES = [401, 403]

// Request queue to prevent duplicate requests
const pendingRequests = new Map<string, Promise<any>>()

// Track if backend health check is in progress
let healthCheckInProgress = false

export function attachTokenGetter(getter: () => string | null) {
  tokenGetter = getter
}

export function attachUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

/**
 * Check if error is likely due to backend restart
 */
function isBackendRestartError(error: AxiosError): boolean {
  if (!error.response) {
    // Network error - could be backend restart
    return error.code === 'ECONNREFUSED' || 
           error.code === 'ETIMEDOUT' ||
           error.message.includes('ERR_CONNECTION_REFUSED') ||
           error.message.includes('timeout')
  }

  const status = error.response.status
  
  // 404 with specific error codes might indicate backend issue
  if (status === 404) {
    const errorData = error.response.data as any
    // Check if it's a generic "not found" vs specific resource not found
    const errorMessage = errorData?.message || errorData?.error || ''
    // If message is generic, might be backend restart
    const genericMessages = [
      'không tìm thấy',
      'not found',
      'not found resource',
      'tài nguyên yêu cầu'
    ]
    return genericMessages.some(msg => 
      errorMessage.toLowerCase().includes(msg.toLowerCase())
    )
  }

  return BACKEND_RESTART_ERROR_CODES.includes(status)
}

/**
 * Check if error is authentication related
 */
function isAuthError(error: AxiosError): boolean {
  if (!error.response) return false
  const status = error.response.status
  return AUTH_ERROR_CODES.includes(status)
}

/**
 * Get request cache key
 */
function getRequestKey(config: InternalAxiosRequestConfig): string {
  return `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.params)}_${JSON.stringify(config.data)}`
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

api.interceptors.request.use((config) => {
  const token = tokenGetter ? tokenGetter() : null
  if (token) {
    if (!config.headers) {
      config.headers = {} as any
    }
    config.headers.Authorization = `Bearer ${token}`
  }

  // Add retry count to config if not present
  if (!(config as any).__retryCount) {
    (config as any).__retryCount = 0
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error?.response?.status
    const originalRequest = error.config as InternalAxiosRequestConfig & { __retryCount?: number }
    const retryCount = originalRequest?.__retryCount || 0

    // Handle authentication errors - don't retry, logout immediately
    if (isAuthError(error)) {
      console.warn('[AUTH_ERROR] Authentication failed - logging out user')
      
    if (status === 401) {
      if (unauthorizedHandler) unauthorizedHandler()
      }

      const errorData = error.response?.data as any
      const errorMessage = errorData?.message || 
                          (status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : 'Bạn không có quyền thực hiện hành động này.')

      return Promise.reject({
        ...error,
        message: errorMessage,
        userMessage: errorMessage,
        isAuthError: true
      })
    }

    // Check if error might be due to backend restart
    const mightBeBackendRestart = isBackendRestartError(error)

    // Retry logic for backend restart scenarios
    if (mightBeBackendRestart && retryCount < MAX_RETRIES && originalRequest) {
      console.log(`[RETRY] Backend might be restarting. Retry ${retryCount + 1}/${MAX_RETRIES}`)

      // Wait for backend to be ready before retrying
      if (!healthCheckInProgress) {
        healthCheckInProgress = true
        try {
          const isReady = await HealthService.waitForBackendReady(
            MAX_RETRIES,
            RETRY_DELAY,
            3000
          )
          if (!isReady) {
            console.warn('[HEALTH_CHECK] Backend not ready after retries')
          }
        } catch (healthError) {
          console.error('[HEALTH_CHECK] Error checking backend health:', healthError)
        } finally {
          healthCheckInProgress = false
        }
      } else {
        // If health check is in progress, wait a bit
        await sleep(RETRY_DELAY)
      }

      // Increment retry count and retry the request
      originalRequest.__retryCount = retryCount + 1
      
      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(1.5, retryCount)
      await sleep(delay)

      return api(originalRequest)
    }

    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        return Promise.reject({
          ...error,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc đợi server khởi động lại.',
          userMessage: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc đợi server khởi động lại.',
          isNetworkError: true
        })
      }

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return Promise.reject({
          ...error,
          message: 'Kết nối quá chậm. Vui lòng thử lại sau.',
          userMessage: 'Kết nối quá chậm. Vui lòng thử lại sau.',
          isTimeoutError: true
        })
      }

      return Promise.reject({
        ...error,
        message: 'Lỗi kết nối. Vui lòng thử lại sau.',
        userMessage: 'Lỗi kết nối. Vui lòng thử lại sau.',
        isNetworkError: true
      })
    }

    // Handle HTTP status errors with improved messages
    const errorMessages: { [key: number]: string } = {
      400: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
      403: 'Bạn không có quyền thực hiện hành động này.',
      404: 'Không tìm thấy tài nguyên yêu cầu.',
      409: 'Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.',
      422: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
      429: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
      500: 'Lỗi máy chủ. Vui lòng thử lại sau.',
      502: 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.',
      503: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
      504: 'Máy chủ phản hồi quá chậm. Vui lòng thử lại sau.'
    }

    // Get error message from response first, then fallback to status message
    const errorData = error.response.data as any
    const responseMessage = errorData?.message || errorData?.error
    const userMessage = responseMessage ||
      errorMessages[status] ||
      'Đã xảy ra lỗi. Vui lòng thử lại sau.'

    // Log error for debugging
    if (mightBeBackendRestart) {
      console.warn(`[BACKEND_RESTART_DETECTED] Status ${status}: ${userMessage}`)
    }

    return Promise.reject({
      ...error,
      message: userMessage,
      userMessage: userMessage,
      isBackendRestart: mightBeBackendRestart,
      retryCount
    })
  }
)

export default api

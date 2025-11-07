import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001/api',
  withCredentials: false,
  timeout: 30000, // Tăng timeout từ 10s lên 30s cho các API report/summary
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

let tokenGetter: (() => string | null) | null = null
let unauthorizedHandler: (() => void) | null = null

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds - wait longer for backend to fully initialize
const BACKEND_RESTART_ERROR_CODES = [404, 500, 502, 503, 504]
const AUTH_ERROR_CODES = [401, 403]


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
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ETIMEDOUT' ||
           error.message.includes('ERR_CONNECTION_REFUSED') ||
           error.message.includes('timeout')
  }

  const status = error.response.status

  // 401/403 with valid token might be backend restart
  if (AUTH_ERROR_CODES.includes(status)) {
    const token = tokenGetter ? tokenGetter() : null
    if (token) {
      // Check if it's a generic auth error (likely restart) vs specific (token expired)
      const errorData = error.response.data as any
      const errorMessage = (errorData?.message || errorData?.error || '').toLowerCase()

      // Real auth errors have specific messages
      const realAuthMessages = [
        'token expired',
        'token không hợp lệ',
        'token invalid',
        'phiên đăng nhập đã kết thúc'
      ]

      // If not a real auth error message, likely backend restart
      return !realAuthMessages.some(msg => errorMessage.includes(msg))
    }
  }

  if (status === 404) {
    const errorData = error.response.data as any
    const errorMessage = (errorData?.message || errorData?.error || '').toLowerCase()
    const genericMessages = ['không tìm thấy', 'not found', 'tài nguyên yêu cầu']
    return genericMessages.some(msg => errorMessage.includes(msg))
  }

  return BACKEND_RESTART_ERROR_CODES.includes(status)
}

/**
 * Check if error is real authentication error (not backend restart)
 */
function isAuthError(error: AxiosError): boolean {
  if (!error.response) return false

  const status = error.response.status
  if (!AUTH_ERROR_CODES.includes(status)) return false

  const token = tokenGetter ? tokenGetter() : null

  // No token + 401 = real auth error
  if (!token && status === 401) return true

  // With token, check error message for real auth errors
  if (token) {
    const errorData = error.response.data as any
    const errorMessage = (errorData?.message || errorData?.error || '').toLowerCase()
    const realAuthMessages = [
      'token expired',
      'token không hợp lệ',
      'token invalid',
      'phiên đăng nhập đã kết thúc'
    ]
    return realAuthMessages.some(msg => errorMessage.includes(msg))
  }

  return false
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
  // Try to get token - if tokenGetter is not ready, try localStorage directly
  let token: string | null = null

  try {
    if (tokenGetter) {
      token = tokenGetter()
    }

    // Fallback: if tokenGetter returns null but we might have token in localStorage
    // This can happen during app initialization before Redux store is ready
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('authToken') || localStorage.getItem('token')
    }

    // Trim token to remove any whitespace
    if (token) {
      token = token.trim()
    }

    if (token) {
      if (!config.headers) {
        config.headers = {} as any
      }
      config.headers.Authorization = `Bearer ${token}`
      
      // Debug logging for inventory API calls
      if (config.url?.includes('/Inventory/')) {
        console.log('[API] Request to Inventory API:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
          tokenLength: token?.length,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
          headers: {
            Authorization: config.headers.Authorization ? 'Bearer ***' : 'missing'
          }
        })
      }
    } else {
      // Log warning if no token for protected endpoints
      if (config.url?.includes('/Inventory/')) {
        console.warn('[API] WARNING: No token found for Inventory API request:', {
          url: config.url,
          method: config.method,
          localStorage: typeof localStorage !== 'undefined' ? {
            authToken: localStorage.getItem('authToken') ? 'exists' : 'missing',
            token: localStorage.getItem('token') ? 'exists' : 'missing'
          } : 'N/A'
        })
      }
    }
  } catch (error) {
    // If tokenGetter throws, try localStorage as fallback
    if (typeof localStorage !== 'undefined') {
      token = localStorage.getItem('authToken') || localStorage.getItem('token')
      if (token) {
        token = token.trim()
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    }
    
    console.error('[API] Error getting token:', error)
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

    // Check if it's a real auth error (don't retry, logout immediately)
    if (isAuthError(error)) {
      if (status === 401 && unauthorizedHandler) {
        unauthorizedHandler()
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

    // Check if error is due to backend restart
    const mightBeBackendRestart = isBackendRestartError(error)

    // Retry logic for backend restart scenarios
    if (mightBeBackendRestart && retryCount < MAX_RETRIES && originalRequest) {
      // Simple approach: just wait longer and retry
      // For auth errors with valid token, wait longer (backend needs time to initialize auth)
      const waitTime = AUTH_ERROR_CODES.includes(status || 0) && tokenGetter && tokenGetter()
        ? RETRY_DELAY * (retryCount + 2) // Longer wait for auth initialization
        : RETRY_DELAY * Math.pow(1.5, retryCount) // Exponential backoff for others

      await sleep(waitTime)

      // Increment retry count and retry
      originalRequest.__retryCount = retryCount + 1
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

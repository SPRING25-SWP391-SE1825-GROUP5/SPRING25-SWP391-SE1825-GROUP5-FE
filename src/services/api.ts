import axios from 'axios'

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

export function attachTokenGetter(getter: () => string | null) {
  tokenGetter = getter
}

export function attachUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

api.interceptors.request.use((config) => {
  const token = tokenGetter ? tokenGetter() : null
  if (token) {
    if (!config.headers) {
      config.headers = {} as any
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (status === 401) {
      // Log token expiration for debugging
      console.warn('Token expired - user will be logged out')

      if (unauthorizedHandler) unauthorizedHandler()
      return Promise.reject({
        ...error,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        userMessage: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      })
    }

    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        return Promise.reject({
          ...error,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
          userMessage: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
        })
      }

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return Promise.reject({
          ...error,
          message: 'Kết nối quá chậm. Vui lòng thử lại sau.',
          userMessage: 'Kết nối quá chậm. Vui lòng thử lại sau.'
        })
      }

      return Promise.reject({
        ...error,
        message: 'Lỗi kết nối. Vui lòng thử lại sau.',
        userMessage: 'Lỗi kết nối. Vui lòng thử lại sau.'
      })
    }

    // Handle HTTP status errors
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

    const userMessage = errorMessages[status] ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Đã xảy ra lỗi. Vui lòng thử lại sau.'

    return Promise.reject({
      ...error,
      message: userMessage,
      userMessage: userMessage
    })
  }
)

export default api

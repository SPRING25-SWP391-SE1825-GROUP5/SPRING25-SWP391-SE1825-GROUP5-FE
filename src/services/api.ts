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
    config.headers = (config.headers || {}) as any
    ;(config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    if (status === 401) {
      if (unauthorizedHandler) unauthorizedHandler()
    }
    return Promise.reject(error)
  }
)

export default api

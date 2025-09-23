// Centralized UI configuration constants
// Adjust these values without hunting through component code.

// Debounce delay for inline form validation (ms)
export const LOGIN_INPUT_DEBOUNCE_MS = 1000

// Global toast durations (optional; use where needed)
export const TOAST_DURATION = {
  success: 3000,
  error: 4000,
}

// Loading messages (optional centralization)
export const LOADING_MESSAGES = {
  loggingIn: 'Đang đăng nhập...',
}

// Role-based redirect after login
export const ROLE_ROUTE_MAP: Record<string, string> = {
  admin: '/admin',
  staff: '/staff',
  technician: '/technician',
  manager: '/manager',
  customer: '/dashboard',
}
export const DEFAULT_AFTER_LOGIN = '/dashboard'


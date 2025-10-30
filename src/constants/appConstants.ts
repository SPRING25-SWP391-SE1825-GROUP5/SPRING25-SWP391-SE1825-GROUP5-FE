// ===========================================
// APP CONSTANTS
// ===========================================

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  LARGE_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
} as const

// API
export const API = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const

// UI
export const UI = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 3000,
  MODAL_Z_INDEX: 2000,
  DROPDOWN_Z_INDEX: 1000
} as const

// Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 50,
  PHONE_PATTERN: /^[0-9]{10,11}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100
} as const

// Status
export const STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const

// Roles
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  TECHNICIAN: 'TECHNICIAN',
  CUSTOMER: 'CUSTOMER'
} as const

// Technician Positions
export const TECHNICIAN_POSITIONS = {
  GENERAL: 'GENERAL',
  SENIOR: 'SENIOR',
  LEAD: 'LEAD'
} as const

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const

// Maintenance Checklist Results
export const CHECKLIST_RESULTS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  PENDING: 'PENDING'
} as const

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  MAX_FILES: 5
} as const

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm'
} as const

// Colors
export const COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#06B6D4',
  GRAY: '#6B7280'
} as const

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1280px'
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  AUTH_TOKEN: 'authToken',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
  UNAUTHORIZED: 'Bạn không có quyền truy cập.',
  FORBIDDEN: 'Truy cập bị từ chối.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  TIMEOUT: 'Yêu cầu quá thời gian chờ.',
  UNKNOWN: 'Đã xảy ra lỗi không xác định.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Lưu thành công!',
  DELETE_SUCCESS: 'Xóa thành công!',
  UPDATE_SUCCESS: 'Cập nhật thành công!',
  CREATE_SUCCESS: 'Tạo mới thành công!',
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  LOGOUT_SUCCESS: 'Đăng xuất thành công!'
} as const

// Supplier Names
export const SUPPLIER_NAMES = [
  'Panasonic',
  'LG Chem',
  'CATL',
  'BYD',
  'Samsung SDI',
  'Delta Electronics',
  'Bosch',
  'Tesla',
  'A123 Systems',
  'EnerDel'
] as const

// Default Values
export const DEFAULT_VALUES = {
  STAFF_MEMBER: 'Staff Member',
  CUSTOMER: 'Customer',
  UNKNOWN: 'Unknown'
} as const

/**
 * EV Service Center Management System - Utility Functions
 * TypeScript utility functions for common operations
 */

import type { 
  User, 
  UserRole, 
  ServiceStatus, 
  VehicleStatus, 
  PaymentStatus,
  ApiResponse,
  PaginatedResponse 
} from '@/types'
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/constants'

// ========== TYPE GUARDS ==========
export const isCustomer = (user: User): user is User & { role: UserRole.CUSTOMER } => {
  return user.role === UserRole.CUSTOMER
}

export const isStaff = (user: User): user is User & { role: UserRole.STAFF } => {
  return user.role === UserRole.STAFF
}

export const isTechnician = (user: User): user is User & { role: UserRole.TECHNICIAN } => {
  return user.role === UserRole.TECHNICIAN
}

export const isManager = (user: User): user is User & { role: UserRole.MANAGER } => {
  return user.role === UserRole.MANAGER
}

export const isAdmin = (user: User): user is User & { role: UserRole.ADMIN } => {
  return user.role === UserRole.ADMIN
}

// ========== VALIDATION FUNCTIONS ==========
export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL.PATTERN.test(email)
}

export const validatePhone = (phone: string): boolean => {
  return VALIDATION_RULES.PHONE.PATTERN.test(phone)
}

export const validateVIN = (vin: string): boolean => {
  return vin.length === VALIDATION_RULES.VIN.LENGTH && 
         VALIDATION_RULES.VIN.PATTERN.test(vin)
}

export const validateLicensePlate = (plate: string): boolean => {
  return VALIDATION_RULES.LICENSE_PLATE.PATTERN.test(plate)
}

export const validatePassword = (password: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  const rules = VALIDATION_RULES.PASSWORD

  if (password.length < rules.MIN_LENGTH) {
    errors.push(`Password must be at least ${rules.MIN_LENGTH} characters long`)
  }

  if (rules.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (rules.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (rules.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (rules.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ========== FORMATTING FUNCTIONS ==========
export const formatCurrency = (amount: number, currency = 'VND'): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatDate = (date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('vi-VN')
    case 'long':
      return dateObj.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'time':
      return dateObj.toLocaleString('vi-VN')
    default:
      return dateObj.toLocaleDateString('vi-VN')
  }
}

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins} phút`
  } else if (mins === 0) {
    return `${hours} giờ`
  } else {
    return `${hours} giờ ${mins} phút`
  }
}

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// ========== STRING UTILITIES ==========
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const truncate = (str: string, length: number, suffix = '...'): string => {
  if (str.length <= length) return str
  return str.substring(0, length) + suffix
}

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// ========== ARRAY UTILITIES ==========
export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ========== DATE UTILITIES ==========
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

export const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export const isFuture = (date: Date): boolean => {
  return date > new Date()
}

export const isPast = (date: Date): boolean => {
  return date < new Date()
}

export const getWeekStart = (date: Date): Date => {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(result.setDate(diff))
}

export const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date)
  return addDays(weekStart, 6)
}

// ========== API UTILITIES ==========
export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true } => {
  return response.success === true
}

export const extractApiError = (response: ApiResponse): string => {
  if (response.errors && response.errors.length > 0) {
    return response.errors[0]
  }
  return response.message || ERROR_MESSAGES.UNKNOWN_ERROR
}

export const createPaginationInfo = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    startIndex: (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, total)
  }
}

// ========== LOCAL STORAGE UTILITIES ==========
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch {
      return defaultValue || null
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
    }
  },

  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}

// ========== DEBOUNCE & THROTTLE ==========
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// ========== FILE UTILITIES ==========
export const downloadFile = (data: Blob | string, filename: string, type?: string): void => {
  const blob = typeof data === 'string' ? new Blob([data], { type: type || 'text/plain' }) : data
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// ========== EXPORT ALL UTILITIES ==========
export const utils = {
  // Type guards
  isCustomer,
  isStaff,
  isTechnician,
  isManager,
  isAdmin,
  
  // Validation
  validateEmail,
  validatePhone,
  validateVIN,
  validateLicensePlate,
  validatePassword,
  
  // Formatting
  formatCurrency,
  formatDate,
  formatDuration,
  formatFileSize,
  
  // String utilities
  capitalize,
  truncate,
  slugify,
  generateId,
  
  // Array utilities
  groupBy,
  sortBy,
  unique,
  chunk,
  
  // Date utilities
  addDays,
  addHours,
  isToday,
  isFuture,
  isPast,
  getWeekStart,
  getWeekEnd,
  
  // API utilities
  isApiSuccess,
  extractApiError,
  createPaginationInfo,
  
  // Storage
  storage,
  
  // Performance
  debounce,
  throttle,
  
  // File utilities
  downloadFile,
  readFileAsText,
  readFileAsDataURL
}

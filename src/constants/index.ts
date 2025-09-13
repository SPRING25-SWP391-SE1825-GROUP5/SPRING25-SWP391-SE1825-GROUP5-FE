/**
 * EV Service Center Management System - Constants & Configuration
 * TypeScript constants for consistent usage across the application
 */

import { UserRole, ServiceType, ServiceStatus, PaymentMethod, VehicleStatus } from '@/types'

// ========== APPLICATION CONSTANTS ==========
export const APP_CONFIG = {
  NAME: 'EV Service Center Management System',
  VERSION: '1.0.0',
  DESCRIPTION: 'Comprehensive EV maintenance and service management platform',
  AUTHOR: 'SWP391 Team',
  TECH_STACK: 'Vue 3 + TypeScript + Vite'
} as const

// ========== API CONFIGURATION ==========
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  ENDPOINTS: {
    AUTH: '/auth',
    USERS: '/users',
    CUSTOMERS: '/customers',
    VEHICLES: '/vehicles',
    SERVICES: '/services',
    BOOKINGS: '/bookings',
    INVENTORY: '/inventory',
    PAYMENTS: '/payments',
    REPORTS: '/reports',
    NOTIFICATIONS: '/notifications',
    CHAT: '/chat',
    AUDIT: '/audit'
  }
} as const

// ========== USER ROLES & PERMISSIONS ==========
export const ROLES = {
  CUSTOMER: UserRole.CUSTOMER,
  STAFF: UserRole.STAFF,
  TECHNICIAN: UserRole.TECHNICIAN,
  MANAGER: UserRole.MANAGER,
  ADMIN: UserRole.ADMIN
} as const

export const ROLE_PERMISSIONS = {
  [UserRole.CUSTOMER]: [
    'view_own_profile',
    'update_own_profile',
    'view_own_vehicles',
    'create_booking',
    'view_own_bookings',
    'view_own_invoices',
    'make_payment'
  ],
  [UserRole.STAFF]: [
    'view_customers',
    'update_customers',
    'view_vehicles',
    'update_vehicles',
    'manage_bookings',
    'create_service_orders',
    'view_inventory',
    'chat_with_customers'
  ],
  [UserRole.TECHNICIAN]: [
    'view_assigned_services',
    'update_service_progress',
    'complete_checklist',
    'upload_media',
    'view_vehicle_history',
    'request_parts'
  ],
  [UserRole.MANAGER]: [
    'view_all_services',
    'assign_technicians',
    'approve_quotes',
    'view_reports',
    'manage_inventory',
    'manage_staff_schedules',
    'view_financial_reports'
  ],
  [UserRole.ADMIN]: [
    'manage_users',
    'manage_service_centers',
    'system_configuration',
    'view_audit_logs',
    'manage_certifications',
    'full_access'
  ]
} as const

// ========== SERVICE CONFIGURATION ==========
export const SERVICE_TYPES = {
  MAINTENANCE: ServiceType.MAINTENANCE,
  REPAIR: ServiceType.REPAIR,
  INSPECTION: ServiceType.INSPECTION,
  WARRANTY: ServiceType.WARRANTY
} as const

export const SERVICE_CATEGORIES = {
  BATTERY: {
    name: 'Battery Services',
    services: ['Battery Health Check', 'Battery Replacement', 'Charging System Repair']
  },
  MOTOR: {
    name: 'Motor Services', 
    services: ['Motor Diagnostics', 'Motor Repair', 'Performance Tuning']
  },
  ELECTRICAL: {
    name: 'Electrical Systems',
    services: ['Wiring Inspection', 'Control Unit Repair', 'Sensor Calibration']
  },
  MECHANICAL: {
    name: 'Mechanical Services',
    services: ['Brake Service', 'Suspension Check', 'Tire Rotation']
  },
  SOFTWARE: {
    name: 'Software Updates',
    services: ['Firmware Update', 'System Diagnostics', 'Feature Activation']
  }
} as const

export const SERVICE_STATUS_CONFIG = {
  [ServiceStatus.PENDING]: {
    label: 'Pending',
    color: '#faad14',
    icon: 'clock-circle'
  },
  [ServiceStatus.CONFIRMED]: {
    label: 'Confirmed',
    color: '#1890ff',
    icon: 'check-circle'
  },
  [ServiceStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#722ed1',
    icon: 'sync'
  },
  [ServiceStatus.COMPLETED]: {
    label: 'Completed',
    color: '#52c41a',
    icon: 'check-circle-filled'
  },
  [ServiceStatus.CANCELLED]: {
    label: 'Cancelled',
    color: '#ff4d4f',
    icon: 'close-circle'
  }
} as const

// ========== VEHICLE CONFIGURATION ==========
export const EV_MANUFACTURERS = [
  'Tesla',
  'BYD',
  'Nissan',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Volkswagen',
  'Hyundai',
  'Kia',
  'Ford',
  'Chevrolet',
  'Lucid',
  'Rivian',
  'Polestar',
  'VinFast'
] as const

export const VEHICLE_STATUS_CONFIG = {
  [VehicleStatus.ACTIVE]: {
    label: 'Active',
    color: '#52c41a',
    icon: 'car'
  },
  [VehicleStatus.MAINTENANCE]: {
    label: 'Under Maintenance',
    color: '#faad14',
    icon: 'tool'
  },
  [VehicleStatus.INACTIVE]: {
    label: 'Inactive',
    color: '#d9d9d9',
    icon: 'stop'
  }
} as const

// ========== PAYMENT CONFIGURATION ==========
export const PAYMENT_METHODS = {
  CASH: PaymentMethod.CASH,
  CARD: PaymentMethod.CARD,
  BANK_TRANSFER: PaymentMethod.BANK_TRANSFER,
  E_WALLET: PaymentMethod.E_WALLET
} as const

export const PAYMENT_METHOD_CONFIG = {
  [PaymentMethod.CASH]: {
    label: 'Cash',
    icon: 'dollar',
    color: '#52c41a'
  },
  [PaymentMethod.CARD]: {
    label: 'Credit/Debit Card',
    icon: 'credit-card',
    color: '#1890ff'
  },
  [PaymentMethod.BANK_TRANSFER]: {
    label: 'Bank Transfer',
    icon: 'bank',
    color: '#722ed1'
  },
  [PaymentMethod.E_WALLET]: {
    label: 'E-Wallet',
    icon: 'wallet',
    color: '#fa8c16'
  }
} as const

// ========== TIME & SCHEDULING ==========
export const OPERATING_HOURS = {
  DEFAULT_OPEN: '08:00',
  DEFAULT_CLOSE: '18:00',
  SLOT_DURATION: 60, // minutes
  BREAK_TIME: 15, // minutes between slots
  LUNCH_START: '12:00',
  LUNCH_END: '13:00'
} as const

export const WEEKDAYS = [
  'monday',
  'tuesday', 
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

// ========== NOTIFICATION CONFIGURATION ==========
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
} as const

export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app'
} as const

// ========== VALIDATION RULES ==========
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false
  },
  PHONE: {
    PATTERN: /^(\+84|0)[3|5|7|8|9][0-9]{8}$/,
    MESSAGE: 'Please enter a valid Vietnamese phone number'
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address'
  },
  VIN: {
    LENGTH: 17,
    PATTERN: /^[A-HJ-NPR-Z0-9]{17}$/,
    MESSAGE: 'VIN must be 17 characters (letters and numbers, no I, O, Q)'
  },
  LICENSE_PLATE: {
    PATTERN: /^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}$/,
    MESSAGE: 'Please enter a valid Vietnamese license plate (e.g., 30A-12345)'
  }
} as const

// ========== FILE UPLOAD CONFIGURATION ==========
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
} as const

// ========== PAGINATION ==========
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
} as const

// ========== CACHE CONFIGURATION ==========
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  SERVICE_CENTERS: 'service_centers',
  VEHICLE_MODELS: 'vehicle_models',
  SERVICE_TYPES: 'service_types',
  TECHNICIAN_SCHEDULES: 'technician_schedules'
} as const

export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000 // 24 hours
} as const

// ========== ERROR MESSAGES ==========
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please contact support.'
} as const

// ========== SUCCESS MESSAGES ==========
export const SUCCESS_MESSAGES = {
  BOOKING_CREATED: 'Your booking has been successfully created.',
  PAYMENT_COMPLETED: 'Payment completed successfully.',
  PROFILE_UPDATED: 'Your profile has been updated.',
  SERVICE_COMPLETED: 'Service has been marked as completed.',
  NOTIFICATION_SENT: 'Notification sent successfully.',
  DATA_EXPORTED: 'Data exported successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.'
} as const

// Export all constants as a single object for convenience
export const CONSTANTS = {
  APP_CONFIG,
  API_CONFIG,
  ROLES,
  ROLE_PERMISSIONS,
  SERVICE_TYPES,
  SERVICE_CATEGORIES,
  SERVICE_STATUS_CONFIG,
  EV_MANUFACTURERS,
  VEHICLE_STATUS_CONFIG,
  PAYMENT_METHODS,
  PAYMENT_METHOD_CONFIG,
  OPERATING_HOURS,
  WEEKDAYS,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  VALIDATION_RULES,
  FILE_UPLOAD,
  PAGINATION,
  CACHE_KEYS,
  CACHE_TTL,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} as const

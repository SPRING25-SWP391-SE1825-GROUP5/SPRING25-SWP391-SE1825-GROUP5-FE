import api from './api'

// Request Types
export interface LoginLockoutConfigRequest {
  maxFailedAttempts: number
  lockoutDurationMinutes: number
  cacheKeyPrefix: string
  enabled: boolean
}

export interface UpdateBookingRealtimeRequest {
  holdTtlMinutes: number
  hubPath: string
}

export interface UpdatePayOsSettingsRequest {
  minAmount: number
  descriptionMaxLength: number
}

export interface UpdateGuestSessionSettingsRequest {
  cookieName: string
  ttlMinutes: number
  secureOnly: boolean
  sameSite: string
  path: string
}

export interface UpdateMaintenanceReminderSettingsRequest {
  upcomingDays: number
  dispatchHourLocal: number
  timeZoneId: string
}

// Response Types
export interface LoginLockoutConfig {
  maxFailedAttempts: number
  lockoutDurationMinutes: number
  cacheKeyPrefix: string
  enabled: boolean
}

export interface BookingRealtimeSettings {
  holdTtlMinutes: number
  hubPath: string
}

export interface PayOsSettings {
  minAmount: number
  descriptionMaxLength: number
}

export interface GuestSessionSettings {
  cookieName: string
  ttlMinutes: number
  secureOnly: boolean
  sameSite: string
  path: string
}

export interface MaintenanceReminderSettings {
  upcomingDays: number
  dispatchHourLocal: number
  timeZoneId: string
}

export interface LockoutStatus {
  email: string
  isLocked: boolean
  remainingAttempts: number
  lockoutExpiry: string | null
}

export interface Features {
  enableMaintenanceReminder: boolean
  enableSoftWarning: boolean
  enableGuestBooking: boolean
  enableRealTimeBooking: boolean
  enablePromotions: boolean
  enableFeedback: boolean
  enableNotifications: boolean
  enableFileUpload: boolean
  enableMultiplePaymentMethods: boolean
  enableBookingHistory: boolean
  enableOrderHistory: boolean
  enableVehicleManagement: boolean
  enableTechnicianAssignment: boolean
  enableInventoryManagement: boolean
  enableReports: boolean
}

export interface BusinessRules {
  pagination: {
    defaultPageSize: number
    maxPageSize: number
    minPageSize: number
  }
  fileUpload: {
    maxSizeBytes: number
    allowedExtensions: string[]
    maxFilesPerUpload: number
  }
  booking: {
    maxAdvanceBookingDays: number
    minAdvanceBookingHours: number
    maxBookingDurationHours: number
    allowCancellationHours: number
  }
  validation: {
    minPasswordLength: number
    maxPasswordLength: number
    phoneNumberPattern: string
    emailPattern: string
    licensePlatePattern: string
  }
  limits: {
    maxVehiclesPerCustomer: number
    maxBookingsPerDay: number
    maxPromotionsPerCustomer: number
    maxFeedbackLength: number
  }
  timeouts: {
    sessionTimeoutMinutes: number
    guestSessionTimeoutMinutes: number
    otpExpiryMinutes: number
    lockoutDurationMinutes: number
  }
}

export interface PublicSettings {
  app: {
    name: string
    version: string
    environment: string
  }
  api: {
    baseUrl: string
    version: string
    supportedVersions: string[]
  }
  endpoints: {
    auth: string
    booking: string
    services: string
    vehicles: string
    promotions: string
    feedback: string
    swagger: string
  }
  support: {
    email: string
    phone: string
    workingHours: string
  }
}

// API Response Types
interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Configuration Service
 * Handles all system configuration API calls
 */
export const ConfigurationService = {
  /**
   * Get Login Lockout Configuration
   */
  async getLoginLockoutConfig(): Promise<LoginLockoutConfig> {
    const { data } = await api.get<ApiResponse<LoginLockoutConfig>>('/configuration/login-lockout/config')
    return data.data!
  },

  /**
   * Update Login Lockout Configuration
   */
  async updateLoginLockoutConfig(request: LoginLockoutConfigRequest): Promise<void> {
    await api.put('/configuration/login-lockout/config', request)
  },

  /**
   * Get Booking Realtime Settings
   */
  async getBookingRealtime(): Promise<BookingRealtimeSettings> {
    const { data } = await api.get<ApiResponse<BookingRealtimeSettings>>('/configuration/booking-realtime')
    return data.data!
  },

  /**
   * Update Booking Realtime Settings
   */
  async updateBookingRealtime(request: UpdateBookingRealtimeRequest): Promise<void> {
    await api.put('/configuration/booking-realtime', request)
  },

  /**
   * Get PayOS Settings
   */
  async getPayOs(): Promise<PayOsSettings> {
    const { data } = await api.get<ApiResponse<PayOsSettings>>('/configuration/payos')
    return data.data!
  },

  /**
   * Update PayOS Settings
   */
  async updatePayOs(request: UpdatePayOsSettingsRequest): Promise<void> {
    await api.put('/configuration/payos', request)
  },

  /**
   * Get Guest Session Settings
   */
  async getGuestSession(): Promise<GuestSessionSettings> {
    const { data } = await api.get<ApiResponse<GuestSessionSettings>>('/configuration/guest-session')
    return data.data!
  },

  /**
   * Update Guest Session Settings
   */
  async updateGuestSession(request: UpdateGuestSessionSettingsRequest): Promise<void> {
    await api.put('/configuration/guest-session', request)
  },

  /**
   * Get Maintenance Reminder Settings
   */
  async getMaintenanceReminder(): Promise<MaintenanceReminderSettings> {
    const { data } = await api.get<ApiResponse<MaintenanceReminderSettings>>('/configuration/maintenance-reminder')
    return data.data!
  },

  /**
   * Update Maintenance Reminder Settings
   */
  async updateMaintenanceReminder(request: UpdateMaintenanceReminderSettingsRequest): Promise<void> {
    await api.put('/configuration/maintenance-reminder', request)
  },

  /**
   * Get Lockout Status for an email
   */
  async getLockoutStatus(email: string): Promise<LockoutStatus> {
    const { data } = await api.get<ApiResponse<LockoutStatus>>(`/configuration/login-lockout/status/${encodeURIComponent(email)}`)
    return data.data!
  },

  /**
   * Unlock Account
   */
  async unlockAccount(email: string): Promise<void> {
    await api.delete(`/configuration/login-lockout/unlock/${encodeURIComponent(email)}`)
  },

  /**
   * Get Features (Read-only)
   */
  async getFeatures(): Promise<Features> {
    const { data } = await api.get<ApiResponse<Features>>('/configuration/features')
    return data.data!
  },

  /**
   * Get Business Rules (Read-only)
   */
  async getRules(): Promise<BusinessRules> {
    const { data } = await api.get<ApiResponse<BusinessRules>>('/configuration/rules')
    return data.data!
  },

  /**
   * Get Public Settings (Read-only)
   */
  async getPublicSettings(): Promise<PublicSettings> {
    const { data } = await api.get<ApiResponse<PublicSettings>>('/configuration/public')
    return data.data!
  }
}


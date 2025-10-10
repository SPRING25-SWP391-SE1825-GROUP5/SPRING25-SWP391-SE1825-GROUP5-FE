/**
 * Services Index
 * Centralized export for all service modules
 * 
 * @description This file provides a single point of import for all services,
 * making it easier to import and manage service dependencies across the application.
 */

// API Configuration
export { default as api } from './api'

// Authentication Services
export { AuthService } from './authService'
export type {
  LoginRequest,
  GoogleLoginRequest,
  RegisterRequest,
  LoginResponse,
  RefreshTokenResponse,
  ResetPasswordRequest,
  ChangePasswordRequest
} from './authService'

// User Management Services  
export { UserService } from './userService'
export type {
  UpdateUserProfileRequest,
  GetUsersRequest,
  CreateUserRequest,
  UserListResponse
} from './userService'

// Booking Services
export { BookingService } from './bookingService'
export type {
  AvailabilityQuery
} from './bookingService'

// Service Management Services
export { ServiceManagementService } from './serviceManagementService'
export type {
  Service,
  ServiceStats,
  ServiceBooking,
  ServicePerformance,
  ServiceListParams,
  ServiceListResponse
} from './serviceManagementService'

// TODO: Add other services as they are created
// export { ProductService } from './productService'
// export { OrderService } from './orderService'
// export { AppointmentService } from './appointmentService'
// export { NotificationService } from './notificationService'

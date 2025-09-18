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

// TODO: Add other services as they are created
// export { ProductService } from './productService'
// export { OrderService } from './orderService'
// export { AppointmentService } from './appointmentService'
// export { NotificationService } from './notificationService'

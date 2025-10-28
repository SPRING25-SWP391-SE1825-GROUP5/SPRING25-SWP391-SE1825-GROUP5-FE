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
  CreateUserByAdminRequest,
  UserListResponse
} from './userService'

// Booking Services
export { BookingService } from './bookingService'
export type {
  BookingResponse,
  BookingDetail,
  BookingDetailResponse,
  MaintenanceChecklist,
  MaintenanceChecklistItem,
  MaintenanceChecklistSummary,
  MaintenanceChecklistStatus,
  TimeSlotAvailability,
  TechnicianAvailability,
  AvailabilityResponse
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

// Service Checklist Template Services
export { ServiceChecklistTemplateService } from './serviceChecklistTemplateService'
export type {
  ServiceChecklistTemplate,
  RecommendationRequest,
  RecommendationResponse
} from './serviceChecklistTemplateService'

// Vehicle Model Management Services
export { vehicleModelService } from './vehicleModelManagement'
export type {
  VehicleModel,
  CreateVehicleModelRequest,
  UpdateVehicleModelRequest,
  VehicleModelResponse,
  VehicleModelSearchParams
} from './vehicleModelManagement'

// Vehicle Services
export { VehicleService } from './vehicleService'
export type {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleListResponse,
  VehicleResponse,
  UpdateMileageRequest,
  NextServiceDueResponse
} from './vehicleService'

// Customer Services
export { CustomerService } from './customerService'
export type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  QuickCreateCustomerRequest,
  CustomerResponse
} from './customerService'

// Payment Services
export { PaymentService, PaymentMethod, PaymentStatus } from './paymentService'
export type {
  PaymentMethod as PaymentMethodType,
  PaymentStatus as PaymentStatusType,
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  VNPayPaymentRequest,
  VNPayPaymentResponse,
  QRPaymentRequest,
  QRPaymentResponse
} from './paymentService'

// Chat Services
export { ChatService } from './chatService'
export type {
  ChatUser,
  ChatMessage,
  ChatConversation,
  ChatState,
  ChatNotification
} from '@/types/chat'

// Part Services
export { PartService } from './partService'
export type {
  Part,
  PartAvailabilityResponse,
  PartFilters
} from './partService'

// TODO: Add other services as they are created

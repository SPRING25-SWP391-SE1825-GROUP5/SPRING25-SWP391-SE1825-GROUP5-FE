/**
 * EV Service Center Management System - Type Definitions
 * Comprehensive TypeScript interfaces for all entities
 */

// ========== ENUMS ==========
export enum UserRole {
  CUSTOMER = 'customer',
  STAFF = 'staff',
  TECHNICIAN = 'technician',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export enum ServiceStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  E_WALLET = 'e_wallet'
}

export enum ServiceType {
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  WARRANTY = 'warranty'
}

export enum PartStatus {
  AVAILABLE = 'available',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued'
}

// ========== BASE INTERFACES ==========
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
}

export interface Customer extends User {
  role: UserRole.CUSTOMER;
  vehicles: Vehicle[];
  serviceHistory: ServiceOrder[];
  preferredServiceCenter?: string;
  loyaltyPoints?: number;
}

export interface Staff extends User {
  role: UserRole.STAFF | UserRole.MANAGER | UserRole.ADMIN;
  employeeId: string;
  department: string;
  serviceCenterId: string;
  permissions: string[];
}

export interface Technician extends User {
  role: UserRole.TECHNICIAN;
  employeeId: string;
  certifications: Certification[];
  specializations: string[];
  serviceCenterId: string;
  currentWorkload: number;
  maxWorkload: number;
}

// ========== VEHICLE RELATED ==========
export interface Vehicle extends BaseEntity {
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  batteryCapacity: number;
  mileage: number;
  customerId: string;
  status: VehicleStatus;
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  warrantyExpiry?: Date;
}

// ========== SERVICE RELATED ==========
export interface ServiceOrder extends BaseEntity {
  orderNumber: string;
  customerId: string;
  vehicleId: string;
  serviceCenterId: string;
  serviceType: ServiceType;
  status: ServiceStatus;
  scheduledDate: Date;
  completedDate?: Date;
  assignedTechnicianId?: string;
  description: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  serviceItems: ServiceItem[];
  totalCost: number;
  notes?: string;
}

export interface ServiceItem extends BaseEntity {
  serviceOrderId: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  partId?: string;
  laborHours?: number;
  isCompleted: boolean;
}

export interface ChecklistTemplate extends BaseEntity {
  name: string;
  vehicleModel: string;
  serviceType: ServiceType;
  items: ChecklistItem[];
  isActive: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  requiresPhoto: boolean;
  requiresVideo: boolean;
  order: number;
}

export interface ServiceProgress extends BaseEntity {
  serviceOrderId: string;
  checklistItemId: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
  photos: string[];
  videos: string[];
}

// ========== INVENTORY RELATED ==========
export interface Part extends BaseEntity {
  partNumber: string;
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  compatibleModels: string[];
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitPrice: number;
  supplierPrice: number;
  status: PartStatus;
  location: string;
  serviceCenterId: string;
}

export interface InventoryTransaction extends BaseEntity {
  partId: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  referenceId?: string; // ServiceOrder ID or Purchase Order ID
  notes?: string;
  performedBy: string;
}

// ========== FINANCIAL RELATED ==========
export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  serviceOrderId: string;
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAt?: Date;
  notes?: string;
}

export interface Payment extends BaseEntity {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  processedAt?: Date;
  failureReason?: string;
}

// ========== SCHEDULING RELATED ==========
export interface Schedule extends BaseEntity {
  technicianId: string;
  serviceOrderId: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  technicianId?: string;
}

// ========== CERTIFICATION RELATED ==========
export interface Certification extends BaseEntity {
  name: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate: Date;
  certificateNumber: string;
  isActive: boolean;
}

// ========== SERVICE CENTER RELATED ==========
export interface ServiceCenter extends BaseEntity {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  operatingHours: OperatingHours;
  services: ServiceType[];
  capacity: number;
  isActive: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "18:00"
}

// ========== NOTIFICATION RELATED ==========
export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
}

// ========== CHAT RELATED ==========
export interface ChatMessage extends BaseEntity {
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  message: string;
  attachments: string[];
  isRead: boolean;
  readAt?: Date;
}

export interface Conversation extends BaseEntity {
  customerId: string;
  staffId: string;
  serviceOrderId?: string;
  subject: string;
  status: 'active' | 'closed';
  lastMessageAt: Date;
}

// ========== AUDIT RELATED ==========
export interface AuditLog extends BaseEntity {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

// ========== API RESPONSE TYPES ==========
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========== FORM TYPES ==========
export interface BookingForm {
  vehicleId: string;
  serviceCenterId: string;
  serviceType: ServiceType;
  preferredDate: Date;
  preferredTime: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface CustomerRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface VehicleRegistration {
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  batteryCapacity: number;
  mileage: number;
}

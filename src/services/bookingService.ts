import api from './api'

export interface CenterInfo {
  centerId: number
  centerName: string
  centerAddress: string
  phoneNumber: string
}

export interface VehicleInfo {
  vehicleId: number
  licensePlate: string
  vin: string
  modelName: string
  version: string
  currentMileage: number
}

export interface ServiceInfo {
  serviceId: number
  serviceName: string
  description: string
  basePrice: number
}

export interface TechnicianInfo {
  technicianId: number
  technicianName: string
  phoneNumber: string
  position: string
}

export interface TimeSlotInfo {
  slotId: number
  startTime: string
  endTime: string
  slotLabel: string
  workDate: string
  notes: string
}

export interface CustomerInfo {
  customerId: number
  fullName: string
  email: string
  phoneNumber: string
}

export interface Booking {
  bookingId: number
  bookingDate: string
  status: string
  centerInfo: CenterInfo
  vehicleInfo: VehicleInfo
  serviceInfo: ServiceInfo
  technicianInfo: TechnicianInfo
  timeSlotInfo: TimeSlotInfo
  customerInfo: CustomerInfo
  specialRequests: string
  appliedCreditId: number | null
  createdAt: string
  updatedAt: string
}

export interface BookingResponse {
  success: boolean
  message: string
  data: {
    bookings: Booking[]
  }
}

// Chi tiết booking
export interface BookingDetail {
  bookingId: number
  bookingCode?: string
  customerId: number
  customerName: string
  vehicleId: number
  vehicleInfo: string
  centerId: number
  centerName: string
  bookingDate: string
  technicianSlotId?: number
  slotId: number
  slotTime: string
  centerScheduleDate?: string
  centerScheduleDayOfWeek?: number
  status: string
  specialRequests: string
  technicianId?: number
  technicianName?: string
  currentMileage?: number
  licensePlate?: string
  createdAt: string
  updatedAt: string
  appliedCreditId?: number
  packageCode?: string
  packageName?: string
  packageDiscountPercent?: number
  packageDiscountAmount?: number
  originalServicePrice?: number
  totalAmount: number
  paymentType: string
  services: BookingServiceDetail[]
}

export interface BookingServiceDetail {
  serviceId: number
  serviceName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface BookingDetailResponse {
  success: boolean
  message: string
  data: BookingDetail
}

// Maintenance Checklist
export interface MaintenanceChecklistItem {
  resultId: number
  partId: number
  partName: string
  description: string
  result: string
  status: string
}

export interface MaintenanceChecklist {
  success: boolean
  checklistId: number
  status: string
  items: MaintenanceChecklistItem[]
}

export interface MaintenanceChecklistSummary {
  success: boolean
  checklistId: number
  total: number
  pass: number
  fail: number
  na: number
}

export interface MaintenanceChecklistStatus {
  success: boolean
  checklistId: number
  status: string
  totalParts: number
  pendingParts: number
  canComplete: boolean
}

export const BookingService = {
  async getBookingsByCenter(centerId: number): Promise<BookingResponse> {
    const response = await api.get(`/Booking/center/${centerId}`)
    return response.data
  },

  // Lấy chi tiết booking
  async getBookingDetail(bookingId: number): Promise<BookingDetailResponse> {
    const response = await api.get(`/Booking/${bookingId}`)
    return response.data
  },

  // Lấy maintenance checklist
  async getMaintenanceChecklist(bookingId: number): Promise<MaintenanceChecklist> {
    const response = await api.get(`/maintenance-checklist/${bookingId}`)
    return response.data
  },

  // Lấy summary checklist
  async getMaintenanceChecklistSummary(bookingId: number): Promise<MaintenanceChecklistSummary> {
    const response = await api.get(`/maintenance-checklist/${bookingId}/summary`)
      return response.data
  },

  // Lấy status checklist
  async getMaintenanceChecklistStatus(bookingId: number): Promise<MaintenanceChecklistStatus> {
    const response = await api.get(`/maintenance-checklist/${bookingId}/status`)
      return response.data
  }
}



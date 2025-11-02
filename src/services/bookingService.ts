import api from './api'

// Types used by booking UI components
export interface TimeSlotAvailability {
  slotId: number
  slotTime: string
  isAvailable: boolean
  isPast?: boolean
}

export interface TechnicianAvailability {
  id: number
  name: string
  specialization: string
  available: boolean
}

export interface AvailabilityResponse {
  timeSlots: TimeSlotAvailability[]
  technicians: TechnicianAvailability[]
}

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

// Customer Booking (simplified format from /Customer/{customerId}/bookings)
export interface CustomerBooking {
  bookingId: number
  status: string
  date: string
  slotTime: string
  slotLabel: string
  serviceName: string
  centerName: string
  vehiclePlate: string
  specialRequests: string
  createdAt: string
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

  // Lấy lịch sử booking của customer
  async getBookingHistory(customerId: number, page: number = 1, limit: number = 10): Promise<any> {
    try {
      console.log('🌐 BookingService.getBookingHistory called:', { customerId, page, limit })
      const url = `/Booking/Customer/${customerId}/booking-history`
      console.log('📡 API URL:', url)
      
      const response = await api.get(url, {
        params: { 
          page, 
          pageSize: limit,
          sortBy: 'bookingDate',
          sortOrder: 'desc'
        }
      })
      console.log('✅ BookingService API response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error fetching booking history:', error)
      throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi lấy lịch sử booking')
    }
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
  },

  // Lấy danh sách bookings của customer
  async getCustomerBookings(customerId: number): Promise<CustomerBooking[]> {
    try {
      const response = await api.get(`/Customer/${customerId}/bookings`)
      
      // Handle axios response structure: response.data is the actual data
      let data = response.data

      // If data is null or undefined, return empty array
      if (!data) {
        return []
      }

      // If data is directly an array, return it
      if (Array.isArray(data)) {
        return data
      }
      
      // Handle nested structure: { success: true, data: { bookings: [...] } }
      if (data && typeof data === 'object' && data.data) {
        // Check if data.data has bookings property
        if (data.data.bookings && Array.isArray(data.data.bookings)) {
          return data.data.bookings
        }
        // Check if data.data is directly an array
        if (Array.isArray(data.data)) {
          return data.data
        }
      }
      
      // If response is wrapped in an object with 'bookings' property at root level
      if (data && typeof data === 'object' && Array.isArray(data.bookings)) {
        return data.bookings
      }

      // If data is an object but not an array and doesn't have expected properties
      // Try to find any array property
      if (data && typeof data === 'object') {
        for (const key in data) {
          if (Array.isArray(data[key])) {
            return data[key]
          }
          // Also check nested objects
          if (data[key] && typeof data[key] === 'object' && data[key].bookings && Array.isArray(data[key].bookings)) {
            return data[key].bookings
          }
        }
      }

      // Fallback: return empty array if structure is unexpected
      return []
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      throw new Error(message || 'Lỗi lấy danh sách đặt lịch')
    }
  },

  // Hủy booking
  async cancelBooking(bookingId: number, reason?: string): Promise<{ success: boolean; data: { bookingId: number; status: string; cancelledAt?: string } }> {
    try {
      const response = await api.put(`/Booking/${bookingId}/cancel`, { Reason: reason || null })
      
      // Handle response structure
      const responseData = response.data
      
      if (responseData && responseData.success) {
        return {
          success: true,
          data: {
            bookingId: responseData.data?.bookingId || bookingId,
            status: responseData.data?.status || 'CANCELLED',
            cancelledAt: responseData.data?.cancelledAt
          }
        }
      }

      // Fallback if structure is different
      return {
        success: true,
        data: {
          bookingId,
          status: 'CANCELLED'
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      const message = err.response?.data?.message || err.message || 'Lỗi hủy đặt lịch'
      throw new Error(message)
    }
  }
}

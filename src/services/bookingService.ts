import api from './api'

// Types
export interface BookingRequest {
  customerInfo: {
    fullName: string
    phone: string
    email: string
  }
  vehicleInfo: {
    carModel: string
    mileage?: string
    licensePlate: string
  }
  serviceInfo: {
    services: string[]
  notes?: string
  }
  locationTimeInfo: {
    province: string
    ward: string
    serviceType: 'workshop' | 'mobile'
    date: string
    time: string
  }
  accountInfo?: {
    username: string
    password: string
  }
  images?: File[]
}

export interface BookingResponse {
  success: boolean
  data: {
    bookingId: string
    bookingCode: string
    status: string
    estimatedCost: number
    message: string
  }
  error?: string
}

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

// Optional params/type aliases to satisfy centralized re-exports
export interface AvailabilityParams {
  centerId: number | string
  date: string
}

export interface ReservationRequest {
  vehicleId: number | string
  centerId: number | string
  bookingDate: string
  slotId: number | string
  serviceId: number | string
  customerId: number | string
  notes?: string
  specialRequests?: string
  request?: string
}

export interface ReservationResponse {
  bookingId: string
  status: string
  message?: string
}

export interface CarModel {
  id: string
  name: string
  brand: string
  year: number
}

export interface Province {
  id: string
  name: string
  code: string
}

export interface Ward {
  id: string
  name: string
  provinceId: string
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  category: string
}

export interface TimeSlot {
  time: string
  available: boolean
}

class BookingServiceClass {
  // Create a new booking
  async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    try {
      const formData = new FormData()

      // Add booking data as JSON
      const bookingJson = {
        customerInfo: bookingData.customerInfo,
        vehicleInfo: bookingData.vehicleInfo,
        serviceInfo: bookingData.serviceInfo,
        locationTimeInfo: bookingData.locationTimeInfo,
        accountInfo: bookingData.accountInfo
      }

      formData.append('bookingData', JSON.stringify(bookingJson))

      // Add images if any
      if (bookingData.images && bookingData.images.length > 0) {
        bookingData.images.forEach((image, index) => {
          formData.append(`images`, image)
        })
      }

      const response = await api.post('/bookings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return response.data
    } catch (error: any) {
      console.error('Error creating booking:', error)
      throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo booking')
    }
  }

  // Get available car models
  async getCarModels(): Promise<CarModel[]> {
    try {
      const response = await api.get('/vehicles/models')
      return response.data.data || []
    } catch (error: any) {
      console.error('Error fetching car models:', error)
      return []
    }
  }

  // Get provinces
  async getProvinces(): Promise<Province[]> {
    try {
      const response = await api.get('/locations/provinces')
      return response.data.data || []
    } catch (error: any) {
      console.error('Error fetching provinces:', error)
      return []
    }
  }

  // Get wards by province
  async getWardsByProvince(provinceId: string): Promise<Ward[]> {
    try {
      const response = await api.get(`/locations/provinces/${provinceId}/wards`)
      return response.data.data || []
    } catch (error: any) {
      console.error('Error fetching wards:', error)
      return []
    }
  }

  // Get available services
  async getServices(): Promise<Service[]> {
    try {
      const response = await api.get('/services')
      return response.data.data || []
    } catch (error: any) {
      console.error('Error fetching services:', error)
      return []
    }
  }

  // Get available time slots for a specific date and location
  async getAvailableTimeSlots(date: string, locationId: string): Promise<TimeSlot[]> {
    try {
      const response = await api.get('/bookings/time-slots', {
        params: { date, locationId }
      })
      return response.data.data || []
    } catch (error: any) {
      console.error('Error fetching time slots:', error)
      return []
    }
  }

  // Check if username is available
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const response = await api.get('/auth/check-username', {
        params: { username }
      })
      return response.data.available
    } catch (error: any) {
      console.error('Error checking username:', error)
      return false
    }
  }

  // Get booking by ID
  async getBooking(bookingId: string): Promise<BookingResponse> {
    try {
      const response = await api.get(`/bookings/${bookingId}`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching booking:', error)
      throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi lấy thông tin booking')
    }
  }

  // Cancel booking
  async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`, {
        reason
      })
      return response.data.success
    } catch (error: any) {
      console.error('Error canceling booking:', error)
      throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy booking')
    }
  }

  // Reschedule booking
  async rescheduleBooking(bookingId: string, newDate: string, newTime: string): Promise<boolean> {
    try {
      const response = await api.put(`/bookings/${bookingId}/reschedule`, {
        newDate,
        newTime
      })
      return response.data.success
    } catch (error: any) {
      console.error('Error rescheduling booking:', error)
      throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi lịch booking')
    }
  }

  // Get booking history for customer
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
  }

  // Update booking status
  async updateBookingStatus(bookingId: number, status: string): Promise<any> {
    try {
      console.log('🌐 BookingService.updateBookingStatus called:', { bookingId, status })
      const url = `/api/Booking/${bookingId}/status`
      console.log('📡 API URL:', url)
      
      const response = await api.put(url, { status })
      console.log('✅ BookingService update status response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error updating booking status:', error)
      throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái booking')
    }
  }
}

// Backward-compatible default export and named singleton expected by callers
export const BookingService = new BookingServiceClass()
export const bookingService = BookingService
export default BookingService
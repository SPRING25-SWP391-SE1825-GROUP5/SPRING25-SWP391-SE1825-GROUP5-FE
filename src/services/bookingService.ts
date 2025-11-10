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
  technicianPhone?: string
  technicianEmail?: string
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

// Admin booking interfaces
export interface AdminBookingSummary {
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

export interface GetBookingsByCenterParams {
  centerId: number
  page?: number
  pageSize?: number
  status?: string | null
  fromDate?: string | null
  toDate?: string | null
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface GetAllBookingsForAdminParams {
  page?: number
  pageSize?: number
  status?: string | null
  centerId?: number | null
  customerId?: number | null
  fromDate?: string | null
  toDate?: string | null
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface GetBookingsByCenterResponse {
  success: boolean
  message: string
  data: {
    bookings: AdminBookingSummary[]
    pagination: {
      currentPage: number
      pageSize: number
      totalItems: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    filters: {
      status?: string | null
      fromDate?: string | null
      toDate?: string | null
      sortBy?: string
      sortOrder?: string
    }
  }
}

export interface UpdateBookingStatusRequest {
  status: string
}

export interface UpdateBookingStatusResponse {
  success: boolean
  message: string
  data: {
    bookingId: number
    status: string
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
  parts?: BookingPart[]
  checklist?: BookingChecklistItem[]
  history?: BookingHistoryItem[]
}

export interface BookingServiceDetail {
  serviceId: number
  serviceName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface BookingPart {
  partId?: number
  partName?: string
  name?: string
  quantity?: number
  price?: number
}

export interface BookingChecklistItem {
  completed?: boolean
  taskName?: string
  name?: string
}

export interface BookingHistoryItem {
  timestamp?: string
  action?: string
  status?: string
  note?: string
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
  actualCost?: number
  estimatedCost?: number
}

export const BookingService = {
  // Legacy method - kept for backward compatibility
  async getBookingsByCenter(centerId: number): Promise<BookingResponse> {
    const response = await api.get(`/Booking/center/${centerId}`)


    return response.data
  },

  // Admin method with full params support
  async getBookingsByCenterAdmin(params: GetBookingsByCenterParams): Promise<GetBookingsByCenterResponse> {
    const { centerId, page = 1, pageSize = 10, status, fromDate, toDate, sortBy = 'createdAt', sortOrder = 'desc' } = params

    const queryParams = new URLSearchParams()
    queryParams.append('page', page.toString())
    queryParams.append('pageSize', pageSize.toString())
    queryParams.append('sortBy', sortBy)
    queryParams.append('sortOrder', sortOrder)
    if (status) queryParams.append('status', status)
    if (fromDate) queryParams.append('fromDate', fromDate)
    if (toDate) queryParams.append('toDate', toDate)

    const response = await api.get(`/Booking/center/${centerId}?${queryParams.toString()}`)

    // Map response structure
    const responseData = response.data
    if (responseData?.success && responseData?.data) {
      // Map Bookings to bookings (camelCase)
      const data = responseData.data
      return {
        success: true,
        message: responseData.message || 'Lấy danh sách booking thành công',
        data: {
          bookings: data.Bookings || data.bookings || [],
          pagination: {
            currentPage: data.Pagination?.CurrentPage || data.pagination?.currentPage || page,
            pageSize: data.Pagination?.PageSize || data.pagination?.pageSize || pageSize,
            totalItems: data.Pagination?.TotalItems || data.pagination?.totalItems || 0,
            totalPages: data.Pagination?.TotalPages || data.pagination?.totalPages || 1,
            hasNextPage: data.Pagination?.HasNextPage ?? data.pagination?.hasNextPage ?? false,
            hasPreviousPage: data.Pagination?.HasPreviousPage ?? data.pagination?.hasPreviousPage ?? false
          },
          filters: {
            status: data.Filters?.Status || data.filters?.status || status || null,
            fromDate: data.Filters?.FromDate || data.filters?.fromDate || fromDate || null,
            toDate: data.Filters?.ToDate || data.filters?.toDate || toDate || null,
            sortBy: data.Filters?.SortBy || data.filters?.sortBy || sortBy,
            sortOrder: data.Filters?.SortOrder || data.filters?.sortOrder || sortOrder
          }
        }
      }
    }

    return responseData
  },

  // Get all bookings for admin (without requiring centerId)
  async getAllBookingsForAdmin(params: GetAllBookingsForAdminParams): Promise<GetBookingsByCenterResponse> {
    const { page = 1, pageSize = 10, status, centerId, customerId, fromDate, toDate, sortBy = 'createdAt', sortOrder = 'desc' } = params

    const queryParams = new URLSearchParams()
    queryParams.append('page', page.toString())
    queryParams.append('pageSize', pageSize.toString())
    queryParams.append('sortBy', sortBy)
    queryParams.append('sortOrder', sortOrder)
    if (status) queryParams.append('status', status)
    if (centerId) queryParams.append('centerId', centerId.toString())
    if (customerId) queryParams.append('customerId', customerId.toString())
    if (fromDate) queryParams.append('fromDate', fromDate)
    if (toDate) queryParams.append('toDate', toDate)

    const response = await api.get(`/Booking/admin/all?${queryParams.toString()}`)

    // Map response structure
    const responseData = response.data
    if (responseData?.success && responseData?.data) {
      // Map Bookings to bookings (camelCase)
      const data = responseData.data
      return {
        success: true,
        message: responseData.message || 'Lấy danh sách booking thành công',
        data: {
          bookings: data.Bookings || data.bookings || [],
          pagination: {
            currentPage: data.Pagination?.CurrentPage || data.pagination?.currentPage || page,
            pageSize: data.Pagination?.PageSize || data.pagination?.pageSize || pageSize,
            totalItems: data.Pagination?.TotalItems || data.pagination?.totalItems || 0,
            totalPages: data.Pagination?.TotalPages || data.pagination?.totalPages || 1,
            hasNextPage: data.Pagination?.HasNextPage ?? data.pagination?.hasNextPage ?? false,
            hasPreviousPage: data.Pagination?.HasPreviousPage ?? data.pagination?.hasPreviousPage ?? false
          },
          filters: {
            status: data.Filters?.Status || data.filters?.status || status || null,
            fromDate: data.Filters?.FromDate || data.filters?.fromDate || fromDate || null,
            toDate: data.Filters?.ToDate || data.filters?.toDate || toDate || null,
            sortBy: data.Filters?.SortBy || data.filters?.sortBy || sortBy,
            sortOrder: data.Filters?.SortOrder || data.filters?.sortOrder || sortOrder
          }
        }
      }
    }

    return responseData
  },

  // Update booking status
  async updateBookingStatus(bookingId: number, status: string): Promise<UpdateBookingStatusResponse> {
    const response = await api.put(`/Booking/${bookingId}/status`, { Status: status })
    return response.data
  },

  // QR Code Check-in
  async checkInBooking(bookingId: number): Promise<{ success: boolean; message?: string; data?: { bookingId: number; status: string; checkedInAt: string } }> {
    const response = await api.post(`/Booking/${bookingId}/check-in`)
    return response.data
  },

  // Lấy chi tiết booking
  async getBookingDetail(bookingId: number): Promise<BookingDetailResponse> {
    const response = await api.get(`/Booking/${bookingId}`)
    return response.data
  },

  // Lấy danh sách phụ tùng của booking
  async getBookingParts(bookingId: number): Promise<{
    success: boolean
    message?: string
    data?: {
      items: Array<{
        workOrderPartId: number
        partId: number
        partName: string
        quantityUsed: number
        status: string
      }>
      totals: {
        approved: number
      }
    }
  }> {
    try {
      const { data } = await api.get(`/Booking/${bookingId}/parts`)
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể tải danh sách phụ tùng'
      }
    }
  },

  // Khách hàng đồng ý phụ tùng
  // API: PUT /api/Booking/{bookingId}/parts/{workOrderPartId}/customer-approve
  // Lưu ý: Truyền workOrderPartId (KHÔNG phải partId), Method là PUT
  async approveBookingPart(bookingId: number, workOrderPartId: number): Promise<{
    success: boolean
    message?: string
    data?: any
  }> {
    try {
      const url = `/Booking/${bookingId}/parts/${workOrderPartId}/customer-approve`

      // Kiểm tra token trước khi gọi API
      let token: string | null = null
      try {
        if (typeof localStorage !== 'undefined') {
          token = localStorage.getItem('authToken') || localStorage.getItem('token')
        }
      } catch (e) {
        console.warn('Could not check token from localStorage:', e)
      }

      console.log('📤 Calling approveBookingPart API:', {
        url,
        fullUrl: `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001/api'}${url}`,
        method: 'PUT',
        bookingId,
        workOrderPartId,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN'
      })

      const { data } = await api.put(url)

      console.log('✅ approveBookingPart response:', data)

      return data
    } catch (error: any) {
      console.error('❌ approveBookingPart error:', {
        error,
        response: error?.response,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
        config: {
          url: error?.config?.url,
          baseURL: error?.config?.baseURL,
          method: error?.config?.method,
          headers: error?.config?.headers ? {
            ...error.config.headers,
            Authorization: error.config.headers.Authorization ? 'Bearer ***' : 'MISSING'
          } : 'NO HEADERS'
        }
      })

      // Kiểm tra lỗi authentication
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.error('🔒 Authentication error - Token may be missing or invalid')
        return {
          success: false,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        }
      }

      // Log chi tiết error message từ backend
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error
      if (backendMessage) {
        console.error('📋 Backend error message:', backendMessage)
      }

      return {
        success: false,
        message: backendMessage || error?.message || 'Không thể xác nhận phụ tùng'
      }
    }
  },

  // Lấy lịch sử booking của customer
  async getBookingHistory(customerId: number, page: number = 1, limit: number = 10): Promise<any> {
    try {
      const url = `/Booking/Customer/${customerId}/booking-history`

      const response = await api.get(url, {
        params: {
          page,
          pageSize: limit,
          sortBy: 'bookingDate',
          sortOrder: 'desc'
        }
      })
      return response.data
    } catch (error: any) {

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

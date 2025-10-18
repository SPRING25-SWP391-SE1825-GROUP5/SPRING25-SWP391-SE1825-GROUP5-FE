import api from './api'

// Booking Types
export type Booking = {
  bookingId: number
  customerId: number
  vehicleId: number
  centerId: number
  bookingDate: string
  timeSlotId: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  totalPrice: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CreateBookingRequest = {
  vehicleId: number
  centerId: number
  bookingDate: string
  timeSlotId: number
  serviceIds: number[]
  notes?: string
}

export type BookingListParams = {
  pageNumber?: number
  pageSize?: number
  status?: string
  customerId?: number
}

export type BookingListResponse = {
  bookings: Booking[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// Availability Types
export type AvailabilityParams = {
  centerId: number
  date: string // YYYY-MM-DD format
  serviceIds?: number[]
}

export type AvailabilityResponse = {
  centerId: number
  centerName: string
  date: string
  timeSlots: TimeSlotAvailability[]
}

export type TimeSlotAvailability = {
  slotId: number
  slotTime: string
  slotLabel: string
  isAvailable: boolean
  availableTechnicians: TechnicianAvailability[]
}

export type TechnicianAvailability = {
  technicianId: number
  technicianName: string
  isAvailable: boolean
  status: 'AVAILABLE' | 'BUSY' | 'RESERVED'
  reservedBy?: string
  reservationExpiry?: string
}

export type ReservationRequest = {
  technicianId: number
  timeSlotId: number
  centerId: number
  date: string
}

export type ReservationResponse = {
  reservationId: string
  technicianId: number
  expiryTime: string
  status: 'Reserved' | 'Expired' | 'Converted'
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export const BookingService = {
  // Get booking availability for a specific center and date
  async getAvailability(params: AvailabilityParams): Promise<AvailabilityResponse> {
    const { centerId, date, serviceIds } = params

    const queryParams: any = {
      centerId,
      date
    }

    if (serviceIds && serviceIds.length > 0) {
      queryParams.serviceIds = serviceIds.join(',')
    }

    const { data } = await api.get('/booking/availability', { params: queryParams })
    console.log('getAvailability response:', data)

    if (data.success && data.data) {
      return data.data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Get all bookings with pagination and filters
  async getBookings(params: BookingListParams = {}): Promise<BookingListResponse> {
    const { data } = await api.get('/booking', { params })
    console.log('getBookings response:', data)

    if (data.success && data.data) {
      return data.data
    } else if (data.bookings) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Get booking by ID
  async getBookingById(id: number): Promise<Booking> {
    const { data } = await api.get(`/booking/${id}`)
    console.log('getBookingById response:', data)

    if (data.success && data.data) {
      return data.data
    } else if (data.bookingId) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Create new booking
  async createBooking(booking: CreateBookingRequest): Promise<Booking> {
    const { data } = await api.post('/booking', booking)
    console.log('createBooking response:', data)

    if (data.success && data.data) {
      return data.data
    } else if (data.bookingId) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Update booking status
  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    const { data } = await api.put(`/booking/${id}/status`, { status })
    console.log('updateBookingStatus response:', data)

    if (data.success && data.data) {
      return data.data
    } else if (data.bookingId) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Cancel booking
  async cancelBooking(id: number): Promise<Booking> {
    const { data } = await api.delete(`/booking/${id}`)
    console.log('cancelBooking response:', data)

    if (data.success && data.data) {
      return data.data
    } else if (data.bookingId) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Reserve technician
  async reserveTechnician(reservation: ReservationRequest): Promise<ReservationResponse> {
    const { data } = await api.post('/booking/reserve-technician', reservation)
    console.log('reserveTechnician response:', data)

    if (data.success && data.data) {
      return data.data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Release technician reservation
  async releaseTechnician(reservationId: string): Promise<void> {
    const { data } = await api.delete(`/booking/reserve-technician/${reservationId}`)
    console.log('releaseTechnician response:', data)
  },

  // Check reservation status
  async checkReservationStatus(reservationId: string): Promise<ReservationResponse> {
    const { data } = await api.get(`/booking/reserve-technician/${reservationId}`)
    console.log('checkReservationStatus response:', data)

    if (data.success && data.data) {
      return data.data
    } else {
      throw new Error('Invalid response format from server')
    }
  }
}
import api from './api'

export interface BookingStatus {
    technicianSlotId: number
    slotId: number
    technicianId: number
    workDate: string
    isAvailable: boolean
    bookingId: number | null
    bookingStatus?: string // 'active', 'cancelled', 'completed', etc.
}

export interface BookingStatusResponse {
    success: boolean
    data: BookingStatus[]
    message?: string
}

/**
 * Service to get accurate booking status from database
 * This should only consider ACTIVE bookings, not cancelled ones
 */
export const BookingStatusService = {
    /**
     * Get booking status for a specific technician and date
     * Only returns ACTIVE bookings, excludes cancelled/completed ones
     */
    async getTechnicianBookingStatus(technicianId: number, date: string): Promise<BookingStatusResponse> {
        try {
            // Try to get from a dedicated endpoint that only returns active bookings
            const { data } = await api.get(`/booking/status/technician/${technicianId}/${date}`)
            return data
        } catch (error) {
            console.warn('Booking status endpoint not available, using fallback:', error)

            // Fallback: Get all time slots and mark as available
            // This ensures we don't show false "booked" status
            const { data: timeSlotsResponse } = await api.get('/TimeSlot')
            const timeSlots = (timeSlotsResponse.data || []).map((slot: any) => ({
                technicianSlotId: slot.slotId,
                slotId: slot.slotId,
                technicianId: technicianId,
                workDate: date,
                isAvailable: true,
                bookingId: null,
                bookingStatus: 'available'
            }))

            return {
                success: true,
                data: timeSlots,
                message: 'Using fallback data - all slots marked as available'
            }
        }
    },

    /**
     * Get booking status for a specific center and date
     * Only returns ACTIVE bookings, excludes cancelled/completed ones
     */
    async getCenterBookingStatus(centerId: number, date: string): Promise<BookingStatusResponse> {
        try {
            // Try to get from a dedicated endpoint that only returns active bookings
            const { data } = await api.get(`/booking/status/center/${centerId}/${date}`)
            return data
        } catch (error) {
            console.warn('Center booking status endpoint not available, using fallback:', error)

            // Fallback: Get all time slots and mark as available
            const { data: timeSlotsResponse } = await api.get('/TimeSlot')
            const timeSlots = (timeSlotsResponse.data || []).map((slot: any) => ({
                technicianSlotId: slot.slotId,
                slotId: slot.slotId,
                technicianId: 0, // Unknown technician
                workDate: date,
                isAvailable: true,
                bookingId: null,
                bookingStatus: 'available'
            }))

            return {
                success: true,
                data: timeSlots,
                message: 'Using fallback data - all slots marked as available'
            }
        }
    }
}

export default BookingStatusService

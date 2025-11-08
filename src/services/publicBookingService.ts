import api from './api'
import { BookingStatusService } from './bookingStatusService'

export interface PublicTimeSlot {
    slotId: number
    slotTime: string
    slotLabel: string
    isAvailable: boolean
    isBooked?: boolean
}

export interface PublicAvailabilityResponse {
    success: boolean
    data: {
        timeSlots: PublicTimeSlot[]
        date: string
        centerId: number
    }
}

/**
 * Public booking service for unauthenticated users
 * Provides basic availability information without requiring login
 */
export const PublicBookingService = {
    /**
     * Get available time slots for a specific center and date
     * This endpoint should be public and not require authentication
     */
    async getAvailableTimeSlots(centerId: number, date: string): Promise<PublicAvailabilityResponse> {
        try {
            // Try to get from public endpoint first
            const { data } = await api.get(`/public/availability/${centerId}/${date}`)
            return data
        } catch (error) {

            try {
                // Try to get accurate booking status from database
                const bookingStatusResponse = await BookingStatusService.getCenterBookingStatus(centerId, date)

                if (bookingStatusResponse.success && bookingStatusResponse.data) {
                    // Get time slot details
                    const { data: timeSlotsResponse } = await api.get('/TimeSlot')
                    const slotMap = new Map()
                    timeSlotsResponse.data.forEach((slot: any) => {
                        slotMap.set(slot.slotId, slot)
                    })

                    // Map booking status to time slots - chỉ lấy timeslot available
                    const timeSlots = bookingStatusResponse.data
                        .filter((status: any) => status.isAvailable && !status.bookingId) // Chỉ lấy timeslot available
                        .map((status: any) => {
                            const slotInfo = slotMap.get(status.slotId)
                            return {
                                slotId: status.slotId,
                                slotTime: slotInfo?.slotTime || '',
                                slotLabel: slotInfo?.slotLabel || `Slot ${status.slotId}`,
                                isAvailable: true, // Đã filter ở trên nên luôn true
                                isBooked: false // Đã filter ở trên nên luôn false
                            }
                        })

                    return {
                        success: true,
                        data: {
                            timeSlots,
                            date,
                            centerId
                        }
                    }
                }
            } catch (bookingError) {

            }

            // Final fallback: Get basic time slots and mark all as available
            const { data: timeSlotsResponse } = await api.get('/TimeSlot')
            const timeSlots = (timeSlotsResponse.data || []).map((slot: any) => ({
                slotId: slot.slotId,
                slotTime: slot.slotTime,
                slotLabel: slot.slotLabel,
                isAvailable: true, // Mark all as available since we can't check booking status
                isBooked: false // Mark all as not booked since we can't check booking status
            }))

            return {
                success: true,
                data: {
                    timeSlots,
                    date,
                    centerId
                }
            }
        }
    },

    /**
     * Get all time slots (for display purposes)
     */
    async getAllTimeSlots(): Promise<PublicTimeSlot[]> {
        try {
            const { data } = await api.get('/TimeSlot')
            return (data.data || []).map((slot: any) => ({
                slotId: slot.slotId,
                slotTime: slot.slotTime,
                slotLabel: slot.slotLabel,
                isAvailable: true,
                isBooked: false
            }))
        } catch (error) {

            return []
        }
    }
}

export default PublicBookingService

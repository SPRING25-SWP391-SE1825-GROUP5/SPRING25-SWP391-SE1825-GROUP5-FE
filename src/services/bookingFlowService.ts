import api from './api'
import { TechnicianScheduleItem, TechnicianTimeSlotService } from './technicianTimeSlotService'
import { TechnicianService, TimeSlotService, TimeSlot } from './technicianService'

export type CenterAvailabilityItem = {
    technicianSlotId: number
    technicianId: number
    slotLabel: string
    slotTime: string
    isAvailable: boolean
}

export type CenterAvailabilityResponse = {
    technicianSlots: CenterAvailabilityItem[]
}

// Cache for time slots to avoid repeated API calls
let timeSlotsCache: TimeSlot[] | null = null

async function getTimeSlots(): Promise<TimeSlot[]> {
    if (timeSlotsCache) return timeSlotsCache

    try {
        timeSlotsCache = await TimeSlotService.list(true) // Get active time slots only
        return timeSlotsCache
    } catch (error) {

        return []
    }
}

function formatSlotTime(slotTime: string): string {
    // Convert "HH:mm:ss" to "HH:mm" format
    if (slotTime.includes(':')) {
        const parts = slotTime.split(':')
        return `${parts[0]}:${parts[1]}`
    }
    return slotTime
}

export async function getCenterAvailability(centerId: number, date: string, serviceId?: number): Promise<CenterAvailabilityResponse> {
    // DEPRECATED: This function is no longer used in the new flow
    // The new flow uses: Center → Technician → Date → TimeSlot
    // Use the correct API: /api/TechnicianTimeSlot/technician/{technicianId}/center/{centerId}

    // Return empty response to avoid breaking existing code
    return { technicianSlots: [] }
}

// Slot hold APIs
export async function holdSlot(payload: { centerId: number; technicianSlotId: number; technicianId?: number; date?: string }) {
    // Use the correct backend endpoint
    const { data } = await api.post('/booking/reserve-slot', {}, {
        params: {
            centerId: payload.centerId,
            slotId: payload.technicianSlotId,
            technicianId: payload.technicianId || 0, // Use provided technicianId or default to 0
            date: payload.date || new Date().toISOString().split('T')[0] // Use provided date or today
        }
    })

    // Backend doesn't return holdId, so we create one from the data
    const holdId = `${payload.centerId}-${payload.technicianSlotId}-${payload.technicianId || 0}-${payload.date || new Date().toISOString().split('T')[0]}`

    return {
        holdId,
        expiresAt: data.data?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
    }
}

// Note: Backend doesn't have extend hold endpoint, so this is disabled
// export async function extendHold(holdId: string) {
//     const { data } = await api.post(`/booking/hold/${encodeURIComponent(holdId)}/extend`)
//     return data as { holdId: string; expiresAt: string }
// }

export async function releaseHold(holdId: string, centerId: number, technicianId: number, slotId: number, date: string) {
    await api.post('/booking/release-slot', {}, {
        params: {
            centerId,
            technicianId,
            slotId,
            date
        }
    })
}

// Create booking
export type CreateBookingRequest = {
    customerId: number
    vehicleId: number
    centerId: number
    bookingDate: string // YYYY-MM-DD
    technicianSlotId: number
    technicianId?: number // Optional - if not provided, system will auto-assign
    specialRequests?: string
    serviceId?: number
    packageCode?: string
    // Thêm currentMileage và licensePlate
    currentMileage?: number
    licensePlate?: string
}

export type CreateBookingResponse = {
    success: boolean
    message: string
    data: {
        bookingId: number
        pricing: {
            originalServicePrice: number
            discount: number
            totalAmount: number
        }
    }
}

export async function createBooking(payload: CreateBookingRequest): Promise<CreateBookingResponse> {
    const { data } = await api.post('/booking', payload)
    return data as CreateBookingResponse
}

// Auto-assign technician
export async function autoAssignTechnician(bookingId: number): Promise<{ success: boolean; message: string; technicianId?: number }> {
    const { data } = await api.post(`/Booking/${bookingId}/auto-assign-technician`)
    return data as { success: boolean; message: string; technicianId?: number }
}

// Payment link (PayOS)
export async function createBookingPaymentLink(bookingId: number): Promise<{ checkoutUrl: string; successUrl?: string; cancelUrl?: string }> {
    const { data } = await api.post(`/payment/booking/${bookingId}/link`)
    return data as { checkoutUrl: string; successUrl?: string; cancelUrl?: string }
}



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
        console.error('Failed to fetch time slots:', error)
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
    // Get time slots for proper time display
    const timeSlots = await getTimeSlots()
    const slotMap = new Map<number, { slotTime: string; slotLabel: string }>()

    timeSlots.forEach(slot => {
        slotMap.set(slot.slotId, {
            slotTime: formatSlotTime(slot.slotTime || ''),
            slotLabel: slot.slotLabel || formatSlotTime(slot.slotTime || '')
        })
    })

    // Try to use customer-friendly endpoint first (requires serviceId)
    if (serviceId) {
        try {
            const availability = await TechnicianService.getCenterTechniciansAvailability(centerId, date, { serviceId })

            // Map the response to our expected format
            if (availability?.data?.technicians) {
                const technicianSlots: CenterAvailabilityItem[] = []
                const technicians = availability.data.technicians

                // Convert technicians dict to slots array
                Object.entries(technicians).forEach(([technicianId, slotIds]) => {
                    (slotIds as number[]).forEach(slotId => {
                        const slotInfo = slotMap.get(slotId) || { slotTime: `Slot ${slotId}`, slotLabel: `Slot ${slotId}` }
                        technicianSlots.push({
                            technicianSlotId: slotId, // Use slotId as technicianSlotId
                            technicianId: parseInt(technicianId),
                            slotLabel: slotInfo.slotLabel,
                            slotTime: slotInfo.slotTime,
                            isAvailable: true, // All slots from this endpoint are available
                        })
                    })
                })

                return { technicianSlots }
            }
        } catch (error) {
            console.warn('Failed to get availability from TechnicianService, falling back to schedule API:', error)
        }
    }

    // Fallback to schedule API (requires StaffOrAdmin permission)
    try {
        const schedule: TechnicianScheduleItem[] = await TechnicianTimeSlotService.getCenterSchedule(centerId, date, date)
        const technicianSlots: CenterAvailabilityItem[] = (schedule || []).map((s) => {
            const slotInfo = slotMap.get(s.slotId) || { slotTime: s.slotLabel || `Slot ${s.slotId}`, slotLabel: s.slotLabel || `Slot ${s.slotId}` }
            return {
                technicianSlotId: s.technicianSlotId,
                technicianId: 0, // backend schedule may not include technicianId; if needed, extend API later
                slotLabel: slotInfo.slotLabel,
                slotTime: slotInfo.slotTime,
                isAvailable: !!s.isAvailable && !s.hasBooking,
            }
        })
        return { technicianSlots }
    } catch (error) {
        console.error('Failed to get center availability:', error)
        return { technicianSlots: [] }
    }
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
    technicianId: number
    specialRequests?: string
    serviceId?: number
    packageCode?: string
}

export type CreateBookingResponse = {
    bookingId: number
    pricing: {
        originalServicePrice: number
        discount: number
        totalAmount: number
    }
}

export async function createBooking(payload: CreateBookingRequest): Promise<CreateBookingResponse> {
    const { data } = await api.post('/booking', payload)
    return data as CreateBookingResponse
}

// Payment link (PayOS)
export async function createBookingPaymentLink(bookingId: number): Promise<{ checkoutUrl: string; successUrl?: string; cancelUrl?: string }> {
    const { data } = await api.post(`/payment/booking/${bookingId}/link`)
    return data as { checkoutUrl: string; successUrl?: string; cancelUrl?: string }
}



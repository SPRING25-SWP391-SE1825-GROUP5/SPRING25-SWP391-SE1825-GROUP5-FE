import api from './api'
import { TechnicianScheduleItem, TechnicianTimeSlotService } from './technicianTimeSlotService'

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

export async function getCenterAvailability(centerId: number, date: string): Promise<CenterAvailabilityResponse> {
    // Use existing center schedule API and map to availability format for a single day
    const schedule: TechnicianScheduleItem[] = await TechnicianTimeSlotService.getCenterSchedule(centerId, date, date)
    const technicianSlots: CenterAvailabilityItem[] = (schedule || []).map((s) => ({
        technicianSlotId: s.technicianSlotId,
        technicianId: 0, // backend schedule may not include technicianId; if needed, extend API later
        slotLabel: s.slotLabel || `Slot ${s.slotId}`,
        slotTime: s.slotLabel || `Slot ${s.slotId}`,
        isAvailable: !!s.isAvailable && !s.hasBooking,
    }))
    return { technicianSlots }
}

// Slot hold APIs
export async function holdSlot(payload: { centerId: number; technicianSlotId: number }) {
    const { data } = await api.post('/booking/hold', payload)
    return data as { holdId: string; expiresAt: string }
}

export async function extendHold(holdId: string) {
    const { data } = await api.post(`/booking/hold/${encodeURIComponent(holdId)}/extend`)
    return data as { holdId: string; expiresAt: string }
}

export async function releaseHold(holdId: string) {
    await api.delete(`/booking/hold/${encodeURIComponent(holdId)}`)
}

// Create booking
export type CreateBookingRequest = {
    customerId: number
    vehicleId: number
    centerId: number
    bookingDate: string // YYYY-MM-DD
    technicianSlotId: number
    specialRequests?: string
    serviceId?: number
    packageCode?: string
    holdId: string
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
export async function createBookingPaymentLink(bookingId: number): Promise<{ checkoutUrl: string }> {
    const { data } = await api.post(`/payment/booking/${bookingId}/link`)
    return data as { checkoutUrl: string }
}



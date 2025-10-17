import api from './api'

export type CreateTechnicianTimeSlotRequest = {
    technicianId: number
    slotId: number
    workDate: string // ISO date string
    isAvailable: boolean
    notes?: string | null
}

export type UpdateTechnicianTimeSlotRequest = {
    isAvailable: boolean
    notes?: string | null
}

export type CreateWeeklyTechnicianTimeSlotRequest = {
    technicianId: number
    startDate: string // ISO
    endDate: string // ISO
    // Optional to support BE that auto-generates slots for full day
    slotId?: number
    isAvailable?: boolean
    notes?: string | null
}

export type TechnicianTimeSlot = {
    id: number
    technicianId: number
    slotId: number
    workDate: string
    isAvailable: boolean
    notes?: string | null
}

export type TechnicianScheduleItem = {
    technicianSlotId: number
    workDate: string
    slotId: number
    slotLabel?: string
    isAvailable: boolean
    hasBooking?: boolean
    notes?: string | null
}

export const TechnicianTimeSlotService = {
    async create(payload: CreateTechnicianTimeSlotRequest) {
        const { data } = await api.post('/TechnicianTimeSlot', payload)
        return data
    },

    async createWeekly(payload: CreateWeeklyTechnicianTimeSlotRequest) {
        const { data } = await api.post('/TechnicianTimeSlot/weekly', payload)
        return data
    },

    async createAllTechnicians(payload: { centerId: number; slotId: number; workDate: string; isAvailable: boolean; notes?: string | null }) {
        const { data } = await api.post('/TechnicianTimeSlot/all-technicians', payload)
        return data
    },

    async createAllTechniciansWeekly(payload: { centerId: number; slotId: number; startDate: string; endDate: string; isAvailable: boolean; notes?: string | null }) {
        const { data } = await api.post('/TechnicianTimeSlot/all-technicians-weekly', payload)
        return data
    },

    async update(id: number, payload: UpdateTechnicianTimeSlotRequest) {
        const { data } = await api.put(`/TechnicianTimeSlot/${id}`, payload)
        return data
    },

    async remove(id: number) {
        const { data } = await api.delete(`/TechnicianTimeSlot/${id}`)
        return data
    },

    async getById(id: number) {
        const { data } = await api.get(`/TechnicianTimeSlot/${id}`)
        return data
    },

    async getScheduleByTechnician(technicianId: number, startDate: string, endDate: string): Promise<TechnicianScheduleItem[]> {
        const { data } = await api.get(`/TechnicianTimeSlot/technician/${technicianId}/schedule`, { params: { startDate, endDate } })
        return data
    },

    async getCenterSchedule(centerId: number, startDate: string, endDate: string): Promise<TechnicianScheduleItem[]> {
        const { data } = await api.get(`/TechnicianTimeSlot/center/${centerId}/schedule`, { params: { startDate, endDate } })
        return data
    },
}



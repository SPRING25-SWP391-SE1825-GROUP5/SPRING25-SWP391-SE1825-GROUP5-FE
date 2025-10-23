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

// API Response Types
export interface TechnicianTimeSlotResponse {
    success: boolean
    message: string
    data: TechnicianTimeSlotData[]
}

export interface TechnicianTimeSlotData {
    technicianSlotId: number
    technicianId: number
    technicianName: string
    slotId: number
    slotTime: string
    workDate: string
    isAvailable: boolean
    notes: string | null
    createdAt: string
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

    async createFullWeekAllSlots(technicianId: number, payload: CreateWeeklyTechnicianTimeSlotRequest) {
        const { data } = await api.post(`/TechnicianTimeSlot/technician/${technicianId}/full-week-all-slots`, payload)
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

    // Get technician schedule by technician and center
    async getTechnicianScheduleByCenter(technicianId: number, centerId: number): Promise<TechnicianTimeSlotResponse> {
        try {
            console.log('🌐 Making API request:', {
                url: `/TechnicianTimeSlot/technician/${technicianId}/center/${centerId}`,
                baseURL: api.defaults.baseURL,
                fullURL: `${api.defaults.baseURL}/TechnicianTimeSlot/technician/${technicianId}/center/${centerId}`,
                headers: api.defaults.headers
            })
            const { data } = await api.get<TechnicianTimeSlotResponse>(`/TechnicianTimeSlot/technician/${technicianId}/center/${centerId}`)
            console.log('📡 API Response received:', {
                status: 200, // Assuming success for logging
                data: data,
                headers: {} // Not directly available from Axios response.data
            })
            return data
        } catch (error: any) {
            console.error('❌ API Error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    baseURL: error.config?.baseURL,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            })
            throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi lấy lịch làm việc của technician')
        }
    },

    // Get technician details by ID to get centerId
    async getTechnicianById(id: number): Promise<{ success: boolean; data: { id: number; centerId: number; name: string; [key: string]: any } }> {
        try {
            console.log('🌐 Getting technician details for ID:', id)
            const { data } = await api.get(`/Technician/${id}`)
            console.log('👤 Technician details response:', data)
            return data
        } catch (error: any) {
            console.error('❌ Error fetching technician by ID:', error)
            throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi lấy thông tin technician')
        }
    },
}
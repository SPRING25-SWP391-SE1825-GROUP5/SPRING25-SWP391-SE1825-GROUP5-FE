import api from './api'

export type TechnicianListItem = {
    technicianId: number
    userFullName: string
    centerId?: number
    isActive?: boolean
}

export type TechnicianListResponse = {
    success: boolean
    message: string
    data: {
        technicians: TechnicianListItem[]
        totalCount?: number
        pageNumber?: number
        pageSize?: number
        totalPages?: number
    } | TechnicianListItem[]
}

export const TechnicianService = {
    async list(params: { pageNumber?: number; pageSize?: number; searchTerm?: string; centerId?: number } = {}) {
        const { data } = await api.get('/Technician', { params })
        if (data?.success && data?.data) {
            return {
                technicians: data.data.technicians || data.data,
                totalCount: data.data.totalCount || 0,
                pageNumber: data.data.pageNumber || 1,
                pageSize: data.data.pageSize || 10,
                totalPages: data.data.totalPages || 0
            }
        }

        // Fallback: trả về array trực tiếp
        if (Array.isArray(data?.data)) return { technicians: data.data, totalCount: data.data.length, pageNumber: 1, pageSize: 10, totalPages: 1 }
        if (Array.isArray(data)) return { technicians: data, totalCount: data.length, pageNumber: 1, pageSize: 10, totalPages: 1 }
        if (Array.isArray(data?.data?.technicians)) return { technicians: data.data.technicians, totalCount: data.data.technicians.length, pageNumber: 1, pageSize: 10, totalPages: 1 }

        return { technicians: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 }
    },

    // Lấy thống kê số lượng technician
    async getStats() {
        try {
            const { data } = await api.get('/Technician', { params: { pageSize: 1 } })

            if (data?.success && data?.data) {
                return {
                    totalTechnicians: data.data.totalCount || 0,
                    activeTechnicians: data.data.technicians?.filter((t: any) => t.isActive).length || 0,
                    inactiveTechnicians: data.data.technicians?.filter((t: any) => !t.isActive).length || 0
                }
            }

            return {
                totalTechnicians: 0,
                activeTechnicians: 0,
                inactiveTechnicians: 0
            }
        } catch (error) {
            console.error('Error fetching technician stats:', error)
            return {
                totalTechnicians: 0,
                activeTechnicians: 0,
                inactiveTechnicians: 0
            }
        }
    },

    // Availability by center and date
    async getCenterTechniciansAvailability(centerId: number, date: string, extra?: { serviceId?: number }) {
        const endpoint = `/Technician/centers/${centerId}/technicians/availability`
        const candidates = [
            { date, serviceId: extra?.serviceId },
            { workDate: date, serviceId: extra?.serviceId },
            { date },
            { workDate: date },
        ]
        let lastErr: any
        for (const params of candidates) {
            try {
                const { data } = await api.get(endpoint, { params })
                return data
            } catch (e: any) {
                lastErr = e
                if (e?.response?.status && e.response.status >= 500) break
            }
        }
        throw lastErr
    },

    // Availability of a technician for a date
    async getTechnicianAvailability(technicianId: number, date: string) {
        const { data } = await api.get(`/Technician/${technicianId}/availability`, { params: { date } })
        return data
    },

    // Time slots of a technician (optional date filter)
    async getTechnicianTimeSlots(technicianId: number, date?: string) {
        const { data } = await api.get(`/Technician/${technicianId}/timeslots`, { params: { date } })
        return data
    },
}

export type TimeSlot = {
    slotId: number
    slotTime?: string
    slotLabel?: string
    isActive?: boolean
}

export const TimeSlotService = {
    async list(active?: boolean) {
        const { data } = await api.get('/TimeSlot', { params: { active } })
        if (Array.isArray(data?.data)) return data.data as TimeSlot[]
        return []
    },
}



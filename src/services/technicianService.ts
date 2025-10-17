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
        // Some endpoints wrap in data.result, normalize
        if (Array.isArray(data?.data)) return data.data
        if (Array.isArray(data)) return data
        if (Array.isArray(data?.data?.technicians)) return data.data.technicians
        return []
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



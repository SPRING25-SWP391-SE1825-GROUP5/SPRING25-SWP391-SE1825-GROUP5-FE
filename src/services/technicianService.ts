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
    // Lấy technicianId từ userId bằng cách gọi API Technician list
    async getTechnicianIdByUserId(userId: number) {
        try {
            console.log('🔍 Getting technicianId for userId:', userId)
            
            // Gọi API lấy danh sách technicians và tìm technician có userId tương ứng
            const response = await api.get('/Technician', { 
                params: { 
                    pageSize: 1000, // Lấy nhiều để tìm được
                    // Không dùng searchTerm vì có thể không tìm được
                } 
            })
            
            console.log('📋 Technician list response:', response?.data)
            
            if (response?.data?.success && response.data.data) {
                const technicians = response.data.data.technicians || response.data.data
                
                if (Array.isArray(technicians)) {
                    console.log('📋 Found technicians:', technicians.length)
                    
                    // Tìm technician có userId tương ứng
                    const technician = technicians.find((t: any) => {
                        console.log('🔍 Checking technician:', t, 'userId:', t.userId, 'user.id:', t.user?.id, 'target userId:', userId)
                        return t.userId === userId || t.user?.id === userId
                    })
                    
                    if (technician && technician.technicianId) {
                        console.log('✅ Found technicianId:', technician.technicianId, 'for userId:', userId)
                        return {
                            technicianId: Number(technician.technicianId),
                            centerId: technician.centerId,
                            technicianName: technician.userFullName || technician.name
                        }
                    }
                }
            }
            
            throw new Error('Không tìm thấy technician cho userId này')
        } catch (error) {
            console.error('Error getting technicianId by userId:', error)
            throw error
        }
    },
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

        // Chỉ thử các params hợp lệ (không có undefined values)
        const candidates = []

        if (extra?.serviceId) {
            candidates.push({ date, serviceId: extra.serviceId })
            candidates.push({ workDate: date, serviceId: extra.serviceId })
        } else {
            candidates.push({ date })
            candidates.push({ workDate: date })
        }

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
        // Sử dụng API TechnicianTimeSlot thay vì Technician/timeslots
        // API này trả về TechnicianDailyScheduleResponse với thông tin đầy đủ hơn
        const startDate = date ? new Date(date) : new Date()
        const endDate = date ? new Date(date) : new Date()

        const { data } = await api.get(`/TechnicianTimeSlot/technician/${technicianId}/schedule`, {
            params: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            }
        })
        return data
    },

    // Lấy danh sách bookings của technician theo ngày
    async getTechnicianBookings(technicianId: number, date?: string) {
        try {
            const params: any = {}
            if (date) {
                params.date = date
            }
            
            console.log(`Fetching bookings for technician ${technicianId} with params:`, params)
            const { data } = await api.get(`/Technician/${technicianId}/bookings`, { params })
            console.log('Raw API response:', data)
            return data
        } catch (error) {
            console.error('Error fetching technician bookings:', error)
            throw error
        }
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



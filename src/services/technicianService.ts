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
            const response = await api.get('/Technician', { 
                params: { 
                    pageSize: 1000,
                } 
            })
            
            if (response?.data?.success && response.data.data) {
                const technicians = response.data.data.technicians || response.data.data
                
                if (Array.isArray(technicians)) {
                    const technician = technicians.find((t: any) => {
                        return t.userId === userId || t.user?.id === userId
                    })
                    
                    if (technician && technician.technicianId) {
                        return {
                            success: true,
                            data: {
                                technicianId: Number(technician.technicianId),
                                centerId: technician.centerId,
                                technicianName: technician.userFullName || technician.name
                            }
                        }
                    }
                }
            }
            
            return {
                success: false,
                data: null,
                message: 'Không tìm thấy technician cho userId này'
            }
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Lỗi khi tìm technician: ' + (error as Error).message
            }
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
      
      const { data } = await api.get(`/Technician/${technicianId}/bookings`, { params })
      return data
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Không thể tải danh sách booking'
      }
    }
  },

  // Lấy chi tiết booking của technician
  async getBookingDetail(technicianId: number, bookingId: number) {
    try {
      const { data } = await api.get(`/Technician/${technicianId}/bookings/${bookingId}`)
      return data
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Không thể tải chi tiết booking'
      }
    }
  },

  // Cập nhật maintenance checklist item
  async updateMaintenanceChecklistItem(bookingId: number, partId: number, result: string) {
    try {
      const { data } = await api.put(`/maintenance-checklist/${bookingId}/parts/${partId}`, { result })
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể cập nhật trạng thái checklist'
      }
    }
  },

  // Cập nhật maintenance checklist (legacy - giữ để tương thích)
  async updateMaintenanceChecklist(bookingId: number, items: Array<{ resultId: number; description: string; result: string }>) {
    try {
      const { data } = await api.put(`/maintenance-checklist/${bookingId}`, { items })
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể cập nhật maintenance checklist'
      }
    }
  },

  // Xác nhận hoàn thành maintenance checklist
  async confirmMaintenanceChecklist(bookingId: number) {
    try {
      const { data } = await api.post(`/maintenance-checklist/${bookingId}/confirm`)
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể xác nhận checklist'
      }
    }
  },

    // Lấy thông tin kỹ thuật viên theo centerId
    async getTechniciansByCenter(centerId: number) {
        try {
            const { data } = await api.get(`/Technician/by-center/${centerId}`)
            return data
        } catch (error) {
            throw error
        }
    },

    // Lấy thống kê booking theo trạng thái cho technician

    // Lấy danh sách booking của technician cho calendar
    // Removed duplicate getTechnicianBookings (use the one defined earlier with optional date)

    // Lấy thông tin chi tiết booking
    // Removed duplicate getBookingDetail (use the one defined earlier)
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



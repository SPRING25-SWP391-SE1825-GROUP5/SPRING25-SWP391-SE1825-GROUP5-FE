import api from './api'

export interface MaintenanceReminder {
  reminderId: number
  vehicleId: number
  serviceId?: number
  dueDate?: string
  dueMileage?: number
  status: 'PENDING' | 'DUE' | 'OVERDUE' | 'COMPLETED'
  type: 'MAINTENANCE' | 'PACKAGE' | 'APPOINTMENT'
  cadenceDays?: number
  isCompleted: boolean
  createdAt: string
  updatedAt?: string
  completedAt?: string
  lastSentAt?: string
  vehicle?: {
    vehicleId: number
    licensePlate: string
    currentMileage: number
    lastServiceDate?: string
    vehicleModel?: {
      modelId: number
      modelName: string
    }
    customer?: {
      customerId: number
      user?: {
        userId: number
        fullName: string
        email: string
        phoneNumber?: string
      }
    }
  }
  service?: {
    serviceId: number
    serviceName: string
  }
}

export interface ReminderListResponse {
  success: boolean
  data: MaintenanceReminder[]
}

export interface ReminderUpcomingResponse {
  success: boolean
  config: {
    upcomingDays: number
  }
  data: MaintenanceReminder[]
}

export interface ReminderAlertsResponse {
  success: boolean
  config: {
    upcomingDays: number
  }
  vehicleId: number
  count: number
  data: MaintenanceReminder[]
}

export const ReminderService = {
  /**
   * Lấy danh sách reminders với filter
   */
  async list(params?: {
    customerId?: number
    vehicleId?: number
    status?: string
    from?: string
    to?: string
  }): Promise<MaintenanceReminder[]> {
    try {
      const { data } = await api.get<ReminderListResponse>('/api/reminders', { params })
      return data.data || []
    } catch (error: any) {
      console.error('Error fetching reminders:', error)
      throw new Error(error?.response?.data?.message || 'Không thể tải danh sách nhắc nhở')
    }
  },

  /**
   * Lấy reminders sắp đến hạn (trong cửa sổ UpcomingDays)
   */
  async getUpcoming(customerId?: number): Promise<MaintenanceReminder[]> {
    try {
      const { data } = await api.get<ReminderUpcomingResponse>('/api/reminders/upcoming', {
        params: customerId ? { customerId } : {}
      })
      return data.data || []
    } catch (error: any) {
      console.error('Error fetching upcoming reminders:', error)
      throw new Error(error?.response?.data?.message || 'Không thể tải nhắc nhở sắp đến hạn')
    }
  },

  /**
   * Lấy alerts cho một vehicle cụ thể
   */
  async getVehicleAlerts(vehicleId: number): Promise<MaintenanceReminder[]> {
    try {
      if (vehicleId <= 0) return []
      const { data } = await api.get<ReminderAlertsResponse>(`/api/reminders/vehicles/${vehicleId}/alerts`)
      return data.data || []
    } catch (error: any) {
      console.error('Error fetching vehicle alerts:', error)
      throw new Error(error?.response?.data?.message || 'Không thể tải cảnh báo cho xe')
    }
  },

  /**
   * Lấy reminder theo ID
   */
  async getById(reminderId: number): Promise<MaintenanceReminder | null> {
    try {
      const { data } = await api.get<{ success: boolean; data: MaintenanceReminder }>(`/api/reminders/${reminderId}`)
      return data.data || null
    } catch (error: any) {
      console.error('Error fetching reminder:', error)
      return null
    }
  },

  /**
   * Đánh dấu reminder là hoàn thành
   */
  async complete(reminderId: number): Promise<void> {
    try {
      await api.patch(`/api/reminders/${reminderId}/complete`)
    } catch (error: any) {
      console.error('Error completing reminder:', error)
      throw new Error(error?.response?.data?.message || 'Không thể đánh dấu hoàn thành')
    }
  },

  /**
   * Hoãn reminder (tăng DueDate thêm số ngày)
   */
  async snooze(reminderId: number, days: number = 7): Promise<void> {
    try {
      await api.patch(`/api/reminders/${reminderId}/snooze`, { days })
    } catch (error: any) {
      console.error('Error snoozing reminder:', error)
      throw new Error(error?.response?.data?.message || 'Không thể hoãn nhắc nhở')
    }
  },

  /**
   * Cập nhật reminder (DueDate hoặc DueMileage)
   */
  async update(reminderId: number, updates: {
    dueDate?: string
    dueMileage?: number
  }): Promise<void> {
    try {
      await api.put(`/api/reminders/${reminderId}`, updates)
    } catch (error: any) {
      console.error('Error updating reminder:', error)
      throw new Error(error?.response?.data?.message || 'Không thể cập nhật nhắc nhở')
    }
  },

  /**
   * Tạo reminder mới
   */
  async create(reminder: {
    vehicleId: number
    serviceId?: number
    dueDate?: string
    dueMileage?: number
    cadenceDays?: number
    type?: 'MAINTENANCE' | 'PACKAGE' | 'APPOINTMENT'
  }): Promise<MaintenanceReminder> {
    try {
      const { data } = await api.post<{ success: boolean; data: MaintenanceReminder }>('/api/reminders', reminder)
      return data.data
    } catch (error: any) {
      console.error('Error creating reminder:', error)
      throw new Error(error?.response?.data?.message || 'Không thể tạo nhắc nhở')
    }
  },

  /**
   * Admin: List reminders với pagination
   */
  async listForAdmin(params?: {
    page?: number
    pageSize?: number
    customerId?: number
    vehicleId?: number
    status?: string
    type?: string
    from?: string
    to?: string
    searchTerm?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{
    success: boolean
    data: MaintenanceReminder[]
    pagination: {
      currentPage: number
      pageSize: number
      totalItems: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }> {
    try {
      const { data } = await api.get('/api/reminders/admin', { params })
      return data
    } catch (error: any) {
      console.error('Error fetching reminders for admin:', error)
      throw new Error(error?.response?.data?.message || 'Không thể tải danh sách nhắc nhở')
    }
  },

  /**
   * Admin: Get statistics
   */
  async getStats(): Promise<{
    success: boolean
    data: {
      total: number
      pending: number
      due: number
      overdue: number
      completed: number
      byType: {
        maintenance: number
        package: number
        appointment: number
      }
      byStatus: {
        pending: number
        due: number
        overdue: number
        completed: number
        expired: number
      }
    }
  }> {
    try {
      const { data } = await api.get('/api/reminders/stats')
      return data
    } catch (error: any) {
      console.error('Error fetching reminder stats:', error)
      throw new Error(error?.response?.data?.message || 'Không thể tải thống kê')
    }
  },

  /**
   * Admin: Delete reminder
   */
  async delete(reminderId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { data } = await api.delete(`/api/reminders/${reminderId}`)
      return data
    } catch (error: any) {
      console.error('Error deleting reminder:', error)
      throw new Error(error?.response?.data?.message || 'Không thể xóa nhắc nhở')
    }
  },

  /**
   * Thiết lập nhiều reminders cho một vehicle
   */
  async setVehicleReminders(vehicleId: number, items: Array<{
    serviceId?: number
    dueDate?: string
    dueMileage?: number
    cadenceDays?: number
    type?: 'MAINTENANCE' | 'PACKAGE' | 'APPOINTMENT'
  }>): Promise<MaintenanceReminder[]> {
    try {
      const { data } = await api.post<{ success: boolean; data: MaintenanceReminder[] }>(
        `/api/reminders/vehicles/${vehicleId}/set`,
        { items }
      )
      return data.data || []
    } catch (error: any) {
      console.error('Error setting vehicle reminders:', error)
      throw new Error(error?.response?.data?.message || 'Không thể thiết lập nhắc nhở')
    }
  }
}


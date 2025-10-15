import api from './api'

// Center Management Types
export type Center = {
  centerId: number
  centerName: string
  address: string
  city?: string
  phoneNumber: string
  email?: string
  isActive: boolean
  createdAt: string
}

export type CreateCenterRequest = {
  centerName: string
  address: string
  phoneNumber: string
  isActive?: boolean
}

export type UpdateCenterRequest = {
  centerName: string
  address: string
  phoneNumber: string
  isActive: boolean
}

export type CenterListParams = {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  city?: string
}

export type CenterListResponse = {
  centers: Center[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type NearbyCentersParams = {
  lat: number
  lng: number
  radiusKm?: number
  limit?: number
  serviceId?: number
}

export type NearbyCenter = {
  centerId: number
  centerName: string
  address: string
  city: string
  phoneNumber: string
  distance: number
  isActive: boolean
}

export const CenterService = {
  // Get all centers with pagination and filters
  async getCenters(params: CenterListParams = {}): Promise<CenterListResponse> {
    const { data } = await api.get('/Center', { params })
    console.log('getCenters response:', data)
    
    // Handle different response formats
    if (data.success && data.data) {
      return data.data
    } else if (data.centers) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Get active centers only
  async getActiveCenters(params: CenterListParams = {}): Promise<CenterListResponse> {
    const { data } = await api.get('/Center/active', { params })
    console.log('getActiveCenters response:', data)
    
    // Handle different response formats
    if (data.success && data.data) {
      return data.data
    } else if (data.centers) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Get center by ID
  async getCenterById(id: number): Promise<Center> {
    const { data } = await api.get(`/Center/${id}`)
    console.log('getCenterById response:', data)
    
    if (data.success && data.data) {
      return data.data
    } else if (data.centerId) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Create new center
  async createCenter(center: CreateCenterRequest): Promise<Center> {
    const { data } = await api.post('/Center', center)
    console.log('createCenter response:', data)
    
    if (data.success && data.data) {
      return data.data
    } else if (data.centerId) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Update center
  async updateCenter(id: number, center: UpdateCenterRequest): Promise<Center> {
    const { data } = await api.put(`/Center/${id}`, center)
    console.log('updateCenter response:', data)
    
    if (data.success && data.data) {
      return data.data
    } else if (data.centerId) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Toggle center active status
  async toggleCenterStatus(id: number): Promise<Center> {
    try {
      const { data, status } = await api.patch(`/Center/${id}/toggle-active`)
      console.log('toggleCenterStatus response:', data)
      
      if (status >= 200 && status < 300) {
        if (data?.success && data?.data) {
          return data.data
        }
        // Some APIs may return the entity directly
        if (data && typeof data === 'object' && (data.centerId || data.centerName)) {
          return data as Center
        }
        // Some APIs may return only a message; fetch the updated entity as fallback
        const refreshed = await this.getCenterById(id)
        return refreshed
      }
      throw new Error('Unexpected response status from server')
    } catch (error: any) {
      console.error('Error toggling center status:', error)
      
      // Extract detailed error message
      let errorMessage = 'Unknown error'
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.errors) {
          const errors = error.response.data.errors
          if (typeof errors === 'object') {
            errorMessage = Object.values(errors).flat().join(', ')
          }
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(`Không thể cập nhật trạng thái: ${errorMessage}`)
    }
  },

  // Get nearby centers
  async getNearbyCenters(params: NearbyCentersParams): Promise<NearbyCenter[]> {
    const { data } = await api.get('/Center/nearby', { params })
    return data
  },

  // Get center statistics (mock data for now)
  async getCenterStats(): Promise<{
    totalCenters: number
    activeCenters: number
    inactiveCenters: number
    totalBookings: number
    totalRevenue: number
  }> {
    try {
      // Get all centers to calculate stats
      const response = await this.getCenters({ pageSize: 1000 })
      const centers = response.centers
      
      const totalCenters = centers.length
      const activeCenters = centers.filter(c => c.isActive).length
      const inactiveCenters = totalCenters - activeCenters
      
      // Mock data for bookings and revenue
      const totalBookings = Math.floor(Math.random() * 100) + 50
      const totalRevenue = Math.floor(Math.random() * 100000000) + 50000000
      
      return {
        totalCenters,
        activeCenters,
        inactiveCenters,
        totalBookings,
        totalRevenue
      }
    } catch (error) {
      // Fallback data
      return {
        totalCenters: 0,
        activeCenters: 0,
        inactiveCenters: 0,
        totalBookings: 0,
        totalRevenue: 0
      }
    }
  },

  // Get center performance data (mock data)
  async getCenterPerformance(): Promise<{
    center: string
    bookings: number
    revenue: number
    rating: number
  }[]> {
    // Mock performance data
    return [
      { center: 'Trung tâm Hà Nội', bookings: 45, revenue: 12000000, rating: 4.8 },
      { center: 'Trung tâm TP.HCM', bookings: 38, revenue: 15000000, rating: 4.6 },
      { center: 'Trung tâm Đà Nẵng', bookings: 28, revenue: 8000000, rating: 4.7 },
      { center: 'Trung tâm Cần Thơ', bookings: 22, revenue: 6000000, rating: 4.5 },
      { center: 'Trung tâm Hải Phòng', bookings: 35, revenue: 10000000, rating: 4.9 }
    ]
  },

  // Get recent center activities (mock data)
  async getRecentActivities(limit: number = 10): Promise<{
    id: string
    center: string
    activity: string
    user: string
    timestamp: string
    type: 'booking' | 'maintenance' | 'inventory' | 'staff'
  }[]> {
    // Mock recent activities
    const activities = [
      {
        id: 'ACT001',
        center: 'Trung tâm Hà Nội',
        activity: 'Đặt lịch bảo dưỡng xe điện',
        user: 'Nguyễn Văn A',
        timestamp: '2024-01-15T09:30:00Z',
        type: 'booking' as const
      },
      {
        id: 'ACT002',
        center: 'Trung tâm TP.HCM',
        activity: 'Hoàn thành sửa chữa động cơ',
        user: 'Trần Thị B',
        timestamp: '2024-01-15T14:20:00Z',
        type: 'maintenance' as const
      },
      {
        id: 'ACT003',
        center: 'Trung tâm Đà Nẵng',
        activity: 'Nhập kho phụ tùng mới',
        user: 'Lê Văn C',
        timestamp: '2024-01-15T11:15:00Z',
        type: 'inventory' as const
      },
      {
        id: 'ACT004',
        center: 'Trung tâm Cần Thơ',
        activity: 'Thêm nhân viên mới',
        user: 'Phạm Thị D',
        timestamp: '2024-01-15T16:45:00Z',
        type: 'staff' as const
      },
      {
        id: 'ACT005',
        center: 'Trung tâm Hải Phòng',
        activity: 'Cập nhật thông tin trung tâm',
        user: 'Hoàng Văn E',
        timestamp: '2024-01-15T13:30:00Z',
        type: 'maintenance' as const
      }
    ]
    
    return activities.slice(0, limit)
  }
}

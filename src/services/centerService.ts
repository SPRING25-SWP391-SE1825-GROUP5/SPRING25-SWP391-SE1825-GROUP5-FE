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
    const { data } = await api.get('/center', { params })
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
    const { data } = await api.get('/center/active', { params })
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
    const { data } = await api.get(`/center/${id}`)
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
    const { data } = await api.post('/center', center)
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
    const { data } = await api.put(`/center/${id}`, center)
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
      const { data, status } = await api.patch(`/center/${id}/toggle-active`)
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
    const { data } = await api.get('/center/nearby', { params })
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

      // TODO: Get real data from booking API
      const totalBookings = 0
      const totalRevenue = 0

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

  // Get center performance data - TODO: Replace with real API
  async getCenterPerformance(): Promise<{
    center: string
    bookings: number
    revenue: number
    rating: number
  }[]> {
    // TODO: Implement real API call
    return []
  },

  // Get recent center activities - TODO: Replace with real API
  async getRecentActivities(limit: number = 10): Promise<{
    id: string
    center: string
    activity: string
    user: string
    timestamp: string
    type: 'booking' | 'maintenance' | 'inventory' | 'staff'
  }[]> {
    // TODO: Implement real API call
    return []
  }
}

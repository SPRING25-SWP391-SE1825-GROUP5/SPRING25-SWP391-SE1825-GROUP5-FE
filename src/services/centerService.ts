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

    // Handle the response format from your API
    if (data.success && data.data && data.data.centers) {
      return {
        centers: data.data.centers,
        pageNumber: 1,
        pageSize: data.data.centers.length,
        totalPages: 1,
        totalCount: data.data.centers.length,
        hasPreviousPage: false,
        hasNextPage: false
      }
    } else if (data.centers) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Get active centers only
  async getActiveCenters(params: CenterListParams = {}): Promise<CenterListResponse> {
    const { data } = await api.get('/center/active', { params })

    // Handle the response format from your API
    if (data.success && data.data && data.data.centers) {
      return {
        centers: data.data.centers,
        pageNumber: 1,
        pageSize: data.data.centers.length,
        totalPages: 1,
        totalCount: data.data.centers.length,
        hasPreviousPage: false,
        hasNextPage: false
      }
    } else if (data.centers) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },

  // Get center by ID
  async getCenterById(id: number): Promise<Center> {
    const { data } = await api.get(`/center/${id}`)

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

    if (data.success && data.data) {
      return data.data
    } else if (data.centerId) {
      return data
    } else {
      throw new Error('Invalid response format from server')
    }
  },


  // Get nearby centers
  async getNearbyCenters(params: NearbyCentersParams): Promise<NearbyCenter[]> {
    const { data } = await api.get('/center/nearby', { params })
    return data
  },

  // Get center statistics
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

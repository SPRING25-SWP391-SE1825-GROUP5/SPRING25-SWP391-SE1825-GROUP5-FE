import api from './api'

// Service Management Types
export type Service = {
  id: number
  name: string
  description: string
  price: number
  notes?: string
  isActive: boolean
  createAt: string
}

type BackendService = {
  serviceId: number
  serviceName: string
  description: string
  price?: number
  basePrice?: number
  notes?: string
  isActive: boolean
  createdAt?: string
  createAt?: string
}

type BackendListEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

type BackendServiceListData = {
  services?: BackendService[]
  items?: BackendService[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const mapBackendServiceToService = (s: BackendService): Service => ({
  id: s.serviceId,
  name: s.serviceName,
  description: s.description,
  price: (s.price ?? s.basePrice ?? 0),
  notes: s.notes,
  isActive: s.isActive,
  createAt: (s.createdAt ?? s.createAt ?? '')
})

const mapServiceToBackendService = (s: Partial<Service> & { notes?: string }): any => ({
  serviceName: s.name,
  description: s.description,
  price: s.price,
  basePrice: s.price,
  notes: s.notes,
  isActive: s.isActive
})

export type ServiceStats = {
  totalServices: number
  serviceBookings: number
  serviceRevenue: number
  completionRate: number
  change: string
  changeType: 'positive' | 'negative'
}

export type ServiceBooking = {
  id: string
  service: string
  customer: string
  branch: string
  status: 'completed' | 'in_progress' | 'scheduled'
  price: number
  date: string
  time: string
}

export type ServicePerformance = {
  service: string
  bookings: number
  revenue: number
}

export type ServiceListParams = {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  categoryId?: number
  status?: 'active' | 'inactive' | 'all'
  category?: string
  search?: string
}

export type ServiceListResponse = {
  services: Service[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export const ServiceManagementService = {
  async getServices(params: ServiceListParams = {}): Promise<ServiceListResponse> {
    const backendParams = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      searchTerm: params.searchTerm || params.search,
      categoryId: params.categoryId
    }

    const { data } = await api.get('/Service/active', { params: backendParams })
    console.log('Raw API response:', data)

    const envelope = data as BackendListEnvelope<BackendServiceListData> | BackendServiceListData
    const payload: BackendServiceListData = (envelope as any)?.data
      ? (envelope as BackendListEnvelope<BackendServiceListData>).data
      : (envelope as BackendServiceListData)

    console.log('Extracted payload:', payload)

    const rawList: BackendService[] | undefined = (payload.services && Array.isArray(payload.services))
      ? payload.services
      : (payload.items && Array.isArray(payload.items))
        ? payload.items
        : (Array.isArray(envelope) ? (envelope as unknown as BackendService[]) : [])

    console.log('Raw services list:', rawList)

    const services = (rawList || []).map(mapBackendServiceToService)
    console.log('Mapped services:', services)

    return {
      services,
      totalCount: payload.totalCount ?? services.length,
      pageNumber: payload.pageNumber ?? 1,
      pageSize: payload.pageSize ?? services.length,
      totalPages: payload.totalPages ?? 1
    }
  },

  // Get active services only
  async getActiveServices(params: ServiceListParams = {}): Promise<ServiceListResponse> {
    const backendParams = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      searchTerm: params.searchTerm || params.search,
      categoryId: params.categoryId
    }

    const { data } = await api.get('/service/active', { params: backendParams })
    const envelope = data as BackendListEnvelope<BackendServiceListData> | BackendServiceListData
    const payload: BackendServiceListData = (envelope as any)?.data
      ? (envelope as BackendListEnvelope<BackendServiceListData>).data
      : (envelope as BackendServiceListData)

    const rawList: BackendService[] | undefined = (payload.services && Array.isArray(payload.services))
      ? payload.services
      : (payload.items && Array.isArray(payload.items))
        ? payload.items
        : (Array.isArray(envelope) ? (envelope as unknown as BackendService[]) : [])

    const services = (rawList || []).map(mapBackendServiceToService)

    return {
      services,
      totalCount: payload.totalCount ?? services.length,
      pageNumber: payload.pageNumber ?? 1,
      pageSize: payload.pageSize ?? services.length,
      totalPages: payload.totalPages ?? 1
    }
  },

  // Get service statistics
  async getServiceStats(): Promise<ServiceStats> {
    try {
      const response = await this.getServices({ pageSize: 1000 })
      const services = response.services

      const totalServices = services.length
      const activeServices = services.filter(s => s.isActive).length

      // TODO: Get real data from booking API
      const serviceBookings = 0
      const serviceRevenue = 0
      const completionRate = 0

      return {
        totalServices,
        serviceBookings,
        serviceRevenue,
        completionRate,
        change: '+12.5%',
        changeType: 'positive'
      }
    } catch (error) {
      return {
        totalServices: 0,
        serviceBookings: 0,
        serviceRevenue: 0,
        completionRate: 0,
        change: '0%',
        changeType: 'positive'
      }
    }
  },

  // Get service performance data - TODO: Replace with real API
  async getServicePerformance(): Promise<ServicePerformance[]> {
    // TODO: Implement real API call
    return []
  },

  // Get recent service bookings - TODO: Replace with real API
  async getRecentBookings(limit: number = 10): Promise<ServiceBooking[]> {
    // TODO: Implement real API call
    return []
  },

  // Get service by ID
  async getServiceById(id: number): Promise<Service> {
    const { data } = await api.get(`/service/${id}`)
    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  // Create new service
  async createService(service: Omit<Service, 'id' | 'createAt'> & { notes?: string }): Promise<Service> {
    console.log('Creating service with data:', service)

    const backendService = mapServiceToBackendService(service)

    const { data } = await api.post('/service', backendService)
    console.log('Create service response:', data)

    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  // Update service - FIXED VERSION
  async updateService(id: number, service: Partial<Service> & { notes?: string }): Promise<Service> {
    try {
      console.log('Updating service:', { id, service })

      const backendService = {
        ...mapServiceToBackendService(service),
        serviceId: id
      }

      console.log('Sending update payload:', backendService)

      // Try multiple endpoint formats
      let response
      try {
        // First try: PUT with ID in URL
        response = await api.put(`/service/${id}`, backendService)
        console.log('Update successful with endpoint /Service/${id}')
      } catch (firstError: any) {
        console.log('First endpoint failed, trying alternative...', firstError.message)

        // Second try: PUT with ID in body only
        response = await api.put('/service', backendService)
        console.log('Update successful with endpoint /Service')
      }

      console.log('Update response:', response.data)

      const maybeService: BackendService | undefined = (response.data as any)?.data?.service ?? (response.data as any)?.data ?? response.data

      if (!maybeService) {
        throw new Error('Invalid response format from server')
      }

      return mapBackendServiceToService(maybeService as BackendService)
    } catch (error: any) {
      console.error('Error in updateService:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      throw new Error(error.response?.data?.message || `Failed to update service: ${error.message}`)
    }
  },

  // Update service status (toggle active/inactive)
  async updateServiceStatus(id: number): Promise<Service> {
    const { data } = await api.patch(`/service/${id}/toggle-active`)
    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  // Get service categories
  async getServiceCategories(): Promise<string[]> {
    try {
      const { data } = await api.get('/service/categories')
      return data
    } catch (error) {
      return []
    }
  }
}
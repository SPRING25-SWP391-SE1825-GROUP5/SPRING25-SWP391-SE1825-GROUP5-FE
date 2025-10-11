import api from './api'

// Service Management Types
export type Service = {
  id: number
  name: string
  description: string
  price: number
  isActive: boolean
  createAt: string
}

// Service Part Types
export type ServicePart = {
  partId: number
  partName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

type BackendService = {
  serviceId: number
  serviceName: string
  description: string
  basePrice: number
  isActive: boolean
  createdAt: string
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
  price: s.basePrice,
  isActive: s.isActive,
  createAt: s.createdAt
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

    const { data } = await api.get('/Service', { params: backendParams })
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

  // Get active services only
  async getActiveServices(params: ServiceListParams = {}): Promise<ServiceListResponse> {
    const backendParams = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      searchTerm: params.searchTerm || params.search,
      categoryId: params.categoryId
    }

    const { data } = await api.get('/Service/active', { params: backendParams })
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
    const { data } = await api.get('/Service/stats')
    return data
  },

  // Get service performance data
  async getServicePerformance(): Promise<ServicePerformance[]> {
    const { data } = await api.get('/Service/performance')
    return data
  },

  // Get recent service bookings
  async getRecentBookings(limit: number = 10): Promise<ServiceBooking[]> {
    const { data } = await api.get('/Service/recent-bookings', {
      params: { limit }
    })
    return data
  },

  // Get service by ID
  async getServiceById(id: number): Promise<Service> {
    const { data } = await api.get(`/Service/${id}`)
    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  // Create new service
  async createService(service: Omit<Service, 'id' | 'createAt'>): Promise<Service> {
    const backendService = {
      serviceName: service.name,
      description: service.description,
      basePrice: service.price,
      isActive: service.isActive
    }

    const { data } = await api.post('/Service', backendService)
    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  // Update service
  async updateService(id: number, service: Partial<Service>): Promise<Service> {
    const backendService = {
      serviceName: service.name,
      description: service.description,
      basePrice: service.price,
      isActive: service.isActive
    }

    const { data } = await api.put(`/Service/${id}`, backendService)
    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  // Delete service
  async deleteService(id: number): Promise<void> {
    await api.delete(`/Service/${id}`)
  },

  // Update service status (toggle active/inactive)
  async updateServiceStatus(id: number): Promise<Service> {
    const { data } = await api.patch(`/Service/${id}/toggle-active`)
    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  // Get service parts
  async getServiceParts(serviceId: number): Promise<ServicePart[]> {
    const { data } = await api.get(`/Service/${serviceId}/parts`)
    return (data as any)?.data?.parts ?? (data as any)?.data ?? data
  },

  // Replace all service parts
  async replaceServiceParts(serviceId: number, parts: ServicePart[]): Promise<void> {
    await api.put(`/Service/${serviceId}/parts`, { parts })
  },

  // Add service part
  async addServicePart(serviceId: number, part: Omit<ServicePart, 'partId'>): Promise<ServicePart> {
    const { data } = await api.post(`/Service/${serviceId}/parts`, part)
    return (data as any)?.data?.part ?? (data as any)?.data ?? data
  },

  // Remove service part
  async removeServicePart(serviceId: number, partId: number): Promise<void> {
    await api.delete(`/Service/${serviceId}/parts/${partId}`)
  },

  // Get service categories
  async getServiceCategories(): Promise<string[]> {
    const { data } = await api.get('/Service/categories')
    return data
  }
}
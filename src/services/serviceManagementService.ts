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
    try {
      const response = await this.getServices({ pageSize: 1000 })
      const services = response.services
      
      const totalServices = services.length
      const activeServices = services.filter(s => s.isActive).length
      
      // Mock data
      const serviceBookings = Math.floor(Math.random() * 50) + 20
      const serviceRevenue = Math.floor(Math.random() * 50000000) + 10000000
      const completionRate = Math.floor(Math.random() * 20) + 80
      
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

  // Get service performance data - mock data
  async getServicePerformance(): Promise<ServicePerformance[]> {
    return [
      { service: 'Bảo dưỡng định kỳ', bookings: Math.floor(Math.random() * 30) + 15, revenue: Math.floor(Math.random() * 15000000) + 5000000 },
      { service: 'Sửa chữa động cơ', bookings: Math.floor(Math.random() * 25) + 10, revenue: Math.floor(Math.random() * 20000000) + 8000000 },
      { service: 'Thay lốp xe', bookings: Math.floor(Math.random() * 20) + 8, revenue: Math.floor(Math.random() * 8000000) + 3000000 },
      { service: 'Bảo dưỡng phanh', bookings: Math.floor(Math.random() * 18) + 6, revenue: Math.floor(Math.random() * 12000000) + 4000000 },
      { service: 'Kiểm tra điện', bookings: Math.floor(Math.random() * 15) + 5, revenue: Math.floor(Math.random() * 6000000) + 2000000 }
    ]
  },

  // Get recent service bookings - mock data
  async getRecentBookings(limit: number = 10): Promise<ServiceBooking[]> {
    const mockBookings: ServiceBooking[] = [
      {
        id: 'BK001',
        service: 'Bảo dưỡng định kỳ',
        customer: 'Nguyễn Văn A',
        branch: 'Chi nhánh Hà Nội',
        status: 'completed',
        price: 500000,
        date: '2024-01-15',
        time: '09:00'
      },
      {
        id: 'BK002',
        service: 'Sửa chữa động cơ',
        customer: 'Trần Thị B',
        branch: 'Chi nhánh TP.HCM',
        status: 'in_progress',
        price: 1200000,
        date: '2024-01-14',
        time: '14:30'
      },
      {
        id: 'BK003',
        service: 'Thay lốp xe',
        customer: 'Lê Văn C',
        branch: 'Chi nhánh Đà Nẵng',
        status: 'scheduled',
        price: 800000,
        date: '2024-01-16',
        time: '10:00'
      },
      {
        id: 'BK004',
        service: 'Bảo dưỡng phanh',
        customer: 'Phạm Thị D',
        branch: 'Chi nhánh Hà Nội',
        status: 'completed',
        price: 600000,
        date: '2024-01-13',
        time: '16:00'
      },
      {
        id: 'BK005',
        service: 'Kiểm tra điện',
        customer: 'Hoàng Văn E',
        branch: 'Chi nhánh TP.HCM',
        status: 'in_progress',
        price: 400000,
        date: '2024-01-12',
        time: '11:30'
      }
    ]
    
    return mockBookings.slice(0, limit)
  },

  // Get service by ID
  async getServiceById(id: number): Promise<Service> {
    const { data } = await api.get(`/Service/${id}`)
    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  // Create new service
  async createService(service: Omit<Service, 'id' | 'createAt'> & { notes?: string }): Promise<Service> {
    console.log('Creating service with data:', service)
    
    const backendService = mapServiceToBackendService(service)

    const { data } = await api.post('/Service', backendService)
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
        serviceId: id // Ensure serviceId is included
      }

      console.log('Sending update payload:', backendService)

      // Try multiple endpoint formats
      let response
      try {
        // First try: PUT with ID in URL
        response = await api.put(`/Service/${id}`, backendService)
        console.log('Update successful with endpoint /Service/${id}')
      } catch (firstError: any) {
        console.log('First endpoint failed, trying alternative...', firstError.message)
        
        // Second try: PUT with ID in body only
        response = await api.put('/Service', backendService)
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
    const { data } = await api.patch(`/Service/${id}/toggle-active`)
    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  // Get service categories
  async getServiceCategories(): Promise<string[]> {
    try {
      const { data } = await api.get('/Service/categories')
      return data
    } catch (error) {
      return []
    }
  }
}
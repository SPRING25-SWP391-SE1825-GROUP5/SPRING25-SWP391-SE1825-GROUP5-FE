import api from './api'

// Service Management Types
export type Service = {
  id: number
  name: string
  description: string
  duration: number
  price: number
  status: 'active' | 'inactive'
  category: string
  color?: string
}

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
  // Get all services with pagination and filters
  async getServices(params: ServiceListParams = {}): Promise<ServiceListResponse> {
    const { data } = await api.get('/services', { params })
    return data
  },

  // Get service statistics
  async getServiceStats(): Promise<ServiceStats> {
    const { data } = await api.get('/services/stats')
    return data
  },

  // Get service performance data
  async getServicePerformance(): Promise<ServicePerformance[]> {
    const { data } = await api.get('/services/performance')
    return data
  },

  // Get recent service bookings
  async getRecentBookings(limit: number = 10): Promise<ServiceBooking[]> {
    const { data } = await api.get('/services/recent-bookings', {
      params: { limit }
    })
    return data
  },

  // Get service by ID
  async getServiceById(id: number): Promise<Service> {
    const { data } = await api.get(`/services/${id}`)
    return data
  },

  // Create new service
  async createService(service: Omit<Service, 'id'>): Promise<Service> {
    const { data } = await api.post('/services', service)
    return data
  },

  // Update service
  async updateService(id: number, service: Partial<Service>): Promise<Service> {
    const { data } = await api.put(`/services/${id}`, service)
    return data
  },

  // Delete service
  async deleteService(id: number): Promise<void> {
    await api.delete(`/services/${id}`)
  },

  // Update service status
  async updateServiceStatus(id: number, status: 'active' | 'inactive'): Promise<Service> {
    const { data } = await api.put(`/services/${id}/status`, { status })
    return data
  },

  // Get service categories
  async getServiceCategories(): Promise<string[]> {
    const { data } = await api.get('/services/categories')
    return data
  }
}

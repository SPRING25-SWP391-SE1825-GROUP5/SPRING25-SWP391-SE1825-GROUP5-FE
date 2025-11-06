import api from './api'
import { PAGINATION } from '../constants/appConstants'

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
  activeServices: number
  inactiveServices: number
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

// ServicePackage Types
export type ServicePackage = {
  packageId: number
  packageName: string
  packageCode: string
  description?: string
  serviceId: number
  serviceName: string
  totalCredits: number
  price: number
  discountPercent?: number
  isActive: boolean
  validFrom?: string
  validTo?: string
  createdAt: string
  updatedAt: string
}

export type CreateServicePackageRequest = {
  packageName: string
  packageCode: string
  description?: string
  serviceId: number
  totalCredits: number
  price: number
  discountPercent?: number
  isActive?: boolean
  validFrom?: string
  validTo?: string
}

export type UpdateServicePackageRequest = {
  packageName?: string
  packageCode?: string
  description?: string
  serviceId?: number
  totalCredits?: number
  price?: number
  discountPercent?: number
  isActive?: boolean
  validFrom?: string
  validTo?: string
}

export type ServicePackageListParams = {
  pageNumber?: number
  pageSize?: number
  serviceId?: number
  activeOnly?: boolean
  searchTerm?: string
}

export type ServicePackageListResponse = {
  packages: ServicePackage[]
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

    const envelope = data as BackendListEnvelope<BackendServiceListData> | BackendServiceListData
    const payload: BackendServiceListData = (envelope as any)?.data
      ? (envelope as BackendListEnvelope<BackendServiceListData>).data
      : (envelope as BackendServiceListData)

    // Payload extracted

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

  // Export services to a file (Excel/CSV depending on backend)
  async exportServices(params: ServiceListParams = {}): Promise<{ blob: Blob; filename?: string }> {
    // Pass through filters if needed; backend may ignore unknown ones
    const backendParams = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      searchTerm: params.searchTerm || params.search,
      categoryId: params.categoryId,
    }

    const response = await api.get('/Service/export', {
      params: backendParams,
      responseType: 'blob',
      headers: { Accept: 'application/octet-stream' }
    })

    // Try read filename from Content-Disposition
    const disposition = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition']
    let filename: string | undefined
    if (disposition && typeof disposition === 'string') {
      const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
      filename = decodeURIComponent(match?.[1] || match?.[2] || '') || undefined
    }

    return { blob: response.data as Blob, filename }
  },

  // Get active services only
  async getActiveServices(params: ServiceListParams = {}): Promise<ServiceListResponse> {
    const backendParams = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      searchTerm: params.searchTerm || params.search,
      categoryId: params.categoryId
    }

    console.log('Backend params:', backendParams)
    const { data } = await api.get('/Service/active', { params: backendParams })
    console.log('Raw API response:', data)
    const envelope = data as BackendListEnvelope<BackendServiceListData> | BackendServiceListData
    const payload: BackendServiceListData = (envelope as any)?.data
      ? (envelope as BackendListEnvelope<BackendServiceListData>).data
      : (envelope as BackendServiceListData)

    const rawList: BackendService[] | undefined = (payload.services && Array.isArray(payload.services))
      ? payload.services
      : (payload.items && Array.isArray(payload.items))
        ? payload.items
        : (Array.isArray(envelope) ? (envelope as unknown as BackendService[]) : [])

    console.log('Raw services list:', rawList)
    const services = (rawList || []).map(mapBackendServiceToService)
    console.log('Mapped services with category info:', services.map(s => ({ id: s.id, name: s.name })))

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
      const response = await this.getServices({ pageSize: PAGINATION.MAX_PAGE_SIZE })
      const services = response.services

      const totalServices = services.length
      const activeServices = services.filter(s => s.isActive).length
      const inactiveServices = totalServices - activeServices

      const serviceBookings = 0
      const serviceRevenue = 0
      const completionRate = 0

      return {
        totalServices,
        activeServices,
        inactiveServices,
        serviceBookings,
        serviceRevenue,
        completionRate,
        change: '+12.5%',
        changeType: 'positive'
      }
    } catch (error) {
      return {
        totalServices: 0,
        activeServices: 0,
        inactiveServices: 0,
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
    return []
  },

  // Get recent service bookings - TODO: Replace with real API
  async getRecentBookings(limit: number = 10): Promise<ServiceBooking[]> {
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

    const backendService = mapServiceToBackendService(service)

    const { data } = await api.post('/service', backendService)

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

  async updateServiceStatus(id: number): Promise<Service> {
    const { data } = await api.patch(`/service/${id}/toggle-active`)
    const maybeService: BackendService | undefined = (data as any)?.data?.service ?? (data as any)?.data ?? data
    return mapBackendServiceToService(maybeService as BackendService)
  },

  async getServiceCategories(): Promise<string[]> {
    try {
      const { data } = await api.get('/service/categories')
      return data
    } catch (error) {
      return []
    }
  },

  async getServicePackages(params: ServicePackageListParams = {}): Promise<ServicePackageListResponse> {
    try {
      const backendParams = {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        serviceId: params.serviceId,
        activeOnly: params.activeOnly,
        searchTerm: params.searchTerm
      }

      console.log('Fetching service packages with params:', backendParams)
      const { data } = await api.get('/ServicePackages', { params: backendParams })
      console.log('ServicePackages API response:', data)


      let packages: ServicePackage[] = []

      if (data && Array.isArray(data)) {
        packages = data
      } else if (data?.data && Array.isArray(data.data)) {
        packages = data.data
      } else if (data?.packages && Array.isArray(data.packages)) {
        packages = data.packages
      } else if (data?.success && data?.data) {
        packages = Array.isArray(data.data) ? data.data : []
      }

      console.log('Mapped packages:', packages)

      return {
        packages,
        totalCount: packages.length,
        pageNumber: params.pageNumber || PAGINATION.DEFAULT_PAGE,
        pageSize: params.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
        totalPages: Math.ceil(packages.length / (params.pageSize || PAGINATION.DEFAULT_PAGE_SIZE))
      }
    } catch (error: any) {
      console.error('Error fetching service packages:', error)
      throw new Error(error.response?.data?.message || `Failed to fetch service packages: ${error.message}`)
    }
  },

  async getServicePackageById(id: number): Promise<ServicePackage> {
    try {
      console.log('Fetching service package by ID:', id)
      const { data } = await api.get(`/ServicePackages/${id}`)
      console.log('ServicePackage by ID response:', data)

      // Handle different response formats
      if (data && typeof data === 'object') {
        if (data.data && typeof data.data === 'object') {
          return data.data
        } else if (data.packageId) {
          return data
        }
      }

      throw new Error('Invalid response format from server')
    } catch (error: any) {
      console.error('Error fetching service package by ID:', error)
      throw new Error(error.response?.data?.message || `Failed to fetch service package: ${error.message}`)
    }
  },

  async getServicePackageByCode(code: string): Promise<ServicePackage> {
    try {
      console.log('Fetching service package by code:', code)
      const { data } = await api.get(`/ServicePackages/code/${code}`)
      console.log('ServicePackage by code response:', data)

      // Handle different response formats
      if (data && typeof data === 'object') {
        if (data.data && typeof data.data === 'object') {
          return data.data
        } else if (data.packageId) {
          return data
        }
      }

      throw new Error('Invalid response format from server')
    } catch (error: any) {
      console.error('Error fetching service package by code:', error)
      throw new Error(error.response?.data?.message || `Failed to fetch service package: ${error.message}`)
    }
  },

  async createServicePackage(packageData: CreateServicePackageRequest): Promise<ServicePackage> {
    try {
      console.log('Creating service package with data:', packageData)

      // Validate required fields
      if (!packageData.packageName?.trim()) {
        throw new Error('Tên gói dịch vụ là bắt buộc')
      }
      if (!packageData.packageCode?.trim()) {
        throw new Error('Mã gói dịch vụ là bắt buộc')
      }
      if (!packageData.serviceId || packageData.serviceId <= 0) {
        throw new Error('Dịch vụ là bắt buộc')
      }
      if (!packageData.totalCredits || packageData.totalCredits <= 0) {
        throw new Error('Tổng số credit phải lớn hơn 0')
      }
      if (packageData.price < 0) {
        throw new Error('Giá gói phải lớn hơn hoặc bằng 0')
      }

      const { data } = await api.post('/ServicePackages', packageData)
      console.log('Create service package response:', data)
      if (data && typeof data === 'object') {
        if (data.data && typeof data.data === 'object') {
          return data.data
        } else if (data.packageId) {
          return data
        }
      }

      throw new Error('Invalid response format from server')
    } catch (error: any) {
      console.error('Error creating service package:', error)
      throw new Error(error.response?.data?.message || `Failed to create service package: ${error.message}`)
    }
  },

  async updateServicePackage(id: number, packageData: UpdateServicePackageRequest): Promise<ServicePackage> {
    try {
      console.log('Updating service package:', { id, packageData })

      // Validate ID
      if (!id || id <= 0) {
        throw new Error('ID gói dịch vụ không hợp lệ')
      }

      // Validate fields if provided
      if (packageData.packageName !== undefined && !packageData.packageName?.trim()) {
        throw new Error('Tên gói dịch vụ không được để trống')
      }
      if (packageData.packageCode !== undefined && !packageData.packageCode?.trim()) {
        throw new Error('Mã gói dịch vụ không được để trống')
      }
      if (packageData.serviceId !== undefined && packageData.serviceId <= 0) {
        throw new Error('Dịch vụ không hợp lệ')
      }
      if (packageData.totalCredits !== undefined && packageData.totalCredits <= 0) {
        throw new Error('Tổng số credit phải lớn hơn 0')
      }
      if (packageData.price !== undefined && packageData.price < 0) {
        throw new Error('Giá gói phải lớn hơn hoặc bằng 0')
      }
      if (packageData.discountPercent !== undefined && (packageData.discountPercent < 0 || packageData.discountPercent > 100)) {
        throw new Error('Phần trăm giảm giá phải từ 0 đến 100')
      }

      const { data } = await api.put(`/ServicePackages/${id}`, packageData)
      console.log('Update service package response:', data)

      // Handle different response formats
      if (data && typeof data === 'object') {
        if (data.data && typeof data.data === 'object') {
          return data.data
        } else if (data.packageId) {
          return data
        }
      }

      throw new Error('Invalid response format from server')
    } catch (error: any) {
      console.error('Error updating service package:', error)
      throw new Error(error.response?.data?.message || `Failed to update service package: ${error.message}`)
    }
  },

  async deleteServicePackage(id: number): Promise<void> {
    try {
      console.log('Deleting service package with ID:', id)

      // Validate ID
      if (!id || id <= 0) {
        throw new Error('ID gói dịch vụ không hợp lệ')
      }

      await api.delete(`/ServicePackages/${id}`)
      console.log('Service package deleted successfully')
    } catch (error: any) {
      console.error('Error deleting service package:', error)
      throw new Error(error.response?.data?.message || `Failed to delete service package: ${error.message}`)
    }
  },

  async getActiveServicePackages(params: ServicePackageListParams = {}): Promise<ServicePackageListResponse> {
    return this.getServicePackages({ ...params, activeOnly: true })
  },

  // Get service packages by service ID
  async getServicePackagesByServiceId(serviceId: number, params: ServicePackageListParams = {}): Promise<ServicePackageListResponse> {
    return this.getServicePackages({ ...params, serviceId })
  },

  // Check if package code exists
  async checkPackageCodeExists(code: string, excludeId?: number): Promise<boolean> {
    try {
      console.log('Checking if package code exists:', { code, excludeId })
      const { data } = await api.get(`/ServicePackages/check-code`, {
        params: { code, excludeId }
      })
      return data?.exists || false
    } catch (error: any) {
      console.error('Error checking package code:', error)
      return false
    }
  },

  // Toggle package active status
  async togglePackageStatus(id: number): Promise<ServicePackage> {
    try {
      console.log('Toggling package status:', id)

      // First, get the current package to know its current status
      const currentPackage = await this.getServicePackageById(id)
      const newStatus = !currentPackage.isActive

      console.log('Current status:', currentPackage.isActive, 'New status:', newStatus)

      // Update the package with the new status
      const updatedPackage = await this.updateServicePackage(id, {
        isActive: newStatus
      })

      console.log('Package status toggled successfully:', updatedPackage)
      return updatedPackage
    } catch (error: any) {
      console.error('Error toggling package status:', error)
      throw new Error(error.response?.data?.message || `Failed to toggle package status: ${error.message}`)
    }
  },


  async activatePackage(id: number): Promise<ServicePackage> {
    try {
      console.log('Activating package:', id)
      const updatedPackage = await this.updateServicePackage(id, {
        isActive: true
      })
      console.log('Package activated successfully:', updatedPackage)
      return updatedPackage
    } catch (error: any) {
      console.error('Error activating package:', error)
      throw new Error(error.response?.data?.message || `Failed to activate package: ${error.message}`)
    }
  },

  async deactivatePackage(id: number): Promise<ServicePackage> {
    try {
      console.log('Deactivating package:', id)
      const updatedPackage = await this.updateServicePackage(id, {
        isActive: false
      })
      console.log('Package deactivated successfully:', updatedPackage)
      return updatedPackage
    } catch (error: any) {
      console.error('Error deactivating package:', error)
      throw new Error(error.response?.data?.message || `Failed to deactivate package: ${error.message}`)
    }
  },


  async getPackageStats(): Promise<{
    totalPackages: number
    activePackages: number
    inactivePackages: number
    totalRevenue: number
  }> {
    try {
      const response = await this.getServicePackages({ pageSize: PAGINATION.MAX_PAGE_SIZE })
      const packages = response.packages

      const totalPackages = packages.length
      const activePackages = packages.filter(p => p.isActive).length
      const inactivePackages = totalPackages - activePackages
      const totalRevenue = packages.reduce((sum, p) => sum + p.price, 0)

      return {
        totalPackages,
        activePackages,
        inactivePackages,
        totalRevenue
      }
    } catch (error: any) {
      console.error('Error getting package stats:', error)
      return {
        totalPackages: 0,
        activePackages: 0,
        inactivePackages: 0,
        totalRevenue: 0
      }
    }
  }
}
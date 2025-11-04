import api from './api'

// Types cho Part data theo response body thực tế
export interface Part {
  partId: number
  partNumber: string
  partName: string
  brand: string
  imageUrl?: string
  totalStock: number
  minimumStock: number
  isLowStock: boolean
  isOutOfStock: boolean
  unitPrice: number
  rating: number
  lastUpdated: string
}

export interface PartAvailabilityResponse {
  success: boolean
  message: string
  data: Part[]
  pagination?: {
    pageNumber: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface PartFilters {
  centerId?: number
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  searchTerm?: string
  pageNumber?: number
  pageSize?: number
}

export const PartService = {
  // Lấy danh sách phụ tùng có sẵn
  async getPartAvailability(filters?: PartFilters): Promise<PartAvailabilityResponse> {
    try {
      const params = new URLSearchParams()
      if (filters?.centerId) params.append('centerId', filters.centerId.toString())

      if (filters?.category) params.append('category', filters.category)
      if (filters?.brand) params.append('brand', filters.brand)
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString())
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters?.inStock !== undefined) params.append('inStock', filters.inStock.toString())
      if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm)
      if (filters?.pageNumber) params.append('pageNumber', filters.pageNumber.toString())
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())

      const queryString = params.toString()
      const url = queryString ? `/part/availability?${queryString}` : '/part/availability'

      const { data } = await api.get(url)
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể tải danh sách phụ tùng',
        data: []
      }
    }
  },

  // Lấy chi tiết phụ tùng
  async getPartById(partId: number): Promise<{ success: boolean; message: string; data?: Part }> {
    try {
      const { data } = await api.get(`/part/${partId}`)
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể tải chi tiết phụ tùng'
      }
    }
  },


  // Kiểm tra tính khả dụng của phụ tùng
  async checkPartAvailability(partId: number, quantity: number): Promise<{ success: boolean; message: string; available: boolean; availableQuantity?: number }> {
    try {
      const { data } = await api.get(`/part/${partId}/availability?quantity=${quantity}`)
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể kiểm tra tính khả dụng',
        available: false
      }
    }
  }
}

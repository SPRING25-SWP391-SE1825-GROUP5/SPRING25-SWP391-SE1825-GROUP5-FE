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
      // Thử endpoint với chữ hoa /Part/ trước (theo inventoryService)
      try {
        const { data } = await api.get(`/Part/${partId}`)
        console.log(`[DEBUG] PartService.getPartById(${partId}) - Response:`, data)
        return data
      } catch (err1: any) {
        // Nếu không được, thử endpoint với chữ thường /part/
        try {
          const { data } = await api.get(`/part/${partId}`)
          console.log(`[DEBUG] PartService.getPartById(${partId}) - Response (lowercase):`, data)
          return data
        } catch (err2: any) {
          console.error(`[DEBUG] PartService.getPartById(${partId}) - Both endpoints failed:`, err1, err2)
          throw err1 || err2
        }
      }
    } catch (error: any) {
      console.error(`[DEBUG] PartService.getPartById(${partId}) - Error:`, error)
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Không thể tải chi tiết phụ tùng'
      }
    }
  },


  // Kiểm tra tính khả dụng của phụ tùng
  async checkPartAvailability(partId: number, quantity: number, centerId?: number): Promise<{ success: boolean; message: string; available: boolean; availableQuantity?: number }> {
    try {
      const params = new URLSearchParams()
      params.append('quantity', quantity.toString())
      if (centerId) {
        params.append('centerId', centerId.toString())
      }
      const { data } = await api.get(`/part/${partId}/availability?${params.toString()}`)
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể kiểm tra tính khả dụng',
        available: false
      }
    }
  }
  ,
  // Lấy phụ tùng theo categoryId (phụ tùng gợi ý khi FAIL)
  async getPartsByCategory(categoryId: number): Promise<{ success: boolean; message?: string; data: Part[] }> {
    try {
      const { data } = await api.get(`/parts/by-category/${categoryId}`)
      // Kỳ vọng backend trả { success, data: Part[] }
      if (Array.isArray(data)) {
        return { success: true, data }
      }
      if (Array.isArray(data?.data)) {
        return { success: true, data: data.data }
      }
      return { success: !!data?.success, data: data?.data || [] }
    } catch (error) {
      return { success: false, message: 'Không thể tải phụ tùng theo category', data: [] }
    }
  }
}

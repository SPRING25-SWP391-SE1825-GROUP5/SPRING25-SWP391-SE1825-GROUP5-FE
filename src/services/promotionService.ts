import api from './api'
import type { 
  Promotion, 
  CreatePromotionRequest, 
  UpdatePromotionRequest, 
  PromotionFilters, 
  PromotionResponse,
  ApplyPromotionRequest,
  PromotionUsage
} from '../types/promotion'

class PromotionService {
  async getPromotions(filters: PromotionFilters = {}): Promise<PromotionResponse> {
    try {
      const params = new URLSearchParams()
      
      if (filters.pageNumber) params.append('pageNumber', filters.pageNumber.toString())
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString())
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm)
      if (filters.status) params.append('status', filters.status)
      if (filters.promotionType) params.append('promotionType', filters.promotionType)
      
      console.log('PromotionService: Making API request to:', `/Promotion?${params.toString()}`)
      console.log('PromotionService: Filters:', filters)
      
      const response = await api.get(`/Promotion?${params.toString()}`)
      
      console.log('PromotionService: Raw API response:', response)
      console.log('PromotionService: Response data:', response.data)
      
      const data = response.data
      
      console.log('PromotionService: Raw response data:', data)
      
      if (Array.isArray(data)) {
        console.log('PromotionService: Response is direct array with', data.length, 'items')
        return {
          data: data,
          totalCount: data.length,
          pageNumber: filters.pageNumber || 1,
          pageSize: filters.pageSize || 10,
          totalPages: Math.ceil(data.length / (filters.pageSize || 10))
        }
      }
      
      let promotionsData: Promotion[] = []
      let totalCount = 0
      let pageNumber = filters.pageNumber || 1
      let pageSize = filters.pageSize || 10
      let totalPages = 0
      
      if (data?.success && data?.data) {
        if (Array.isArray(data.data.promotions)) {
          promotionsData = data.data.promotions
          totalCount = data.data.totalCount || promotionsData.length
          pageNumber = data.data.pageNumber || filters.pageNumber || 1
          pageSize = data.data.pageSize || filters.pageSize || 10
          totalPages = data.data.totalPages || Math.ceil(totalCount / pageSize)
          console.log('PromotionService: Found promotions in data.data.promotions:', promotionsData.length)
        } else if (Array.isArray(data.data)) {
          promotionsData = data.data
          totalCount = data.totalCount || promotionsData.length
          pageNumber = data.pageNumber || filters.pageNumber || 1
          pageSize = data.pageSize || filters.pageSize || 10
          totalPages = data.totalPages || Math.ceil(totalCount / pageSize)
          console.log('PromotionService: Found promotions in data.data:', promotionsData.length)
        }
      } else {
        promotionsData = Array.isArray(data?.data) ? data.data : 
                       Array.isArray(data?.items) ? data.items : 
                       Array.isArray(data?.results) ? data.results : []
        totalCount = data?.totalCount || data?.total || promotionsData.length
        pageNumber = data?.pageNumber || data?.page || filters.pageNumber || 1
        pageSize = data?.pageSize || data?.size || filters.pageSize || 10
        totalPages = data?.totalPages || Math.ceil(totalCount / pageSize)
        console.log('PromotionService: Using fallback structure:', promotionsData.length)
      }
      
      console.log('PromotionService: Final extracted data:', {
        promotionsCount: promotionsData.length,
        totalCount,
        pageNumber,
        pageSize,
        totalPages
      })
      
      return {
        data: promotionsData,
        totalCount,
        pageNumber,
        pageSize,
        totalPages
      }
    } catch (error) {
      console.error('PromotionService: Error in getPromotions:', error)
      console.error('PromotionService: Error details:', {
        message: (error as any).message,
        status: (error as any).response?.status,
        statusText: (error as any).response?.statusText,
        data: (error as any).response?.data
      })
      
      return {
        data: [],
        totalCount: 0,
        pageNumber: filters.pageNumber || 1,
        pageSize: filters.pageSize || 10,
        totalPages: 0
      }
    }
  }

  async getActivePromotions(filters: PromotionFilters = {}): Promise<PromotionResponse> {
    const params = new URLSearchParams()
    
    if (filters.pageNumber) params.append('pageNumber', filters.pageNumber.toString())
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString())
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm)
    if (filters.promotionType) params.append('promotionType', filters.promotionType)
    
    const response = await api.get(`/Promotion/active?${params.toString()}`)
    
    const data = response.data
    return {
      data: Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [],
      totalCount: data?.totalCount || 0,
      pageNumber: data?.pageNumber || 1,
      pageSize: data?.pageSize || 10,
      totalPages: data?.totalPages || 0
    }
  }

  async getPromotionById(id: number): Promise<Promotion> {
    const response = await api.get(`/Promotion/${id}`)
    const raw = response.data

    let promotion: any = null
    if (raw?.success && raw?.data) {
      promotion = raw.data.promotion ?? raw.data
    } else if (raw?.promotion) {
      promotion = raw.promotion
    } else {
      promotion = raw
    }

    return promotion as Promotion
  }

  async createPromotion(data: CreatePromotionRequest): Promise<Promotion> {
    const response = await api.post('/Promotion', data)
    return response.data
  }

  async updatePromotion(id: number, data: UpdatePromotionRequest): Promise<Promotion> {
    const response = await api.put(`/Promotion/${id}`, data)
    return response.data
  }

  async activatePromotion(id: number): Promise<void> {
    await api.put(`/Promotion/${id}/activate`)
  }

  async deactivatePromotion(id: number): Promise<void> {
    await api.put(`/Promotion/${id}/deactivate`)
  }

  async applyPromotionToBooking(bookingId: number, data: ApplyPromotionRequest): Promise<void> {
    await api.post(`/Promotion/bookings/${bookingId}/apply`, data)
  }

  async removePromotionFromBooking(bookingId: number, promotionCode: string): Promise<void> {
    await api.delete(`/Promotion/bookings/${bookingId}/${promotionCode}`)
  }

  async getBookingPromotions(bookingId: number): Promise<Promotion[]> {
    const response = await api.get(`/Promotion/bookings/${bookingId}`)
    return response.data
  }

  async applyPromotionToOrder(orderId: number, data: ApplyPromotionRequest): Promise<void> {
    await api.post(`/Promotion/orders/${orderId}/apply`, data)
  }

  async removePromotionFromOrder(orderId: number, promotionCode: string): Promise<void> {
    await api.delete(`/Promotion/orders/${orderId}/${promotionCode}`)
  }

  async getOrderPromotions(orderId: number): Promise<Promotion[]> {
    const response = await api.get(`/Promotion/orders/${orderId}`)
    return response.data
  }

  async getCustomerPromotions(customerId: number): Promise<Promotion[]> {
    const response = await api.get(`/Promotion/customers/${customerId}/promotions`)
    return response.data
  }

  async saveCustomerPromotion(customerId: number, data: ApplyPromotionRequest): Promise<void> {
    await api.post(`/Promotion/customers/${customerId}/promotions`, data)
  }

  async getPromotionUsage(customerId: number): Promise<PromotionUsage[]> {
    const response = await api.get(`/Promotion/promotions/usage?customerId=${customerId}`)
    return response.data
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('PromotionService: Testing API connection...')
      const response = await api.get('/Promotion')
      console.log('PromotionService: API connection successful')
      return true
    } catch (error) {
      console.error('PromotionService: API connection failed:', error)
      return false
    }
  }

  async getAllPromotions(): Promise<Promotion[]> {
    try {
      console.log('PromotionService: Getting all promotions without pagination...')
      
      const result = await this.getPromotions({ pageSize: 1000, pageNumber: 1 })
      
      console.log('PromotionService: Got data from API -', result.data.length, 'promotions')
      return result.data
    } catch (error) {
      console.error('PromotionService: Error in getAllPromotions:', error)
      throw error
    }
  }

}

export const promotionService = new PromotionService()
export default promotionService

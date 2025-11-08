import api from './api'
import type { Promotion as AdminPromotion, PromotionResponse as AdminPromotionResponse } from '@/types/promotion'
// Backend response structure
export interface BackendPromotion {
    promotionId: number
    code: string
    description: string
    discountValue: number
    discountType: 'FIXED' | 'PERCENT'  // Database format
    minOrderAmount: number
    startDate: string
    endDate: string
    maxDiscount: number
    status: string
    createdAt: string
    updatedAt: string
    usageLimit: number
    usageCount: number
    isActive: boolean
    isExpired: boolean
    isUsageLimitReached: boolean
    remainingUsage: number
}

export interface BackendPromotionResponse {
    success: boolean
    message: string
    data: {
        promotions: BackendPromotion[]
        pageNumber: number
        pageSize: number
        totalPages: number
        totalCount: number
        hasPreviousPage: boolean
        hasNextPage: boolean
    }
}

// Use admin types for the UI
export type Promotion = AdminPromotion
export type PromotionResponse = AdminPromotionResponse

// Helper function to map backend data to frontend format
const mapBackendToFrontend = (backendPromotion: BackendPromotion): AdminPromotion => {
    return {
        promotionId: backendPromotion.promotionId,
        code: backendPromotion.code,
        description: backendPromotion.description,
        discountValue: backendPromotion.discountValue,
        discountType: backendPromotion.discountType === 'PERCENT' ? 'PERCENT' : 'FIXED',
        minOrderAmount: backendPromotion.minOrderAmount,
        startDate: backendPromotion.startDate,
        endDate: backendPromotion.endDate,
        maxDiscount: backendPromotion.maxDiscount,
        status: (backendPromotion.status as any) || (backendPromotion.isActive ? 'ACTIVE' : (backendPromotion.isExpired ? 'EXPIRED' : 'INACTIVE')),
        createdAt: backendPromotion.createdAt,
        updatedAt: backendPromotion.updatedAt,
        usageLimit: backendPromotion.usageLimit,
        usageCount: backendPromotion.usageCount,
        isActive: backendPromotion.isActive,
        isExpired: backendPromotion.isExpired,
        isUsageLimitReached: backendPromotion.isUsageLimitReached,
        remainingUsage: backendPromotion.remainingUsage
    }
}

export const PromotionService = {
    async getPromotions(filters: { pageNumber?: number; pageSize?: number; searchTerm?: string; status?: string; promotionType?: string }): Promise<{ data: AdminPromotion[]; totalCount: number; pageNumber: number; totalPages: number; pageSize: number }> {
        try {
            const { data } = await api.get<BackendPromotionResponse>('/promotion', {
                params: {
                    pageNumber: filters.pageNumber ?? 1,
                    pageSize: filters.pageSize ?? 10,
                    searchTerm: filters.searchTerm ?? '',
                    status: filters.status,
                    promotionType: filters.promotionType
                }
            })

            const mapped: AdminPromotion[] = (data.data?.promotions || []).map(mapBackendToFrontend)
            return {
                data: mapped,
                totalCount: data.data?.totalCount || mapped.length,
                pageNumber: data.data?.pageNumber || (filters.pageNumber ?? 1),
                totalPages: data.data?.totalPages || 1,
                pageSize: data.data?.pageSize || (filters.pageSize ?? 10)
            }
        } catch (error: any) {

            return {
                data: [],
                totalCount: 0,
                pageNumber: filters.pageNumber ?? 1,
                totalPages: 0,
                pageSize: filters.pageSize ?? 10
            }
        }
    },
  async applyCouponToOrder(orderId: number, code: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { data } = await api.post(`/promotion/orders/${orderId}/apply`, { code })
      return data
    } catch (error) {
      throw error
    }
  },
  async getSavedPromotionsByCustomer(customerId: number): Promise<{ success: boolean; message?: string; data?: Array<{ code?: string; description?: string; discountAmount?: number; status?: string }> }> {
    try {
      const { data } = await api.get(`/promotion/customers/${customerId}/promotions`)
      return data
    } catch (error) {
      throw error
    }
  },
  async getAvailablePromotions(): Promise<{ success: boolean; message?: string; data?: AdminPromotion[] }> {
    try {
      const { data } = await api.get<BackendPromotionResponse>('/Promotion/promotions')
      // Map backend promotions to frontend format
      if (data.success && data.data?.promotions) {
        const mappedPromotions = data.data.promotions.map(mapBackendToFrontend)
        return {
          success: true,
          data: mappedPromotions
        }
      }
      return {
        success: true,
        data: []
      }
    } catch (error: any) {
      console.error('Get promotions error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy danh sách promotion',
        data: []
      }
    }
  },
  async validatePublic(code: string, orderAmount: number, orderType: 'ORDER' | 'BOOKING' = 'ORDER'): Promise<{ success: boolean; message?: string; data?: { isValid?: boolean; message?: string; discountAmount?: number } }> {
    try {
      const { data } = await api.post(`/promotion/validate`, { Code: code, OrderAmount: orderAmount, OrderType: orderType })
      return data
    } catch (error: any) {
      // Surface backend error shape
      if (error?.response?.data) return error.response.data
      throw error
    }
  },
    async getActivePromotions(): Promise<AdminPromotionResponse> {
        try {
            const { data } = await api.get<BackendPromotionResponse>('/promotion/active')

            if (data.success && data.data.promotions) {
                // Map backend promotions to frontend format
                const mappedPromotions = data.data.promotions.map(mapBackendToFrontend)

                return {
                    data: mappedPromotions as AdminPromotion[],
                    totalCount: mappedPromotions.length,
                    pageNumber: 1,
                    pageSize: mappedPromotions.length,
                    totalPages: 1
                }
            } else {
                return {
                    data: [],
                    totalCount: 0,
                    pageNumber: 1,
                    pageSize: 0,
                    totalPages: 0
                }
            }
        } catch (error: any) {

            return {
                data: [],
                totalCount: 0,
                pageNumber: 1,
                pageSize: 0,
                totalPages: 0
            }
        }
    },

    async getPromotionById(id: string): Promise<AdminPromotionResponse> {
        try {
            const { data } = await api.get<PromotionResponse>(`/promotion/${id}`)
            return data
        } catch (error: any) {

            return {
                data: [],
                totalCount: 0,
                pageNumber: 1,
                pageSize: 0,
                totalPages: 0
            }
        }
    },
    async createPromotion(payload: any): Promise<any> {
        try {
            const { data } = await api.post('/promotion', payload)
            return data
        } catch (error) {
            throw error
        }
    },
    async updatePromotion(id: number, payload: any): Promise<any> {
        try {
            const { data } = await api.put(`/promotion/${id}`, payload)
            return data
        } catch (error) {
            throw error
        }
    },
    async activatePromotion(id: number): Promise<any> {
        try {
            const { data } = await api.put(`/promotion/${id}/activate`)
            return data
        } catch (error) {
            throw error
        }
    },
    async deactivatePromotion(id: number): Promise<any> {
        try {
            const { data } = await api.put(`/promotion/${id}/deactivate`)
            return data
        } catch (error) {
            throw error
        }
    },
    async exportPromotions(): Promise<Blob> {
        try {
            const response = await api.get('/promotion/export', {
                responseType: 'blob'
            })
            return response.data
        } catch (error: any) {

            throw error
        }
    }
}

export default PromotionService

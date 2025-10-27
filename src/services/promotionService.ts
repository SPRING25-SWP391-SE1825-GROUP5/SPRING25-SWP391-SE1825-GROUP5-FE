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
            console.error('Get promotions error:', error)
            return {
                data: [],
                totalCount: 0,
                pageNumber: filters.pageNumber ?? 1,
                totalPages: 0,
                pageSize: filters.pageSize ?? 10
            }
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
            console.error('Get active promotions error:', error)

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
            console.error('Get promotion by ID error:', error)

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
    }
}

export default PromotionService

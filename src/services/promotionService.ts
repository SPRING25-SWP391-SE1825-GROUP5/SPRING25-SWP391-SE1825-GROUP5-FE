import api from './api'

// Backend response structure
export interface BackendPromotion {
    promotionId: number
    code: string
    description: string
    discountValue: number
    discountType: 'FIXED' | 'PERCENT'
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

// Frontend promotion interface
export interface Promotion {
    id: string
    code: string
    title: string
    description: string
    type: 'percentage' | 'fixed' | 'shipping'
    value: number
    minOrder?: number
    maxDiscount?: number
    validFrom: string
    validTo: string
    isActive: boolean
    usageLimit?: number
    usedCount: number
    category?: string[]
    image?: string
}

export interface PromotionResponse {
    success: boolean
    message: string
    data: Promotion[]
    errors?: string[]
}

// Helper function to map backend data to frontend format
const mapBackendToFrontend = (backendPromotion: BackendPromotion): Promotion => {
    return {
        id: backendPromotion.promotionId.toString(),
        code: backendPromotion.code,
        title: backendPromotion.description, // Use description as title
        description: backendPromotion.description,
        type: backendPromotion.discountType === 'PERCENT' ? 'percentage' : 'fixed',
        value: backendPromotion.discountValue,
        minOrder: backendPromotion.minOrderAmount,
        maxDiscount: backendPromotion.maxDiscount,
        validFrom: backendPromotion.startDate,
        validTo: backendPromotion.endDate,
        isActive: backendPromotion.isActive,
        usageLimit: backendPromotion.usageLimit,
        usedCount: backendPromotion.usageCount,
        category: [], // Backend doesn't provide category
        image: undefined // Backend doesn't provide image
    }
}

export const PromotionService = {
    async getActivePromotions(): Promise<PromotionResponse> {
        try {
            const { data } = await api.get<BackendPromotionResponse>('/promotion/active')

            if (data.success && data.data.promotions) {
                // Map backend promotions to frontend format
                const mappedPromotions = data.data.promotions.map(mapBackendToFrontend)

                return {
                    success: true,
                    message: data.message,
                    data: mappedPromotions
                }
            } else {
                return {
                    success: false,
                    message: data.message || 'Không thể tải danh sách khuyến mãi',
                    data: []
                }
            }
        } catch (error: any) {
            console.error('Get active promotions error:', error)

            return {
                success: false,
                message: error?.userMessage || error?.message || 'Không thể tải danh sách khuyến mãi. Vui lòng thử lại.',
                data: [],
                errors: error?.response?.data?.errors || [error?.userMessage || error?.message || 'Lỗi tải khuyến mãi']
            }
        }
    },

    async getPromotionById(id: string): Promise<PromotionResponse> {
        try {
            const { data } = await api.get<PromotionResponse>(`/promotion/${id}`)
            return data
        } catch (error: any) {
            console.error('Get promotion by ID error:', error)

            return {
                success: false,
                message: error?.userMessage || error?.message || 'Không thể tải thông tin khuyến mãi. Vui lòng thử lại.',
                data: [],
                errors: error?.response?.data?.errors || [error?.userMessage || error?.message || 'Lỗi tải khuyến mãi']
            }
        }
    }
}

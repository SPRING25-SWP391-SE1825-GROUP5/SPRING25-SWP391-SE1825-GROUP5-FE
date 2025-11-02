import api from './api'
import type { Promotion } from '@/types/promotion'

export interface PromotionValidationRequest {
    code: string
    orderAmount: number
    orderType: 'BOOKING' | 'ORDER'
}

export interface PromotionValidationResponse {
    isValid: boolean
    message: string
    discountAmount: number
    finalAmount: number
    promotion?: Promotion
}

export interface ApplyPromotionRequest {
    bookingId: number
    code: string
}

export interface RemovePromotionRequest {
    bookingId: number
    promotionCode: string
}

export interface BookingPromotionInfo {
    code: string
    description: string
    discountAmount: number
    usedAt: string
    status: string
    endDate?: string
    startDate?: string
    // Additional fields from backend response
    userPromotionStatus?: string // SAVED, APPLIED, USED
    discountValue?: number
    discountType?: string // PERCENT, FIXED
    maxDiscount?: number
}

export interface SavedPromotionResponse {
    success: boolean
    data: SavedPromotion[]
}

export interface SavedPromotion {
    promotionId: number
    code: string
    description: string
    discountValue: number
    discountType: 'FIXED_AMOUNT' | 'PERCENT'
    minOrderAmount: number
    startDate: string
    endDate: string
    maxDiscount: number | null
    status: string
    usageLimit: number
    usageCount: number
    remainingUsage: number
    isActive: boolean
    isExpired: boolean
    isUsageLimitReached: boolean
    createdAt: string
    updatedAt: string
    bookingId: number | null
    orderId: number | null
    userPromotionStatus: string
    discountAmount: number
    usedAt: string | null
}

/**
 * Service for handling promotion operations in booking context
 * Provides APIs for public customers to use promotions
 */
export const PromotionBookingService = {
    /**
     * Validate a promotion code for a booking
     * This endpoint should be accessible to public customers
     */
    async validatePromotion(request: PromotionValidationRequest): Promise<PromotionValidationResponse> {
        try {
            const { data } = await api.post<{ success: boolean; data: PromotionValidationResponse }>('/promotion/validate', request)

            if (!data.success) {
                throw new Error('Validation failed')
            }

            return data.data
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
            throw new Error(message || 'Lỗi xác thực mã khuyến mãi')
        }
    },

    /**
     * Apply a promotion to a booking
     * Requires authentication (customer must be logged in)
     */
    async applyPromotionToBooking(request: ApplyPromotionRequest): Promise<{ success: boolean; message: string; data?: PromotionValidationResponse }> {
        try {
            const { data } = await api.post(`/promotion/bookings/${request.bookingId}/apply`, {
                code: request.code
            })

            return data
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
            throw new Error(message || 'Lỗi áp dụng mã khuyến mãi')
        }
    },

    /**
     * Remove a promotion from a booking
     * Requires authentication (customer must be logged in)
     */
    async removePromotionFromBooking(request: RemovePromotionRequest): Promise<{ success: boolean; message: string }> {
        try {
            const { data } = await api.delete(`/promotion/bookings/${request.bookingId}/${request.promotionCode}`)

            return data
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
            throw new Error(message || 'Lỗi gỡ bỏ mã khuyến mãi')
        }
    },

    /**
     * Get promotions applied to a booking
     * Requires authentication (customer must be logged in)
     */
    async getBookingPromotions(bookingId: number): Promise<BookingPromotionInfo[]> {
        try {
            const { data } = await api.get(`/promotion/bookings/${bookingId}`)

            if (!data.success) {
                throw new Error('Failed to get booking promotions')
            }

            return data.data || []
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
            throw new Error(message || 'Lỗi lấy thông tin khuyến mãi')
        }
    },

    /**
     * Get customer's saved promotions with full details
     * Requires authentication (customer must be logged in)
     * CustomerId is automatically extracted from JWT token
     */
    async getSavedPromotions(): Promise<SavedPromotion[]> {
        try {
            const { data } = await api.get<SavedPromotionResponse>('/Promotion/promotions')

            if (!data.success) {
                throw new Error('Failed to get saved promotions')
            }

            return data.data || []
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
            throw new Error(message || 'Lỗi lấy danh sách mã khuyến mãi đã lưu')
        }
    },

    /**
     * Save a promotion for customer (without applying to booking)
     * Requires authentication (customer must be logged in)
     * CustomerId is automatically extracted from JWT token
     */
    async saveCustomerPromotion(code: string): Promise<{ success: boolean; message: string }> {
        try {
            const { data } = await api.post('/Promotion/promotions', {
                code: code.trim().toUpperCase()
            })

            return data
        } catch (error: unknown) {
            const err = error as { 
                response?: { 
                    data?: { 
                        message?: string
                        errorMessage?: string
                        error?: string
                    }
                    status?: number
                } 
            }
            
            const errorMessage = err.response?.data?.message 
                || err.response?.data?.errorMessage
                || err.response?.data?.error 
                || (err.response?.status === 500 ? 'Lỗi máy chủ. Vui lòng thử lại sau.' : 'Lỗi lưu mã khuyến mãi')
            
            throw new Error(errorMessage)
        }
    }
}

export default PromotionBookingService

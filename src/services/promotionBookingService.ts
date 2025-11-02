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
        } catch (error: any) {
            console.error('Error validating promotion:', error)
            throw new Error(error.response?.data?.message || 'Lỗi xác thực mã khuyến mãi')
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
        } catch (error: any) {
            console.error('Error applying promotion to booking:', error)
            throw new Error(error.response?.data?.message || 'Lỗi áp dụng mã khuyến mãi')
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
        } catch (error: any) {
            console.error('Error removing promotion from booking:', error)
            throw new Error(error.response?.data?.message || 'Lỗi gỡ bỏ mã khuyến mãi')
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
        } catch (error: any) {
            console.error('Error getting booking promotions:', error)
            throw new Error(error.response?.data?.message || 'Lỗi lấy thông tin khuyến mãi')
        }
    },

    /**
     * Get customer's saved promotions
     * Requires authentication (customer must be logged in)
     * Endpoint: GET /api/Promotion/customers/{customerId}/promotions
     */
    async getCustomerPromotions(customerId: number): Promise<BookingPromotionInfo[]> {
        try {
            console.log('PromotionBookingService.getCustomerPromotions - Loading for customerId:', customerId)
            
            // Use endpoint: GET /api/Promotion/customers/{customerId}/promotions
            const response = await api.get(`/Promotion/customers/${customerId}/promotions`)
            const data = response.data
            
            console.log('PromotionBookingService.getCustomerPromotions - Full response:', data)

            // Handle different response structures
            let promotions: any[] = []
            if (data.success && data.data) {
                promotions = Array.isArray(data.data) ? data.data : []
            } else if (Array.isArray(data)) {
                promotions = data
            } else if (data.data && Array.isArray(data.data)) {
                promotions = data.data
            }

            console.log('PromotionBookingService.getCustomerPromotions - Mapped promotions:', promotions)
            console.log('PromotionBookingService.getCustomerPromotions - Promotions count:', promotions.length)
            
            return promotions.map((p: any) => ({
                code: p.code || '',
                description: p.description || '',
                discountAmount: p.discountAmount || p.discountValue || 0,
                usedAt: p.usedAt || '',
                status: p.userPromotionStatus || p.status || '', // Use userPromotionStatus first
                endDate: p.endDate,
                startDate: p.startDate,
                // Include additional fields for Profile display
                userPromotionStatus: p.userPromotionStatus,
                discountValue: p.discountValue,
                discountType: p.discountType,
                maxDiscount: p.maxDiscount,
            }))
        } catch (error: any) {
            console.error('❌ Error getting customer promotions:', error)
            console.error('❌ Error response:', error.response?.data)
            console.error('❌ Error status:', error.response?.status)
            console.error('❌ Endpoint called: GET /Promotion/customers/' + customerId + '/promotions')
            throw new Error(error.response?.data?.message || error.message || 'Lỗi lấy danh sách khuyến mãi')
        }
    },

    /**
     * Save a promotion for customer (without applying to booking)
     * Requires authentication (customer must be logged in)
     */
    async saveCustomerPromotion(customerId: number, code: string): Promise<{ success: boolean; message: string }> {
        try {
            const { data } = await api.post(`/promotion/customers/${customerId}/promotions`, {
                code: code.trim().toUpperCase()
            })

            return data
        } catch (error: any) {
            console.error('Error saving customer promotion:', error)
            throw new Error(error.response?.data?.message || 'Lỗi lưu mã khuyến mãi')
        }
    }
}

export default PromotionBookingService

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
     */
    async getCustomerPromotions(customerId: number): Promise<BookingPromotionInfo[]> {
        try {
            const { data } = await api.get(`/promotion/customers/${customerId}/promotions`)

            if (!data.success) {
                throw new Error('Failed to get customer promotions')
            }

            return data.data || []
        } catch (error: any) {
            console.error('Error getting customer promotions:', error)
            throw new Error(error.response?.data?.message || 'Lỗi lấy danh sách khuyến mãi')
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

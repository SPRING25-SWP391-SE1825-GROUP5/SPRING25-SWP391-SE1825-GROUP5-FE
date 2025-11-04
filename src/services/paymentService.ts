import api from './api'

// Payment Types and Interfaces
export const PaymentMethod = {
    CASH: 'CASH',
    VNPAY: 'VNPAY',
    QR_CODE: 'QR_CODE',
    BANK_TRANSFER: 'BANK_TRANSFER',
    CREDIT_CARD: 'CREDIT_CARD'
} as const

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod]

export const PaymentStatus = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED',
    FAILED: 'FAILED',
    COMPLETED: 'COMPLETED'
} as const

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus]

export interface PaymentRequest {
    bookingId: number
    amount: number
    paymentMethod: PaymentMethod
    description?: string
    returnUrl?: string
    cancelUrl?: string
}

export interface PaymentResponse {
    success: boolean
    message: string
    paymentUrl?: string
    qrCode?: string
    data?: {
        paymentId: string
        orderCode: string
        amount: number
        status: PaymentStatus
        paymentUrl?: string
        qrCode?: string
    }
}

export interface VNPayPaymentRequest {
    bookingId: number
    amount: number
    description?: string
    returnUrl?: string
    cancelUrl?: string
}

export interface VNPayPaymentResponse {
    success: boolean
    message: string
    paymentUrl?: string
    data?: {
        paymentUrl: string
        orderCode: string
        amount: number
    }
}

export interface QRPaymentRequest {
    bookingId: number
    amount: number
    description?: string
}

export interface QRPaymentResponse {
    success: boolean
    message: string
    paymentUrl?: string
    qrCode?: string
    data?: {
        qrCode: string
        orderCode: string
        amount: number
    }
}

// Payment Service Class
export class PaymentService {
    /**
     * Tạo thanh toán thông thường
     */
    static async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        const response = await api.post('/Payment/create', request)
        return response.data
    }

    /**
     * Tạo thanh toán VNPay
     */
    static async createVNPayPayment(request: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
        const response = await api.post('/Payment/vnpay/create', request)
        return response.data
    }

    /**
     * Tạo thanh toán QR Code
     */
    static async createQRPayment(request: QRPaymentRequest): Promise<QRPaymentResponse> {
        const response = await api.post('/Payment/qr/create', request)
        return response.data
    }

    /**
     * Lấy trạng thái thanh toán (alias cho checkPaymentStatus)
     */
    static async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
        return this.checkPaymentStatus(paymentId)
    }

    /**
     * Kiểm tra trạng thái thanh toán theo orderCode
     */
    static async checkPaymentStatus(orderCode: string): Promise<PaymentStatusResponse> {
        try {
            const response = await api.get(`/Payment/check-status/${orderCode}`)
            const responseData = response.data
            if (responseData.success && responseData.data) {
                return {
                    success: responseData.success,
                    message: responseData.message,
                    data: {
                        orderCode: responseData.data.orderCode || orderCode,
                        status: responseData.data.status || 'PENDING',
                        amount: responseData.data.amount || 0,
                        bookingId: responseData.data.bookingId,
                        paymentMethod: responseData.data.paymentMethod,
                        transactionId: responseData.data.transactionId,
                        paidAt: responseData.data.paidAt
                    }
                }
            }
            return {
                success: responseData.success || false,
                message: responseData.message || 'Unknown response',
                data: {
                    orderCode: orderCode,
                    status: 'PENDING',
                    amount: 0
                }
            }
        } catch (error) {
            throw error
        }
    }

    /**
     * Xử lý callback từ payment gateway
     */
    static async handlePaymentCallback(params: Record<string, string>) {
        try {
            const orderCode = params.orderCode || params.bookingId
            if (!orderCode) {
                throw new Error('Missing orderCode in payment callback')
            }
            const paymentStatus = await this.checkPaymentStatus(orderCode)
            const result = {
                success: paymentStatus.success,
                status: paymentStatus.data.status,
                orderCode: paymentStatus.data.orderCode,
                amount: paymentStatus.data.amount,
                bookingId: paymentStatus.data.bookingId,
                message: paymentStatus.message
            }
            return result
        } catch (error) {
            const result = {
                success: false,
                status: 'FAILED' as const,
                orderCode: params.orderCode || params.bookingId || '',
                amount: 0,
                bookingId: undefined,
                message: 'Không thể xác minh trạng thái thanh toán'
            }
            return result
        }
    }
}

export interface PaymentStatusResponse {
    success: boolean
    message: string
    status?: PaymentStatus
    failureReason?: string
    data: {
        orderCode: string
        status: 'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED' | 'COMPLETED'
        amount: number
        bookingId?: number
        paymentMethod?: string
        transactionId?: string
        paidAt?: string
    }
}

// Interface cho response thực tế từ API (có thể khác)
export interface ActualPaymentStatusResponse {
    success: boolean
    message: string
    data?: any // Flexible để handle response structure khác nhau
}

// Export individual functions for backward compatibility
export const checkPaymentStatus = PaymentService.checkPaymentStatus
export const handlePaymentCallback = PaymentService.handlePaymentCallback
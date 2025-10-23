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
        try {
            console.log('Creating payment:', request)
            const response = await api.post('/Payment/create', request)
            console.log('Payment creation response:', response.data)
            return response.data
        } catch (error) {
            console.error('Error creating payment:', error)
            throw error
        }
    }

    /**
     * Tạo thanh toán VNPay
     */
    static async createVNPayPayment(request: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
        try {
            console.log('Creating VNPay payment:', request)
            const response = await api.post('/Payment/vnpay/create', request)
            console.log('VNPay payment creation response:', response.data)
            return response.data
        } catch (error) {
            console.error('Error creating VNPay payment:', error)
            throw error
        }
    }

    /**
     * Tạo thanh toán QR Code
     */
    static async createQRPayment(request: QRPaymentRequest): Promise<QRPaymentResponse> {
        try {
            console.log('Creating QR payment:', request)
            const response = await api.post('/Payment/qr/create', request)
            console.log('QR payment creation response:', response.data)
            return response.data
        } catch (error) {
            console.error('Error creating QR payment:', error)
            throw error
        }
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
            console.log('Checking payment status for orderCode:', orderCode)
            const response = await api.get(`/Payment/check-status/${orderCode}`)
            console.log('Payment status API response:', response.data)

            // Xử lý response structure khác nhau
            const responseData = response.data

            // Nếu API trả về structure khác, map lại
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

            // Fallback nếu structure không đúng
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
            console.error('Error checking payment status:', error)
            throw error
        }
    }

    /**
     * Xử lý callback từ payment gateway
     */
    static async handlePaymentCallback(params: Record<string, string>) {
        try {
            console.log('Payment callback params:', params)
            const orderCode = params.orderCode || params.bookingId
            if (!orderCode) {
                console.error('Missing orderCode in payment callback params:', params)
                throw new Error('Missing orderCode in payment callback')
            }

            console.log('Processing payment callback for orderCode:', orderCode)

            // Kiểm tra trạng thái thanh toán từ API
            const paymentStatus = await this.checkPaymentStatus(orderCode)
            console.log('Payment status result:', paymentStatus)

            const result = {
                success: paymentStatus.success,
                status: paymentStatus.data.status,
                orderCode: paymentStatus.data.orderCode,
                amount: paymentStatus.data.amount,
                bookingId: paymentStatus.data.bookingId,
                message: paymentStatus.message
            }

            console.log('Payment callback result:', result)
            return result
        } catch (error) {
            console.error('Error handling payment callback:', error)
            const result = {
                success: false,
                status: 'FAILED' as const,
                orderCode: params.orderCode || params.bookingId || '',
                amount: 0,
                bookingId: undefined,
                message: 'Không thể xác minh trạng thái thanh toán'
            }
            console.log('Payment callback error result:', result)
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
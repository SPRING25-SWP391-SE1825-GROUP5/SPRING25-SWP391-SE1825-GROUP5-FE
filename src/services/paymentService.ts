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
     * Tạo link thanh toán VNPay cho Booking (theo spec mới)
     */
    static async createBookingVNPayLink(bookingId: number): Promise<{ success: boolean; message: string; vnp_Url?: string }> {
        const { data } = await api.post(`/Payment/booking/${bookingId}/vnpay-link`)
        return data
    }

    /**
     * Tạo thanh toán QR Code
     */
    static async createQRPayment(request: QRPaymentRequest): Promise<QRPaymentResponse> {
        const response = await api.post('/Payment/qr/create', request)
        return response.data
    }

    /**
     * Tạo QR Sepay cho Booking (theo spec mới)
     */
    static async createBookingSepayQR(bookingId: number): Promise<{ success: boolean; message: string; data?: { qrCode: string; orderCode: string; amount: number } }> {
        const { data } = await api.post(`/Payment/booking/${bookingId}/sepay-qr`)
        return data
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
     * Lấy kết quả thanh toán (theo spec mới)
     */
    static async getPaymentResult(orderCode: string): Promise<PaymentStatusResponse> {
        const { data } = await api.get(`/payment/result`, { params: { orderCode } })
        if (data?.success && data?.data) {
            return {
                success: true,
                message: data.message || 'OK',
                data: {
                    orderCode: data.data.orderCode || orderCode,
                    status: data.data.status,
                    amount: data.data.amount,
                    bookingId: data.data.bookingId,
                    paymentMethod: data.data.paymentMethod,
                    transactionId: data.data.transactionId,
                    paidAt: data.data.paidAt,
                },
            }
        }
        return {
            success: false,
            message: data?.message || 'Unknown',
            data: { orderCode, status: 'PENDING', amount: 0 },
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

    /**
     * Lấy breakdown (chi tiết hóa đơn) cho booking
     */
    static async getBookingBreakdown(bookingId: number): Promise<PaymentBreakdownResponse> {
        const { data } = await api.get(`/Payment/booking/${bookingId}/breakdown`)
        return data
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

// Payment Breakdown Interfaces
export interface PaymentBreakdownPart {
    partId: number
    name: string
    qty: number
    unitPrice: number
    amount: number
    referenceUnitPrice?: number // Cho phụ tùng khách cung cấp
    sourceOrderItemId?: number // Cho phụ tùng khách cung cấp
}

export interface PaymentBreakdownResponse {
    success: boolean
    message?: string
    data: {
        bookingId: number
        service: {
            name: string
            basePrice: number
        }
        package: {
            applied: boolean
            firstTimePrice: number
            discountAmount: number
        }
        // Backend có thể trả về parts là array hoặc object với fromInventory và fromCustomer
        parts?: PaymentBreakdownPart[] | {
            fromInventory?: PaymentBreakdownPart[]
            fromCustomer?: PaymentBreakdownPart[]
        }
        partsAmount: number
        promotion: {
            applied: boolean
            discountAmount: number
        }
        subtotal: number
        total: number
        notes?: string // "Khuyến mãi chỉ áp dụng cho phần dịch vụ/gói; phụ tùng không áp dụng khuyến mãi."
    }
}

// Export individual functions for backward compatibility
export const checkPaymentStatus = PaymentService.checkPaymentStatus
export const handlePaymentCallback = PaymentService.handlePaymentCallback
import api from './api'

// Payment Types
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'QR_CODE' | 'VNPAY'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export type PaymentRequest = {
    bookingId: number
    amount: number
    paymentMethod: PaymentMethod
    description?: string
    returnUrl?: string
    cancelUrl?: string
}

export type PaymentResponse = {
    paymentId: string
    bookingId: number
    amount: number
    paymentMethod: PaymentMethod
    status: PaymentStatus
    paymentUrl?: string
    qrCode?: string
    transactionId?: string
    createdAt: string
    expiresAt?: string
}

export type PaymentStatusResponse = {
    paymentId: string
    bookingId: number
    status: PaymentStatus
    amount: number
    paymentMethod: PaymentMethod
    transactionId?: string
    paidAt?: string
    failureReason?: string
}

export type VNPayPaymentRequest = {
    bookingId: number
    amount: number
    description: string
    returnUrl: string
    cancelUrl: string
}

export type VNPayPaymentResponse = {
    paymentUrl: string
    transactionId: string
    expiresAt: string
}

export type QRPaymentRequest = {
    bookingId: number
    amount: number
    description: string
}

export type QRPaymentResponse = {
    qrCode: string
    paymentId: string
    expiresAt: string
}

export const PaymentService = {
    // Create payment for booking
    async createPayment(payment: PaymentRequest): Promise<PaymentResponse> {
        const { data } = await api.post('/payment', payment)
        console.log('createPayment response:', data)

        if (data.success && data.data) {
            return data.data
        } else if (data.paymentId) {
            return data
        } else {
            throw new Error('Invalid response format from server')
        }
    },

    // Get payment status
    async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
        const { data } = await api.get(`/payment/${paymentId}/status`)
        console.log('getPaymentStatus response:', data)

        if (data.success && data.data) {
            return data.data
        } else if (data.paymentId) {
            return data
        } else {
            throw new Error('Invalid response format from server')
        }
    },

    // Create VNPay payment
    async createVNPayPayment(vnpayPayment: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
        const { data } = await api.post('/payment/vnpay', vnpayPayment)
        console.log('createVNPayPayment response:', data)

        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response format from server')
        }
    },

    // Create QR payment
    async createQRPayment(qrPayment: QRPaymentRequest): Promise<QRPaymentResponse> {
        const { data } = await api.post('/payment/qr', qrPayment)
        console.log('createQRPayment response:', data)

        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response format from server')
        }
    },

    // Process payment callback (for VNPay, QR, etc.)
    async processPaymentCallback(paymentId: string, callbackData: any): Promise<PaymentStatusResponse> {
        const { data } = await api.post(`/payment/${paymentId}/callback`, callbackData)
        console.log('processPaymentCallback response:', data)

        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response format from server')
        }
    },

    // Cancel payment
    async cancelPayment(paymentId: string): Promise<PaymentStatusResponse> {
        const { data } = await api.put(`/payment/${paymentId}/cancel`)
        console.log('cancelPayment response:', data)

        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response format from server')
        }
    },

    // Refund payment
    async refundPayment(paymentId: string, reason?: string): Promise<PaymentStatusResponse> {
        const { data } = await api.post(`/payment/${paymentId}/refund`, { reason })
        console.log('refundPayment response:', data)

        if (data.success && data.data) {
            return data.data
        } else {
            throw new Error('Invalid response format from server')
        }
    },

    // Get payment history for user
    async getPaymentHistory(params: {
        pageNumber?: number
        pageSize?: number
        status?: PaymentStatus
        paymentMethod?: PaymentMethod
    } = {}): Promise<{
        payments: PaymentResponse[]
        pageNumber: number
        pageSize: number
        totalPages: number
        totalCount: number
        hasPreviousPage: boolean
        hasNextPage: boolean
    }> {
        const { data } = await api.get('/payment/history', { params })
        console.log('getPaymentHistory response:', data)

        if (data.success && data.data) {
            return data.data
        } else if (data.payments) {
            return data
        } else {
            throw new Error('Invalid response format from server')
        }
    }
}

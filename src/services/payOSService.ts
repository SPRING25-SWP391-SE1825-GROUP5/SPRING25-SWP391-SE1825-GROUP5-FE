import api from './api'

export interface PayOSPaymentInfo {
  checkoutUrl: string
  qrCode?: string
  orderCode: number
  amount: number
  description: string
  status: string
}

export interface PayOSResponse {
  success: boolean
  data?: PayOSPaymentInfo
  message?: string
}

export class PayOSService {
  /**
   * Tạo link thanh toán PayOS cho booking
   */
  static async createPaymentLink(bookingId: number): Promise<PayOSResponse> {
    try {
      const response = await api.post(`/payment/booking/${bookingId}/link`)
      return {
        success: true,
        data: {
          checkoutUrl: response.data.checkoutUrl,
          orderCode: response.data.orderCode || 0,
          amount: response.data.amount || 0,
          description: response.data.description || '',
          status: 'PENDING'
        }
      }
    } catch (error: any) {
      console.error('Error creating PayOS payment link:', error)

      // Handle specific error cases
      const errorMessage = error.response?.data?.message || 'Lỗi tạo link thanh toán'

      // Nếu đơn thanh toán đã tồn tại, thử lấy link hiện tại
      if (errorMessage.includes('đã tồn tại') || errorMessage.includes('already exists')) {
        console.log('Payment link already exists, trying to get existing link...')
        try {
          // Thử lấy thông tin thanh toán hiện tại
          const existingPayment = await this.getExistingPaymentLink(bookingId)
          if (existingPayment.success) {
            return existingPayment
          }
        } catch (getError) {
          console.error('Error getting existing payment link:', getError)
        }
      }

      return {
        success: false,
        message: errorMessage
      }
    }
  }

  /**
   * Lấy link thanh toán hiện tại nếu đã tồn tại
   */
  static async getExistingPaymentLink(bookingId: number): Promise<PayOSResponse> {
    try {
      const response = await api.get(`/payment/booking/${bookingId}/link`)
      return {
        success: true,
        data: {
          checkoutUrl: response.data.checkoutUrl,
          orderCode: response.data.orderCode || 0,
          amount: response.data.amount || 0,
          description: response.data.description || '',
          status: response.data.status || 'PENDING'
        }
      }
    } catch (error: any) {
      console.error('Error getting existing payment link:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi lấy link thanh toán hiện tại'
      }
    }
  }

  /**
   * Lấy thông tin thanh toán từ PayOS
   */
  static async getPaymentInfo(orderCode: number): Promise<PayOSResponse> {
    try {
      const response = await api.get(`/payment/status/${orderCode}`)
      return response.data
    } catch (error: any) {
      console.error('Error getting PayOS payment info:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi lấy thông tin thanh toán'
      }
    }
  }

  /**
   * Lấy QR code từ PayOS
   */
  static async getPaymentQRCode(orderCode: number): Promise<PayOSResponse> {
    try {
      const response = await api.get(`/payment/qr/${orderCode}`)
      return response.data
    } catch (error: any) {
      console.error('Error getting PayOS QR code:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi lấy QR code'
      }
    }
  }

  /**
   * Hủy link thanh toán PayOS
   */
  static async cancelPaymentLink(orderCode: number): Promise<PayOSResponse> {
    try {
      const response = await api.delete(`/payment/cancel/${orderCode}`)
      return response.data
    } catch (error: any) {
      console.error('Error canceling PayOS payment link:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi hủy link thanh toán'
      }
    }
  }
}

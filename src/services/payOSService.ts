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
          orderCode: 0, // Sẽ được lấy từ PayOS response
          amount: 0,
          description: '',
          status: 'PENDING'
        }
      }
    } catch (error: any) {
      console.error('Error creating PayOS payment link:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi tạo link thanh toán'
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

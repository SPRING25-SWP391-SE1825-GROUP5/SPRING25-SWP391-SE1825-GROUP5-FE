import api from './api'

export interface QuickOrderItemRequest {
  partId: number
  quantity: number
}

export interface QuickOrderRequest {
  items: QuickOrderItemRequest[]
  notes?: string
  shippingAddress?: string
}

export interface QuickOrderResponse {
  success: boolean
  message: string
  data?: any
}

export const OrderService = {
  async createQuickOrder(customerId: number, payload: QuickOrderRequest): Promise<QuickOrderResponse> {
    const { data } = await api.post<QuickOrderResponse>(`/Order/customers/${customerId}/orders/quick`, payload)
    return data
  },
  async getOrderById(orderId: number): Promise<{ success: boolean; message: string; data?: any }> {
    const { data } = await api.get(`/Order/${orderId}`)
    return data
  },
  async getOrderItems(orderId: number): Promise<{ success: boolean; message: string; data?: any[] }> {
    const { data } = await api.get(`/Order/${orderId}/items`)
    return data
  },
  async checkoutOnline(orderId: number): Promise<{ success: boolean; message?: string; checkoutUrl?: string }> {
    try {
      const { data } = await api.post(`/Order/${orderId}/checkout/online`)
      return data
    } catch (e: any) {
      // Trả về payload lỗi từ BE để FE có thể phân nhánh (ví dụ code 231: đã tồn tại)
      const data = e?.response?.data
      if (data) return data
      throw e
    }
  },
  async getPaymentLink(orderId: number): Promise<{ success: boolean; message?: string; checkoutUrl?: string }> {
    const { data } = await api.get(`/Order/${orderId}/payment/link`)
    return data
  },
  // Ghi chú: Endpoint apply-coupon không tồn tại trong BE hiện tại. Chờ BE bổ sung.
}



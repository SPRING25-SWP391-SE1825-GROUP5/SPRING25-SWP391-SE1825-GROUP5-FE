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
    const { data } = await api.post(`/Order/${orderId}/checkout/online`)
    return data
  },
  // Ghi chú: Endpoint apply-coupon không tồn tại trong BE hiện tại. Chờ BE bổ sung.
}



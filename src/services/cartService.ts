import api from './api'

export interface AddCartItemRequest {
  partId: number
  quantity: number
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

export const CartService = {
  async getCartByCustomer(customerId: number): Promise<ApiResponse<{ cartId: number }>> {
    const { data } = await api.get<ApiResponse<{ cartId: number }>>(`/Cart/customer/${customerId}`)
    return data
  },

  async getCartItems(customerId: number): Promise<ApiResponse<Array<any>>> {
    const { data } = await api.get<ApiResponse<Array<any>>>(`/Cart/customer/${customerId}/items`)
    return data
  },

  async addItem(customerId: number, payload: AddCartItemRequest): Promise<ApiResponse> {
    const { data } = await api.post<ApiResponse>(`/Cart/customer/${customerId}/items`, payload)
    return data
  },

  async updateItem(customerId: number, partId: number, payload: { quantity: number }): Promise<ApiResponse> {
    const { data } = await api.put<ApiResponse>(`/Cart/customer/${customerId}/items/${partId}`, payload)
    return data
  },

  async removeItem(customerId: number, partId: number): Promise<ApiResponse> {
    const { data } = await api.delete<ApiResponse>(`/Cart/customer/${customerId}/items/${partId}`)
    return data
  },

  async clearItems(customerId: number): Promise<ApiResponse> {
    const { data } = await api.delete<ApiResponse>(`/Cart/customer/${customerId}/items`)
    return data
  },

  async updateFulfillmentCenter(customerId: number, fulfillmentCenterId: number): Promise<ApiResponse> {
    const { data } = await api.put<ApiResponse>(`/Cart/customer/${customerId}/fulfillment-center`, { fulfillmentCenterId })
    return data
  },

  async checkout(customerId: number): Promise<ApiResponse<{ orderId: number; checkoutUrl?: string }>> {
    const { data } = await api.post<ApiResponse<{ orderId: number; checkoutUrl?: string }>>(`/Cart/customer/${customerId}/checkout`)
    return data
  }
}



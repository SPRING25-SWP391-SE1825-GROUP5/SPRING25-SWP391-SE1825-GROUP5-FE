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

  async getCartItems(cartId: number): Promise<ApiResponse<Array<any>>> {
    const { data } = await api.get<ApiResponse<Array<any>>>(`/Cart/${cartId}/items`)
    return data
  },

  async addItem(cartId: number, payload: AddCartItemRequest): Promise<ApiResponse> {
    const { data } = await api.post<ApiResponse>(`/Cart/${cartId}/items`, payload)
    return data
  },

  // Optional helper in case backend supports it; unused if not available
  async getMyCart(): Promise<ApiResponse<{ cartId: number }>> {
    const { data } = await api.get<ApiResponse<{ cartId: number }>>('/Cart/me')
    return data
  }
}



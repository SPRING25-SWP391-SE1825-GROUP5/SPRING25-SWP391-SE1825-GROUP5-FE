import api from './api'

export interface QuickOrderItemRequest {
  partId: number
  quantity: number
}

export interface QuickOrderRequest {
  items: QuickOrderItemRequest[]
  notes?: string
  shippingAddress?: string
  fulfillmentCenterId?: number  // Center được chọn từ FE để fulfill order
}

export interface CreateOrderRequest {
  items: QuickOrderItemRequest[]
  notes?: string
  shippingAddress?: string
  fulfillmentCenterId?: number  // Center được chọn từ FE để fulfill order
}

export interface CreateOrderResponse {
  success: boolean
  message: string
  data?: {
    orderId?: number
    OrderId?: number
    id?: number
  }
}

export interface QuickOrderResponse {
  success: boolean
  message: string
  data?: any
}

export const OrderService = {
  async getByCustomerId(customerId: number): Promise<{ success: boolean; message?: string; data?: any[] }> {
    const { data } = await api.get(`/Order/customer/${customerId}`)
    return data
  },
  async createOrder(customerId: number, payload: CreateOrderRequest): Promise<CreateOrderResponse> {
    const { data } = await api.post<CreateOrderResponse>(`/Order/customer/${customerId}/create`, payload)
    return data
  },
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

  // Admin methods
  async getAllOrders(params?: {
    page?: number
    pageSize?: number
    status?: string
    searchTerm?: string
    fromDate?: string
    toDate?: string
  }): Promise<{
    success: boolean
    data?: any[] | {
      items?: any[]
      Items?: any[]
      totalCount?: number
      TotalCount?: number
      totalPages?: number
      TotalPages?: number
      [key: string]: any
    }
    total?: number
    message?: string
  }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm)
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate)
    if (params?.toDate) queryParams.append('toDate', params.toDate)

    const { data } = await api.get(`/Order/admin?${queryParams.toString()}`)
    return data
  },

  async updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const { data } = await api.put(`/Order/${orderId}/status`, { status })
    return data
  },

  async deleteOrder(orderId: number): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.delete(`/Order/${orderId}`)
    return data
  },

  async exportOrders(): Promise<Blob> {
    const response = await api.get('/Order/export', {
      responseType: 'blob'
    })
    return response.data
  },

  async updateFulfillmentCenter(orderId: number, fulfillmentCenterId: number): Promise<{ success: boolean; message?: string; data?: any }> {
    const { data } = await api.put(`/Order/${orderId}/fulfillment-center`, { fulfillmentCenterId })
    return data
  },

  async getAvailableParts(orderId: number, centerId?: number): Promise<{ success: boolean; message?: string; data?: any[] }> {
    const params = centerId ? `?centerId=${centerId}` : ''
    const { data } = await api.get(`/Order/${orderId}/available-parts${params}`)
    return data
  },

  /**
   * Lấy danh sách đơn hàng đã thanh toán có phụ tùng có thể dùng cho booking tại chi nhánh
   * Tối ưu: chỉ trả về những đơn hàng có ít nhất 1 phụ tùng có thể dùng, kèm thông tin phụ tùng
   */
  async getAvailableOrdersForBooking(customerId: number, centerId: number): Promise<{ success: boolean; message?: string; data?: Array<{
    orderId: number
    orderNumber?: string
    totalAmount?: number
    createdAt?: string
    fulfillmentCenterId?: number
    fulfillmentCenterName?: string
    availableParts?: Array<{
      orderItemId: number
      partId: number
      partName: string
      availableQty: number
      unitPrice?: number
      canUse: boolean
      warning?: string | null
    }>
  }> }> {
    const { data } = await api.get(`/Order/customer/${customerId}/available-for-booking?centerId=${centerId}`)
    return data
  }
}



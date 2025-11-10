import api from './api'

export interface WorkOrderPartItem {
  id: number
  partId: number
  partNumber?: string
  partName?: string
  brand?: string
  unitPrice?: number
  totalStock?: number
  quantity: number
  notes?: string
  status?: string // DRAFT, CONSUMED, etc.
  // Hints
  sourceType?: 'CUSTOMER' | 'INVENTORY' | string
  isCustomerSupplied?: boolean
  orderItemId?: number // nếu đến từ đơn đã mua
}

export const WorkOrderPartService = {
  async list(bookingId: number): Promise<WorkOrderPartItem[]> {
    const { data } = await api.get(`/Booking/${bookingId}/parts`)
    // API trả về: { success: true, data: { items: [...], totals: {...} } }
    const rows = data?.data?.items || data?.items || data?.data || (Array.isArray(data) ? data : [])
    return Array.isArray(rows) ? rows.map(r => ({
      id: r.id ?? r.workOrderPartId ?? r.partItemId,
      partId: r.partId,
      partNumber: r.partNumber,
      partName: r.partName,
      brand: r.brand,
      unitPrice: r.unitPrice,
      totalStock: r.totalStock ?? r.stock,
      quantity: r.quantity ?? r.quantityUsed ?? 1, // Map quantityUsed thành quantity
      notes: r.notes,
      status: r.status, // DRAFT, CONSUMED, etc.
      sourceType: r.sourceType ?? r.SourceType,
      isCustomerSupplied: r.isCustomerSupplied ?? r.customerSupplied ?? r.SourceType === 'CUSTOMER',
      orderItemId: r.orderItemId ?? r.OrderItemId
    })) : []
  },

  async add(bookingId: number, payload: { partId: number; quantity: number; notes?: string }): Promise<WorkOrderPartItem> {
    const { data } = await api.post(`/Booking/${bookingId}/parts`, payload)
    const r = data?.data || data
    return {
      id: r.id ?? r.workOrderPartId ?? r.partItemId,
      partId: r.partId,
      partNumber: r.partNumber,
      partName: r.partName,
      brand: r.brand,
      unitPrice: r.unitPrice,
      totalStock: r.totalStock ?? r.stock,
      quantity: r.quantity ?? payload.quantity,
      notes: r.notes,
      status: r.status // DRAFT, CONSUMED, etc.
    }
  },

  async update(bookingId: number, id: number, payload: { partId?: number; quantity?: number; notes?: string }): Promise<void> {
    await api.put(`/Booking/${bookingId}/parts/${id}`, payload)
  },

  async remove(bookingId: number, id: number): Promise<void> {
    await api.delete(`/Booking/${bookingId}/parts/${id}`)
  },

  async customerApprove(bookingId: number, workOrderPartId: number): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.put(`/Booking/${bookingId}/parts/${workOrderPartId}/customer-approve`)
    return data
  }
  ,
  async staffApproveAndConsume(bookingId: number, workOrderPartId: number): Promise<{ success: boolean; message?: string; data?: any }> {
    // BE endpoint: PUT /api/Booking/{bookingId}/parts/{workOrderPartId}/approve-and-consume
    const { data } = await api.put(`/Booking/${bookingId}/parts/${workOrderPartId}/approve-and-consume`)
    return data
  }
  ,
  async staffReject(bookingId: number, workOrderPartId: number): Promise<{ success: boolean; message?: string; data?: any }> {
    // BE endpoint: PUT /api/Booking/{bookingId}/parts/{workOrderPartId}/reject
    const { data } = await api.put(`/Booking/${bookingId}/parts/${workOrderPartId}/reject`)
    return data
  },
  async customerReject(bookingId: number, workOrderPartId: number): Promise<{ success: boolean; message?: string; data?: any }> {
    // BE endpoint: PUT /api/Booking/{bookingId}/parts/{workOrderPartId}/customer-reject
    const { data } = await api.put(`/Booking/${bookingId}/parts/${workOrderPartId}/customer-reject`)
    return data
  },

  async consumeCustomerPart(bookingId: number, workOrderPartId: number, orderItemId: number, quantity: number): Promise<{ success: boolean; message?: string; data?: any }> {
    // BE endpoint: POST /api/Booking/{bookingId}/parts/{workOrderPartId}/consume-customer-part
    const { data } = await api.post(`/Booking/${bookingId}/parts/${workOrderPartId}/consume-customer-part`, {
      orderItemId,
      quantity
    })
    return data
  },

  async validateOrderParts(request: {
    centerId: number
    orderItemUsages: Array<{ orderItemId: number; quantity: number }>
  }): Promise<{ success: boolean; message?: string; data?: any[] }> {
    // BE endpoint: POST /api/Booking/validate-order-parts
    const { data } = await api.post(`/Booking/validate-order-parts`, request)
    return data
  },

  async updateBookingCustomerParts(bookingId: number, request: {
    orderItemUsages?: Array<{ orderItemId: number; quantity: number }>
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    // BE endpoint: PUT /api/Booking/{bookingId}/customer-parts
    const { data } = await api.put(`/Booking/${bookingId}/customer-parts`, request)
    return data
  }
}

export default WorkOrderPartService



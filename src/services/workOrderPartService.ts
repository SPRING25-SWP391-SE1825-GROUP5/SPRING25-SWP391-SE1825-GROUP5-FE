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
}

export const WorkOrderPartService = {
  async list(bookingId: number): Promise<WorkOrderPartItem[]> {
    const { data } = await api.get(`/Booking/${bookingId}/parts`)
    const rows = (data?.data || data || []) as any[]
    return Array.isArray(rows) ? rows.map(r => ({
      id: r.id ?? r.workOrderPartId ?? r.partItemId,
      partId: r.partId,
      partNumber: r.partNumber,
      partName: r.partName,
      brand: r.brand,
      unitPrice: r.unitPrice,
      totalStock: r.totalStock ?? r.stock,
      quantity: r.quantity ?? 1,
      notes: r.notes
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
      notes: r.notes
    }
  },

  async update(bookingId: number, id: number, payload: { quantity?: number; notes?: string }): Promise<void> {
    await api.put(`/Booking/${bookingId}/parts/${id}`, payload)
  },

  async remove(bookingId: number, id: number): Promise<void> {
    await api.delete(`/Booking/${bookingId}/parts/${id}`)
  },

  async confirm(bookingId: number): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.post(`/Booking/${bookingId}/parts/confirm`)
    return data
  }
}

export default WorkOrderPartService



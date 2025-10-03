import api from './api'

export type AvailabilityQuery = {
  centerId: number
  date: string // YYYY-MM-DD
  serviceIds?: number[]
}

export const BookingService = {
  async checkAvailability(params: AvailabilityQuery) {
    const serviceIds = params.serviceIds?.join(',')
    const { data } = await api.get('/booking/availability', {
      params: { centerId: params.centerId, date: params.date, serviceIds },
    })
    return data
  },

  async create(payload: any) {
    const { data } = await api.post('/booking', payload)
    return data
  },

  async list(params: { pageNumber?: number; pageSize?: number } = {}) {
    const { data } = await api.get('/booking', { params })
    return data
  },

  async detail(id: number) {
    const { data } = await api.get(`/booking/${id}`)
    return data
  },

  async updateStatus(id: number, status: string) {
    const { data } = await api.put(`/booking/${id}/status`, { status })
    return data
  },

  async cancel(id: number) {
    const { data } = await api.delete(`/booking/${id}`)
    return data
  },
}


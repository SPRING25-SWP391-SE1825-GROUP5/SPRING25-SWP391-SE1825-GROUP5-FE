import * as signalR from '@microsoft/signalr'

export type BookingEvent = { bookingId: number; status?: string }
export type PartsEvent = { bookingId: number; type: 'add'|'update'|'delete'|'confirm'; partId?: number; quantity?: number; centerId?: number }
export type ChecklistEvent = { bookingId: number; status?: string }

class BookingRealtimeService {
  private connection: signalR.HubConnection | null = null
  private isConnected = false

  private onBookingUpdated?: (ev: BookingEvent) => void
  private onPartsUpdated?: (ev: PartsEvent) => void
  private onChecklistUpdated?: (ev: ChecklistEvent) => void

  private ensureConnection() {
    if (this.connection) return
    // Get base URL and remove /api suffix if present (SignalR hubs are mapped at root level, not under /api)
    let baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'https://localhost:5001'
    // Remove /api suffix if present
    baseUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
    const hubUrl = `${baseUrl}/hubs/booking`
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    this.connection.on('booking.updated', (payload: BookingEvent) => {
      this.onBookingUpdated?.(payload)
    })
    this.connection.on('parts.updated', (payload: PartsEvent) => {
      this.onPartsUpdated?.(payload)
    })
    this.connection.on('checklist.updated', (payload: ChecklistEvent) => {
      this.onChecklistUpdated?.(payload)
    })

    this.connection.onclose(() => { this.isConnected = false })
    this.connection.onreconnected(() => { this.isConnected = true })
  }

  async connect() {
    this.ensureConnection()
    if (!this.connection) return
    if (this.isConnected) return
    await this.connection.start()
    this.isConnected = true
  }

  async disconnect() {
    if (this.connection && this.isConnected) {
      await this.connection.stop()
      this.isConnected = false
    }
  }

  async joinBooking(bookingId: number) {
    await this.connect()
    await this.connection!.invoke('JoinUserGroup', `booking:${bookingId}`) // fallback if needed
    // Prefer explicit group join via server methods if available
  }

  async joinCenterDate(centerId: number, date: string) {
    await this.connect()
    try { await this.connection!.invoke('JoinCenterDateGroup', centerId, date) } catch {}
  }

  setOnBookingUpdated(handler: (ev: BookingEvent) => void) { this.onBookingUpdated = handler }
  setOnPartsUpdated(handler: (ev: PartsEvent) => void) { this.onPartsUpdated = handler }
  setOnChecklistUpdated(handler: (ev: ChecklistEvent) => void) { this.onChecklistUpdated = handler }
}

const bookingRealtimeService = new BookingRealtimeService()
export default bookingRealtimeService

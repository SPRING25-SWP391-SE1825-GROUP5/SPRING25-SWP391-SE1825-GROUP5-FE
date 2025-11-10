export interface TechnicianBookingResponse {
  success: boolean
  message: string
  data: {
    technicianId: number
    date: string
    bookings: TechnicianBooking[]
  }
  bookings?: TechnicianBooking[]
}

export interface TechnicianBooking {
  bookingId: number
  status: string
  serviceId: number
  serviceName: string
  centerId: number
  centerName: string
  slotId: number
  technicianSlotId: number
  slotTime: string
  slotLabel?: string
  date?: string
  customerName: string
  customerPhone: string
  vehiclePlate: string
  workStartTime: string | null
  workEndTime: string | null
  createdAt?: string
  createdDate?: string
  created_at?: string
  bookingDate?: string
  updatedAt?: string
  technicianName?: string
  technicianPhone?: string
}

export interface WorkOrder {
  id: number
  bookingId?: number
  title: string
  customer: string
  customerPhone: string
  customerEmail?: string
  licensePlate: string
  bikeBrand?: string
  bikeModel?: string
  status: 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'paid' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  description: string
  scheduledDate: string
  scheduledTime: string
  createdAt: string
  serviceType: string
  assignedTechnician?: string
  parts: string[]
  workDate?: string
  startTime?: string
  endTime?: string
  serviceName?: string
  vehicleId?: number
  centerId?: number
  technicianName?: string
  technicianPhone?: string
  slotLabel?: string
}

export interface WorkQueueProps {
  mode?: 'technician' | 'staff'
}

// Technician TimeSlot Types
export interface TimeSlot {
  technicianSlotId: number
  technicianId: number
  technicianName: string
  slotId: number
  slotTime: string
  workDate: string
  isAvailable: boolean
  notes: string | null
  createdAt: string
}

// Technician Types
export interface Technician {
  id: number
  userId: number
  userFullName: string
  userEmail: string
  userPhoneNumber: string
  centerId: number
  centerName: string
  position: string
  isActive: boolean
  createdAt: string
}

// Work Schedule Types
export interface WorkSchedule {
  date: string
  timeSlots: TimeSlot[]
  totalSlots: number
  availableSlots: number
  bookedSlots: number
}

// API Response Types
export interface TechnicianTimeSlotResponse {
  success: boolean
  message: string
  data: TechnicianTimeSlotData[]
}

export interface TechnicianTimeSlotData {
  technicianSlotId: number
  technicianId: number
  technicianName: string
  slotId: number
  slotTime: string
  workDate: string
  isAvailable: boolean
  notes: string | null
  createdAt: string
}

export interface TechnicianResponse {
  success: boolean
  message: string
  data: Technician
}

// Staff Management Types
export type Staff = {
  staffId: number
  userId: number
  userFullName: string
  userEmail: string
  userPhoneNumber: string
  centerId: number
  centerName: string
  isActive: boolean
  createdAt: string
}

export type Technician = {
  technicianId: number
  userId: number
  userFullName: string
  userEmail: string
  userPhoneNumber: string
  centerId: number
  centerName: string
  position: 'GENERAL' | 'SENIOR' | 'LEAD'
  isActive: boolean
  createdAt: string
}

// Request Types
export type CreateStaffRequest = {
  userId: number
  centerId: number
}

export type CreateStaffFromUserRequest = {
  userId: number
  centerId: number
}

export type CreateTechnicianRequest = {
  technicianId: number
  centerId: number
  position: 'GENERAL' | 'SENIOR' | 'LEAD'
}

export type CreateTechnicianFromUserRequest = {
  userId: number
  centerId: number
  position: 'GENERAL' | 'SENIOR' | 'LEAD'
}

export type UpdateStaffRequest = {
  isActive: boolean
}

export type UpdateTechnicianRequest = {
  position?: 'GENERAL' | 'SENIOR' | 'LEAD'
  isActive: boolean
}

// Query Parameters
export type StaffListParams = {
  centerId?: number
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  position?: string
  isActive?: boolean
}

export type TechnicianListParams = {
  centerId: number
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  specialization?: string
  isActive?: boolean
}

export type ValidateUserAssignmentParams = {
  userId: number
  centerId: number
}

// Response Types
export type StaffListResponse = {
  success: boolean
  message: string
  data: {
    staff: Staff[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
  }
}

export type TechnicianListResponse = {
  success: boolean
  message: string
  data: {
    technicians: Technician[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
  }
}

export type StaffResponse = {
  success: boolean
  message: string
  data: Staff
}

export type TechnicianResponse = {
  success: boolean
  message: string
  data: Technician
}

export type ValidateUserAssignmentResponse = {
  success: boolean
  message: string
  data: {
    canAssign: boolean
    userId: number
    centerId: number
  }
}

// Form Types
export type StaffFormData = {
  userId: number
  centerId: number
}

export type TechnicianFormData = {
  userId: number
  centerId: number
  position: 'GENERAL' | 'SENIOR' | 'LEAD'
}

// UI Types
export type StaffTableRow = {
  id: number
  name: string
  email: string
  phone: string
  center: string
  status: 'active' | 'inactive'
  createdAt: string
  actions: string[]
}

export type TechnicianTableRow = {
  id: number
  name: string
  email: string
  phone: string
  center: string
  position: string
  status: 'active' | 'inactive'
  createdAt: string
  actions: string[]
}

// Filter Types
export type StaffFilters = {
  searchTerm: string
  centerId: number | null
  isActive: boolean | null
  position: string | null
}

export type TechnicianFilters = {
  searchTerm: string
  centerId: number | null
  isActive: boolean | null
  specialization: string | null
}
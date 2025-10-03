export interface Staff {
  id: number
  name: string
  email: string
  phone: string
  department: string
  position: string
  status: 'active' | 'inactive' | 'on-leave'
  joinDate: string
  salary: string
  performance: number
  address: string
  skills: string[]
  experience: string
}

export interface StaffFilters {
  searchTerm: string
  filterDepartment: string
  filterStatus: string
}

export interface StaffStats {
  totalStaff: number
  activeStaff: number
  inactiveStaff: number
  onLeaveStaff: number
  departments: number
  averagePerformance: number
}

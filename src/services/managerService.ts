import api from './api'

export interface Employee {
  type: 'STAFF' | 'TECHNICIAN'
  staffId: number | null
  technicianId: number | null
  userId: number
  fullName: string
  email: string
  phoneNumber: string
  role: string
  isActive: boolean
  centerId: number
  centerName: string
  position: string | null
  rating: number | null
  createdAt: string
}

export interface AvailableUser {
  type: 'STAFF' | 'TECHNICIAN'
  userId: number
  fullName: string
  email: string
  phoneNumber: string
  role: string
  isActive: boolean
  centerName: string
  createdAt: string
}

export interface AssignEmployeesRequest {
  userIds: number[]
  centerId: number
}

export interface AssignEmployeesResponse {
  success: boolean
  message: string
  data: any[]
}

export interface EmployeesResponse {
  success: boolean
  message: string
  data: {
    employees: Employee[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
  }
}

export const ManagerService = {
  // Lấy danh sách nhân viên
  async getEmployees(
    centerId: number = 2,
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string | null,
    type?: 'STAFF' | 'TECHNICIAN' | null,
    status?: 'active' | 'inactive' | null
  ): Promise<EmployeesResponse> {
    try {
      const params = new URLSearchParams({
        centerId: centerId.toString(),
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString()
      })
      
      if (searchTerm) params.append('searchTerm', searchTerm)
      if (type) params.append('type', type)
      if (status === 'active') params.append('isActive', 'true')
      if (status === 'inactive') params.append('isActive', 'false')
      
      const { data } = await api.get(`/StaffManagement/employees?${params.toString()}`)
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể tải danh sách nhân viên',
        data: {
          employees: [],
          totalCount: 0,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 0
        }
      }
    }
  },

  // Lấy danh sách user có thể thêm vào center
  async getAvailableUsers(): Promise<{ success: boolean; message: string; data: AvailableUser[] }> {
    try {
      const { data } = await api.get('/StaffManagement/employees/available-users?pageNumber=1&pageSize=100')
      console.log('Raw API response:', data) // Debug log
      
      // API trả về format: { success: true, message: "...", data: { employees: [...], totalCount: ..., ... } }
      if (data && data.success && data.data && Array.isArray(data.data.employees)) {
        return {
          success: true,
          message: data.message || 'Lấy danh sách user có sẵn thành công',
          data: data.data.employees
        }
      } else {
        return {
          success: false,
          message: data?.message || 'Format dữ liệu không đúng',
          data: []
        }
      }
    } catch (error) {
      console.error('API error:', error) // Debug log
      return {
        success: false,
        message: 'Không thể tải danh sách user có sẵn',
        data: []
      }
    }
  },

  // Gán nhân viên vào center
  async assignEmployees(request: AssignEmployeesRequest): Promise<AssignEmployeesResponse> {
    try {
      const { data } = await api.post('/StaffManagement/assign-employees', request)
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể gán nhân viên vào trung tâm',
        data: []
      }
    }
  }
}


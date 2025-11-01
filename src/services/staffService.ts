import api from './api'
import type {
  Staff,
  Technician,
  CreateStaffRequest,
  CreateStaffFromUserRequest,
  CreateTechnicianRequest,
  CreateTechnicianFromUserRequest,
  UpdateStaffRequest,
  UpdateTechnicianRequest,
  StaffListParams,
  TechnicianListParams,
  ValidateUserAssignmentParams,
  StaffListResponse,
  TechnicianListResponse,
  StaffResponse,
  TechnicianResponse,
  ValidateUserAssignmentResponse
} from '@/types/staff'

// Định nghĩa types mới cho API StaffManagementController
export interface Employee {
  id: number
  userId: number
  fullName: string
  email: string
  phoneNumber: string
  centerId?: number
  centerName?: string
  position?: string
  specialization?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  role: 'STAFF' | 'TECHNICIAN'
}

export interface EmployeeListResponse {
  employees: Employee[]
  pagination: {
    pageNumber: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface AvailableUser {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  isActive: boolean
  role: string
}

export interface AvailableUsersResponse {
  users: AvailableUser[]
  pagination: {
    pageNumber: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface AssignEmployeesRequest {
  userIds: number[]
  centerId: number
}

export const StaffService = {
  // ============================================================================
  // EMPLOYEE MANAGEMENT APIs (StaffManagementController)
  // ============================================================================

  /**
   * Lấy danh sách user có role STAFF/TECHNICIAN nhưng chưa có bản ghi trong bảng Staff/Technician
   */
  async getAvailableUsersForEmployee(params: {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
    isActive?: boolean
  } = {}): Promise<AvailableUsersResponse> {
    try {
      const { data } = await api.get<{ success: boolean; data: any }>('/StaffManagement/employees/available-users', { params })
      const payload = data?.data ?? {}
      const users = Array.isArray(payload.users) ? payload.users : []
      const pagination = payload.pagination ?? {
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? users.length,
        totalCount: users.length,
        totalPages: 1
      }
      return { users, pagination }
    } catch (error: any) {
      console.error('Error getting available users:', error)
      throw new Error(error.response?.data?.message || 'Không thể lấy danh sách người dùng có thể làm nhân viên')
    }
  },

  /**
   * Lấy danh sách tất cả nhân viên (Staff + Technician) theo trung tâm
   */
  async getCenterEmployees(params: {
    centerId?: number
    unassigned?: boolean
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
    isActive?: boolean
  } = {}): Promise<EmployeeListResponse> {
    try {
      // Chuẩn hóa tham số: nếu không có centerId thì bắt buộc unassigned=true
      const normalizedParams = {
        ...params,
        unassigned: params.centerId ? (params.unassigned ?? false) : true
      }
      const { data } = await api.get<{ success: boolean; data: EmployeeListResponse }>('/StaffManagement/employees', { params: normalizedParams })
      return data.data
    } catch (error: any) {
      console.error('Error getting center employees:', error)
      throw new Error(error.response?.data?.message || 'Không thể lấy danh sách nhân viên')
    }
  },

  /**
   * Gán nhân viên vào center (dùng cho cả STAFF và TECHNICIAN)
   */
  async assignEmployeesToCenter(request: AssignEmployeesRequest): Promise<Employee[]> {
    try {
      const { data } = await api.post<{ success: boolean; data: Employee[] }>('/StaffManagement/assign-employees', request)
      return data.data
    } catch (error: any) {
      console.error('Error assigning employees:', error)
      
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Dữ liệu không hợp lệ')
      } else if (error.response?.status === 401) {
        throw new Error('Không có quyền thực hiện thao tác này')
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập')
      }
      
      throw new Error(error.response?.data?.message || 'Không thể gán nhân viên vào trung tâm')
    }
  },

  // ============================================================================
  // LEGACY APIs (Backward compatibility)
  // ============================================================================

  async getStaffList(params: StaffListParams = {}): Promise<StaffListResponse> {
    // Chuyển đổi sang API mới
    const employeeParams = {
      centerId: params.centerId,
      unassigned: params.centerId == null ? true : false,
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 10,
      searchTerm: params.searchTerm,
      isActive: params.isActive
    }
    
    const response = await this.getCenterEmployees(employeeParams)
    
    // Chuyển đổi Employee[] thành Staff[]
    const staff = response.employees
      .filter(emp => emp.role === 'STAFF')
      .map(emp => ({
        staffId: emp.id,
        userId: emp.userId,
        userFullName: emp.fullName,
        userEmail: emp.email,
        userPhoneNumber: emp.phoneNumber,
        centerId: emp.centerId,
        centerName: emp.centerName,
        isActive: emp.isActive,
        createdAt: emp.createdAt
      }))

    return {
      success: true,
      message: 'Lấy danh sách nhân viên thành công',
      data: {
        staff,
        totalCount: response.pagination.totalCount,
        pageNumber: response.pagination.pageNumber,
        pageSize: response.pagination.pageSize,
        totalPages: response.pagination.totalPages
      }
    }
  },

  async getStaffById(staffId: number): Promise<StaffResponse> {
    const { data } = await api.get<StaffResponse>(`/StaffManagement/staff/${staffId}`)
    return data
  },

  async createStaffFromUser(staffData: CreateStaffFromUserRequest): Promise<StaffResponse> {
    try {
      // Sử dụng API assignment mới
      const result = await this.assignEmployeesToCenter({
        userIds: [staffData.userId],
        centerId: staffData.centerId
      })
      
      // Tìm staff vừa tạo
      const newStaff = result.find(emp => emp.userId === staffData.userId && emp.role === 'STAFF')
      
      if (!newStaff) {
        throw new Error('Không thể tạo nhân viên')
      }

      return {
        success: true,
        message: 'Tạo nhân viên thành công',
        data: {
          staffId: newStaff.id,
          userId: newStaff.userId,
          userFullName: newStaff.fullName,
          userEmail: newStaff.email,
          userPhoneNumber: newStaff.phoneNumber,
          centerId: newStaff.centerId,
          centerName: newStaff.centerName,
          isActive: newStaff.isActive,
          createdAt: newStaff.createdAt
        }
      }
    } catch (error: any) {
      console.error('Error creating staff from user:', error)
      throw error
    }
  },

  async updateStaff(staffId: number, staffData: UpdateStaffRequest): Promise<StaffResponse> {
    const { data } = await api.put<StaffResponse>(`/StaffManagement/staff/${staffId}`, staffData)
    return data
  },

  async getTechnicianList(params: TechnicianListParams): Promise<TechnicianListResponse> {
    // Chuyển đổi sang API mới
    const employeeParams = {
      centerId: params.centerId,
      unassigned: params.centerId == null ? true : false,
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 10,
      searchTerm: params.searchTerm,
      isActive: params.isActive
    }
    
    const response = await this.getCenterEmployees(employeeParams)
    
    // Chuyển đổi Employee[] thành Technician[]
    const technicians = response.employees
      .filter(emp => emp.role === 'TECHNICIAN')
      .map(emp => ({
        technicianId: emp.id,
        userId: emp.userId,
        userFullName: emp.fullName,
        userEmail: emp.email,
        userPhoneNumber: emp.phoneNumber,
        centerId: emp.centerId,
        centerName: emp.centerName,
        position: emp.position,
        isActive: emp.isActive,
        createdAt: emp.createdAt
      }))

    return {
      success: true,
      message: 'Lấy danh sách kỹ thuật viên thành công',
      data: {
        technicians,
        totalCount: response.pagination.totalCount,
        pageNumber: response.pagination.pageNumber,
        pageSize: response.pagination.pageSize,
        totalPages: response.pagination.totalPages
      }
    }
  },

  async createTechnicianFromUser(technicianData: CreateTechnicianFromUserRequest): Promise<TechnicianResponse> {
    try {
      // Sử dụng API assignment mới
      const result = await this.assignEmployeesToCenter({
        userIds: [technicianData.userId],
        centerId: technicianData.centerId
      })
      
      // Tìm technician vừa tạo
      const newTechnician = result.find(emp => emp.userId === technicianData.userId && emp.role === 'TECHNICIAN')
      
      if (!newTechnician) {
        throw new Error('Không thể tạo kỹ thuật viên')
      }

      return {
        success: true,
        message: 'Tạo kỹ thuật viên thành công',
        data: {
          technicianId: newTechnician.id,
          userId: newTechnician.userId,
          userFullName: newTechnician.fullName,
          userEmail: newTechnician.email,
          userPhoneNumber: newTechnician.phoneNumber,
          centerId: newTechnician.centerId,
          centerName: newTechnician.centerName,
          position: newTechnician.position,
          isActive: newTechnician.isActive,
          createdAt: newTechnician.createdAt
        }
      }
    } catch (error: any) {
      console.error('Error creating technician from user:', error)
      throw error
    }
  },

  async updateTechnician(technicianId: number, technicianData: UpdateTechnicianRequest): Promise<TechnicianResponse> {
    const { data } = await api.put<TechnicianResponse>(`/StaffManagement/technician/${technicianId}`, technicianData)
    return data
  },

  async getCurrentStaff(): Promise<StaffResponse> {
    const { data } = await api.get<StaffResponse>('/StaffManagement/staff/current')
    return data
  },

  async getStaffStats(centerId?: number): Promise<{
    totalStaff: number
    activeStaff: number
    inactiveStaff: number
    totalTechnicians: number
    activeTechnicians: number
    inactiveTechnicians: number
  }> {
    try {
      const response = await this.getCenterEmployees({
        centerId,
        unassigned: centerId == null ? true : false,
        pageSize: 1000
      })
      
      const employees = response.employees
      const staff = employees.filter(emp => emp.role === 'STAFF')
      const technicians = employees.filter(emp => emp.role === 'TECHNICIAN')

      return {
        totalStaff: staff.length,
        activeStaff: staff.filter(s => s.isActive).length,
        inactiveStaff: staff.filter(s => !s.isActive).length,
        totalTechnicians: technicians.length,
        activeTechnicians: technicians.filter(t => t.isActive).length,
        inactiveTechnicians: technicians.filter(t => !t.isActive).length
      }
    } catch (error) {
      console.error('Error getting staff stats:', error)
      return {
        totalStaff: 0,
        activeStaff: 0,
        inactiveStaff: 0,
        totalTechnicians: 0,
        activeTechnicians: 0,
        inactiveTechnicians: 0
      }
    }
  },

  // Lấy thông tin staff hiện tại và center được assign
  async getCurrentStaffAssignment(): Promise<{ staffId: number, centerId: number, centerName: string, role: string }> {
    const { data } = await api.get('/StaffManagement/current-assignment')
    return data
  }
}
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


export const StaffService = {

  async getStaffList(params: StaffListParams = {}): Promise<StaffListResponse> {
    const { data } = await api.get<StaffListResponse>('/StaffManagement/staff', { params })
    return data
  },


  async getStaffById(staffId: number): Promise<StaffResponse> {
    const { data } = await api.get<StaffResponse>(`/StaffManagement/staff/${staffId}`)
    return data
  },


  async createStaffFromUser(staffData: CreateStaffFromUserRequest): Promise<StaffResponse> {
    try {
      const { data } = await api.post<StaffResponse>('/StaffManagement/staff/from-user', staffData)
      return data
    } catch (error: any) {
      console.error('Error creating staff from user:', error)
      
      if (error.response?.status === 409) {
        throw new Error('Người dùng đã có hồ sơ nhân viên đang hoạt động')
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Dữ liệu không hợp lệ')
      } else if (error.response?.status === 401) {
        throw new Error('Không có quyền thực hiện thao tác này')
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập')
      }
      
      throw new Error(error.message || 'Không thể tạo nhân viên từ người dùng')
    }
  },

  async updateStaff(staffId: number, staffData: UpdateStaffRequest): Promise<StaffResponse> {
    const { data } = await api.put<StaffResponse>(`/StaffManagement/staff/${staffId}`, staffData)
    return data
  },

  async getTechnicianList(params: TechnicianListParams): Promise<TechnicianListResponse> {
    const { data } = await api.get<TechnicianListResponse>('/StaffManagement/technician', { params })
    return data
  },

  async createTechnicianFromUser(technicianData: CreateTechnicianFromUserRequest): Promise<TechnicianResponse> {
    try {
      const { data } = await api.post<TechnicianResponse>('/StaffManagement/technician/from-user', technicianData)
      return data
    } catch (error: any) {
      console.error('Error creating technician from user:', error)
      
      if (error.response?.status === 409) {
        throw new Error('Người dùng đã có hồ sơ kỹ thuật viên đang hoạt động')
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Dữ liệu không hợp lệ')
      } else if (error.response?.status === 401) {
        throw new Error('Không có quyền thực hiện thao tác này')
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập')
      }
      
      throw new Error(error.message || 'Không thể tạo kỹ thuật viên từ người dùng')
    }
  },


  async updateTechnician(technicianId: number, technicianData: UpdateTechnicianRequest): Promise<TechnicianResponse> {
    const { data } = await api.put<TechnicianResponse>(`/StaffManagement/technician/${technicianId}`, technicianData)
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
      const staffResponse = await this.getStaffList({ 
        centerId, 
        pageSize: 1000 
      })
      const staff = staffResponse.data.staff
      
      const technicianResponse = centerId 
        ? await this.getTechnicianList({ 
            centerId, 
            pageSize: 1000 
          })
        : { data: { technicians: [] } }
      const technicians = technicianResponse.data.technicians || []
      
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
  }
}
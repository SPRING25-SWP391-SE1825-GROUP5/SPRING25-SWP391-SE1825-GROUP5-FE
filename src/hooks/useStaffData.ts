import { useState, useMemo } from 'react'
import type { Staff, StaffFilters, StaffStats } from '../types/staff'

// Mock data for staff - using const since it's not reassigned
const mockStaff: Staff[] = [
  {
    id: 1,
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@company.com',
    phone: '0123456789',
    department: 'Kỹ thuật',
    position: 'Kỹ thuật viên trưởng',
    status: 'active',
    joinDate: '2023-01-15',
    salary: '15000000',
    performance: 4.8,
    address: '123 Nguyễn Huệ, Q1, TP.HCM',
    skills: ['Sửa chữa xe máy', 'Bảo trì động cơ', 'Điện tử'],
    experience: '5 năm'
  },
  {
    id: 2,
    name: 'Trần Thị Bình',
    email: 'tranthibinh@company.com',
    phone: '0987654321',
    department: 'Dịch vụ khách hàng',
    position: 'Nhân viên tư vấn',
    status: 'active',
    joinDate: '2023-03-20',
    salary: '12000000',
    performance: 4.6,
    address: '456 Lê Văn Sỹ, Q3, TP.HCM',
    skills: ['Tư vấn khách hàng', 'Bán hàng', 'Chăm sóc khách hàng'],
    experience: '3 năm'
  },
  {
    id: 3,
    name: 'Lê Văn Cường',
    email: 'levancuong@company.com',
    phone: '0369852147',
    department: 'Quản lý',
    position: 'Quản lý chi nhánh',
    status: 'active',
    joinDate: '2022-06-10',
    salary: '20000000',
    performance: 4.9,
    address: '789 Nguyễn Thị Thập, Q7, TP.HCM',
    skills: ['Quản lý nhân sự', 'Quản lý tài chính', 'Kinh doanh'],
    experience: '7 năm'
  },
  {
    id: 4,
    name: 'Phạm Thị Dung',
    email: 'phamthidung@company.com',
    phone: '0741852963',
    department: 'Kỹ thuật',
    position: 'Kỹ thuật viên',
    status: 'inactive',
    joinDate: '2023-08-05',
    salary: '13000000',
    performance: 4.2,
    address: '321 Cách Mạng Tháng 8, Q10, TP.HCM',
    skills: ['Sửa chữa xe máy', 'Bảo trì', 'Kiểm tra kỹ thuật'],
    experience: '2 năm'
  },
  {
    id: 5,
    name: 'Hoàng Văn Em',
    email: 'hoangvanem@company.com',
    phone: '0852741963',
    department: 'Dịch vụ khách hàng',
    position: 'Nhân viên tiếp tân',
    status: 'active',
    joinDate: '2023-11-12',
    salary: '10000000',
    performance: 4.5,
    address: '654 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    skills: ['Tiếp tân', 'Hỗ trợ khách hàng', 'Quản lý lịch hẹn'],
    experience: '1 năm'
  },
  {
    id: 6,
    name: 'Võ Thị Phương',
    email: 'vothiphuong@company.com',
    phone: '0963258741',
    department: 'Kế toán',
    position: 'Kế toán viên',
    status: 'active',
    joinDate: '2023-02-28',
    salary: '14000000',
    performance: 4.7,
    address: '987 Lê Đức Thọ, Gò Vấp, TP.HCM',
    skills: ['Kế toán', 'Quản lý tài chính', 'Báo cáo'],
    experience: '4 năm'
  }
]

export function useStaffData() {
  const [filters, setFilters] = useState<StaffFilters>({
    searchTerm: '',
    filterDepartment: 'all',
    filterStatus: 'all'
  })

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null)
  const [staffData, setStaffData] = useState<Staff[]>(mockStaff)

  // Filter staff based on current filters
  const filteredStaff = useMemo(() => {
    return staffData.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           member.phone.includes(filters.searchTerm) ||
                           member.position.toLowerCase().includes(filters.searchTerm.toLowerCase())
      const matchesDepartment = filters.filterDepartment === 'all' || member.department === filters.filterDepartment
      const matchesStatus = filters.filterStatus === 'all' || member.status === filters.filterStatus
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [filters, staffData])

  // Calculate staff statistics
  const staffStats: StaffStats = useMemo(() => {
    const totalStaff = staffData.length
    const activeStaff = staffData.filter(s => s.status === 'active').length
    const inactiveStaff = staffData.filter(s => s.status === 'inactive').length
    const onLeaveStaff = staffData.filter(s => s.status === 'on-leave').length
    const departments = [...new Set(staffData.map(s => s.department))].length
    const averagePerformance = staffData.reduce((acc, s) => acc + s.performance, 0) / staffData.length

    return {
      totalStaff,
      activeStaff,
      inactiveStaff,
      onLeaveStaff,
      departments,
      averagePerformance: Number(averagePerformance.toFixed(1))
    }
  }, [staffData])

  const updateFilters = (newFilters: Partial<StaffFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff)
    setShowStaffModal(true)
  }

  const handleEditStaff = (staff: Staff) => {
    setStaffToEdit(staff)
    setFormMode('edit')
    setShowFormModal(true)
  }

  const handleDeleteStaff = (staff: Staff) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên ${staff.name}?`)) {
      setStaffData(prev => prev.filter(s => s.id !== staff.id))
    }
  }

  const handleAddStaff = () => {
    setStaffToEdit(null)
    setFormMode('add')
    setShowFormModal(true)
  }

  const handleSaveStaff = (staff: Staff) => {
    if (formMode === 'add') {
      setStaffData(prev => [...prev, staff])
    } else {
      setStaffData(prev => prev.map(s => s.id === staff.id ? staff : s))
    }
  }

  const closeStaffModal = () => {
    setShowStaffModal(false)
    setSelectedStaff(null)
  }

  const closeFormModal = () => {
    setShowFormModal(false)
    setStaffToEdit(null)
  }

  return {
    staff: filteredStaff,
    staffStats,
    filters,
    selectedStaff,
    showStaffModal,
    showFormModal,
    formMode,
    staffToEdit,
    updateFilters,
    handleViewStaff,
    handleEditStaff,
    handleDeleteStaff,
    handleAddStaff,
    handleSaveStaff,
    closeStaffModal,
    closeFormModal
  }
}

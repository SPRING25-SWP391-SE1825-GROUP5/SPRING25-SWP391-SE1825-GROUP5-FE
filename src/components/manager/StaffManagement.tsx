import { useState, useEffect } from 'react'
import { 
  Users, 
  CheckCircle,
  Wrench,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  Star,
  MoreVertical,
  X,
  UserPlus,
  Check,
  User
} from 'lucide-react'
import { ManagerService, Employee, AvailableUser } from '@/services/managerService'
import { useAppSelector } from '@/store/hooks'
import toast from 'react-hot-toast'

export default function StaffManagement() {
  const { user } = useAppSelector((state) => state.auth)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    loadEmployees()
  }, [currentPage, searchTerm, filterRole])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      // Sử dụng centerId từ user hoặc mặc định là 2 (Chi nhánh Quận 7)
      const centerId = user?.centerId || 2
      const response = await ManagerService.getEmployees(centerId, currentPage, pageSize, searchTerm, filterRole === 'all' ? null : filterRole)
      if (response.success) {
        setEmployees(response.data.employees)
        setTotalPages(response.data.totalPages)
        setTotalCount(response.data.totalCount)
      } else {
        toast.error(response.message || 'Không thể tải danh sách nhân viên')
      }
    } catch (error) {
      toast.error('Không thể tải danh sách nhân viên')
    } finally {
      setLoading(false)
    }
  }

  // Bỏ filteredEmployees vì đã filter ở backend
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset về trang 1 khi search
  }

  const handleRoleChange = (value: string) => {
    setFilterRole(value)
    setCurrentPage(1) // Reset về trang 1 khi filter
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Modal functions
  const openAddModal = async () => {
    setShowAddModal(true)
    setSelectedUsers([])
    await loadAvailableUsers()
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setSelectedUsers([])
    setAvailableUsers([])
  }

  const loadAvailableUsers = async () => {
    try {
      setLoadingAvailableUsers(true)
      const response = await ManagerService.getAvailableUsers()
      console.log('Available users response:', response) // Debug log
      if (response.success) {
        setAvailableUsers(response.data)
        console.log('Available users data:', response.data) // Debug log
      } else {
        console.error('API error:', response.message) // Debug log
        toast.error(response.message || 'Không thể tải danh sách user có sẵn')
      }
    } catch (error) {
      console.error('Load available users error:', error) // Debug log
      toast.error('Không thể tải danh sách user có sẵn')
    } finally {
      setLoadingAvailableUsers(false)
    }
  }

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setSelectedUsers(availableUsers.map(user => user.userId))
  }

  const deselectAllUsers = () => {
    setSelectedUsers([])
  }

  const assignSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhân viên')
      return
    }

    try {
      setAssigning(true)
      const response = await ManagerService.assignEmployees({
        userIds: selectedUsers,
        centerId: user?.centerId || 2
      })

      if (response.success) {
        toast.success(`Đã thêm ${selectedUsers.length} nhân viên vào trung tâm`)
        closeAddModal()
        loadEmployees() // Reload danh sách nhân viên
      } else {
        toast.error(response.message || 'Không thể thêm nhân viên')
      }
    } catch (error) {
      toast.error('Không thể thêm nhân viên')
    } finally {
      setAssigning(false)
    }
  }

  // Tính toán stats từ totalCount thay vì employees.length
  const totalEmployees = totalCount
  const activeEmployees = employees.filter(emp => emp.isActive).length
  const technicians = employees.filter(emp => emp.role === 'TECHNICIAN').length
  const avgRating = employees.length > 0
    ? employees.reduce((sum, emp) => sum + (emp.rating || 0), 0) / employees.length
    : 0

  const stats = [
    {
      title: 'Tổng nhân viên',
      value: totalEmployees.toString(),
      unit: 'người',
      icon: Users,
      color: '#FFD875'
    },
    {
      title: 'Đang làm việc',
      value: activeEmployees.toString(),
      unit: 'người',
      icon: CheckCircle,
      color: '#22C55E'
    },
    {
      title: 'Kỹ thuật viên',
      value: technicians.toString(),
      unit: 'người',
      icon: Wrench,
      color: '#3B82F6'
    },
    {
      title: 'Đánh giá TB',
      value: avgRating.toFixed(1),
      unit: '⭐',
      icon: TrendingUp,
      color: '#F59E0B'
    }
  ]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#22C55E' : '#EF4444'
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Nhân viên
        </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Tất cả nhân viên</span>
            <div style={{
              padding: '2px 8px',
              background: '#F3F4F6',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#6B7280'
            }}>
              {totalEmployees}
            </div>
          </div>
        </div>
        <button 
          onClick={openAddModal}
          style={{
          padding: '10px 20px',
            background: '#FFD875',
            color: '#000',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F4C430'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFD875'
        }}>
          <Plus size={16} />
          Thêm nhân viên
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {stats.map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '0.5px solid #F1F5F9',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: `${stat.color}20`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <p style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                  color: '#111827',
                  margin: '0 0 4px 0'
                  }}>
                    {stat.value}
                </p>
                <p style={{ 
                    fontSize: '12px', 
                  color: '#6B7280',
                  margin: 0 
                  }}>
                  {stat.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        border: '0.5px solid #F1F5F9',
        marginBottom: '16px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Search Input */}
        <div style={{ 
            flex: 1,
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '2px solid #E2E8F0',
              transition: 'all 0.2s ease',
              ':focus-within': {
                borderColor: '#FFD875',
                boxShadow: '0 0 0 3px rgba(255, 216, 117, 0.1)'
              }
            }}>
              <Search size={20} style={{ color: '#64748B' }} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  flex: 1,
                  fontSize: '14px',
                  color: '#1E293B',
                  fontWeight: '500'
                }}
              />
            </div>
            </div>

          {/* Role Filter */}
          <div style={{
            position: 'relative',
            minWidth: '200px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: filterRole === 'all' ? '#F8FAFC' : '#FFD875',
              borderRadius: '10px',
              border: `2px solid ${filterRole === 'all' ? '#E2E8F0' : '#FFD875'}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: filterRole !== 'all' ? '0 2px 4px rgba(255, 216, 117, 0.2)' : 'none'
            }}>
              <Filter size={20} style={{ 
                color: filterRole === 'all' ? '#64748B' : '#1E293B' 
              }} />
              <select
                value={filterRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  color: filterRole === 'all' ? '#64748B' : '#1E293B',
                  cursor: 'pointer',
                  fontWeight: '500',
                  appearance: 'none',
                  flex: 1
                }}
              >
                <option value="all">Tất cả vai trò</option>
                <option value="STAFF">Nhân viên</option>
                <option value="TECHNICIAN">Kỹ thuật viên</option>
              </select>
            </div>
            </div>
          </div>
        </div>
        
      {/* Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '0.5px solid #F1F5F9',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        {loading ? (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#6B7280' }}>Đang tải...</div>
          </div>
        ) : employees.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                    Tên nhân viên
                  </th>
                  <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Vai trò</th>
                  <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Đánh giá</th>
                  <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Email</th>
                  <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Số điện thoại</th>
                  <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}></th>
              </tr>
            </thead>
            <tbody>
                {employees.map((employee, index) => (
                  <tr 
                    key={employee.userId}
                    style={{ 
                      borderBottom: index < employees.length - 1 ? '1px solid #F3F4F6' : 'none',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F9FAFB'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                          background: '#FFD875',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                          color: '#000',
                        fontWeight: '600',
                          fontSize: '14px',
                          flexShrink: 0
                      }}>
                          {getInitials(employee.fullName)}
                      </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ 
                          fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#111827',
                            margin: '0'
                          }}>
                            {employee.fullName}
                        </p>
                      </div>
                    </div>
                  </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                      fontSize: '12px', 
                        fontWeight: '500',
                        background: employee.role === 'TECHNICIAN' ? '#FFF8E5' : '#F3F4F6',
                        color: employee.role === 'TECHNICIAN' ? '#FFD875' : '#6B7280'
                    }}>
                        {employee.role === 'TECHNICIAN' ? 'Kỹ thuật viên' : 'Nhân viên'}
                      </span>
                  </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {employee.rating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                          <Star size={14} style={{ color: '#FFD875', fill: '#FFD875' }} />
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {employee.rating}
                      </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '14px', color: '#9CA3AF' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6', fontSize: '14px', justifyContent: 'center' }}>
                        <Mail size={14} />
                        {employee.email}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6', fontSize: '14px', justifyContent: 'center' }}>
                        <Phone size={14} />
                        {employee.phoneNumber}
                    </div>
                  </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                      fontSize: '12px',
                        fontWeight: '500',
                        background: employee.isActive ? '#F0FDF4' : '#FEF2F2',
                        color: employee.isActive ? '#16A34A' : '#DC2626'
                      }}>
                        {employee.isActive ? 'Đang làm việc' : 'Nghỉ việc'}
                    </span>
                  </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button style={{
                        padding: '6px',
                        border: 'none',
                        borderRadius: '6px',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#6B7280'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F3F4F6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}>
                        <MoreVertical size={18} />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <div style={{
            padding: '80px 40px',
            textAlign: 'center'
          }}>
            <Users size={64} style={{ color: '#9CA3AF', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Không có nhân viên
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              Sẽ hiển thị danh sách nhân viên tại đây khi có dữ liệu
            </p>
          </div>
        )}

        {/* Pagination */}
        {employees.length > 0 && totalPages > 1 && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FAFAFA'
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} nhân viên
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  background: currentPage === 1 ? '#F9FAFB' : 'white',
                  color: currentPage === 1 ? '#9CA3AF' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Trước
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      background: currentPage === pageNum ? '#FFD875' : 'white',
                      color: currentPage === pageNum ? '#1F2937' : '#374151',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      minWidth: '40px'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  background: currentPage === totalPages ? '#F9FAFB' : 'white',
                  color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '40px 40px 40px 320px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255, 216, 117, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #FFF8E5 0%, #FFFFFF 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: '#FFD875',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(255, 216, 117, 0.3)'
                }}>
                  <UserPlus size={18} style={{ color: '#000' }} />
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1E293B',
                    margin: '0 0 2px 0'
                  }}>
                    Thêm nhân viên
                  </h3>
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#64748B',
                    margin: 0
                  }}>
                    Chọn nhân viên để thêm vào trung tâm
                  </p>
                </div>
              </div>
              <button
                onClick={closeAddModal}
                style={{
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F3F4F6'
                  e.currentTarget.style.color = '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Selection Controls */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #F1F5F9',
                background: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={selectAllUsers}
                      disabled={availableUsers.length === 0}
                      style={{
                        padding: '6px 12px',
                        background: '#FFD875',
                        color: '#000',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: availableUsers.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: availableUsers.length === 0 ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(255, 216, 117, 0.3)'
                      }}
                    >
                      Chọn tất cả
                    </button>
                    <button
                      onClick={deselectAllUsers}
                      disabled={selectedUsers.length === 0}
                      style={{
                        padding: '6px 12px',
                        background: '#F1F5F9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: selectedUsers.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: selectedUsers.length === 0 ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    background: '#E0F2FE',
                    color: '#0369A1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    Đã chọn: {selectedUsers.length} nhân viên
                  </div>
                </div>
              </div>

              {/* Users List */}
              <div style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
                
                {loadingAvailableUsers ? (
                  <div style={{ 
                    padding: '60px 20px', 
                    textAlign: 'center',
                    color: '#6B7280'
                  }}>
                    <div style={{ fontSize: '16px' }}>Đang tải danh sách nhân viên...</div>
                  </div>
                ) : availableUsers.length > 0 ? (
                  <div style={{ padding: '16px 0' }}>
                    {availableUsers.map((user) => (
                      <div
                        key={user.userId}
                        onClick={() => toggleUserSelection(user.userId)}
                        style={{
                          padding: '12px',
                          border: `2px solid ${selectedUsers.includes(user.userId) ? '#FFD875' : '#E2E8F0'}`,
                          borderRadius: '10px',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          background: selectedUsers.includes(user.userId) ? '#FFF8E5' : 'white',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          boxShadow: selectedUsers.includes(user.userId) ? '0 2px 8px rgba(255, 216, 117, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* Checkbox */}
                          <div style={{
                            width: '18px',
                            height: '18px',
                            border: `2px solid ${selectedUsers.includes(user.userId) ? '#FFD875' : '#CBD5E1'}`,
                            borderRadius: '4px',
                            background: selectedUsers.includes(user.userId) ? '#FFD875' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {selectedUsers.includes(user.userId) && (
                              <Check size={12} style={{ color: '#000' }} />
                            )}
                          </div>

                          {/* Avatar */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: '#FFD875',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontWeight: '600',
                            fontSize: '14px',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(255, 216, 117, 0.3)'
                          }}>
                            {getInitials(user.fullName)}
                          </div>

                          {/* User Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <h4 style={{ 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                color: '#1E293B',
                                margin: 0
                              }}>
                                {user.fullName}
                              </h4>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                                background: user.role === 'TECHNICIAN' ? '#FFF8E5' : '#F1F5F9',
                                color: user.role === 'TECHNICIAN' ? '#FFD875' : '#64748B'
                              }}>
                                {user.role === 'TECHNICIAN' ? 'Kỹ thuật viên' : 'Nhân viên'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748B' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={12} />
                                {user.email}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} />
                                {user.phoneNumber}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '60px 20px', 
                    textAlign: 'center',
                    color: '#6B7280'
                  }}>
                    <User size={64} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                      Không có nhân viên có sẵn
                    </h3>
                    <p style={{ fontSize: '14px', margin: 0 }}>
                      Tất cả nhân viên đã được gán vào các trung tâm
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #F1F5F9',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  onClick={closeAddModal}
                  disabled={assigning}
                  style={{
                    padding: '8px 16px',
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: assigning ? 'not-allowed' : 'pointer',
                    opacity: assigning ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={assignSelectedUsers}
                  disabled={selectedUsers.length === 0 || assigning}
                  style={{
                    padding: '8px 16px',
                    background: selectedUsers.length === 0 || assigning ? '#CBD5E1' : '#FFD875',
                    color: selectedUsers.length === 0 || assigning ? '#94A3B8' : '#000',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: selectedUsers.length === 0 || assigning ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: selectedUsers.length > 0 && !assigning ? '0 2px 4px rgba(255, 216, 117, 0.3)' : 'none'
                  }}
                >
                  {assigning ? (
                    <>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #94A3B8',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Thêm {selectedUsers.length} nhân viên
                    </>
                  )}
                </button>
              </div>
        </div>
      </div>
        </div>
      )}
    </div>
  )
}

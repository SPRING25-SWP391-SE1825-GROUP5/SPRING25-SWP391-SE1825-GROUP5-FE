import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react'
import { UserService, GetUsersRequest } from '@/services/userService'
import UserFormModalOptimized from './UserFormModalOptimized'
import toast from 'react-hot-toast'

interface User {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  address?: string
  role: 'CUSTOMER' | 'STAFF' | 'TECHNICIAN' | 'ADMIN'
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface UserFilters {
  searchTerm: string
  role: string
  status: string
  gender: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: '',
    role: '',
    status: '',
    gender: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const roles = [
    { value: '', label: 'Tất cả vai trò' },
    { value: 'CUSTOMER', label: 'Khách hàng' },
    { value: 'STAFF', label: 'Nhân viên' },
    { value: 'TECHNICIAN', label: 'Kỹ thuật viên' },
    { value: 'ADMIN', label: 'Quản trị viên' }
  ]

  const statuses = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' }
  ]

  const genders = [
    { value: '', label: 'Tất cả giới tính' },
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' }
  ]

  const loadUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: GetUsersRequest = {
        pageNumber: pagination.page,
        pageSize: pagination.limit,
        searchTerm: filters.searchTerm || undefined,
        role: filters.role || undefined
      }

      const response = await UserService.getUsers(params)
      
      if (response.success) {
        setUsers(response.data.users)
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: response.data.totalPages
        }))
      } else {
        setError(response.message || 'Không thể tải danh sách người dùng')
      }
    } catch (err: any) {
      console.error('Error loading users:', err)
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [pagination.page, pagination.limit, filters])

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (field: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleAddUser = () => {
    setModalMode('add')
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setModalMode('edit')
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleModalSuccess = () => {
    loadUsers()
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return
    }

    try {
      await UserService.deleteUser(userId)
      toast.success('Xóa người dùng thành công')
      loadUsers()
    } catch (err: any) {
      console.error('Error deleting user:', err)
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng')
    }
  }

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await UserService.toggleUserStatus(userId, isActive)
      toast.success(`Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} người dùng`)
      loadUsers()
    } catch (err: any) {
      console.error('Error toggling user status:', err)
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái')
    }
  }

  const getRoleLabel = (role: string) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj?.label || role
  }

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Hoạt động' : 'Không hoạt động'
  }

  const getGenderLabel = (gender: string) => {
    return gender === 'MALE' ? 'Nam' : 'Nữ'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const filteredUsers = users.filter(user => {
    if (filters.status === 'active' && !user.isActive) return false
    if (filters.status === 'inactive' && user.isActive) return false
    if (filters.gender && user.gender !== filters.gender) return false
    return true
  })

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 8px 0'
          }}>
            Quản lý người dùng
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: '0',
            fontSize: '14px'
          }}>
            Quản lý tài khoản người dùng trong hệ thống
          </p>
        </div>
        <button
          onClick={handleAddUser}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'var(--primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          Thêm người dùng
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{
          background: 'var(--bg-card)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              background: 'var(--primary-50)',
              borderRadius: '8px',
              color: 'var(--primary-500)'
            }}>
              <Users size={20} />
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Tổng người dùng
              </p>
              <p style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {pagination.total}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              background: 'var(--success-50)',
              borderRadius: '8px',
              color: 'var(--success-500)'
            }}>
              <UserCheck size={20} />
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Đang hoạt động
              </p>
              <p style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              background: 'var(--error-50)',
              borderRadius: '8px',
              color: 'var(--error-500)'
            }}>
              <UserX size={20} />
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Không hoạt động
              </p>
              <p style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {users.filter(u => !u.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              Tìm kiếm
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Tìm theo tên, email, SĐT..."
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              Vai trò
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)'
              }}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)'
              }}
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              Giới tính
            </label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)'
              }}
            >
              {genders.map(gender => (
                <option key={gender.value} value={gender.value}>{gender.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setFilters({ searchTerm: '', role: '', status: '', gender: '' })}
            style={{
              padding: '12px 16px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'var(--text-secondary)' 
          }}>
            Đang tải...
          </div>
        ) : error ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'var(--error-500)' 
          }}>
            {error}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'var(--bg-secondary)', 
                    borderBottom: '1px solid var(--border-primary)' 
                  }}>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)' 
                    }}>
                      Người dùng
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)' 
                    }}>
                      Vai trò
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)' 
                    }}>
                      Trạng thái
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)' 
                    }}>
                      Ngày tạo
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'center', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)' 
                    }}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} style={{ 
                      borderBottom: '1px solid var(--border-primary)',
                      '&:hover': { background: 'var(--bg-secondary)' }
                    }}>
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: 'var(--text-primary)',
                            marginBottom: '4px'
                          }}>
                            {user.fullName}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '2px'
                          }}>
                            <Mail size={12} />
                            {user.email}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Phone size={12} />
                            {user.phoneNumber}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: user.role === 'ADMIN' ? 'var(--error-50)' : 
                                     user.role === 'STAFF' ? 'var(--primary-50)' :
                                     user.role === 'TECHNICIAN' ? 'var(--warning-50)' : 'var(--success-50)',
                          color: user.role === 'ADMIN' ? 'var(--error-500)' : 
                                 user.role === 'STAFF' ? 'var(--primary-500)' :
                                 user.role === 'TECHNICIAN' ? 'var(--warning-500)' : 'var(--success-500)'
                        }}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: user.isActive ? 'var(--success-500)' : 'var(--error-500)'
                          }} />
                          <span style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-primary)' 
                          }}>
                            {getStatusLabel(user.isActive)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ 
                          fontSize: '14px', 
                          color: 'var(--text-primary)' 
                        }}>
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditUser(user)}
                            style={{
                              padding: '8px',
                              background: 'var(--primary-50)',
                              color: 'var(--primary-500)',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, !user.isActive)}
                            style={{
                              padding: '8px',
                              background: user.isActive ? 'var(--error-50)' : 'var(--success-50)',
                              color: user.isActive ? 'var(--error-500)' : 'var(--success-500)',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title={user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            style={{
                              padding: '8px',
                              background: 'var(--error-50)',
                              color: 'var(--error-500)',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{
                padding: '16px',
                borderTop: '1px solid var(--border-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong {pagination.total} kết quả
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    style={{
                      padding: '8px 12px',
                      background: pagination.page === 1 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                      color: pagination.page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Trước
                  </button>
                  <span style={{
                    padding: '8px 12px',
                    background: 'var(--primary-500)',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {pagination.page}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    style={{
                      padding: '8px 12px',
                      background: pagination.page === pagination.totalPages ? 'var(--bg-secondary)' : 'var(--bg-card)',
                      color: pagination.page === pagination.totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Form Modal */}
      <UserFormModalOptimized
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        user={selectedUser}
      />
    </div>
  )
}

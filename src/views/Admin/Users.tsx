import { useState } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react'

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)

  // Mock data for users
  const users = [
    {
      id: 1,
      name: 'Nguyễn Văn An',
      email: 'nguyenvanan@email.com',
      phone: '0123456789',
      role: 'admin',
      status: 'active',
      joinDate: '2024-01-15',
      lastLogin: '2024-12-20',
      address: '123 Nguyễn Huệ, Q1, TP.HCM',
      avatar: null
    },
    {
      id: 2,
      name: 'Trần Thị Bình',
      email: 'tranthibinh@email.com',
      phone: '0987654321',
      role: 'manager',
      status: 'active',
      joinDate: '2024-02-20',
      lastLogin: '2024-12-19',
      address: '456 Lê Văn Sỹ, Q3, TP.HCM',
      avatar: null
    },
    {
      id: 3,
      name: 'Lê Văn Cường',
      email: 'levancuong@email.com',
      phone: '0369852147',
      role: 'staff',
      status: 'active',
      joinDate: '2024-03-10',
      lastLogin: '2024-12-20',
      address: '789 Nguyễn Thị Thập, Q7, TP.HCM',
      avatar: null
    },
    {
      id: 4,
      name: 'Phạm Thị Dung',
      email: 'phamthidung@email.com',
      phone: '0741852963',
      role: 'technician',
      status: 'inactive',
      joinDate: '2024-04-05',
      lastLogin: '2024-12-15',
      address: '321 Cách Mạng Tháng 8, Q10, TP.HCM',
      avatar: null
    },
    {
      id: 5,
      name: 'Hoàng Văn Em',
      email: 'hoangvanem@email.com',
      phone: '0852741963',
      role: 'customer',
      status: 'active',
      joinDate: '2024-05-12',
      lastLogin: '2024-12-20',
      address: '654 Điện Biên Phủ, Bình Thạnh, TP.HCM',
      avatar: null
    }
  ]

  const roles = [
    { value: 'all', label: 'Tất cả vai trò' },
    { value: 'admin', label: 'Quản trị viên' },
    { value: 'manager', label: 'Quản lý' },
    { value: 'staff', label: 'Nhân viên' },
    { value: 'technician', label: 'Kỹ thuật viên' },
    { value: 'customer', label: 'Khách hàng' }
  ]

  const statuses = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' },
    { value: 'pending', label: 'Chờ duyệt' }
  ]

  const getRoleLabel = (role) => {
    const roleMap = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      staff: 'Nhân viên',
      technician: 'Kỹ thuật viên',
      customer: 'Khách hàng'
    }
    return roleMap[role] || role
  }

  const getRoleColor = (role) => {
    const colorMap = {
      admin: 'var(--error-500)',
      manager: 'var(--primary-500)',
      staff: 'var(--info-500)',
      technician: 'var(--warning-500)',
      customer: 'var(--success-500)'
    }
    return colorMap[role] || 'var(--text-secondary)'
  }

  const getStatusColor = (status) => {
    const colorMap = {
      active: 'var(--success-500)',
      inactive: 'var(--error-500)',
      pending: 'var(--warning-500)'
    }
    return colorMap[status] || 'var(--text-secondary)'
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      pending: 'Chờ duyệt'
    }
    return statusMap[status] || status
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm)
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleEditUser = (user) => {
    console.log('Edit user:', user)
  }

  const handleDeleteUser = (user) => {
    console.log('Delete user:', user)
  }

  return (
    <div style={{ padding: '24px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          margin: '0 0 8px 0'
        }}>
          Quản lý người dùng
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Quản lý tài khoản và quyền hạn người dùng trong hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '24px', 
        marginBottom: '32px' 
      }}>
        {[
          { title: 'Tổng người dùng', value: users.length, icon: User, color: 'var(--primary-500)' },
          { title: 'Đang hoạt động', value: users.filter(u => u.status === 'active').length, icon: UserCheck, color: 'var(--success-500)' },
          { title: 'Không hoạt động', value: users.filter(u => u.status === 'inactive').length, icon: UserX, color: 'var(--error-500)' },
          { title: 'Chờ duyệt', value: users.filter(u => u.status === 'pending').length, icon: Clock, color: 'var(--warning-500)' }
        ].map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: stat.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={20} />
              </div>
              <h3 style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)',
                margin: '0',
                fontWeight: '500'
              }}>
                {stat.title}
              </h3>
            </div>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: 'var(--text-primary)'
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              minWidth: '150px'
            }}
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              minWidth: '150px'
            }}
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          {/* Add User Button */}
          <button
            onClick={() => console.log('Add user')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--primary-500)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-600)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary-500)'}
          >
            <Plus size={16} />
            Thêm người dùng
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
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-tertiary)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            Danh sách người dùng ({filteredUsers.length})
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-primary)'
                }}>
                  Người dùng
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-primary)'
                }}>
                  Vai trò
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-primary)'
                }}>
                  Trạng thái
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-primary)'
                }}>
                  Ngày tham gia
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-primary)'
                }}>
                  Đăng nhập cuối
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'center', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-primary)'
                }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr 
                  key={user.id}
                  style={{ 
                    borderBottom: index < filteredUsers.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          marginBottom: '2px'
                        }}>
                          {user.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Mail size={12} />
                          {user.email}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '2px'
                        }}>
                          <Phone size={12} />
                          {user.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: `${getRoleColor(user.role)}20`,
                      color: getRoleColor(user.role)
                    }}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: `${getStatusColor(user.status)}20`,
                      color: getStatusColor(user.status)
                    }}>
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {new Date(user.joinDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {new Date(user.lastLogin).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleViewUser(user)}
                        style={{
                          padding: '8px',
                          background: 'var(--info-50)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'var(--info-500)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        style={{
                          padding: '8px',
                          background: 'var(--warning-50)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'var(--warning-500)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        style={{
                          padding: '8px',
                          background: 'var(--error-50)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'var(--error-500)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: 'var(--text-primary)',
                margin: '0'
              }}>
                Chi tiết người dùng
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--primary-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0 0 4px 0'
                }}>
                  {selectedUser.name}
                </h4>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)',
                  margin: '0'
                }}>
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Số điện thoại:</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedUser.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Địa chỉ:</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedUser.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Vai trò:</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: `${getRoleColor(selectedUser.role)}20`,
                  color: getRoleColor(selectedUser.role)
                }}>
                  {getRoleLabel(selectedUser.role)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UserCheck size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Trạng thái:</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: `${getStatusColor(selectedUser.status)}20`,
                  color: getStatusColor(selectedUser.status)
                }}>
                  {getStatusLabel(selectedUser.status)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Ngày tham gia:</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {new Date(selectedUser.joinDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Đăng nhập cuối:</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {new Date(selectedUser.lastLogin).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => handleEditUser(selectedUser)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--primary-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

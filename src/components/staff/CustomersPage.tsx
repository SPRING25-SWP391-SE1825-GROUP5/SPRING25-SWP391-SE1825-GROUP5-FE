import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import { UserService } from '@/services/userService'
import type { User } from '@/store/authSlice'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  // Load customers data
  const loadCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await UserService.getUsers({
        role: 'customer',
        pageSize: 100
      })
      setCustomers(response.data.users)
    } catch (err: any) {
      setError('Không thể tải danh sách khách hàng')
      console.error('Error loading customers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Toggle customer status
  const handleToggleStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      await UserService.toggleUserStatus(customerId, !currentStatus)
      setSuccess(`Đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản khách hàng`)
      loadCustomers() // Reload data
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError('Không thể cập nhật trạng thái khách hàng')
      console.error('Error toggling customer status:', err)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phoneNumber?.includes(searchTerm)
  )

  return (
    <div>
      {/* Success Message */}
      {success && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--success-50)',
          border: '1px solid var(--success-200)',
          color: 'var(--success-700)',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1001,
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '400px'
        }}>
          <CheckCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--error-50)',
          border: '1px solid var(--error-200)',
          color: 'var(--error-700)',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1001,
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '400px'
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0 0 8px 0'
          }}>
            Quản lý khách hàng
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý thông tin khách hàng và tài khoản
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'var(--primary-50)',
          borderRadius: '12px',
          border: '1px solid var(--primary-200)'
        }}>
          <Users size={20} color="var(--primary-600)" />
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: 'var(--primary-700)' 
          }}>
            {customers.length} khách hàng
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 16px 12px 44px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-500)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)'
            }}
          />
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '200px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary-500)" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div style={{
          overflowX: 'auto',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ 
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                <th style={{ 
                  padding: '20px 16px', 
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Khách hàng</th>
                <th style={{ 
                  padding: '20px 16px', 
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Thông tin liên hệ</th>
                <th style={{ 
                  padding: '20px 16px', 
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Ngày tạo</th>
                <th style={{ 
                  padding: '20px 16px', 
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Trạng thái</th>
                <th style={{ 
                  padding: '20px 16px', 
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ 
                    padding: '40px', 
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ fontSize: '48px' }}>👥</div>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                        {searchTerm ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, i) => (
                  <tr
                    key={customer.id}
                    style={{
                      borderBottom: i < filteredCustomers.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      background: 'var(--bg-card)',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card)'
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'var(--primary-50)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary-500)',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}>
                          {customer.fullName?.charAt(0) || customer.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: 'var(--text-primary)',
                            margin: '0 0 4px 0'
                          }}>
                            {customer.fullName}
                          </p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            margin: 0
                          }}>
                            ID: {customer.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <p style={{ 
                          fontSize: '14px', 
                          color: 'var(--text-primary)',
                          margin: '0 0 4px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Mail size={14} color="var(--text-tertiary)" />
                          {customer.email}
                        </p>
                        {customer.phoneNumber && (
                          <p style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <Phone size={12} color="var(--text-tertiary)" />
                            {customer.phoneNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Calendar size={14} color="var(--text-tertiary)" />
                        <span style={{ 
                          fontSize: '14px', 
                          color: 'var(--text-primary)'
                        }}>
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: customer.isActive ? 'var(--success-50)' : 'var(--error-50)',
                        color: customer.isActive ? 'var(--success-700)' : 'var(--error-700)',
                        border: customer.isActive ? '1px solid var(--success-200)' : '1px solid var(--error-200)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        width: 'fit-content'
                      }}>
                        {customer.isActive ? (
                          <>
                            <UserCheck size={12} />
                            Hoạt động
                          </>
                        ) : (
                          <>
                            <UserX size={12} />
                            Ngừng hoạt động
                          </>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowCustomerModal(true)
                          }}
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--info-50)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--info-100)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--info-50)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <Eye size={16} color="var(--info-600)" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(customer.id?.toString() || '', customer.isActive || false)}
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            background: customer.isActive ? 'var(--error-50)' : 'var(--success-50)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = customer.isActive ? 'var(--error-100)' : 'var(--success-100)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = customer.isActive ? 'var(--error-50)' : 'var(--success-50)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          {customer.isActive ? (
                            <UserX size={16} color="var(--error-600)" />
                          ) : (
                            <UserCheck size={16} color="var(--success-600)" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showCustomerModal && selectedCustomer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '32px',
            borderRadius: '16px',
            width: '500px',
            maxWidth: '90vw',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <h3 style={{ 
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Chi tiết khách hàng
              </h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--error-50)'
                  e.currentTarget.style.color = 'var(--error-600)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--primary-500)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {selectedCustomer.fullName?.charAt(0) || selectedCustomer.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <p style={{ 
                    margin: '0 0 4px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {selectedCustomer.fullName}
                  </p>
                  <p style={{ 
                    margin: 0,
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                  }}>
                    ID: {selectedCustomer.id} • {selectedCustomer.role}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <Mail size={16} color="var(--primary-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Email</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>{selectedCustomer.email}</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <Phone size={16} color="var(--success-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Số điện thoại</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {selectedCustomer.phoneNumber || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedCustomer.address && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <MapPin size={16} color="var(--warning-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Địa chỉ</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>{selectedCustomer.address}</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <Calendar size={16} color="var(--info-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Ngày tạo</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <BarChart3 size={16} color="var(--primary-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Trạng thái</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {selectedCustomer.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-primary)'
            }}>
              <button
                onClick={() => setShowCustomerModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'var(--primary-500)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-600)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--primary-500)'
                  e.currentTarget.style.transform = 'translateY(0)'
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

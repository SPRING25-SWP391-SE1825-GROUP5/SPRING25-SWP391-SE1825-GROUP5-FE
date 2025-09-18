import { Edit, Trash2, Eye, Mail, Phone, Star } from 'lucide-react'

interface Staff {
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

interface StaffTableProps {
  staff: Staff[]
  onViewStaff: (staff: Staff) => void
  onEditStaff: (staff: Staff) => void
  onDeleteStaff: (staff: Staff) => void
}

export default function StaffTable({ staff, onViewStaff, onEditStaff, onDeleteStaff }: StaffTableProps) {
  const getDepartmentColor = (department: string) => {
    const colorMap: Record<string, string> = {
      'Kỹ thuật': 'var(--primary-500)',
      'Dịch vụ khách hàng': 'var(--success-500)',
      'Quản lý': 'var(--error-500)',
      'Kế toán': 'var(--info-500)',
      'Nhân sự': 'var(--warning-500)'
    }
    return colorMap[department] || 'var(--text-secondary)'
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'var(--success-500)',
      inactive: 'var(--error-500)',
      'on-leave': 'var(--warning-500)'
    }
    return colorMap[status] || 'var(--text-secondary)'
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'Đang làm việc',
      inactive: 'Nghỉ việc',
      'on-leave': 'Nghỉ phép'
    }
    return statusMap[status] || status
  }

  const getPerformanceColor = (performance: number) => {
    if (performance >= 4.5) return 'var(--success-500)'
    if (performance >= 4.0) return 'var(--warning-500)'
    return 'var(--error-500)'
  }

  return (
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
          Danh sách nhân viên ({staff.length})
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
                Nhân viên
              </th>
              <th style={{ 
                padding: '16px 24px', 
                textAlign: 'left', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                Phòng ban
              </th>
              <th style={{ 
                padding: '16px 24px', 
                textAlign: 'left', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                Vị trí
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
                Lương
              </th>
              <th style={{ 
                padding: '16px 24px', 
                textAlign: 'left', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                Hiệu suất
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
            {staff.map((member, index) => (
              <tr 
                key={member.id}
                style={{ 
                  borderBottom: index < staff.length - 1 ? '1px solid var(--border-primary)' : 'none',
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
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: 'var(--text-primary)',
                        marginBottom: '2px'
                      }}>
                        {member.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Mail size={12} />
                        {member.email}
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
                        {member.phone}
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
                    background: `${getDepartmentColor(member.department)}20`,
                    color: getDepartmentColor(member.department)
                  }}>
                    {member.department}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-primary)' }}>
                  {member.position}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: `${getStatusColor(member.status)}20`,
                    color: getStatusColor(member.status)
                  }}>
                    {getStatusLabel(member.status)}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-primary)' }}>
                  {parseInt(member.salary).toLocaleString('vi-VN')} VNĐ
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '14px', 
                      color: getPerformanceColor(member.performance),
                      fontWeight: '600'
                    }}>
                      {member.performance}
                    </span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          size={12} 
                          style={{ 
                            color: star <= member.performance ? getPerformanceColor(member.performance) : 'var(--text-tertiary)',
                            fill: star <= member.performance ? getPerformanceColor(member.performance) : 'none'
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <button
                      onClick={() => onViewStaff(member)}
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
                      onClick={() => onEditStaff(member)}
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
                      onClick={() => onDeleteStaff(member)}
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
  )
}

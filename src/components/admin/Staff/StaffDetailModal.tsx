import { Phone, Mail, MapPin, Building2, Briefcase, Users, DollarSign, Star, Trophy, Calendar } from 'lucide-react'

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

interface StaffDetailModalProps {
  staff: Staff | null
  isOpen: boolean
  onClose: () => void
  onEdit: (staff: Staff) => void
}

export default function StaffDetailModal({ staff, isOpen, onClose, onEdit }: StaffDetailModalProps) {
  if (!isOpen || !staff) return null

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
        maxWidth: '600px',
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
            Chi tiết nhân viên
          </h3>
          <button
            onClick={onClose}
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
            {staff.name.charAt(0)}
          </div>
          <div>
            <h4 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: '0 0 4px 0'
            }}>
              {staff.name}
            </h4>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              margin: '0'
            }}>
              {staff.position} - {staff.department}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Phone size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Số điện thoại:</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{staff.phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Email:</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{staff.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Địa chỉ:</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{staff.address}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Phòng ban:</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              background: `${getDepartmentColor(staff.department)}20`,
              color: getDepartmentColor(staff.department)
            }}>
              {staff.department}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Briefcase size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Vị trí:</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{staff.position}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Trạng thái:</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              background: `${getStatusColor(staff.status)}20`,
              color: getStatusColor(staff.status)
            }}>
              {getStatusLabel(staff.status)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DollarSign size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Lương:</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {parseInt(staff.salary).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Star size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Hiệu suất:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '14px', 
                color: getPerformanceColor(staff.performance),
                fontWeight: '600'
              }}>
                {staff.performance}
              </span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={12} 
                    style={{ 
                      color: star <= staff.performance ? getPerformanceColor(staff.performance) : 'var(--text-tertiary)',
                      fill: star <= staff.performance ? getPerformanceColor(staff.performance) : 'none'
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Trophy size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Kinh nghiệm:</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{staff.experience}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Ngày vào làm:</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {new Date(staff.joinDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Kỹ năng:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {staff.skills.map((skill, index) => (
                <span 
                  key={index}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: 'var(--primary-50)',
                    color: 'var(--primary-500)'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => onEdit(staff)}
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
            onClick={onClose}
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
  )
}

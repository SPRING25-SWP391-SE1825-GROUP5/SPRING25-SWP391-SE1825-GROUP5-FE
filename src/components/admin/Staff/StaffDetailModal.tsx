import { Phone, Mail, MapPin, Building2, Briefcase, Users, DollarSign, Star, Trophy, Calendar } from 'lucide-react'
import './StaffDetailModal.scss'

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

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'Đang làm việc',
      inactive: 'Nghỉ việc',
      'on-leave': 'Nghỉ phép'
    }
    return statusMap[status] || status
  }

  const getPerformanceClass = (performance: number) => {
    if (performance >= 4.5) return 'staff-detail-modal__performance-value--excellent'
    if (performance >= 4.0) return 'staff-detail-modal__performance-value--good'
    return 'staff-detail-modal__performance-value--poor'
  }

  const getPerformanceStarClass = (performance: number) => {
    if (performance >= 4.5) return 'filled'
    if (performance >= 4.0) return 'warning'
    return 'error'
  }

  const getStatusClass = (status: string) => {
    return `staff-detail-modal__detail-item-badge--status-${status}`
  }

  return (
    <div className="staff-detail-modal">
      <div className="staff-detail-modal__overlay">
        <div className="staff-detail-modal__header">
          <h3 className="staff-detail-modal__title">
            Chi tiết nhân viên
          </h3>
          <button
            onClick={onClose}
            className="staff-detail-modal__close-button"
          >
            ×
          </button>
        </div>

        <div className="staff-detail-modal__profile">
          <div className="staff-detail-modal__avatar">
            {staff.name.charAt(0)}
          </div>
          <div className="staff-detail-modal__profile-info">
            <h4>{staff.name}</h4>
            <p>{staff.position} - {staff.department}</p>
          </div>
        </div>

        <div className="staff-detail-modal__details">
          <div className="staff-detail-modal__detail-item">
            <Phone size={16} />
            <span className="staff-detail-modal__detail-item-label">Số điện thoại:</span>
            <span className="staff-detail-modal__detail-item-value">{staff.phone}</span>
          </div>
          <div className="staff-detail-modal__detail-item">
            <Mail size={16} />
            <span className="staff-detail-modal__detail-item-label">Email:</span>
            <span className="staff-detail-modal__detail-item-value">{staff.email}</span>
          </div>
          <div className="staff-detail-modal__detail-item">
            <MapPin size={16} />
            <span className="staff-detail-modal__detail-item-label">Địa chỉ:</span>
            <span className="staff-detail-modal__detail-item-value">{staff.address}</span>
          </div>
          <div className="staff-detail-modal__detail-item">
            <Building2 size={16} />
            <span className="staff-detail-modal__detail-item-label">Phòng ban:</span>
            <span className="staff-detail-modal__detail-item-badge staff-detail-modal__detail-item-badge--department">
              {staff.department}
            </span>
          </div>
          <div className="staff-detail-modal__detail-item">
            <Briefcase size={16} />
            <span className="staff-detail-modal__detail-item-label">Vị trí:</span>
            <span className="staff-detail-modal__detail-item-value">{staff.position}</span>
          </div>
          <div className="staff-detail-modal__detail-item">
            <Users size={16} />
            <span className="staff-detail-modal__detail-item-label">Trạng thái:</span>
            <span className={`staff-detail-modal__detail-item-badge ${getStatusClass(staff.status)}`}>
              {getStatusLabel(staff.status)}
            </span>
          </div>
          <div className="staff-detail-modal__detail-item">
            <DollarSign size={16} />
            <span className="staff-detail-modal__detail-item-label">Lương:</span>
            <span className="staff-detail-modal__detail-item-value">
              {parseInt(staff.salary).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          <div className="staff-detail-modal__detail-item">
            <Star size={16} />
            <span className="staff-detail-modal__detail-item-label">Hiệu suất:</span>
            <div className="staff-detail-modal__performance">
              <span className={`staff-detail-modal__performance-value ${getPerformanceClass(staff.performance)}`}>
                {staff.performance}
              </span>
              <div className="staff-detail-modal__performance-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={12} 
                    className={star <= staff.performance ? getPerformanceStarClass(staff.performance) : ''}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="staff-detail-modal__detail-item">
            <Trophy size={16} />
            <span className="staff-detail-modal__detail-item-label">Kinh nghiệm:</span>
            <span className="staff-detail-modal__detail-item-value">{staff.experience}</span>
          </div>
          <div className="staff-detail-modal__detail-item">
            <Calendar size={16} />
            <span className="staff-detail-modal__detail-item-label">Ngày vào làm:</span>
            <span className="staff-detail-modal__detail-item-value">
              {new Date(staff.joinDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div>
            <span className="staff-detail-modal__skills-label">Kỹ năng:</span>
            <div className="staff-detail-modal__skills-container">
              {staff.skills.map((skill, index) => (
                <span key={index} className="staff-detail-modal__skills-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="staff-detail-modal__actions">
          <button
            onClick={() => onEdit(staff)}
            className="staff-detail-modal__button staff-detail-modal__button--primary"
          >
            Chỉnh sửa
          </button>
          <button
            onClick={onClose}
            className="staff-detail-modal__button staff-detail-modal__button--secondary"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

import { User, Users, UserMinus, Clock, Building2, Star } from 'lucide-react'
import './StaffStats.scss'

interface StaffStatsProps {
  totalStaff: number
  activeStaff: number
  inactiveStaff: number
  onLeaveStaff: number
  departments: number
  averagePerformance: number
}

export default function StaffStats({
  totalStaff,
  activeStaff,
  inactiveStaff,
  onLeaveStaff,
  departments,
  averagePerformance
}: StaffStatsProps) {
  const stats = [
    { title: 'Tổng nhân viên', value: totalStaff, icon: User, color: 'var(--primary-500)' },
    { title: 'Đang làm việc', value: activeStaff, icon: Users, color: 'var(--success-500)' },
    { title: 'Nghỉ việc', value: inactiveStaff, icon: UserMinus, color: 'var(--error-500)' },
    { title: 'Nghỉ phép', value: onLeaveStaff, icon: Clock, color: 'var(--warning-500)' },
    { title: 'Phòng ban', value: departments, icon: Building2, color: 'var(--info-500)' },
    { title: 'Hiệu suất TB', value: averagePerformance, icon: Star, color: 'var(--warning-500)' }
  ]

  return (
    <div className="staff-stats">
      {stats.map((stat, index) => (
        <div key={index} className="staff-stats__card">
          <div className="staff-stats__header">
            <div 
              className="staff-stats__icon"
              style={{ background: stat.color }}
            >
              <stat.icon size={20} />
            </div>
            <h3 className="staff-stats__title">
              {stat.title}
            </h3>
          </div>
          <div className="staff-stats__value">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  )
}

import { User, Users, UserMinus, Clock, Building2, Star } from 'lucide-react'

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
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '24px', 
      marginBottom: '32px' 
    }}>
      {stats.map((stat, index) => (
        <div 
          key={index}
          style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
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
  )
}

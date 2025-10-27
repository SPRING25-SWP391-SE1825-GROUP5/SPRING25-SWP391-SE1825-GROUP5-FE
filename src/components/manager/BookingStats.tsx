import { Calendar as CalendarIcon, Clock, Settings as SettingsIcon, LucideIcon } from 'lucide-react'
import { Booking } from '@/services/bookingService'

interface BookingStatsProps {
  bookings: Booking[]
}

interface Stat {
  title: string
  value: string
  icon: LucideIcon
  color: string
}

export default function BookingStats({ bookings }: BookingStatsProps) {
  const stats: Stat[] = [
    {
      title: 'Tổng đặt lịch',
      value: bookings.length.toString(),
      icon: CalendarIcon,
      color: '#FFD875'
    },
    {
      title: 'Đã xác nhận',
      value: bookings.filter(b => b.status === 'CONFIRMED').length.toString(),
      icon: Clock,
      color: '#22C55E'
    },
    {
      title: 'Hoàn thành',
      value: bookings.filter(b => b.status === 'COMPLETED').length.toString(),
      icon: SettingsIcon,
      color: '#3B82F6'
    }
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    }}>
      {stats.map((stat, index) => (
        <div 
          key={index}
          style={{
            background: 'var(--bg-card)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            background: `${stat.color}20`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <stat.icon size={24} style={{ color: stat.color }} />
          </div>
          <div>
            <p style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              margin: '0 0 4px 0' 
            }}>
              {stat.value}
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)', 
              margin: 0 
            }}>
              {stat.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

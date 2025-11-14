import { useState, useEffect } from 'react'
import { AlertCircle, X, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ReminderService, MaintenanceReminder } from '@/services/reminderService'

interface ReminderBannerProps {
  customerId?: number
  onClose?: () => void
}

export function ReminderBanner({ customerId, onClose }: ReminderBannerProps) {
  const [upcomingReminders, setUpcomingReminders] = useState<MaintenanceReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadReminders()
  }, [customerId])

  const loadReminders = async () => {
    setLoading(true)
    try {
      const data = await ReminderService.getUpcoming(customerId)
      // Chỉ hiển thị DUE và OVERDUE
      const urgent = data.filter(r => r.status === 'DUE' || r.status === 'OVERDUE')
      setUpcomingReminders(urgent)
    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    onClose?.()
  }

  if (loading || dismissed || upcomingReminders.length === 0) {
    return null
  }

  const hasOverdue = upcomingReminders.some(r => r.status === 'OVERDUE')
  // Sử dụng màu vàng #FFD875 như email template và button
  const backgroundColor = hasOverdue ? '#FEE2E2' : '#FFF8E1' // Vàng nhạt hơn #FFD875
  const borderColor = hasOverdue ? '#EF4444' : '#FFD875' // Màu vàng chính #FFD875
  const iconColor = hasOverdue ? '#EF4444' : '#F59E0B' // Giữ icon màu cam để nổi bật

  return (
    <div
      style={{
        background: backgroundColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        position: 'relative'
      }}
    >
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          color: '#6B7280'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <X size={18} />
      </button>

      <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 12, paddingRight: 32 }}>
        <AlertCircle size={24} color={iconColor} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 4 }}>
            {hasOverdue
              ? `Bạn có ${upcomingReminders.length} nhắc nhở bảo dưỡng quá hạn`
              : `Bạn có ${upcomingReminders.length} nhắc nhở bảo dưỡng sắp đến hạn`
            }
          </h3>
          <div style={{ marginTop: 8 }}>
            {upcomingReminders.slice(0, 3).map((reminder) => (
              <div key={reminder.reminderId} style={{
                marginBottom: 6,
                fontSize: 14,
                color: '#374151'
              }}>
                <strong>{reminder.vehicle?.licensePlate || `Xe #${reminder.vehicleId}`}</strong>
                {' - '}
                {reminder.service?.serviceName || 'Bảo dưỡng định kỳ'}
                {reminder.dueDate && (
                  <span style={{ color: '#6B7280', marginLeft: 8 }}>
                    ({new Date(reminder.dueDate).toLocaleDateString('vi-VN')})
                  </span>
                )}
              </div>
            ))}
            {upcomingReminders.length > 3 && (
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                và {upcomingReminders.length - 3} nhắc nhở khác...
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/profile?tab=reminders')}
          style={{
            background: borderColor,
            color: hasOverdue ? '#fff' : '#333', // Text đen trên nền vàng, trắng trên nền đỏ
            border: 'none',
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Xem chi tiết
          <ArrowRight size={16} />
        </button>
        {upcomingReminders[0]?.serviceId && upcomingReminders[0]?.vehicleId && (
          <button
            onClick={() => navigate(`/booking?serviceId=${upcomingReminders[0].serviceId}&vehicleId=${upcomingReminders[0].vehicleId}`)}
            style={{
              background: 'transparent',
              color: borderColor,
              border: `1px solid ${borderColor}`,
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${borderColor}15`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Đặt lịch ngay
          </button>
        )}
      </div>
    </div>
  )
}


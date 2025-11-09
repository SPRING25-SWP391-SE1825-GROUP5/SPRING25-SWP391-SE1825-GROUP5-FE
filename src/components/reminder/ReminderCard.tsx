import { Calendar, Wrench, AlertCircle, CheckCircle, Clock, Bell } from 'lucide-react'
import { MaintenanceReminder } from '@/services/reminderService'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ReminderService } from '@/services/reminderService'

interface ReminderCardProps {
  reminder: MaintenanceReminder
  onRefresh?: () => void
}

export function ReminderCard({ reminder, onRefresh }: ReminderCardProps) {
  const navigate = useNavigate()

  const getStatusColor = () => {
    switch (reminder.status) {
      case 'DUE': return '#F59E0B' // Vàng
      case 'OVERDUE': return '#EF4444' // Đỏ
      case 'PENDING': return '#3B82F6' // Xanh dương
      case 'COMPLETED': return '#10B981' // Xanh lá
      default: return '#6B7280'
    }
  }

  const getStatusIcon = () => {
    switch (reminder.status) {
      case 'DUE': return <AlertCircle size={20} />
      case 'OVERDUE': return <AlertCircle size={20} />
      case 'PENDING': return <Clock size={20} />
      case 'COMPLETED': return <CheckCircle size={20} />
      default: return <Calendar size={20} />
    }
  }

  const getStatusText = () => {
    const daysUntilDue = getDaysUntilDue()
    switch (reminder.status) {
      case 'DUE': return 'Đến hạn hôm nay'
      case 'OVERDUE': return `Quá hạn ${Math.abs(daysUntilDue || 0)} ngày`
      case 'PENDING':
        if (daysUntilDue !== null) {
          if (daysUntilDue > 0) return `Còn ${daysUntilDue} ngày`
          if (daysUntilDue === 0) return 'Đến hạn hôm nay'
          return `Quá hạn ${Math.abs(daysUntilDue)} ngày`
        }
        return 'Chưa đến hạn'
      case 'COMPLETED': return 'Đã hoàn thành'
      default: return 'Không xác định'
    }
  }

  const getDaysUntilDue = (): number | null => {
    if (!reminder.dueDate) return null
    const due = new Date(reminder.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const handleBookNow = () => {
    if (reminder.serviceId && reminder.vehicleId) {
      navigate(`/booking?serviceId=${reminder.serviceId}&vehicleId=${reminder.vehicleId}`)
    } else {
      navigate('/booking')
    }
  }

  const handleSnooze = async () => {
    try {
      await ReminderService.snooze(reminder.reminderId, 7)
      toast.success('Đã hoãn nhắc nhở 7 ngày')
      onRefresh?.()
    } catch (error: any) {
      toast.error(error.message || 'Không thể hoãn nhắc nhở')
    }
  }

  const handleComplete = async () => {
    try {
      await ReminderService.complete(reminder.reminderId)
      toast.success('Đã đánh dấu hoàn thành')
      onRefresh?.()
    } catch (error: any) {
      toast.error(error.message || 'Không thể đánh dấu hoàn thành')
    }
  }

  const statusColor = getStatusColor()
  const daysUntilDue = getDaysUntilDue()

  return (
    <div
      className="reminder-card"
      style={{
        border: `2px solid ${statusColor}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Bell size={18} color={statusColor} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1F2937' }}>
              {reminder.vehicle?.vehicleModel?.modelName || 'Xe'} - {reminder.vehicle?.licensePlate || `#${reminder.vehicleId}`}
            </h3>
          </div>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
            {reminder.service?.serviceName || 'Bảo dưỡng định kỳ'}
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: statusColor,
          fontWeight: 600,
          fontSize: 14,
          padding: '4px 12px',
          background: `${statusColor}15`,
          borderRadius: 8
        }}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      {/* Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: reminder.dueDate && reminder.dueMileage ? '1fr 1fr' : '1fr',
        gap: 16,
        marginBottom: 16
      }}>
        {reminder.dueDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            background: '#F9FAFB',
            borderRadius: 8
          }}>
            <Calendar size={20} color="#6B7280" />
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Đến hạn ngày</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
                {new Date(reminder.dueDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        )}
        {reminder.dueMileage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            background: '#F9FAFB',
            borderRadius: 8
          }}>
            <Wrench size={20} color="#6B7280" />
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>Đến hạn số km</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
                {reminder.dueMileage.toLocaleString('vi-VN')} km
              </div>
              {reminder.vehicle?.currentMileage && (
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  Hiện tại: {reminder.vehicle.currentMileage.toLocaleString('vi-VN')} km
                  {reminder.dueMileage > reminder.vehicle.currentMileage && (
                    <span> (còn {reminder.dueMileage - reminder.vehicle.currentMileage} km)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {reminder.status !== 'COMPLETED' && !reminder.isCompleted && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleBookNow}
            style={{
              background: '#FFD875',
              color: '#333',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
              flex: 1,
              minWidth: 120
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F4C430'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFD875'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Đặt lịch ngay
          </button>
          <button
            onClick={handleSnooze}
            style={{
              background: '#F3F4F6',
              color: '#333',
              border: '1px solid #E5E7EB',
              padding: '10px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E5E7EB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F3F4F6'
            }}
          >
            Hoãn 7 ngày
          </button>
          <button
            onClick={handleComplete}
            style={{
              background: 'transparent',
              color: '#10B981',
              border: '1px solid #10B981',
              padding: '10px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#10B981'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#10B981'
            }}
          >
            Đã hoàn thành
          </button>
        </div>
      )}

      {reminder.status === 'COMPLETED' && (
        <div style={{
          padding: 12,
          background: '#ECFDF5',
          borderRadius: 8,
          color: '#10B981',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle size={16} />
          <span>Nhắc nhở này đã được hoàn thành</span>
        </div>
      )}
    </div>
  )
}


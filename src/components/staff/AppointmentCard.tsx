import { BaseButton } from '@/components/common'

export type ServiceItem = { id: number; name: string; estimatedDuration: number }
export type Technician = { id: number; name: string; specialty: string }
export type Appointment = {
  id: number
  customerName: string
  customerPhone: string
  vehicleModel: string
  licensePlate: string
  appointmentDate: string
  appointmentTime: string
  status: 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'normal' | 'high'
  estimatedCost: number
  requestedServices: ServiceItem[]
  customerNotes?: string
  assignedTechnician?: Technician | null
}

export type AppointmentCardProps = {
  appointment: Appointment
  onConfirm?: (a: Appointment) => void
  onReschedule?: (a: Appointment) => void
  onCancel?: (a: Appointment) => void
  onAssign?: (a: Appointment) => void
  onStart?: (a: Appointment) => void
  onViewProgress?: (a: Appointment) => void
  onComplete?: (a: Appointment) => void
  onViewDetails?: (a: Appointment) => void
  onContact?: (a: Appointment) => void
}

const getStatusText = (status: Appointment['status']) => {
  const map: Record<Appointment['status'], string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    checked_in: 'Đã check-in',
    in_progress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  }
  return map[status] || status
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

export default function AppointmentCard({ appointment, ...handlers }: AppointmentCardProps) {
  return (
    <div
      className="appointment-card"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 8,
        padding: '1.5rem',
        border: '1px solid var(--border-primary)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem', background: 'var(--primary-50)', borderRadius: 8, minWidth: 80 }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--primary-600)', fontWeight: 500 }}>{formatDate(appointment.appointmentDate)}</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-700)' }}>{appointment.appointmentTime}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`status-badge status-${appointment.status}`} style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500 }}>
            {getStatusText(appointment.status)}
          </span>
          {appointment.priority === 'high' && <span style={{ color: 'var(--error-500)' }}>⚠</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{appointment.customerName}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <span>📞 {appointment.customerPhone}</span>
            <span>🚗 {appointment.vehicleModel} - {appointment.licensePlate}</span>
          </div>
        </div>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Dịch vụ yêu cầu:</h4>
          <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1rem' }}>
            {appointment.requestedServices.map((s) => (
              <li key={s.id} style={{ marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                {s.name} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>({s.estimatedDuration}p)</span>
              </li>
            ))}
          </ul>
          <div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>Ước tính: {formatCurrency(appointment.estimatedCost)}</div>
        </div>

        {appointment.customerNotes && (
          <div style={{ gridColumn: '1 / -1' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ghi chú từ khách hàng:</h4>
            <p style={{ margin: 0, color: 'var(--text-primary)', fontStyle: 'italic' }}>{appointment.customerNotes}</p>
          </div>
        )}

        {appointment.assignedTechnician && (
          <div style={{ gridColumn: '1 / -1' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Kỹ thuật viên được phân công:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{appointment.assignedTechnician.name}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{appointment.assignedTechnician.specialty}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-secondary)' }}>
        {appointment.status === 'pending' && (
          <>
            <BaseButton size="sm" onClick={() => handlers.onConfirm?.(appointment)}>✓ Xác nhận</BaseButton>
            <BaseButton size="sm" variant="outline" onClick={() => handlers.onReschedule?.(appointment)}>📅 Đổi lịch</BaseButton>
            <BaseButton size="sm" variant="error" onClick={() => handlers.onCancel?.(appointment)}>✕ Hủy</BaseButton>
          </>
        )}
        {appointment.status === 'confirmed' && (
          <>
            <BaseButton size="sm" variant="outline" onClick={() => handlers.onAssign?.(appointment)}>👤 Phân công KTV</BaseButton>
            <BaseButton size="sm" onClick={() => handlers.onStart?.(appointment)}>▶ Bắt đầu</BaseButton>
          </>
        )}
        {appointment.status === 'in_progress' && (
          <>
            <BaseButton size="sm" variant="outline" onClick={() => handlers.onViewProgress?.(appointment)}>👁 Xem tiến độ</BaseButton>
            <BaseButton size="sm" variant="success" onClick={() => handlers.onComplete?.(appointment)}>✓ Hoàn thành</BaseButton>
          </>
        )}
        <BaseButton size="sm" variant="outline" onClick={() => handlers.onViewDetails?.(appointment)}>ℹ Chi tiết</BaseButton>
        <BaseButton size="sm" variant="outline" onClick={() => handlers.onContact?.(appointment)}>✉ Liên hệ</BaseButton>
      </div>
    </div>
  )
}


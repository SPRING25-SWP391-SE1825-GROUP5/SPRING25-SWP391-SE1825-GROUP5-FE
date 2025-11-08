import { useEffect, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { BookingService } from '@/services/bookingService'
import toast from 'react-hot-toast'

interface BookingStatusModalProps {
  open: boolean
  bookingId: number | null
  currentStatus: string | null
  onClose: () => void
  onUpdated: () => void | Promise<void>
}

const ALLOWED_STATUSES = [
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'CANCELLED', label: 'Đã hủy' }
]

const STATUS_MAP: Record<string, string> = {
  'pending': 'PENDING',
  'confirmed': 'CONFIRMED',
  'in_progress': 'IN_PROGRESS',
  'completed': 'COMPLETED',
  'paid': 'PAID',
  'cancelled': 'CANCELLED'
}

export default function BookingStatusModal({
  open,
  bookingId,
  currentStatus,
  onClose,
  onUpdated
}: BookingStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Normalize status from lowercase to uppercase
  const normalizedCurrentStatus = currentStatus 
    ? (STATUS_MAP[currentStatus.toLowerCase()] || currentStatus.toUpperCase())
    : ''

  useEffect(() => {
    if (open && normalizedCurrentStatus) {
      setSelectedStatus(normalizedCurrentStatus)
      setError(null)
    }
  }, [open, normalizedCurrentStatus])

  const handleSubmit = async () => {
    if (!bookingId) {
      toast.error('Không tìm thấy booking ID')
      return
    }

    if (selectedStatus === normalizedCurrentStatus) {
      toast.error('Vui lòng chọn trạng thái khác')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await BookingService.updateBookingStatus(bookingId, selectedStatus)
      
      if (response.success) {
        toast.success('Cập nhật trạng thái thành công')
        await onUpdated()
        onClose()
      } else {
        const errorMessage = response.message || 'Không thể cập nhật trạng thái'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    return ALLOWED_STATUSES.find(s => s.value === status)?.label || status
  }

  if (!open || !bookingId) return null

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)'
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(500px, 90vw)',
          maxHeight: '90vh',
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-primary, #e5e7eb)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text-primary, #111827)'
            }}>
              Thay đổi trạng thái đặt lịch
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: 'var(--text-secondary, #6b7280)'
            }}>
              Booking ID: #{bookingId}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary, #6b7280)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflowY: 'auto'
        }}>
          {/* Current Status */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary, #111827)'
            }}>
              Trạng thái hiện tại:
            </label>
            <div style={{
              padding: '12px',
              background: 'var(--bg-tertiary, #f3f4f6)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text-primary, #111827)'
            }}>
              {normalizedCurrentStatus} - {getStatusLabel(normalizedCurrentStatus)}
            </div>
          </div>

          {/* New Status */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary, #111827)'
            }}>
              Trạng thái mới: *
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                if (error) setError(null)
              }}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${error ? 'var(--error-500, #ef4444)' : 'var(--border-primary, #e5e7eb)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-card, #ffffff)',
                color: 'var(--text-primary, #111827)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {ALLOWED_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {error && (
              <div style={{
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--error-500, #ef4444)'
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>

          {/* Warning */}
          {selectedStatus === 'CANCELLED' && normalizedCurrentStatus !== 'CANCELLED' && (
            <div style={{
              padding: '12px',
              background: 'var(--warning-50, #fef3c7)',
              border: '1px solid var(--warning-200, #fde68a)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--warning-700, #92400e)',
              marginBottom: '24px'
            }}>
              <AlertCircle size={16} />
              <span>Việc hủy đặt lịch sẽ không thể hoàn tác. Bạn có chắc chắn?</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid var(--border-primary, #e5e7eb)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--border-primary, #e5e7eb)',
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary, #111827)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedStatus === normalizedCurrentStatus}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: loading || selectedStatus === normalizedCurrentStatus
                ? 'var(--bg-tertiary, #f3f4f6)'
                : 'var(--primary-500, #3b82f6)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: loading || selectedStatus === normalizedCurrentStatus
                ? 'var(--text-tertiary, #9ca3af)'
                : '#ffffff',
              cursor: loading || selectedStatus === normalizedCurrentStatus ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  )
}









import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Settings, AlertCircle } from 'lucide-react'
import { BookingService, AdminBookingSummary } from '@/services/bookingService'
import toast from 'react-hot-toast'
import './_booking-modal.scss'

interface BookingStatusModalProps {
  isOpen: boolean
  booking: AdminBookingSummary
  onClose: () => void
  onSuccess: () => void
}

const ALLOWED_STATUSES = [
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'CANCELLED', label: 'Đã hủy' }
]

const BookingStatusModal: React.FC<BookingStatusModalProps> = ({
  isOpen,
  booking,
  onClose,
  onSuccess
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(booking.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && booking) {
      setSelectedStatus(booking.status)
      setError(null)
    }
  }, [isOpen, booking])

  const handleSubmit = async () => {
    if (selectedStatus === booking.status) {
      toast.error('Vui lòng chọn trạng thái khác')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await BookingService.updateBookingStatus(booking.bookingId, selectedStatus)
      
      if (response.success) {
        toast.success('Cập nhật trạng thái thành công')
        onSuccess()
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

  if (!isOpen || !booking) return null

  return createPortal(
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal booking-status-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="booking-modal__header">
          <div>
            <h2 className="booking-modal__title">
              Thay đổi trạng thái đặt lịch
            </h2>
            <p className="booking-modal__subtitle">
              Booking ID: #{booking.bookingId}
            </p>
          </div>
          <button className="booking-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="booking-modal__content">
          {/* Current Status */}
          <div className="booking-modal__section">
            <label className="info-label">Trạng thái hiện tại:</label>
            <div className="current-status">
              {booking.status} - {getStatusLabel(booking.status)}
            </div>
          </div>

          {/* New Status */}
          <div className="booking-modal__section">
            <label className="info-label">Trạng thái mới: *</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                if (error) setError(null)
              }}
              className={`status-select ${error ? 'error' : ''}`}
              disabled={loading}
            >
              {ALLOWED_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {error && (
              <div className="form-error">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>

          {/* Warning */}
          {selectedStatus === 'CANCELLED' && booking.status !== 'CANCELLED' && (
            <div className="booking-modal__warning">
              <AlertCircle size={16} />
              <span>Việc hủy đặt lịch sẽ không thể hoàn tác. Bạn có chắc chắn?</span>
            </div>
          )}

          {/* Actions */}
          <div className="booking-modal__actions">
            <button className="btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={loading || selectedStatus === booking.status}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default BookingStatusModal


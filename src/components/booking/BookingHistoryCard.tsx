import { useState } from 'react'
import { 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { BaseButton } from '@/components/common'
import FeedbackModal from '@/components/feedback/FeedbackModal'
import { FeedbackData } from '@/components/feedback'
import './BookingHistoryCard.scss'

interface BookingHistoryCardProps {
  booking: {
    bookingId: number
    bookingCode: string
    serviceName: string
    status: string
    bookingDate: string
    centerName: string
    technicianName?: string
    vehicleInfo: {
      licensePlate: string
      carModel: string
    }
    estimatedCost?: number
    actualCost?: number
    notes?: string
    hasFeedback?: boolean
    feedback?: any
  }
  onFeedback?: (bookingId: number, feedback: FeedbackData) => Promise<void> | void
  onEditFeedback?: (bookingId: number, feedback: FeedbackData) => Promise<void> | void
}

export default function BookingHistoryCard({ 
  booking, 
  onFeedback, 
  onEditFeedback 
}: BookingHistoryCardProps) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Kiểm tra xem có thể đánh giá không - chỉ cho phép khi status là COMPLETED
  const canGiveFeedback = () => {
    return booking.status === 'COMPLETED' && !booking.hasFeedback
  }

  // Kiểm tra xem có thể sửa đánh giá không - chỉ cho phép khi status là COMPLETED
  const canEditFeedback = () => {
    return booking.status === 'COMPLETED' && booking.hasFeedback
  }

  // Lấy màu sắc cho trạng thái
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'status-pending'
      case 'CONFIRMED':
        return 'status-confirmed'
      case 'IN_PROGRESS':
        return 'status-in-progress'
      case 'COMPLETED':
        return 'status-completed'
      case 'PAID':
        return 'status-paid'
      case 'CANCELLED':
        return 'status-cancelled'
      default:
        return 'status-default'
    }
  }

  // Lấy text hiển thị cho trạng thái
  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Chờ xác nhận'
      case 'CONFIRMED':
        return 'Đã xác nhận'
      case 'IN_PROGRESS':
        return 'Đang thực hiện'
      case 'COMPLETED':
        return 'Hoàn thành'
      case 'PAID':
        return 'Đã thanh toán'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status
    }
  }

  // Xử lý đánh giá
  const handleFeedbackClick = () => {
    setShowFeedbackModal(true)
  }

  // Xử lý gửi đánh giá
  const handleSubmitFeedback = async (feedback: FeedbackData) => {
    if (onFeedback) {
      const result = onFeedback(booking.bookingId, feedback)
      if (result instanceof Promise) {
        await result
      }
    }
    setShowFeedbackModal(false)
  }

  // Xử lý sửa đánh giá
  const handleEditFeedback = async (feedback: FeedbackData) => {
    if (onEditFeedback) {
      const result = onEditFeedback(booking.bookingId, feedback)
      if (result instanceof Promise) {
        await result
      }
    }
    setShowFeedbackModal(false)
  }

  return (
    <>
      <div className="booking-history-card">
        {/* Header */}
        <div className="booking-card-header">
          <div className="booking-info">
            <h4 className="booking-title">{booking.serviceName}</h4>
            <p className="booking-code">Mã đặt lịch: {booking.bookingCode}</p>
          </div>
          <div className="booking-status">
            <span className={`status-badge ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>
        </div>

        {/* Basic Info */}
        <div className="booking-basic-info">
          <div className="info-row">
            <ClockIcon className="info-icon" />
            <span className="info-label">Ngày đặt lịch:</span>
            <span className="info-value">
              {new Date(booking.bookingDate).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          
          <div className="info-row">
            <MapPinIcon className="info-icon" />
            <span className="info-label">Trung tâm:</span>
            <span className="info-value">{booking.centerName}</span>
          </div>

          {booking.technicianName && (
            <div className="info-row">
              <UserIcon className="info-icon" />
              <span className="info-label">Kỹ thuật viên:</span>
              <span className="info-value">{booking.technicianName}</span>
            </div>
          )}
        </div>

        {/* Vehicle Info */}
        <div className="booking-vehicle-info">
          <div className="vehicle-info">
            <span className="vehicle-label">Phương tiện:</span>
            <span className="vehicle-value">
              {booking.vehicleInfo.licensePlate} - {booking.vehicleInfo.carModel}
            </span>
          </div>
        </div>

        {/* Cost Info */}
        <div className="booking-cost-info">
          <div className="cost-row">
            <span className="cost-label">Chi phí:</span>
            <span className="cost-value">
              {booking.actualCost ? 
                `${booking.actualCost.toLocaleString('vi-VN')} VNĐ` : 
                `Ước tính: ${booking.estimatedCost?.toLocaleString('vi-VN')} VNĐ`
              }
            </span>
          </div>
        </div>

        {/* Expandable Details */}
        <div className="booking-details">
          <button 
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>Chi tiết</span>
            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
              ▼
            </span>
          </button>

          {isExpanded && (
            <div className="booking-details-content">
              {booking.notes && (
                <div className="detail-section">
                  <h5 className="detail-section-title">Ghi chú</h5>
                  <p className="detail-section-content">{booking.notes}</p>
                </div>
              )}

              {/* Feedback Section */}
              {booking.hasFeedback && booking.feedback && (
                <div className="detail-section">
                  <h5 className="detail-section-title">Đánh giá của bạn</h5>
                  <div className="feedback-display">
                    <div className="feedback-rating">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={`star-icon ${i < booking.feedback.rating ? 'filled' : ''}`}
                        />
                      ))}
                    </div>
                    <p className="feedback-comment">{booking.feedback.comment}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="booking-actions">
          {canGiveFeedback() && (
            <BaseButton
              variant="primary"
              size="sm"
              onClick={handleFeedbackClick}
              className="feedback-button"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Đánh giá dịch vụ
            </BaseButton>
          )}

          {canEditFeedback() && (
            <BaseButton
              variant="outline"
              size="sm"
              onClick={handleFeedbackClick}
              className="edit-feedback-button"
            >
              <StarIcon className="w-4 h-4" />
              Sửa đánh giá
            </BaseButton>
          )}

          {booking.status === 'CANCELLED' && (
            <div className="cancelled-info">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>Đặt lịch đã bị hủy</span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          bookingId={booking.bookingId.toString()}
          serviceName={booking.serviceName}
          technician={booking.technicianName || 'Chưa xác định'}
          partsUsed={[]} // Có thể cần thêm thông tin phụ tùng từ API
          onSubmit={booking.hasFeedback ? handleEditFeedback : handleSubmitFeedback}
          initialData={booking.feedback}
        />
      )}
    </>
  )
}


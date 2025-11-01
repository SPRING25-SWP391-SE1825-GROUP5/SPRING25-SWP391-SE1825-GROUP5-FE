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
    bookingCode?: string
    serviceName: string
    status: string
    bookingDate?: string
    date?: string
    slotTime?: string
    slotLabel?: string
    centerName: string
    technicianName?: string
    vehicleInfo?: {
      licensePlate?: string
      carModel?: string
    }
    licensePlate?: string
    vehiclePlate?: string
    carModel?: string
    estimatedCost?: number
    actualCost?: number
    notes?: string
    hasFeedback?: boolean
    feedback?: any
    createdAt?: string
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
  const [isExpanded, setIsExpanded] = useState(false) // Mặc định thu gọn

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
      <div className="booking-history-card" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Header - Always visible */}
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

        {/* Compact Info - Always visible */}
        <div className="booking-compact-info">
          <div className="compact-row">
            <ClockIcon className="info-icon" />
            <span className="info-value">
              {new Date(booking.bookingDate || booking.date || booking.createdAt || Date.now()).toLocaleDateString('vi-VN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            {booking.slotTime && (
              <>
                <ClockIcon className="info-icon" />
                <span className="info-value">{booking.slotTime}</span>
              </>
            )}
            <MapPinIcon className="info-icon" />
            <span className="info-value">{booking.centerName}</span>
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="booking-expanded-content">
            {/* Detailed Info */}
            <div className="booking-basic-info">
              <div className="info-row">
                <ClockIcon className="info-icon" />
                <span className="info-label">Ngày đặt lịch:</span>
                <span className="info-value">
                  {new Date(booking.bookingDate || booking.date || booking.createdAt || Date.now()).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {booking.slotTime && (
                <div className="info-row">
                  <ClockIcon className="info-icon" />
                  <span className="info-label">Khung giờ:</span>
                  <span className="info-value">{booking.slotTime}{booking.slotLabel ? ` (${booking.slotLabel})` : ''}</span>
                </div>
              )}
              
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
                  {(booking.vehicleInfo?.licensePlate || booking.vehiclePlate || booking.licensePlate || '---')}
                </span>
              </div>
            </div>

            {/* Cost Info - Only show if we have valid cost data */}
            {(booking.actualCost || (booking.estimatedCost && booking.estimatedCost > 0)) && (
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
            )}

            {/* Additional Details */}
            {booking.notes && (
              <div className="detail-section">
                <h5 className="detail-section-title">Ghi chú</h5>
                <p className="detail-section-content">{booking.notes}</p>
              </div>
            )}

            {/* Debug Feedback Data */}
            {(() => {
              console.log('🔍 Booking feedback debug:', {
                bookingId: booking.bookingId,
                hasFeedback: booking.hasFeedback,
                feedback: booking.feedback,
                status: booking.status
              })
              return null
            })()}

            {/* Debug Feedback Info */}
            {(() => {
              console.log('🔍 BookingHistoryCard - Feedback debug:', {
                bookingId: booking.bookingId,
                status: booking.status,
                hasFeedback: booking.hasFeedback,
                feedback: booking.feedback,
                feedbackExists: !!booking.feedback
              })
              return null
            })()}

            {/* Feedback Section */}
            {((booking.hasFeedback && booking.feedback) || (booking.feedback && booking.feedback.technicianRating > 0)) && (
              <div className="detail-section">
                <h5 className="detail-section-title">Đánh giá của bạn</h5>
                <div className="feedback-display">
                  {/* Technician Rating */}
                  <div className="feedback-rating-section">
                    <h6 className="rating-label">Đánh giá kỹ thuật viên:</h6>
                    <div className="feedback-rating">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={`star-icon ${i < (booking.feedback.technicianRating || 0) ? 'filled' : ''}`}
                        />
                      ))}
                      <span className="rating-text">
                        {booking.feedback.technicianRating || 0}/5
                      </span>
                    </div>
                  </div>

                  {/* Parts Rating */}
                  {booking.feedback.partsRating > 0 && (
                    <div className="feedback-rating-section">
                      <h6 className="rating-label">Đánh giá phụ tùng thay thế:</h6>
                      <div className="feedback-rating">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon 
                            key={i} 
                            className={`star-icon ${i < (booking.feedback.partsRating || 0) ? 'filled' : ''}`}
                          />
                        ))}
                        <span className="rating-text">
                          {booking.feedback.partsRating || 0}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Comment */}
                  <div className="feedback-comment-section">
                    <h6 className="comment-label">Nhận xét:</h6>
                    <p className="feedback-comment">{booking.feedback.comment || 'Không có nhận xét'}</p>
                  </div>

                  {/* Tags */}
                  {booking.feedback.tags && booking.feedback.tags.length > 0 && (
                    <div className="feedback-tags-section">
                      <h6 className="tags-label">Thẻ đánh giá:</h6>
                      <div className="feedback-tags">
                        {booking.feedback.tags.map((tag: string, index: number) => (
                          <span key={index} className="feedback-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="booking-actions">
              {canGiveFeedback() && (
                <BaseButton
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFeedbackClick()
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFeedbackClick()
                  }}
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
        )}

        {/* Expand/Collapse Indicator */}
        <div className="expand-indicator">
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
            {isExpanded ? '▲' : '▼'}
          </span>
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
          initialData={booking.feedback ? {
            technicianRating: booking.feedback.technicianRating || 0,
            partsRating: booking.feedback.partsRating || 0,
            comment: booking.feedback.comment || '',
            tags: booking.feedback.tags || []
          } : undefined}
        />
      )}
    </>
  )
}


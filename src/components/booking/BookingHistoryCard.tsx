import { useState } from 'react'
import { 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon
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
  onPayment?: (bookingId: number) => Promise<void> | void
  isProcessingPayment?: boolean
  isCancelling?: boolean
  onCancel?: (bookingId: number) => Promise<void> | void
  isNewest?: boolean
  isExpanded?: boolean
  onToggle?: () => void
}

export default function BookingHistoryCard({ 
  booking, 
  onFeedback, 
  onEditFeedback,
  onPayment,
  isProcessingPayment = false,
  isCancelling = false,
  onCancel,
  isNewest = false,
  isExpanded = false,
  onToggle
}: BookingHistoryCardProps) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [internalExpanded, setInternalExpanded] = useState(isExpanded)
  
  // Sử dụng isExpanded từ props nếu có, nếu không thì dùng state internal
  const expanded = onToggle !== undefined ? isExpanded : internalExpanded
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded))

  // Kiểm tra xem có thể đánh giá không - chỉ cho phép khi status là COMPLETED
  const canGiveFeedback = () => {
    return booking.status === 'COMPLETED' && !booking.hasFeedback
  }

  // Kiểm tra xem có thể sửa đánh giá không - chỉ cho phép khi status là COMPLETED
  const canEditFeedback = () => {
    return booking.status === 'COMPLETED' && booking.hasFeedback
  }

  // Kiểm tra xem có thể thanh toán không - chỉ cần status COMPLETED
  const canPay = () => {
    if (!onPayment) return false
    const status = (booking.status || '').trim().toUpperCase()
    return status === 'COMPLETED'
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
      <div className="booking-history-card" onClick={handleToggle}>
        {/* Header - Always visible */}
        <div className="booking-card-header">
          <div className="booking-info">
            <h4 className="booking-title">{booking.serviceName}</h4>
            <p className="booking-code">Mã đặt lịch: {booking.bookingCode}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 10 }}>
            {/* Nút thanh toán - hiển thị ngay trong header nếu status COMPLETED */}
            {canPay() && onPayment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (process.env.NODE_ENV === 'development') {
                      console.log('[Payment Button] Clicked for booking:', booking.bookingId)
                    }
                    if (onPayment) {
                      const result = onPayment(booking.bookingId)
                      if (result instanceof Promise) {
                        result.catch(err => console.error('Payment error:', err))
                      }
                    }
                  }}
                  disabled={isProcessingPayment}
                  className="payment-button"
                  style={{
                    background: '#10B981',
                    border: '1px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    zIndex: 10, // Đảm bảo nút luôn ở trên expand-indicator
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Thêm shadow để nổi bật
                    cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                    borderRadius: '6px',
                    color: '#fff',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessingPayment) {
                      e.currentTarget.style.background = '#059669'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessingPayment) {
                      e.currentTarget.style.background = '#10B981'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <CreditCardIcon className="w-4 h-4" />
                  {isProcessingPayment ? 'Đang xử lý...' : 'Thanh toán'}
                </button>
            )}
            <div className="booking-status" style={{ position: 'relative', zIndex: 10 }}>
              <span className={`status-badge ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
            </div>
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
        {expanded && (
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

            {/* Payment Section - chỉ hiển thị khi status COMPLETED */}
            {canPay() && onPayment && (
              <div className="booking-payment-section" style={{
                marginTop: '20px',
                padding: '20px',
                borderTop: '2px solid #e5e7eb',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '2px solid #10B981'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h5 className="detail-section-title" style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '16px', fontWeight: 700 }}>💳 Thanh toán dịch vụ</h5>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      {booking.actualCost ? 
                        `Tổng tiền: ${booking.actualCost.toLocaleString('vi-VN')} VNĐ` : 
                        booking.estimatedCost ? 
                        `Ước tính: ${booking.estimatedCost.toLocaleString('vi-VN')} VNĐ` :
                        'Vui lòng thanh toán để hoàn tất dịch vụ'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onPayment) {
                      const result = onPayment(booking.bookingId)
                      if (result instanceof Promise) {
                        result.catch(err => console.error('Payment error:', err))
                      }
                    }
                  }}
                  disabled={isProcessingPayment}
                  style={{
                    background: '#10B981',
                    border: '1px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    width: '100%',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isProcessingPayment ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessingPayment) {
                      e.currentTarget.style.background = '#059669'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessingPayment) {
                      e.currentTarget.style.background = '#10B981'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <CreditCardIcon className="w-5 h-5" />
                  {isProcessingPayment ? 'Đang xử lý...' : 'Chọn phương thức thanh toán'}
                </button>
              </div>
            )}

            {/* Additional Details */}
            {booking.notes && (
              <div className="detail-section">
                <h5 className="detail-section-title">Ghi chú</h5>
                <p className="detail-section-content">{booking.notes}</p>
              </div>
            )}

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
              {/* Nút thanh toán - chỉ hiển thị khi COMPLETED và chưa PAID */}
              {canPay() && onPayment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onPayment) {
                      const result = onPayment(booking.bookingId)
                      if (result instanceof Promise) {
                        result.catch(err => console.error('Payment error:', err))
                      }
                    }
                  }}
                  disabled={isProcessingPayment}
                  className="payment-button"
                  style={{
                    background: '#10B981',
                    border: '1px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isProcessingPayment ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessingPayment) {
                      e.currentTarget.style.background = '#059669'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessingPayment) {
                      e.currentTarget.style.background = '#10B981'
                    }
                  }}
                >
                  <CreditCardIcon className="w-4 h-4" />
                  {isProcessingPayment ? 'Đang xử lý...' : 'Thanh toán'}
                </button>
              )}

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
          <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>
            {expanded ? '▲' : '▼'}
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


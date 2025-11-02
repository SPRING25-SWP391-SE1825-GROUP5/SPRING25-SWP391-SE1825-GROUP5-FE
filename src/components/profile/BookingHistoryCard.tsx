import type { CustomerBooking } from '@/services/bookingService'

interface BookingHistoryCardProps {
  booking: CustomerBooking
  isExpanded?: boolean
  onToggle?: () => void
  onCancel?: (bookingId: number) => void
  onPayment?: (bookingId: number) => void
  isCancelling?: boolean
  isProcessingPayment?: boolean
}

const formatDate = (dateString: string) => {
  if (dateString === 'N/A') return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
}

const getStatusBadge = (status: string) => {
  const statusUpper = status.toUpperCase()
  let badgeClass = 'booking-status-badge'
  let text = status

  switch (statusUpper) {
    case 'PAID':
      badgeClass += ' status-paid'
      text = 'Đã thanh toán'
      break
    case 'COMPLETED':
      badgeClass += ' status-completed'
      text = 'Hoàn thành'
      break
    case 'CANCELLED':
      badgeClass += ' status-cancelled'
      text = 'Đã hủy'
      break
    case 'PENDING':
      badgeClass += ' status-pending'
      text = 'Chờ xác nhận'
      break
    case 'CONFIRMED':
      badgeClass += ' status-confirmed'
      text = 'Đã xác nhận'
      break
    default:
      badgeClass += ' status-default'
  }

  return (
    <span className={badgeClass}>
      {text}
    </span>
  )
}

export default function BookingHistoryCard({ 
  booking, 
  isExpanded = false, 
  onToggle,
  onCancel,
  onPayment,
  isCancelling = false,
  isProcessingPayment = false
}: BookingHistoryCardProps) {
  return (
    <>
      <div 
        className="profile-v2__card"
        style={{ 
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          position: 'relative',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onClick={onToggle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e5e7eb'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          {getStatusBadge(booking.status)}
        </div>

        {/* Service Name */}
        <div style={{ marginBottom: '16px', paddingRight: '120px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: 0,
            marginBottom: '4px',
            color: '#111827'
          }}>
            {booking.serviceName}
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Mã đặt lịch: #{booking.bookingId}
          </p>
        </div>

        {/* Booking Details */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '12px'
        }}>
          {/* Date */}
          <div>
            <p style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              margin: 0,
              marginBottom: '2px'
            }}>
              Ngày
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#374151', 
              margin: 0,
              fontWeight: '500'
            }}>
              {formatDate(booking.date)}
            </p>
          </div>

          {/* Time Slot */}
          {booking.slotTime !== 'N/A' && (
            <div>
              <p style={{ 
                fontSize: '12px', 
                color: '#9ca3af', 
                margin: 0,
                marginBottom: '2px'
              }}>
                Giờ
              </p>
              <p style={{ 
                fontSize: '14px', 
                color: '#374151', 
                margin: 0,
                fontWeight: '500'
              }}>
                {booking.slotTime} ({booking.slotLabel})
              </p>
            </div>
          )}

          {/* Center */}
          <div>
            <p style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              margin: 0,
              marginBottom: '2px'
            }}>
              Trung tâm
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#374151', 
              margin: 0,
              fontWeight: '500'
            }}>
              {booking.centerName}
            </p>
          </div>

          {/* Vehicle */}
          <div>
            <p style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              margin: 0,
              marginBottom: '2px'
            }}>
              Xe
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#374151', 
              margin: 0,
              fontWeight: '500'
            }}>
              {booking.vehiclePlate}
            </p>
          </div>
        </div>

        {/* Special Requests */}
        {booking.specialRequests && booking.specialRequests !== 'string' && !isExpanded && (
          <div style={{ 
            marginTop: '16px', 
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              margin: 0,
              marginBottom: '4px'
            }}>
              Yêu cầu đặc biệt:
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#374151', 
              margin: 0
            }}>
              {booking.specialRequests}
            </p>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          id={`booking-details-${booking.bookingId}`}
          style={{
            marginTop: '0',
            padding: '20px',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderTopLeftRadius: '0',
            borderTopRightRadius: '0',
            borderRadius: '0 0 8px 8px',
            backgroundColor: '#f9fafb',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {/* Booking ID */}
            <div>
              <p style={{ 
                fontSize: '12px', 
                color: '#9ca3af', 
                margin: 0,
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                Mã đặt lịch
              </p>
              <p style={{ 
                fontSize: '14px', 
                color: '#374151', 
                margin: 0,
                fontWeight: '600',
                fontFamily: 'monospace'
              }}>
                #{booking.bookingId}
              </p>
            </div>

            {/* Status */}
            <div>
              <p style={{ 
                fontSize: '12px', 
                color: '#9ca3af', 
                margin: 0,
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                Trạng thái
              </p>
              <div>
                {getStatusBadge(booking.status)}
              </div>
            </div>

            {/* Action Buttons - Only show for PENDING status in expanded section */}
            {booking.status === 'PENDING' && (
              <div style={{ 
                gridColumn: '1 / -1', 
                display: 'flex', 
                gap: '12px',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPayment?.(booking.bookingId)
                  }}
                  disabled={isProcessingPayment}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: isProcessingPayment ? '#f3f4f6' : '#FFD875',
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessingPayment) {
                      e.currentTarget.style.background = '#FFE082'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(255, 216, 117, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessingPayment) {
                      e.currentTarget.style.background = '#FFD875'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  {isProcessingPayment ? 'Đang xử lý...' : 'Thanh toán'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancel?.(booking.bookingId)
                  }}
                  disabled={isCancelling}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: isCancelling ? '#f3f4f6' : '#fee2e2',
                    color: isCancelling ? '#9ca3af' : '#991b1b',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCancelling) {
                      e.currentTarget.style.background = '#fecaca'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCancelling) {
                      e.currentTarget.style.background = '#fee2e2'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  {isCancelling ? 'Đang hủy...' : 'Hủy đặt lịch'}
                </button>
              </div>
            )}

            {/* Date Created */}
            {booking.createdAt && (
              <div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af', 
                  margin: 0,
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  Ngày tạo đặt lịch
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#374151', 
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {new Date(booking.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            {/* Special Requests - Expanded */}
            {booking.specialRequests && booking.specialRequests !== 'string' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af', 
                  margin: 0,
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  Yêu cầu đặc biệt
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#374151', 
                  margin: 0,
                  lineHeight: '1.6',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  {booking.specialRequests}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
            padding-top: 20px;
            padding-bottom: 20px;
          }
        }

        .booking-status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .booking-status-badge.status-paid {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .booking-status-badge.status-completed {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .booking-status-badge.status-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        .booking-status-badge.status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .booking-status-badge.status-confirmed {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .booking-status-badge.status-default {
          background-color: #f3f4f6;
          color: #374151;
        }
      `}</style>
    </>
  )
}


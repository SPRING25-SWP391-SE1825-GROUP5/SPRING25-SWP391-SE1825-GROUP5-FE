import type { CustomerBooking } from '@/services/bookingService'
import { BookingService } from '@/services/bookingService'
import { WorkOrderPartService } from '@/services/workOrderPartService'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface BookingHistoryCardProps {
  booking: CustomerBooking
  isExpanded?: boolean
  isNewest?: boolean
  onToggle?: () => void
  onCancel?: (bookingId: number) => void
  onPayment?: (bookingId: number) => void
  isCancelling?: boolean
  isProcessingPayment?: boolean
}

interface BookingPart {
  workOrderPartId: number
  partId: number
  partName: string
  quantityUsed: number
  status: string
  unitPrice?: number
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
  isNewest = false,
  onToggle,
  onCancel,
  onPayment,
  isCancelling = false,
  isProcessingPayment = false
}: BookingHistoryCardProps) {
  const [parts, setParts] = useState<BookingPart[]>([])
  const [loadingParts, setLoadingParts] = useState(false)
  const [approvingPartId, setApprovingPartId] = useState<number | null>(null)

  // Load parts when expanded
  useEffect(() => {
    if (isExpanded && booking.bookingId) {
      loadParts()
    }
  }, [isExpanded, booking.bookingId])

  const loadParts = async () => {
    try {
      setLoadingParts(true)
      // Ưu tiên lấy từ WorkOrderPartService để có unitPrice/quantity chính xác
      const items = await WorkOrderPartService.list(Number(booking.bookingId))
      if (Array.isArray(items) && items.length > 0) {
        setParts(items.map(it => ({
          workOrderPartId: it.id,
          partId: it.partId,
          partName: it.partName || '',
          quantityUsed: it.quantity,
          status: it.status || 'DRAFT',
          unitPrice: it.unitPrice
        })))
      } else {
        const response = await BookingService.getBookingParts(booking.bookingId)
        if (response.success && response.data) {
          setParts(response.data.items || [])
        }
      }
    } catch (error) {
      console.error('Error loading parts:', error)
    } finally {
      setLoadingParts(false)
    }
  }

  const handleApprovePart = async (workOrderPartId: number) => {
    try {
      setApprovingPartId(workOrderPartId)
      // Gọi API với workOrderPartId (KHÔNG phải partId)
      // API: PUT /api/Booking/{bookingId}/parts/{workOrderPartId}/customer-approve
      console.log('🔵 Starting approve part:', { 
        bookingId: booking.bookingId, 
        workOrderPartId,
        part: parts.find(p => p.workOrderPartId === workOrderPartId)
      })
      
      const response = await BookingService.approveBookingPart(booking.bookingId, workOrderPartId)
      
      console.log('🔵 Approve response:', response)
      
      if (response.success) {
        toast.success('Đã đồng ý phụ tùng thành công')
        // Reload parts
        await loadParts()
      } else {
        const errorMsg = response.message || 'Không thể xác nhận phụ tùng'
        console.error('❌ Approve failed:', errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error('❌ Exception in handleApprovePart:', error)
      const errorMsg = error?.message || error?.response?.data?.message || 'Có lỗi xảy ra khi xác nhận phụ tùng'
      toast.error(errorMsg)
    } finally {
      setApprovingPartId(null)
    }
  }
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
        {/* Newest Badge */}
        {isNewest && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: '#FFD875',
            color: '#111827',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 1
          }}>
            Mới nhất
          </div>
        )}

        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          {getStatusBadge(booking.status)}
        </div>

        {/* Service Name */}
        <div style={{ marginBottom: '16px', paddingRight: '120px', paddingLeft: isNewest ? '100px' : '0' }}>
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

            {/* Phụ tùng phát sinh */}
            <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#374151', 
                margin: 0,
                marginBottom: '12px',
                fontWeight: '600'
              }}>
                Phụ tùng phát sinh
              </p>
              {loadingParts ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  Đang tải...
                </div>
              ) : parts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  Không có phụ tùng phát sinh
                </div>
              ) : (
                <div style={{ 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Tên phụ tùng</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Số lượng</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Đơn giá</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Thành tiền</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((part) => (
                        <tr key={part.workOrderPartId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>{part.partName}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#374151' }}>{part.quantityUsed}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#374151' }}>{part.unitPrice !== undefined ? `${Number(part.unitPrice || 0).toLocaleString('vi-VN')} VNĐ` : '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#111827', fontWeight: 600 }}>{part.unitPrice !== undefined ? `${Number((part.unitPrice || 0) * (part.quantityUsed || 0)).toLocaleString('vi-VN')} VNĐ` : '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              background: part.status === 'PENDING_CUSTOMER_APPROVAL' ? '#fef3c7' : '#dcfce7',
                              color: part.status === 'PENDING_CUSTOMER_APPROVAL' ? '#92400e' : '#166534'
                            }}>
                              {part.status === 'PENDING_CUSTOMER_APPROVAL' ? 'Chờ xác nhận' : 'Đã xác nhận'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {part.status === 'PENDING_CUSTOMER_APPROVAL' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApprovePart(part.workOrderPartId)
                                }}
                                disabled={approvingPartId === part.workOrderPartId}
                                style={{
                                  padding: '6px 16px',
                                  border: 'none',
                                  borderRadius: '6px',
                                  background: approvingPartId === part.workOrderPartId ? '#f3f4f6' : '#FFD875',
                                  color: '#111827',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  cursor: approvingPartId === part.workOrderPartId ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (approvingPartId !== part.workOrderPartId) {
                                    e.currentTarget.style.background = '#FFE082'
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (approvingPartId !== part.workOrderPartId) {
                                    e.currentTarget.style.background = '#FFD875'
                                  }
                                }}
                              >
                                {approvingPartId === part.workOrderPartId ? 'Đang xử lý...' : 'Đồng ý'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Section (Customer) - đặt NGAY DƯỚI bảng "Phụ tùng phát sinh" */}
      {onPayment && (booking.status || '').toUpperCase() === 'COMPLETED' && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          borderTop: '2px solid #e5e7eb',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div>
              <p style={{
                fontSize: '14px',
                color: '#111827',
                margin: 0,
                fontWeight: 700
              }}>Thanh toán</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                { // ưu tiên totalAmount nếu có, fallback actual/estimated
                  // @ts-ignore - một số API trả totalAmount trong booking detail
                  (booking as any).totalAmount
                  ? `Tổng tiền: ${Number((booking as any).totalAmount).toLocaleString('vi-VN')} VNĐ`
                  : booking.actualCost
                  ? `Tổng tiền: ${Number(booking.actualCost).toLocaleString('vi-VN')} VNĐ`
                  : booking.estimatedCost
                  ? `Ước tính: ${Number(booking.estimatedCost).toLocaleString('vi-VN')} VNĐ`
                  : 'Vui lòng thanh toán để hoàn tất dịch vụ'
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => onPayment(booking.bookingId)}
            disabled={isProcessingPayment}
            style={{
              background: '#10B981',
              border: '1px solid #10B981',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
              color: '#fff',
              cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isProcessingPayment) {
                e.currentTarget.style.background = '#059669'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessingPayment) {
                e.currentTarget.style.background = '#10B981'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
              }
            }}
          >
            {isProcessingPayment ? 'Đang xử lý...' : 'Chọn phương thức và thanh toán'}
          </button>
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


import type { CustomerBooking } from '@/services/bookingService'
import { BookingService } from '@/services/bookingService'
import { WorkOrderPartService } from '@/services/workOrderPartService'
import { PartService } from '@/services/partService'
import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import FeedbackModal from '@/components/feedback/FeedbackModal'
import { feedbackService } from '@/services/feedbackService'
import { useAppSelector } from '@/store/hooks'
import { Star, MessageSquare, QrCode } from 'lucide-react'
import QRCode from 'qrcode'

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
    case 'CHECKED_IN':
      badgeClass += ' status-checked-in'
      text = 'Đã check-in'
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
  const [rejectingPartId, setRejectingPartId] = useState<number | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [existingFeedback, setExistingFeedback] = useState<any>(null)
  const [bookingDetail, setBookingDetail] = useState<any>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [showQRTooltip, setShowQRTooltip] = useState(false)
  const user = useAppSelector((state) => state.auth.user)

  // Tính tổng tiền phụ tùng - chỉ tính những phụ tùng đã được approve (status = CONSUMED)
  const totalPartsCost = useMemo(() => {
    return parts
      .filter(p => p.status === 'CONSUMED') // Chỉ tính những phụ tùng đã được approve
      .reduce((sum, p) => sum + (p.unitPrice || 0) * (p.quantityUsed || 0), 0)
  }, [parts])

  // Load parts when expanded
  useEffect(() => {
    if (isExpanded && booking.bookingId) {
      loadParts()
    }
  }, [isExpanded, booking.bookingId])

  // Generate QR code only for CONFIRMED bookings
  useEffect(() => {
    const generateQRCode = async () => {
      const status = (booking.status || '').toUpperCase()
      if (status === 'CONFIRMED') {
        try {
          const qrData = JSON.stringify({
            bookingId: booking.bookingId,
            timestamp: new Date().toISOString(),
            type: 'CHECK_IN',
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })

          const dataUrl = await QRCode.toDataURL(qrData, {
            width: 80,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
          })

          setQrCodeDataUrl(dataUrl)
        } catch (error) {
          console.error('Error generating QR code:', error)
        }
      } else {
        // Clear QR code if status is not CONFIRMED
        setQrCodeDataUrl('')
      }
    }

    generateQRCode()
  }, [booking.bookingId, booking.status])

  // Load feedback and booking detail when status is PAID
  useEffect(() => {
    if (isExpanded && booking.bookingId && (booking.status || '').toUpperCase() === 'PAID') {
      loadFeedbackAndBookingDetail()
    }
  }, [isExpanded, booking.bookingId, booking.status])

  const loadFeedbackAndBookingDetail = async () => {
    try {
      setLoadingFeedback(true)
      // Load booking detail để lấy technicianId và serviceName
      const detail = await BookingService.getBookingDetail(booking.bookingId)
      if (detail?.success && detail?.data) {
        setBookingDetail(detail.data)
      }

      // Load existing feedback
      try {
        const feedback = await feedbackService.getFeedback(String(booking.bookingId))
        setExistingFeedback(feedback)
      } catch (err) {
        // Nếu chưa có feedback thì set null
        setExistingFeedback(null)
      }
    } catch (error) {
      console.error('Error loading feedback:', error)
    } finally {
      setLoadingFeedback(false)
    }
  }

  const loadParts = async () => {
    try {
      setLoadingParts(true)
      // 1. Load phụ tùng từ API /Booking/{bookingId}/parts (giống như kỹ thuật viên)
      let list = await WorkOrderPartService.list(Number(booking.bookingId))

      // 2. Load chi tiết từ API /api/Part/{id} để lấy đơn giá và thông tin đầy đủ
      list = await Promise.all(list.map(async (p) => {
        try {
          // Luôn gọi API /api/Part/{id} để lấy unitPrice chính xác
          const partDetail = await PartService.getPartById(p.partId)

          if (partDetail.success && partDetail.data) {
            const raw = partDetail.data as any
            // Map từ nhiều field name có thể: unitPrice, price, Price, UnitPrice
            const unitPrice = raw.unitPrice ?? raw.UnitPrice ?? raw.price ?? raw.Price ?? p.unitPrice ?? 0

            return {
              ...p,
              partNumber: partDetail.data.partNumber || p.partNumber,
              partName: partDetail.data.partName || p.partName,
              brand: partDetail.data.brand || p.brand,
              unitPrice: unitPrice, // Lấy đơn giá từ API Part/{id}
              totalStock: partDetail.data.totalStock ?? p.totalStock
            }
          }
        } catch (err) {
          console.error(`Lỗi khi load chi tiết phụ tùng ${p.partId}:`, err)
        }

        return p
      }))

      // 3. Map sang BookingPart format
      setParts(list.map(it => ({
        workOrderPartId: it.id,
        partId: it.partId,
        partName: it.partName || '',
        quantityUsed: it.quantity,
        status: it.status || 'DRAFT',
        unitPrice: it.unitPrice
      })))
    } catch (error) {
      console.error('Error loading parts:', error)
      // Fallback: thử load từ BookingService
      try {
        const response = await BookingService.getBookingParts(booking.bookingId)
        if (response.success && response.data) {
          setParts(response.data.items || [])
        }
      } catch (fallbackError) {
        console.error('Fallback load also failed:', fallbackError)
        setParts([])
      }
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

  const handleRejectPart = async (workOrderPartId: number) => {
    try {
      setRejectingPartId(workOrderPartId)
      // Gọi API với workOrderPartId
      // API: PUT /api/Booking/{bookingId}/parts/{workOrderPartId}/customer-reject
      console.log('🔴 Starting reject part:', {
        bookingId: booking.bookingId,
        workOrderPartId,
        part: parts.find(p => p.workOrderPartId === workOrderPartId)
      })

      const response = await WorkOrderPartService.customerReject(booking.bookingId, workOrderPartId)

      console.log('🔴 Reject response:', response)

      if (response.success) {
        toast.success('Đã từ chối phụ tùng thành công')
        // Reload parts
        await loadParts()
      } else {
        const errorMsg = response.message || 'Không thể từ chối phụ tùng'
        console.error('❌ Reject failed:', errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error('❌ Exception in handleRejectPart:', error)
      const errorMsg = error?.message || error?.response?.data?.message || 'Có lỗi xảy ra khi từ chối phụ tùng'
      toast.error(errorMsg)
    } finally {
      setRejectingPartId(null)
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
        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          {getStatusBadge(booking.status)}
        </div>

        {/* Service Name */}
        <div style={{ marginBottom: '16px', paddingRight: '120px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '400',
            margin: 0,
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>{booking.serviceName}</span>
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '400'
            }}>
              Mã đặt lịch: #{booking.bookingId}
            </span>
            {isNewest && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#FFD875',
                color: '#111827',
                fontSize: '12px',
                fontWeight: '400',
                whiteSpace: 'nowrap'
              }}>
                Mới nhất
              </span>
            )}
          </h3>
        </div>

        {/* Booking Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '12px',
          position: 'relative'
        }}>
          {/* Date */}
          <div>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: 0,
              marginBottom: '2px',
              lineHeight: '1.2'
            }}>
              Ngày
            </p>
            <p style={{
              fontSize: '14px',
              color: '#374151',
              margin: 0,
              fontWeight: '500',
              lineHeight: '1.4'
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
                marginBottom: '2px',
                lineHeight: '1.2'
              }}>
                Giờ
              </p>
              <p style={{
                fontSize: '14px',
                color: '#374151',
                margin: 0,
                fontWeight: '500',
                lineHeight: '1.4'
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
              marginBottom: '2px',
              lineHeight: '1.2'
            }}>
              Trung tâm
            </p>
            <p style={{
              fontSize: '14px',
              color: '#374151',
              margin: 0,
              fontWeight: '500',
              lineHeight: '1.4'
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
              marginBottom: '2px',
              lineHeight: '1.2'
            }}>
              Xe
            </p>
            <p style={{
              fontSize: '14px',
              color: '#374151',
              margin: 0,
              fontWeight: '500',
              lineHeight: '1.4'
            }}>
              {booking.vehiclePlate}
            </p>
          </div>

          {/* QR Code - Positioned at bottom right corner - Only show for CONFIRMED status */}
          {qrCodeDataUrl && (booking.status || '').toUpperCase() === 'CONFIRMED' && (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => setShowQRTooltip(true)}
              onMouseLeave={() => setShowQRTooltip(false)}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <img
                src={qrCodeDataUrl}
                alt="QR Code Check-in"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />

              {/* Tooltip */}
              {showQRTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '70px',
                    right: 0,
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 216, 117, 0.9)',
                    color: '#111827',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Mã QR có hiệu lực trong 24 giờ

                  {/* Arrow pointing down */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      right: '20px',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid rgba(255, 216, 117, 0.9)'
                    }}
                  />
                </div>
              )}
            </div>
          )}
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
          <div>
            {/* Action Buttons - Only show for PENDING status in expanded section */}
            {booking.status === 'PENDING' && (
              <div style={{
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
                    fontWeight: '400',
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
                    fontWeight: '400',
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

            {/* Special Requests - Expanded */}
            {booking.specialRequests && booking.specialRequests !== 'string' && (
              <div>
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
            <div style={{ marginTop: '16px' }}>
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
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#111827', fontWeight: 400 }}>{part.unitPrice !== undefined ? `${Number((part.unitPrice || 0) * (part.quantityUsed || 0)).toLocaleString('vi-VN')} VNĐ` : '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {(() => {
                              // Xác định text và style dựa trên status
                              let statusText = 'Nháp'
                              let bgColor = '#f3f4f6'
                              let textColor = '#374151'

                              if (part.status === 'PENDING_CUSTOMER_APPROVAL') {
                                statusText = 'Chờ xác nhận'
                                bgColor = '#fef3c7'
                                textColor = '#92400e'
                              } else if (part.status === 'CONSUMED') {
                                statusText = 'Đã xác nhận'
                                bgColor = '#dcfce7'
                                textColor = '#166534'
                              } else if (part.status === 'REJECTED') {
                                statusText = 'Đã từ chối'
                                bgColor = '#fee2e2'
                                textColor = '#991b1b'
                              } else if (part.status === 'DRAFT') {
                                statusText = 'Nháp'
                                bgColor = '#f3f4f6'
                                textColor = '#374151'
                              }

                              return (
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  background: bgColor,
                                  color: textColor
                                }}>
                                  {statusText}
                                </span>
                              )
                            })()}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {(() => {
                              const canApprove = part.status === 'PENDING_CUSTOMER_APPROVAL'
                              const canReject = part.status === 'PENDING_CUSTOMER_APPROVAL' || part.status === 'DRAFT'
                              const isProcessing = approvingPartId === part.workOrderPartId || rejectingPartId === part.workOrderPartId

                              if (!canApprove && !canReject) {
                                return null
                              }

                              return (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                  {canApprove && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleApprovePart(part.workOrderPartId)
                                      }}
                                      disabled={isProcessing}
                                      style={{
                                        padding: '6px 16px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: isProcessing ? '#f3f4f6' : '#FFD875',
                                        color: '#111827',
                                        fontSize: '13px',
                                        fontWeight: '400',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isProcessing) {
                                          e.currentTarget.style.background = '#FFE082'
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isProcessing) {
                                          e.currentTarget.style.background = '#FFD875'
                                        }
                                      }}
                                    >
                                      {approvingPartId === part.workOrderPartId ? 'Đang xử lý...' : 'Đồng ý'}
                                    </button>
                                  )}
                                  {canReject && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (confirm('Bạn có chắc chắn muốn từ chối phụ tùng này?')) {
                                          handleRejectPart(part.workOrderPartId)
                                        }
                                      }}
                                      disabled={isProcessing}
                                      style={{
                                        padding: '6px 16px',
                                        border: '1px solid #EF4444',
                                        borderRadius: '6px',
                                        background: isProcessing ? '#f3f4f6' : '#FFFFFF',
                                        color: isProcessing ? '#9ca3af' : '#EF4444',
                                        fontSize: '13px',
                                        fontWeight: '400',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isProcessing) {
                                          e.currentTarget.style.background = '#FEE2E2'
                                          e.currentTarget.style.borderColor = '#DC2626'
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isProcessing) {
                                          e.currentTarget.style.background = '#FFFFFF'
                                          e.currentTarget.style.borderColor = '#EF4444'
                                        }
                                      }}
                                    >
                                      {rejectingPartId === part.workOrderPartId ? 'Đang xử lý...' : 'Từ chối'}
                                    </button>
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {parts.length > 0 && totalPartsCost > 0 && (
                      <tfoot>
                        <tr style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                          <td colSpan={3} style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 400, color: '#111827' }}>Tổng phụ tùng:</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 400, color: '#111827' }}>{totalPartsCost.toLocaleString('vi-VN')} VNĐ</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    )}
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
                fontWeight: 400
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
              fontWeight: 400,
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

      {/* Feedback Section - Hiển thị khi booking status là PAID */}
      {isExpanded && (booking.status || '').toUpperCase() === 'PAID' && (
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
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <MessageSquare size={18} color="#10B981" />
            <p style={{
              fontSize: '14px',
              color: '#111827',
              margin: 0,
              fontWeight: 400
            }}>Đánh giá dịch vụ</p>
          </div>

          {loadingFeedback ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              Đang tải...
            </div>
          ) : existingFeedback ? (
            // Hiển thị feedback đã gửi
            <div style={{
              padding: '16px',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= (existingFeedback.rating || existingFeedback.technicianRating || 0) ? '#FFD875' : 'none'}
                      color={star <= (existingFeedback.rating || existingFeedback.technicianRating || 0) ? '#FFD875' : '#d1d5db'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  Đã đánh giá
                </span>
              </div>
              {existingFeedback.comment && (
                <p style={{
                  fontSize: '14px',
                  color: '#374151',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  {existingFeedback.comment}
                </p>
              )}
            </div>
          ) : (
            // Hiển thị nút để gửi feedback
            <div>
              <p style={{
                fontSize: '13px',
                color: '#6b7280',
                margin: '0 0 12px 0'
              }}>
                Chia sẻ trải nghiệm của bạn về dịch vụ này
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFeedbackModal(true)
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#10B981',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#059669'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#10B981'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Star size={16} fill="#fff" color="#fff" />
                Đánh giá dịch vụ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && bookingDetail && user && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          bookingId={String(booking.bookingId)}
          serviceName={bookingDetail.serviceInfo?.serviceName || booking.serviceName || 'Dịch vụ'}
          technician={bookingDetail.technicianInfo?.technicianName || 'Kỹ thuật viên'}
          partsUsed={parts.map(p => p.partName)}
          onSubmit={async (feedback) => {
            try {
              // Gọi API submit feedback
              const technicianId = bookingDetail.technicianInfo?.technicianId || 0
              if (!technicianId) {
                toast.error('Không tìm thấy thông tin kỹ thuật viên')
                return
              }

              await feedbackService.submitBookingFeedback(String(booking.bookingId), {
                customerId: user.id || user.customerId || 0,
                rating: feedback.technicianRating,
                comment: feedback.comment,
                isAnonymous: false,
                technicianId: technicianId
              })

              toast.success('Đánh giá đã được gửi thành công!')
              setShowFeedbackModal(false)
              // Reload feedback
              await loadFeedbackAndBookingDetail()
            } catch (error: any) {
              toast.error(error?.message || 'Không thể gửi đánh giá')
              throw error
            }
          }}
        />
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
        .booking-status-badge.status-checked-in {
          background-color: #ccfbf1;
          color: #0f766e;
        }

        .booking-status-badge.status-default {
          background-color: #f3f4f6;
          color: #374151;
        }
      `}</style>
    </>
  )
}


import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { removeFromCart } from '@/store/cartSlice'
import { WorkOrderPartService, WorkOrderPartItem } from '@/services/workOrderPartService'
import { PromotionBookingService, BookingPromotionInfo } from '@/services/promotionBookingService'
import './PaymentSuccess.scss'

interface PaymentResult {
  bookingId: number
  status: 'success' | 'error' | 'failed' | 'cancelled'
  message?: string
  bookingInfo?: {
    bookingId: number
    bookingCode?: string
    customerName: string
    vehicleInfo: string
    centerName: string
    bookingDate: string
    slotTime: string
    technicianName: string
    totalAmount: number
    services: Array<{
      serviceId: number
      serviceName: string
      quantity: number
      unitPrice: number
      totalPrice: number
    }>
  }
  parts?: WorkOrderPartItem[]
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parts, setParts] = useState<WorkOrderPartItem[]>([])
  const [promotions, setPromotions] = useState<BookingPromotionInfo[]>([])
  
  useEffect(() => {
    const handlePaymentResult = async () => {
      try {
        const bookingId = searchParams.get('bookingId')
        const orderId = searchParams.get('orderId')
        const type = searchParams.get('type') || (orderId ? 'order' : 'booking')
        const status = (searchParams.get('status') || '').toLowerCase() as PaymentResult['status']
        
        if (!bookingId && !orderId) {
          setError('Thiếu thông tin booking ID hoặc order ID')
          return
        }

        // Xử lý promotion khi thanh toán thành công cho ORDER
        // CHỈ apply coupon và mark as USED khi thanh toán thành công
        if (type === 'order' && orderId && status === 'success') {
          const pendingCouponCode = sessionStorage.getItem('pendingCouponCode')
          if (pendingCouponCode) {
            try {
              // Bước 1: Apply coupon vào order (backend tạo UserPromotion với status APPLIED)
              const applyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/promotion/orders/${orderId}/apply`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {})
                },
                body: JSON.stringify({ code: pendingCouponCode })
              })
              const applyResult = await applyResponse.json()
              
              if (applyResult?.success) {

                // Bước 2: Ngay lập tức mark as USED (chuyển APPLIED → USED)
                // Vì đã thanh toán thành công nên mã sẽ chuyển sang USED và ẩn đi
                const markResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/promotion/orders/${orderId}/mark-used`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {})
                  }
                })
                const markResult = await markResponse.json()
                
                if (markResult?.success) {

                } else {

                }
              } else {

              }
              
              // Xóa coupon code khỏi sessionStorage sau khi xử lý
              sessionStorage.removeItem('pendingCouponCode')
              sessionStorage.removeItem(`appliedCoupon_${orderId}`)
            } catch (promoError: any) {

              // Không block UI nếu xử lý promotion fail
            }
          }
        }

        // Gọi API để lấy thông tin booking/order và xác nhận thanh toán
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }
        
        // Thêm token nếu có
        if (auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`
        }
        
        const apiUrl = type === 'order' && orderId
          ? `${import.meta.env.VITE_API_BASE_URL || '/api'}/Order/${orderId}`
          : `${import.meta.env.VITE_API_BASE_URL || '/api'}/booking/${bookingId}`
        
        const response = await fetch(apiUrl, { headers })
        const data = await response.json()

        if (data.success) {
          const bookingIdNum = parseInt(bookingId || orderId || '0')
          setPaymentResult({
            bookingId: bookingIdNum,
            status: status || 'success',
            bookingInfo: data.data
          })

          // Load phụ tùng phát sinh và mã khuyến mãi nếu là booking (không phải order)
          if (type !== 'order' && bookingIdNum) {
            try {
              // Load phụ tùng phát sinh
              const partsData = await WorkOrderPartService.list(bookingIdNum)
              // Chỉ lấy phụ tùng đã được approve (CONSUMED) để tính vào tổng tiền
              const consumedParts = partsData.filter(p => (p.status || '').toUpperCase() === 'CONSUMED')
              setParts(consumedParts)
            } catch (partsError) {
              console.warn('Không thể tải phụ tùng phát sinh:', partsError)
              setParts([])
            }

            try {
              // Load mã khuyến mãi đã áp dụng
              const promotionsData = await PromotionBookingService.getBookingPromotions(bookingIdNum)
              setPromotions(promotionsData || [])
            } catch (promoError) {
              console.warn('Không thể tải mã khuyến mãi:', promoError)
              setPromotions([])
            }
          }

          // Xóa sản phẩm đã thanh toán khỏi giỏ hàng khi thanh toán thành công
          if (type === 'order' && orderId && status === 'success') {
            try {
              // Lấy selectedIds đã lưu khi tạo order
              const orderIdStr = String(orderId)
              const selectedIdsKey = `orderSelectedIds_${orderIdStr}`
              const selectedIdsRaw = sessionStorage.getItem(selectedIdsKey)
              
              if (selectedIdsRaw) {
                const selectedIds: string[] = JSON.parse(selectedIdsRaw)
                
                // Xóa từng item đã thanh toán khỏi cart
                selectedIds.forEach((itemId: string) => {
                  dispatch(removeFromCart({ id: itemId, userId: auth.user?.id ?? null }))
                })
                
                // Xóa selectedIds khỏi sessionStorage sau khi đã xử lý
                sessionStorage.removeItem(selectedIdsKey)
                
                console.log('PaymentSuccess - Removed paid items from cart:', selectedIds)
              }
            } catch (cartError) {
              console.warn('PaymentSuccess - Error removing items from cart:', cartError)
              // Không block UI nếu xóa cart fail
            }
          }

          // Hiển thị toast thành công
          if (status === 'success') {
            toast.success('Thanh toán thành công!')
          } else if (status === 'cancelled') {
            toast.error('Thanh toán đã bị hủy')
          } else {
            toast.error('Thanh toán thất bại')
          }
        } else {
          setError(`Không thể lấy thông tin ${type === 'order' ? 'đơn hàng' : 'booking'}`)
        }
      } catch (err) {

        setError('Có lỗi xảy ra khi xử lý kết quả thanh toán')
      } finally {
        setLoading(false)
      }
    }

    handlePaymentResult()
  }, [searchParams, auth.token])

  // (Reverted) Không tự động can thiệp giỏ hàng sau thanh toán

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-16 h-16 text-red-500" />
      case 'failed':
        return <AlertCircle className="w-16 h-16 text-red-500" />
      default:
        return <Clock className="w-16 h-16 text-yellow-500" />
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'success':
        return {
          title: 'Thanh toán thành công!',
          description: 'Đặt lịch của bạn đã được xác nhận và thanh toán thành công.',
          color: 'text-green-600'
        }
      case 'cancelled':
        return {
          title: 'Thanh toán đã bị hủy',
          description: 'Bạn đã hủy thanh toán. Đặt lịch vẫn được giữ lại.',
          color: 'text-red-600'
        }
      case 'failed':
        return {
          title: 'Thanh toán thất bại',
          description: 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
          color: 'text-red-600'
        }
      default:
        return {
          title: 'Đang xử lý...',
          description: 'Vui lòng chờ trong giây lát.',
          color: 'text-yellow-600'
        }
    }
  }

  if (loading) {
    return (
      <div className="payment-success">
        <div className="loading">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Đang xử lý kết quả thanh toán...</p>
          </div>
        </div>
        </div>
    )
  }

  if (error) {
    return (
      <div className="payment-success">
        <div className="error">
          <div className="error-content">
            <AlertCircle className="error-icon w-16 h-16 mx-auto mb-4" />
            <h1 className="error-title">Có lỗi xảy ra</h1>
            <p className="error-message">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="error-button"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!paymentResult) return null

  const statusInfo = getStatusMessage(paymentResult.status)

  return (
    <div className="payment-success">
      <div className="container">
        <div className="main-content">
          {/* Status Header */}
          <div className="status-card">
            <div className="status-icon">
              {getStatusIcon(paymentResult.status)}
            </div>
            <h1 className={`status-title ${statusInfo.color.replace('text-', '').replace('-600', '')}`}>
              {statusInfo.title}
            </h1>
            <p className="status-description">{statusInfo.description}</p>
          </div>

          {/* Booking Information */}
          {paymentResult.bookingInfo && (
            <div className="booking-info-card">
              <h2 className="card-title">Thông tin đặt lịch</h2>
              
              <div className="info-grid">
                <div className="info-item">
                  <label className="label">Mã đặt lịch</label>
                  <p className="value">#{paymentResult.bookingInfo.bookingId}</p>
                </div>
                
                <div className="info-item">
                  <label className="label">Khách hàng</label>
                  <p className="value">{paymentResult.bookingInfo.customerName}</p>
                </div>
                
                <div className="info-item">
                  <label className="label">Xe</label>
                  <p className="value">{paymentResult.bookingInfo.vehicleInfo}</p>
                </div>
                
                <div className="info-item">
                  <label className="label">Trung tâm</label>
                  <p className="value">{paymentResult.bookingInfo.centerName}</p>
                </div>
                
                <div className="info-item">
                  <label className="label">Ngày</label>
                  <p className="value">{paymentResult.bookingInfo.bookingDate}</p>
                </div>
                
                <div className="info-item">
                  <label className="label">Thời gian</label>
                  <p className="value">{paymentResult.bookingInfo.slotTime}</p>
                </div>
                
                <div className="info-item">
                  <label className="label">Kỹ thuật viên</label>
                  <p className="value">{paymentResult.bookingInfo.technicianName || 'Chưa gán'}</p>
                </div>
                
                <div className="info-item">
                  <label className="label">Tổng tiền</label>
                  <p className="value highlight">
                    {(() => {
                      // Tính tổng tiền từ services
                      const servicesTotal = (paymentResult.bookingInfo.services || []).reduce((sum, s) => sum + (s.totalPrice || 0), 0)
                      // Tính tổng tiền từ phụ tùng đã approve (CONSUMED)
                      const partsTotal = parts.filter(p => (p.status || '').toUpperCase() === 'CONSUMED')
                        .reduce((sum, p) => sum + (p.unitPrice || 0) * (p.quantity || 0), 0)
                      // Tính tổng giảm giá từ mã khuyến mãi
                      const discountTotal = promotions.reduce((sum, promo) => sum + (promo.discountAmount || 0), 0)
                      // Tổng = services + parts - discount
                      const total = servicesTotal + partsTotal - discountTotal
                      return total.toLocaleString('vi-VN')
                    })()} VNĐ
                  </p>
                </div>
              </div>

              {/* Services */}
              <div className="services-section">
                <h3 className="services-title">Dịch vụ đã đặt</h3>
                <div className="space-y-2">
                  {(paymentResult.bookingInfo.services || []).map((service, index) => (
                    <div key={index} className="service-item">
                      <div className="service-info">
                        <p className="service-name">{service.serviceName}</p>
                        <p className="service-quantity">Số lượng: {service.quantity}</p>
                      </div>
                      <p className="service-price">
                        {service.totalPrice.toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parts (Phụ tùng phát sinh) */}
              {parts.length > 0 && (
                <div className="services-section" style={{ marginTop: 24 }}>
                  <h3 className="services-title">Phụ tùng phát sinh</h3>
                  <div className="space-y-2">
                    {parts.filter(p => (p.status || '').toUpperCase() === 'CONSUMED').map((part, index) => (
                      <div key={index} className="service-item">
                        <div className="service-info">
                          <p className="service-name">{part.partName || `Phụ tùng #${part.partId}`}</p>
                          <p className="service-quantity">Số lượng: {part.quantity} × {part.unitPrice?.toLocaleString('vi-VN') || 0} VNĐ</p>
                        </div>
                        <p className="service-price">
                          {((part.unitPrice || 0) * (part.quantity || 0)).toLocaleString('vi-VN')} VNĐ
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotion (Mã khuyến mãi) */}
              {promotions.length > 0 && (
                <div className="services-section" style={{ marginTop: 24 }}>
                  <h3 className="services-title">Mã khuyến mãi đã áp dụng</h3>
                  <div className="space-y-2">
                    {promotions.map((promo, index) => (
                      <div key={index} className="service-item" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '12px' }}>
                        <div className="service-info">
                          <p className="service-name" style={{ fontWeight: 600, color: '#065F46' }}>Mã: {promo.code}</p>
                          {promo.description && (
                            <p className="service-quantity" style={{ fontSize: 12, color: '#047857' }}>{promo.description}</p>
                          )}
                        </div>
                        <p className="service-price" style={{ color: '#059669', fontWeight: 600 }}>
                          -{promo.discountAmount.toLocaleString('vi-VN')} VNĐ
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tổng kết chi tiết */}
              {((parts.length > 0 && parts.filter(p => (p.status || '').toUpperCase() === 'CONSUMED').length > 0) || promotions.length > 0) && (
                <div className="services-section" style={{ marginTop: 24, padding: '16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <h3 className="services-title" style={{ marginBottom: 12 }}>Chi tiết thanh toán</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6B7280' }}>Tổng dịch vụ:</span>
                      <span style={{ fontWeight: 500 }}>
                        {(paymentResult.bookingInfo.services || []).reduce((sum, s) => sum + (s.totalPrice || 0), 0).toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                    {parts.filter(p => (p.status || '').toUpperCase() === 'CONSUMED').length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#6B7280' }}>Tổng phụ tùng:</span>
                        <span style={{ fontWeight: 500 }}>
                          {parts.filter(p => (p.status || '').toUpperCase() === 'CONSUMED')
                            .reduce((sum, p) => sum + (p.unitPrice || 0) * (p.quantity || 0), 0).toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    )}
                    {promotions.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#6B7280' }}>Giảm giá (mã khuyến mãi):</span>
                        <span style={{ fontWeight: 500, color: '#059669' }}>
                          -{promotions.reduce((sum, promo) => sum + (promo.discountAmount || 0), 0).toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 600, marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                      <span>Tổng cộng:</span>
                      <span style={{ color: '#059669' }}>
                        {(() => {
                          const servicesTotal = (paymentResult.bookingInfo.services || []).reduce((sum, s) => sum + (s.totalPrice || 0), 0)
                          const partsTotal = parts.filter(p => (p.status || '').toUpperCase() === 'CONSUMED')
                            .reduce((sum, p) => sum + (p.unitPrice || 0) * (p.quantity || 0), 0)
                          const discountTotal = promotions.reduce((sum, promo) => sum + (promo.discountAmount || 0), 0)
                          return (servicesTotal + partsTotal - discountTotal).toLocaleString('vi-VN')
                        })()} VNĐ
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sidebar">
          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={() => navigate('/profile?tab=booking-history')}
              className="btn primary"
            >
              Xem lịch sử đặt lịch
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="btn secondary"
            >
              Về trang chủ
            </button>
          </div>

          {/* Additional Info */}
          {paymentResult.status === 'success' && (
            <div className="additional-info">
              <h3 className="info-title">Lưu ý quan trọng:</h3>
              <ul className="info-list">
                <li>• Bạn sẽ nhận được email xác nhận đặt lịch</li>
                <li>• Vui lòng đến đúng giờ đã đặt</li>
                <li>• Liên hệ hotline nếu cần hỗ trợ: 1900-EVSERVICE</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
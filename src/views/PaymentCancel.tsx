import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { XCircle, AlertTriangle, RefreshCw, Home, CreditCard } from 'lucide-react'
import { OrderService, CustomerService } from '@/services'
import toast from 'react-hot-toast'

const PaymentCancel: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Removed auto-redirect countdown
  const [isRecreating, setIsRecreating] = useState(false)
  
  const bookingId = searchParams.get('bookingId') || searchParams.get('orderCode')
  const orderId = searchParams.get('orderId') || bookingId
  const reason = searchParams.get('reason') || searchParams.get('cancelReason')
  const amount = searchParams.get('amount')
  const error = searchParams.get('error')
  
  useEffect(() => {
    // No automatic redirects; user controls navigation
    return () => {}
  }, [navigate])

  const formatPrice = (price: string | null) => {
    if (!price) return '0 VND'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(price))
  }

  const getCancelReasonText = (reason: string | null) => {
    switch (reason) {
      case 'USER_CANCELLED':
        return 'Bạn đã hủy thanh toán'
      case 'TIMEOUT':
        return 'Thanh toán hết hạn'
      case 'PAYMENT_FAILED':
        return 'Thanh toán thất bại'
      case 'INSUFFICIENT_FUNDS':
        return 'Số dư không đủ'
      case 'CARD_DECLINED':
        return 'Thẻ bị từ chối'
      case 'BOOKING_FAILED':
        return 'Đặt lịch thất bại'
      default:
        return 'Thanh toán bị hủy'
    }
  }

  return (
    <div className="payment-cancel-page">
      <div className="cancel-container">
        {/* Cancel Icon */}
        <div className="cancel-icon">
          <XCircle size={80} />
        </div>
        
        {/* Cancel Message */}
        <h1 className="cancel-title">Thanh toán bị hủy</h1>
        <p className="cancel-subtitle">
          {getCancelReasonText(reason)}
        </p>
        
        {/* Alert Message */}
        <div className="alert-message">
          <AlertTriangle size={20} />
          <div className="alert-content">
            <h3>Thanh toán không thành công</h3>
            {error && (
              <div className="error-details">
                <p><strong>Chi tiết lỗi:</strong> {decodeURIComponent(error)}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Booking Details */}
        {orderId && (
          <div className="booking-details">
            <h2>Thông tin đặt lịch</h2>
            
            <div className="detail-card">
              <div className="detail-row">
                <CreditCard className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Mã đặt lịch</span>
                  <span className="detail-value">#{orderId}</span>
                </div>
              </div>
              
              {amount && (
                <div className="detail-row">
                  <div className="detail-icon">💰</div>
                  <div className="detail-content">
                    <span className="detail-label">Số tiền</span>
                    <span className="detail-value">{formatPrice(amount)}</span>
                  </div>
                </div>
              )}
              
              <div className="detail-row">
                <div className="detail-icon">⚠️</div>
                <div className="detail-content">
                  <span className="detail-label">Trạng thái</span>
                  <span className="detail-value status-cancelled">Chưa thanh toán</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* What to do next */}
        <div className="next-steps">
          <h3>Bạn có thể làm gì?</h3>
          <ul>
            <li>
              <strong>Thử thanh toán lại:</strong> Sử dụng phương thức thanh toán khác
            </li>
            <li>
              <strong>Kiểm tra thông tin:</strong> Đảm bảo thông tin thẻ/ngân hàng chính xác
            </li>
            <li>
              <strong>Liên hệ hỗ trợ:</strong> Gọi hotline 1900 1234 để được hỗ trợ
            </li>
            <li>
              <strong>Đặt lịch mới:</strong> Tạo đặt lịch mới với thông tin khác
            </li>
          </ul>
        </div>
        
        {/* Support Information */}
        <div className="support-info">
          <h3>Hỗ trợ khách hàng</h3>
          <div className="support-contacts">
            <div className="contact-item">
              <span className="contact-label">Hotline:</span>
              <span className="contact-value">1900 1234</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Email:</span>
              <span className="contact-value">support@autoev.com</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Thời gian:</span>
              <span className="contact-value">8:00 - 22:00 (T2-CN)</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-secondary"
            onClick={async () => {
              try {
                if (!orderId) {
                  navigate('/cart')
                  return
                }
                const idNum = Number(orderId)
                if (Number.isNaN(idNum)) {
                  navigate('/cart')
                  return
                }
                setIsRecreating(true)
                // Lấy danh sách items từ đơn cũ
                const itemsResp = await OrderService.getOrderItems(idNum)
                const rawItems = Array.isArray(itemsResp?.data) ? itemsResp.data : []
                if (rawItems.length === 0) {
                  toast.error('Không lấy được danh sách sản phẩm từ đơn hàng cũ')
                  setIsRecreating(false)
                  return
                }
                const items = rawItems.map((it: any) => ({
                  partId: Number(it.partId ?? it.PartId),
                  quantity: Number(it.quantity ?? it.Quantity ?? 1),
                })).filter((it: any) => Number.isFinite(it.partId) && it.quantity > 0)

                if (items.length === 0) {
                  toast.error('Danh sách sản phẩm không hợp lệ để tạo đơn mới')
                  setIsRecreating(false)
                  return
                }

                // Lấy customerId hiện tại
                let customerId: number | null = null
                try {
                  const me = await CustomerService.getCurrentCustomer()
                  customerId = Number(me?.data?.customerId)
                } catch {}
                if (!customerId || Number.isNaN(customerId)) {
                  toast.error('Vui lòng đăng nhập để tiếp tục thanh toán lại')
                  navigate('/auth/login')
                  setIsRecreating(false)
                  return
                }

                // Tạo đơn hàng mới từ items cũ
                const createResp = await OrderService.createOrder(customerId, { items })
                if (createResp?.success) {
                  const newId = createResp.data?.orderId ?? createResp.data?.OrderId ?? createResp.data?.id
                  if (newId) {
                    toast.success('Đã tạo đơn hàng mới')
                    navigate('/confirm-order', { state: { orderId: Number(newId) }, replace: true })
                    return
                  }
                }
                toast.error(createResp?.message || 'Không thể tạo đơn hàng mới')
              } catch (e: any) {
                toast.error(e?.response?.data?.message || e?.message || 'Có lỗi khi tạo đơn hàng mới')
              } finally {
                setIsRecreating(false)
              }
            }}
          >
            <RefreshCw size={16} />
            {isRecreating ? 'Đang xử lý...' : 'Thử lại'}
          </button>
          <button 
            className="btn-primary"
            onClick={() => navigate('/')}
          >
            <Home size={16} />
            Về trang chủ
          </button>
        </div>
        
        {/* Manual navigation only; removed auto-redirect message */}
      </div>
      
      <style>{`
        .payment-cancel-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          padding: 2rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .cancel-container {
          max-width: 600px;
          width: 100%;
          background: white;
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,.1);
          border: 1px solid #e5e7eb;
        }
        
        .cancel-icon {
          color: #ef4444;
          margin-bottom: 1.5rem;
          animation: cancelShake 0.6s ease-out;
        }
        
        @keyframes cancelShake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
        
        .cancel-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        
        .cancel-subtitle {
          font-size: 1.1rem;
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.5;
        }
        
        .alert-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
        }
        
        .alert-message svg {
          color: #ef4444;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .alert-content h3 {
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }
        
        .alert-content p {
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }
        
        .error-details {
          margin-top: 1rem;
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
        }
        
        .error-details p {
          color: #dc2626;
          font-size: 14px;
          margin: 0;
        }
        
        .booking-details {
          margin-bottom: 2rem;
          text-align: left;
        }
        
        .booking-details h2 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .detail-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }
        
        .detail-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-icon {
          width: 24px;
          height: 24px;
          color: #6b7280;
          flex-shrink: 0;
        }
        
        .detail-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
        }
        
        .detail-label {
          font-weight: 600;
          color: #6b7280;
        }
        
        .detail-value {
          font-weight: 700;
          color: #1f2937;
        }
        
        .status-cancelled {
          color: #ef4444;
        }
        
        .next-steps {
          margin-bottom: 2rem;
          text-align: left;
        }
        
        .next-steps h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .next-steps ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .next-steps li {
          padding: 0.75rem 0;
          color: #6b7280;
          position: relative;
          padding-left: 1.5rem;
          line-height: 1.5;
        }
        
        .next-steps li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #ef4444;
          font-weight: bold;
          font-size: 1.2rem;
        }
        
        .support-info {
          margin-bottom: 2rem;
          text-align: left;
        }
        
        .support-info h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .support-contacts {
          background: #f0f9ff;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #bae6fd;
        }
        
        .contact-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #bae6fd;
        }
        
        .contact-item:last-child {
          border-bottom: none;
        }
        
        .contact-label {
          font-weight: 600;
          color: #0369a1;
        }
        
        .contact-value {
          font-weight: 700;
          color: #1f2937;
        }
        
        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        
        .btn-primary, .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .btn-primary {
          background-color: #10b981;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #059669;
          transform: translateY(-1px);
        }
        
        .btn-secondary {
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        
        .btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #10b981;
        }
        
        .redirect-info {
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .redirect-info p {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .cancel-container {
            padding: 2rem 1.5rem;
          }
          
          .cancel-title {
            font-size: 1.5rem;
          }
          
          .cancel-subtitle {
            font-size: 1rem;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .alert-message {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}

export default PaymentCancel

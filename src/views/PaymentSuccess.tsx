import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Download, QrCode, Clock, MapPin, Phone, Mail, Calendar } from 'lucide-react'

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const bookingId = searchParams.get('bookingId') || searchParams.get('orderCode')
  const amount = searchParams.get('amount')
  const status = searchParams.get('status')
  
  useEffect(() => {
    // Simple success page - no complex verification needed
    console.log('Payment success page loaded with:', { bookingId, amount, status })
  }, [bookingId, amount, status])

  const formatPrice = (price: string | null) => {
    if (!price) return '0 VND'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(price))
  }

  return (
    <div className="payment-success-page">
      <div className="success-container">
        {/* Success Icon */}
        <div className="success-icon">
          <CheckCircle size={80} />
        </div>
        
        {/* Success Message */}
        <h1 className="success-title">
          Thanh toán thành công!
        </h1>
        <p className="success-subtitle">
          Thanh toán đã được xử lý thành công. Đặt lịch của bạn đã được xác nhận.
        </p>
        
        
        {/* Booking Details */}
        <div className="booking-details">
          <h2>Chi tiết đặt lịch</h2>
          
          <div className="detail-card">
            <div className="detail-row">
              <Calendar className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Mã đặt lịch</span>
                <span className="detail-value">#{bookingId || 'N/A'}</span>
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-icon">💰</div>
              <div className="detail-content">
                <span className="detail-label">Tổng thanh toán</span>
                <span className="detail-value">{formatPrice(amount)}</span>
              </div>
            </div>
            
            <div className="detail-row">
              <Clock className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Trạng thái</span>
                <span className="detail-value status paid">
                  Đã thanh toán
                </span>
              </div>
            </div>
            
            <div className="detail-row">
              <Phone className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Hotline hỗ trợ</span>
                <span className="detail-value">1900 1234</span>
              </div>
            </div>
            
            <div className="detail-row">
              <Mail className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Email hỗ trợ</span>
                <span className="detail-value">support@autoev.com</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Next Steps */}
        <div className="next-steps">
          <h3>Bước tiếp theo</h3>
          <ul>
            <li>Kiểm tra email để xem thông tin chi tiết đặt lịch</li>
            <li>Nhân viên sẽ gọi điện xác nhận trong vòng 30 phút</li>
            <li>Đến đúng giờ hẹn tại trung tâm đã chọn</li>
            <li>Mang theo giấy tờ xe và CMND/CCCD</li>
          </ul>
        </div>
        
        {/* Manual navigation */}
        <div className="redirect-info">
          <div className="action-buttons">
            <button 
              className="btn-secondary"
              onClick={() => navigate('/booking')}
            >
              Đặt lịch mới
            </button>
            <button 
              className="btn-primary"
              onClick={() => navigate('/')}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .payment-success-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          padding: 2rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .success-container {
          max-width: 700px;
          width: 100%;
          background: white;
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,.1);
          border: 1px solid #e5e7eb;
        }
        
        .success-icon {
          color: #10b981;
          margin-bottom: 1.5rem;
          animation: successPulse 0.6s ease-out;
        }
        
        @keyframes successPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .success-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        
        .success-subtitle {
          font-size: 1.1rem;
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.5;
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
          color: #10b981;
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
        
        .status.paid {
          color: #10b981;
        }
        
        .status.pending {
          color: #f59e0b;
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
          padding: 0.5rem 0;
          color: #6b7280;
          position: relative;
          padding-left: 1.5rem;
        }
        
        .next-steps li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }
        
        .redirect-info {
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .redirect-info p {
          color: #6b7280;
          margin-bottom: 1rem;
        }
        
        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        .btn-primary, .btn-secondary {
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
        
        @media (max-width: 768px) {
          .success-container {
            padding: 2rem 1.5rem;
          }
          
          .success-title {
            font-size: 1.5rem;
          }
          
          .success-subtitle {
            font-size: 1rem;
          }
          
          
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default PaymentSuccess

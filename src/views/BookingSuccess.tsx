import React, { useEffect, useState } from 'react'
import { CheckCircle, Calendar, MapPin, Phone, Mail } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

const BookingSuccess: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [countdown, setCountdown] = useState(5)
  
  const bookingId = searchParams.get('bookingId')
  const amount = searchParams.get('amount')
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          window.location.href = '/'
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const formatPrice = (price: string | null) => {
    if (!price) return '0 VND'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(price))
  }

  return (
    <div className="booking-success-page">
      <div className="success-container">
        {/* Success Icon */}
        <div className="success-icon">
          <CheckCircle size={80} />
        </div>
        
        {/* Success Message */}
        <h1 className="success-title">Thanh toán thành công!</h1>
        <p className="success-subtitle">
          Đặt lịch của bạn đã được xác nhận. Chúng tôi sẽ liên hệ với bạn sớm nhất.
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
        
        {/* Auto Redirect */}
        <div className="redirect-info">
          <p>Tự động chuyển về trang chủ sau <strong>{countdown}</strong> giây</p>
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/'}
          >
            Về trang chủ ngay
          </button>
        </div>
      </div>
      
      <style>{`
        .booking-success-page {
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 2rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .success-container {
          max-width: 600px;
          width: 100%;
          background: var(--bg-card);
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,.1);
          border: 1px solid var(--border-primary);
        }
        
        .success-icon {
          color: var(--progress-completed);
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
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        
        .success-subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
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
          color: var(--text-primary);
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .detail-card {
          background: var(--primary-50);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid var(--primary-200);
        }
        
        .detail-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--primary-200);
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-icon {
          width: 24px;
          height: 24px;
          color: var(--primary-600);
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
          color: var(--text-secondary);
        }
        
        .detail-value {
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .next-steps {
          margin-bottom: 2rem;
          text-align: left;
        }
        
        .next-steps h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
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
          color: var(--text-secondary);
          position: relative;
          padding-left: 1.5rem;
        }
        
        .next-steps li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--progress-completed);
          font-weight: bold;
        }
        
        .redirect-info {
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-primary);
        }
        
        .redirect-info p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        
        .btn-primary {
          background-color: var(--primary-500);
          color: var(--text-inverse);
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-primary:hover {
          background-color: var(--primary-600);
          transform: translateY(-1px);
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
        }
      `}</style>
    </div>
  )
}

export default BookingSuccess

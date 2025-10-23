import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Download, QrCode, Clock, MapPin, Phone, Mail, Calendar } from 'lucide-react'
import QRCode from 'qrcode'
import { checkPaymentStatus } from '@/services/paymentService'

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<string>('')
  const [isVerifying, setIsVerifying] = useState(false)
  
  const bookingId = searchParams.get('bookingId') || searchParams.get('orderCode')
  const amount = searchParams.get('amount')
  const status = searchParams.get('status')
  const paymentUrl = searchParams.get('paymentUrl')
  const qrCodeData = searchParams.get('qrCode') || searchParams.get('paymentUrl')
  
  useEffect(() => {
    // Generate QR code if qrCodeData is provided
    if (qrCodeData) {
      generateQRCode(qrCodeData)
    }
    
    // Verify payment status if we have orderCode but status is not PAID
    if (bookingId && status !== 'PAID') {
      verifyPaymentStatus()
    } else {
      setPaymentStatus(status || 'PAID')
    }
    
    // Removed auto redirect countdown; stay until user navigates
    return () => {}
  }, [qrCodeData, navigate, bookingId, status])

  const verifyPaymentStatus = async () => {
    if (!bookingId) return
    
    setIsVerifying(true)
    try {
      const result = await checkPaymentStatus(bookingId)
      console.log('Payment verification result:', result)
      
      if (result.success) {
        setPaymentStatus(result.data.status)
        
        // Nếu thanh toán thành công, cập nhật URL
        if (result.data.status === 'PAID') {
          const newUrl = `/payment-success?bookingId=${bookingId}&status=PAID&amount=${result.data.amount}`
          window.history.replaceState({}, '', newUrl)
        }
      } else {
        setPaymentStatus('FAILED')
      }
    } catch (error) {
      console.error('Error verifying payment status:', error)
      setPaymentStatus('UNKNOWN')
    } finally {
      setIsVerifying(false)
    }
  }

  const generateQRCode = async (data: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#10b981',
          light: '#ffffff'
        }
      })
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleDownloadQR = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `payment-qr-${bookingId}.png`
      link.href = qrCodeDataUrl
      link.click()
    }
  }

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
          {paymentStatus === 'PAID' ? 'Thanh toán thành công!' : 'Đặt lịch thành công!'}
        </h1>
        <p className="success-subtitle">
          {paymentStatus === 'PAID' 
            ? 'Thanh toán đã được xử lý thành công. Đặt lịch của bạn đã được xác nhận.'
            : isVerifying 
              ? 'Đang xác minh trạng thái thanh toán...'
              : 'Đặt lịch của bạn đã được xác nhận. Vui lòng thanh toán để hoàn tất.'
          }
        </p>
        
        {/* QR Code Section */}
        {qrCodeData && (
          <div className="qr-section">
            <div className="qr-header">
              <QrCode size={24} color="#10b981" />
              <h2>Mã QR thanh toán</h2>
            </div>
            
            <div className="qr-container">
              {qrCodeDataUrl ? (
                <div className="qr-code-wrapper">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code thanh toán" 
                    className="qr-code-image"
                  />
                  <div className="qr-instructions">
                    <p><strong>Hướng dẫn thanh toán:</strong></p>
                    <ol>
                      <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                      <li>Quét mã QR bên trên</li>
                      <li>Xác nhận thanh toán</li>
                    </ol>
                  </div>
                  <button 
                    onClick={handleDownloadQR}
                    className="download-qr-btn"
                  >
                    <Download size={16} />
                    Tải mã QR
                  </button>
                </div>
              ) : (
                <div className="qr-loading">
                  <div className="spinner"></div>
                  <p>Đang tạo mã QR...</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Payment URL Section */}
        {paymentUrl && !qrCodeData && (
          <div className="payment-url-section">
            <div className="payment-url-container">
              <h3>Liên kết thanh toán</h3>
              <div className="url-display">
                <span className="url-text">{paymentUrl}</span>
                <button 
                  onClick={() => window.open(paymentUrl, '_blank')}
                  className="open-url-btn"
                >
                  Mở liên kết
                </button>
              </div>
            </div>
          </div>
        )}
        
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
                <span className={`detail-value status ${paymentStatus === 'PAID' ? 'paid' : 'pending'}`}>
                  {isVerifying 
                    ? 'Đang xác minh...' 
                    : paymentStatus === 'PAID' 
                      ? 'Đã thanh toán' 
                      : paymentStatus === 'PENDING'
                        ? 'Chờ thanh toán'
                        : paymentStatus === 'FAILED'
                          ? 'Thanh toán thất bại'
                          : 'Chờ thanh toán'
                  }
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
            {paymentStatus === 'PAID' ? (
              <>
                <li>Kiểm tra email để xem thông tin chi tiết đặt lịch</li>
                <li>Nhân viên sẽ gọi điện xác nhận trong vòng 30 phút</li>
                <li>Đến đúng giờ hẹn tại trung tâm đã chọn</li>
                <li>Mang theo giấy tờ xe và CMND/CCCD</li>
              </>
            ) : isVerifying ? (
              <>
                <li>Đang xác minh trạng thái thanh toán...</li>
                <li>Vui lòng đợi trong giây lát</li>
                <li>Nếu thanh toán thành công, bạn sẽ nhận được email xác nhận</li>
              </>
            ) : (
              <>
                <li>Quét mã QR hoặc click liên kết để thanh toán</li>
                <li>Hoàn tất thanh toán trong vòng 15 phút</li>
                <li>Kiểm tra email sau khi thanh toán thành công</li>
                <li>Nhân viên sẽ liên hệ xác nhận lịch hẹn</li>
              </>
            )}
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
        
        .qr-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f0fdf4;
          border-radius: 12px;
          border: 1px solid #10b981;
        }
        
        .qr-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 1rem;
        }
        
        .qr-header h2 {
          color: #1f2937;
          font-size: 1.3rem;
          margin: 0;
        }
        
        .qr-container {
          display: flex;
          justify-content: center;
        }
        
        .qr-code-wrapper {
          text-align: center;
        }
        
        .qr-code-image {
          width: 250px;
          height: 250px;
          border: 3px solid #10b981;
          border-radius: 12px;
          margin-bottom: 1rem;
        }
        
        .qr-instructions {
          text-align: left;
          margin-bottom: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #d1d5db;
        }
        
        .qr-instructions p {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }
        
        .qr-instructions ol {
          margin: 0;
          padding-left: 1.2rem;
          color: #6b7280;
        }
        
        .qr-instructions li {
          margin-bottom: 0.25rem;
        }
        
        .download-qr-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .download-qr-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        
        .qr-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .payment-url-section {
          margin-bottom: 2rem;
        }
        
        .payment-url-container {
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .payment-url-container h3 {
          color: #1f2937;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }
        
        .url-display {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px;
        }
        
        .url-text {
          flex: 1;
          color: #6b7280;
          font-size: 14px;
          word-break: break-all;
        }
        
        .open-url-btn {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
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
          
          .qr-code-image {
            width: 200px;
            height: 200px;
          }
          
          .url-display {
            flex-direction: column;
            align-items: stretch;
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

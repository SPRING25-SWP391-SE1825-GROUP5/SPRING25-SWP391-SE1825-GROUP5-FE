import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QrCode, Download, CreditCard, Clock, CheckCircle, AlertCircle, X } from 'lucide-react'
import QRCode from 'qrcode'

const PaymentQR: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [countdown, setCountdown] = useState(15 * 60) // 15 minutes in seconds
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  
  const bookingId = searchParams.get('bookingId')
  const paymentUrl = searchParams.get('paymentUrl')
  const amount = searchParams.get('amount')
  
  useEffect(() => {
    console.log('PaymentQR mounted with params:', { bookingId, paymentUrl, amount })
    
    // Generate QR code from payment URL
    if (paymentUrl) {
      console.log('Generating QR code for URL:', paymentUrl)
      generateQRCode(paymentUrl)
    } else {
      console.error('No paymentUrl provided!')
      setIsGenerating(false)
    }
    
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Timeout - redirect to cancel page
          const cancelUrl = `/payment-cancel?bookingId=${bookingId}&amount=${amount}&reason=TIMEOUT`
          window.location.href = cancelUrl
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [paymentUrl, bookingId, amount])

  // Listen for payment success from PayOS callback
  useEffect(() => {
    const handlePaymentCallback = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PAYMENT_SUCCESS') {
        setPaymentStatus('completed')
        // Redirect to success page after a short delay
        setTimeout(() => {
          const successUrl = `/payment-success?bookingId=${bookingId}&status=PAID&amount=${amount}`
          window.location.href = successUrl
        }, 2000)
      } else if (event.data && event.data.type === 'PAYMENT_FAILED') {
        setPaymentStatus('failed')
        // Redirect to cancel page after a short delay
        setTimeout(() => {
          const cancelUrl = `/payment-cancel?bookingId=${bookingId}&amount=${amount}&reason=PAYMENT_FAILED`
          window.location.href = cancelUrl
        }, 2000)
      }
    }

    // Listen for messages from PayOS iframe
    window.addEventListener('message', handlePaymentCallback)
    
    return () => {
      window.removeEventListener('message', handlePaymentCallback)
    }
  }, [bookingId, amount])

  const generateQRCode = async (data: string) => {
    try {
      console.log('Starting QR code generation for:', data)
      setIsGenerating(true)
      const dataUrl = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#10b981',
          light: '#ffffff'
        }
      })
      console.log('QR code generated successfully:', dataUrl.substring(0, 50) + '...')
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      // Set a fallback state
      setIsGenerating(false)
    } finally {
      setIsGenerating(false)
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

  const handleCancelPayment = () => {
    const cancelUrl = `/payment-cancel?bookingId=${bookingId}&amount=${amount}&reason=USER_CANCELLED`
    window.location.href = cancelUrl
  }

  const handleOpenPaymentLink = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank')
    }
  }

  const handlePaymentCompleted = () => {
    setPaymentStatus('completed')
    // Redirect to success page
    setTimeout(() => {
      const successUrl = `/payment-success?bookingId=${bookingId}&status=PAID&amount=${amount}`
      window.location.href = successUrl
    }, 1000)
  }

  const formatPrice = (price: string | null) => {
    if (!price) return '0 VND'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(price))
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="payment-qr-page">
      <div className="qr-container">
        {/* Header */}
        <div className="qr-header">
          <div className="header-content">
            <QrCode size={32} color="#10b981" />
            <div>
              <h1>Thanh toán QR Code</h1>
              <p>Quét mã QR để thanh toán đặt lịch</p>
            </div>
          </div>
          <button 
            onClick={handleCancelPayment}
            className="close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Payment Info */}
        <div className="payment-info">
          <div className="info-card">
            <div className="info-row">
              <span className="label">Mã đặt lịch:</span>
              <span className="value">#{bookingId}</span>
            </div>
            <div className="info-row">
              <span className="label">Số tiền:</span>
              <span className="value amount">{formatPrice(amount)}</span>
            </div>
            <div className="info-row">
              <span className="label">Thời gian còn lại:</span>
              <span className="value time">{formatTime(countdown)}</span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="qr-section">
          <h2>Quét mã QR để thanh toán</h2>
          
          {!paymentUrl ? (
            <div className="qr-error">
              <AlertCircle size={48} color="#ef4444" />
              <h3>Không có thông tin thanh toán</h3>
              <p>Không thể tạo mã QR thanh toán. Vui lòng thử lại.</p>
              <button 
                onClick={() => navigate('/booking')}
                className="retry-btn"
              >
                Đặt lịch lại
              </button>
            </div>
          ) : isGenerating ? (
            <div className="qr-loading">
              <div className="spinner"></div>
              <p>Đang tạo mã QR...</p>
            </div>
          ) : qrCodeDataUrl ? (
            <div className="qr-code-container">
              <div className="qr-code-wrapper">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code thanh toán" 
                  className="qr-code-image"
                />
                
                <div className="qr-instructions">
                  <h3>Hướng dẫn thanh toán:</h3>
                  <ol>
                    <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                    <li>Chọn "Quét mã QR" hoặc "Scan QR"</li>
                    <li>Quét mã QR bên trên</li>
                    <li>Xác nhận thông tin và thanh toán</li>
                  </ol>
                </div>
                
                <div className="qr-actions">
                  <button 
                    onClick={handleDownloadQR}
                    className="download-btn"
                  >
                    <Download size={16} />
                    Tải mã QR
                  </button>
                  <button 
                    onClick={handleOpenPaymentLink}
                    className="open-link-btn"
                  >
                    <CreditCard size={16} />
                    Mở liên kết thanh toán
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="qr-error">
              <AlertCircle size={48} color="#ef4444" />
              <h3>Lỗi tạo mã QR</h3>
              <p>Không thể tạo mã QR thanh toán. Vui lòng thử lại.</p>
              <button 
                onClick={() => window.location.reload()}
                className="retry-btn"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="payment-status">
          {paymentStatus === 'pending' && (
            <div className="status-pending">
              <Clock size={20} color="#f59e0b" />
              <span>Chờ thanh toán...</span>
            </div>
          )}
          {paymentStatus === 'processing' && (
            <div className="status-processing">
              <div className="spinner"></div>
              <span>Đang xử lý thanh toán...</span>
            </div>
          )}
          {paymentStatus === 'completed' && (
            <div className="status-success">
              <CheckCircle size={20} color="#10b981" />
              <span>Thanh toán thành công!</span>
            </div>
          )}
          {paymentStatus === 'failed' && (
            <div className="status-failed">
              <AlertCircle size={20} color="#ef4444" />
              <span>Thanh toán thất bại</span>
            </div>
          )}
        </div>

        {/* Alternative Payment */}
        <div className="alternative-payment">
          <h3>Phương thức thanh toán khác</h3>
          <p>Nếu không thể quét QR code, bạn có thể:</p>
          <button 
            onClick={handleOpenPaymentLink}
            className="payment-link-btn"
          >
            <CreditCard size={16} />
            Thanh toán qua trình duyệt
          </button>
        </div>

        {/* Footer Actions */}
        <div className="footer-actions">
          <button 
            onClick={handleCancelPayment}
            className="cancel-btn"
          >
            Hủy thanh toán
          </button>
          <button 
            onClick={handlePaymentCompleted}
            className="success-btn"
          >
            <CheckCircle size={16} />
            Đã thanh toán
          </button>
          <button 
            onClick={() => navigate('/booking')}
            className="retry-btn"
          >
            Đặt lịch mới
          </button>
        </div>
      </div>
      
      <style>{`
        .payment-qr-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          padding: 2rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-container {
          max-width: 600px;
          width: 100%;
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0,0,0,.1);
          border: 1px solid #e5e7eb;
        }
        
        .qr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .header-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }
        
        .header-content p {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        .payment-info {
          margin-bottom: 2rem;
        }
        
        .info-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .label {
          font-weight: 600;
          color: #6b7280;
        }
        
        .value {
          font-weight: 700;
          color: #1f2937;
        }
        
        .amount {
          color: #10b981;
          font-size: 1.1rem;
        }
        
        .time {
          color: #f59e0b;
          font-size: 1.1rem;
        }
        
        .qr-section {
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .qr-section h2 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1.5rem;
        }
        
        .qr-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
        }
        
        .qr-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
          text-align: center;
        }
        
        .qr-error h3 {
          color: #ef4444;
          font-size: 1.2rem;
          margin: 0;
        }
        
        .qr-error p {
          color: #6b7280;
          margin: 0;
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
        
        .qr-code-container {
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
          margin-bottom: 1.5rem;
        }
        
        .qr-instructions {
          text-align: left;
          margin-bottom: 1.5rem;
          padding: 1.5rem;
          background: #f0f9ff;
          border-radius: 12px;
          border: 1px solid #bae6fd;
        }
        
        .qr-instructions h3 {
          color: #1f2937;
          font-size: 1.1rem;
          margin: 0 0 1rem 0;
        }
        
        .qr-instructions ol {
          margin: 0;
          padding-left: 1.2rem;
          color: #6b7280;
        }
        
        .qr-instructions li {
          margin-bottom: 0.5rem;
        }
        
        .qr-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 2rem;
        }
        
        .download-btn, .open-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .download-btn {
          background: #10b981;
          color: white;
        }
        
        .download-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        
        .open-link-btn {
          background: #3b82f6;
          color: white;
        }
        
        .open-link-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        
        .payment-status {
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .status-pending, .status-processing, .status-success, .status-failed {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 600;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        
        .status-processing {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .status-success {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-failed {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .alternative-payment {
          margin-bottom: 2rem;
          text-align: center;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .alternative-payment h3 {
          color: #1f2937;
          font-size: 1.1rem;
          margin: 0 0 0.5rem 0;
        }
        
        .alternative-payment p {
          color: #6b7280;
          margin: 0 0 1rem 0;
        }
        
        .payment-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .payment-link-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }
        
        .footer-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        .cancel-btn, .retry-btn, .success-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .cancel-btn {
          background: #ef4444;
          color: white;
        }
        
        .cancel-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }
        
        .success-btn {
          background: #10b981;
          color: white;
        }
        
        .success-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        
        .retry-btn {
          background: #6b7280;
          color: white;
        }
        
        .retry-btn:hover {
          background: #4b5563;
          transform: translateY(-1px);
        }
        
        @media (max-width: 768px) {
          .qr-container {
            padding: 1.5rem;
          }
          
          .qr-code-image {
            width: 200px;
            height: 200px;
          }
          
          .qr-actions {
            flex-direction: column;
          }
          
          .footer-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default PaymentQR

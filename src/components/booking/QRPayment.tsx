import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { CheckCircle, CreditCard, Clock, Download, AlertCircle } from 'lucide-react'
import { PaymentService } from '@/services/paymentService'
import { PayOSService } from '@/services/payOSService'

interface QRPaymentProps {
  reservation: any
  onPaymentSuccess: () => void
  onPaymentCancel: () => void
}

const QRPayment: React.FC<QRPaymentProps> = ({ 
  reservation, 
  onPaymentSuccess, 
  onPaymentCancel 
}) => {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>('pending')

  // Generate QR code with payment information
  useEffect(() => {
    const generateQRCode = async () => {
      if (!reservation) return

      try {
        setIsGenerating(true)
        setError(null)
        
        // Determine bookingId and payable amount (fallback to totalAmount)
        const bookingId = parseInt(String(reservation.id).replace('BK', ''))
        const payableAmountRaw = reservation.payableAmount ?? reservation.totalAmount
        const payableAmount = Math.max(0, Math.round(Number(payableAmountRaw || 0)))

        console.log('Creating PayOS payment link for QR:', { bookingId, payableAmount })

        // Create PayOS link with overridden amount (already includes promotion discount)
        const paymentResponse = await PayOSService.createPaymentLink(bookingId, payableAmount)
        if (!paymentResponse.success || !paymentResponse.data?.checkoutUrl) {
          throw new Error(paymentResponse.message || 'Không thể tạo link thanh toán PayOS')
        }

        const checkoutUrl = paymentResponse.data.checkoutUrl
        setPaymentData({ paymentUrl: checkoutUrl, amount: payableAmount })
        
        // Generate QR code from the PayOS checkout URL
        const qrData = checkoutUrl
        
        if (!qrData) {
          throw new Error('Không có URL thanh toán từ PayOS')
        }
        
        const dataUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#10b981', // Green color
            light: '#ffffff'
          }
        })
        
        setQrCodeDataUrl(dataUrl)
        
        // Also draw on canvas
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#10b981',
              light: '#ffffff'
            }
          })
        }
        
      } catch (error: any) {
        console.error('Error generating QR code:', error)
        setError(error.message || 'Có lỗi xảy ra khi tạo mã QR thanh toán')
        
        // Don't use fallback - show error instead
        setIsGenerating(false)
      } finally {
        setIsGenerating(false)
      }
    }

    generateQRCode()
  }, [reservation])

  // Poll payment status if payment data is available
  useEffect(() => {
    if (!paymentData?.paymentId) return

    const pollPaymentStatus = async () => {
      try {
        const statusResponse = await PaymentService.getPaymentStatus(paymentData.paymentId)
        console.log('Payment status:', statusResponse)
        
        setPaymentStatus(statusResponse.status)
        
        if (statusResponse.status === 'COMPLETED') {
          // Redirect to payment success page instead of calling onPaymentSuccess
          const successAmount = reservation.payableAmount ?? reservation.totalAmount
          const successUrl = `/payment-success?bookingId=${reservation.id}&status=PAID&amount=${successAmount}`
          navigate(successUrl)
        } else if (statusResponse.status === 'FAILED' || statusResponse.status === 'CANCELLED') {
          // Redirect to payment cancel page instead of showing error
          const cancelAmount = reservation.payableAmount ?? reservation.totalAmount
          const cancelUrl = `/payment-cancel?bookingId=${reservation.id}&amount=${cancelAmount}&reason=${statusResponse.failureReason || 'PAYMENT_FAILED'}`
          navigate(cancelUrl)
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
    }

    // Poll every 5 seconds
    const interval = setInterval(pollPaymentStatus, 5000)
    
    return () => clearInterval(interval)
  }, [paymentData, onPaymentSuccess])

  const handleDownloadQR = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `qr-payment-${reservation.id}.png`
      link.href = qrCodeDataUrl
      link.click()
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div className="qr-payment-modal">
      <div className="qr-payment-container">
        <div className="qr-payment-header">
          <CreditCard size={24} color="#10b981" />
          <h2>Thanh toán QR Code</h2>
        </div>

        {error && (
          <div className="qr-payment-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="qr-payment-content">
          <div className="qr-payment-info">
            <div className="payment-details">
              <h3>Thông tin thanh toán</h3>
              <div className="detail-row">
                <span>Mã đặt lịch:</span>
                <span className="detail-value">{reservation.id}</span>
              </div>
              <div className="detail-row">
                <span>Xe:</span>
                <span className="detail-value">{reservation.vehicle?.licensePlate || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Trung tâm:</span>
                <span className="detail-value">{reservation.center?.centerName || 'EV Service Center'}</span>
              </div>
              <div className="detail-row">
                <span>Ngày hẹn:</span>
                <span className="detail-value">{reservation.appointmentDate}</span>
              </div>
              <div className="detail-row">
                <span>Giờ:</span>
                <span className="detail-value">{reservation.timeSlot}</span>
              </div>
              <div className="detail-row total">
                <span>Tổng tiền:</span>
                <span className="detail-value">{formatPrice(reservation.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="qr-payment-code">
            <h3>Quét mã QR để thanh toán</h3>
            
            {isGenerating ? (
              <div className="qr-loading">
                <div className="spinner"></div>
                <p>Đang tạo mã QR...</p>
              </div>
            ) : (
              <div className="qr-code-container">
                {qrCodeDataUrl && (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="qr-code-image"
                  />
                )}
                <canvas 
                  ref={canvasRef} 
                  style={{ display: 'none' }}
                />
                
                <div className="qr-instructions">
                  <p>1. Mở ứng dụng ngân hàng trên điện thoại</p>
                  <p>2. Quét mã QR bên trên</p>
                  <p>3. Xác nhận thanh toán</p>
                  <p>4. Hoặc nhấn "Mở liên kết thanh toán" để thanh toán trên trình duyệt</p>
                </div>
                
                <button 
                  onClick={handleDownloadQR}
                  className="download-btn"
                >
                  <Download size={16} />
                  Tải mã QR
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="qr-payment-status">
          {paymentStatus === 'COMPLETED' && (
            <div className="status-success">
              <CheckCircle size={20} color="#10b981" />
              <span>Thanh toán thành công!</span>
            </div>
          )}
          {paymentStatus === 'PROCESSING' && (
            <div className="status-processing">
              <Clock size={20} color="#f59e0b" />
              <span>Đang xử lý thanh toán...</span>
            </div>
          )}
          {paymentStatus === 'FAILED' && (
            <div className="status-failed">
              <AlertCircle size={20} color="#ef4444" />
              <span>Thanh toán thất bại</span>
            </div>
          )}
        </div>

        <div className="qr-payment-actions">
          <button 
            onClick={() => {
              const cancelUrl = `/payment-cancel?bookingId=${reservation.id}&amount=${reservation.totalAmount}&reason=USER_CANCELLED`
              navigate(cancelUrl)
            }}
            className="cancel-btn"
          >
            Hủy thanh toán
          </button>
          {paymentStatus === 'COMPLETED' && (
            <button 
              onClick={() => {
                const successUrl = `/payment-success?bookingId=${reservation.id}&status=PAID&amount=${reservation.totalAmount}`
                navigate(successUrl)
              }}
              className="success-btn"
            >
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default QRPayment
import React, { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { CheckCircle, CreditCard, Clock, Download, AlertCircle } from 'lucide-react'
import { PaymentService, QRPaymentRequest } from '@/services/paymentService'

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
        
        // Create QR payment request
        const qrPaymentRequest: QRPaymentRequest = {
          bookingId: parseInt(reservation.id.replace('BK', '')), // Extract booking ID from reservation ID
          amount: reservation.totalAmount,
          description: `Thanh toán đặt lịch bảo dưỡng xe điện - ${reservation.vehicle?.licensePlate || 'N/A'}`
        }

        console.log('Creating QR payment:', qrPaymentRequest)

        // Call API to create QR payment
        const qrPaymentResponse = await PaymentService.createQRPayment(qrPaymentRequest)
        
        console.log('QR payment created:', qrPaymentResponse)
        setPaymentData(qrPaymentResponse)
        
        // Generate QR code from the response
        const dataUrl = await QRCode.toDataURL(qrPaymentResponse.qrCode, {
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
          await QRCode.toCanvas(canvasRef.current, qrPaymentResponse.qrCode, {
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
        
        // Fallback: generate QR code with basic payment info
        const fallbackData = {
          reservationId: reservation.id,
          amount: reservation.totalAmount,
          currency: 'VND',
          description: `Thanh toán đặt lịch bảo dưỡng xe điện - ${reservation.vehicle?.licensePlate || 'N/A'}`,
          merchant: 'EV Service Center',
          timestamp: new Date().toISOString()
        }
        
        const fallbackDataUrl = await QRCode.toDataURL(JSON.stringify(fallbackData), {
          width: 300,
          margin: 2,
          color: {
            dark: '#10b981',
            light: '#ffffff'
          }
        })
        
        setQrCodeDataUrl(fallbackDataUrl)
        
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
          onPaymentSuccess()
        } else if (statusResponse.status === 'FAILED' || statusResponse.status === 'CANCELLED') {
          setError(statusResponse.failureReason || 'Thanh toán thất bại')
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
            onClick={onPaymentCancel}
            className="cancel-btn"
          >
            Hủy thanh toán
          </button>
          {paymentStatus === 'COMPLETED' && (
            <button 
              onClick={onPaymentSuccess}
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
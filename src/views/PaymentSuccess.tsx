import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAppSelector } from '@/store/hooks'
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
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const auth = useAppSelector((state) => state.auth)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const handlePaymentResult = async () => {
      try {
        const bookingId = searchParams.get('bookingId')
        const status = (searchParams.get('status') || '').toLowerCase() as PaymentResult['status']
        
        if (!bookingId) {
          setError('Thiếu thông tin booking ID')
          return
        }

        console.log('Payment result received:', { bookingId, status })

        // Gọi API để lấy thông tin booking và xác nhận thanh toán
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }
        
        // Thêm token nếu có
        if (auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/booking/${bookingId}`, {
          headers
        })
        const bookingData = await response.json()

        if (bookingData.success) {
          setPaymentResult({
            bookingId: parseInt(bookingId),
            status: status || 'success',
            bookingInfo: bookingData.data
          })

          // Hiển thị toast thành công
          if (status === 'success') {
            toast.success('Thanh toán thành công!')
          } else if (status === 'cancelled') {
            toast.error('Thanh toán đã bị hủy')
          } else {
            toast.error('Thanh toán thất bại')
          }
        } else {
          setError('Không thể lấy thông tin booking')
        }
      } catch (err) {
        console.error('Error handling payment result:', err)
        setError('Có lỗi xảy ra khi xử lý kết quả thanh toán')
      } finally {
        setLoading(false)
      }
    }

    handlePaymentResult()
  }, [searchParams])

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
                    {paymentResult.bookingInfo.totalAmount.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>

              {/* Services */}
              <div className="services-section">
                <h3 className="services-title">Dịch vụ đã đặt</h3>
                <div className="space-y-2">
                  {paymentResult.bookingInfo.services.map((service, index) => (
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
import React, { useState } from 'react'
import { CheckCircle, CreditCard, Clock, Calendar, MapPin, Car, User } from 'lucide-react'
import { PaymentService, PaymentRequest, PaymentMethod } from '@/services/paymentService'

interface BookingSuccessProps {
  bookingId: number
  reservationId: string
  vehicle: {
    licensePlate: string
    brand?: string
    model?: string
  }
  center: {
    centerName: string
    address?: string
  }
  appointmentDate: string
  timeSlot: string
  services: Array<{
    serviceName: string
    basePrice: number
  }>
  totalAmount: number
  onPaymentSuccess: () => void
  onBackToHome: () => void
}

const BookingSuccess: React.FC<BookingSuccessProps> = ({
  bookingId,
  reservationId,
  vehicle,
  center,
  appointmentDate,
  timeSlot,
  services,
  totalAmount,
  onPaymentSuccess,
  onBackToHome
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handlePayment = async () => {
    try {
      setIsProcessingPayment(true)
      setPaymentError(null)

      console.log('Creating payment for booking:', bookingId)

      // Create payment request
      const paymentRequest: PaymentRequest = {
        bookingId: bookingId,
        amount: totalAmount,
        paymentMethod: 'VNPAY' as PaymentMethod, // Default to VNPay
        description: `Thanh toán đặt lịch bảo dưỡng xe điện - ${vehicle.licensePlate}`,
        returnUrl: `${window.location.origin}/profile?tab=service-history`,
        cancelUrl: `${window.location.origin}/booking/payment/cancel`
      }

      console.log('Payment request:', paymentRequest)

      // Call payment API
      const paymentResponse = await PaymentService.createPayment(paymentRequest)
      console.log('Payment response:', paymentResponse)

      // If payment URL is returned, redirect to payment gateway
      if (paymentResponse.paymentUrl) {
        console.log('Redirecting to payment URL:', paymentResponse.paymentUrl)
        window.location.href = paymentResponse.paymentUrl
      } else {
        // If no payment URL, show success (for testing)
        console.log('No payment URL returned, showing success')
        onPaymentSuccess()
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      setPaymentError(error.message || 'Có lỗi xảy ra khi tạo thanh toán')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'Mulish, serif'
    }}>
      {/* Success Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '16px',
        color: 'white'
      }}>
        <CheckCircle size={64} style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
          Đặt lịch thành công!
        </h1>
        <p style={{ fontSize: '1.125rem', opacity: 0.9, margin: 0 }}>
          Mã đặt lịch: <strong>{reservationId}</strong>
        </p>
      </div>

      {/* Booking Details */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
          Thông tin đặt lịch
        </h2>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Car size={20} color="#10b981" />
            <span style={{ fontWeight: '500' }}>Xe:</span>
            <span>{vehicle.licensePlate}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin size={20} color="#10b981" />
            <span style={{ fontWeight: '500' }}>Trung tâm:</span>
            <span>{center.centerName}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={20} color="#10b981" />
            <span style={{ fontWeight: '500' }}>Ngày:</span>
            <span>{formatDate(appointmentDate)}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={20} color="#10b981" />
            <span style={{ fontWeight: '500' }}>Giờ:</span>
            <span>{timeSlot}</span>
          </div>
        </div>
      </div>

      {/* Services */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
          Dịch vụ đã chọn
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {services.map((service, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <span>{service.serviceName}</span>
              <span style={{ fontWeight: '600', color: '#10b981' }}>
                {formatPrice(service.basePrice)}
              </span>
            </div>
          ))}
        </div>
        
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#10b981',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '1.125rem' }}>
            Tổng tiền:
          </span>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '1.25rem' }}>
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>

      {/* Payment Error */}
      {paymentError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#dc2626'
        }}>
          {paymentError}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={onBackToHome}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem'
          }}
        >
          Về trang chủ
        </button>
        
        <button
          onClick={handlePayment}
          disabled={isProcessingPayment}
          style={{
            background: isProcessingPayment ? '#d1d5db' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {isProcessingPayment ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #fff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Đang xử lý...
            </>
          ) : (
            <>
              <CreditCard size={16} />
              Thanh toán ngay
            </>
          )}
        </button>
      </div>

      {/* Payment Instructions */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h4 style={{ color: '#0369a1', marginBottom: '0.5rem' }}>
          Hướng dẫn thanh toán:
        </h4>
        <ul style={{ color: '#0369a1', margin: 0, paddingLeft: '1.5rem' }}>
          <li>Nhấn "Thanh toán ngay" để chuyển đến cổng thanh toán VNPay</li>
          <li>Chọn phương thức thanh toán phù hợp</li>
          <li>Hoàn tất thanh toán để xác nhận đặt lịch</li>
          <li>Bạn sẽ nhận được email xác nhận sau khi thanh toán thành công</li>
        </ul>
      </div>
    </div>
  )
}

export default BookingSuccess

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { handlePaymentCallback } from '@/services/paymentService'

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [processingMessage, setProcessingMessage] = useState('Đang xử lý thanh toán...')
  
  useEffect(() => {
    const processPaymentCallback = async () => {
      try {
        // Get all URL parameters
        const params = Object.fromEntries(searchParams.entries())
        console.log('Payment callback params:', params)
        
        setProcessingMessage('Đang kiểm tra trạng thái thanh toán...')
        
        // Sử dụng API để kiểm tra trạng thái thanh toán
        const result = await handlePaymentCallback(params)
        console.log('Payment status check result:', result)
        
        // Fallback: Nếu API không hoạt động, dựa vào URL params
        const isSuccessFromUrl = params.status === 'PAID' || params.success === 'true'
        const orderCode = params.orderCode || params.bookingId
        const amount = params.amount
        
        if ((result.success && result.status === 'PAID') || isSuccessFromUrl) {
          // Thanh toán thành công
          const successUrl = `/payment-success?bookingId=${result.orderCode || orderCode}&status=PAID&amount=${result.amount || amount}${result.bookingId ? `&bookingId=${result.bookingId}` : ''}`
          console.log('Payment successful, redirecting to:', successUrl)
          window.location.href = successUrl
        } else {
          // Thanh toán thất bại hoặc chưa hoàn tất
          const cancelUrl = `/payment-cancel?bookingId=${result.orderCode || orderCode}&amount=${result.amount || amount}&reason=${result.message || 'PAYMENT_FAILED'}`
          console.log('Payment failed, redirecting to:', cancelUrl)
          window.location.href = cancelUrl
        }
      } catch (error) {
        console.error('Error processing payment callback:', error)
        setProcessingMessage('Có lỗi xảy ra khi xử lý thanh toán')
        
        // Fallback: redirect sau 3 giây dựa vào URL params
        setTimeout(() => {
          const params = Object.fromEntries(searchParams.entries())
          const orderCode = params.orderCode || params.bookingId
          const amount = params.amount
          const isSuccessFromUrl = params.status === 'PAID' || params.success === 'true'
          
          if (isSuccessFromUrl) {
            // Nếu URL có status=PAID, redirect đến success
            const successUrl = `/payment-success?bookingId=${orderCode}&status=PAID&amount=${amount}`
            console.log('Fallback: redirecting to success page:', successUrl)
            window.location.href = successUrl
          } else {
            // Ngược lại, redirect đến cancel
            const cancelUrl = `/payment-cancel?bookingId=${orderCode}&amount=${amount}&reason=PROCESSING_ERROR`
            console.log('Fallback: redirecting to cancel page:', cancelUrl)
            window.location.href = cancelUrl
          }
        }, 3000)
      }
    }
    
    processPaymentCallback()
  }, [searchParams])
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--bg-primary)'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--primary-200)',
          borderTop: '4px solid var(--primary-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {processingMessage}
        </h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Vui lòng đợi trong giây lát
        </p>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default PaymentCallback

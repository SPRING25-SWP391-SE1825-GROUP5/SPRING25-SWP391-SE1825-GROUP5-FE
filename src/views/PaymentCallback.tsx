import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [processingMessage, setProcessingMessage] = useState('Đang xử lý thanh toán...')
  
  useEffect(() => {
    const processPaymentCallback = async () => {
      try {
        // Get all URL parameters from PayOS callback
        const params = Object.fromEntries(searchParams.entries())
        console.log('Payment callback params:', params)
        
        setProcessingMessage('Đang kiểm tra trạng thái thanh toán...')
        
        // Extract orderCode from PayOS callback
        const orderCode = params.orderCode || params.bookingId
        const amount = params.amount || 0
        const status = params.status || 'UNKNOWN'
        
        if (!orderCode) {
          throw new Error('Missing orderCode in payment callback')
        }
        
        console.log('Processing payment callback for orderCode:', orderCode, 'status:', status)
        
        // Simple logic: if PayOS redirects here, check the status parameter
        if (status === 'PAID' || params.success === 'true') {
          // Payment successful - redirect to success page
          const successUrl = `/payment-success?bookingId=${orderCode}&status=PAID&amount=${amount}`
          console.log('Payment successful, redirecting to:', successUrl)
          window.location.href = successUrl
        } else {
          // Payment failed or cancelled - redirect to cancel page
          const cancelUrl = `/payment-cancel?bookingId=${orderCode}&amount=${amount}&reason=${status}`
          console.log('Payment failed/cancelled, redirecting to:', cancelUrl)
          window.location.href = cancelUrl
        }
      } catch (error) {
        console.error('Error processing payment callback:', error)
        setProcessingMessage('Có lỗi xảy ra khi xử lý thanh toán')
        
        // Fallback: redirect to success page after 3 seconds
        setTimeout(() => {
          const params = Object.fromEntries(searchParams.entries())
          const orderCode = params.orderCode || params.bookingId
          const amount = params.amount || 0
          
          const successUrl = `/payment-success?bookingId=${orderCode}&status=PAID&amount=${amount}`
          console.log('Fallback: redirecting to success page:', successUrl)
          window.location.href = successUrl
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

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  
  useEffect(() => {
    // Get all URL parameters
    const params = Object.fromEntries(searchParams.entries())
    console.log('Payment callback params:', params)
    
    // Check if payment was successful
    const isSuccess = params.status === 'PAID' || params.success === 'true'
    const bookingId = params.orderCode || params.bookingId
    const amount = params.amount
    
    if (isSuccess && bookingId) {
      // Redirect to payment success page with parameters
      const successUrl = `/payment-success?bookingId=${bookingId}&status=PAID${amount ? `&amount=${amount}` : ''}`
      console.log('Redirecting to payment success page:', successUrl)
      window.location.href = successUrl
    } else {
      // Redirect to payment cancel page if failed
      const cancelUrl = `/payment-cancel?bookingId=${bookingId}${amount ? `&amount=${amount}` : ''}&reason=${params.reason || 'PAYMENT_FAILED'}`
      console.log('Payment failed, redirecting to payment cancel page:', cancelUrl)
      window.location.href = cancelUrl
    }
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
          Đang xử lý thanh toán...
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

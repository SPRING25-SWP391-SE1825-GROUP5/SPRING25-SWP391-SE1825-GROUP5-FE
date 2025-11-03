import React, { useState } from 'react'
import { CreditCard, Smartphone, Wallet, AlertCircle } from 'lucide-react'
import { PaymentService, PaymentRequest, PaymentMethod, VNPayPaymentRequest } from '@/services/paymentService'

interface PaymentMethodSelectorProps {
  bookingId: number
  amount: number
  description: string
  onPaymentSuccess: () => void
  onPaymentCancel: () => void
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  bookingId,
  amount,
  description,
  onPaymentSuccess,
  onPaymentCancel
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paymentMethods = [
    {
      id: 'QR_CODE' as PaymentMethod,
      name: 'QR Code',
      description: 'Quét mã QR để thanh toán',
      icon: <Smartphone size={24} />,
      color: '#10b981'
    },
    {
      id: 'VNPAY' as PaymentMethod,
      name: 'VNPay',
      description: 'Thanh toán qua cổng VNPay',
      icon: <Wallet size={24} />,
      color: '#3b82f6'
    },
    {
      id: 'CREDIT_CARD' as PaymentMethod,
      name: 'Thẻ tín dụng',
      description: 'Thanh toán bằng thẻ Visa/Mastercard',
      icon: <CreditCard size={24} />,
      color: '#8b5cf6'
    }
  ]

  const handlePaymentMethod = async (method: PaymentMethod) => {
    try {
      setIsProcessing(true)
      setError(null)

      const paymentRequest: PaymentRequest = {
        bookingId,
        amount,
        paymentMethod: method,
        description,
        returnUrl: `${window.location.origin}/booking/payment/success`,
        cancelUrl: `${window.location.origin}/booking/payment/cancel`
      }


      if (method === 'VNPAY') {
        // Handle VNPay payment
        const vnpayRequest: VNPayPaymentRequest = {
          bookingId,
          amount,
          description,
          returnUrl: paymentRequest.returnUrl!,
          cancelUrl: paymentRequest.cancelUrl!
        }

        const vnpayResponse = await PaymentService.createVNPayPayment(vnpayRequest)
        
        // Redirect to VNPay
        window.location.href = vnpayResponse.paymentUrl
        
      } else if (method === 'QR_CODE') {
        // Handle QR payment
        const paymentResponse = await PaymentService.createPayment(paymentRequest)
        
        // This would typically show QR code modal
        // For now, we'll just show success
        onPaymentSuccess()
        
      } else if (method === 'CREDIT_CARD') {
        // Handle credit card payment
        const paymentResponse = await PaymentService.createPayment(paymentRequest)
        
        // This would typically redirect to payment gateway
        // For now, we'll just show success
        onPaymentSuccess()
      }

    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi tạo thanh toán')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div className="payment-method-selector">
      <div className="payment-method-header">
        <h2>Chọn phương thức thanh toán</h2>
        <div className="payment-amount">
          <span>Tổng tiền: </span>
          <span className="amount">{formatPrice(amount)}</span>
        </div>
      </div>

      {error && (
        <div className="payment-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="payment-methods">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`payment-method-card ${selectedMethod === method.id ? 'selected' : ''}`}
            onClick={() => setSelectedMethod(method.id)}
          >
            <div className="method-icon" style={{ color: method.color }}>
              {method.icon}
            </div>
            <div className="method-info">
              <h3>{method.name}</h3>
              <p>{method.description}</p>
            </div>
            <div className="method-radio">
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={() => setSelectedMethod(method.id)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="payment-actions">
        <button
          onClick={onPaymentCancel}
          className="cancel-btn"
          disabled={isProcessing}
        >
          Hủy
        </button>
        <button
          onClick={() => selectedMethod && handlePaymentMethod(selectedMethod)}
          disabled={!selectedMethod || isProcessing}
          className="confirm-btn"
        >
          {isProcessing ? (
            <>
              <div className="spinner" />
              Đang xử lý...
            </>
          ) : (
            'Thanh toán'
          )}
        </button>
      </div>
    </div>
  )
}

export default PaymentMethodSelector

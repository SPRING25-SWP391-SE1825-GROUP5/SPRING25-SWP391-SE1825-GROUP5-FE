import { useNavigate, useLocation } from 'react-router-dom'
import {
  XCircleIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import './order-failure.scss'

interface FailureReason {
  code: string
  title: string
  description: string
  solution: string
}

const failureReasons: FailureReason[] = [
  {
    code: 'INSUFFICIENT_FUNDS',
    title: 'Tài khoản không đủ số dư',
    description: 'Thẻ của bạn không có đủ số dư để thực hiện giao dịch này.',
    solution: 'Vui lòng kiểm tra số dư và thử lại hoặc sử dụng phương thức thanh toán khác.'
  },
  {
    code: 'CARD_DECLINED',
    title: 'Thẻ bị từ chối',
    description: 'Ngân hàng đã từ chối giao dịch từ thẻ của bạn.',
    solution: 'Liên hệ với ngân hàng để kiểm tra hoặc sử dụng thẻ khác.'
  },
  {
    code: 'EXPIRED_CARD',
    title: 'Thẻ đã hết hạn',
    description: 'Thẻ tín dụng/ghi nợ của bạn đã hết hạn sử dụng.',
    solution: 'Vui lòng cập nhật thông tin thẻ mới hoặc sử dụng phương thức thanh toán khác.'
  },
  {
    code: 'NETWORK_ERROR',
    title: 'Lỗi kết nối',
    description: 'Có vấn đề với kết nối mạng trong quá trình xử lý.',
    solution: 'Vui lòng kiểm tra kết nối internet và thử lại.'
  }
]

export default function OrderFailure() {
  const navigate = useNavigate()
  const location = useLocation()
  const failureCode = location.state?.failureCode || 'NETWORK_ERROR'
  const orderData = location.state?.orderData

  const getCurrentFailureReason = (): FailureReason => {
    return failureReasons.find(reason => reason.code === failureCode) || failureReasons[3]
  }

  const failureReason = getCurrentFailureReason()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleRetryPayment = () => {
    if (orderData) {
      // Navigate back to checkout with preserved data
      navigate('/checkout', { state: { retryData: orderData } })
    } else {
      navigate('/cart')
    }
  }

  return (
    <div className="order-failure-page">
      <div className="container">
        {/* Failure Header */}
        <div className="failure-header">
          <div className="failure-icon">
            <XCircleIcon className="w-20 h-20" />
          </div>
          <h1>Thanh toán không thành công</h1>
          <p>Rất tiếc, đã có lỗi xảy ra trong quá trình xử lý thanh toán của bạn.</p>
        </div>

        <div className="failure-content">
          {/* Error Details */}
          <div className="error-details-card">
            <div className="error-header">
              <ExclamationTriangleIcon className="w-6 h-6" />
              <h2>Chi tiết lỗi</h2>
            </div>

            <div className="error-info">
              <div className="error-title">{failureReason.title}</div>
              <div className="error-description">{failureReason.description}</div>
              <div className="error-solution">
                <strong>Giải pháp:</strong> {failureReason.solution}
              </div>
            </div>

            {orderData && (
              <div className="order-summary">
                <h3>Đơn hàng chưa thanh toán</h3>
                <div className="order-info">
                  <div className="order-items">
                    {orderData.items.slice(0, 2).map((item: any) => (
                      <div key={item.id} className="order-item">
                        <img src={item.image} alt={item.name} />
                        <div>
                          <div className="item-name">{item.name}</div>
                          <div className="item-quantity">Số lượng: {item.quantity}</div>
                        </div>
                      </div>
                    ))}
                    {orderData.items.length > 2 && (
                      <div className="more-items">
                        +{orderData.items.length - 2} sản phẩm khác
                      </div>
                    )}
                  </div>
                  <div className="order-total">
                    Tổng tiền: {formatPrice(orderData.total)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Options */}
          <div className="action-options">
            <div className="primary-actions">
              <button 
                className="retry-payment-btn"
                onClick={handleRetryPayment}
              >
                <CreditCardIcon className="w-5 h-5" />
                Thử thanh toán lại
              </button>
              
              <button 
                className="back-to-cart-btn"
                onClick={() => navigate('/cart')}
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Quay lại giỏ hàng
              </button>
            </div>

            <div className="secondary-actions">
              <button 
                className="continue-shopping-btn"
                onClick={() => navigate('/products')}
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="alternative-methods">
            <h3>Các phương thức thanh toán khác</h3>
            <div className="payment-options">
              <div className="payment-option">
                <CreditCardIcon className="w-6 h-6" />
                <div>
                  <strong>Thẻ khác</strong>
                  <span>Sử dụng thẻ tín dụng/ghi nợ khác</span>
                </div>
              </div>
              <div className="payment-option">
                <div className="bank-icon">🏦</div>
                <div>
                  <strong>Chuyển khoản</strong>
                  <span>Chuyển khoản trực tiếp qua ngân hàng</span>
                </div>
              </div>
              <div className="payment-option">
                <div className="momo-icon">📱</div>
                <div>
                  <strong>Ví điện tử</strong>
                  <span>MoMo, ZaloPay, ShopeePay</span>
                </div>
              </div>
              <div className="payment-option">
                <div className="cod-icon">🚚</div>
                <div>
                  <strong>Thanh toán khi nhận hàng</strong>
                  <span>Tiền mặt hoặc thẻ khi giao hàng</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="support-section">
          <div className="support-header">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <h3>Cần hỗ trợ?</h3>
          </div>
          
          <p>Nếu vấn đề vẫn tiếp tục, đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp bạn 24/7</p>
          
          <div className="support-options">
            <a href="tel:1900123456" className="support-option">
              <PhoneIcon className="w-5 h-5" />
              <div>
                <strong>Hotline</strong>
                <span>1900 123 456</span>
              </div>
            </a>
            
            <a href="mailto:support@evservice.com" className="support-option">
              <EnvelopeIcon className="w-5 h-5" />
              <div>
                <strong>Email</strong>
                <span>support@evservice.com</span>
              </div>
            </a>
            
            <button className="support-option" onClick={() => alert('Chat feature coming soon!')}>
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <div>
                <strong>Live Chat</strong>
                <span>Trò chuyện trực tiếp</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

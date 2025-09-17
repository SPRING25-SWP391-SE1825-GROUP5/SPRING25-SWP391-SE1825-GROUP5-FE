import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  CheckCircleIcon,
  ShoppingBagIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import './order-success.scss'

interface OrderData {
  items: any[]
  shipping: any
  payment: string
  total: number
}

export default function OrderSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const orderData = location.state?.orderData as OrderData

  useEffect(() => {
    // If no order data, redirect to home
    if (!orderData) {
      navigate('/')
    }
  }, [orderData, navigate])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getPaymentMethodName = (method: string) => {
    const methods = {
      'card': 'Thẻ tín dụng/ghi nợ',
      'bank': 'Chuyển khoản ngân hàng',
      'momo': 'Ví MoMo',
      'cod': 'Thanh toán khi nhận hàng'
    }
    return methods[method as keyof typeof methods] || method
  }

  const generateOrderId = () => {
    return 'EV' + Date.now().toString().slice(-8)
  }

  const getEstimatedDelivery = () => {
    const today = new Date()
    const deliveryDate = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000)) // 3 days later
    return deliveryDate.toLocaleDateString('vi-VN')
  }

  if (!orderData) {
    return null
  }

  return (
    <div className="order-success-page">
      <div className="container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <CheckCircleIcon className="w-20 h-20" />
          </div>
          <h1>Đặt hàng thành công!</h1>
          <p>Cảm ơn bạn đã mua sắm tại EV Service. Đơn hàng của bạn đã được xác nhận.</p>
        </div>

        <div className="order-content">
          {/* Order Summary */}
          <div className="order-summary-card">
            <div className="card-header">
              <h2>Chi tiết đơn hàng</h2>
              <div className="order-id">#{generateOrderId()}</div>
            </div>

            <div className="order-items">
              <h3>Sản phẩm đã đặt</h3>
              {orderData.items.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-brand">{item.brand}</div>
                    <div className="item-quantity">Số lượng: {item.quantity}</div>
                  </div>
                  <div className="item-price">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Tạm tính</span>
                <span>{formatPrice(orderData.total - (orderData.total * 0.1))}</span>
              </div>
              <div className="total-row">
                <span>Phí vận chuyển</span>
                <span>{orderData.total >= 10000000 ? 'Miễn phí' : formatPrice(200000)}</span>
              </div>
              <div className="total-row">
                <span>VAT (10%)</span>
                <span>{formatPrice(orderData.total * 0.1)}</span>
              </div>
              <div className="total-divider"></div>
              <div className="total-row final">
                <span>Tổng cộng</span>
                <span>{formatPrice(orderData.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="info-cards">
            <div className="info-card">
              <div className="info-header">
                <MapPinIcon className="w-6 h-6" />
                <h3>Thông tin giao hàng</h3>
              </div>
              <div className="info-content">
                <div className="info-item">
                  <strong>{orderData.shipping.firstName} {orderData.shipping.lastName}</strong>
                </div>
                <div className="info-item">
                  <EnvelopeIcon className="w-4 h-4" />
                  {orderData.shipping.email}
                </div>
                <div className="info-item">
                  <PhoneIcon className="w-4 h-4" />
                  {orderData.shipping.phone}
                </div>
                <div className="info-item">
                  <MapPinIcon className="w-4 h-4" />
                  {orderData.shipping.address}, {orderData.shipping.city}
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <CalendarDaysIcon className="w-6 h-6" />
                <h3>Thời gian giao hàng</h3>
              </div>
              <div className="info-content">
                <div className="delivery-estimate">
                  <ClockIcon className="w-5 h-5" />
                  <div>
                    <strong>Dự kiến giao hàng</strong>
                    <span>{getEstimatedDelivery()}</span>
                  </div>
                </div>
                <div className="delivery-note">
                  Chúng tôi sẽ liên hệ với bạn trước khi giao hàng 1-2 tiếng
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <CheckCircleIcon className="w-6 h-6" />
                <h3>Phương thức thanh toán</h3>
              </div>
              <div className="info-content">
                <div className="payment-method">
                  {getPaymentMethodName(orderData.payment)}
                </div>
                <div className="payment-status success">
                  Thanh toán thành công
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <div className="action-buttons">
            <button 
              className="continue-shopping-btn"
              onClick={() => navigate('/products')}
            >
              <ShoppingBagIcon className="w-5 h-5" />
              Tiếp tục mua sắm
            </button>
            <button 
              className="track-order-btn"
              onClick={() => navigate('/profile')}
            >
              Theo dõi đơn hàng
            </button>
          </div>

          <div className="contact-support">
            <p>Cần hỗ trợ? Liên hệ với chúng tôi:</p>
            <div className="contact-info">
              <a href="tel:1900123456">📞 1900 123 456</a>
              <a href="mailto:support@evservice.com">✉️ support@evservice.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

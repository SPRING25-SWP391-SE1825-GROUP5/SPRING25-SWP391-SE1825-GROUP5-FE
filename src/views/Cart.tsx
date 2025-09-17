import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { removeFromCart, updateQuantity, clearCart } from '@/store/cartSlice'
import {
  XMarkIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  TagIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import './cart.scss'

export default function Cart() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cart = useAppSelector((state) => state.cart)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(id))
    } else {
      dispatch(updateQuantity({ id, quantity: newQuantity }))
    }
  }

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id))
  }

  const handleClearCart = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      dispatch(clearCart())
    }
  }

  const shipping = cart.total >= 10000000 ? 0 : 200000 // Free shipping over 10M
  const finalTotal = cart.total + shipping

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingBagIcon className="w-24 h-24" />
            </div>
            <h1>Giỏ hàng trống</h1>
            <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
            <button 
              className="continue-shopping-btn"
              onClick={() => navigate('/products')}
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Quay lại
          </button>
          <h1 className="page-title">Giỏ hàng ({cart.itemCount} sản phẩm)</h1>
        </div>

        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items">
            <div className="cart-header">
              <h2>Sản phẩm đã chọn</h2>
              <button 
                className="clear-cart-btn"
                onClick={handleClearCart}
              >
                Xóa tất cả
              </button>
            </div>

            <div className="items-list">
              {cart.items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/120x120/f5f5f5/666?text=Product'
                      }}
                    />
                  </div>

                  <div className="item-details">
                    <div className="item-info">
                      <h3 className="item-name">{item.name}</h3>
                      <div className="item-brand">{item.brand}</div>
                      <div className="item-category">{item.category}</div>
                    </div>

                    <div className="item-price">
                      <span className="current-price">{formatPrice(item.price)}</span>
                      {item.originalPrice && (
                        <span className="original-price">{formatPrice(item.originalPrice)}</span>
                      )}
                    </div>

                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      {formatPrice(item.price * item.quantity)}
                    </div>

                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.id)}
                      title="Xóa sản phẩm"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <div className="summary-card">
              <h3>Tóm tắt đơn hàng</h3>
              
              <div className="summary-row">
                <span>Tạm tính ({cart.itemCount} sản phẩm)</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              
              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span className={shipping === 0 ? 'free' : ''}>
                  {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                </span>
              </div>

              {shipping === 0 && (
                <div className="free-shipping-notice">
                  <TruckIcon className="w-5 h-5" />
                  Bạn được miễn phí vận chuyển!
                </div>
              )}

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span>Tổng cộng</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>

              <div className="promo-section">
                <div className="promo-input">
                  <TagIcon className="w-5 h-5 promo-icon" />
                  <input 
                    type="text" 
                    placeholder="Mã giảm giá"
                    className="promo-code"
                  />
                  <button className="apply-promo-btn">Áp dụng</button>
                </div>
              </div>

              <div className="checkout-actions">
                <button 
                  className="checkout-btn"
                  onClick={() => navigate('/checkout')}
                >
                  Tiến hành thanh toán
                </button>
                <button 
                  className="continue-shopping-btn"
                  onClick={() => navigate('/products')}
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="additional-info">
              <div className="info-item">
                <TruckIcon className="w-6 h-6" />
                <div>
                  <strong>Miễn phí vận chuyển</strong>
                  <span>Cho đơn hàng từ 10 triệu VNĐ</span>
                </div>
              </div>
              <div className="info-item">
                <TagIcon className="w-6 h-6" />
                <div>
                  <strong>Đổi trả 30 ngày</strong>
                  <span>Hoàn tiền 100% nếu không hài lòng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

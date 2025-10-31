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

  const mockItems = [
    {
      id: '1',
      name: 'Pin Lithium 72V-40Ah',
      price: 9200000,
      originalPrice: 10600000,
      image: '',
      brand: 'Panasonic',
      quantity: 2,
      category: 'Phụ tùng EV',
      inStock: true
    },
    {
      id: '2',
      name: 'Lốp Yokohama City 12", Tubeless (Chính hãng)',
      price: 520000,
      image: '',
      brand: 'Yokohama',
      quantity: 1,
      category: 'Phụ tùng EV',
      inStock: true
    },
    {
      id: '3',
      name: 'Sên dẫn động DID 10mm',
      price: 370000,
      image: '',
      brand: 'DID (Japan)',
      quantity: 4,
      category: 'Phụ kiện',
      inStock: true
    }
  ]

  const displayedItems = cart.items.length === 0 ? mockItems : cart.items
  const displayedCount = displayedItems.reduce((sum, it) => sum + it.quantity, 0)
  const displayedTotal = displayedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0)

  if (displayedItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingBagIcon className="w-24 h-24" />
            </div>
            <h1>Giỏ hàng của bạn hiện đang trống</h1>
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
          <h1 className="page-title">Giỏ hàng ({displayedCount} sản phẩm)</h1>
        </div>

        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items">
            <div className="cart-header">
              <h2>Giỏ hàng của bạn</h2>
              <button 
                className="clear-cart-btn"
                onClick={handleClearCart}
              >
                Xóa tất cả
              </button>
            </div>

            <div className="items-list">
              {displayedItems.map(item => (
                <div key={item.id} className="cart-card">
                  <div className="item-image">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/120x120/f5f5f5/666?text=Product'
                      }}
                    />
                  </div>

                  <div className="item-content">
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
                        onClick={() => handleQuantityChange(String(item.id), item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(String(item.id), item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      {formatPrice(item.price * item.quantity)}
                    </div>

                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveItem(String(item.id))}
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
                <span>Tạm tính ({displayedCount} sản phẩm)</span>
                <span>{formatPrice(displayedTotal)}</span>
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
          </div>
        </div>
      </div>
    </div>
  )
}

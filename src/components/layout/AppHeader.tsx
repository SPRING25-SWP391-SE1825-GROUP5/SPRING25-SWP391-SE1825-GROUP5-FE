import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { 
  BellIcon, 
  ShoppingCartIcon,
  WrenchScrewdriverIcon,
  ArchiveBoxIcon,
  TagIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import logo from '@/assets/images/logo-black.webp'
import './AppHeader.scss'
import './HeaderLayoutFix.scss'
import './ButtonStyles.scss'
import './DropdownFinalFix.scss'
import './FullscreenDropdown.scss'
/* Temporarily disable conflicting CSS imports
import './DropdownFix.scss'
import './DropdownZIndexFix.scss'
import './DropdownMenuFinal.scss'
import './SimpleDropdown.scss'
*/
// Debug components - remove after testing
// import ScreenSizeDebug from './ScreenSizeDebug'
// import DropdownDebug from './DropdownDebug'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { removeFromCart, setCartOpen } from '@/store/cartSlice'

export function AppHeader() {
  const [notificationOpen, setNotificationOpen] = useState(false)
  
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const cart = useAppSelector((state) => state.cart)
  const cartOpen = cart?.isOpen || false

  
  const notificationRef = useRef<HTMLDivElement>(null)
  const cartRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false)
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        dispatch(setCartOpen(false))
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleMarkAllRead = () => {
    // Logic to mark all notifications as read
    console.log('Marking all notifications as read')
  }

  const handleRemoveCartItem = (itemId: string) => {
    dispatch(removeFromCart(itemId))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <>
      {/* Debug components - remove after testing
      <ScreenSizeDebug />
      <DropdownDebug />
      */}
      <header id="header" className="modern-header">
      <div className="header-container">
        <div className="header-content">
          {/* Logo */}
          <div className="logo-section">
            <Link to="/" className="logo-link">
              <div className="logo-wrapper">
                <img src={logo} className="logo-image" alt="EV Service Hub" />
                <div className="logo-text">
                  <h1 className="brand-name">EV Service</h1>
                  <span className="brand-tagline">Professional Care</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center Navigation */}
          <nav className="center-nav">
            <div className="nav-item-wrapper">
              <NavLink to="/services" className="nav-item">
                Dịch vụ
                <ChevronDownIcon className="nav-arrow" />
              </NavLink>
              <div className="dropdown-menu">
                <div className="dropdown-content">
                  <div className="dropdown-menu-left">
                    <h3>Bảo dưỡng định kỳ</h3>
                    <NavLink to="/services/maintenance/basic">Bảo dưỡng cơ bản</NavLink>
                    <NavLink to="/services/maintenance/advanced">Bảo dưỡng nâng cao</NavLink>
                    <NavLink to="/services/maintenance/premium">Bảo dưỡng cao cấp</NavLink>
                    
                    <h3>Sửa chữa</h3>
                    <NavLink to="/services/repair/engine">Sửa chữa động cơ</NavLink>
                    <NavLink to="/services/repair/battery">Sửa chữa pin</NavLink>
                    <NavLink to="/services/repair/electrical">Hệ thống điện</NavLink>
                    
                    <h3>AI features</h3>
                    <NavLink to="/services/ai/diagnostics">Chẩn đoán AI</NavLink>
                    <NavLink to="/services/ai/prediction">Dự đoán hỏng hóc</NavLink>
                    
                    <h3>Management tools</h3>
                    <NavLink to="/services/management/tracking">Theo dõi tiến độ</NavLink>
                    <NavLink to="/services/management/schedule">Quản lý lịch</NavLink>
                    
                    <h3>Marketing integrations</h3>
                    <NavLink to="/services/marketing/email">Email marketing</NavLink>
                    <NavLink to="/services/marketing/sms">SMS notifications</NavLink>
                  </div>
                  <div className="dropdown-menu-right">
                    <div className="dropdown-preview">
                      <h1>Tạo ra các dịch vụ bảo dưỡng tuyệt vời quy mô lớn</h1>
                      <p>Đặt lịch nhanh, theo dõi mọi tiến trình bảo dưỡng xe điện của bạn.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="nav-item-wrapper">
              <NavLink to="/products" className="nav-item">
                Sản phẩm
                <ChevronDownIcon className="nav-arrow" />
              </NavLink>
              <div className="dropdown-menu">
                <div className="dropdown-content">
                  <div className="dropdown-menu-left">
                    <div className="dropdown-section">
                      <h4>Sản phẩm chính</h4>
                      <NavLink to="/products/parts/battery" className="has-submenu">Pin & Bộ sạc</NavLink>
                      <NavLink to="/products/parts/motor" className="has-submenu">Động cơ điện</NavLink>
                      <NavLink to="/products/parts/controller" className="has-submenu">Hệ thống điều khiển</NavLink>
                      <NavLink to="/products/accessories" className="has-submenu">Phụ kiện & Phụ tùng</NavLink>
                    </div>
                    <div className="dropdown-section">
                      <h4>Thiết bị chuyên dụng</h4>
                      <NavLink to="/products/equipment/diagnostic">Thiết bị chẩn đoán</NavLink>
                      <NavLink to="/products/equipment/charging">Trạm sạc</NavLink>
                      <NavLink to="/products/equipment/maintenance">Thiết bị bảo dưỡng</NavLink>
                      <NavLink to="/products/equipment/testing">Thiết bị kiểm tra</NavLink>
                    </div>
                    <div className="dropdown-section">
                      <h4>Hóa chất & Dầu nhớt</h4>
                      <NavLink to="/products/fluids/brake">Dầu phanh</NavLink>
                      <NavLink to="/products/fluids/coolant">Nước làm mát</NavLink>
                      <NavLink to="/products/fluids/cleaning">Chất tẩy rửa</NavLink>
                      <NavLink to="/products/fluids/lubricant">Dầu bôi trơn</NavLink>
                    </div>
                  </div>
                  <div className="dropdown-menu-right">
                    <div className="dropdown-preview">
                      <h3>Phụ tùng & Thiết bị xe điện chính hãng</h3>
                      <p>Chúng tôi cung cấp đầy đủ phụ tùng, phụ kiện và thiết bị chuyên dụng cho xe điện với chất lượng cao và giá cả cạnh tranh.</p>
                      
                      <div className="preview-grid">
                        <div className="preview-card">
                          <h4>🔋 Pin & Sạc</h4>
                          <p>Pin lithium-ion cao cấp và bộ sạc nhanh</p>
                        </div>
                        <div className="preview-card">
                          <h4>⚙️ Động cơ</h4>
                          <p>Động cơ điện hiệu suất cao, tiết kiệm năng lượng</p>
                        </div>
                        <div className="preview-card">
                          <h4>🛠️ Thiết bị chẩn đoán</h4>
                          <p>Máy chẩn đoán chuyên dụng cho xe điện</p>
                        </div>
                        <div className="preview-card">
                          <h4>🔧 Dụng cụ chuyên nghiệp</h4>
                          <p>Bộ dụng cụ sửa chữa xe điện chuyên nghiệp</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="nav-item-wrapper">
              <NavLink to="/promotions" className="nav-item">
                Ưu đãi
                <ChevronDownIcon className="nav-arrow" />
              </NavLink>
              <div className="dropdown-menu">
                <div className="dropdown-content">
                  <div className="dropdown-menu-left">
                    <div className="dropdown-section">
                      <h4>Khuyến mãi dịch vụ</h4>
                      <NavLink to="/promotions?category=service&type=monthly" className="has-submenu">Ưu đãi tháng</NavLink>
                      <NavLink to="/promotions?category=service&type=seasonal" className="has-submenu">Ưu đãi mùa</NavLink>
                      <NavLink to="/promotions?category=service&type=vip" className="has-submenu">Thành viên VIP</NavLink>
                      <NavLink to="/promotions?category=service&type=loyalty" className="has-submenu">Khách hàng thân thiết</NavLink>
                    </div>
                    <div className="dropdown-section">
                      <h4>Khuyến mãi sản phẩm</h4>
                      <NavLink to="/promotions?category=products&type=combo">Combo tiết kiệm</NavLink>
                      <NavLink to="/promotions?category=products&type=clearance">Thanh lý</NavLink>
                      <NavLink to="/promotions?category=products&type=new">Sản phẩm mới</NavLink>
                      <NavLink to="/promotions?category=products&type=bestseller">Bán chạy nhất</NavLink>
                    </div>
                    <div className="dropdown-section">
                      <h4>Chương trình đặc biệt</h4>
                      <NavLink to="/promotions?category=special&type=flash">Flash Sale</NavLink>
                      <NavLink to="/promotions?category=special&type=holiday">Lễ hội</NavLink>
                      <NavLink to="/promotions?category=special&type=anniversary">Kỷ niệm</NavLink>
                      <NavLink to="/promotions?category=special&type=referral">Giới thiệu bạn bè</NavLink>
                    </div>
                  </div>
                  <div className="dropdown-menu-right">
                    <div className="dropdown-preview">
                      <h3>Ưu đãi & Khuyến mãi hấp dẫn</h3>
                      <p>Khám phá các chương trình khuyến mãi đặc biệt, ưu đãi thành viên VIP và combo tiết kiệm cho dịch vụ bảo dưỡng xe điện.</p>
                      
                      <div className="preview-grid">
                        <div className="preview-card">
                          <h4>🎉 Flash Sale</h4>
                          <p>Giảm giá lên đến 50% trong thời gian có hạn</p>
                        </div>
                        <div className="preview-card">
                          <h4>👑 VIP Member</h4>
                          <p>Ưu đãi đặc biệt cho thành viên VIP</p>
                        </div>
                        <div className="preview-card">
                          <h4>🎁 Combo Deal</h4>
                          <p>Gói dịch vụ combo tiết kiệm chi phí</p>
                        </div>
                        <div className="preview-card">
                          <h4>🎊 Seasonal</h4>
                          <p>Khuyến mãi theo mùa và sự kiện đặc biệt</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="nav-item-wrapper">
              <NavLink to="/packages" className="nav-item">
                Gói dịch vụ
                <ChevronDownIcon className="nav-arrow" />
              </NavLink>
              <div className="dropdown-menu">
                <div className="dropdown-content">
                  <div className="dropdown-menu-left">
                    <div className="dropdown-section">
                      <h4>Gói bảo dưỡng</h4>
                      <NavLink to="/packages/maintenance/basic" className="has-submenu">Gói cơ bản</NavLink>
                      <NavLink to="/packages/maintenance/standard" className="has-submenu">Gói tiêu chuẩn</NavLink>
                      <NavLink to="/packages/maintenance/premium" className="has-submenu">Gói cao cấp</NavLink>
                      <NavLink to="/packages/maintenance/enterprise" className="has-submenu">Gói doanh nghiệp</NavLink>
                    </div>
                    <div className="dropdown-section">
                      <h4>Gói dịch vụ đặc biệt</h4>
                      <NavLink to="/packages/special/annual">Gói năm</NavLink>
                      <NavLink to="/packages/special/emergency">Cứu hộ 24/7</NavLink>
                      <NavLink to="/packages/special/warranty">Bảo hành mở rộng</NavLink>
                      <NavLink to="/packages/special/consultation">Tư vấn chuyên sâu</NavLink>
                    </div>
                    <div className="dropdown-section">
                      <h4>Gói gia đình</h4>
                      <NavLink to="/packages/family/multi-vehicle">Nhiều xe</NavLink>
                      <NavLink to="/packages/family/subscription">Đăng ký hàng tháng</NavLink>
                      <NavLink to="/packages/family/vip">VIP Family</NavLink>
                      <NavLink to="/packages/family/priority">Ưu tiên phục vụ</NavLink>
                    </div>
                  </div>
                  <div className="dropdown-menu-right">
                    <div className="dropdown-preview">
                      <h3>Gói dịch vụ bảo dưỡng xe điện toàn diện</h3>
                      <p>Chọn gói dịch vụ phù hợp với nhu cầu của bạn, từ gói cơ bản đến cao cấp, với nhiều ưu đãi và dịch vụ bổ sung hấp dẫn.</p>
                      
                      <div className="preview-grid">
                        <div className="preview-card">
                          <h4>🔧 Gói Cơ bản</h4>
                          <p>Bảo dưỡng định kỳ cơ bản cho xe điện</p>
                        </div>
                        <div className="preview-card">
                          <h4>⭐ Gói Tiêu chuẩn</h4>
                          <p>Bao gồm kiểm tra và sửa chữa nhỏ</p>
                        </div>
                        <div className="preview-card">
                          <h4>💎 Gói Cao cấp</h4>
                          <p>Dịch vụ toàn diện với AI diagnostics</p>
                        </div>
                        <div className="preview-card">
                          <h4>🏢 Gói Doanh nghiệp</h4>
                          <p>Giải pháp cho đội xe công ty</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <NavLink to="/contact" className="nav-item">
              Liên hệ
            </NavLink>
          </nav>

          {/* Right Section: Icons + Avatar + Hamburger */}
          <div className="right-section">
            {/* Notifications Icon - Only for logged in users */}
            {user && (
              <div className="header-icon-wrapper" ref={notificationRef}>
                <button 
                  className="header-icon-btn" 
                  title="Thông báo"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                >
                  <BellIcon className="icon" />
                  <span className="notification-badge">3</span>
                </button>
            
                {/* Notification Dropdown */}
                <div className={`notification-dropdown ${notificationOpen ? 'open' : ''}`}>
                  <div className="dropdown-header">
                    <h4>Thông báo</h4>
                    <button className="mark-all-read" onClick={handleMarkAllRead}>Đánh dấu đã đọc</button>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item unread">
                      <div className="notification-icon">
                        <WrenchScrewdriverIcon className="w-5 h-5" />
                      </div>
                      <div className="notification-content">
                        <h5>Lịch bảo dưỡng sắp tới</h5>
                        <p>Xe VinFast VF8 của bạn sắp đến hạn bảo dưỡng 10,000km</p>
                        <span className="notification-time">2 giờ trước</span>
                      </div>
                    </div>
                    <div className="notification-item unread">
                      <div className="notification-icon">
                        <ArchiveBoxIcon className="w-5 h-5" />
                      </div>
                      <div className="notification-content">
                        <h5>Đơn hàng đã giao</h5>
                        <p>Bộ sạc nhanh DC 50kW đã được giao thành công</p>
                        <span className="notification-time">1 ngày trước</span>
                      </div>
                    </div>
                    <div className="notification-item">
                      <div className="notification-icon">
                        <TagIcon className="w-5 h-5" />
                      </div>
                      <div className="notification-content">
                        <h5>Khuyến mãi mới</h5>
                        <p>Giảm 20% cho dịch vụ bảo dưỡng định kỳ trong tháng 3</p>
                        <span className="notification-time">3 ngày trước</span>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-footer">
                    <Link to="/notifications" className="view-all-link">Xem tất cả thông báo</Link>
                  </div>
                </div>
              </div>
            )}

            {/* Shopping Cart Icon - Always visible */}
            <div className="header-icon-wrapper" ref={cartRef}>
              <button 
                className="header-icon-btn" 
                title="Giỏ hàng"
                onClick={() => dispatch(setCartOpen(!cartOpen))}
              >
                <ShoppingCartIcon className="icon" />
                {(cart?.itemCount || 0) > 0 && <span className="cart-badge">{cart.itemCount}</span>}
              </button>
              
              {/* Cart Dropdown */}
              <div className={`cart-dropdown ${cartOpen ? 'open' : ''}`}>
                <div className="dropdown-header">
                  <h4>Giỏ hàng</h4>
                  <span className="cart-total">{cart?.itemCount || 0} sản phẩm</span>
                </div>
                <div className="cart-list">
                  {!cart?.items || cart.items.length === 0 ? (
                    <div className="empty-cart">
                      <p>Giỏ hàng trống</p>
                    </div>
                  ) : (
                    cart.items.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="item-image">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="item-details">
                          <h5>{item.name}</h5>
                          <p>Số lượng: {item.quantity}</p>
                          <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                        <button className="remove-item" onClick={() => handleRemoveCartItem(item.id)}>
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {cart?.items && cart.items.length > 0 && (
                  <div className="dropdown-footer">
                    <div className="total-price">Tổng: {formatPrice(cart.total || 0)}</div>
                    <div className="cart-actions">
                      <Link to="/cart" className="view-cart-btn" onClick={() => dispatch(setCartOpen(false))}>
                        Xem giỏ hàng
                      </Link>
                      <Link to="/checkout" className="checkout-btn" onClick={() => dispatch(setCartOpen(false))}>
                        Thanh toán
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Profile / Login Button */}
            {user ? (
              <Link to="/profile" className="user-pill" title={`${user.firstName} ${user.lastName}`}>
              <div className="user-avatar" aria-hidden>
                  {(user?.firstName?.[0] || 'U').toUpperCase()}
              </div>
              <span className="user-name">
                  {user.firstName} {user.lastName}
              </span>
            </Link>
            ) : (
              <>
                        <Link to="/auth/login" className="login-btn">
                          Đăng nhập
                        </Link>
                <Link to="/booking" className="start-booking-btn">
                  Đặt chỗ ngay
                </Link>
              </>
            )}

          </div>
        </div>
      </div>

    </header>
    </>
  )
}


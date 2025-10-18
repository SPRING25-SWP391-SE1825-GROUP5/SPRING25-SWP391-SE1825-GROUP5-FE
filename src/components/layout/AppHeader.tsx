import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  ShoppingCart,
  User,
  Bell,
  Download,
  Wrench,
  Package,
  Gift,
  Layers,
  Phone,
  Settings,
  Zap,
  Brain,
  Calendar,
  LogOut,
  UserCircle
} from 'lucide-react'
import NavigationDropdown, { type MenuItem } from './NavigationDropdown'
import logo from '@/assets/images/logo-black.webp'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout, syncFromLocalStorage } from '@/store/authSlice'
import toast from 'react-hot-toast'

const NewAppHeader: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)

  // Sync localStorage on mount
  useEffect(() => {
    dispatch(syncFromLocalStorage())
  }, [dispatch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-dropdown-container') && !target.closest('.notification-dropdown-container')) {
        setShowUserDropdown(false)
        setShowNotificationDropdown(false)
      }
    }

    if (showUserDropdown || showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserDropdown, showNotificationDropdown])

  const handleUserDropdownToggle = () => {
    setShowUserDropdown(!showUserDropdown)
    setShowNotificationDropdown(false) // Close notification dropdown
  }

  const handleNotificationDropdownToggle = () => {
    setShowNotificationDropdown(!showNotificationDropdown)
    setShowUserDropdown(false) // Close user dropdown
  }

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Đăng xuất thành công!')
    navigate('/')
    setShowUserDropdown(false)
  }

  const handleProfileClick = () => {
    navigate('/profile')
    setShowUserDropdown(false)
  }

  const menuItems: MenuItem[] = [
    {
      id: 'services',
      label: 'Dịch vụ',
      href: '/services',
      dropdown: {
        type: 'mega',
        width: 'lg',
        align: 'left',
        sections: [
          {
            id: 'maintenance',
            title: 'Bảo dưỡng định kỳ',
            items: [
              {
                id: 'basic-maintenance',
                label: 'Bảo dưỡng cơ bản',
                href: '/services',
                icon: <Wrench size={16} />,
                description: 'Kiểm tra và bảo dưỡng cơ bản cho xe điện'
              },
              {
                id: 'advanced-maintenance',
                label: 'Bảo dưỡng nâng cao',
                href: '/services',
                icon: <Settings size={16} />,
                description: 'Bảo dưỡng chuyên sâu với công nghệ hiện đại'
              },
              {
                id: 'premium-maintenance',
                label: 'Bảo dưỡng cao cấp',
                href: '/services',
                icon: <Zap size={16} />,
                description: 'Dịch vụ cao cấp với AI diagnostics'
              }
            ]
          },
          {
            id: 'ai-features',
            title: 'AI Features',
            items: [
              {
                id: 'ai-diagnostics',
                label: 'Chẩn đoán AI',
                href: '/services',
                icon: <Brain size={16} />,
                description: 'Chẩn đoán thông minh với công nghệ AI'
              },
              {
                id: 'predictive',
                label: 'Dự đoán hỏng hóc',
                href: '/services',
                icon: <Brain size={16} />,
                description: 'Dự đoán và phòng ngừa sự cố'
              }
            ]
          },
          {
            id: 'management',
            title: 'Management Tools',
            items: [
              {
                id: 'tracking',
                label: 'Theo dõi tiến độ',
                href: '/services',
                icon: <Calendar size={16} />,
                description: 'Theo dõi tiến trình bảo dưỡng'
              },
              {
                id: 'schedule',
                label: 'Quản lý lịch',
                href: '/booking',
                icon: <Calendar size={16} />,
                description: 'Đặt lịch và quản lý appointment'
              }
            ]
          }
        ]
      }
    },
    {
      id: 'products',
      label: 'Sản phẩm',
      href: '/products',
      dropdown: {
        type: 'mega',
        width: 'md',
        align: 'left',
        sections: [
          {
            id: 'parts',
            title: 'Phụ tùng chính',
            items: [
              {
                id: 'battery',
                label: 'Pin & Bộ sạc',
                href: '/products',
                icon: <Zap size={16} />,
                description: 'Pin lithium-ion cao cấp'
              },
              {
                id: 'motor',
                label: 'Động cơ điện',
                href: '/products',
                icon: <Settings size={16} />,
                description: 'Động cơ hiệu suất cao'
              }
            ]
          },
          {
            id: 'accessories',
            title: 'Phụ kiện',
            items: [
              {
                id: 'cables',
                label: 'Cáp sạc',
                href: '/products',
                icon: <Package size={16} />
              },
              {
                id: 'tools',
                label: 'Dụng cụ',
                href: '/products',
                icon: <Wrench size={16} />
              }
            ]
          }
        ]
      }
    },
    {
      id: 'promotions',
      label: 'Ưu đãi',
      href: '/promotions',
      dropdown: {
        type: 'simple',
        width: 'sm',
        align: 'left',
        sections: [
          {
            id: 'current-promotions',
            title: 'Khuyến mãi hiện tại',
            items: [
              {
                id: 'flash-sale',
                label: 'Flash Sale',
                href: '/promotions',
                icon: <Gift size={16} />
              },
              {
                id: 'vip-member',
                label: 'Thành viên VIP',
                href: '/promotions',
                icon: <User size={16} />
              },
              {
                id: 'seasonal',
                label: 'Ưu đãi mùa',
                href: '/promotions',
                icon: <Gift size={16} />
              }
            ]
          }
        ]
      }
    },
    {
      id: 'packages',
      label: 'Gói dịch vụ',
      href: '/packages',
      dropdown: {
        type: 'simple',
        width: 'sm',
        align: 'left',
        sections: [
          {
            id: 'service-packages',
            title: 'Gói dịch vụ',
            items: [
              {
                id: 'basic-package',
                label: 'Gói cơ bản',
                href: '/packages',
                icon: <Layers size={16} />
              },
              {
                id: 'standard-package',
                label: 'Gói tiêu chuẩn',
                href: '/packages',
                icon: <Layers size={16} />
              },
              {
                id: 'premium-package',
                label: 'Gói cao cấp',
                href: '/packages',
                icon: <Layers size={16} />
              }
            ]
          }
        ]
      }
    },
    {
      id: 'contact',
      label: 'Liên hệ',
      href: '/contact',
      icon: <Phone size={16} />
    }
  ]

  const rightItems = (
    <>
      {/* Download App Section */}
      <div className="download-app-section">
        <Download size={20} className="download-icon" />
        <div className="download-text">
          <span className="download-label">Tải ứng dụng</span>
          <span className="download-brand">EV Service</span>
        </div>
      </div>

      {/* Notification Bell */}
      <div className="notification-dropdown-container">
        <button 
          className="header-icon-btn"
          aria-label="Notifications"
          onClick={handleNotificationDropdownToggle}
        >
          <Bell size={20} />
          <span className="notification-badge">2</span>
        </button>
        
        {showNotificationDropdown && (
          <div className="notification-dropdown">
            <div className="notification-dropdown__header">
              <h3 className="notification-title">Thông báo</h3>
            </div>
            
            <div className="notification-dropdown__content">
              <div className="no-notifications">
                <p>Không có thông báo nào</p>
              </div>
            </div>
            
            <div className="notification-dropdown__footer">
              <button className="view-all-btn">
                Xem toàn bộ
              </button>
            </div>
          </div>
        )}
      </div>
            
      <NavLink
        to="/cart"
        className="header-icon-btn" 
        aria-label="Shopping cart"
      >
        <ShoppingCart size={20} />
        <span className="cart-badge">3</span>
      </NavLink>

      {user ? (
        <>
          <div className="user-dropdown-container">
            <button
              className="header-icon-btn"
              aria-label="User profile"
              title={user.fullName}
              onClick={handleUserDropdownToggle}
            >
              <User size={20} />
            </button>
            
            {showUserDropdown && (
              <div className="user-dropdown">
                <div className="user-dropdown__header">
                  <div className="user-info">
                    <span className="user-name">{user.fullName}</span>
                  </div>
                </div>
                
                <div className="user-dropdown__menu">
                  <button 
                    className="dropdown-item"
                    onClick={handleProfileClick}
                  >
                    <UserCircle size={16} />
                    <span>Tài khoản</span>
                  </button>
                  
                  <button 
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Thoát</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <NavLink
            to="/auth/login"
            className="login-btn hide-mobile"
          >
            Đăng nhập
          </NavLink>
          <NavLink
            to="/booking"
            className="booking-btn"
          >
            Đặt chỗ ngay
          </NavLink>
        </>
      )}
    </>
  )

  return (
    <>
      <NavigationDropdown
        menuItems={menuItems}
        logo={{
          src: logo,
          alt: 'EV Service Logo',
          href: '/'
        }}
        rightItems={rightItems}
        className="modern-header"
        transitionDuration={300}
        mobileBreakpoint={1024}
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={setShowMobileMenu}
        headerHeight="57px"
        dropdownShadow="0 8px 30px rgba(0, 0, 0, 0.12)"
        hoverColor="#e3f2fd"
        activeColor="#1976d2"
      />
      
      {/* Custom styles for RoPhim-style header */}
      <style>{`
        /* Download App Section */
        .download-app-section {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #1e293b;
          font-family: 'Poppins', sans-serif;
          transition: all 300ms ease;
          height: 40px;
        }
        
        .download-app-section:hover {
          background: rgba(16, 185, 129, 0.1);
          border-color: #10b981;
          color: #10b981;
        }
        
        .download-icon {
          color: #10b981;
        }
        
        .download-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        
        .download-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 400;
        }
        
        .download-brand {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }
        
        /* Header Icons */
        .header-icon-btn {
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 40px !important;
          height: 40px !important;
          border: 1px solid #e2e8f0 !important;
          background: white !important;
          color: #1e293b !important;
          text-decoration: none !important;
          border-radius: 50% !important;
          transition: all 300ms ease !important;
          font-family: 'Poppins', sans-serif !important;
        }
        
        .header-icon-btn:hover {
          background: rgba(16, 185, 129, 0.1) !important;
          border-color: #10b981 !important;
          color: #10b981 !important;
          transform: translateY(-1px);
        }
        
        .cart-badge, .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
          line-height: 1;
          font-family: 'Poppins', sans-serif;
        }
        
        .notification-badge {
          background: #10b981;
        }
        
        /* Buttons */
        .login-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
          text-decoration: none;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          transition: all 300ms ease;
          white-space: nowrap;
          background: white;
          font-family: 'Poppins', sans-serif;
        }
        
        .login-btn:hover {
          color: #10b981;
          background: rgba(16, 185, 129, 0.05);
          border-color: #10b981;
          transform: translateY(-1px);
        }
        
        .booking-btn {
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          text-decoration: none;
          background: linear-gradient(90deg, #10b981, #059669);
          border: none;
          border-radius: 8px;
          transition: all 300ms ease;
          white-space: nowrap;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Poppins', sans-serif;
        }
        
        .booking-btn:hover {
          background: linear-gradient(90deg, #059669, #047857);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        /* Brand Info */
        .logo-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }
        
        .brand-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        
        .brand-tagline {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
          font-weight: 400;
          font-family: 'Poppins', sans-serif;
        }
        
        /* User Dropdown */
        .user-dropdown-container {
          position: relative;
        }
        
        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          z-index: 1000;
          overflow: hidden;
        }
        
        .user-dropdown__header {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        
        .user-dropdown__menu {
          padding: 8px 0;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 20px;
          background: none;
          border: none;
          color: #1e293b;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: all 200ms ease;
          text-align: left;
        }
        
        .dropdown-item:hover {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        
        .dropdown-item.logout:hover svg {
          color: #ef4444;
        }
        
        .dropdown-item svg {
          color: #64748b;
          transition: color 200ms ease;
        }
        
        .dropdown-item:hover svg {
          color: #10b981;
        }
        
        /* Notification Dropdown */
        .notification-dropdown-container {
          position: relative;
        }
        
        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          min-width: 280px;
          max-width: 320px;
          z-index: 1000;
          overflow: hidden;
        }
        
        .notification-dropdown__header {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .notification-title {
          color: #1e293b;
          font-size: 16px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          margin: 0;
        }
        
        .notification-dropdown__content {
          padding: 20px;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .no-notifications {
          text-align: center;
        }
        
        .no-notifications p {
          color: #64748b;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
          margin: 0;
        }
        
        .notification-dropdown__footer {
          padding: 12px 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        
        .view-all-btn {
          background: none;
          border: none;
          color: #10b981;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: color 200ms ease;
          padding: 8px 16px;
          width: 100%;
        }
        
        
        .notification-dropdown__footer:hover {
          background: rgba(16, 185, 129, 0.1);
        }
        
        @media (max-width: 1023px) {
          .hide-mobile {
            display: none !important;
          }
          
          .download-app-section {
            display: none;
          }
        }
        
        @media (max-width: 768px) {
          .header-icon-btn {
            width: 40px;
            height: 40px;
          }
          
          .login-btn, .booking-btn {
            padding: 0.375rem 0.75rem;
            font-size: 0.8rem;
          }
          
          .brand-name {
            font-size: 1rem;
          }
          
          .brand-tagline {
            font-size: 0.7rem;
          }
          
          .user-dropdown {
            right: -10px;
            min-width: 180px;
          }
          
          .notification-dropdown {
            right: -10px;
            min-width: 260px;
            max-width: 280px;
          }
        }
      `}</style>
    </>
  )
}

export default NewAppHeader


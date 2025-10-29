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
  UserCircle,
  ChevronDown
} from 'lucide-react'
import NotificationBell from '@/components/common/NotificationBell'
import NavigationDropdown, { type MenuItem } from './NavigationDropdown'
import logo from '@/assets/images/logo-black.webp'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout, syncFromLocalStorage } from '@/store/authSlice'
import { AuthService } from '@/services'
import toast from 'react-hot-toast'

const NewAppHeader: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)

  // Sync localStorage on mount
  useEffect(() => {
    console.log('AppHeader: Syncing from localStorage...')
    dispatch(syncFromLocalStorage())
  }, [dispatch])

  // Debug user state
  useEffect(() => {
    console.log('AppHeader: User state changed:', user)
    console.log('AppHeader: localStorage token:', localStorage.getItem('authToken') || localStorage.getItem('token'))
    console.log('AppHeader: localStorage user:', localStorage.getItem('user'))
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false)
      }
    }

      document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      // Try to call API logout first (may fail if token expired)
      try {
        await AuthService.logout()
      } catch (apiError) {
        console.log('API logout failed (token may be expired):', apiError)
        // Continue with local logout even if API fails
      }
      
      // Always clear local state
      dispatch(logout())
      toast.success('Đăng xuất thành công!')
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Force clear local state even if everything fails
    dispatch(logout())
    toast.success('Đăng xuất thành công!')
    navigate('/')
  }
  }

  // Menu items
  const menuItems: MenuItem[] = [
    {
      id: 'services',
      label: 'Dịch vụ',
      // dropdown sẽ được gắn động theo API trong NavigationDropdown thông qua menuItems
    },
    {
      id: 'products',
      label: 'Sản phẩm',
      href: '/products',
      dropdown: {
        type: 'mega',
        width: 'md',
        sections: [
          {
            id: 'main-parts',
            title: 'Phụ tùng chính',
            items: [
              {
                id: 'battery-charger',
                label: 'Pin & Bộ sạc',
                href: '/products',
                icon: <Zap size={16} />,
                description: 'Pin lithium-ion cao cấp'
              },
              {
                id: 'electric-motor',
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
                id: 'charging-cable',
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
    },
    {
      id: 'contact',
      label: 'Liên hệ',
      href: '/contact',
      icon: <Phone size={16} />
    }
  ]

  // Right items (icons and buttons)
  const rightItems = (
    <>
      {/* Download App Section - removed as requested */}

      {/* Notification Bell - Only show when logged in */}
      {user && (
        <NotificationBell />
      )}
            
      {/* Shopping Cart - Only show when logged in */}
      {user && (
      <NavLink
        to="/cart"
        className="header-icon-btn" 
        aria-label="Shopping cart"
      >
        <ShoppingCart size={20} />
        <span className="cart-badge">3</span>
      </NavLink>
      )}

      {/* Login/User Section */}
      {user ? (
          <div className="user-dropdown-container">
            <button
              className="header-icon-btn"
            onMouseEnter={() => setShowUserDropdown(true)}
            onMouseLeave={() => setShowUserDropdown(false)}
            aria-label="User menu"
          >
            <UserCircle size={20} />
            </button>
            
          <div 
            className={`dropdown ${showUserDropdown ? 'active' : ''}`}
            onMouseEnter={() => setShowUserDropdown(true)}
            onMouseLeave={() => setShowUserDropdown(false)}
          >
            <div className="dropdown-simple-content">
              {/* Show user full name on hover */}
              {user?.fullName && (
                <div className="dropdown-item">
                  <div className="dropdown-link" style={{ cursor: 'default' }}>
                    <User size={16} />
                    <span className="dropdown-label">{user.fullName}</span>
                  </div>
                </div>
              )}
              <div className="dropdown-item">
                <NavLink to="/profile" className="dropdown-link">
                  <User size={16} />
                  <span className="dropdown-label">Hồ sơ</span>
                </NavLink>
                  </div>
              <div className="dropdown-item">
                  <button 
                  className="dropdown-link dropdown-link--logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                  <span className="dropdown-label">Đăng xuất</span>
                  </button>
                </div>
              </div>
          </div>
        </div>
      ) : (
          <NavLink
            to="/auth/login"
            className="login-btn"
          >
            Đăng nhập
          </NavLink>
      )}

      {/* Booking Button - Only show when not logged in */}
      {!user && (
          <NavLink
            to="/booking"
            className="booking-btn"
          >
            Đặt chỗ ngay
          </NavLink>
      )}
    </>
  )

  return (
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
      headerHeight="64px"
        dropdownShadow="0 8px 30px rgba(0, 0, 0, 0.12)"
      hoverColor="rgba(16, 185, 129, 0.1)"
      activeColor="#10b981"
    />
  )
}

export default NewAppHeader
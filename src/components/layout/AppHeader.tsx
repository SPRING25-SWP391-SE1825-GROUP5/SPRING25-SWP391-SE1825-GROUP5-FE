import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  ShoppingCart,
  User,
  Search,
  Wrench,
  Package,
  Gift,
  Layers,
  Phone,
  Settings,
  Zap,
  Brain,
  Calendar
} from 'lucide-react'
import NavigationDropdown, { type MenuItem } from './NavigationDropdown'
import logo from '@/assets/images/logo-black.webp'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout, syncFromLocalStorage } from '@/store/authSlice'
import toast from 'react-hot-toast'

const NewAppHeader: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)

  // Sync localStorage on mount
  useEffect(() => {
    dispatch(syncFromLocalStorage())
  }, [dispatch])

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
                icon: <Search size={16} />,
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
                <button 
        className="header-icon-btn hide-mobile"
        aria-label="Search"
                >
        <Search size={20} />
                </button>
            
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
          <NavLink
            to="/profile"
            className="header-icon-btn"
            aria-label="User profile"
            title={user.fullName}
          >
            <User size={20} />
          </NavLink>
                <button
            className="login-btn hide-mobile"
                  onClick={() => {
                    dispatch(logout())
                    toast.success('Đã đăng xuất')
                    navigate('/')
                  }}
                >
                  Đăng xuất
                </button>
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
      
      {/* Custom styles for right items */}
      <style>{`
        .header-icon-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          background: none;
          color: #333;
          text-decoration: none;
          border-radius: 6px;
          transition: all 300ms ease;
        }
        
        .header-icon-btn:hover {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .cart-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ff4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.125rem 0.25rem;
          border-radius: 8px;
          min-width: 16px;
          text-align: center;
          line-height: 1;
        }
        
        .login-btn {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #333;
          text-decoration: none;
          border: none;
          border-radius: 6px;
          transition: all 300ms ease;
          white-space: nowrap;
        }
        
        .login-btn:hover {
          color: #1976d2;
          background: #e3f2fd;
        }
        
        .booking-btn {
          padding: 0 1.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
          text-decoration: none;
          background: #000000;
          border: none;
          border-radius: 0;
          transition: background-color 300ms ease;
          white-space: nowrap;
          height: 57px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .booking-btn:hover {
          background: #333333;
        }
        
        @media (max-width: 1023px) {
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}

export default NewAppHeader


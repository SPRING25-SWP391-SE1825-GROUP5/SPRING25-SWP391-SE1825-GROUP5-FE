import React, { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import EmailVerificationBanner from '@/components/common/EmailVerificationBanner'
import { useAppSelector } from '@/store/hooks'
import './NavigationDropdown.scss'

// Types for dropdown content
export interface DropdownItem {
  id: string
  label: string
  href?: string
  icon?: React.ReactNode
  description?: string
  onClick?: () => void
}

export interface DropdownSection {
  id: string
  title: string
  items: DropdownItem[]
}

export interface DropdownContent {
  type: 'simple' | 'mega' | 'custom'
  sections?: DropdownSection[]
  customContent?: React.ReactNode
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  align?: 'left' | 'center' | 'right'
}

export interface MenuItem {
  id: string
  label: string
  href?: string
  dropdown?: DropdownContent
  icon?: React.ReactNode
  badge?: string | number
}

interface HeaderDropdownProps {
  menuItems: MenuItem[]
  logo?: {
    src: string
    alt: string
    href?: string
  }
  rightItems?: React.ReactNode
  className?: string
  transitionDuration?: number
  mobileBreakpoint?: number
  showMobileMenu?: boolean
  onMobileMenuToggle?: (isOpen: boolean) => void
  // Styling options
  headerHeight?: string
  dropdownShadow?: string
  hoverColor?: string
  activeColor?: string
}

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({
  menuItems,
  logo,
  rightItems,
  className = '',
  transitionDuration = 300,
  mobileBreakpoint = 1024,
  showMobileMenu = false,
  onMobileMenuToggle,
  headerHeight = '57px',
  dropdownShadow = '0 8px 30px rgba(0, 0, 0, 0.12)',
  hoverColor = '#e3f2fd',
  activeColor = '#1976d2'
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const headerRef = useRef<HTMLElement>(null)
  const user = useAppSelector((s) => s.auth.user)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mobileBreakpoint])

  const handleMouseEnter = (itemId: string) => {
    if (isMobile) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setActiveDropdown(itemId)
  }

  const handleMouseLeave = () => {
    if (isMobile) return
    
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 100)
  }

  const handleMobileMenuToggle = () => {
    const newState = !showMobileMenu
    onMobileMenuToggle?.(newState)
  }

  const getDropdownWidth = (width?: string) => {
    switch (width) {
      case 'sm': return '320px'
      case 'md': return '480px'
      case 'lg': return '640px'
      case 'xl': return '800px'
      case 'full': return '100vw'
      default: return 'auto'
    }
  }

  const getDropdownPosition = (align?: string, width?: string) => {
    switch (align) {
      case 'right': return { right: 0 }
      case 'center': return { 
        left: '50%', 
        transform: 'translateX(-50%)',
        ...(width === 'full' && { left: 0, transform: 'none' })
      }
      default: return { left: 0 }
    }
  }

  const renderDropdownContent = (dropdown: DropdownContent) => {
    if (dropdown.type === 'custom' && dropdown.customContent) {
      return dropdown.customContent
    }

    if (dropdown.type === 'mega' && dropdown.sections) {
      return (
        <div className="dropdown-mega-content">
          {dropdown.sections.map(section => (
            <div key={section.id} className="dropdown-section">
              <h4 className="dropdown-section-title">{section.title}</h4>
              <div className="dropdown-section-items">
                {section.items.map(item => (
                  <div key={item.id} className="dropdown-item">
                    {item.href ? (
                      <NavLink 
                        to={item.href} 
                        className="dropdown-link"
                        onClick={() => setActiveDropdown(null)}
                      >
                        {item.icon && <span className="dropdown-icon">{item.icon}</span>}
                        <div className="dropdown-content">
                          <span className="dropdown-label">{item.label}</span>
                          {item.description && (
                            <span className="dropdown-description">{item.description}</span>
                          )}
                        </div>
                      </NavLink>
                    ) : (
                      <button 
                        className="dropdown-button"
                        onClick={() => {
                          item.onClick?.()
                          setActiveDropdown(null)
                        }}
                      >
                        {item.icon && <span className="dropdown-icon">{item.icon}</span>}
                        <div className="dropdown-content">
                          <span className="dropdown-label">{item.label}</span>
                          {item.description && (
                            <span className="dropdown-description">{item.description}</span>
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Simple dropdown
    if (dropdown.sections?.[0]) {
      const section = dropdown.sections[0]
      return (
        <div className="dropdown-simple-content">
          {section.items.map(item => (
            <div key={item.id} className="dropdown-item">
              {item.href ? (
                <NavLink 
                  to={item.href} 
                  className="dropdown-link"
                  onClick={() => setActiveDropdown(null)}
                >
                  {item.icon && <span className="dropdown-icon">{item.icon}</span>}
                  <span className="dropdown-label">{item.label}</span>
                </NavLink>
              ) : (
                <button 
                  className="dropdown-button"
                  onClick={() => {
                    item.onClick?.()
                    setActiveDropdown(null)
                  }}
                >
                  {item.icon && <span className="dropdown-icon">{item.icon}</span>}
                  <span className="dropdown-label">{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  // Debug logs
  console.log('NavigationDropdown - user:', user)
  console.log('NavigationDropdown - emailVerified:', user?.emailVerified)

  const hasEmailBanner = user && !user.emailVerified

  return (
    <>
      {hasEmailBanner && <EmailVerificationBanner />}
      <header 
        ref={headerRef}
        className={`header-dropdown ${hasEmailBanner ? 'has-email-banner' : ''} ${className}`}
        style={{ 
          '--header-height': headerHeight,
          '--transition-duration': `${transitionDuration}ms`,
          '--dropdown-shadow': dropdownShadow,
          '--hover-color': hoverColor,
          '--active-color': activeColor
        } as React.CSSProperties}
        role="banner"
      >
        <div className="header-dropdown__container">
          {/* Logo Section */}
          <div className="header-logo-section">
        {logo && (
          <div className="header-logo">
            {logo.href ? (
              <NavLink to={logo.href} aria-label="Go to homepage">
                <img src={logo.src} alt={logo.alt} />
              </NavLink>
            ) : (
              <img src={logo.src} alt={logo.alt} />
            )}
          </div>
        )}
      </div>

      {/* Menu Section */}
      <div className="header-menu-section">
        <nav className="header-nav desktop-nav" role="navigation" aria-label="Main navigation">
          <ul className="nav-list">
            {menuItems.map(item => (
              <li 
                key={item.id}
                className="nav-item"
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                {item.href ? (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) => 
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    aria-expanded={activeDropdown === item.id ? 'true' : 'false'}
                    aria-haspopup={item.dropdown ? 'true' : 'false'}
                  >
                    {item.icon && <span className="nav-icon">{item.icon}</span>}
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge" aria-label={`${item.badge} items`}>
                        {item.badge}
                      </span>
                    )}
                    {item.dropdown && <ChevronDown className="nav-arrow" />}
                  </NavLink>
                ) : (
                  <button
                    className="nav-button"
                    aria-expanded={activeDropdown === item.id ? 'true' : 'false'}
                    aria-haspopup={item.dropdown ? 'true' : 'false'}
                  >
                    {item.icon && <span className="nav-icon">{item.icon}</span>}
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge" aria-label={`${item.badge} items`}>
                        {item.badge}
                      </span>
                    )}
                    {item.dropdown && <ChevronDown className="nav-arrow" />}
                  </button>
                )}

                {/* Dropdown */}
                {item.dropdown && (
                  <div 
                    className={`dropdown ${activeDropdown === item.id ? 'active' : ''} ${item.dropdown.type}`}
                    style={{
                      width: getDropdownWidth(item.dropdown.width),
                      ...getDropdownPosition(item.dropdown.align, item.dropdown.width)
                    }}
                    role="menu"
                    aria-labelledby={`nav-${item.id}`}
                  >
                    {renderDropdownContent(item.dropdown)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Right Items Section */}
      <div className="header-right-section">
        {rightItems && (
          <div className="header-right">
            {rightItems}
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={handleMobileMenuToggle}
          aria-expanded={showMobileMenu ? 'true' : 'false'}
          aria-label="Toggle mobile menu"
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav 
        className={`header-nav mobile-nav ${showMobileMenu ? 'active' : ''}`}
        role="navigation" 
        aria-label="Mobile navigation"
        aria-hidden={!showMobileMenu}
      >
        <ul className="nav-list">
          {menuItems.map(item => (
            <li key={item.id} className="nav-item">
              {item.href ? (
                <NavLink
                  to={item.href}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => onMobileMenuToggle?.(false)}
                >
                  {item.icon && <span className="nav-icon">{item.icon}</span>}
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              ) : (
                <button className="nav-button">
                  {item.icon && <span className="nav-icon">{item.icon}</span>}
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </button>
              )}
              
              {/* Mobile dropdown items */}
              {item.dropdown?.sections?.map(section => 
                section.items.map(dropdownItem => (
                  <div key={dropdownItem.id} className="mobile-dropdown-item">
                    {dropdownItem.href ? (
                      <NavLink
                        to={dropdownItem.href}
                        className="mobile-dropdown-link"
                        onClick={() => onMobileMenuToggle?.(false)}
                      >
                        {dropdownItem.icon && <span className="dropdown-icon">{dropdownItem.icon}</span>}
                        <span className="dropdown-label">{dropdownItem.label}</span>
                      </NavLink>
                    ) : (
                      <button
                        className="mobile-dropdown-button"
                        onClick={() => {
                          dropdownItem.onClick?.()
                          onMobileMenuToggle?.(false)
                        }}
                      >
                        {dropdownItem.icon && <span className="dropdown-icon">{dropdownItem.icon}</span>}
                        <span className="dropdown-label">{dropdownItem.label}</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </li>
          ))}
        </ul>
      </nav>
        </div>
    </header>
    </>
  )
}

export default HeaderDropdown


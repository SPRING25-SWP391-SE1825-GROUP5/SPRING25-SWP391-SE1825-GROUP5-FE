import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logo from '@/assets/images/EVN-Tragop-0D.jpg'
import './AppHeader.scss'
import { useAppSelector } from '@/store/hooks'

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = useAppSelector((state) => state.auth.user)

  return (
    <header id="header" className="modern-header">
      <div className="header-container">
        <div className="header-content">
          {/* Logo */}
          <div className="logo-section">
            <Link to="/" className="logo-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="logo-wrapper">
                <img src={logo} className="logo-image" alt="EV Service Hub" />
                <div className="logo-text">
                  <h1 className="brand-name">EV Service</h1>
                  <span className="brand-tagline">Professional Care</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Section: Only Hamburger + Avatar + Username */}
          <div className="right-section">
            <Link to={user ? '/profile' : '/login'} className="user-pill" title={user ? `${user.firstName} ${user.lastName}` : 'Đăng nhập'}>
              <div className="user-avatar" aria-hidden>
                {(user?.firstName?.[0] || 'K').toUpperCase()}
              </div>
              <span className="user-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Khách'}
              </span>
            </Link>

            {/* Hamburger */}
            <div className="hamburger-container">
              <button
                className={`hamburger-btn modern-hamburger ${mobileMenuOpen ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label="Toggle menu"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Mobile */}
      {mobileMenuOpen && (
        <div className="modern-sidebar-overlay" onClick={() => setMobileMenuOpen(false)}>
          <aside className="modern-sidebar" onClick={e => e.stopPropagation()}>
            <div className="sidebar-header">
              <div className="sidebar-logo">
                <img src={logo} className="sidebar-logo-img" alt="EV Service" />
                <div className="sidebar-brand">
                  <h3 className="sidebar-brand-name">EV Service</h3>
                  <span className="sidebar-brand-tagline">Professional Care</span>
                </div>
              </div>
              <button className="sidebar-close-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>

            <nav className="sidebar-nav">
              <div className="nav-section">
                <div className="nav-section-title">Điều hướng chính</div>
                <NavLink to="/" className="sidebar-nav-item" onClick={() => setMobileMenuOpen(false)}>Trang chủ</NavLink>
                <NavLink to="/booking" className="sidebar-nav-item" onClick={() => setMobileMenuOpen(false)}>Đặt lịch bảo dưỡng</NavLink>
                <NavLink to="/services" className="sidebar-nav-item" onClick={() => setMobileMenuOpen(false)}>Dịch vụ</NavLink>
                <NavLink to="/about" className="sidebar-nav-item" onClick={() => setMobileMenuOpen(false)}>Về chúng tôi</NavLink>
              </div>
            </nav>

            <div className="sidebar-footer">
              {!user && (
                <div className="sidebar-auth-section">
                  <NavLink to="/login" className="sidebar-auth-btn primary" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</NavLink>
                  <NavLink to="/register" className="sidebar-auth-btn secondary" onClick={() => setMobileMenuOpen(false)}>Đăng ký</NavLink>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}


import { NavLink, Link } from 'react-router-dom'
import logo from '@/assets/images/photo-1-1638274363739461323011-1638276946612-1638276947297252976460.webp'
import './PublicHeader.scss'

export default function PublicHeader() {
  return (
    <header className="public-header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to="/" className="logo-link">
              <img src={logo} alt="EV Service" className="logo-image" />
              <span className="logo-text">EV Service</span>
            </Link>
          </div>

          <nav className="nav-menu">
            <NavLink to="/" className="nav-link">Trang Chủ</NavLink>
            <NavLink to="/about" className="nav-link">Về Chúng Tôi</NavLink>
            <NavLink to="/services" className="nav-link">Dịch Vụ</NavLink>
            <NavLink to="/contact" className="nav-link">Liên Hệ</NavLink>
          </nav>

          <div className="auth-buttons">
            <NavLink to="/auth/login" className="btn-login">Đăng Nhập</NavLink>
          </div>
        </div>
      </div>
    </header>
  )
}


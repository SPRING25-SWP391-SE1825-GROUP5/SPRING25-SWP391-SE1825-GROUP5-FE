import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import logoImage from '@/assets/images/10.webp'
import './NotFound.scss'

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="error-code">
            <span className="error-digit">4</span>
            <img
              src={logoImage}
              alt="0"
              className="error-logo"
            />
            <span className="error-digit">4</span>
          </div>
          <h1 className="not-found-title">Trang không tìm thấy</h1>
          <p className="not-found-description">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn-home">
              <Home size={18} />
              Về trang chủ
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-back"
            >
              <ArrowLeft size={18} />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Zap, Phone, Mail } from 'lucide-react'
import './Footer.scss'

const Footer = () => {
  return (
    <div className="page-footer">
      <div className="footer-content">
        <div className="footer-logo">
          <div className="logo-icon">
            <Zap size={16} />
          </div>
          <span className="logo-text">EV Service Center</span>
        </div>
        <div className="footer-info">
          <p className="company-name">Công ty TNHH Dịch vụ Bảo dưỡng Xe Điện</p>
          <p className="business-reg">MST: 0123456789 do Sở KHĐT TP Hà Nội cấp</p>
          <p className="address">Địa chỉ: Số 123, Đường ABC, Quận XYZ, TP Hà Nội</p>
        </div>
        <div className="footer-links">
          <div className="link-section">
            <h4>Về chúng tôi</h4>
            <a href="#">Giới thiệu</a>
            <a href="#">Tin tức</a>
            <a href="#">Tuyển dụng</a>
          </div>
          <div className="link-section">
            <h4>Dịch vụ</h4>
            <a href="#">Bảo dưỡng</a>
            <a href="#">Sửa chữa</a>
            <a href="#">Phụ tùng</a>
          </div>
        </div>
        <div className="footer-contact">
          <div className="contact-item">
            <Phone size={14} />
            <span>1900 123 456</span>
          </div>
          <div className="contact-item">
            <Mail size={14} />
            <span>support@evservice.com</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Footer

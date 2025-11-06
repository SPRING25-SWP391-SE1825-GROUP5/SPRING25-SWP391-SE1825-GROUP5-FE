import React, { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { useNavigate } from 'react-router-dom'
import ChatInterface from '@/components/chat/ChatInterface'
import './Contact.scss'

/**
 * Utility function để đảm bảo guestSessionId tồn tại
 * Tạo guest session ID nếu chưa có (cho khách chưa đăng nhập)
 */
const ensureGuestSessionId = (): string => {
  if (typeof localStorage === 'undefined') {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  let guestSessionId = localStorage.getItem('guestSessionId')
  if (!guestSessionId) {
    guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('guestSessionId', guestSessionId)
  }
  
  return guestSessionId
}

const ProtectedContact: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const [showLoginBanner, setShowLoginBanner] = useState(true)

  // Đảm bảo guestSessionId tồn tại nếu chưa đăng nhập
  useEffect(() => {
    if (!user) {
      ensureGuestSessionId()
    }
  }, [user])

  // Luôn cho phép hiển thị ChatInterface (cả cho guest và user đã đăng nhập)
  return (
    <div className="contact-page">
      {/* Banner nhắc đăng nhập (chỉ hiển thị cho guest và có thể đóng) */}
      {!user && showLoginBanner && (
        <div className="guest-login-banner">
          <div className="banner-content">
            <div className="banner-icon">💬</div>
            <div className="banner-text">
              <p className="banner-title">Bạn đang chat với tư cách khách</p>
              <p className="banner-description">
                Đăng nhập để lưu lịch sử chat và nhận hỗ trợ tốt hơn
              </p>
            </div>
            <div className="banner-actions">
              <button
                className="banner-login-btn"
                onClick={() => navigate('/auth/login?redirect=' + encodeURIComponent('/contact'))}
              >
                Đăng nhập
              </button>
              <button
                className="banner-close-btn"
                onClick={() => setShowLoginBanner(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ChatInterface luôn được hiển thị */}
      <ChatInterface />

      {/* CSS Styles cho banner */}
      <style>{`
        .guest-login-banner {
          background: linear-gradient(135deg, #4A9782 0%, #004030 100%);
          color: white;
          padding: 1rem 1.5rem;
          margin-bottom: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(74, 151, 130, 0.2);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .banner-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .banner-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .banner-text {
          flex: 1;
        }

        .banner-title {
          font-weight: 600;
          font-size: 0.95rem;
          margin: 0 0 0.25rem 0;
          line-height: 1.4;
        }

        .banner-description {
          font-size: 0.85rem;
          margin: 0;
          opacity: 0.95;
          line-height: 1.4;
        }

        .banner-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .banner-login-btn {
          background: white;
          color: #004030;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .banner-login-btn:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .banner-close-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 1.25rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .banner-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .banner-content {
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .banner-text {
            flex-basis: 100%;
          }

          .banner-actions {
            flex: 1;
            justify-content: flex-end;
          }

          .banner-title,
          .banner-description {
            font-size: 0.8rem;
          }

          .banner-login-btn {
            padding: 0.4rem 0.75rem;
            font-size: 0.8rem;
          }
        }
      `}</style>

    </div>
  )
}

export default ProtectedContact

import React from 'react'
import { useAppSelector } from '@/store/hooks'
import { useNavigate } from 'react-router-dom'
import ChatInterface from '@/components/chat/ChatInterface'
import './Contact.scss'

const ProtectedContact: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user)
  const navigate = useNavigate()

  // Nếu user đã đăng nhập, hiển thị ChatInterface bình thường
  if (user) {
    return (
      <div className="contact-page">
        <ChatInterface />
      </div>
    )
  }

  // Nếu chưa đăng nhập, hiển thị popup thông báo
  return (
    <div className="contact-page">
      {/* Overlay */}
      <div className="login-overlay" onClick={() => navigate('/')}>
        {/* Modal */}
        <div className="login-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>🔒 Yêu cầu đăng nhập</h3>
            <button 
              className="close-btn" 
              onClick={() => navigate('/')}
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
          
          <div className="modal-body">
            <div className="icon-wrapper">
              <div className="lock-icon">🔐</div>
            </div>
            <p className="message">
              Bạn phải đăng nhập để sử dụng tính năng này
            </p>
            <p className="sub-message">
              Đăng nhập để có thể trò chuyện với nhân viên hỗ trợ
            </p>
          </div>
          
          <div className="modal-footer">
            <button 
              className="cancel-btn"
              onClick={() => navigate('/')}
            >
              Hủy
            </button>
            <button 
              className="login-btn"
              onClick={() => navigate('/auth/login?redirect=' + encodeURIComponent('/contact'))}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style>{`
        .login-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
        }

        .login-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          max-width: 400px;
          width: 90%;
          max-height: 90vh;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.5rem 0 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 1rem;

          h3 {
            margin: 0;
            font-family: var(--font-family-primary);
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #9ca3af;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            transition: all 0.2s;
            line-height: 1;

            &:hover {
              background: #f3f4f6;
              color: #6b7280;
            }
          }
        }

        .modal-body {
          padding: 0 1.5rem 1.5rem 1.5rem;
          text-align: center;

          .icon-wrapper {
            margin-bottom: 1rem;

            .lock-icon {
              font-size: 3rem;
              margin: 0 auto;
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #e6f2f0, #cce5e0);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1rem auto;
              box-shadow: 0 4px 12px rgba(74, 151, 130, 0.2);
            }
          }

          .message {
            font-family: var(--font-family-primary);
            font-size: var(--font-size-base);
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
            margin: 0 0 0.5rem 0;
            line-height: var(--line-height-normal);
          }

          .sub-message {
            font-family: var(--font-family-primary);
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            margin: 0;
            line-height: var(--line-height-normal);
          }
        }

        .modal-footer {
          display: flex;
          gap: 0.75rem;
          padding: 0 1.5rem 1.5rem 1.5rem;

          button {
            flex: 1;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-family: var(--font-family-primary);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            cursor: pointer;
            transition: all 0.2s;
            border: none;

            &.cancel-btn {
              background: #f3f4f6;
              color: var(--text-secondary);
              border: 1px solid #e5e7eb;

              &:hover {
                background: #e5e7eb;
                color: var(--text-primary);
              }
            }

            &.login-btn {
              background: linear-gradient(135deg, #4A9782, #004030);
              color: white;
              box-shadow: 0 2px 4px rgba(74, 151, 130, 0.2);

              &:hover {
                background: linear-gradient(135deg, #004030, #4A9782);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(74, 151, 130, 0.3);
              }

              &:active {
                transform: translateY(0);
              }
            }
          }
        }

        /* Responsive */
        @media (max-width: 480px) {
          .login-modal {
            margin: 1rem;
            width: calc(100% - 2rem);
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .modal-footer {
            flex-direction: column;
            gap: 0.5rem;

            button {
              width: 100%;
            }
          }
        }
      `}</style>
    </div>
  )
}

export default ProtectedContact

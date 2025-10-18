import { useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthService } from '@/services/authService'
import { validateGmail } from '@/utils/validation'
import toast from 'react-hot-toast'

export default function ForgotPasswordRequest() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const v = validateGmail(email)
    if (!v.isValid) {
      setError(v.error || 'Email không hợp lệ')
      return
    }
    const loadingId = toast.loading('Đang gửi OTP...')
    setSubmitting(true)
    try {
      await AuthService.requestResetPassword(email)
      setIsSuccess(true)
      toast.success('Đã gửi OTP tới email của bạn')
      setTimeout(() => {
      navigate(`/auth/forgot-password/confirm?email=${encodeURIComponent(email)}`)
      }, 2000)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gửi OTP thất bại'
      toast.error(msg)
      setError(msg)
    } finally {
      setSubmitting(false)
      toast.dismiss(loadingId)
    }
  }, [email, navigate])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'white',
        animation: 'fadeIn 0.3s ease-out'
      }} />

      {/* Modal Container */}
      <div className="modal-container" style={{
        position: 'relative',
        background: 'white',
        borderRadius: '16px',
        width: '1000px',
        height: '550px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        animation: 'slideUp 0.3s ease-out',
        color: '#2d3748',
        display: 'flex'
      }}>
        {/* Left Side - Branding Area (50%) */}
        <div style={{
          width: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {/* Branding Content */}
          <div style={{
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              🔐
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '8px'
            }}>
              Quên mật khẩu?
            </div>
            <div style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.5'
            }}>
              Khôi phục tài khoản của bạn
            </div>
          </div>
        </div>

        {/* Right Side - Form (50%) */}
        <div style={{
          width: '50%',
          padding: '80px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'white',
          position: 'relative'
        }}>
          {/* Close Button */}
          <button 
            onClick={() => navigate('/auth/login')}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#718096',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#2d3748'
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#718096'
              e.currentTarget.style.background = 'none'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Title */}
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#2d3748',
            margin: '0 0 12px 0',
            textAlign: 'center'
          }}>
            Quên mật khẩu
          </h1>
          
          {/* Subtitle */}
          <p style={{
            fontSize: '14px',
            color: '#718096',
            margin: '0 0 24px 0',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            Nếu bạn đã có tài khoản,{' '}
            <Link 
              to="/auth/login" 
              style={{
                color: '#10b981',
                textDecoration: 'none',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#059669'
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#10b981'
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              đăng nhập
            </Link>
          </p>

        {/* Form */}
              <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Email đăng ký"
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: `1.5px solid ${error ? '#e53e3e' : '#e2e8f0'}`,
                borderRadius: '12px',
                background: 'white',
                color: '#2d3748',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                outline: 'none',
                height: '56px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? '#e53e3e' : '#e2e8f0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            {error && (
              <div style={{
                color: '#e53e3e',
                fontSize: '12px',
                marginTop: '8px',
                animation: 'slideDown 0.3s ease-out'
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Success Indicator */}
          {isSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              padding: '12px 16px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#10b981',
                fontWeight: '500',
                fontSize: '14px'
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 10L8.5 12.5L14 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Thành công!</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '2px'
                }}>
                  CLOUDFLARE
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  <a href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>Quyền riêng tư</a>
                  <span style={{ margin: '0 4px' }}>•</span>
                  <a href="/terms" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>Điều khoản</a>
                </div>
              </div>
                </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={submitting || isSuccess}
            style={{
              width: '100%',
              padding: '18px 24px',
              background: submitting || isSuccess ? 'rgba(16, 185, 129, 0.6)' : 'linear-gradient(90deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting || isSuccess ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              height: '56px'
            }}
            onMouseEnter={(e) => {
              if (!submitting && !isSuccess) {
                e.currentTarget.style.background = 'linear-gradient(90deg, #059669, #047857)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting && !isSuccess) {
                e.currentTarget.style.background = 'linear-gradient(90deg, #10b981, #059669)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
          >
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
              </form>
            </div>
          </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 100px;
          }
        }
        
        input::placeholder {
          color: #a0aec0;
        }
        
        @media (max-width: 1000px) {
          .modal-container {
            width: 90% !important;
            max-width: 700px !important;
            height: auto !important;
            flex-direction: column !important;
          }
          
          .modal-container > div:first-child {
            width: 100% !important;
            height: 280px !important;
          }
          
          .modal-container > div:last-child {
            width: 100% !important;
            padding: 50px 40px !important;
          }
        }
        
        @media (max-width: 480px) {
          .modal-container {
            padding: 24px !important;
            margin: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}



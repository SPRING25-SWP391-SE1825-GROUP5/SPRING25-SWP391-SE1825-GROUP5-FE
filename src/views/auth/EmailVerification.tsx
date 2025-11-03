import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthService } from '@/services/authService'
import toast from 'react-hot-toast'
import { Mail, CheckCircle, X, ArrowLeft } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCurrentUser, updateUser } from '@/store/authSlice'
import './EmailVerification.scss'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function EmailVerification() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const query = useQuery()
  const initialEmail = query.get('email') || user?.email || ''
  
  const [email] = useState(initialEmail)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [otpValidated, setOtpValidated] = useState(false)
  const [otpValidating, setOtpValidating] = useState(false)
  const [resending, setResending] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus next input when typing
  const handleOtpChange = (index: number, value: string) => {
    // Chỉ cho phép số
    const numValue = value.replace(/\D/g, '')
    if (numValue.length > 1) return
    
    const newOtpValues = [...otpValues]
    newOtpValues[index] = numValue
    setOtpValues(newOtpValues)
    
    // Move to next input if value is entered
    if (numValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
    
    // Auto-validate when all 6 digits are entered
    const otpCode = newOtpValues.join('')
    if (otpCode.length === 6) {
      validateOtp(otpCode)
    }
  }

  // Handle backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  // Validate OTP with backend
  const validateOtp = async (otpCode: string) => {
    if (!user?.id) {
      toast.error('Vui lòng đăng nhập lại')
      navigate('/auth/login', { replace: true })
      return
    }

    setOtpValidating(true)
    setErrors(prev => ({ ...prev, otpCode: '' }))
    
    try {
      await AuthService.verifyEmail({ userId: user.id, otpCode })
      setOtpValidated(true)
      toast.success('Xác thực email thành công!')
      
      // Immediately update user emailVerified status in state and localStorage
      if (user) {
        dispatch(updateUser({ emailVerified: true }))
        
        // Also sync to localStorage immediately
        if (typeof localStorage !== 'undefined') {
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            const userObj = JSON.parse(storedUser)
            userObj.emailVerified = true
            localStorage.setItem('user', JSON.stringify(userObj))
          }
        }
      }
      
      // Refresh user data from backend to ensure consistency
      await dispatch(getCurrentUser())
      
      // Redirect to home after successful verification
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 1500)
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Mã OTP không đúng. Vui lòng thử lại.'
      setOtpValidated(false)
      setErrors(prev => ({ ...prev, otpCode: errorMsg }))
      toast.error(errorMsg)
    } finally {
      setOtpValidating(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Không tìm thấy email')
      return
    }

    setResending(true)
    try {
      await AuthService.resendVerification(email)
      toast.success('Đã gửi lại mã OTP. Vui lòng kiểm tra email.')
      // Clear OTP inputs
      setOtpValues(['', '', '', '', '', ''])
      setErrors({})
      otpInputRefs.current[0]?.focus()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.'
      toast.error(errorMsg)
    } finally {
      setResending(false)
    }
  }

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const otpCode = otpValues.join('')
    
    if (otpCode.length !== 6) {
      toast.error('Vui lòng nhập đầy đủ 6 chữ số OTP')
      return
    }
    
    if (!otpValidated) {
      await validateOtp(otpCode)
    }
  }, [otpValues, otpValidated, user, navigate, dispatch])

  // Redirect if already verified
  useEffect(() => {
    if (user && user.emailVerified) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  // If not logged in but has email from query, show message to login first
  const needsLogin = !user || !user.id
  
  if (needsLogin) {
    return (
      <div className="email-verification-glass">
        <div className="email-verification-glass__background" />
        <div className="email-verification-glass__card">
          <div className="email-verification-glass__header">
            <h1 className="email-verification-glass__title">Xác thực Email</h1>
            <p className="email-verification-glass__subtitle">
              Vui lòng đăng nhập để xác thực email của bạn.
              {email && (
                <>
                  <br />
                  Email cần xác thực: <strong>{email}</strong>
                </>
              )}
            </p>
          </div>

          <div className="email-verification-glass__form">
            <button 
              className="email-verification-glass__button email-verification-glass__button--submit"
              onClick={() => {
                const redirectUrl = `/auth/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`
                navigate(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`, { replace: true })
              }}
            >
              <Mail size={20} />
              Đăng nhập để xác thực
            </button>

            <button 
              type="button"
              className="email-verification-glass__button email-verification-glass__button--resend"
              onClick={() => navigate('/auth/login')}
            >
              Quay lại trang đăng nhập
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="email-verification-glass">
      {/* Background với Workshop Image */}
      <div className="email-verification-glass__background" />

      {/* Glassmorphism Card */}
      <div className="email-verification-glass__card">
        {/* Header */}
        <div className="email-verification-glass__header">
          <h1 className="email-verification-glass__title">Xác thực Email</h1>
          <p className="email-verification-glass__subtitle">
            Chúng tôi đã gửi mã OTP đến email: <strong>{email}</strong>
            <br />
            Vui lòng nhập mã OTP 6 chữ số để xác thực tài khoản của bạn.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="email-verification-glass__form">
            <div className="email-verification-glass__form-group">
              <label className="email-verification-glass__label">
                Mã OTP
              </label>
              <div className="email-verification-glass__otp-container">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      if (el) otpInputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={`email-verification-glass__otp-input ${otpValidated ? 'email-verification-glass__otp-input--valid' : ''} ${errors.otpCode ? 'email-verification-glass__otp-input--error' : ''} ${otpValidating ? 'email-verification-glass__otp-input--validating' : ''}`}
                    disabled={otpValidating || submitting}
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
              {otpValidating && (
                <div className="email-verification-glass__otp-status email-verification-glass__otp-status--validating">
                  <div className="email-verification-glass__spinner"></div>
                  <span>Đang xác thực...</span>
                </div>
              )}
              {otpValidated && (
                <div className="email-verification-glass__otp-status email-verification-glass__otp-status--success">
                  <CheckCircle size={16} />
                  <span>Mã OTP hợp lệ! Đang chuyển hướng...</span>
                </div>
              )}
              {errors.otpCode && (
                <div className="email-verification-glass__otp-status email-verification-glass__otp-status--error">
                  <X size={16} />
                  <span>{errors.otpCode}</span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="email-verification-glass__button email-verification-glass__button--submit" 
              disabled={submitting || otpValidating || otpValidated}
            >
              {submitting || otpValidating ? (
                <>
                  <div className="email-verification-glass__button-spinner"></div>
                  Đang xác thực...
                </>
              ) : otpValidated ? (
                <>
                  <CheckCircle size={20} />
                  Đã xác thực
                </>
              ) : (
                <>
                  <Mail size={20} />
                  Xác thực Email
                </>
              )}
            </button>

            <button 
              type="button"
              className="email-verification-glass__button email-verification-glass__button--resend"
              onClick={handleResendOtp}
              disabled={resending || otpValidated}
            >
              {resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
            </button>
          </form>

        {/* Footer Link */}
        <div className="email-verification-glass__footer">
          <button 
            onClick={() => navigate('/auth/login')} 
            className="email-verification-glass__back-link"
          >
            <ArrowLeft size={16} />
            Quay lại trang đăng nhập
          </button>
        </div>
      </div>
    </div>
  )
}


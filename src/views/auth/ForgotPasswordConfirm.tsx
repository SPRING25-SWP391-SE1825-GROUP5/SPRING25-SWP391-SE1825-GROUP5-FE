import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthService } from '@/services/authService'
import { validatePassword, validateResetConfirmForm } from '@/utils/validation'
import toast from 'react-hot-toast'
import { Shield, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, X } from 'lucide-react'
import './ForgotPasswordConfirm.scss'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function ForgotPasswordConfirm() {
  const navigate = useNavigate()
  const query = useQuery()
  const initialEmail = query.get('email') || ''

  const [email] = useState(initialEmail)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otpValidated, setOtpValidated] = useState(false)
  const [otpValidating, setOtpValidating] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus next input when typing
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters
    
    const newOtpValues = [...otpValues]
    newOtpValues[index] = value
    setOtpValues(newOtpValues)
    
    // Move to next input if value is entered
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
    
    // Auto-validate when all 6 digits are entered
    if (newOtpValues.every(val => val !== '') && newOtpValues.join('').length === 6) {
      validateOtp(newOtpValues.join(''))
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
    setOtpValidating(true)
    try {
      // Here you would call your API to validate OTP
      // For now, we'll simulate validation with a simple check
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      // Mock validation - replace with actual API call
      if (otpCode === '123456') {
        setOtpValidated(true)
        setErrors(prev => ({ ...prev, otpCode: '' }))
        toast.success('Mã OTP hợp lệ!')
      } else {
        setOtpValidated(false)
        setErrors(prev => ({ ...prev, otpCode: 'Mã OTP không đúng' }))
        toast.error('Mã OTP không đúng')
      }
    } catch (error) {
      setOtpValidated(false)
      setErrors(prev => ({ ...prev, otpCode: 'Lỗi xác thực OTP' }))
      toast.error('Lỗi xác thực OTP')
    } finally {
      setOtpValidating(false)
    }
  }

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otpValidated) {
      toast.error('Vui lòng nhập đúng mã OTP trước')
      return
    }
    
    const nextErrors: Record<string, string> = {}
    const otpCode = otpValues.join('')
    const v = validateResetConfirmForm({ otpCode, newPassword, confirmPassword })
    Object.assign(nextErrors, v.errors)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const loadingId = toast.loading('Đang đặt lại mật khẩu...')
    setSubmitting(true)
    try {
      await AuthService.confirmResetPassword({ email, otpCode, newPassword, confirmPassword })
      toast.success('Đổi mật khẩu thành công, vui lòng đăng nhập')
      navigate('/auth/login', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Đổi mật khẩu thất bại'
      toast.error(msg)
      setErrors({ server: msg })
    } finally {
      setSubmitting(false)
      toast.dismiss(loadingId)
    }
  }, [email, otpValues, newPassword, confirmPassword, navigate, otpValidated])

  return (
    <div className="forgot-password-confirm" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>
      <div className="forgot-password-confirm__container">
        <div className="forgot-password-confirm__header">
          <button 
            onClick={() => navigate('/auth/forgot-password')} 
            className="forgot-password-confirm__back-btn"
            aria-label="Quay lại trang quên mật khẩu"
          >
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          
          <div className="forgot-password-confirm__icon">
            <Shield size={48} />
          </div>
          
          <h1 className="forgot-password-confirm__title">Xác nhận đặt lại mật khẩu</h1>
          <p className="forgot-password-confirm__subtitle">
            Nhập mã OTP và tạo mật khẩu mới để hoàn tất việc đặt lại mật khẩu
          </p>
        </div>

        <div className="forgot-password-confirm__form-container">
          <form onSubmit={onSubmit} className="forgot-password-confirm__form">
            <div className="form-group">
              <label className="form-group__label">
                <Shield size={16} />
                Mã OTP
              </label>
              <div className="otp-container">
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
                    className={`otp-input ${otpValidated ? 'otp-input--valid' : ''} ${errors.otpCode ? 'otp-input--error' : ''} ${otpValidating ? 'otp-input--validating' : ''}`}
                    disabled={otpValidating}
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
              {otpValidating && (
                <div className="otp-validating">
                  <div className="otp-spinner"></div>
                  <span>Đang xác thực...</span>
                </div>
              )}
              {otpValidated && (
                <div className="otp-success">
                  <CheckCircle size={16} />
                  <span>Mã OTP hợp lệ!</span>
                </div>
              )}
              {errors.otpCode && (
                <div className="otp-error">
                  <X size={16} />
                  <span>{errors.otpCode}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPass" className="form-group__label">
                <Lock size={16} />
                Mật khẩu mới
                {!otpValidated && <span className="form-group__label--disabled"> (Chờ xác thực OTP)</span>}
              </label>
              <div className="form-group__input-wrapper">
                <input 
                  id="newPass" 
                  type={showNewPassword ? "text" : "password"} 
                  className={`form-group__input ${errors.newPassword ? 'form-group__input--error' : ''} ${!otpValidated ? 'form-group__input--disabled' : ''}`}
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Tạo mật khẩu mới"
                  aria-label="Mật khẩu mới"
                  disabled={!otpValidated}
                />
                <button
                  type="button"
                  className="form-group__toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  disabled={!otpValidated}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && <p className="form-group__error">{errors.newPassword}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="cfPass" className="form-group__label">
                <CheckCircle size={16} />
                Xác nhận mật khẩu
                {!otpValidated && <span className="form-group__label--disabled"> (Chờ xác thực OTP)</span>}
              </label>
              <div className="form-group__input-wrapper">
                <input 
                  id="cfPass" 
                  type={showConfirmPassword ? "text" : "password"} 
                  className={`form-group__input ${errors.confirmPassword ? 'form-group__input--error' : ''} ${!otpValidated ? 'form-group__input--disabled' : ''}`}
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Nhập lại mật khẩu mới"
                  aria-label="Xác nhận mật khẩu"
                  disabled={!otpValidated}
                />
                <button
                  type="button"
                  className="form-group__toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  disabled={!otpValidated}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="form-group__error">{errors.confirmPassword}</p>}
            </div>

            {errors.server && (
              <div className="forgot-password-confirm__server-error">
                <p>{errors.server}</p>
              </div>
            )}

            <button 
              type="submit" 
              className="forgot-password-confirm__submit-btn" 
              disabled={submitting || !otpValidated}
            >
              {submitting ? (
                <>
                  <div className="forgot-password-confirm__spinner"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Đổi mật khẩu
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}



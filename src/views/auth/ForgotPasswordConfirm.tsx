import { useCallback, useMemo, useState, useRef } from 'react'
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
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus next input when typing
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtpValues = [...otpValues]
    newOtpValues[index] = value
    setOtpValues(newOtpValues)

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: Record<string, string> = {}
    const otpCode = otpValues.join('')

    // Basic client-side checks
    if (otpCode.length !== 6) {
      nextErrors.otpCode = 'Vui lòng nhập đủ 6 ký tự OTP'
    }

    const passValidation = validateResetConfirmForm({ otpCode, newPassword, confirmPassword })
    Object.assign(nextErrors, passValidation.errors)

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
  }, [email, otpValues, newPassword, confirmPassword, navigate])

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
                    className={`otp-input ${errors.otpCode ? 'otp-input--error' : ''}`}
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
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
              </label>
              <div className="form-group__input-wrapper">
                <input
                  id="newPass"
                  type={showNewPassword ? "text" : "password"}
                  className={`form-group__input ${errors.newPassword ? 'form-group__input--error' : ''}`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tạo mật khẩu mới"
                  aria-label="Mật khẩu mới"
                />
                <button
                  type="button"
                  className="form-group__toggle"
                  onClick={() => setShowNewPassword(v => !v)}
                  aria-label="Hiện/ẩn mật khẩu mới"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && (
                <div className="form-group__error">
                  <X size={16} />
                  <span>{errors.newPassword}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPass" className="form-group__label">
                <Lock size={16} />
                Xác nhận mật khẩu mới
              </label>
              <div className="form-group__input-wrapper">
                <input
                  id="confirmPass"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-group__input ${errors.confirmPassword ? 'form-group__input--error' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  aria-label="Xác nhận mật khẩu mới"
                />
                <button
                  type="button"
                  className="form-group__toggle"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  aria-label="Hiện/ẩn xác nhận mật khẩu"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="form-group__error">
                  <X size={16} />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {errors.server && (
              <div className="form-group__error" role="alert" aria-live="polite">
                <X size={16} />
                <span>{errors.server}</span>
              </div>
            )}

            <button
              type="submit"
              className="forgot-password-confirm__submit"
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}



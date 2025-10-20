import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthService } from '@/services/authService'
import { validatePassword, validateResetConfirmForm } from '@/utils/validation'
import toast from 'react-hot-toast'
import { Shield, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
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
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!email) nextErrors.email = 'Thiếu email nguồn yêu cầu'
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
  }, [email, otpCode, newPassword, confirmPassword, navigate])

  return (
    <div className="forgot-password-confirm" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>
      <div className="forgot-password-confirm__container">
        <div className="forgot-password-confirm__header">
          <button 
            onClick={() => navigate('/auth/login')} 
            className="forgot-password-confirm__back-btn"
            aria-label="Quay lại đăng nhập"
          >
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          
          <div className="forgot-password-confirm__icon">
            <Shield size={48} />
          </div>
          
          <h1 className="forgot-password-confirm__title">Xác nhận đặt lại mật khẩu</h1>
          <p className="forgot-password-confirm__subtitle">
            Nhập mã OTP đã được gửi đến email của bạn và tạo mật khẩu mới
          </p>
        </div>

        <div className="forgot-password-confirm__form-container">
          <form onSubmit={onSubmit} className="forgot-password-confirm__form">
            <div className="form-group">
              <label className="form-group__label">
                <Lock size={16} />
                Email
              </label>
              <input 
                className="form-group__input form-group__input--disabled" 
                type="email" 
                value={email} 
                disabled 
                aria-label="Email đã xác nhận"
              />
              {errors.email && <p className="form-group__error">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="otp" className="form-group__label">
                <Shield size={16} />
                Mã OTP
              </label>
              <input 
                id="otp" 
                className={`form-group__input ${errors.otpCode ? 'form-group__input--error' : ''}`}
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                maxLength={6} 
                placeholder="Nhập 6 chữ số OTP"
                aria-label="Mã OTP"
              />
              {errors.otpCode && <p className="form-group__error">{errors.otpCode}</p>}
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
                  className="form-group__toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
              </label>
              <div className="form-group__input-wrapper">
                <input 
                  id="cfPass" 
                  type={showConfirmPassword ? "text" : "password"} 
                  className={`form-group__input ${errors.confirmPassword ? 'form-group__input--error' : ''}`}
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Nhập lại mật khẩu mới"
                  aria-label="Xác nhận mật khẩu"
                />
                <button
                  type="button"
                  className="form-group__toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
              disabled={submitting}
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



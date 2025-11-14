import { useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthService } from '@/services/authService'
import { validateGmail } from '@/utils/validation'
import toast from 'react-hot-toast'
import './ForgotPasswordRequest.scss'

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
    <div className="forgot-password-glass">
      {/* Background với Workshop Image */}
      <div className="forgot-password-glass__background" />

      {/* Glassmorphism Card */}
      <div className="forgot-password-glass__card">
        {/* Header */}
        <div className="forgot-password-glass__header">
          <h1 className="forgot-password-glass__title">Quên mật khẩu</h1>
          <p className="forgot-password-glass__subtitle">
            Nếu bạn đã có tài khoản,{' '}
            <Link to="/auth/login">đăng nhập</Link>
          </p>
        </div>

        {/* Form */}
        <form className="forgot-password-glass__form" onSubmit={onSubmit}>
          {/* Server Error */}
          {error && (
            <div className="forgot-password-glass__server-error">
              {error}
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="forgot-password-glass__success">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 10L8.5 12.5L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Đã gửi OTP tới email của bạn!</span>
            </div>
          )}

          {/* Email Field */}
          <div className="forgot-password-glass__form-group">
            <label className={error ? 'error' : ''}>
              Email
            </label>
            <input
              type="email"
              className={`forgot-password-glass__input ${error ? 'error' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              placeholder="email@example.com"
              required
              disabled={submitting || isSuccess}
            />
            {error && (
              <div className="forgot-password-glass__error">
                {error}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="forgot-password-glass__button forgot-password-glass__button--submit"
            disabled={submitting || isSuccess}
          >
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>

        {/* Footer */}
        <div className="forgot-password-glass__footer">
          <div>
            <a href="/terms">Điều khoản sử dụng</a>
            <span>•</span>
            <a href="/privacy">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </div>
  )
}



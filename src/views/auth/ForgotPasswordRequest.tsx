import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthService } from '@/services/authService'
import { validateGmail } from '@/utils/validation'
import toast from 'react-hot-toast'

export default function ForgotPasswordRequest() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
      toast.success('Đã gửi OTP tới email của bạn')
      navigate(`/auth/forgot-password/confirm?email=${encodeURIComponent(email)}`)
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
    <div className="login">
      <div className="login__container">
        <div className="login__form-container">
          <h1 className="login__title">Quên mật khẩu</h1>
          <p className="login__subtitle">Nhập email @gmail.com để nhận OTP</p>
          <div className="login__grid">
            <div className="login__form">
              <form onSubmit={onSubmit}>
                <div className="form-group">
                  <label htmlFor="email" className="form-group__label">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="form-group__input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    required
                  />
                  {error && <p className="login__error">{error}</p>}
                </div>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  Gửi OTP
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



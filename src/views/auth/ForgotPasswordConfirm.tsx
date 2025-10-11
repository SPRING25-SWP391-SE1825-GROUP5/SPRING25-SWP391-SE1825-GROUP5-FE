import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthService } from '@/services/authService'
import { validatePassword, validateResetConfirmForm } from '@/utils/validation'
import toast from 'react-hot-toast'

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
    <div className="login">
      <div className="login__container">
        <div className="login__form-container">
          <h1 className="login__title">Xác nhận đặt lại mật khẩu</h1>
          <p className="login__subtitle">Nhập OTP và mật khẩu mới</p>
          <div className="login__grid">
            <div className="login__form">
              <form onSubmit={onSubmit}>
                <div className="form-group">
                  <label className="form-group__label">Email</label>
                  <input className="form-group__input" type="email" value={email} disabled />
                  {errors.email && <p className="login__error">{errors.email}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="otp" className="form-group__label">Mã OTP</label>
                  <input id="otp" className="form-group__input" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6} placeholder=" " />
                  {errors.otpCode && <p className="login__error">{errors.otpCode}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="newPass" className="form-group__label">Mật khẩu mới</label>
                  <input id="newPass" type="password" className="form-group__input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder=" " />
                  {errors.newPassword && <p className="login__error">{errors.newPassword}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="cfPass" className="form-group__label">Xác nhận mật khẩu</label>
                  <input id="cfPass" type="password" className="form-group__input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder=" " />
                  {errors.confirmPassword && <p className="login__error">{errors.confirmPassword}</p>}
                </div>
                {errors.server && <p className="login__error">{errors.server}</p>}
                <button type="submit" className="btn btn--primary" disabled={submitting}>Đổi mật khẩu</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



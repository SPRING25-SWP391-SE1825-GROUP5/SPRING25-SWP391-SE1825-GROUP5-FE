import { useState, useCallback, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useLocation, Link, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, clearError } from '@/store/authSlice'
import logo from '@/assets/images/logo-black.webp'
import './LoginPage.scss'
import { validateLoginFormV2, validateEmail, validateVNPhone10, validatePassword } from '@/utils/validation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const { loading, error, token, user } = useAppSelector((s) => s.auth)
  const location = useLocation()

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  function handleEmailOrPhoneChange(v: string) {
    setEmailOrPhone(v)
    if (formError.emailOrPhone) setFormError({ ...formError, emailOrPhone: '' })
    if (serverError) setServerError(null)
    dispatch(clearError())
  }

  function handlePasswordChange(v: string) {
    setPassword(v)
    if (formError.password) setFormError({ ...formError, password: '' })
    if (serverError) setServerError(null)
    dispatch(clearError())
  }

  // Debounced inline validation (2s after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Validate emailOrPhone
      if (emailOrPhone.trim()) {
        const isEmail = emailOrPhone.includes('@')
        const v = isEmail ? validateEmail(emailOrPhone) : validateVNPhone10(emailOrPhone)
        setFormError((prev) => ({ ...prev, emailOrPhone: v.isValid ? '' : (v.error || 'Thông tin không hợp lệ') }))
      } else {
        setFormError((prev) => ({ ...prev, emailOrPhone: '' }))
      }

      // Validate password
      if (password) {
        const pv = validatePassword(password)
        setFormError((prev) => ({ ...prev, password: pv.isValid ? '' : (pv.error || 'Mật khẩu không hợp lệ') }))
      } else {
        setFormError((prev) => ({ ...prev, password: '' }))
      }

      // Clear server error when user edits
      if (serverError) setServerError(null)
    }, 2000)

    return () => clearTimeout(timer)
  }, [emailOrPhone, password])
  const redirect = new URLSearchParams(location.search).get('redirect')
  // Prevent redirect loop back to login
  const safeRedirect = redirect && !redirect.startsWith('/auth/login') ? redirect : null

  // Function to determine redirect path based on user role
  const getRedirectPath = useCallback((userRole: any) => {
    if (safeRedirect) return safeRedirect

    const role = (typeof userRole === 'string' ? userRole : String(userRole || 'customer')).toLowerCase()

    switch (role) {
      case 'admin':
        return '/admin'
      case 'staff':
        return '/staff'
      case 'technician':
        return '/technician'
      case 'manager':
        return '/manager'
      case 'customer':
      default:
        return '/dashboard'
    }
  }, [safeRedirect])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)
    dispatch(clearError())

    const v = validateLoginFormV2({ emailOrPhone, password })
    if (!v.isValid) {
      setFormError(v.errors)
      return
    }

    const loadingId = toast.loading('Đang đăng nhập...')
    const result = await dispatch(login({ emailOrPhone, password }))
    const status = (result as any)?.meta?.requestStatus

    toast.dismiss(loadingId)

    if (status === 'fulfilled') {
      // Success toast is handled globally by LoginToastWatcher to avoid duplication
      // Do not navigate here; handled by <Navigate /> below
    } else if (status === 'rejected') {
      const payload = (result as any)?.payload
      const fallbackMsg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      const errMsg = typeof payload === 'string' ? payload : (payload?.message || fallbackMsg)
      const fieldErrors = Array.isArray(payload?.errors) ? payload.errors : []

      // Bind server field errors if available
      const nextFormError: Record<string, string> = { ...formError }
      fieldErrors.forEach((msg: string) => {
        const m = msg.toLowerCase()
        if (m.includes('email') || m.includes('phone')) nextFormError.emailOrPhone = msg
        if (m.includes('password')) nextFormError.password = msg
      })
      setFormError(nextFormError)
      setServerError(errMsg)

      toast.error(errMsg)
    }
  }

  function loginWithGoogle() {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const googleAuthUrl = `${base}/auth/login-google`
    window.location.href = googleAuthUrl + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '')
  }

  // If already logged in, redirect out of login page
  if (token && user && user.role) {
    const redirectPath = getRedirectPath(user.role)
    if (redirectPath && redirectPath !== location.pathname) {
      return <Navigate to={redirectPath} replace />
    }
  }

  return (
    <div className="login">
      {/* Logo Header */}
      <div className="login__header">
        <Link to="/" className="login__logo-link">
          <img src={logo} alt="EV Service Logo" className="login__logo" />
        </Link>
      </div>

      <div className="login__container">
        <h1 className="login__title">Log In</h1>
        <p className="login__subtitle">
          Don't have an account?{' '}
          <Link to="/auth/register" className="login__signup-link">
            Sign Up
          </Link>
        </p>

        <div className="login__grid">
          {/* Left Column - Form */}
          <div className="login__form">
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <input
                  id="emailOrPhone"
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => handleEmailOrPhoneChange(e.target.value)}
                  className="form-group__input"
                  placeholder=" "
                  aria-invalid={!!formError.emailOrPhone}
                  required
                />
                <label htmlFor="emailOrPhone" className="form-group__label">
                  Email hoặc số điện thoại
                </label>
                {formError.emailOrPhone && <p className="login__error">{formError.emailOrPhone}</p>}
              </div>

              <div className="form-group">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-group__input"
                  placeholder=" "
                  required
                />
                <label htmlFor="password" className="form-group__label">
                  Password
                </label>
                <Link to="/forgot-password" className="form-group__forgot-link">
                  Forgot Password?
                </Link>
                {formError.password && <p className="login__error">{formError.password}</p>}
              </div>

              {(error && !formError.password && !formError.emailOrPhone) && <p className="login__error">{error}</p>}

              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Continue'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="login__divider">
            <div className="login__divider-line"></div>
            <span className="login__divider-text">or</span>
          </div>

          {/* Right Column - Social Login */}
          <div className="login__social">
            <button
              type="button"
              className="btn btn--google btn--google-enhanced"
              onClick={loginWithGoogle}
            >
              <div className="btn__icon">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <span className="btn__text">Continue with Google</span>
            </button>

          </div>
        </div>

        {/* Footer */}
        <div className="login__footer">
          <div className="login__footer-links">
            <a href="/terms" className="login__footer-link">Terms of Use</a>
            <span className="login__footer-separator">•</span>
            <a href="/privacy" className="login__footer-link">Privacy Policy</a>
          </div>
          <p className="login__recaptcha">
            This site is protected by reCAPTCHA Enterprise.{' '}
            <a href="https://policies.google.com/privacy" className="login__recaptcha-link">
              Google's Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" className="login__recaptcha-link">
              Terms of Service
            </a>{' '}
            apply.
          </p>
        </div>

      </div>
    </div>
  );
}

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '@/assets/images/logo-black.webp'
import './register.scss'
import { GoogleIconWhite } from './AuthIcons'
import { Eye, EyeOff, X } from 'lucide-react'

export default function Register() {
  const location = useLocation()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })
  const [showPasswordPopup, setShowPasswordPopup] = useState(false)

  const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard'

  const googleAuthUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${base}/auth/google`
  }, [])

  function loginWithGoogle() {
    window.location.href = googleAuthUrl + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '')
  }

  function validatePassword(password: string) {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    const strength = Object.values(requirements).filter(Boolean).length
    setPasswordRequirements(requirements)
    setPasswordStrength(strength)
  }

  function getPasswordStrengthText() {
    if (passwordStrength === 0) return ''
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Fair'
    if (passwordStrength <= 4) return 'Good'
    return 'Strong'
  }

  function getPasswordStrengthColor() {
    if (passwordStrength === 0) return '#E5E7EB'
    if (passwordStrength <= 2) return '#EF4444'
    if (passwordStrength <= 3) return '#F59E0B'
    if (passwordStrength <= 4) return '#10B981'
    return '#059669'
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    
    // Validate full name
    if (fullName.trim().length < 2) {
      alert('Vui lòng nhập họ tên đầy đủ')
      return
    }
    
    // Validate email confirmation
    if (email !== confirmEmail) {
      alert('Email xác nhận không khớp')
      return
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp')
      return
    }
    
    // Validate password strength
    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    
    // TODO: wire to real register API when backend is ready
    alert('Đăng ký thành công (mock). Vui lòng đăng nhập!')
  }

  return (
    <div className="register">
      {/* Logo Header */}
      <div className="register__header">
        <Link to="/" className="register__logo-link">
          <img src={logo} alt="EV Service Logo" className="register__logo" />
        </Link>
      </div>
      
      <div className="register__container">
        <h1 className="register__title">Sign Up</h1>
        <p className="register__subtitle">
          Already have an account?{' '}
          <Link to="/auth/login" className="register__login-link">
            Log In
          </Link>
        </p>

        <div className="register__grid">
          {/* Left Column - Form */}
          <div className="register__form">

            <form onSubmit={onSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  id="fullName"
                  className="form-group__input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder=" "
                  required
                />
                <label htmlFor="fullName" className="form-group__label">Full Name</label>
              </div>

              <div className="form-group">
                <input
                  type="email"
                  id="email"
                  className="form-group__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                />
                <label htmlFor="email" className="form-group__label">Email</label>
              </div>

              <div className="form-group">
                <input
                  type="email"
                  id="confirmEmail"
                  className="form-group__input"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder=" "
                  required
                />
                <label htmlFor="confirmEmail" className="form-group__label">Confirm email</label>
              </div>

              <div className="form-group password-field">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-group__input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      validatePassword(e.target.value)
                    }}
                    onFocus={() => setShowPasswordPopup(true)}
                    placeholder=" "
                    required
                  />
                  <label htmlFor="password" className="form-group__label">Choose a password</label>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {/* Password Requirements Popup */}
                {showPasswordPopup && (
                  <div className="password-popup">
                    <div className="password-popup-header">
                      <h4>Strong Password</h4>
                      <button 
                        className="password-popup-close"
                        onClick={() => setShowPasswordPopup(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="password-strength-indicator">
                      <div className="strength-dots">
                        {[...Array(4)].map((_, i) => (
                          <div 
                            key={i}
                            className={`strength-dot ${i < passwordStrength ? 'active' : ''}`}
                            style={{ 
                              backgroundColor: i < passwordStrength ? getPasswordStrengthColor() : '#E5E7EB'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="password-popup-requirements">
                      <p>It's better to have:</p>
                      <div className="requirement-item">
                        <div className={`requirement-icon ${passwordRequirements.uppercase && passwordRequirements.lowercase ? 'met' : ''}`}>
                          {passwordRequirements.uppercase && passwordRequirements.lowercase ? '✓' : '•'}
                        </div>
                        <span className={passwordRequirements.uppercase && passwordRequirements.lowercase ? 'met' : ''}>
                          Upper & lower case letters
                        </span>
                      </div>
                      <div className="requirement-item">
                        <div className={`requirement-icon ${passwordRequirements.special ? 'met' : ''}`}>
                          {passwordRequirements.special ? '✓' : '•'}
                        </div>
                        <span className={passwordRequirements.special ? 'met' : ''}>
                          Symbols (#$&)
                        </span>
                      </div>
                      <div className="requirement-item">
                        <div className={`requirement-icon ${passwordRequirements.length ? 'met' : ''}`}>
                          {passwordRequirements.length ? '✓' : '•'}
                        </div>
                        <span className={passwordRequirements.length ? 'met' : ''}>
                          A longer password
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="form-group__input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label htmlFor="confirmPassword" className="form-group__label">Confirm password</label>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <div className="password-error">Passwords do not match</div>
                )}
              </div>

              <button type="submit" className="btn btn--primary">
                Sign Up
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="register__divider">
            <div className="register__divider-line"></div>
            <span className="register__divider-text">or</span>
          </div>

          {/* Right Column - Social Login */}
          <div className="register__social">
            <button
              type="button"
              className="btn btn--google"
              onClick={loginWithGoogle}
            >
              <div className="btn__icon">
                <GoogleIconWhite />
              </div>
              <span className="btn__text">Continue with Google</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="register__footer">
          <div className="register__footer-links">
            <a href="#">Terms of Use</a>
            <span>•</span>
            <a href="#">Privacy Policy</a>
          </div>
          <p className="register__footer-text">
            This site is protected by reCAPTCHA Enterprise. Google's Privacy Policy and Terms of Service apply.
          </p>
        </div>
      </div>
    </div>
  )
}

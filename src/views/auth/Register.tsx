import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '@/assets/images/logo-black.webp'
import './register.scss'
import { GoogleIconWhite } from './AuthIcons'
import { Eye, EyeOff, X } from 'lucide-react'
import { AuthService } from '@/services/authService'
import {
  validateRegisterFormStrict,
  validatePassword,
} from '@/utils/validation'

export default function Register() {
  const location = useLocation()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('')
  const [address, setAddress] = useState('')
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const redirect = new URLSearchParams(location.search).get('redirect') || '/auth/login'

  const googleAuthUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
    return `${base}/auth/login-google`
  }, [])

  function loginWithGoogle() {
    window.location.href = googleAuthUrl
  }

  function updatePasswordStrength(pw: string) {
    const req = {
      length: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      lowercase: /[a-z]/.test(pw),
      number: /\d/.test(pw),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pw)
    }
    setPasswordRequirements(req)
    setPasswordStrength(Object.values(req).filter(Boolean).length)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const v = validateRegisterFormStrict({
      fullName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      dateOfBirth,
      gender: gender as 'MALE' | 'FEMALE',
      address,
      avatarUrl: ''
    })
    if (!v.isValid) {
      setErrors(v.errors)
      return
    }

    setSubmitting(true)
    try {
      await AuthService.register({
        fullName,
        email,
        password,
        confirmPassword,
        phoneNumber,
        dateOfBirth,
        gender: gender as 'MALE' | 'FEMALE',
        address,
        avatarUrl: ''
      })
      alert('Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.')
      navigate(redirect, { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đăng ký thất bại'
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="register">
      <div className="register__container">
        {/* Left side - Image/Visual */}
        <div className="register__visual">
          <div className="register__image-container">
            <img 
              src="/src/assets/images/ev-charging.svg" 
              alt="EV Service Center" 
              className="register__hero-image"
            />
            <div className="register__hero-content">
              <h2>Tham gia EV Service Center</h2>
              <p>Tạo tài khoản và bắt đầu quản lý việc bảo dưỡng xe điện của bạn</p>
            </div>
          </div>
        </div>

        {/* Right side - Register Form */}
        <div className="register__form-container">
        <h1 className="register__title">Đăng Ký</h1>
        <p className="register__subtitle">
          Đã có tài khoản?{' '}
          <Link to="/auth/login" className="register__login-link">
            Đăng Nhập
          </Link>
        </p>

        <div className="register__grid">
          <div className="register__form">

            <form onSubmit={onSubmit}>
              <label htmlFor="fullName" className="form-group__label">Họ và tên</label>
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
                
                {errors.fullName && <p className="register__error">{errors.fullName}</p>}
              </div>

              <div className="form-group">
              <label htmlFor="email" className="form-group__label">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-group__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                />
                
                {errors.email && <p className="register__error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-group__label">Số điện thoại</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  className="form-group__input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder=" "
                  required
                />
                
                {errors.phoneNumber && <p className="register__error">{errors.phoneNumber}</p>}
              </div>

              <div className="form-row">
                 <label htmlFor="dateOfBirth" className="form-group__label">Ngày sinh</label>
                <div className="form-group">
                  <input
                    type="date"
                    id="dateOfBirth"
                    className="form-group__input"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    placeholder=" "
                    required
                  />
                 
                  {errors.dateOfBirth && <p className="register__error">{errors.dateOfBirth}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="gender" className="form-group__label">Giới tính</label>
                  <select
                    id="gender"
                    className="form-group__input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    required
                  >
                    <option value="" disabled>Giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                  
                  {errors.gender && <p className="register__error">{errors.gender}</p>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address" className="form-group__label">Địa chỉ (không bắt buộc)</label>
                <input
                  type="text"
                  id="address"
                  className="form-group__input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder=" "
                />
                
                {errors.address && <p className="register__error">{errors.address}</p>}
              </div>

              <div className="form-group password-field">
                <div className="password-input-wrapper">
                  <label htmlFor="password" className="form-group__label">Mật khẩu</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-group__input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      updatePasswordStrength(e.target.value)
                    }}
                    onFocus={() => setShowPasswordPopup(true)}
                    placeholder=" "
                    required
                  />
                  
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="register__error">{errors.password}</p>}

                {/* Password Requirements Popup */}
                {showPasswordPopup && (
                  <div className="password-popup">
                    <div className="password-popup-header">
                      <h4>Mật khẩu mạnh</h4>
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
                              backgroundColor: i < passwordStrength ? (passwordStrength <= 2 ? '#EF4444' : passwordStrength <= 3 ? '#F59E0B' : '#10B981') : '#E5E7EB'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="password-popup-requirements">
                      <p>Nên có:</p>
                      <div className="requirement-item">
                        <div className={`requirement-icon ${passwordRequirements.uppercase && passwordRequirements.lowercase ? 'met' : ''}`}>
                          {passwordRequirements.uppercase && passwordRequirements.lowercase ? '✓' : '•'}
                        </div>
                        <span className={passwordRequirements.uppercase && passwordRequirements.lowercase ? 'met' : ''}>
                          Chữ hoa & chữ thường
                        </span>
                      </div>
                      <div className="requirement-item">
                        <div className={`requirement-icon ${passwordRequirements.special ? 'met' : ''}`}>
                          {passwordRequirements.special ? '✓' : '•'}
                        </div>
                        <span className={passwordRequirements.special ? 'met' : ''}>
                          Ký tự đặc biệt (#$&)
                        </span>
                      </div>
                      <div className="requirement-item">
                        <div className={`requirement-icon ${passwordRequirements.length ? 'met' : ''}`}>
                          {passwordRequirements.length ? '✓' : '•'}
                        </div>
                        <span className={passwordRequirements.length ? 'met' : ''}>
                          Độ dài lớn hơn
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="password-input-wrapper">
                  <label htmlFor="confirmPassword" className="form-group__label">Xác nhận mật khẩu</label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="form-group__input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder=" "
                    required
                  />
                  
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <div className="password-error">{errors.confirmPassword}</div>}
              </div>

              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Đăng Ký'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="register__divider">
            <div className="register__divider-line"></div>
            <span className="register__divider-text">hoặc</span>
          </div>

          <div className="register__social">
            <button
              type="button"
              className="btn btn--google"
              onClick={loginWithGoogle}
            >
              <div className="btn__icon">
                <GoogleIconWhite />
              </div>
              <span className="btn__text">Tiếp tục với Google</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="register__footer">
          <div className="register__footer-links">
            <a href="#">Điều khoản sử dụng</a>
            <span>•</span>
            <a href="#">Chính sách bảo mật</a>
          </div>
          <p className="register__footer-text">
            Trang web này được bảo vệ bởi reCAPTCHA Enterprise. Chính sách bảo mật và Điều khoản dịch vụ của Google được áp dụng.
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '@/assets/images/logo-black.webp'
import './register.scss'
import { GoogleIconWhite } from './AuthIcons'
import { Eye, EyeOff, X } from 'lucide-react'
import { AuthService, googleAuthService } from '@/services/authService'
import toast from 'react-hot-toast'
import { useAppDispatch } from '@/store/hooks'
import { syncFromLocalStorage } from '@/store/authSlice'
import {
  validateRegisterFormStrict,
  validateRegisterFormStrictAsync,
  validatePassword,
  mapServerErrorsToFields,
  validateEmailNotExists,
  validatePhoneNotExists,
} from '@/utils/validation'

export default function Register() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
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
  const [validatingEmail, setValidatingEmail] = useState(false)
  const [validatingPhone, setValidatingPhone] = useState(false)

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }) as T
  }

  // Debounced validation for email and phone
  const debouncedEmailValidation = useCallback(
    debounce(async (emailValue: string) => {
      if (!emailValue.trim()) return
      
      setValidatingEmail(true)
      try {
        const result = await validateEmailNotExists(emailValue, AuthService.checkEmailExists)
        if (!result.isValid) {
          setErrors(prev => ({ ...prev, email: result.error! }))
        } else {
          setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.email
            return newErrors
          })
        }
      } catch (error) {
        console.error('Email validation error:', error)
      } finally {
        setValidatingEmail(false)
      }
    }, 500),
    []
  )

  const debouncedPhoneValidation = useCallback(
    debounce(async (phoneValue: string) => {
      if (!phoneValue.trim()) return
      
      setValidatingPhone(true)
      try {
        const result = await validatePhoneNotExists(phoneValue, AuthService.checkPhoneExists)
        if (!result.isValid) {
          setErrors(prev => ({ ...prev, phoneNumber: result.error! }))
        } else {
          setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.phoneNumber
            return newErrors
          })
        }
      } catch (error) {
        console.error('Phone validation error:', error)
      } finally {
        setValidatingPhone(false)
      }
    }, 500),
    []
  )

  // Real-time validation functions
  const validateField = (fieldName: string, value: string) => {
    const validation = validateRegisterFormStrict({
      fullName: fieldName === 'fullName' ? value : fullName,
      email: fieldName === 'email' ? value : email,
      password: fieldName === 'password' ? value : password,
      confirmPassword: fieldName === 'confirmPassword' ? value : confirmPassword,
      phoneNumber: fieldName === 'phoneNumber' ? value : phoneNumber,
      dateOfBirth: fieldName === 'dateOfBirth' ? value : dateOfBirth,
      gender: fieldName === 'gender' ? value as 'MALE' | 'FEMALE' : gender as 'MALE' | 'FEMALE',
      address: fieldName === 'address' ? value : address,
      avatarUrl: ''
    })
    
    if (validation.errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: validation.errors[fieldName] }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const redirect = new URLSearchParams(location.search).get('redirect') || '/auth/login'
  const googleBtnRef = useRef<HTMLDivElement | null>(null)

  const getRedirectPath = useCallback((role?: string | null) => {
    const r = (role || 'customer').toLowerCase()
    switch (r) {
      case 'admin': return '/admin'
      case 'staff': return '/staff'
      case 'technician': return '/technician'
      case 'manager': return '/manager'
      default: return '/'
    }
  }, [])

  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    const idToken = response?.credential
    if (!idToken) return

    const loadingId = toast.loading('Đang xác thực Google...')
    try {
      const result = await AuthService.loginWithGoogle({ token: idToken })
      if (result.success) {
        toast.success('Đăng nhập Google thành công!')
        localStorage.setItem('token', result.data.token)
        localStorage.setItem('user', JSON.stringify(result.data.user))
        dispatch(syncFromLocalStorage())
        const target = new URLSearchParams(location.search).get('redirect')
        const path = target || getRedirectPath(result.data.user?.role)
        navigate(path, { replace: true })
      } else {
        toast.error(result.message || 'Đăng nhập Google thất bại!')
      }
    } catch (error) {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.')
    } finally {
      toast.dismiss(loadingId)
    }
  }, [dispatch, getRedirectPath, navigate, location.search])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const inited = await googleAuthService.initialize(handleGoogleCredential)
      if (!mounted) return
      if (inited && googleBtnRef.current) {
        googleAuthService.renderButton(googleBtnRef.current)
      }
    })()
    return () => { mounted = false }
  }, [handleGoogleCredential])

  const onGoogleButtonClick = useCallback(async () => {
    try {
      const inited = await googleAuthService.initialize(handleGoogleCredential)
      if (!inited) {
        toast.error('Không thể khởi tạo Google. Vui lòng tải lại trang.')
        return
      }
      const shown = await googleAuthService.prompt()
      if (!shown) toast.error('Không thể hiển thị Google Sign In. Vui lòng thử lại.')
    } catch (error) {
      toast.error('Lỗi xác thực Google. Vui lòng thử lại.')
    }
  }, [handleGoogleCredential])

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
    
    // First do basic validation
    const basicValidation = validateRegisterFormStrict({
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
    
    if (!basicValidation.isValid) {
      setErrors(basicValidation.errors)
      return
    }

    setSubmitting(true)
    
     try {
       // Then do async validation with duplicate check
       const asyncValidation = await validateRegisterFormStrictAsync({
         fullName,
         email,
         password,
         confirmPassword,
         phoneNumber,
         dateOfBirth,
         gender: gender as 'MALE' | 'FEMALE',
         address,
         avatarUrl: ''
       }, AuthService.checkEmailExists, AuthService.checkPhoneExists)
       
       if (!asyncValidation.isValid) {
         setErrors(asyncValidation.errors)
         setSubmitting(false)
         return
       }

       // All validations passed, proceed with registration
       const result = await AuthService.register({
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
       
       // Check if registration was successful
       if (result.success) {
         toast.success('Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.')
         navigate(redirect, { replace: true })
       } else {
         // Handle registration failure
         console.log('Registration failed:', result)
         console.log('Result type:', typeof result)
         console.log('Result keys:', Object.keys(result))
         
         // Check if there are specific field errors
         const errorResult = result as any
         let hasFieldErrors = false
         
         if (errorResult.errors && Array.isArray(errorResult.errors)) {
           console.log('Server errors:', errorResult.errors)
           const fieldErrors = mapServerErrorsToFields(errorResult.errors)
           console.log('Mapped field errors:', fieldErrors)
           
           // Set field-specific errors
           if (Object.keys(fieldErrors).length > 0) {
             setErrors(prev => ({ ...prev, ...fieldErrors }))
             console.log('Set field errors:', fieldErrors)
             hasFieldErrors = true
             
             // Debug: Check if phoneNumber error was set
             if (fieldErrors.phoneNumber) {
               console.log('Phone number error set:', fieldErrors.phoneNumber)
             }
           }
         }
         
         // Only show general error message if no field-specific errors
         if (!hasFieldErrors) {
           console.log('Showing general error:', errorResult.message)
           toast.error(errorResult.message || 'Đăng ký thất bại')
         } else {
           console.log('Field errors set, not showing general toast')
         }
       }
     } catch (err: any) {
       console.log('Unexpected error during registration:', err)
       toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
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
              <div className="register__form-grid">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-group__label">Họ và tên <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    id="fullName"
                    className="form-group__input"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (e.target.value.trim()) {
                        validateField('fullName', e.target.value)
                      }
                    }}
                    onBlur={(e) => validateField('fullName', e.target.value)}
                    placeholder=" "
                    required
                  />
                  {errors.fullName && <p className="register__error">{errors.fullName}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-group__label">
                    Email <span className="required-asterisk">*</span>
                    {validatingEmail && <span className="validation-loading">Đang kiểm tra...</span>}
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="email"
                      className={`form-group__input ${validatingEmail ? 'validating' : ''} ${errors.email ? 'error' : ''}`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (e.target.value.trim()) {
                          validateField('email', e.target.value)
                          debouncedEmailValidation(e.target.value)
                        }
                      }}
                      onBlur={(e) => validateField('email', e.target.value)}
                      placeholder=" "
                      required
                    />
                    {validatingEmail && (
                      <div className="validation-spinner">
                        <div className="spinner"></div>
                      </div>
                    )}
                  </div>
                  {errors.email && <p className="register__error">{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber" className="form-group__label">
                    Số điện thoại <span className="required-asterisk">*</span>
                    {validatingPhone && <span className="validation-loading">Đang kiểm tra...</span>}
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="tel"
                      id="phoneNumber"
                      className={`form-group__input ${validatingPhone ? 'validating' : ''} ${errors.phoneNumber ? 'error' : ''}`}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value)
                        if (e.target.value.trim()) {
                          validateField('phoneNumber', e.target.value)
                          debouncedPhoneValidation(e.target.value)
                        }
                      }}
                      onBlur={(e) => validateField('phoneNumber', e.target.value)}
                      placeholder=" "
                      required
                    />
                    {validatingPhone && (
                      <div className="validation-spinner">
                        <div className="spinner"></div>
                      </div>
                    )}
                  </div>
                  {errors.phoneNumber && <p className="register__error">{errors.phoneNumber}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth" className="form-group__label">Ngày sinh <span className="required-asterisk">*</span></label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    className="form-group__input"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value)
                      if (e.target.value) {
                        validateField('dateOfBirth', e.target.value)
                      }
                    }}
                    onBlur={(e) => validateField('dateOfBirth', e.target.value)}
                    placeholder=" "
                    required
                  />
                  {errors.dateOfBirth && <p className="register__error">{errors.dateOfBirth}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="gender" className="form-group__label">Giới tính <span className="required-asterisk">*</span></label>
                  <select
                    id="gender"
                    className="form-group__input"
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value as any)
                      if (e.target.value) {
                        validateField('gender', e.target.value)
                      }
                    }}
                    onBlur={(e) => validateField('gender', e.target.value)}
                    required
                  >
                    <option value="" disabled>Giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                  {errors.gender && <p className="register__error">{errors.gender}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-group__label">Địa chỉ (không bắt buộc)</label>
                  <input
                    type="text"
                    id="address"
                    className="form-group__input"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      if (e.target.value.trim()) {
                        validateField('address', e.target.value)
                      }
                    }}
                    onBlur={(e) => validateField('address', e.target.value)}
                    placeholder=" "
                  />
                  {errors.address && <p className="register__error">{errors.address}</p>}
                </div>

                <div className="form-group password-field">
                  <div className="password-input-wrapper">
                    <label htmlFor="password" className="form-group__label">Mật khẩu <span className="required-asterisk">*</span></label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="form-group__input"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        updatePasswordStrength(e.target.value)
                        if (e.target.value.trim()) {
                          validateField('password', e.target.value)
                        }
                      }}
                      onBlur={(e) => validateField('password', e.target.value)}
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

                  {showPasswordPopup && (
                    <div className="password-popup password-popup-below">
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
                    <label htmlFor="confirmPassword" className="form-group__label">Xác nhận mật khẩu <span className="required-asterisk">*</span></label>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      className="form-group__input"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (e.target.value.trim()) {
                          validateField('confirmPassword', e.target.value)
                        }
                      }}
                      onBlur={(e) => validateField('confirmPassword', e.target.value)}
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
            {/* Google Identity Services Button */}
            <div ref={googleBtnRef} className="google-button-container"></div>

            {/* Fallback button */}
            <button
              type="button"
              className="btn btn--google btn--google-enhanced"
              onClick={onGoogleButtonClick}
              style={{ display: 'none' }}
            >
              <div className="btn__icon">
                <GoogleIconWhite />
              </div>
              <span className="btn__text">Tiếp tục với Google</span>
            </button>
          </div>
        </div>

        </div>
      </div>
    </div>
  )
}

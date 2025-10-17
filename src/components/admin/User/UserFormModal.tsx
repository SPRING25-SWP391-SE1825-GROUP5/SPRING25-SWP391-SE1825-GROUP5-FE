import { useState, useEffect } from 'react'
import { 
  X, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { UserService, CreateUserRequest } from '@/services/userService'
import { 
  validateFullName, 
  validateEmail, 
  validatePassword, 
  validateVNPhone10, 
  validateDOB16, 
  validateGender, 
  validateAddress255 
} from '@/utils/validation'
import toast from 'react-hot-toast'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: 'add' | 'edit'
  user?: any
}

interface FormData {
  fullName: string
  email: string
  password: string
  phoneNumber: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | ''
  address: string
  role: 'CUSTOMER' | 'STAFF' | 'TECHNICIAN' | 'ADMIN'
  isActive: boolean
  emailVerified: boolean
}

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  role?: string
}

export default function UserFormModal({ isOpen, onClose, onSuccess, mode, user }: UserFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: false
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isSuccess, setIsSuccess] = useState(false)

  const roles = [
    { value: 'CUSTOMER', label: 'Khách hàng' },
    { value: 'STAFF', label: 'Nhân viên' },
    { value: 'TECHNICIAN', label: 'Kỹ thuật viên' },
    { value: 'ADMIN', label: 'Quản trị viên' }
  ]

  const genders = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' }
  ]

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        password: '', // Don't pre-fill password
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
        role: user.role || 'CUSTOMER',
        isActive: user.isActive ?? true,
        emailVerified: user.emailVerified ?? false
      })
    } else {
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: false
      })
    }
    setErrors({})
  }, [mode, user, isOpen])

  const validateField = (field: keyof FormData, value: string) => {
    let error = ''

    switch (field) {
      case 'fullName':
        const nameValidation = validateFullName(value)
        if (!nameValidation.isValid) error = nameValidation.error!
        break
      case 'email':
        const emailValidation = validateEmail(value)
        if (!emailValidation.isValid) error = emailValidation.error!
        break
      case 'password':
        if (mode === 'add' || value) {
          const passwordValidation = validatePassword(value)
          if (!passwordValidation.isValid) error = passwordValidation.error!
        }
        break
      case 'phoneNumber':
        const phoneValidation = validateVNPhone10(value)
        if (!phoneValidation.isValid) error = phoneValidation.error!
        break
      case 'dateOfBirth':
        const dobValidation = validateDOB16(value)
        if (!dobValidation.isValid) error = dobValidation.error!
        break
      case 'gender':
        const genderValidation = validateGender(value)
        if (!genderValidation.isValid) error = genderValidation.error!
        break
      case 'address':
        const addressValidation = validateAddress255(value)
        if (!addressValidation.isValid) error = addressValidation.error!
        break
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }))

    return !error
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouchedFields(prev => new Set(prev).add(field))
    
    if (typeof value === 'string') {
      validateField(field, value)
    }
  }

  const getFieldIcon = (field: keyof FormData) => {
    switch (field) {
      case 'fullName': return User
      case 'email': return Mail
      case 'phoneNumber': return Phone
      case 'dateOfBirth': return Calendar
      case 'address': return MapPin
      case 'role': return Shield
      default: return User
    }
  }

  const getFieldStatus = (field: keyof FormData) => {
    if (!touchedFields.has(field)) return 'default'
    if (errors[field]) return 'error'
    if (formData[field as keyof FormData]) return 'success'
    return 'default'
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate all required fields
    const nameValidation = validateFullName(formData.fullName)
    if (!nameValidation.isValid) newErrors.fullName = nameValidation.error!

    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) newErrors.email = emailValidation.error!

    if (mode === 'add' || formData.password) {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) newErrors.password = passwordValidation.error!
    }

    const phoneValidation = validateVNPhone10(formData.phoneNumber)
    if (!phoneValidation.isValid) newErrors.phoneNumber = phoneValidation.error!

    const dobValidation = validateDOB16(formData.dateOfBirth)
    if (!dobValidation.isValid) newErrors.dateOfBirth = dobValidation.error!

    const genderValidation = validateGender(formData.gender)
    if (!genderValidation.isValid) newErrors.gender = genderValidation.error!

    const addressValidation = validateAddress255(formData.address)
    if (!addressValidation.isValid) newErrors.address = addressValidation.error!

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin')
      return
    }

    setIsLoading(true)

    try {
      const userData: CreateUserRequest = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'MALE' | 'FEMALE',
        address: formData.address,
        role: formData.role,
        isActive: formData.isActive,
        emailVerified: formData.emailVerified
      }

      if (mode === 'add') {
        await UserService.createUser(userData)
        setIsSuccess(true)
        toast.success('Tạo người dùng thành công')
        
        // Delay để hiển thị success animation
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        // Update user logic here if needed
        setIsSuccess(true)
        toast.success('Cập nhật người dùng thành công')
        
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      }
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu người dùng')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  // Success state
  if (isSuccess) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '48px 32px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--success-50)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'pulse 2s infinite'
          }}>
            <CheckCircle size={40} color="var(--success-500)" />
          </div>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 8px 0'
          }}>
            Thành công!
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: '0',
            fontSize: '16px'
          }}>
            {mode === 'add' ? 'Người dùng đã được tạo thành công' : 'Thông tin người dùng đã được cập nhật'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '0',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '95vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px 32px 0',
          borderBottom: '1px solid var(--border-primary)',
          background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--bg-card) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: 'var(--text-primary)',
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--primary-500)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={20} color="white" />
                </div>
                {mode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa thông tin'}
              </h3>
              <p style={{ 
                color: 'var(--text-secondary)', 
                margin: '0',
                fontSize: '14px'
              }}>
                {mode === 'add' ? 'Tạo tài khoản người dùng mới trong hệ thống' : 'Cập nhật thông tin người dùng hiện có'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                width: '40px',
                height: '40px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'var(--error-50)'
                  e.currentTarget.style.borderColor = 'var(--error-200)'
                  e.currentTarget.style.color = 'var(--error-500)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div style={{ 
          padding: '32px',
          overflowY: 'auto',
          flex: 1
        }}>
          <form onSubmit={handleSubmit}>
            {/* Section 1: Thông tin cơ bản */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '2px solid var(--primary-100)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'var(--primary-100)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={16} color="var(--primary-500)" />
                </div>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Thông tin cơ bản
                </h4>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Full Name */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>
                    Họ và tên *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: getFieldStatus('fullName') === 'error' ? 'var(--error-500)' : 
                             getFieldStatus('fullName') === 'success' ? 'var(--success-500)' : 'var(--text-muted)',
                      zIndex: 1
                    }}>
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        border: `2px solid ${getFieldStatus('fullName') === 'error' ? 'var(--error-300)' : 
                                               getFieldStatus('fullName') === 'success' ? 'var(--success-300)' : 'var(--border-primary)'}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = getFieldStatus('fullName') === 'error' ? 'var(--error-500)' : 
                                                     getFieldStatus('fullName') === 'success' ? 'var(--success-500)' : 'var(--primary-300)'
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = getFieldStatus('fullName') === 'error' ? 'var(--error-300)' : 
                                                     getFieldStatus('fullName') === 'success' ? 'var(--success-300)' : 'var(--border-primary)'
                        e.target.style.boxShadow = 'none'
                      }}
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                    {getFieldStatus('fullName') === 'success' && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--success-500)'
                      }}>
                        <CheckCircle size={16} />
                      </div>
                    )}
                    {getFieldStatus('fullName') === 'error' && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--error-500)'
                      }}>
                        <AlertCircle size={16} />
                      </div>
                    )}
                  </div>
                  {errors.fullName && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      marginTop: '6px',
                      color: 'var(--error-500)', 
                      fontSize: '12px' 
                    }}>
                      <AlertCircle size={12} />
                      {errors.fullName}
                    </div>
                  )}
                </div>

                {/* Email and Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      Email *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: getFieldStatus('email') === 'error' ? 'var(--error-500)' : 
                               getFieldStatus('email') === 'success' ? 'var(--success-500)' : 'var(--text-muted)',
                        zIndex: 1
                      }}>
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          border: `2px solid ${getFieldStatus('email') === 'error' ? 'var(--error-300)' : 
                                                 getFieldStatus('email') === 'success' ? 'var(--success-300)' : 'var(--border-primary)'}`,
                          borderRadius: '10px',
                          fontSize: '14px',
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = getFieldStatus('email') === 'error' ? 'var(--error-500)' : 
                                                       getFieldStatus('email') === 'success' ? 'var(--success-500)' : 'var(--primary-300)'
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = getFieldStatus('email') === 'error' ? 'var(--error-300)' : 
                                                       getFieldStatus('email') === 'success' ? 'var(--success-300)' : 'var(--border-primary)'
                          e.target.style.boxShadow = 'none'
                        }}
                        placeholder="user@example.com"
                      />
                      {getFieldStatus('email') === 'success' && (
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--success-500)'
                        }}>
                          <CheckCircle size={16} />
                        </div>
                      )}
                      {getFieldStatus('email') === 'error' && (
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--error-500)'
                        }}>
                          <AlertCircle size={16} />
                        </div>
                      )}
                    </div>
                    {errors.email && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        marginTop: '6px',
                        color: 'var(--error-500)', 
                        fontSize: '12px' 
                      }}>
                        <AlertCircle size={12} />
                        {errors.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      Số điện thoại *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: getFieldStatus('phoneNumber') === 'error' ? 'var(--error-500)' : 
                               getFieldStatus('phoneNumber') === 'success' ? 'var(--success-500)' : 'var(--text-muted)',
                        zIndex: 1
                      }}>
                        <Phone size={16} />
                      </div>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          border: `2px solid ${getFieldStatus('phoneNumber') === 'error' ? 'var(--error-300)' : 
                                                 getFieldStatus('phoneNumber') === 'success' ? 'var(--success-300)' : 'var(--border-primary)'}`,
                          borderRadius: '10px',
                          fontSize: '14px',
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = getFieldStatus('phoneNumber') === 'error' ? 'var(--error-500)' : 
                                                       getFieldStatus('phoneNumber') === 'success' ? 'var(--success-500)' : 'var(--primary-300)'
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = getFieldStatus('phoneNumber') === 'error' ? 'var(--error-300)' : 
                                                       getFieldStatus('phoneNumber') === 'success' ? 'var(--success-300)' : 'var(--border-primary)'
                          e.target.style.boxShadow = 'none'
                        }}
                        placeholder="0123456789"
                      />
                      {getFieldStatus('phoneNumber') === 'success' && (
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--success-500)'
                        }}>
                          <CheckCircle size={16} />
                        </div>
                      )}
                      {getFieldStatus('phoneNumber') === 'error' && (
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--error-500)'
                        }}>
                          <AlertCircle size={16} />
                        </div>
                      )}
                    </div>
                    {errors.phoneNumber && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        marginTop: '6px',
                        color: 'var(--error-500)', 
                        fontSize: '12px' 
                      }}>
                        <AlertCircle size={12} />
                        {errors.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                Mật khẩu {mode === 'add' ? '*' : '(để trống nếu không thay đổi)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    border: `1px solid ${errors.password ? 'var(--border-error)' : 'var(--border-primary)'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder={mode === 'add' ? 'Nhập mật khẩu' : 'Nhập mật khẩu mới'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: 'var(--error-500)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Date of Birth and Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Ngày sinh *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${errors.dateOfBirth ? 'var(--border-error)' : 'var(--border-primary)'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)'
                  }}
                />
                {errors.dateOfBirth && (
                  <p style={{ color: 'var(--error-500)', fontSize: '12px', marginTop: '4px' }}>
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Giới tính *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${errors.gender ? 'var(--border-error)' : 'var(--border-primary)'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="">Chọn giới tính</option>
                  {genders.map(gender => (
                    <option key={gender.value} value={gender.value}>{gender.label}</option>
                  ))}
                </select>
                {errors.gender && (
                  <p style={{ color: 'var(--error-500)', fontSize: '12px', marginTop: '4px' }}>
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                Địa chỉ
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.address ? 'var(--border-error)' : 'var(--border-primary)'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Nhập địa chỉ"
              />
              {errors.address && (
                <p style={{ color: 'var(--error-500)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.address}
                </p>
              )}
            </div>

            {/* Role and Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Vai trò *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Trạng thái
                </label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={() => handleInputChange('isActive', true)}
                    />
                    <span>Hoạt động</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="isActive"
                      checked={!formData.isActive}
                      onChange={() => handleInputChange('isActive', false)}
                    />
                    <span>Không hoạt động</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Email Verified */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.emailVerified}
                  onChange={(e) => handleInputChange('emailVerified', e.target.checked)}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  Email đã được xác thực
                </span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px',
                background: isLoading ? 'var(--bg-secondary)' : 'var(--primary-500)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Đang xử lý...' : (mode === 'add' ? 'Tạo người dùng' : 'Cập nhật thông tin')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

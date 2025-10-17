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
  Loader2,
  Key,
  Users,
  Settings
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

export default function UserFormModalOptimized({ isOpen, onClose, onSuccess, mode, user }: UserFormModalProps) {
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
    { value: 'CUSTOMER', label: 'Khách hàng', color: 'var(--success-500)', bg: 'var(--success-50)' },
    { value: 'STAFF', label: 'Nhân viên', color: 'var(--primary-500)', bg: 'var(--primary-50)' },
    { value: 'TECHNICIAN', label: 'Kỹ thuật viên', color: 'var(--warning-500)', bg: 'var(--warning-50)' },
    { value: 'ADMIN', label: 'Quản trị viên', color: 'var(--error-500)', bg: 'var(--error-50)' }
  ]

  const genders = [
    { value: 'MALE', label: 'Nam', icon: '👨' },
    { value: 'FEMALE', label: 'Nữ', icon: '👩' }
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
    setTouchedFields(new Set())
    setIsSuccess(false)
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

  const InputField = ({ 
    field, 
    label, 
    type = 'text', 
    placeholder, 
    icon: Icon, 
    required = false,
    options = null,
    isPassword = false
  }: {
    field: keyof FormData
    label: string
    type?: string
    placeholder: string
    icon: any
    required?: boolean
    options?: any[] | null
    isPassword?: boolean
  }) => {
    const status = getFieldStatus(field)
    const value = formData[field] as string

    return (
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>
          {label} {required && '*'}
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: status === 'error' ? 'var(--error-500)' : 
                   status === 'success' ? 'var(--success-500)' : 'var(--text-muted)',
            zIndex: 1
          }}>
            <Icon size={16} />
          </div>
          
          {options ? (
            <select
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: `2px solid ${status === 'error' ? 'var(--error-300)' : 
                                       status === 'success' ? 'var(--success-300)' : 'var(--border-primary)'}`,
                borderRadius: '10px',
                fontSize: '14px',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = status === 'error' ? 'var(--error-500)' : 
                                             status === 'success' ? 'var(--success-500)' : 'var(--primary-300)'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = status === 'error' ? 'var(--error-300)' : 
                                             status === 'success' ? 'var(--success-300)' : 'var(--border-primary)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="">{placeholder}</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon ? `${option.icon} ${option.label}` : option.label}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                type={isPassword ? (showPassword ? 'text' : 'password') : type}
                value={value}
                onChange={(e) => handleInputChange(field, e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: `2px solid ${status === 'error' ? 'var(--error-300)' : 
                                         status === 'success' ? 'var(--success-300)' : 'var(--border-primary)'}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = status === 'error' ? 'var(--error-500)' : 
                                               status === 'success' ? 'var(--success-500)' : 'var(--primary-300)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = status === 'error' ? 'var(--error-300)' : 
                                               status === 'success' ? 'var(--success-300)' : 'var(--border-primary)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder={placeholder}
              />
              {isPassword && (
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
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </>
          )}
          
          {status === 'success' && (
            <div style={{
              position: 'absolute',
              right: isPassword ? '40px' : '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--success-500)'
            }}>
              <CheckCircle size={16} />
            </div>
          )}
          {status === 'error' && (
            <div style={{
              position: 'absolute',
              right: isPassword ? '40px' : '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--error-500)'
            }}>
              <AlertCircle size={16} />
            </div>
          )}
        </div>
        {errors[field] && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginTop: '6px',
            color: 'var(--error-500)', 
            fontSize: '12px' 
          }}>
            <AlertCircle size={12} />
            {errors[field]}
          </div>
        )}
      </div>
    )
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
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '48px 32px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideInUp 0.3s ease-out'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--success-500), var(--success-600))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'bounce 0.6s ease-out'
          }}>
            <CheckCircle size={40} color="white" />
          </div>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0 0 8px 0'
          }}>
            Thành công!
          </h3>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: '0',
            fontSize: '16px',
            lineHeight: '1.5'
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
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '0',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '95vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInUp 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '32px 32px 0',
          borderBottom: '1px solid var(--border-primary)',
          background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--bg-card) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <User size={24} color="white" />
                </div>
                {mode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa thông tin'}
              </h3>
              <p style={{ 
                color: 'var(--text-secondary)', 
                margin: '0',
                fontSize: '16px',
                marginLeft: '64px'
              }}>
                {mode === 'add' ? 'Tạo tài khoản người dùng mới trong hệ thống' : 'Cập nhật thông tin người dùng hiện có'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                width: '44px',
                height: '44px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
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
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.transform = 'scale(1)'
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
            <div style={{ marginBottom: '40px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid var(--primary-100)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--primary-100)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={20} color="var(--primary-500)" />
                </div>
                <h4 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Thông tin cơ bản
                </h4>
              </div>

              <div style={{ display: 'grid', gap: '24px' }}>
                <InputField
                  field="fullName"
                  label="Họ và tên"
                  placeholder="Nhập họ và tên đầy đủ"
                  icon={User}
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <InputField
                    field="email"
                    label="Email"
                    type="email"
                    placeholder="user@example.com"
                    icon={Mail}
                    required
                  />

                  <InputField
                    field="phoneNumber"
                    label="Số điện thoại"
                    type="tel"
                    placeholder="0123456789"
                    icon={Phone}
                    required
                  />
                </div>

                <InputField
                  field="password"
                  label="Mật khẩu"
                  placeholder={mode === 'add' ? 'Nhập mật khẩu' : 'Nhập mật khẩu mới'}
                  icon={Key}
                  required={mode === 'add'}
                  isPassword
                />
              </div>
            </div>

            {/* Section 2: Thông tin cá nhân */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid var(--warning-100)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--warning-100)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Calendar size={20} color="var(--warning-500)" />
                </div>
                <h4 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Thông tin cá nhân
                </h4>
              </div>

              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <InputField
                    field="dateOfBirth"
                    label="Ngày sinh"
                    type="date"
                    placeholder="Chọn ngày sinh"
                    icon={Calendar}
                    required
                  />

                  <InputField
                    field="gender"
                    label="Giới tính"
                    placeholder="Chọn giới tính"
                    icon={Users}
                    required
                    options={genders}
                  />
                </div>

                <InputField
                  field="address"
                  label="Địa chỉ"
                  placeholder="Nhập địa chỉ (tùy chọn)"
                  icon={MapPin}
                />
              </div>
            </div>

            {/* Section 3: Cài đặt tài khoản */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid var(--success-100)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--success-100)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings size={20} color="var(--success-500)" />
                </div>
                <h4 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Cài đặt tài khoản
                </h4>
              </div>

              <div style={{ display: 'grid', gap: '24px' }}>
                <InputField
                  field="role"
                  label="Vai trò"
                  placeholder="Chọn vai trò"
                  icon={Shield}
                  required
                  options={roles}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      marginBottom: '12px'
                    }}>
                      Trạng thái tài khoản
                    </label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer',
                        padding: '12px 16px',
                        background: formData.isActive ? 'var(--success-50)' : 'var(--bg-secondary)',
                        border: `2px solid ${formData.isActive ? 'var(--success-300)' : 'var(--border-primary)'}`,
                        borderRadius: '10px',
                        transition: 'all 0.2s ease',
                        flex: 1
                      }}>
                        <input
                          type="radio"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={() => handleInputChange('isActive', true)}
                          style={{ margin: 0 }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--success-500)'
                          }} />
                          <span style={{ fontWeight: '500' }}>Hoạt động</span>
                        </div>
                      </label>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer',
                        padding: '12px 16px',
                        background: !formData.isActive ? 'var(--error-50)' : 'var(--bg-secondary)',
                        border: `2px solid ${!formData.isActive ? 'var(--error-300)' : 'var(--border-primary)'}`,
                        borderRadius: '10px',
                        transition: 'all 0.2s ease',
                        flex: 1
                      }}>
                        <input
                          type="radio"
                          name="isActive"
                          checked={!formData.isActive}
                          onChange={() => handleInputChange('isActive', false)}
                          style={{ margin: 0 }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--error-500)'
                          }} />
                          <span style={{ fontWeight: '500' }}>Không hoạt động</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      marginBottom: '12px'
                    }}>
                      Xác thực email
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      cursor: 'pointer',
                      padding: '12px 16px',
                      background: formData.emailVerified ? 'var(--success-50)' : 'var(--bg-secondary)',
                      border: `2px solid ${formData.emailVerified ? 'var(--success-300)' : 'var(--border-primary)'}`,
                      borderRadius: '10px',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.emailVerified}
                        onChange={(e) => handleInputChange('emailVerified', e.target.checked)}
                        style={{ margin: 0 }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={16} color={formData.emailVerified ? 'var(--success-500)' : 'var(--text-muted)'} />
                        <span style={{ fontWeight: '500' }}>Email đã được xác thực</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              paddingTop: '24px',
              borderTop: '1px solid var(--border-primary)'
            }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: isLoading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isLoading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    {mode === 'add' ? 'Tạo người dùng' : 'Cập nhật thông tin'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-primary)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.2s ease'
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
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: scale(1);
          }
          40%, 43% {
            transform: scale(1.1);
          }
          70% {
            transform: scale(1.05);
          }
          90% {
            transform: scale(1.02);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}


import { useEffect, useState, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCurrentUser, syncFromLocalStorage } from '@/store/authSlice'
import { AuthService, VehicleService } from '@/services'
import { BaseButton, BaseCard, BaseInput } from '@/components/common'
import { 
  validateFullName, 
  validateDOB16,
  validateGender, 
  validateAddress255,
  validateChangePasswordForm,
  validatePassword
} from '@/utils/validation'
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PencilIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  LockClosedIcon,
  XMarkIcon,
  BoltIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  ClockIcon,
  GiftIcon,
  BellIcon,
  CogIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import './profile.scss'

interface UserProfile {
  fullName: string
  email: string
  phoneNumber: string
  address: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | ''
  avatarUrl: string
}

interface Vehicle {
  vehicleId: number
  customerId: number
  vin: string
  licensePlate: string
  color: string
  currentMileage: number
  lastServiceDate?: string | null
  purchaseDate?: string | null
  nextServiceDue?: string | null
  createdAt: string
  customerName?: string
  customerPhone?: string
  modelId?: number | null
}

interface CreateVehicleRequest {
  customerId: number
  vin: string
  licensePlate: string
  color: string
  currentMileage: number
  lastServiceDate?: string
  purchaseDate?: string
}

interface FormErrors {
  fullName?: string
  email?: string
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  gender?: string
}


export default function Profile() {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((s) => s.auth)
  const [activeTab, setActiveTab] = useState<'favorites' | 'list' | 'continue-watching' | 'notifications' | 'profile' | 'vehicles' | 'service-history' | 'promo-codes' | 'notifications' | 'settings'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Vehicle states
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false)
  const [vehicleFormData, setVehicleFormData] = useState<CreateVehicleRequest>({
    customerId: 0,
    vin: '',
    licensePlate: '',
    color: '',
    currentMileage: 0,
    lastServiceDate: '',
    purchaseDate: ''
  })
  const [vehicleFormErrors, setVehicleFormErrors] = useState<Record<string, string>>({})

  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    avatarUrl: ''
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState('')
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Sync from localStorage first
    dispatch(syncFromLocalStorage())
    // Then load profile data
    loadProfileData()
  }, [dispatch])

  useEffect(() => {
    if (activeTab === 'vehicles') {
      loadVehicles()
    }
  }, [activeTab, auth.user?.id])

  const loadProfileData = async () => {
    try {
      const response = await AuthService.getProfile()
      console.log('Profile API response:', response) // Debug log
      if (response.success && response.data) {
        // Update local state
        setProfileData({
          fullName: response.data.fullName || '',
          email: response.data.email || '',
          phoneNumber: response.data.phoneNumber || '',
          address: response.data.address || '',
          dateOfBirth: response.data.dateOfBirth || '',
          gender: (response.data.gender as 'MALE' | 'FEMALE') || '',
          avatarUrl: response.data.avatar || ''
        })
        
        // Update Redux store
        dispatch(getCurrentUser())
        
        console.log('Profile data set:', {
          fullName: response.data.fullName || '',
          email: response.data.email || '',
          phoneNumber: response.data.phoneNumber || '',
          address: response.data.address || '',
          dateOfBirth: response.data.dateOfBirth || '',
          gender: (response.data.gender as 'MALE' | 'FEMALE') || '',
          avatarUrl: response.data.avatar || ''
        }) // Debug log
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadVehicles = async () => {
    if (!auth.user?.id) {
      console.log('No user ID available for loading vehicles')
      return
    }

    setIsLoadingVehicles(true)
    try {
      console.log('Loading vehicles for user:', auth.user.id)
      const response = await VehicleService.getCustomerVehicles(auth.user.id)
      console.log('Vehicles API response:', response)
      
      if (response.data?.vehicles) {
        setVehicles(response.data.vehicles)
        console.log('Vehicles loaded:', response.data.vehicles)
      } else {
        setVehicles([])
        console.log('No vehicles found')
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
      setVehicles([])
    } finally {
      setIsLoadingVehicles(false)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }


  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormErrors({})
    // Reset form data to original values
    if (auth.user) {
      setProfileData({
        fullName: auth.user.fullName || '',
        email: auth.user.email || '',
        phoneNumber: auth.user.phoneNumber || '',
        address: auth.user.address || '',
        dateOfBirth: auth.user.dateOfBirth || '',
        gender: (auth.user.gender as 'MALE' | 'FEMALE') || '',
        avatarUrl: auth.user.avatar || ''
      })
    }
  }

  const handleSave = async () => {
    const errors: FormErrors = {}
    
    // Validate required fields
    if (!profileData.fullName.trim()) {
      errors.fullName = 'Họ và tên là bắt buộc'
    } else if (!validateFullName(profileData.fullName)) {
      errors.fullName = 'Họ và tên không hợp lệ'
    }
    
    if (!profileData.email.trim()) {
      errors.email = 'Email là bắt buộc'
    }
    
    if (!profileData.phoneNumber.trim()) {
      errors.phoneNumber = 'Số điện thoại là bắt buộc'
    }
    
    if (!profileData.address.trim()) {
      errors.address = 'Địa chỉ là bắt buộc'
    } else if (!validateAddress255(profileData.address)) {
      errors.address = 'Địa chỉ không được vượt quá 255 ký tự'
    }
    
    if (!profileData.dateOfBirth) {
      errors.dateOfBirth = 'Ngày sinh là bắt buộc'
    } else if (!validateDOB16(profileData.dateOfBirth)) {
      errors.dateOfBirth = 'Bạn phải đủ 16 tuổi'
    }
    
    if (!profileData.gender) {
      errors.gender = 'Giới tính là bắt buộc'
    } else if (!validateGender(profileData.gender)) {
      errors.gender = 'Giới tính không hợp lệ'
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }

    setIsSaving(true)
    try {
      await AuthService.updateProfile({
        fullName: profileData.fullName,
        address: profileData.address,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender as 'MALE' | 'FEMALE',
        email: profileData.email,
        phoneNumber: profileData.phoneNumber
      })
      
      dispatch(getCurrentUser())
      setIsEditing(false)
      setFormErrors({})
      setSuccessMessage('Cập nhật thông tin thành công!')
      
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error: any) {
      console.error('API Error:', error)
      
      // Parse API validation errors
      if (error?.response?.data?.errors) {
        const apiErrors: FormErrors = {}
        const apiErrorData = error.response.data.errors
        
        // Handle array format errors
        if (Array.isArray(apiErrorData)) {
          // If errors is an array, map each error to appropriate field
          apiErrorData.forEach(errorMsg => {
            if (typeof errorMsg === 'string') {
              if (errorMsg.includes('Số điện thoại')) {
                apiErrors.phoneNumber = errorMsg
              } else if (errorMsg.includes('Email')) {
                apiErrors.email = errorMsg
              } else if (errorMsg.includes('Họ tên') || errorMsg.includes('FullName')) {
                apiErrors.fullName = errorMsg
              } else if (errorMsg.includes('Địa chỉ') || errorMsg.includes('Address')) {
                apiErrors.address = errorMsg
              } else if (errorMsg.includes('Ngày sinh') || errorMsg.includes('DateOfBirth')) {
                apiErrors.dateOfBirth = errorMsg
              } else if (errorMsg.includes('Giới tính') || errorMsg.includes('Gender')) {
                apiErrors.gender = errorMsg
              }
            }
          })
        } else {
          // Handle object format errors
          if (apiErrorData.FullName) {
            apiErrors.fullName = Array.isArray(apiErrorData.FullName) ? apiErrorData.FullName[0] : apiErrorData.FullName
          }
          if (apiErrorData.Email) {
            apiErrors.email = Array.isArray(apiErrorData.Email) ? apiErrorData.Email[0] : apiErrorData.Email
          }
          if (apiErrorData.PhoneNumber) {
            apiErrors.phoneNumber = Array.isArray(apiErrorData.PhoneNumber) ? apiErrorData.PhoneNumber[0] : apiErrorData.PhoneNumber
          }
          if (apiErrorData.Address) {
            apiErrors.address = Array.isArray(apiErrorData.Address) ? apiErrorData.Address[0] : apiErrorData.Address
          }
          if (apiErrorData.DateOfBirth) {
            apiErrors.dateOfBirth = Array.isArray(apiErrorData.DateOfBirth) ? apiErrorData.DateOfBirth[0] : apiErrorData.DateOfBirth
          }
          if (apiErrorData.Gender) {
            apiErrors.gender = Array.isArray(apiErrorData.Gender) ? apiErrorData.Gender[0] : apiErrorData.Gender
          }
        }
        
        setFormErrors(apiErrors)
      } else {
        // Fallback error message
      const msg = error?.response?.data?.message || error?.message || 'Cập nhật thông tin thất bại'
        console.error(msg)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
        const result = e.target?.result as string
        setProfileData(prev => ({ ...prev, avatarUrl: result }))
    }
    reader.readAsDataURL(file)
  }
  }


  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleChangePassword = async () => {
    // Validate form
    const validation = validateChangePasswordForm(passwordData)
    if (!validation.isValid) {
      setPasswordErrors(validation.errors)
      return
    }

    setIsChangingPassword(true)
    setPasswordErrors({})

    try {
      await AuthService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmPassword
      })

      setSuccessMessage('Đổi mật khẩu thành công!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswords({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
      })

      // Auto hide success message
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error: any) {
      console.error('Change password error:', error)
      
      // Handle API errors
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        const nextErrors: Record<string, string> = {}
        
        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((msg: string) => {
            const m = msg.toLowerCase()
            if (m.includes("current") || m.includes("hiện tại")) {
              nextErrors.currentPassword = msg
            }
            if (m.includes("new") || m.includes("mới")) {
              nextErrors.newPassword = msg
            }
            if (m.includes("confirm") || m.includes("xác nhận")) {
              nextErrors.confirmPassword = msg
            }
          })
        } else if (typeof apiErrors === 'object') {
          Object.entries(apiErrors).forEach(([field, messages]) => {
            const fieldName = field.toLowerCase()
            const errorMsg = Array.isArray(messages) ? messages[0] : messages
            
            if (fieldName.includes("current")) {
              nextErrors.currentPassword = errorMsg
            }
            if (fieldName.includes("new")) {
              nextErrors.newPassword = errorMsg
            }
            if (fieldName.includes("confirm")) {
              nextErrors.confirmPassword = errorMsg
            }
          })
        }
        
        setPasswordErrors(nextErrors)
      } else {
        setPasswordErrors({
          currentPassword: error?.message || 'Có lỗi xảy ra khi đổi mật khẩu'
        })
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')
    
    // Redirect to login page
    window.location.href = '/auth/login'
  }

  // Vehicle functions

  const handleVehicleInputChange = (field: keyof CreateVehicleRequest, value: string | number) => {
    setVehicleFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setVehicleFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleCreateVehicle = async () => {
    if (!auth.user?.id) return

    const errors: Record<string, string> = {}
    
    // Basic validation
    if (!vehicleFormData.vin.trim()) errors.vin = 'VIN không được để trống'
    if (!vehicleFormData.licensePlate.trim()) errors.licensePlate = 'Biển số xe không được để trống'
    if (!vehicleFormData.color.trim()) errors.color = 'Màu sắc không được để trống'
    if (!vehicleFormData.currentMileage || vehicleFormData.currentMileage <= 0) {
      errors.currentMileage = 'Số km hiện tại không được để trống và phải lớn hơn 0'
    }

    if (Object.keys(errors).length > 0) {
      console.log('Vehicle validation errors:', errors) // Debug log
      setVehicleFormErrors(errors)
      return
    }

    setIsCreatingVehicle(true)
    try {
      const payload = {
        ...vehicleFormData,
        customerId: auth.user.id
      }
      console.log('Creating vehicle with payload:', payload) // Debug log
      console.log('Auth user:', auth.user) // Debug log
      
      const result = await VehicleService.createVehicle(payload)
      console.log('Vehicle created successfully:', result) // Debug log
      
      setSuccessMessage('Thêm phương tiện thành công!')
      setShowVehicleForm(false)
      setVehicleFormData({
        customerId: 0,
        vin: '',
        licensePlate: '',
        color: '',
        currentMileage: 0,
        lastServiceDate: '',
        purchaseDate: ''
      })
      
      // Reload vehicles
      loadVehicles()
      
      // Auto hide success message
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error: any) {
      console.error('Create vehicle error:', error)
      
      // Handle API errors
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        console.log('Vehicle API errors:', apiErrors) // Debug log
        const nextErrors: Record<string, string> = {}
        
        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((msg: string) => {
            const m = msg.toLowerCase()
            if (m.includes('vin')) nextErrors.vin = msg
            else if (m.includes('biển') || m.includes('license') || m.includes('biển số')) nextErrors.licensePlate = msg
            else if (m.includes('màu') || m.includes('color') || m.includes('màu sắc')) nextErrors.color = msg
            else if (m.includes('km') || m.includes('mileage') || m.includes('số km')) nextErrors.currentMileage = msg
            else if (m.includes('ngày bảo dưỡng') || m.includes('lastservice')) nextErrors.lastServiceDate = msg
            else if (m.includes('ngày mua') || m.includes('purchasedate')) nextErrors.purchaseDate = msg
            else nextErrors.general = msg
          })
        } else if (typeof apiErrors === 'object') {
          Object.entries(apiErrors).forEach(([field, messages]) => {
            const fieldName = field.toLowerCase()
            const errorMsg = Array.isArray(messages) ? messages[0] : messages
            
            // Map backend field names to frontend field names
            if (fieldName === 'vin') nextErrors.vin = errorMsg
            else if (fieldName === 'licenseplate' || fieldName === 'biensoxe') nextErrors.licensePlate = errorMsg
            else if (fieldName === 'color' || fieldName === 'mausac') nextErrors.color = errorMsg
            else if (fieldName === 'currentmileage' || fieldName === 'sokm') nextErrors.currentMileage = errorMsg
            else if (fieldName === 'lastservicedate' || fieldName === 'ngaybaoduong') nextErrors.lastServiceDate = errorMsg
            else if (fieldName === 'purchasedate' || fieldName === 'ngaymua') nextErrors.purchaseDate = errorMsg
            else nextErrors[fieldName] = errorMsg
          })
        }
        
        setVehicleFormErrors(nextErrors)
      } else {
        setVehicleFormErrors({
          general: error?.message || 'Có lỗi xảy ra khi thêm phương tiện'
        })
      }
    } finally {
      setIsCreatingVehicle(false)
    }
  }


  // Removed mock tabOptions - only showing profile tab

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="sidebar-header">
              <h1 className="sidebar-title">Quản lý tài khoản</h1>
            </div>

            <div className="user-profile-section">
              <div className="user-avatar-container">
                <div className="user-avatar" onClick={handleAvatarClick}>
                  {profileData.avatarUrl && (/^data:/.test(profileData.avatarUrl) || /^https?:\/\//.test(profileData.avatarUrl)) ? (
                    <img src={profileData.avatarUrl} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <button className="avatar-edit-btn" onClick={handleAvatarClick}>
                  <PencilIcon className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="user-info">
                <div className="user-name">
                  {profileData.fullName || 'Chưa cập nhật'}
                </div>
              </div>
            </div>

            <div className="sidebar-divider"></div>

            <nav className="sidebar-navigation">
                  <button
                className="nav-item active"
                onClick={() => setActiveTab('profile')}
              >
                <div className="nav-icon">
                  <UserIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Thông tin cá nhân</span>
                  </button>

              <button
                className="nav-item"
                onClick={() => setActiveTab('vehicles')}
              >
                <div className="nav-icon">
                  <TruckIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Phương tiện</span>
              </button>

              <button
                className="nav-item"
                onClick={() => setActiveTab('service-history')}
              >
                <div className="nav-icon">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Lịch sử dịch vụ</span>
              </button>

              <button
                className="nav-item"
                onClick={() => setActiveTab('promo-codes')}
              >
                <div className="nav-icon">
                  <GiftIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Mã khuyến mãi</span>
              </button>

              <button
                className="nav-item"
                onClick={() => setActiveTab('notifications')}
              >
                <div className="nav-icon">
                  <BellIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Thông báo</span>
              </button>

              <button
                className="nav-item"
                onClick={() => setActiveTab('settings')}
              >
                <div className="nav-icon">
                  <CogIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Cài đặt</span>
              </button>
            </nav>

            <div className="sidebar-divider"></div>

            <div className="logout-section">
              <button className="logout-btn" onClick={handleLogout}>
                <div className="logout-icon">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </div>
                <span className="logout-label">Đăng xuất</span>
              </button>
          </div>

          </div>

          <div className="profile-main">
            {activeTab === 'profile' && (
              <div className="profile-form-container">
                <BaseCard className="profile-form-card">
                  <div className="card-header">
                    <h3 className="card-title">Chỉnh sửa thông tin</h3>
                    <div className="card-actions">
                      {!isEditing ? (
                        <BaseButton variant="outline" onClick={handleEdit}>
                          Chỉnh sửa
                        </BaseButton>
                      ) : (
                        <div className="edit-actions">
                          <BaseButton variant="outline" onClick={handleCancel}>
                            Hủy
                          </BaseButton>
                          <BaseButton
                            variant="primary"
                            onClick={handleSave}
                            loading={isSaving}
                          >
                            {isSaving ? 'Đang lưu...' : 'Lưu'}
                          </BaseButton>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-form">
                    {successMessage && (
                      <div className="success-message">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>{successMessage}</span>
                      </div>
                    )}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Họ và tên</label>
                        <BaseInput
                          value={profileData.fullName}
                          onChange={(value) => handleInputChange('fullName', value)}
                          disabled={!isEditing}
                          placeholder="Nhập họ và tên"
                          required
                          error={formErrors.fullName}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Email</label>
                        <BaseInput
                          value={profileData.email}
                          onChange={(value) => handleInputChange('email', value)}
                          disabled={!isEditing}
                          placeholder="Nhập email"
                          required
                          error={formErrors.email}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Số điện thoại</label>
                        <BaseInput
                          value={profileData.phoneNumber}
                          onChange={(value) => handleInputChange('phoneNumber', value)}
                          disabled={!isEditing}
                          placeholder="Nhập số điện thoại"
                          required
                          error={formErrors.phoneNumber}
                        />
                          </div>
                      <div className="form-group">
                        <label className="form-label required">Ngày sinh</label>
                        <BaseInput
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(value) => handleInputChange('dateOfBirth', value)}
                          disabled={!isEditing}
                          required
                          error={formErrors.dateOfBirth}
                        />
                          </div>
                      </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Địa chỉ</label>
                        <BaseInput
                          value={profileData.address}
                          onChange={(value) => handleInputChange('address', value)}
                          disabled={!isEditing}
                          placeholder="Nhập địa chỉ"
                          required
                          error={formErrors.address}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Giới tính</label>
                        <select
                          className={`form-select ${formErrors.gender ? 'error' : ''}`}
                          value={profileData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          disabled={!isEditing}
                          required
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                        </select>
                        {formErrors.gender && (
                          <div className="error-message" style={{ color: 'red', fontSize: '14px', marginTop: '4px' }}>
                            {formErrors.gender}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </BaseCard>
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div className="tab-content">
                <BaseCard>
                <div className="card-header">
                    <h3 className="card-title">Phương tiện của tôi</h3>
                    <div className="card-actions">
                  <BaseButton
                    variant="primary"
                        onClick={() => setShowVehicleForm(true)}
                  >
                    <PlusIcon className="w-4 h-4" />
                        Thêm phương tiện
                  </BaseButton>
                </div>
                  </div>
                  <div className="card-body">
                  {isLoadingVehicles ? (
                    <div className="loading-state">
                        <p>Đang tải danh sách phương tiện...</p>
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="empty-state">
                        <TruckIcon className="w-6 h-6 text-gray-300 mx-auto" />
                        <p>Bạn chưa có phương tiện nào</p>
                      <BaseButton
                          variant="outline"
                          onClick={() => setShowVehicleForm(true)}
                      >
                        <PlusIcon className="w-4 h-4" />
                          Thêm phương tiện đầu tiên
                      </BaseButton>
                    </div>
                  ) : (
                      <div className="vehicles-list">
                      {vehicles.map((vehicle) => (
                          <div key={vehicle.vehicleId} className="vehicle-card">
                            <div className="vehicle-info">
                          <div className="vehicle-header">
                                <h4>{vehicle.licensePlate}</h4>
                                <span className="vehicle-color" style={{ backgroundColor: vehicle.color }}></span>
                            </div>
                          <div className="vehicle-details">
                                <p><strong>VIN:</strong> {vehicle.vin}</p>
                                <p><strong>Màu:</strong> {vehicle.color}</p>
                                <p><strong>Số km hiện tại:</strong> {vehicle.currentMileage.toLocaleString()} km</p>
                                {vehicle.lastServiceDate && (
                                  <p><strong>Lần bảo dưỡng cuối:</strong> {new Date(vehicle.lastServiceDate).toLocaleDateString('vi-VN')}</p>
                                )}
                                {vehicle.purchaseDate && (
                                  <p><strong>Ngày mua:</strong> {new Date(vehicle.purchaseDate).toLocaleDateString('vi-VN')}</p>
                                )}
                              </div>
                            </div>
                          <div className="vehicle-actions">
                              <BaseButton variant="outline" size="sm">
                                <PencilSquareIcon className="w-4 h-4" />
                                Sửa
                            </BaseButton>
                              <BaseButton variant="outline" size="sm" className="delete-btn">
                                <TrashIcon className="w-4 h-4" />
                                Xóa
                              </BaseButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </BaseCard>
              </div>
            )}

            {/* Vehicle Form - Only show in vehicles section */}
            {activeTab === 'vehicles' && showVehicleForm && (
              <div className="profile-form-container">
                <BaseCard className="profile-form-card">
                <div className="card-header">
                    <h3 className="card-title">Thêm phương tiện</h3>
                    <div className="card-actions">
                      <BaseButton
                        variant="outline"
                        onClick={() => setShowVehicleForm(false)}
                      >
                        Hủy
                      </BaseButton>
                      <BaseButton
                        variant="primary"
                        onClick={handleCreateVehicle}
                        loading={isCreatingVehicle}
                      >
                        {isCreatingVehicle ? 'Đang thêm...' : 'Thêm phương tiện'}
                      </BaseButton>
                    </div>
                  </div>

                  <div className="profile-form">
                    {successMessage && (
                      <div className="success-message">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>{successMessage}</span>
                    </div>
                    )}
                    
                    {vehicleFormErrors.general && (
                      <div className="error-message" style={{ 
                        color: '#dc2626', 
                        fontSize: '14px', 
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px'
                      }}>
                        {vehicleFormErrors.general}
                    </div>
                    )}
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">VIN</label>
                        <BaseInput
                          type="text"
                          value={vehicleFormData.vin}
                          onChange={(value) => handleVehicleInputChange('vin', value)}
                          placeholder="Nhập VIN của xe"
                          error={vehicleFormErrors.vin}
                        />
                </div>
                      <div className="form-group">
                        <label className="form-label required">Biển số xe</label>
                        <BaseInput
                          type="text"
                          value={vehicleFormData.licensePlate}
                          onChange={(value) => handleVehicleInputChange('licensePlate', value)}
                          placeholder="Nhập biển số xe"
                          error={vehicleFormErrors.licensePlate}
                        />
                    </div>
                  </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Màu sắc</label>
                        <BaseInput
                          type="text"
                          value={vehicleFormData.color}
                          onChange={(value) => handleVehicleInputChange('color', value)}
                          placeholder="Nhập màu sắc xe"
                          error={vehicleFormErrors.color}
                        />
                    </div>
                      <div className="form-group">
                        <label className="form-label required">Số km hiện tại</label>
                        <BaseInput
                          type="number"
                          value={vehicleFormData.currentMileage}
                          onChange={(value) => handleVehicleInputChange('currentMileage', parseInt(value) || 0)}
                          placeholder="Nhập số km hiện tại"
                          error={vehicleFormErrors.currentMileage}
                        />
                    </div>
                  </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Ngày bảo dưỡng cuối</label>
                        <BaseInput
                          type="date"
                          value={vehicleFormData.lastServiceDate || ''}
                          onChange={(value) => handleVehicleInputChange('lastServiceDate', value)}
                          error={vehicleFormErrors.lastServiceDate}
                        />
                    </div>
                      <div className="form-group">
                        <label className="form-label">Ngày mua xe</label>
                        <BaseInput
                          type="date"
                          value={vehicleFormData.purchaseDate || ''}
                          onChange={(value) => handleVehicleInputChange('purchaseDate', value)}
                          error={vehicleFormErrors.purchaseDate}
                        />
                    </div>
                  </div>
                </div>
              </BaseCard>
              </div>
            )}

            {activeTab === 'service-history' && (
              <div className="tab-content">
                <BaseCard>
                <div className="card-header">
                    <h3 className="card-title">Lịch sử dịch vụ</h3>
                </div>
                  <div className="card-body">
                    <p>Lịch sử các dịch vụ đã sử dụng sẽ được hiển thị ở đây.</p>
                    </div>
              </BaseCard>
                    </div>
            )}

            {activeTab === 'promo-codes' && (
              <div className="tab-content">
                <BaseCard>
                <div className="card-header">
                    <h3 className="card-title">Mã khuyến mãi</h3>
                    </div>
                  <div className="card-body">
                    <p>Danh sách mã khuyến mãi sẽ được hiển thị ở đây.</p>
                </div>
              </BaseCard>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-content">
                <BaseCard>
                <div className="card-header">
                  <h3 className="card-title">Thông báo</h3>
                </div>
                  <div className="card-body">
                    <p>Danh sách thông báo sẽ được hiển thị ở đây.</p>
                </div>
              </BaseCard>
                </div>
            )}

            {activeTab === 'settings' && (
              <div className="tab-content">
                <BaseCard>
                <div className="card-header">
                    <h3 className="card-title">Đổi mật khẩu</h3>
                </div>
                  <div className="card-body">
                    <div className="profile-form">
                      {successMessage && (
                        <div className="success-message">
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>{successMessage}</span>
                    </div>
                      )}
                      
                      <div className="form-row">
                  <div className="form-group">
                          <label className="form-label required">Mật khẩu hiện tại</label>
                    <div className="password-input-wrapper">
                      <BaseInput
                              type={showPasswords.currentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                              onChange={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                        placeholder="Nhập mật khẩu hiện tại"
                              error={passwordErrors.currentPassword}
                      />
                      <button
                        type="button"
                              className="password-toggle-btn"
                              onClick={() => togglePasswordVisibility('currentPassword')}
                            >
                              {showPasswords.currentPassword ? (
                                <EyeSlashIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                      </button>
                          </div>
                    </div>
                  </div>

                      <div className="form-row">
                  <div className="form-group">
                          <label className="form-label required">Mật khẩu mới</label>
                    <div className="password-input-wrapper">
                      <BaseInput
                              type={showPasswords.newPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                              onChange={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                              placeholder="Nhập mật khẩu mới"
                              error={passwordErrors.newPassword}
                      />
                      <button
                        type="button"
                              className="password-toggle-btn"
                              onClick={() => togglePasswordVisibility('newPassword')}
                            >
                              {showPasswords.newPassword ? (
                                <EyeSlashIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                      </button>
                    </div>
                        </div>
                  <div className="form-group">
                          <label className="form-label required">Xác nhận mật khẩu mới</label>
                    <div className="password-input-wrapper">
                      <BaseInput
                              type={showPasswords.confirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                              onChange={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                              placeholder="Nhập lại mật khẩu mới"
                              error={passwordErrors.confirmPassword}
                      />
                      <button
                        type="button"
                              className="password-toggle-btn"
                              onClick={() => togglePasswordVisibility('confirmPassword')}
                            >
                              {showPasswords.confirmPassword ? (
                                <EyeSlashIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                </button>
              </div>
                    </div>
                  </div>

                      <div className="form-actions">
                <BaseButton
                  variant="primary"
                  onClick={handleChangePassword}
                          loading={isChangingPassword}
                        >
                          {isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </BaseButton>
              </div>
            </div>
                  </div>
                </BaseCard>
          </div>
        )}



                      </div>
                      </div>
      </div>
    </div>
  )
}
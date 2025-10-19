import { useEffect, useState, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCurrentUser } from '@/store/authSlice'
import { AuthService } from '@/services'
import { BaseButton, BaseCard, BaseInput } from '@/components/common'
import { 
  validateFullName, 
  validateDOB16,
  validateGender, 
  validateAddress255,
  validateChangePasswordForm,
  validatePassword
} from '@/utils/validation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faPencil,
  faRightFromBracket,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faExclamationTriangle,
  faKey,
  faLock,
  faTimes,
  faBolt,
  faPhone,
  faEnvelope,
  faHistory,
  faStar
} from '@fortawesome/free-solid-svg-icons'
import { FeedbackCard } from '@/components/feedback'
import { mockFeedbackService } from '@/data/mockFeedbackData'
import { BookingData } from '@/services/feedbackService'
import { FeedbackData } from '@/components/feedback'
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

interface FormErrors {
  fullName?: string
  email?: string
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  gender?: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function Profile() {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((s) => s.auth)
  const [activeTab, setActiveTab] = useState<'favorites' | 'list' | 'continue-watching' | 'notifications' | 'profile' | 'maintenance'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Maintenance History states
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null)
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

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
    loadProfileData()
  }, [])

  // Load maintenance history data
  const loadMaintenanceData = async () => {
    setMaintenanceLoading(true)
    setMaintenanceError(null)
    try {
      const data = await mockFeedbackService.getBookingsWithFeedback()
      setBookings(data)
      
      // Set first booking as expanded by default
      if (data.length > 0) {
        setExpandedBookings(new Set([data[0].id]))
      }
    } catch (err: any) {
      setMaintenanceError('Không thể tải dữ liệu lịch sử bảo dưỡng')
      console.error('Error loading maintenance data:', err)
    } finally {
      setMaintenanceLoading(false)
    }
  }

  // Handle toggle expand for booking cards
  const handleToggleExpand = (bookingId: string) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId)
      } else {
        newSet.add(bookingId)
      }
      return newSet
    })
  }

  // Handle feedback submission
  const handleSubmitFeedback = async (bookingId: string, feedback: FeedbackData) => {
    try {
      await mockFeedbackService.submitFeedback(bookingId, feedback)
      // Reload data to show updated feedback
      await loadMaintenanceData()
    } catch (err: any) {
      setMaintenanceError('Không thể gửi đánh giá')
      console.error('Error submitting feedback:', err)
    }
  }

  // Handle feedback update
  const handleEditFeedback = async (bookingId: string, feedback: FeedbackData) => {
    try {
      await mockFeedbackService.updateFeedback(bookingId, feedback)
      // Reload data to show updated feedback
      await loadMaintenanceData()
    } catch (err: any) {
      setMaintenanceError('Không thể cập nhật đánh giá')
      console.error('Error updating feedback:', err)
    }
  }

  const loadProfileData = async () => {
    try {
      const response = await AuthService.getProfile()
      if (response.success && response.data) {
        setProfileData({
          fullName: response.data.fullName || '',
          email: response.data.email || '',
          phoneNumber: response.data.phoneNumber || '',
          address: response.data.address || '',
          dateOfBirth: response.data.dateOfBirth || '',
          gender: (response.data.gender as 'MALE' | 'FEMALE') || '',
          avatarUrl: response.data.avatar || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePasswordInputChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
    
    if (field === 'newPassword') {
      const validation = validatePassword(value)
      setPasswordStrength(validation.isValid ? 'strong' : 'weak')
      
      setPasswordRequirements({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      })
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

  const handlePasswordSave = async () => {
    const errors = validateChangePasswordForm(passwordForm)
    if (Object.keys(errors).length > 0) {
      alert('Vui lòng kiểm tra lại thông tin')
      return
    }

    setIsSaving(true)
    try {
      await AuthService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmPassword
      })

      setShowPasswordModal(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setPasswordStrength('')
      setPasswordRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      })
      alert('Đổi mật khẩu thành công!')
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Đổi mật khẩu thất bại'
      alert(msg)
    } finally {
      setIsSaving(false)
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
                  <FontAwesomeIcon icon={faPencil} />
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
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <div className="nav-icon">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <span className="nav-label">Thông tin cá nhân</span>
              </button>
              
              <button
                className={`nav-item ${activeTab === 'maintenance' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('maintenance')
                  if (bookings.length === 0) {
                    loadMaintenanceData()
                  }
                }}
              >
                <div className="nav-icon">
                  <FontAwesomeIcon icon={faHistory} />
                </div>
                <span className="nav-label">Lịch sử bảo dưỡng</span>
              </button>
            </nav>

            <div className="sidebar-divider"></div>

            <div className="logout-section">
              <button className="logout-btn" onClick={handleLogout}>
                <div className="logout-icon">
                  <FontAwesomeIcon icon={faRightFromBracket} />
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
                        <FontAwesomeIcon icon={faCheckCircle} />
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

            {activeTab === 'maintenance' && (
              <div className="maintenance-history-container">
                <BaseCard className="maintenance-history-card">
                  <div className="card-header">
                    <h3 className="card-title">
                      <FontAwesomeIcon icon={faHistory} />
                      Lịch sử bảo dưỡng
                    </h3>
                    <p className="card-subtitle">Xem lịch sử dịch vụ và đánh giá trải nghiệm của bạn</p>
                  </div>

                  {/* Stats */}
                  <div className="maintenance-stats">
                    <div className="stat-item">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faHistory} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{bookings.length}</div>
                        <div className="stat-label">Tổng dịch vụ</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{bookings.filter(b => b.status === 'completed').length}</div>
                        <div className="stat-label">Đã hoàn thành</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faStar} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{bookings.filter(b => b.feedback).length}</div>
                        <div className="stat-label">Đã đánh giá</div>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="maintenance-filters">
                    <div className="filter-search">
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo dịch vụ, kỹ thuật viên, phụ tùng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Status Filter Chips */}
                    <div className="filter-status-chips">
                      <button
                        className={`status-chip ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                      >
                        Tất cả
                      </button>
                      <button
                        className={`status-chip ${statusFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('completed')}
                      >
                        Hoàn thành
                      </button>
                      <button
                        className={`status-chip ${statusFilter === 'in-progress' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('in-progress')}
                      >
                        Đang tiến hành
                      </button>
                      <button
                        className={`status-chip ${statusFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                      >
                        Chờ xử lý
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {maintenanceError && (
                    <div className="maintenance-error">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <span>{maintenanceError}</span>
                    </div>
                  )}

                  {/* Bookings List */}
                  {maintenanceLoading ? (
                    <div className="maintenance-loading">
                      <div className="loading-spinner"></div>
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  ) : (
                    <div className="maintenance-list">
                      {bookings
                        .filter(booking => {
                          const matchesSearch = booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                               booking.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                               booking.partsUsed.some(part => part.toLowerCase().includes(searchTerm.toLowerCase()))
                          
                          const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
                          
                          return matchesSearch && matchesStatus
                        })
                        .length === 0 ? (
                        <div className="maintenance-empty">
                          <div className="empty-icon">
                            <FontAwesomeIcon icon={faHistory} />
                          </div>
                          <h3>Không có dịch vụ nào</h3>
                          <p>
                            {searchTerm || statusFilter !== 'all'
                              ? 'Không tìm thấy dịch vụ phù hợp với bộ lọc'
                              : 'Bạn chưa có dịch vụ nào trong hệ thống'
                            }
                          </p>
                        </div>
                      ) : (
                        bookings
                          .filter(booking => {
                            const matchesSearch = booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 booking.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 booking.partsUsed.some(part => part.toLowerCase().includes(searchTerm.toLowerCase()))
                            
                            const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
                            
                            return matchesSearch && matchesStatus
                          })
                          .map((booking) => (
                            <FeedbackCard
                              key={booking.id}
                              booking={booking}
                              onSubmitFeedback={handleSubmitFeedback}
                              onEditFeedback={handleEditFeedback}
                              isExpanded={expandedBookings.has(booking.id)}
                              onToggleExpand={handleToggleExpand}
                            />
                          ))
                      )}
                    </div>
                  )}
                </BaseCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
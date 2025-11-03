import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateUser } from '@/store/authSlice'
import { AuthService } from '@/services/authService'
import { Camera, Lock, X, Edit, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import './TechnicianProfile.scss'

// Popup notification component
const PopupNotification = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="popup-notification">
      <div className={`popup-content popup-${type}`}>
        <div className="popup-icon">
          {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
        </div>
        <span className="popup-message">{message}</span>
        <X size={16} className="popup-close" onClick={onClose} />
      </div>
    </div>
  )
}

export default function TechnicianProfile() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [popup, setPopup] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Edit modes
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  
  // Profile data
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE')
  const [avatar, setAvatar] = useState<string | null>(null)
  
  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})

  // Helper functions for notifications
  const setSuccessMessage = (message: string) => {
    setPopup({ message, type: 'success' })
  }

  const setErrorMessage = (message: string) => {
    setPopup({ message, type: 'error' })
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      const response = await AuthService.getProfile()
      
      if (response.success && response.data) {
        const userData = response.data
        setFullName(userData.fullName || '')
        setEmail(userData.email || '')
        setPhoneNumber(userData.phoneNumber || '')
        setAddress(userData.address || '')
        setDateOfBirth(userData.dateOfBirth || '')
        setGender(userData.gender as 'MALE' | 'FEMALE' || 'MALE')
        setAvatar(userData.avatar || null)
      } else {
        setPopup({ message: response.message || 'Không thể tải thông tin cá nhân', type: 'error' })
      }
    } catch (err: unknown) {
      setPopup({ message: 'Có lỗi xảy ra khi tải thông tin cá nhân', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const validatePassword = () => {
    const errors: { [key: string]: string } = {}
    
    if (!currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }
    
    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }
    
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      const response = await AuthService.updateProfile({
        fullName,
        email,
        phoneNumber,
        address,
        dateOfBirth,
        gender
      })
      
      if (response.success && response.data) {
        dispatch(updateUser(response.data))
        setPopup({ message: 'Cập nhật thông tin thành công!', type: 'success' })
        setIsEditingPersonal(false)
      } else {
        setPopup({ message: response.message || 'Cập nhật thông tin thất bại', type: 'error' })
      }
    } catch (err: unknown) {
      setPopup({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!validatePassword()) return
    
    try {
      setSaving(true)
      
      const response = await AuthService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword
      })
      
      if (response.success) {
        setPopup({ message: 'Đổi mật khẩu thành công!', type: 'success' })
        setShowPasswordModal(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPopup({ message: response.message || 'Đổi mật khẩu thất bại', type: 'error' })
      }
    } catch (err: unknown) {
      setPopup({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra khi đổi mật khẩu', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setSaving(true)
      const response = await AuthService.uploadAvatar(file)
      
      if (response.success && response.data) {
        setAvatar(response.data.avatarUrl || response.data.avatar)
        setSuccessMessage('Cập nhật ảnh đại diện thành công')
      } else {
        setErrorMessage(response.message || 'Cập nhật ảnh đại diện thất bại')
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật ảnh')
    } finally {
      setSaving(false)
    }
  }

  const splitName = (name: string) => {
    const parts = name.trim().split(' ')
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    }
  }

  const { firstName, lastName } = splitName(fullName)
  
  // Get role from user data
  const getRole = () => {
    if (user?.role === 'TECHNICIAN') return 'Kỹ thuật viên'
    if (user?.role === 'MANAGER') return 'Quản lý'
    if (user?.role === 'ADMIN') return 'Quản trị viên'
    if (user?.role === 'STAFF') return 'Nhân viên'
    return user?.role || 'Người dùng'
  }

  if (loading) {
    return (
      <div className="technician-profile">
        <div className="loading-state">Đang tải thông tin cá nhân...</div>
      </div>
    )
  }

  return (
    <div className="technician-profile">
      <h1 className="page-title">Thông tin cá nhân</h1>

      {/* Popup Notification */}
      {popup && (
        <PopupNotification 
          message={popup.message} 
          type={popup.type} 
          onClose={() => setPopup(null)} 
        />
      )}

      {/* Profile Summary Card */}
      <div className="profile-card">
        <div className="profile-summary">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {avatar ? (
                <img src={avatar} alt={fullName} />
              ) : (
                <div className="avatar-placeholder">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="avatar-upload-btn">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{fullName}</h2>
            <p className="profile-title">{getRole()}</p>
            <p className="profile-location">
              {user?.centerName || 'Chưa có thông tin'}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="profile-card">
        <div className="card-header">
          <h3 className="card-title">Thông tin cá nhân</h3>
          <button
            className="btn-edit"
            onClick={() => setIsEditingPersonal(!isEditingPersonal)}
          >
            <Edit size={14} />
          </button>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <label>Họ và tên <span className="required-star">*</span></label>
            {isEditingPersonal ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="info-input"
              />
            ) : (
              <span className="info-value">{fullName || '-'}</span>
            )}
          </div>
          <div className="info-item">
            <label>Email <span className="required-star">*</span></label>
            {isEditingPersonal ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="info-input"
              />
            ) : (
              <span className="info-value">{email || '-'}</span>
            )}
          </div>
          <div className="info-item">
            <label>Số điện thoại <span className="required-star">*</span></label>
            {isEditingPersonal ? (
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="info-input"
              />
            ) : (
              <span className="info-value">{phoneNumber || '-'}</span>
            )}
          </div>
          <div className="info-item">
            <label>Ngày sinh</label>
            {isEditingPersonal ? (
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="info-input"
              />
            ) : (
              <span className="info-value">{dateOfBirth || '-'}</span>
            )}
          </div>
          <div className="info-item">
            <label>Giới tính</label>
            {isEditingPersonal ? (
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
                className="info-input"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            ) : (
              <span className="info-value">{gender === 'MALE' ? 'Nam' : 'Nữ'}</span>
            )}
          </div>
          <div className="info-item">
            <label>Địa chỉ</label>
            {isEditingPersonal ? (
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="info-input"
                placeholder="Nhập địa chỉ"
              />
            ) : (
              <span className="info-value">{address || '-'}</span>
            )}
          </div>
        </div>
        {isEditingPersonal && (
          <div className="card-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                loadProfile()
                setIsEditingPersonal(false)
              }}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              className="btn-save"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="profile-card">
        <div className="card-header">
          <h3 className="card-title">Bảo mật</h3>
          <button
            className="btn-edit"
            onClick={() => setShowPasswordModal(true)}
          >
            <Lock size={14} />
          </button>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <label>Mật khẩu</label>
            <span className="info-value">••••••••</span>
          </div>
          <button
            className="btn-change-password"
            onClick={() => setShowPasswordModal(true)}
          >
            Đổi mật khẩu
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi mật khẩu</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Mật khẩu hiện tại <span className="required-star">*</span></label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value)
                      setPasswordErrors(prev => ({ ...prev, currentPassword: undefined }))
                    }}
                    className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <span className="error-message">{passwordErrors.currentPassword}</span>
                )}
              </div>
              <div className="form-group">
                <label>Mật khẩu mới <span className="required-star">*</span></label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setPasswordErrors(prev => ({ ...prev, newPassword: undefined }))
                    }}
                    className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span className="error-message">{passwordErrors.newPassword}</span>
                )}
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu mới <span className="required-star">*</span></label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }))
                    }}
                    className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <span className="error-message">{passwordErrors.confirmPassword}</span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowPasswordModal(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={saving}
              >
                {saving ? 'Đang cập nhật...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useEffect, useState, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCurrentUser } from '@/store/authSlice'
import { AuthService } from '@/services/authService'
import { BaseButton, BaseCard, BaseInput } from '@/components/common'
import { 
  UserIcon, 
  LockClosedIcon, 
  CogIcon, 
  WrenchScrewdriverIcon,
  ShoppingCartIcon, 
  TagIcon,
  PencilIcon,
  BellIcon,
  ClockIcon,
  XMarkIcon,
  BoltIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import './profile.scss'

interface UserProfile {
  fullName: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | ''
  avatarUrl: string
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function Profile() {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((s) => s.auth)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'maintenance-history' | 'purchase-history' | 'saved-promotions' | 'notifications' | 'cart'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    avatarUrl: '👤'
  })

  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [originalData, setOriginalData] = useState(profileData)

  useEffect(() => {
    // Load current user from API when page mounts
    dispatch(getCurrentUser())
  }, [dispatch])

  useEffect(() => {
    // Map auth.user to local profile UI state
    if (auth.user) {
      setProfileData((prev) => ({
        ...prev,
        fullName: auth.user.fullName || '',
        email: auth.user.email || '',
        // Map optional fields from backend if available
        address: (auth.user as any).address ?? prev.address,
        dateOfBirth: (auth.user as any).dateOfBirth ?? prev.dateOfBirth,
        gender: (auth.user as any).gender
          ? ((auth.user as any).gender === 'MALE' ? 'Male' : (auth.user as any).gender === 'FEMALE' ? 'Female' : prev.gender)
          : prev.gender,
        avatarUrl: auth.user.avatar || prev.avatarUrl || '👤',
      }))
      setOriginalData((prev) => ({
        ...prev,
        fullName: auth.user.fullName || '',
        email: auth.user.email || '',
        address: (auth.user as any).address ?? prev.address,
        dateOfBirth: (auth.user as any).dateOfBirth ?? prev.dateOfBirth,
        gender: (auth.user as any).gender
          ? ((auth.user as any).gender === 'MALE' ? 'Male' : (auth.user as any).gender === 'FEMALE' ? 'Female' : prev.gender)
          : prev.gender,
        avatarUrl: auth.user.avatar || prev.avatarUrl || '👤',
      }))
    }
  }, [auth.user])

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEdit = () => {
    setOriginalData(profileData)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setProfileData(originalData)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Basic validation to avoid 400 from backend
      const errors: string[] = []
      if (!profileData.fullName?.trim()) errors.push('Họ và tên không được để trống')
      const dob = profileData.dateOfBirth?.trim()
      if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) errors.push('Ngày sinh phải có định dạng YYYY-MM-DD')
      if (profileData.gender !== 'Male' && profileData.gender !== 'Female') errors.push('Vui lòng chọn giới tính')
      if (!profileData.address?.trim()) errors.push('Địa chỉ không được để trống')

      if (errors.length) {
        alert(errors.join('\n'))
        return
      }

      const payload: any = {
        fullName: profileData.fullName.trim(),
        dateOfBirth: dob,
        gender: profileData.gender === 'Male' ? 'MALE' : 'FEMALE',
        address: profileData.address.trim(),
      }

      await AuthService.updateProfile(payload)

      await dispatch(getCurrentUser())
      setOriginalData(profileData)
      setIsEditing(false)
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Cập nhật hồ sơ thất bại'
      alert(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Optional: validate file type/size quickly on FE
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ')
      return
    }

    setIsSaving(true)
    AuthService.uploadAvatar(file)
      .then(async (resp) => {
        const rawUrl = resp?.data?.url || resp?.url || resp?.data?.avatarUrl
        const url = rawUrl ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}_=${Date.now()}` : ''
        if (url) {
          setProfileData(prev => ({
            ...prev,
            avatarUrl: url
          }))
          // Always refresh current user to persist new avatar across reloads
          try {
            await dispatch(getCurrentUser()).unwrap()
          } catch {
            // ignore, UI still shows local url
          }
          return
        }
        // Fallback: refetch profile to get updated avatar
        try {
          const me = await dispatch(getCurrentUser()).unwrap()
          if (me && (me as any).avatar) {
            setProfileData(prev => ({ ...prev, avatarUrl: (me as any).avatar }))
            return
          }
          throw new Error('Upload avatar thành công nhưng thiếu URL trả về')
        } catch (e) {
          throw new Error('Upload avatar thành công nhưng không lấy được URL mới')
        }
      })
      .catch((error: any) => {
        const msg = error?.response?.data?.message || error?.message || 'Tải ảnh đại diện thất bại'
        alert(msg)
      })
      .finally(() => setIsSaving(false))
  }

  const handlePasswordChange = (field: keyof ChangePasswordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!')
      return
    }
    
    setIsSaving(true)
    try {
      await AuthService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmPassword,
      })

      setShowPasswordModal(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      alert('Đổi mật khẩu thành công!')
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Đổi mật khẩu thất bại'
      alert(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveCartItem = (itemId: string) => {
    console.log('Removing cart item:', itemId)
    // Logic to remove item from cart
  }

  const handleMarkAsRead = (notificationId: string) => {
    console.log('Marking notification as read:', notificationId)
    // Logic to mark notification as read
  }

  const tabOptions = [
    { key: 'profile', label: 'Thông tin cá nhân', icon: UserIcon },
    { key: 'security', label: 'Bảo mật', icon: LockClosedIcon },
    { key: 'preferences', label: 'Tùy chọn', icon: CogIcon },
    { key: 'notifications', label: 'Thông báo', icon: BellIcon },
    { key: 'cart', label: 'Giỏ hàng', icon: ShoppingCartIcon },
    { key: 'maintenance-history', label: 'Lịch sử bảo dưỡng', icon: WrenchScrewdriverIcon },
    { key: 'purchase-history', label: 'Lịch sử mua hàng', icon: ClockIcon },
    { key: 'saved-promotions', label: 'Khuyến mãi đã lưu', icon: TagIcon }
  ] as const

  return (
    <div className="profile-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Hồ sơ cá nhân</h1>
          <p className="page-description">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </div>

        {/* Profile Layout with Sidebar */}
        <div className="profile-layout">
          {/* Sidebar Navigation */}
          <div className="profile-sidebar">
            <div className="user-info">
              <div className="user-avatar-wrapper">
                <div className="user-avatar" onClick={handleAvatarClick}>
                  {profileData.avatarUrl && (/^data:/.test(profileData.avatarUrl) || /^https?:\/\//.test(profileData.avatarUrl)) ? (
                    <img src={profileData.avatarUrl} alt="Avatar" />
                  ) : (
                    profileData.avatarUrl
                  )}
                </div>
                <button className="avatar-edit-btn" onClick={handleAvatarClick}>
                  <PencilIcon className="w-3 h-3" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="user-details">
                <h3 className="user-name">{profileData.fullName}</h3>
                <p className="user-email">{profileData.email}</p>
              </div>
            </div>

            <nav className="sidebar-nav">
                     {tabOptions.map(tab => {
                       const IconComponent = tab.icon
  return (
                         <button
                           key={tab.key}
                           className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
                           onClick={() => setActiveTab(tab.key)}
                         >
                           <IconComponent className="nav-icon" />
                           <span className="nav-label">{tab.label}</span>
                         </button>
                       )
                     })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="profile-content">
          {activeTab === 'profile' && (
            <BaseCard className="profile-form-card">
              <div className="card-header">
                <h3 className="card-title">Thông tin cá nhân</h3>
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
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Họ và tên</label>
                    <BaseInput
                      value={profileData.fullName}
                      onChange={(value) => handleInputChange('fullName', value)}
                      disabled={!isEditing}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <BaseInput
                      value={profileData.email}
                      onChange={(value) => handleInputChange('email', value)}
                      disabled={true}
                      type="email"
                      placeholder="Không thể thay đổi email"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <BaseInput
                      value={profileData.phone}
                      onChange={(value) => handleInputChange('phone', value)}
                      disabled={true}
                      placeholder="Không thể thay đổi số điện thoại"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giới tính</label>
                    <select
                      className="form-select"
                      value={profileData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      disabled={!isEditing}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Ngày sinh</label>
                    <BaseInput
                      value={profileData.dateOfBirth}
                      onChange={(value) => handleInputChange('dateOfBirth', value)}
                      disabled={!isEditing}
                      type="date"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Địa chỉ</label>
                    <BaseInput
                      value={profileData.address}
                      onChange={(value) => handleInputChange('address', value)}
                      disabled={!isEditing}
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>
              </div>
            </BaseCard>
          )}

          {activeTab === 'security' && (
            <BaseCard className="security-card">
              <div className="card-header">
                <h3 className="card-title">Cài đặt bảo mật</h3>
              </div>

              <div className="security-content">
                <div className="security-item">
                  <div className="security-info">
                    <h4>Đổi mật khẩu</h4>
                    <p>Cập nhật mật khẩu để bảo vệ tài khoản</p>
                  </div>
                  <BaseButton variant="outline" onClick={() => setShowPasswordModal(true)}>
                    Đổi mật khẩu
                  </BaseButton>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <h4>Xác thực 2 lớp</h4>
                    <p>Tăng cường bảo mật với xác thực 2 lớp</p>
                  </div>
                  <BaseButton variant="outline">Kích hoạt</BaseButton>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <h4>Thiết bị đăng nhập</h4>
                    <p>Quản lý các thiết bị đã đăng nhập</p>
                  </div>
                  <BaseButton variant="outline">Xem chi tiết</BaseButton>
                </div>
              </div>
            </BaseCard>
          )}

          {activeTab === 'preferences' && (
            <BaseCard className="preferences-card">
              <div className="card-header">
                <h3 className="card-title">Tùy chọn cá nhân</h3>
              </div>

              <div className="preferences-content">
                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Thông báo Email</h4>
                    <p>Nhận thông báo qua email</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Thông báo SMS</h4>
                    <p>Nhận thông báo qua tin nhắn</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Ngôn ngữ hiển thị</h4>
                    <p>Chọn ngôn ngữ giao diện</p>
                  </div>
                  <select className="preference-select">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Chế độ tối</h4>
                    <p>Chuyển đổi giao diện tối/sáng</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </BaseCard>
          )}

          {activeTab === 'maintenance-history' && (
            <BaseCard className="maintenance-history-card">
              <div className="card-header">
                <h3 className="card-title">Lịch sử bảo dưỡng</h3>
              </div>

              <div className="history-content">
                <div className="history-item">
                  <div className="history-info">
                    <h4>Bảo dưỡng định kỳ 10,000km</h4>
                    <p>Ngày: 15/01/2024 | Garage: AutoEV Hà Nội</p>
                    <span className="status completed">Hoàn thành</span>
                  </div>
                  <div className="history-details">
                    <p>Chi phí: 1,500,000 VNĐ</p>
                    <BaseButton variant="outline" size="sm">Xem chi tiết</BaseButton>
                  </div>
                </div>

                <div className="history-item">
                  <div className="history-info">
                    <h4>Thay pin xe điện</h4>
                    <p>Ngày: 28/11/2023 | Garage: AutoEV HCM</p>
                    <span className="status completed">Hoàn thành</span>
                  </div>
                  <div className="history-details">
                    <p>Chi phí: 45,000,000 VNĐ</p>
                    <BaseButton variant="outline" size="sm">Xem chi tiết</BaseButton>
                  </div>
                </div>

                <div className="history-item">
                  <div className="history-info">
                    <h4>Kiểm tra hệ thống điện</h4>
                    <p>Ngày: 05/10/2023 | Garage: AutoEV Đà Nẵng</p>
                    <span className="status completed">Hoàn thành</span>
                  </div>
                  <div className="history-details">
                    <p>Chi phí: 800,000 VNĐ</p>
                    <BaseButton variant="outline" size="sm">Xem chi tiết</BaseButton>
                  </div>
                </div>
              </div>
            </BaseCard>
          )}

          {activeTab === 'purchase-history' && (
            <BaseCard className="purchase-history-card">
              <div className="card-header">
                <h3 className="card-title">Lịch sử mua hàng</h3>
              </div>

              <div className="history-content">
                <div className="history-item">
                  <div className="history-info">
                    <h4>Bộ sạc nhanh DC 50kW</h4>
                    <p>Ngày: 20/12/2023 | Mã đơn: #EV20231220001</p>
                    <span className="status delivered">Đã giao</span>
                  </div>
                  <div className="history-details">
                    <p>Số lượng: 1 | Giá: 25,000,000 VNĐ</p>
                    <BaseButton variant="outline" size="sm">Xem đơn hàng</BaseButton>
                  </div>
                </div>

                <div className="history-item">
                  <div className="history-info">
                    <h4>Lốp xe điện Michelin Energy E-V</h4>
                    <p>Ngày: 15/11/2023 | Mã đơn: #EV20231115002</p>
                    <span className="status delivered">Đã giao</span>
                  </div>
                  <div className="history-details">
                    <p>Số lượng: 4 | Giá: 8,000,000 VNĐ</p>
                    <BaseButton variant="outline" size="sm">Xem đơn hàng</BaseButton>
                  </div>
                </div>

                <div className="history-item">
                  <div className="history-info">
                    <h4>Dầu phanh DOT 4 chuyên dụng EV</h4>
                    <p>Ngày: 02/09/2023 | Mã đơn: #EV20230902003</p>
                    <span className="status delivered">Đã giao</span>
                  </div>
                  <div className="history-details">
                    <p>Số lượng: 2 | Giá: 450,000 VNĐ</p>
                    <BaseButton variant="outline" size="sm">Xem đơn hàng</BaseButton>
                  </div>
                </div>
              </div>
            </BaseCard>
          )}

          {activeTab === 'notifications' && (
            <BaseCard className="notifications-card">
              <div className="card-header">
                <h3 className="card-title">Thông báo</h3>
                <BaseButton variant="outline" size="sm">Đánh dấu đã đọc tất cả</BaseButton>
              </div>

              <div className="notifications-content">
                <div className="notification-item unread">
                  <div className="notification-icon">
                    <WrenchScrewdriverIcon className="w-5 h-5" />
                  </div>
                  <div className="notification-content">
                    <h4>Lịch bảo dưỡng sắp tới</h4>
                    <p>Xe VinFast VF8 của bạn sắp đến hạn bảo dưỡng 10,000km. Hãy đặt lịch ngay!</p>
                    <span className="notification-time">2 giờ trước</span>
                  </div>
                  <div className="notification-actions">
                    <BaseButton variant="primary" size="sm">Đặt lịch</BaseButton>
                    <button 
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead('notif-1')}
                      title="Đánh dấu đã đọc"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="notification-item unread">
                  <div className="notification-icon">
                    <ArchiveBoxIcon className="w-5 h-5" />
                  </div>
                  <div className="notification-content">
                    <h4>Đơn hàng đã giao</h4>
                    <p>Bộ sạc nhanh DC 50kW đã được giao thành công. Cảm ơn bạn đã mua sắm!</p>
                    <span className="notification-time">1 ngày trước</span>
                  </div>
                  <div className="notification-actions">
                    <BaseButton variant="outline" size="sm">Đánh giá</BaseButton>
                    <button 
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead('notif-2')}
                      title="Đánh dấu đã đọc"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="notification-item">
                  <div className="notification-icon">
                    <TagIcon className="w-5 h-5" />
                  </div>
                  <div className="notification-content">
                    <h4>Khuyến mãi mới</h4>
                    <p>Giảm 20% cho dịch vụ bảo dưỡng định kỳ trong tháng 3. Áp dụng từ ngày mai!</p>
                    <span className="notification-time">3 ngày trước</span>
                  </div>
                  <div className="notification-actions">
                    <BaseButton variant="secondary" size="sm">Xem chi tiết</BaseButton>
                  </div>
                </div>

                <div className="notification-item">
                  <div className="notification-icon">
                    <BellIcon className="w-5 h-5" />
                  </div>
                  <div className="notification-content">
                    <h4>Cập nhật hệ thống</h4>
                    <p>Hệ thống sẽ bảo trì vào 2:00 AM ngày 25/03. Dự kiến hoàn thành sau 2 tiếng.</p>
                    <span className="notification-time">1 tuần trước</span>
                  </div>
                </div>
              </div>
            </BaseCard>
          )}

          {activeTab === 'cart' && (
            <BaseCard className="cart-card">
              <div className="card-header">
                <h3 className="card-title">Giỏ hàng</h3>
                <span className="cart-summary">2 sản phẩm</span>
              </div>

              <div className="cart-content">
                <div className="cart-item">
                  <div className="item-image">
                    <BoltIcon className="w-8 h-8" />
                  </div>
                  <div className="item-details">
                    <h4>Pin sạc dự phòng 12V</h4>
                    <p className="item-description">Pin lithium chuyên dụng cho xe điện, dung lượng 20,000mAh</p>
                    <div className="item-meta">
                      <span className="item-price">2,500,000 VNĐ</span>
                      <div className="quantity-controls">
                        <button className="quantity-btn">-</button>
                        <span className="quantity">1</span>
                        <button className="quantity-btn">+</button>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="remove-item-btn"
                    onClick={() => handleRemoveCartItem('cart-item-1')}
                    title="Xóa khỏi giỏ hàng"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="cart-item">
                  <div className="item-image">
                    <WrenchScrewdriverIcon className="w-8 h-8" />
                  </div>
                  <div className="item-details">
                    <h4>Bộ dụng cụ sửa chữa EV</h4>
                    <p className="item-description">Bộ công cụ chuyên dụng 25 món cho bảo dưỡng xe điện</p>
                    <div className="item-meta">
                      <span className="item-price">1,200,000 VNĐ</span>
                      <div className="quantity-controls">
                        <button className="quantity-btn">-</button>
                        <span className="quantity">1</span>
                        <button className="quantity-btn">+</button>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="remove-item-btn"
                    onClick={() => handleRemoveCartItem('cart-item-2')}
                    title="Xóa khỏi giỏ hàng"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="cart-summary-section">
                  <div className="summary-row">
                    <span>Tổng phụ:</span>
                    <span>3,700,000 VNĐ</span>
                  </div>
                  <div className="summary-row">
                    <span>Phí vận chuyển:</span>
                    <span>Miễn phí</span>
                  </div>
                  <div className="summary-row total">
                    <span>Tổng cộng:</span>
                    <span>3,700,000 VNĐ</span>
                  </div>
                </div>

                <div className="cart-actions">
                  <BaseButton variant="outline" size="lg">Tiếp tục mua sắm</BaseButton>
                  <BaseButton variant="primary" size="lg">Thanh toán</BaseButton>
                </div>
              </div>
            </BaseCard>
          )}

          {activeTab === 'saved-promotions' && (
            <BaseCard className="saved-promotions-card">
              <div className="card-header">
                <h3 className="card-title">Khuyến mãi đã lưu</h3>
              </div>

              <div className="promotions-content">
                <div className="promotion-item active">
                  <div className="promotion-info">
                    <h4>Giảm 20% dịch vụ bảo dưỡng định kỳ</h4>
                    <p>Áp dụng cho tất cả dịch vụ bảo dưỡng từ 5,000km trở lên</p>
                    <span className="expiry">Hết hạn: 31/03/2024</span>
                  </div>
                  <div className="promotion-actions">
                    <span className="discount">-20%</span>
                    <BaseButton variant="primary" size="sm">Sử dụng ngay</BaseButton>
                  </div>
                </div>

                <div className="promotion-item active">
                  <div className="promotion-info">
                    <h4>Miễn phí kiểm tra pin trong tháng 2</h4>
                    <p>Kiểm tra toàn diện hệ thống pin và charging system</p>
                    <span className="expiry">Hết hạn: 29/02/2024</span>
                  </div>
                  <div className="promotion-actions">
                    <span className="discount">FREE</span>
                    <BaseButton variant="primary" size="sm">Đặt lịch</BaseButton>
                  </div>
                </div>

                <div className="promotion-item expired">
                  <div className="promotion-info">
                    <h4>Mua 1 tặng 1 dầu phanh EV</h4>
                    <p>Áp dụng cho tất cả sản phẩm dầu phanh chuyên dụng xe điện</p>
                    <span className="expiry expired">Đã hết hạn: 31/01/2024</span>
                  </div>
                  <div className="promotion-actions">
                    <span className="discount expired">1+1</span>
                    <BaseButton variant="outline" size="sm" disabled>Hết hạn</BaseButton>
                  </div>
                </div>
              </div>
            </BaseCard>
          )}
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Đổi mật khẩu</h3>
                <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Mật khẩu hiện tại</label>
                  <BaseInput
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(value) => handlePasswordChange('currentPassword', value)}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <BaseInput
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(value) => handlePasswordChange('newPassword', value)}
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu mới</label>
                  <BaseInput
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(value) => handlePasswordChange('confirmPassword', value)}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <BaseButton variant="outline" onClick={() => setShowPasswordModal(false)}>
                  Hủy
                </BaseButton>
                <BaseButton 
                  variant="primary" 
                  onClick={handleChangePassword}
                  loading={isSaving}
                >
                  {isSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                </BaseButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


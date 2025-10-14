import { useEffect, useState, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCurrentUser } from '@/store/authSlice'
import { AuthService, VehicleService, CustomerService } from '@/services'
import type { Vehicle as ApiVehicle, CreateVehicleRequest, UpdateVehicleRequest, Customer } from '@/services'
import { BaseButton, BaseCard, BaseInput } from '@/components/common'
import {
  UserIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  ShoppingCartIcon,
  TagIcon,
  PencilIcon,
  BellIcon,
  ClockIcon,
  XMarkIcon,
  BoltIcon,
  ArchiveBoxIcon,
  TruckIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  PlusIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import './profile.scss'

interface UserProfile {
  fullName: string
  email: string
  phoneNumber: string
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

// Local Vehicle interface for UI display
interface Vehicle {
  id: string
  brand: string
  model: string
  year: string
  licensePlate: string
  color: string
  image?: string
  status: 'active' | 'maintenance'
  nextMaintenance: string
  // API fields
  vehicleId?: number
  customerId?: number
  vin?: string
  currentMileage?: number
  lastServiceDate?: string | null
  purchaseDate?: string | null
  nextServiceDue?: string | null
  createdAt?: string
  customerName?: string
  customerPhone?: string
  modelId?: number | null
}

// Extended interface for new vehicle form
interface NewVehicleForm extends Omit<Vehicle, 'id' | 'currentMileage'> {
  vin?: string
  currentMileage?: string
}

export default function Profile() {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((s) => s.auth)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'maintenance-history' | 'purchase-history' | 'saved-promotions' | 'notifications' | 'cart' | 'my-vehicle'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    avatarUrl: '👤'
  })


  const [originalData, setOriginalData] = useState(profileData)

  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('')
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [showVehicleDetailModal, setShowVehicleDetailModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [vehicleError, setVehicleError] = useState<string | null>(null)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)

  const vehicleImageInputRef = useRef<HTMLInputElement>(null)
  const [newVehicle, setNewVehicle] = useState<NewVehicleForm>({
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    licensePlate: '',
    color: '',
    status: 'active',
    nextMaintenance: '',
    vin: '',
    currentMileage: ''
  })

  useEffect(() => {
    if (auth.token) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, auth.token])

  // Load customer and vehicles when user is available
  useEffect(() => {
    if (auth.user?.id) {
      loadCustomerAndVehicles()
    }
  }, [auth.user?.id])

  // Load customer information first, then vehicles
  const loadCustomerAndVehicles = async () => {
    try {
      // First, get customer information
      const customerResponse = await CustomerService.getCurrentCustomer()
      if (customerResponse.success && customerResponse.data) {
        setCurrentCustomer(customerResponse.data)
        console.log('Current customer:', customerResponse.data)
        
        // Then load vehicles using customerId
        await loadVehicles(customerResponse.data.customerId)
      } else {
        console.error('Failed to get customer info:', customerResponse.message)
        // Try to create customer if not exists
        await createCustomerIfNotExists()
      }
    } catch (error: any) {
      console.error('Error loading customer:', error)
      // Try to create customer if not exists
      await createCustomerIfNotExists()
    }
  }

  // Create customer if not exists
  const createCustomerIfNotExists = async () => {
    try {
      console.log('Creating customer profile...')
      const createResponse = await CustomerService.createCustomer({
        phoneNumber: auth.user?.phoneNumber || '0123456789',
        isGuest: false
      })
      
      if (createResponse.success && createResponse.data) {
        setCurrentCustomer(createResponse.data)
        console.log('Created customer:', createResponse.data)
        await loadVehicles(createResponse.data.customerId)
      } else {
        setVehicleError('Không thể tạo thông tin khách hàng')
      }
    } catch (error: any) {
      console.error('Error creating customer:', error)
      setVehicleError('Không thể tạo thông tin khách hàng')
    }
  }

  useEffect(() => {
    if (auth.user) {
      setProfileData((prev) => ({
        ...prev,
        fullName: auth.user.fullName || '',
        email: auth.user.email || '',
        phoneNumber: (auth.user as any).phoneNumber || (auth.user as any).phoneNumber || prev.phoneNumber,
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
        phoneNumber: (auth.user as any).phoneNumber || (auth.user as any).phoneNumber || prev.phoneNumber,
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

  const handleVehicleInputChange = (field: keyof NewVehicleForm, value: string) => {
    setNewVehicle(prev => ({
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
      const errors: string[] = []

      if (!profileData.fullName?.trim()) {
        errors.push('Họ và tên là bắt buộc')
      }

      if (!profileData.address?.trim()) {
        errors.push('Địa chỉ là bắt buộc')
      }

      const dob = profileData.dateOfBirth?.trim()
      if (!dob) {
        errors.push('Ngày sinh là bắt buộc')
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        errors.push('Ngày sinh phải có định dạng YYYY-MM-DD')
      } else {
        const date = new Date(dob)
        const today = new Date()
        if (date > today) {
          errors.push('Ngày sinh không thể ở tương lai')
        }
        if (today.getFullYear() - date.getFullYear() < 13) {
          errors.push('Bạn phải ít nhất 13 tuổi')
        }
      }

      if (!profileData.gender) {
        errors.push('Vui lòng chọn giới tính')
      }

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
      alert('Cập nhật thông tin thành công!')
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Cập nhật thông tin thất bại'
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

    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      alert('Vui lòng chọn file hình ảnh hợp lệ')
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
          try {
            await dispatch(getCurrentUser()).unwrap()
          } catch {
            // ignore, UI still shows local url
          }
          return
        }
        try {
          const me = await dispatch(getCurrentUser()).unwrap()
          if (me && (me as any).avatar) {
            setProfileData(prev => ({ ...prev, avatarUrl: (me as any).avatar }))
            return
          }
          throw new Error('Tải lên avatar thành công nhưng thiếu URL trả về')
        } catch (e) {
          throw new Error('Tải lên avatar thành công nhưng không thể lấy URL mới')
        }
      })
      .catch((error: any) => {
        const msg = error?.response?.data?.message || error?.message || 'Tải lên avatar thất bại'
        alert(msg)
      })
      .finally(() => setIsSaving(false))
  }

  const handleRemoveCartItem = (itemId: string) => {
  }

  const handleMarkAsRead = (notificationId: string) => {
  }

  // Load vehicles from API
  const loadVehicles = async (customerId?: number) => {
    const targetCustomerId = customerId || currentCustomer?.customerId
    if (!targetCustomerId) {
      console.error('No customer ID available')
      return
    }
    
    setIsLoadingVehicles(true)
    setVehicleError(null)
    
    try {
      console.log('Loading vehicles for customer ID:', targetCustomerId)
      const response = await VehicleService.getCustomerVehicles(targetCustomerId)
      if (response.success && response.data.vehicles) {
        const formattedVehicles = response.data.vehicles.map((apiVehicle: ApiVehicle) => ({
          id: apiVehicle.vehicleId.toString(),
          vehicleId: apiVehicle.vehicleId,
          customerId: apiVehicle.customerId,
          vin: apiVehicle.vin,
          licensePlate: apiVehicle.licensePlate,
          color: apiVehicle.color,
          currentMileage: apiVehicle.currentMileage,
          lastServiceDate: apiVehicle.lastServiceDate,
          purchaseDate: apiVehicle.purchaseDate,
          nextServiceDue: apiVehicle.nextServiceDue,
          createdAt: apiVehicle.createdAt,
          customerName: apiVehicle.customerName,
          customerPhone: apiVehicle.customerPhone,
          modelId: apiVehicle.modelId,
          // UI display fields (extract from VIN or use defaults)
          brand: extractBrandFromVin(apiVehicle.vin) || 'Unknown',
          model: extractModelFromVin(apiVehicle.vin) || 'Unknown',
          year: apiVehicle.purchaseDate ? new Date(apiVehicle.purchaseDate).getFullYear().toString() : 'Unknown',
          status: 'active' as const,
          nextMaintenance: apiVehicle.nextServiceDue || `${apiVehicle.currentMileage + 5000} km`
        }))
        setVehicles(formattedVehicles)
        console.log('Loaded vehicles:', formattedVehicles)
      }
    } catch (error: any) {
      console.error('Error loading vehicles:', error)
      setVehicleError(error?.response?.data?.message || 'Không thể tải danh sách xe')
    } finally {
      setIsLoadingVehicles(false)
    }
  }

  // Helper functions to extract brand/model from VIN (simplified)
  const extractBrandFromVin = (vin: string): string | null => {
    // Simple mapping based on VIN patterns
    if (vin.includes('VF') || vin.includes('VinFast')) return 'VinFast'
    if (vin.includes('TOY') || vin.includes('Toyota')) return 'Toyota'
    if (vin.includes('HON') || vin.includes('Honda')) return 'Honda'
    if (vin.includes('HYU') || vin.includes('Hyundai')) return 'Hyundai'
    return null
  }

  const extractModelFromVin = (vin: string): string | null => {
    // Simple mapping based on VIN patterns
    if (vin.includes('VF8')) return 'VF8'
    if (vin.includes('VF9')) return 'VF9'
    if (vin.includes('VF5')) return 'VF5'
    return null
  }


  const handleVehicleImageClick = () => {
    vehicleImageInputRef.current?.click()
  }

  const handleVehicleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      alert('Vui lòng chọn file hình ảnh hợp lệ')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setNewVehicle(prev => ({
        ...prev,
        image: e.target?.result as string
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleViewVehicleDetail = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowVehicleDetailModal(true)
  }

  const handleAddVehicle = async () => {
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.licensePlate) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc')
      return
    }

    if (!currentCustomer?.customerId) {
      alert('Vui lòng đăng nhập và có thông tin khách hàng để thêm xe')
      return
    }

    setIsSaving(true)
    try {
      // Use provided VIN or generate one
      const vin = newVehicle.vin || generateVin(newVehicle.brand, newVehicle.model)
      
      const createRequest: CreateVehicleRequest = {
        customerId: currentCustomer.customerId,
        vin: vin,
        licensePlate: newVehicle.licensePlate,
        color: newVehicle.color || 'Unknown',
        currentMileage: parseInt(newVehicle.currentMileage || '0') || 0,
        purchaseDate: newVehicle.year ? `${newVehicle.year}-01-01` : undefined
      }

      const response = await VehicleService.createVehicle(createRequest)
      
      if (response.success) {
        // Reload vehicles to get the updated list
        await loadVehicles(currentCustomer.customerId)
        
        setNewVehicle({
          brand: '',
          model: '',
          year: new Date().getFullYear().toString(),
          licensePlate: '',
          color: '',
          status: 'active',
          nextMaintenance: '',
          vin: '',
          currentMileage: ''
        })
        setShowAddVehicleModal(false)
        alert('Thêm xe thành công!')
      }
    } catch (error: any) {
      console.error('Error adding vehicle:', error)
      const msg = error?.response?.data?.message || 'Thêm xe thất bại'
      alert(msg)
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to generate VIN
  const generateVin = (brand: string, model: string): string => {
    const brandCode = brand.substring(0, 3).toUpperCase()
    const modelCode = model.substring(0, 3).toUpperCase()
    const randomSuffix = Math.random().toString(36).substring(2, 11).toUpperCase()
    return `${brandCode}${modelCode}${randomSuffix}`.substring(0, 17)
  }

  const checkPasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    setPasswordRequirements(requirements)

    const metCount = Object.values(requirements).filter(Boolean).length
    if (metCount >= 4) return 'strong'
    if (metCount >= 3) return 'medium'
    if (password.length > 0) return 'weak'
    return ''
  }

  const handlePasswordChange = (field: keyof ChangePasswordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))

    if (field === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value))
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Xác nhận mật khẩu không khớp!')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!')
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

  const tabOptions = [
    { key: 'profile', label: 'Thông tin cá nhân', icon: UserIcon },
    { key: 'preferences', label: 'Tùy chọn', icon: CogIcon },
    { key: 'my-vehicle', label: 'Xe của tôi', icon: TruckIcon },
    { key: 'notifications', label: 'Thông báo', icon: BellIcon },
    { key: 'cart', label: 'Giỏ hàng', icon: ShoppingCartIcon },
    { key: 'maintenance-history', label: 'Lịch sử bảo dưỡng', icon: WrenchScrewdriverIcon },
    { key: 'purchase-history', label: 'Lịch sử mua hàng', icon: ClockIcon },
    { key: 'saved-promotions', label: 'Khuyến mãi đã lưu', icon: TagIcon }
  ] as const

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-layout">
          <div className="profile-sidebar">
            <div className="user-profile-card">
              <div className="user-avatar-section">
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
                <h2 className="user-name">{profileData.fullName || 'Người dùng'}</h2>
                <p className="user-email">{profileData.email}</p>
              </div>
            </div>

            <nav className="sidebar-navigation">
              {tabOptions.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key as any)}
                  >
                    <Icon className="nav-icon" />
                    <span className="nav-label">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="profile-content">
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
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Họ và tên *</label>
                        <BaseInput
                          value={profileData.fullName}
                          onChange={(value) => handleInputChange('fullName', value)}
                          disabled={!isEditing}
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Email
                          <span className="disabled-hint" title="Email không thể thay đổi">
                            <XMarkIcon className="w-4 h-4" />
                          </span>
                        </label>
                        <BaseInput
                          value={profileData.email}
                          onChange={(value) => handleInputChange('email', value)}
                          disabled={true}
                          type="email"
                          placeholder="Email không thể thay đổi"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">
                          Số điện thoại
                          <span className="disabled-hint" title="Số điện thoại không thể thay đổi">
                            <XMarkIcon className="w-4 h-4" />
                          </span>
                        </label>
                        <BaseInput
                          value={profileData.phoneNumber || 'Chưa cập nhật'}
                          onChange={(value) => handleInputChange('phoneNumber', value)}
                          disabled={true}
                          placeholder="Số điện thoại không thể thay đổi"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Giới tính *</label>
                        <select
                          className="form-select"
                          value={profileData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          disabled={!isEditing}
                          required
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="Male">Nam</option>
                          <option value="Female">Nữ</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Ngày sinh *</label>
                        <BaseInput
                          value={profileData.dateOfBirth}
                          onChange={(value) => handleInputChange('dateOfBirth', value)}
                          disabled={!isEditing}
                          type="date"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Địa chỉ *</label>
                        <BaseInput
                          value={profileData.address}
                          onChange={(value) => handleInputChange('address', value)}
                          disabled={!isEditing}
                          placeholder="Nhập địa chỉ"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </BaseCard>
              </div>
            )}

            {activeTab === 'preferences' && (
              <BaseCard className="preferences-card">
                <div className="card-header">
                  <h3 className="card-title">Tùy chọn tài khoản</h3>
                  <p className="card-subtitle">Quản lý cài đặt tài khoản và bảo mật</p>
                </div>

                <div className="preferences-content">
                  <div className="preference-item">
                    <div className="preference-info">
                      <div className="preference-icon security">
                        <LockClosedIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4>Mật khẩu & Bảo mật</h4>
                        <p>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
                      </div>
                    </div>
                    <BaseButton variant="primary" onClick={() => {setShowPasswordModal(true) }}>
                      Đổi mật khẩu
                    </BaseButton>
                  </div>

                  {/* <div className="preference-item">
                    <div className="preference-info">
                      <div className="preference-icon notification">
                        <BellIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4>Notification Settings</h4>
                        <p>Manage how you receive notifications and alerts</p>
                      </div>
                    </div>
                    <BaseButton variant="outline">
                      Configure
                    </BaseButton>
                  </div>

                  <div className="preference-item">
                    <div className="preference-info">
                      <div className="preference-icon privacy">
                        <UserIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4>Privacy Settings</h4>
                        <p>Control your privacy and data sharing preferences</p>
                      </div>
                    </div>
                    <BaseButton variant="outline">
                      Manage
                    </BaseButton>
                  </div> */}
                </div>
              </BaseCard>
            )}

            {activeTab === 'my-vehicle' && (
              <BaseCard className="my-vehicle-card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Xe của tôi</h3>
                    <p className="card-subtitle">Quản lý các xe đã đăng ký</p>
                    
                  </div>
                  <BaseButton
                    variant="primary"
                    onClick={() => { setShowAddVehicleModal(true) }}
                    className="add-vehicle-btn"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Thêm xe
                  </BaseButton>
                </div>

                <div className="vehicle-content">
                  {isLoadingVehicles ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Đang tải danh sách xe...</p>
                    </div>
                  ) : vehicleError ? (
                    <div className="error-state">
                      <ExclamationTriangleIcon className="error-icon" />
                      <h4>Lỗi tải dữ liệu</h4>
                      <p>{vehicleError}</p>
                      <BaseButton variant="primary" onClick={() => loadVehicles()}>
                        Thử lại
                      </BaseButton>
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="empty-state">
                      <TruckIcon className="empty-icon" />
                      <h4>Chưa có xe nào</h4>
                      <p>Bạn chưa thêm xe nào. Hãy thêm chiếc xe đầu tiên để bắt đầu.</p>
                      <BaseButton
                        variant="primary"
                        onClick={() => { setShowPasswordModal(false); setShowAddVehicleModal(true) }}
                      >
                        <PlusIcon className="w-4 h-4" />
                        Thêm xe đầu tiên
                      </BaseButton>
                    </div>
                  ) : (
                    <div className="vehicles-grid">
                      {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="vehicle-card">
                          <div className="vehicle-header">
                            <div className="vehicle-image">
                              {vehicle.image ? (
                                <img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} />
                              ) : (
                                <TruckIcon className="vehicle-icon" />
                              )}
                            </div>
                          </div>

                          <div className="vehicle-details">
                            <h4>{vehicle.brand} {vehicle.model}</h4>
                            <p className="vehicle-year">{vehicle.year} • {vehicle.color}</p>
                            <div className="license-plate">
                              {vehicle.licensePlate}
                            </div>
                            {vehicle.vin && (
                              <div className="vehicle-vin">
                                <small>VIN: {vehicle.vin}</small>
                              </div>
                            )}
                            {vehicle.currentMileage && (
                              <div className="vehicle-mileage">
                                <small>Số km: {vehicle.currentMileage.toLocaleString()} km</small>
                              </div>
                            )}

                            <div className="vehicle-meta">
                              <span className={`vehicle-status ${vehicle.status}`}>
                                {vehicle.status === 'active' ? 'Hoạt động' : 'Bảo dưỡng'}
                              </span>
                              <div className="maintenance-info">
                                <ClockIcon className="w-4 h-4" />
                                <span>Tiếp theo: {vehicle.nextMaintenance}</span>
                              </div>
                            </div>
                          </div>

                          <div className="vehicle-actions">
                            <BaseButton 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewVehicleDetail(vehicle)}
                            >
                              Xem chi tiết
                            </BaseButton>
                            <BaseButton variant="primary" size="sm">Đặt lịch dịch vụ</BaseButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                      <p>Chi phí: 1,500,000 VND</p>
                      <BaseButton variant="outline" size="sm">Xem chi tiết</BaseButton>
                    </div>
                  </div>

                  <div className="history-item">
                    <div className="history-info">
                      <h4>Thay thế pin xe điện</h4>
                      <p>Ngày: 28/11/2023 | Garage: AutoEV TP.HCM</p>
                      <span className="status completed">Hoàn thành</span>
                    </div>
                    <div className="history-details">
                      <p>Chi phí: 45,000,000 VND</p>
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
                      <p>Chi phí: 800,000 VND</p>
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
                      <h4>Sạc nhanh DC 50kW</h4>
                      <p>Ngày: 20/12/2023 | Mã đơn hàng: #EV20231220001</p>
                      <span className="status delivered">Đã giao</span>
                    </div>
                    <div className="history-details">
                      <p>Số lượng: 1 | Giá: 25,000,000 VND</p>
                      <BaseButton variant="outline" size="sm">Xem đơn hàng</BaseButton>
                    </div>
                  </div>

                  <div className="history-item">
                    <div className="history-info">
                      <h4>Lốp xe điện Michelin Energy E-V</h4>
                      <p>Ngày: 15/11/2023 | Mã đơn hàng: #EV20231115002</p>
                      <span className="status delivered">Đã giao</span>
                    </div>
                    <div className="history-details">
                      <p>Số lượng: 4 | Giá: 8,000,000 VND</p>
                      <BaseButton variant="outline" size="sm">Xem đơn hàng</BaseButton>
                    </div>
                  </div>

                  <div className="history-item">
                    <div className="history-info">
                      <h4>Dầu phanh chuyên dụng xe điện DOT 4</h4>
                      <p>Ngày: 02/09/2023 | Mã đơn hàng: #EV20230902003</p>
                      <span className="status delivered">Đã giao</span>
                    </div>
                    <div className="history-details">
                      <p>Số lượng: 2 | Giá: 450,000 VND</p>
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
                  <BaseButton variant="outline" size="sm">Đánh dấu tất cả đã đọc</BaseButton>
                </div>

                <div className="notifications-content">
                  <div className="notification-item unread">
                    <div className="notification-icon">
                      <WrenchScrewdriverIcon className="w-5 h-5" />
                    </div>
                    <div className="notification-content">
                      <h4>Lịch bảo dưỡng sắp tới</h4>
                      <p>Xe VinFast VF8 của bạn sắp đến hạn bảo dưỡng 10,000km. Đặt lịch ngay!</p>
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
                      <p>Sạc nhanh DC 50kW của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm!</p>
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
                      <p>Giảm 20% cho dịch vụ bảo dưỡng định kỳ trong tháng 3. Có hiệu lực từ ngày mai!</p>
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
                      <p>Bảo trì hệ thống được lên lịch lúc 2:00 sáng ngày 25/03. Dự kiến hoàn thành trong 2 giờ.</p>
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
                        <span className="item-price">2,500,000 VND</span>
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
                      <h4>Bộ dụng cụ sửa chữa xe điện</h4>
                      <p className="item-description">Bộ dụng cụ chuyên dụng 25 món cho bảo dưỡng xe điện</p>
                      <div className="item-meta">
                        <span className="item-price">1,200,000 VND</span>
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
                      <span>Tạm tính:</span>
                      <span>3,700,000 VND</span>
                    </div>
                    <div className="summary-row">
                      <span>Phí vận chuyển:</span>
                      <span>Miễn phí</span>
                    </div>
                    <div className="summary-row total">
                      <span>Tổng cộng:</span>
                      <span>3,700,000 VND</span>
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
                      <h4>Kiểm tra pin miễn phí trong tháng 2</h4>
                      <p>Kiểm tra toàn diện pin và hệ thống sạc</p>
                      <span className="expiry">Hết hạn: 29/02/2024</span>
                    </div>
                    <div className="promotion-actions">
                      <span className="discount">FREE</span>
                      <BaseButton variant="primary" size="sm">Đặt lịch</BaseButton>
                    </div>
                  </div>

                  <div className="promotion-item expired">
                    <div className="promotion-info">
                      <h4>Mua 1 tặng 1 dầu phanh xe điện</h4>
                      <p>Áp dụng cho tất cả sản phẩm dầu phanh chuyên dụng xe điện</p>
                      <span className="expiry expired">Đã hết hạn: 31/01/2024</span>
                    </div>
                    <div className="promotion-actions">
                      <span className="discount expired">1+1</span>
                      <BaseButton variant="outline" size="sm" disabled>Đã hết hạn</BaseButton>
                    </div>
                  </div>
                </div>
              </BaseCard>
            )}
          </div>
        </div>

        {/*  Password Change Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="header-content">
                  <div className="lock-icon">
                    <CheckCircleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3>Đổi mật khẩu</h3>
                    <p>Bảo mật tài khoản của bạn với mật khẩu mới</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="modal-body">
                <div className="password-form">
                  <div className="form-group">
                    <label className="form-label">
                      <KeyIcon className="label-icon" />
                      Mật khẩu hiện tại
                    </label>
                    <div className="password-input-wrapper">
                      <BaseInput
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(value) => handlePasswordChange('currentPassword', value)}
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <LockClosedIcon className="label-icon" />
                      Mật khẩu mới
                    </label>
                    <div className="password-input-wrapper">
                      <BaseInput
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(value) => handlePasswordChange('newPassword', value)}
                        placeholder="Tạo mật khẩu mạnh"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>

                    {passwordData.newPassword && (
                      <div className="password-strength">
                        <div className="strength-bar">
                          <div className={`strength-fill ${passwordStrength}`} />
                        </div>
                        <div className={`strength-text ${passwordStrength}`}>
                          {passwordStrength === 'weak' && 'Mật khẩu yếu'}
                          {passwordStrength === 'medium' && 'Mật khẩu trung bình'}
                          {passwordStrength === 'strong' && 'Mật khẩu mạnh'}
                        </div>
                      </div>
                    )}


                    <div className="password-requirements">
                      <h4>Mật khẩu phải chứa:</h4>
                      <div className="requirements-list">
                        <div className={`requirement ${passwordRequirements.length ? 'met' : 'unmet'}`}>
                          Ít nhất 8 ký tự
                        </div>
                        <div className={`requirement ${passwordRequirements.uppercase ? 'met' : 'unmet'}`}>
                          Một chữ cái viết hoa
                        </div>
                        <div className={`requirement ${passwordRequirements.lowercase ? 'met' : 'unmet'}`}>
                          Một chữ cái viết thường
                        </div>
                        <div className={`requirement ${passwordRequirements.number ? 'met' : 'unmet'}`}>
                          Một số
                        </div>
                        <div className={`requirement ${passwordRequirements.special ? 'met' : 'unmet'}`}>
                          Một ký tự đặc biệt
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <CheckCircleIcon className="label-icon" />
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="password-input-wrapper">
                      <BaseInput
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(value) => handlePasswordChange('confirmPassword', value)}
                        placeholder="Xác nhận mật khẩu mới"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <div className="error-message">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Mật khẩu không khớp
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <BaseButton
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                  className="cancel-btn"
                >
                  Hủy
                </BaseButton>
                <BaseButton
                  variant="primary"
                  onClick={handleChangePassword}
                  loading={isSaving}
                  disabled={
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword ||
                    passwordStrength === 'weak'
                  }
                  className="submit-btn"
                >
                  {isSaving ? (
                    <>
                      <div className="loading-spinner"></div>
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <div className="" >
                        Cập nhật mật khẩu
                      </div>
                    </>
                  )}
                </BaseButton>
              </div>
            </div>
          </div>
        )}

        {/* Add Vehicle Modal */}
        {showAddVehicleModal && (
          <div className="modal-overlay" onClick={() => setShowAddVehicleModal(false)}>
            <div className="modal-content vehicle-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="header-content">
                  <div className="modal-icon">
                    <TruckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3>Thêm xe mới</h3>
                    <p>Nhập thông tin xe của bạn</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowAddVehicleModal(false)}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="modal-body">
                <div className="vehicle-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Hãng xe *</label>
                      <BaseInput
                        value={newVehicle.brand}
                        onChange={(value) => handleVehicleInputChange('brand', value)}
                        placeholder="ví dụ: VinFast, Toyota, Honda"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mẫu xe *</label>
                      <BaseInput
                        value={newVehicle.model}
                        onChange={(value) => handleVehicleInputChange('model', value)}
                        placeholder="ví dụ: VF8, Camry, CR-V"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Số VIN *</label>
                      <BaseInput
                        value={newVehicle.vin || ''}
                        onChange={(value) => handleVehicleInputChange('vin', value)}
                        placeholder="17 ký tự VIN"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số km hiện tại *</label>
                      <BaseInput
                        value={newVehicle.currentMileage || ''}
                        onChange={(value) => handleVehicleInputChange('currentMileage', value)}
                        type="number"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Năm sản xuất</label>
                      <BaseInput
                        value={newVehicle.year}
                        onChange={(value) => handleVehicleInputChange('year', value)}
                        type="number"
                        placeholder="2023"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Màu sắc</label>
                      <BaseInput
                        value={newVehicle.color}
                        onChange={(value) => handleVehicleInputChange('color', value)}
                        placeholder="ví dụ: Trắng, Đen, Đỏ"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Biển số xe *</label>
                      <BaseInput
                        value={newVehicle.licensePlate}
                        onChange={(value) => handleVehicleInputChange('licensePlate', value)}
                        placeholder="ví dụ: 30A-12345"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bảo dưỡng tiếp theo</label>
                      <BaseInput
                        value={newVehicle.nextMaintenance}
                        onChange={(value) => handleVehicleInputChange('nextMaintenance', value)}
                        placeholder="ví dụ: 5,000 km hoặc 01/04/2024"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hình ảnh xe</label>
                    <div
                      className="image-upload-area"
                      onClick={handleVehicleImageClick}
                    >
                      {newVehicle.image ? (
                        <img src={newVehicle.image} alt="Vehicle preview" className="image-preview" />
                      ) : (
                        <div className="upload-placeholder">
                          <PhotoIcon className="w-8 h-8" />
                          <span>Nhấp để tải lên hình ảnh xe</span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={vehicleImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleVehicleImageChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <BaseButton
                  variant="outline"
                  onClick={() => setShowAddVehicleModal(false)}
                >
                  Hủy
                </BaseButton>
                <BaseButton
                  variant="primary"
                  onClick={handleAddVehicle}
                  loading={isSaving}
                  disabled={!newVehicle.brand || !newVehicle.model || !newVehicle.licensePlate || !newVehicle.vin || !newVehicle.currentMileage}
                  className="add-vehicle-btn"
                >
                  <PlusIcon className="w-4 h-4" />
                  {isSaving ? 'Đang thêm...' : 'Thêm xe'}
                </BaseButton>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Detail Modal */}
        {showVehicleDetailModal && selectedVehicle && (
          <div className="modal-overlay" onClick={() => setShowVehicleDetailModal(false)}>
            <div className="modal-content vehicle-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="header-content">
                  <div className="modal-icon">
                    <TruckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3>Chi tiết xe</h3>
                    <p>Thông tin chi tiết về xe của bạn</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowVehicleDetailModal(false)}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="modal-body">
                <div className="vehicle-detail-content">
                  <div className="vehicle-image-section">
                    <div className="vehicle-image-large">
                      {selectedVehicle.image ? (
                        <img 
                          src={selectedVehicle.image} 
                          alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                        />
                      ) : (
                        <TruckIcon className="vehicle-icon-large" />
                      )}
                    </div>
                  </div>

                  <div className="vehicle-info-grid">
                    <div className="info-section">
                      <h4>Thông tin cơ bản</h4>
                      <div className="info-item">
                        <span className="label">Hãng xe:</span>
                        <span className="value">{selectedVehicle.brand}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Mẫu xe:</span>
                        <span className="value">{selectedVehicle.model}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Năm sản xuất:</span>
                        <span className="value">{selectedVehicle.year}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Màu sắc:</span>
                        <span className="value">{selectedVehicle.color}</span>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>Thông tin đăng ký</h4>
                      <div className="info-item">
                        <span className="label">Biển số xe:</span>
                        <span className="value license-plate">{selectedVehicle.licensePlate}</span>
                      </div>
                      {selectedVehicle.vin && (
                        <div className="info-item">
                          <span className="label">Số VIN:</span>
                          <span className="value vin">{selectedVehicle.vin}</span>
                        </div>
                      )}
                      <div className="info-item">
                        <span className="label">Trạng thái:</span>
                        <span className={`value status ${selectedVehicle.status}`}>
                          {selectedVehicle.status === 'active' ? 'Hoạt động' : 'Bảo dưỡng'}
                        </span>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>Thông tin vận hành</h4>
                      {selectedVehicle.currentMileage && (
                        <div className="info-item">
                          <span className="label">Số km hiện tại:</span>
                          <span className="value">{selectedVehicle.currentMileage.toLocaleString()} km</span>
                        </div>
                      )}
                      <div className="info-item">
                        <span className="label">Bảo dưỡng tiếp theo:</span>
                        <span className="value">{selectedVehicle.nextMaintenance}</span>
                      </div>
                      {selectedVehicle.lastServiceDate && (
                        <div className="info-item">
                          <span className="label">Lần bảo dưỡng cuối:</span>
                          <span className="value">{new Date(selectedVehicle.lastServiceDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                      {selectedVehicle.purchaseDate && (
                        <div className="info-item">
                          <span className="label">Ngày mua:</span>
                          <span className="value">{new Date(selectedVehicle.purchaseDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <BaseButton
                  variant="outline"
                  onClick={() => setShowVehicleDetailModal(false)}
                >
                  Đóng
                </BaseButton>
                <BaseButton variant="primary">
                  Đặt lịch dịch vụ
                </BaseButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
import { useEffect, useState, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCurrentUser } from '@/store/authSlice'
import { AuthService } from '@/services/authService'
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
  console.log({ profileData });


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
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      brand: 'VinFast',
      model: 'VF8',
      year: '2023',
      licensePlate: '30A-12345',
      color: 'White',
      status: 'active',
      nextMaintenance: '5,000 km'
    }
  ])

  const vehicleImageInputRef = useRef<HTMLInputElement>(null)
  const [newVehicle, setNewVehicle] = useState<Omit<Vehicle, 'id'>>({
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    licensePlate: '',
    color: '',
    status: 'active',
    nextMaintenance: ''
  })

  useEffect(() => {
    if (auth.token) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, auth.token])

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

  const handleVehicleInputChange = (field: keyof Omit<Vehicle, 'id'>, value: string) => {
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
        errors.push('Full name is required')
      }

      if (!profileData.address?.trim()) {
        errors.push('Address is required')
      }

      const dob = profileData.dateOfBirth?.trim()
      if (!dob) {
        errors.push('Date of birth is required')
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        errors.push('Date of birth must be in YYYY-MM-DD format')
      } else {
        const date = new Date(dob)
        const today = new Date()
        if (date > today) {
          errors.push('Date of birth cannot be in the future')
        }
        if (today.getFullYear() - date.getFullYear() < 13) {
          errors.push('You must be at least 13 years old')
        }
      }

      if (!profileData.gender) {
        errors.push('Please select gender')
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
      alert('Profile updated successfully!')
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Profile update failed'
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
      alert('Please select a valid image file')
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
          throw new Error('Avatar uploaded successfully but missing return URL')
        } catch (e) {
          throw new Error('Avatar uploaded successfully but failed to get new URL')
        }
      })
      .catch((error: any) => {
        const msg = error?.response?.data?.message || error?.message || 'Avatar upload failed'
        alert(msg)
      })
      .finally(() => setIsSaving(false))
  }

  const handleRemoveCartItem = (itemId: string) => {
    console.log('Removing cart item:', itemId)
  }

  const handleMarkAsRead = (notificationId: string) => {
    console.log('Marking notification as read:', notificationId)
  }

  const handleRemoveVehicle = (vehicleId: string) => {
    setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId))
  }

  const handleVehicleImageClick = () => {
    vehicleImageInputRef.current?.click()
  }

  const handleVehicleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      alert('Please select a valid image file')
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

  const handleAddVehicle = () => {
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.licensePlate) {
      alert('Please fill in all required fields')
      return
    }

    const vehicle: Vehicle = {
      ...newVehicle,
      id: Date.now().toString()
    }

    setVehicles(prev => [...prev, vehicle])
    setNewVehicle({
      brand: '',
      model: '',
      year: new Date().getFullYear().toString(),
      licensePlate: '',
      color: '',
      status: 'active',
      nextMaintenance: ''
    })
    setShowAddVehicleModal(false)
    alert('Vehicle added successfully!')
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
      alert('Password confirmation does not match!')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters!')
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
      alert('Password changed successfully!')
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Password change failed'
      alert(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const tabOptions = [
    { key: 'profile', label: 'Personal Information', icon: UserIcon },
    { key: 'preferences', label: 'Preferences', icon: CogIcon },
    { key: 'my-vehicle', label: 'My Vehicle', icon: TruckIcon },
    { key: 'notifications', label: 'Notifications', icon: BellIcon },
    { key: 'cart', label: 'Shopping Cart', icon: ShoppingCartIcon },
    { key: 'maintenance-history', label: 'Maintenance History', icon: WrenchScrewdriverIcon },
    { key: 'purchase-history', label: 'Purchase History', icon: ClockIcon },
    { key: 'saved-promotions', label: 'Saved Promotions', icon: TagIcon }
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
                <h2 className="user-name">{profileData.fullName || 'User'}</h2>
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
                    <h3 className="card-title">Edit Information</h3>
                    <div className="card-actions">
                      {!isEditing ? (
                        <BaseButton variant="outline" onClick={handleEdit}>
                          Edit
                        </BaseButton>
                      ) : (
                        <div className="edit-actions">
                          <BaseButton variant="outline" onClick={handleCancel}>
                            Cancel
                          </BaseButton>
                          <BaseButton
                            variant="primary"
                            onClick={handleSave}
                            loading={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </BaseButton>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <BaseInput
                          value={profileData.fullName}
                          onChange={(value) => handleInputChange('fullName', value)}
                          disabled={!isEditing}
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Email
                          <span className="disabled-hint" title="Email cannot be changed">
                            <XMarkIcon className="w-4 h-4" />
                          </span>
                        </label>
                        <BaseInput
                          value={profileData.email}
                          onChange={(value) => handleInputChange('email', value)}
                          disabled={true}
                          type="email"
                          placeholder="Email cannot be changed"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">
                          Phone Number
                          <span className="disabled-hint" title="Phone number cannot be changed">
                            <XMarkIcon className="w-4 h-4" />
                          </span>
                        </label>
                        <BaseInput
                          value={profileData.phoneNumber || 'Not updated'}
                          onChange={(value) => handleInputChange('phoneNumber', value)}
                          disabled={true}
                          placeholder="Phone number cannot be changed"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Gender *</label>
                        <select
                          className="form-select"
                          value={profileData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          disabled={!isEditing}
                          required
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Date of Birth *</label>
                        <BaseInput
                          value={profileData.dateOfBirth}
                          onChange={(value) => handleInputChange('dateOfBirth', value)}
                          disabled={!isEditing}
                          type="date"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Address *</label>
                        <BaseInput
                          value={profileData.address}
                          onChange={(value) => handleInputChange('address', value)}
                          disabled={!isEditing}
                          placeholder="Enter address"
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
                  <h3 className="card-title">Account Preferences</h3>
                  <p className="card-subtitle">Manage your account settings and security</p>
                </div>

                <div className="preferences-content">
                  <div className="preference-item">
                    <div className="preference-info">
                      <div className="preference-icon security">
                        <LockClosedIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4>Password & Security</h4>
                        <p>Update your password to keep your account secure</p>
                      </div>
                    </div>
                    <BaseButton variant="primary" onClick={() => {setShowPasswordModal(true) }}>
                      Change Password
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
                    <h3 className="card-title">My Vehicles</h3>
                    <p className="card-subtitle">Manage your registered vehicles</p>
                  </div>
                  <BaseButton
                    variant="primary"
                    onClick={() => { setShowAddVehicleModal(true) }}
                    className="add-vehicle-btn"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Vehicle
                  </BaseButton>
                </div>

                <div className="vehicle-content">
                  {vehicles.length === 0 ? (
                    <div className="empty-state">
                      <TruckIcon className="empty-icon" />
                      <h4>No Vehicles Added</h4>
                      <p>You haven't added any vehicles yet. Add your first vehicle to get started.</p>
                      <BaseButton
                        variant="primary"
                        onClick={() => { setShowPasswordModal(false); setShowAddVehicleModal(true) }}
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add Your First Vehicle
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
                            <button
                              className="remove-vehicle-btn"
                              onClick={() => handleRemoveVehicle(vehicle.id)}
                              title="Remove vehicle"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="vehicle-details">
                            <h4>{vehicle.brand} {vehicle.model}</h4>
                            <p className="vehicle-year">{vehicle.year} • {vehicle.color}</p>
                            <div className="license-plate">
                              {vehicle.licensePlate}
                            </div>

                            <div className="vehicle-meta">
                              <span className={`vehicle-status ${vehicle.status}`}>
                                {vehicle.status === 'active' ? 'Active' : 'Maintenance'}
                              </span>
                              <div className="maintenance-info">
                                <ClockIcon className="w-4 h-4" />
                                <span>Next: {vehicle.nextMaintenance}</span>
                              </div>
                            </div>
                          </div>

                          <div className="vehicle-actions">
                            <BaseButton variant="outline" size="sm">View Details</BaseButton>
                            <BaseButton variant="primary" size="sm">Schedule Service</BaseButton>
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
                  <h3 className="card-title">Maintenance History</h3>
                </div>

                <div className="history-content">
                  <div className="history-item">
                    <div className="history-info">
                      <h4>10,000km Periodic Maintenance</h4>
                      <p>Date: 15/01/2024 | Garage: AutoEV Hanoi</p>
                      <span className="status completed">Completed</span>
                    </div>
                    <div className="history-details">
                      <p>Cost: 1,500,000 VND</p>
                      <BaseButton variant="outline" size="sm">View Details</BaseButton>
                    </div>
                  </div>

                  <div className="history-item">
                    <div className="history-info">
                      <h4>Electric Vehicle Battery Replacement</h4>
                      <p>Date: 28/11/2023 | Garage: AutoEV HCM</p>
                      <span className="status completed">Completed</span>
                    </div>
                    <div className="history-details">
                      <p>Cost: 45,000,000 VND</p>
                      <BaseButton variant="outline" size="sm">View Details</BaseButton>
                    </div>
                  </div>

                  <div className="history-item">
                    <div className="history-info">
                      <h4>Electrical System Inspection</h4>
                      <p>Date: 05/10/2023 | Garage: AutoEV Da Nang</p>
                      <span className="status completed">Completed</span>
                    </div>
                    <div className="history-details">
                      <p>Cost: 800,000 VND</p>
                      <BaseButton variant="outline" size="sm">View Details</BaseButton>
                    </div>
                  </div>
                </div>
              </BaseCard>
            )}

            {activeTab === 'purchase-history' && (
              <BaseCard className="purchase-history-card">
                <div className="card-header">
                  <h3 className="card-title">Purchase History</h3>
                </div>

                <div className="history-content">
                  <div className="history-item">
                    <div className="history-info">
                      <h4>DC Fast Charger 50kW</h4>
                      <p>Date: 20/12/2023 | Order ID: #EV20231220001</p>
                      <span className="status delivered">Delivered</span>
                    </div>
                    <div className="history-details">
                      <p>Quantity: 1 | Price: 25,000,000 VND</p>
                      <BaseButton variant="outline" size="sm">View Order</BaseButton>
                    </div>
                  </div>

                  <div className="history-item">
                    <div className="history-info">
                      <h4>Michelin Energy E-V Electric Vehicle Tires</h4>
                      <p>Date: 15/11/2023 | Order ID: #EV20231115002</p>
                      <span className="status delivered">Delivered</span>
                    </div>
                    <div className="history-details">
                      <p>Quantity: 4 | Price: 8,000,000 VND</p>
                      <BaseButton variant="outline" size="sm">View Order</BaseButton>
                    </div>
                  </div>

                  <div className="history-item">
                    <div className="history-info">
                      <h4>EV Specialized DOT 4 Brake Fluid</h4>
                      <p>Date: 02/09/2023 | Order ID: #EV20230902003</p>
                      <span className="status delivered">Delivered</span>
                    </div>
                    <div className="history-details">
                      <p>Quantity: 2 | Price: 450,000 VND</p>
                      <BaseButton variant="outline" size="sm">View Order</BaseButton>
                    </div>
                  </div>
                </div>
              </BaseCard>
            )}

            {activeTab === 'notifications' && (
              <BaseCard className="notifications-card">
                <div className="card-header">
                  <h3 className="card-title">Notifications</h3>
                  <BaseButton variant="outline" size="sm">Mark all as read</BaseButton>
                </div>

                <div className="notifications-content">
                  <div className="notification-item unread">
                    <div className="notification-icon">
                      <WrenchScrewdriverIcon className="w-5 h-5" />
                    </div>
                    <div className="notification-content">
                      <h4>Upcoming Maintenance Schedule</h4>
                      <p>Your VinFast VF8 is due for 10,000km maintenance. Schedule now!</p>
                      <span className="notification-time">2 hours ago</span>
                    </div>
                    <div className="notification-actions">
                      <BaseButton variant="primary" size="sm">Schedule</BaseButton>
                      <button
                        className="mark-read-btn"
                        onClick={() => handleMarkAsRead('notif-1')}
                        title="Mark as read"
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
                      <h4>Order Delivered</h4>
                      <p>Your DC Fast Charger 50kW has been delivered successfully. Thank you for shopping!</p>
                      <span className="notification-time">1 day ago</span>
                    </div>
                    <div className="notification-actions">
                      <BaseButton variant="outline" size="sm">Review</BaseButton>
                      <button
                        className="mark-read-btn"
                        onClick={() => handleMarkAsRead('notif-2')}
                        title="Mark as read"
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
                      <h4>New Promotion</h4>
                      <p>20% off for periodic maintenance services in March. Available from tomorrow!</p>
                      <span className="notification-time">3 days ago</span>
                    </div>
                    <div className="notification-actions">
                      <BaseButton variant="secondary" size="sm">View Details</BaseButton>
                    </div>
                  </div>

                  <div className="notification-item">
                    <div className="notification-icon">
                      <BellIcon className="w-5 h-5" />
                    </div>
                    <div className="notification-content">
                      <h4>System Update</h4>
                      <p>System maintenance scheduled for 2:00 AM on 25/03. Expected completion in 2 hours.</p>
                      <span className="notification-time">1 week ago</span>
                    </div>
                  </div>
                </div>
              </BaseCard>
            )}

            {activeTab === 'cart' && (
              <BaseCard className="cart-card">
                <div className="card-header">
                  <h3 className="card-title">Shopping Cart</h3>
                  <span className="cart-summary">2 items</span>
                </div>

                <div className="cart-content">
                  <div className="cart-item">
                    <div className="item-image">
                      <BoltIcon className="w-8 h-8" />
                    </div>
                    <div className="item-details">
                      <h4>12V Backup Charging Battery</h4>
                      <p className="item-description">Lithium battery specialized for electric vehicles, 20,000mAh capacity</p>
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
                      title="Remove from cart"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="cart-item">
                    <div className="item-image">
                      <WrenchScrewdriverIcon className="w-8 h-8" />
                    </div>
                    <div className="item-details">
                      <h4>EV Repair Tool Kit</h4>
                      <p className="item-description">Specialized 25-piece tool set for electric vehicle maintenance</p>
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
                      title="Remove from cart"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="cart-summary-section">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>3,700,000 VND</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping:</span>
                      <span>Free</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>3,700,000 VND</span>
                    </div>
                  </div>

                  <div className="cart-actions">
                    <BaseButton variant="outline" size="lg">Continue Shopping</BaseButton>
                    <BaseButton variant="primary" size="lg">Checkout</BaseButton>
                  </div>
                </div>
              </BaseCard>
            )}

            {activeTab === 'saved-promotions' && (
              <BaseCard className="saved-promotions-card">
                <div className="card-header">
                  <h3 className="card-title">Saved Promotions</h3>
                </div>

                <div className="promotions-content">
                  <div className="promotion-item active">
                    <div className="promotion-info">
                      <h4>20% off periodic maintenance services</h4>
                      <p>Applicable for all maintenance services from 5,000km and above</p>
                      <span className="expiry">Expires: 31/03/2024</span>
                    </div>
                    <div className="promotion-actions">
                      <span className="discount">-20%</span>
                      <BaseButton variant="primary" size="sm">Use Now</BaseButton>
                    </div>
                  </div>

                  <div className="promotion-item active">
                    <div className="promotion-info">
                      <h4>Free battery inspection in February</h4>
                      <p>Comprehensive inspection of battery and charging system</p>
                      <span className="expiry">Expires: 29/02/2024</span>
                    </div>
                    <div className="promotion-actions">
                      <span className="discount">FREE</span>
                      <BaseButton variant="primary" size="sm">Schedule</BaseButton>
                    </div>
                  </div>

                  <div className="promotion-item expired">
                    <div className="promotion-info">
                      <h4>Buy 1 Get 1 EV brake fluid</h4>
                      <p>Applicable for all specialized electric vehicle brake fluid products</p>
                      <span className="expiry expired">Expired: 31/01/2024</span>
                    </div>
                    <div className="promotion-actions">
                      <span className="discount expired">1+1</span>
                      <BaseButton variant="outline" size="sm" disabled>Expired</BaseButton>
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
                    <h3>Change Password</h3>
                    <p>Secure your account with a new password</p>
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
                      Current Password
                    </label>
                    <div className="password-input-wrapper">
                      <BaseInput
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(value) => handlePasswordChange('currentPassword', value)}
                        placeholder="Enter your current password"
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
                      New Password
                    </label>
                    <div className="password-input-wrapper">
                      <BaseInput
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(value) => handlePasswordChange('newPassword', value)}
                        placeholder="Create a strong password"
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
                          {passwordStrength === 'weak' && 'Weak password'}
                          {passwordStrength === 'medium' && 'Medium strength'}
                          {passwordStrength === 'strong' && 'Strong password'}
                        </div>
                      </div>
                    )}


                    <div className="password-requirements">
                      <h4>Password must contain:</h4>
                      <div className="requirements-list">
                        <div className={`requirement ${passwordRequirements.length ? 'met' : 'unmet'}`}>
                          At least 8 characters
                        </div>
                        <div className={`requirement ${passwordRequirements.uppercase ? 'met' : 'unmet'}`}>
                          One uppercase letter
                        </div>
                        <div className={`requirement ${passwordRequirements.lowercase ? 'met' : 'unmet'}`}>
                          One lowercase letter
                        </div>
                        <div className={`requirement ${passwordRequirements.number ? 'met' : 'unmet'}`}>
                          One number
                        </div>
                        <div className={`requirement ${passwordRequirements.special ? 'met' : 'unmet'}`}>
                          One special character
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <CheckCircleIcon className="label-icon" />
                      Confirm New Password
                    </label>
                    <div className="password-input-wrapper">
                      <BaseInput
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(value) => handlePasswordChange('confirmPassword', value)}
                        placeholder="Confirm your new password"
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
                        Passwords do not match
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
                  Cancel
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <div className="" >
                        Update Password
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
                    <h3>Add New Vehicle</h3>
                    <p>Enter your vehicle details</p>
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
                      <label className="form-label">Brand *</label>
                      <BaseInput
                        value={newVehicle.brand}
                        onChange={(value) => handleVehicleInputChange('brand', value)}
                        placeholder="e.g., VinFast, Toyota, Honda"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Model *</label>
                      <BaseInput
                        value={newVehicle.model}
                        onChange={(value) => handleVehicleInputChange('model', value)}
                        placeholder="e.g., VF8, Camry, CR-V"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Year</label>
                      <BaseInput
                        value={newVehicle.year}
                        onChange={(value) => handleVehicleInputChange('year', value)}
                        type="number"
                        placeholder="2023"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Color</label>
                      <BaseInput
                        value={newVehicle.color}
                        onChange={(value) => handleVehicleInputChange('color', value)}
                        placeholder="e.g., White, Black, Red"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">License Plate *</label>
                      <BaseInput
                        value={newVehicle.licensePlate}
                        onChange={(value) => handleVehicleInputChange('licensePlate', value)}
                        placeholder="e.g., 30A-12345"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Next Maintenance</label>
                      <BaseInput
                        value={newVehicle.nextMaintenance}
                        onChange={(value) => handleVehicleInputChange('nextMaintenance', value)}
                        placeholder="e.g., 5,000 km or 01/04/2024"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vehicle Image</label>
                    <div
                      className="image-upload-area"
                      onClick={handleVehicleImageClick}
                    >
                      {newVehicle.image ? (
                        <img src={newVehicle.image} alt="Vehicle preview" className="image-preview" />
                      ) : (
                        <div className="upload-placeholder">
                          <PhotoIcon className="w-8 h-8" />
                          <span>Click to upload vehicle image</span>
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
                  Cancel
                </BaseButton>
                <BaseButton
                  variant="primary"
                  onClick={handleAddVehicle}
                  disabled={!newVehicle.brand || !newVehicle.model || !newVehicle.licensePlate}
                  className="add-vehicle-btn"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Vehicle
                </BaseButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Settings, Shield, Clock, CreditCard, User, Bell, FileText, Search, Unlock, Save, AlertCircle, CheckCircle, Hash, Key, Route, DollarSign, Cookie, Globe, Calendar, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfigurationService } from '@/services/configurationService'
import type {
  LoginLockoutConfig,
  BookingRealtimeSettings,
  PayOsSettings,
  GuestSessionSettings,
  MaintenanceReminderSettings,
  LockoutStatus,
  Features,
  BusinessRules
} from '@/services/configurationService'
import '../Admin/admin.scss'

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('login-lockout')
  const [saving, setSaving] = useState(false)

  // Input style helper
  const inputStyle = {
    width: '100%',
    maxWidth: '420px',
    padding: '14px 16px 14px 44px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: '#ffffff',
    color: '#1a1a1a',
    fontFamily: 'inherit'
  } as React.CSSProperties

  const inputWrapperStyle = {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '420px'
  } as React.CSSProperties

  const inputIconStyle = {
    position: 'absolute' as const,
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    zIndex: 1,
    pointerEvents: 'none' as const
  } as React.CSSProperties

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: '10px',
    letterSpacing: '-0.01em'
  } as React.CSSProperties

  // Form states
  const [loginLockoutConfig, setLoginLockoutConfig] = useState<LoginLockoutConfig>({
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    cacheKeyPrefix: 'lockout',
    enabled: true
  })

  const [bookingRealtime, setBookingRealtime] = useState<BookingRealtimeSettings>({
    holdTtlMinutes: 30,
    hubPath: '/bookingHub'
  })

  const [payOs, setPayOs] = useState<PayOsSettings>({
    minAmount: 1000,
    descriptionMaxLength: 255
  })

  const [guestSession, setGuestSession] = useState<GuestSessionSettings>({
    cookieName: 'guest_session',
    ttlMinutes: 60,
    secureOnly: true,
    sameSite: 'Lax',
    path: '/'
  })

  const [maintenanceReminder, setMaintenanceReminder] = useState<MaintenanceReminderSettings>({
    upcomingDays: 7,
    dispatchHourLocal: 9,
    timeZoneId: 'Asia/Ho_Chi_Minh'
  })

  // Lockout management
  const [searchEmail, setSearchEmail] = useState('')
  const [lockoutStatus, setLockoutStatus] = useState<LockoutStatus | null>(null)
  const [searching, setSearching] = useState(false)

  // Read-only data
  const [features, setFeatures] = useState<Features | null>(null)
  const [rules, setRules] = useState<BusinessRules | null>(null)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      switch (activeTab) {
        case 'login-lockout':
          const loginConfig = await ConfigurationService.getLoginLockoutConfig()
          setLoginLockoutConfig(loginConfig)
          break
        case 'booking-realtime':
          const booking = await ConfigurationService.getBookingRealtime()
          setBookingRealtime(booking)
          break
        case 'payos':
          const payos = await ConfigurationService.getPayOs()
          setPayOs(payos)
          break
        case 'guest-session':
          const guest = await ConfigurationService.getGuestSession()
          setGuestSession(guest)
          break
        case 'maintenance-reminder':
          const reminder = await ConfigurationService.getMaintenanceReminder()
          setMaintenanceReminder(reminder)
          break
        case 'features-rules':
          const [feat, rul] = await Promise.all([
            ConfigurationService.getFeatures(),
            ConfigurationService.getRules()
          ])
          setFeatures(feat)
          setRules(rul)
          break
      }
    } catch (error: any) {
      toast.error(error?.userMessage || error?.message || 'Không thể tải dữ liệu')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      switch (activeTab) {
        case 'login-lockout':
          await ConfigurationService.updateLoginLockoutConfig({
            maxFailedAttempts: loginLockoutConfig.maxFailedAttempts,
            lockoutDurationMinutes: loginLockoutConfig.lockoutDurationMinutes,
            cacheKeyPrefix: loginLockoutConfig.cacheKeyPrefix,
            enabled: loginLockoutConfig.enabled
          })
          break
        case 'booking-realtime':
          await ConfigurationService.updateBookingRealtime({
            holdTtlMinutes: bookingRealtime.holdTtlMinutes,
            hubPath: bookingRealtime.hubPath
          })
          break
        case 'payos':
          await ConfigurationService.updatePayOs({
            minAmount: payOs.minAmount,
            descriptionMaxLength: payOs.descriptionMaxLength
          })
          break
        case 'guest-session':
          await ConfigurationService.updateGuestSession({
            cookieName: guestSession.cookieName,
            ttlMinutes: guestSession.ttlMinutes,
            secureOnly: guestSession.secureOnly,
            sameSite: guestSession.sameSite,
            path: guestSession.path
          })
          break
        case 'maintenance-reminder':
          await ConfigurationService.updateMaintenanceReminder({
            upcomingDays: maintenanceReminder.upcomingDays,
            dispatchHourLocal: maintenanceReminder.dispatchHourLocal,
            timeZoneId: maintenanceReminder.timeZoneId
          })
          break
      }
      toast.success('Cập nhật thành công!')
    } catch (error: any) {
      toast.error(error?.userMessage || error?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleSearchLockout = async () => {
    if (!searchEmail.trim()) {
      toast.error('Vui lòng nhập email')
      return
    }
    setSearching(true)
    try {
      const status = await ConfigurationService.getLockoutStatus(searchEmail.trim())
      setLockoutStatus(status)
    } catch (error: any) {
      toast.error(error?.userMessage || error?.message || 'Không tìm thấy thông tin')
      setLockoutStatus(null)
    } finally {
      setSearching(false)
    }
  }

  const handleUnlock = async (email: string) => {
    if (!confirm(`Bạn có chắc chắn muốn mở khóa tài khoản ${email}?`)) return
    try {
      await ConfigurationService.unlockAccount(email)
      toast.success(`Đã mở khóa tài khoản ${email}`)
      if (lockoutStatus?.email === email) {
        handleSearchLockout()
      }
    } catch (error: any) {
      toast.error(error?.userMessage || error?.message || 'Mở khóa thất bại')
    }
  }

  const tabs = [
    { id: 'login-lockout', label: 'Bảo mật đăng nhập', icon: Shield },
    { id: 'booking-realtime', label: 'Booking Realtime', icon: Clock },
    { id: 'payos', label: 'PayOS', icon: CreditCard },
    { id: 'guest-session', label: 'Guest Session', icon: User },
    { id: 'maintenance-reminder', label: 'Nhắc nhở bảo trì', icon: Bell },
    { id: 'lockout-management', label: 'Quản lý Lockout', icon: Unlock },
    { id: 'features-rules', label: 'Features & Rules', icon: FileText }
  ]

  return (
    <div style={{
      padding: '32px',
      background: '#ffffff',
      minHeight: 'calc(100vh - 96px)',
      fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        background: '#ffffff',
        padding: '28px 32px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '400',
            color: '#1a1a1a',
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            letterSpacing: '-0.02em'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(254, 243, 199, 0.25)'
            }}>
              <Settings size={24} color="#1a1a1a" />
            </div>
            Cài đặt hệ thống
          </h2>
          <p style={{
            fontSize: '15px',
            color: '#6b7280',
            margin: '0',
            fontWeight: '400'
          }}>
            Quản lý cấu hình và tùy chỉnh hệ thống
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          overflowX: 'auto',
          padding: '4px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 22px',
                border: 'none',
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' 
                  : 'transparent',
                color: activeTab === tab.id ? '#1a1a1a' : '#6b7280',
                fontSize: '13px',
                fontWeight: '400',
                cursor: 'pointer',
                borderRadius: '10px',
                whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '40px' }}>
          {activeTab === 'login-lockout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div>
                  <label style={labelStyle}>
                    Số lần thử tối đa (1-20)
                  </label>
                  <div style={inputWrapperStyle}>
                    <Hash size={16} style={inputIconStyle} />
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={loginLockoutConfig.maxFailedAttempts}
                      onChange={(e) => setLoginLockoutConfig(prev => ({
                        ...prev,
                        maxFailedAttempts: parseInt(e.target.value) || 1
                      }))}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#fde68a'
                        e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>
                    Thời gian khóa (phút, 1-1440)
                  </label>
                  <div style={inputWrapperStyle}>
                    <Clock size={16} style={inputIconStyle} />
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={loginLockoutConfig.lockoutDurationMinutes}
                      onChange={(e) => setLoginLockoutConfig(prev => ({
                        ...prev,
                        lockoutDurationMinutes: parseInt(e.target.value) || 1
                      }))}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#fde68a'
                        e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>
                  Cache Key Prefix
                </label>
                <div style={inputWrapperStyle}>
                  <Key size={16} style={inputIconStyle} />
                  <input
                    type="text"
                    maxLength={50}
                    value={loginLockoutConfig.cacheKeyPrefix}
                    onChange={(e) => setLoginLockoutConfig(prev => ({
                      ...prev,
                      cacheKeyPrefix: e.target.value
                    }))}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 20px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                maxWidth: '420px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '400', color: '#1a1a1a' }}>
                  Bật tính năng khóa tài khoản
                </span>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '50px',
                  height: '24px'
                }}>
                  <input
                    type="checkbox"
                    checked={loginLockoutConfig.enabled}
                    onChange={(e) => setLoginLockoutConfig(prev => ({
                      ...prev,
                      enabled: e.target.checked
                    }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: loginLockoutConfig.enabled ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : '#d1d5db',
                    transition: '0.4s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: loginLockoutConfig.enabled ? '26px' : '3px',
                      bottom: '3px',
                      background: 'white',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'booking-realtime' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <label style={labelStyle}>
                  Hold TTL (phút)
                </label>
                <div style={inputWrapperStyle}>
                  <Clock size={16} style={inputIconStyle} />
                  <input
                    type="number"
                    min="1"
                    value={bookingRealtime.holdTtlMinutes}
                    onChange={(e) => setBookingRealtime(prev => ({
                      ...prev,
                      holdTtlMinutes: parseInt(e.target.value) || 1
                    }))}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>
                  Hub Path
                </label>
                <div style={inputWrapperStyle}>
                  <Route size={16} style={inputIconStyle} />
                  <input
                    type="text"
                    value={bookingRealtime.hubPath}
                    onChange={(e) => setBookingRealtime(prev => ({
                      ...prev,
                      hubPath: e.target.value
                    }))}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <label style={labelStyle}>
                  Số tiền tối thiểu (VND)
                </label>
                <div style={inputWrapperStyle}>
                  <DollarSign size={16} style={inputIconStyle} />
                  <input
                    type="number"
                    min="0"
                    value={payOs.minAmount}
                    onChange={(e) => setPayOs(prev => ({
                      ...prev,
                      minAmount: parseInt(e.target.value) || 0
                    }))}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>
                  Độ dài mô tả tối đa
                </label>
                <div style={inputWrapperStyle}>
                  <FileText size={16} style={inputIconStyle} />
                  <input
                    type="number"
                    min="1"
                    value={payOs.descriptionMaxLength}
                    onChange={(e) => setPayOs(prev => ({
                      ...prev,
                      descriptionMaxLength: parseInt(e.target.value) || 1
                    }))}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guest-session' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <label style={labelStyle}>
                  Cookie Name
                </label>
                <div style={inputWrapperStyle}>
                  <Cookie size={16} style={inputIconStyle} />
                  <input
                    type="text"
                    value={guestSession.cookieName}
                    onChange={(e) => setGuestSession(prev => ({
                      ...prev,
                      cookieName: e.target.value
                    }))}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div>
                  <label style={labelStyle}>
                    TTL (phút)
                  </label>
                  <div style={inputWrapperStyle}>
                    <Clock size={16} style={inputIconStyle} />
                    <input
                      type="number"
                      min="1"
                      value={guestSession.ttlMinutes}
                      onChange={(e) => setGuestSession(prev => ({
                        ...prev,
                        ttlMinutes: parseInt(e.target.value) || 1
                      }))}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#fde68a'
                        e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>
                    Same Site
                  </label>
                  <div style={inputWrapperStyle}>
                    <Globe size={16} style={inputIconStyle} />
                    <select
                      value={guestSession.sameSite}
                      onChange={(e) => setGuestSession(prev => ({
                        ...prev,
                        sameSite: e.target.value
                      }))}
                      style={{
                        ...inputStyle,
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#fde68a'
                        e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      <option value="None">None</option>
                      <option value="Lax">Lax</option>
                      <option value="Strict">Strict</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>
                  Path
                </label>
                <div style={inputWrapperStyle}>
                  <Route size={16} style={inputIconStyle} />
                  <input
                    type="text"
                    value={guestSession.path}
                    onChange={(e) => setGuestSession(prev => ({
                      ...prev,
                      path: e.target.value
                    }))}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 20px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                maxWidth: '420px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '400', color: '#1a1a1a' }}>
                  Secure Only
                </span>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '50px',
                  height: '24px'
                }}>
                  <input
                    type="checkbox"
                    checked={guestSession.secureOnly}
                    onChange={(e) => setGuestSession(prev => ({
                      ...prev,
                      secureOnly: e.target.checked
                    }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: guestSession.secureOnly ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : '#d1d5db',
                    transition: '0.4s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: guestSession.secureOnly ? '26px' : '3px',
                      bottom: '3px',
                      background: 'white',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'maintenance-reminder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div>
                  <label style={labelStyle}>
                    Số ngày trước khi nhắc nhở
                  </label>
                  <div style={inputWrapperStyle}>
                    <Calendar size={16} style={inputIconStyle} />
                    <input
                      type="number"
                      min="1"
                      value={maintenanceReminder.upcomingDays}
                      onChange={(e) => setMaintenanceReminder(prev => ({
                        ...prev,
                        upcomingDays: parseInt(e.target.value) || 1
                      }))}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#fde68a'
                        e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>
                    Giờ gửi thông báo (0-23)
                  </label>
                  <div style={inputWrapperStyle}>
                    <Clock size={16} style={inputIconStyle} />
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={maintenanceReminder.dispatchHourLocal}
                      onChange={(e) => setMaintenanceReminder(prev => ({
                        ...prev,
                        dispatchHourLocal: parseInt(e.target.value) || 0
                      }))}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#fde68a'
                        e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>
                  Time Zone ID
                </label>
                <div style={inputWrapperStyle}>
                  <Globe size={16} style={inputIconStyle} />
                  <input
                    type="text"
                    value={maintenanceReminder.timeZoneId}
                    onChange={(e) => setMaintenanceReminder(prev => ({
                      ...prev,
                      timeZoneId: e.target.value
                    }))}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(254, 243, 199, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lockout-management' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>
                    Email tài khoản
                  </label>
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchLockout()}
                    placeholder="Nhập email để tìm kiếm"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366f1'
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <button
                  onClick={handleSearchLockout}
                  disabled={searching}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '400',
                    cursor: searching ? 'not-allowed' : 'pointer',
                    opacity: searching ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(254, 243, 199, 0.35)'
                  }}
                  onMouseEnter={(e) => {
                    if (!searching) {
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(254, 243, 199, 0.45)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 243, 199, 0.35)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Search size={16} />
                  {searching ? 'Đang tìm...' : 'Tìm kiếm'}
                </button>
              </div>

              {lockoutStatus && (
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                    fontSize: '15px',
                    fontWeight: '400',
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      Trạng thái Lockout
                    </h3>
                    {lockoutStatus.isLocked && (
                      <button
                        onClick={() => handleUnlock(lockoutStatus.email)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '400',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <Unlock size={16} />
                        Mở khóa
                      </button>
                    )}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>Email</div>
                      <div style={{ fontSize: '14px', fontWeight: '400', color: '#1a1a1a' }}>
                        {lockoutStatus.email}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>Trạng thái</div>
                      <div style={{
                      fontSize: '14px',
                      fontWeight: '400',
                        color: lockoutStatus.isLocked ? '#ef4444' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {lockoutStatus.isLocked ? (
                          <>
                            <AlertCircle size={18} />
                            Đã khóa
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Bình thường
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>Số lần thử còn lại</div>
                      <div style={{ fontSize: '14px', fontWeight: '400', color: '#1a1a1a' }}>
                        {lockoutStatus.remainingAttempts}
                      </div>
                    </div>
                    {lockoutStatus.lockoutExpiry && (
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>Hết hạn khóa</div>
                        <div style={{ fontSize: '14px', fontWeight: '400', color: '#1a1a1a' }}>
                          {new Date(lockoutStatus.lockoutExpiry).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'features-rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {features && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '400',
                    color: '#1a1a1a',
                    marginBottom: '24px',
                    letterSpacing: '-0.01em'
                  }}>
                    Features
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px'
                  }}>
                    {Object.entries(features).map(([key, value]) => (
                      <div
                        key={key}
                        style={{
                          padding: '18px 20px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '400' }}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '400',
                          background: value ? '#d1fae5' : '#fee2e2',
                          color: value ? '#065f46' : '#991b1b'
                        }}>
                          {value ? 'Bật' : 'Tắt'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rules && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '400',
                    color: '#1a1a1a',
                    marginBottom: '24px',
                    letterSpacing: '-0.01em'
                  }}>
                    Business Rules
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '20px'
                  }}>
                    {Object.entries(rules).map(([category, config]) => (
                      <div
                        key={category}
                        style={{
                          padding: '24px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '16px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <h4 style={{
                    fontSize: '15px',
                    fontWeight: '400',
                          color: '#1a1a1a',
                          marginBottom: '16px',
                          textTransform: 'capitalize',
                          letterSpacing: '-0.01em'
                        }}>
                          {category}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {Object.entries(config).map(([key, value]) => (
                            <div key={key} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '14px',
                              paddingBottom: '12px',
                              borderBottom: '1px solid #f3f4f6'
                            }}>
                              <span style={{ color: '#6b7280', fontWeight: '500' }}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                              </span>
                              <span style={{ fontWeight: '400', color: '#1a1a1a' }}>
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {activeTab !== 'lockout-management' && activeTab !== 'features-rules' && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '14px',
            padding: '24px 40px',
            background: '#ffffff',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: '400',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(254, 243, 199, 0.35)'
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(254, 243, 199, 0.45)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 243, 199, 0.35)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Save size={16} />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


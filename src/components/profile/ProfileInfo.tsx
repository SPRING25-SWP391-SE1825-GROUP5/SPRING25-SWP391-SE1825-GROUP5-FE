import { useEffect, useState } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { updateUser } from '@/store/authSlice'
import { AuthService } from '@/services'
import { PencilSquareIcon, XMarkIcon, CheckIcon, UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CalendarIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

export default function ProfileInfo() {
  const dispatch = useAppDispatch()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [infoErrors, setInfoErrors] = useState<{ fullName?: string; email?: string; phoneNumber?: string }>({})
  // Change password states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>({})
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [showSettings, setShowSettings] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const resp = await AuthService.getProfile()
      type ProfileResp = {
        fullName?: string
        email?: string
        phoneNumber?: string
        address?: string
        dateOfBirth?: string
      }
      const u = ((resp as unknown as { data?: ProfileResp })?.data ?? (resp as unknown as ProfileResp)) || {}
      if (u) {
        setFullName(u.fullName || '')
        setEmail(u.email || '')
        setPhoneNumber(u.phoneNumber || '')
        setAddress(u.address || '')
        setDateOfBirth(u.dateOfBirth || '')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // validate required fields when editing
    if (isEditing) {
      const errs: { fullName?: string; email?: string; phoneNumber?: string } = {}
      if (!fullName) errs.fullName = 'Vui lòng nhập họ và tên'
      if (!email) errs.email = 'Vui lòng nhập email'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email không hợp lệ'
      if (!phoneNumber) errs.phoneNumber = 'Vui lòng nhập số điện thoại'
      setInfoErrors(errs)
      if (errs.fullName || errs.email || errs.phoneNumber) return
    }
    setSaving(true)
    try {
      const resp = await AuthService.updateProfile({ fullName, email, phoneNumber, address, dateOfBirth })
      if (resp?.success && resp.data) {
        dispatch(updateUser(resp.data))
        setIsEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const Input = ({ readOnly, disabled, style, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) => (
    <input
      {...props}
      readOnly={readOnly}
      disabled={disabled}
      style={{
        width: '100%',
        maxWidth: '450px',
        padding: '8px 10px',
        border: `1px solid ${('error' in props && (props as { error?: boolean }).error ? '#ef4444' : '#e5e7eb')}`,
        borderRadius: 8,
        background: '#ffffff',
        color: '#111827',
        boxSizing: 'border-box',
        height: '38px',
        lineHeight: '22px',
        ...(style || {}),
      }}
    />
  )

  if (loading) return <div className="profile-v2__section"><div className="profile-v2__empty">Đang tải...</div></div>

  return (
    <div className="profile-v2__section">
      <div className="profile-v2__card" style={{ padding: 16 }}>
        <div className="profile-v2__card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Thông tin cá nhân</span>
          {!isEditing ? (
            <button className="profile-v2__edit-btn" onClick={() => setIsEditing(true)}>
              <PencilSquareIcon width={16} height={16} />
              <span>Sửa</span>
            </button>
          ) : null}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <UserIcon width={16} height={16} />
                Họ và tên <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </label>
            <Input
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
              onBlur={() => {
                const msg = fullName ? undefined : 'Vui lòng nhập họ và tên'
                setInfoErrors((prev) => ({ ...prev, fullName: msg }))
              }}
              readOnly={!isEditing}
              error={isEditing && !!infoErrors.fullName}
            />
            {isEditing && infoErrors.fullName && (<div style={{ color: '#dc2626', marginTop: 4 }}>{infoErrors.fullName}</div>)}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <EnvelopeIcon width={16} height={16} />
                Email <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              onBlur={() => {
                let msg: string | undefined
                if (!email) msg = 'Vui lòng nhập email'
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) msg = 'Email không hợp lệ'
                setInfoErrors((prev) => ({ ...prev, email: msg }))
              }}
              readOnly={!isEditing}
              error={isEditing && !!infoErrors.email}
            />
            {isEditing && infoErrors.email && (<div style={{ color: '#dc2626', marginTop: 4 }}>{infoErrors.email}</div>)}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <PhoneIcon width={16} height={16} />
                Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </label>
            <Input
              placeholder="Nhập số điện thoại"
              value={phoneNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
              onBlur={() => {
                const msg = phoneNumber ? undefined : 'Vui lòng nhập số điện thoại'
                setInfoErrors((prev) => ({ ...prev, phoneNumber: msg }))
              }}
              readOnly={!isEditing}
              error={isEditing && !!infoErrors.phoneNumber}
            />
            {isEditing && infoErrors.phoneNumber && (<div style={{ color: '#dc2626', marginTop: 4 }}>{infoErrors.phoneNumber}</div>)}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MapPinIcon width={16} height={16} />
                Địa chỉ
              </span>
            </label>
            <Input placeholder="Nhập địa chỉ" value={address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)} readOnly={!isEditing} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CalendarIcon width={16} height={16} />
                Ngày sinh
              </span>
            </label>
            <Input type="date" placeholder="YYYY-MM-DD" value={dateOfBirth} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateOfBirth(e.target.value)} readOnly={!isEditing} />
          </div>
        </div>

        {isEditing && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="profile-v2__action-btn" onClick={() => { setIsEditing(false); loadProfile() }} disabled={saving}>
              <XMarkIcon width={16} height={16} />
              <span>Hủy</span>
            </button>
            <button className="profile-v2__action-btn profile-v2__save-btn" onClick={handleSave} disabled={saving}>
              <CheckIcon width={16} height={16} />
              <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Account settings moved from navbar */}
      <div className="profile-v2__card" style={{ padding: 16, marginTop: 16 }}>
        <div className="profile-v2__card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Cài đặt tài khoản</span>
          <button
            type="button"
            className="profile-v2__action-btn"
            aria-expanded={showSettings}
            onClick={() => setShowSettings((s) => !s)}
          >
            {showSettings ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ChevronUpIcon width={16} height={16} />
                <span>Thu gọn</span>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ChevronDownIcon width={16} height={16} />
                <span>Mở rộng</span>
              </span>
            )}
          </button>
        </div>
        {/* Change Password Form */}
        <form
          autoComplete="on"
          onSubmit={async (e) => {
            e.preventDefault()
            setPasswordError(null)
            setPwErrors({})
            const errs: { current?: string; next?: string; confirm?: string } = {}
            if (!currentPassword) errs.current = 'Vui lòng nhập mật khẩu hiện tại'
            if (!newPassword) errs.next = 'Vui lòng nhập mật khẩu mới'
            else if (newPassword.length < 6) errs.next = 'Mật khẩu mới phải có ít nhất 6 ký tự'
            if (!confirmPassword) errs.confirm = 'Vui lòng xác nhận mật khẩu mới'
            else if (newPassword !== confirmPassword) errs.confirm = 'Mật khẩu xác nhận không khớp'
            if (errs.current || errs.next || errs.confirm) {
              setPwErrors(errs)
              return
            }
            try {
              setSavingPassword(true)
              const resp = await AuthService.changePassword({ currentPassword, newPassword, confirmNewPassword: confirmPassword })
              if (resp?.success) {
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
              } else {
                setPasswordError(resp?.message || 'Đổi mật khẩu thất bại')
              }
            } finally {
              setSavingPassword(false)
            }
          }}
        >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          overflow: 'hidden',
          maxHeight: showSettings ? 900 : 0,
          transition: 'max-height .35s ease',
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Mật khẩu hiện tại <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
              <Input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                name="current-password"
                placeholder="Mật khẩu hiện tại"
                error={!!pwErrors.current}
              />
              {pwErrors.current && (<div style={{ color: '#dc2626', marginTop: 4 }}>{pwErrors.current}</div>)}
              <button
                type="button"
                onClick={() => setShowCurrentPw((s) => !s)}
                aria-label={showCurrentPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{ position: 'absolute', right: 8, top: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                {showCurrentPw ? <EyeSlashIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
              <Input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                name="new-password"
                placeholder="Mật khẩu mạnh (tối thiểu 6 ký tự)"
                error={!!pwErrors.next}
              />
              {pwErrors.next && (<div style={{ color: '#dc2626', marginTop: 4 }}>{pwErrors.next}</div>)}
              <button
                type="button"
                onClick={() => setShowNewPw((s) => !s)}
                aria-label={showNewPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{ position: 'absolute', right: 8, top: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                {showNewPw ? <EyeSlashIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Xác nhận mật khẩu mới <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
              <Input
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                name="confirm-new-password"
                placeholder="Xác nhận mật khẩu mới"
                error={!!pwErrors.confirm}
              />
              {pwErrors.confirm && (<div style={{ color: '#dc2626', marginTop: 4 }}>{pwErrors.confirm}</div>)}
              <button
                type="button"
                onClick={() => setShowConfirmPw((s) => !s)}
                aria-label={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{ position: 'absolute', right: 8, top: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                {showConfirmPw ? <EyeSlashIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
              </button>
            </div>
          </div>
        </div>
        {passwordError && (
          <div style={{ color: '#dc2626', marginTop: 8 }}>{passwordError}</div>
        )}
        <div style={{
          overflow: 'hidden',
          maxHeight: showSettings ? 120 : 0,
          transition: 'max-height .35s ease, opacity .25s ease, margin-top .35s ease',
          opacity: showSettings ? 1 : 0,
          marginTop: showSettings ? 16 : 0,
        }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              className="profile-v2__action-btn"
              onClick={() => {
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError(null)
              }}
              disabled={savingPassword}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <XMarkIcon width={16} height={16} />
                <span>Hủy</span>
              </span>
            </button>
            <button
              className="profile-v2__action-btn profile-v2__save-btn"
              type="submit"
              disabled={savingPassword}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckIcon width={16} height={16} />
                <span>{savingPassword ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </span>
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  )
}



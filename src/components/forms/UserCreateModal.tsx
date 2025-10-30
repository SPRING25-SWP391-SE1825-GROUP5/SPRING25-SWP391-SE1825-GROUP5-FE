import React from 'react'
import 'react-day-picker/dist/style.css'
import './UserCreateModal.scss'
import { XMarkIcon, ArrowsPointingOutIcon, EllipsisHorizontalIcon, MinusSmallIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon, UserIcon, AtSymbolIcon, PhoneIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { UserService, type CreateUserAdminRequest } from '@/services/userService'
import { DayPicker } from 'react-day-picker'
import { vi } from 'date-fns/locale'
import toast from 'react-hot-toast'

type UserCreateModalProps = {
  open: boolean
  title?: string
  onClose?: () => void
  onCreate?: () => void
  children?: React.ReactNode
}

/**
 * Modal tạo người dùng (skeleton)
 * - Width: 900px
 * - Bố cục: header | body | footer
 * - Icon góc phải: thu nhỏ, fullscreen, more, đóng (Heroicons)
 */
const UserCreateModal: React.FC<UserCreateModalProps> = ({ open, title = 'Tạo người dùng mới', onClose, onCreate, children }) => {
  const [minimized, setMinimized] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [form, setForm] = React.useState<CreateUserAdminRequest>({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: false,
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const dobWrapRef = React.useRef<HTMLDivElement>(null)
  const dobInputRef = React.useRef<HTMLInputElement>(null)
  const [openDob, setOpenDob] = React.useState(false)
  const [dpWidth, setDpWidth] = React.useState<number>(420)
  React.useEffect(() => {
    const update = () => setDpWidth(Math.max(dobWrapRef.current?.offsetWidth || 0, 420))
    update();
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const setField = (k: keyof CreateUserAdminRequest, v: string | boolean) => {
    setForm(prev => ({ ...prev, [k]: v } as any))
    setErrors(prev => ({ ...prev, [k]: '' }))
  }

  const getAge = (iso: string) => {
    if (!iso) return 0
    const dob = new Date(iso)
    const now = new Date()
    let age = now.getFullYear() - dob.getFullYear()
    const m = now.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
    return age
  }

  // HeroUI DatePicker selector icon
  const SelectorIcon = () => (
    <svg height="1em" viewBox="0 0 24 24" width="1em">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M8 2v4m8-4v4" />
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
      </g>
    </svg>
  )

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ'
    if (!/^0\d{9}$/.test(form.phoneNumber)) e.phoneNumber = 'Số điện thoại phải có 10 số và bắt đầu bằng 0'
    if (!form.dateOfBirth) e.dateOfBirth = 'Vui lòng chọn ngày sinh'
    else if (getAge(form.dateOfBirth) < 16) e.dateOfBirth = 'Tuổi tối thiểu là 16'
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ'
    if (!form.gender) e.gender = 'Vui lòng chọn giới tính'
    if (!form.role) e.role = 'Vui lòng chọn vai trò'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      setSubmitting(true)
      const res = await UserService.createUserAdmin(form)
      toast.success('Tạo người dùng thành công')
      onCreate?.()
      onClose?.()
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors as Record<string, string[]>
      const message = err?.response?.data?.message as string | undefined
      if (apiErrors) {
        const mapped: Record<string, string> = {}
        Object.entries(apiErrors).forEach(([k, v]) => { mapped[k] = (v?.[0] as string) || '' })
        setErrors(prev => ({ ...prev, ...mapped }))
      }
      if (message) {
        const msg = message.toLowerCase()
        if (msg.includes('email')) {
          setErrors(prev => ({ ...prev, email: message }))
        } else if (msg.includes('số điện thoại') || msg.includes('phone')) {
          setErrors(prev => ({ ...prev, phoneNumber: message }))
        } else {
          toast.error(message)
        }
      } else {
        toast.error('Không thể tạo người dùng')
      }
    } finally {
      setSubmitting(false)
    }
  }
  if (!open) return null
  return (
    <div className={`ucm-overlay ${minimized ? 'ucm-overlay--min' : ''}`} role="dialog" aria-modal="true">
      <div className={`ucm-container ${minimized ? 'ucm-container--min' : ''}`}>
        {/* Header */}
        <div className="ucm-header">
          <h3 className="ucm-title">{title}</h3>
          <div className="ucm-actions">
            {!minimized && (
              <button type="button" className="ucm-icon" aria-label="Thu nhỏ" onClick={() => setMinimized(true)}>
                <MinusSmallIcon width={18} height={18} />
              </button>
            )}
            {minimized && (
              <button type="button" className="ucm-icon" aria-label="Phóng to" onClick={() => setMinimized(false)}>
                <ArrowsPointingOutIcon width={18} height={18} />
              </button>
            )}
            <button type="button" className="ucm-icon" aria-label="Tùy chọn">
              <EllipsisHorizontalIcon width={18} height={18} />
            </button>
            <button type="button" className="ucm-icon ucm-close" aria-label="Đóng" onClick={onClose}>
              <XMarkIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="ucm-body">
          {children ?? (
            <form className="ucm-form" onSubmit={(e)=>{e.preventDefault(); handleSubmit();}}>
              <div className="ucm-grid">
                {/* Left column */}
                <div className="ucm-col">
                  <div className={`ucm-field ${errors.fullName ? 'is-error' : ''}`}>
                    <label className="ucm-label">Họ và tên <span className="req">*</span></label>
                    <div className="ucm-inputwrap">
                      <UserIcon className="ucm-ico" width={16} height={16} />
                      <input value={form.fullName} onChange={(e)=>setField('fullName', e.target.value)} placeholder="Nhập họ và tên" />
                    </div>
                    {errors.fullName && <div className="ucm-error">{errors.fullName}</div>}
                  </div>

                  <div className={`ucm-field ${errors.email ? 'is-error' : ''}`}>
                    <label className="ucm-label">Email <span className="req">*</span></label>
                    <div className="ucm-inputwrap">
                      <AtSymbolIcon className="ucm-ico" width={16} height={16} />
                      <input value={form.email} onChange={(e)=>setField('email', e.target.value)} placeholder="Nhập email" />
                    </div>
                    {errors.email && <div className="ucm-error">{errors.email}</div>}
                  </div>

                  <div className={`ucm-field ${errors.dateOfBirth ? 'is-error' : ''}`}>
                    <label className="ucm-label">Ngày sinh <span className="req">*</span></label>
                    <div className="ucm-inputwrap is-date" style={{paddingLeft:0}} ref={dobWrapRef}>
                      <input
                        type="date"
                        ref={dobInputRef}
                        value={form.dateOfBirth}
                        placeholder="mm/dd/yyyy"
                        onChange={(e)=>setField('dateOfBirth', e.target.value)}
                      />
                      <span className="ucm-ico-right" role="button" aria-label="Chọn ngày"
                        onClick={() => {
                          const el = dobInputRef.current;
                          if (!el) return;
                          // @ts-ignore
                          if (typeof el.showPicker === 'function') { // chrome, edge
                            // @ts-ignore
                            el.showPicker();
                          } else {
                            el.focus();
                            el.click();
                          }
                        }}
                      >
                        <SelectorIcon />
                      </span>
                    </div>
                    {errors.dateOfBirth && <div className="ucm-error">{errors.dateOfBirth}</div>}
                  </div>

                  <div className={`ucm-field ${errors.address ? 'is-error' : ''}`}>
                    <label className="ucm-label">Địa chỉ <span className="req">*</span></label>
                    <div className="ucm-inputwrap">
                      <MapPinIcon className="ucm-ico" width={16} height={16} />
                      <input value={form.address} onChange={(e)=>setField('address', e.target.value)} placeholder="Nhập địa chỉ" />
                    </div>
                    {errors.address && <div className="ucm-error">{errors.address}</div>}
                  </div>
                </div>

                {/* Right column */}
                <div className="ucm-col">
                  <div className={`ucm-field ${errors.phoneNumber ? 'is-error' : ''}`}>
                    <label className="ucm-label">Số điện thoại <span className="req">*</span></label>
                    <div className="ucm-inputwrap">
                      <PhoneIcon className="ucm-ico" width={16} height={16} />
                      <input value={form.phoneNumber} onChange={(e)=>setField('phoneNumber', e.target.value)} placeholder="Nhập số điện thoại" />
                    </div>
                    {errors.phoneNumber && <div className="ucm-error">{errors.phoneNumber}</div>}
                  </div>

                  <div className={`ucm-field ${errors.gender ? 'is-error' : ''}`}>
                    <label className="ucm-label">Giới tính <span className="req">*</span></label>
                    <div className="ucm-inputwrap select">
                      <UserIcon className="ucm-ico" width={16} height={16} />
                      <select value={form.gender} onChange={(e)=>setField('gender', e.target.value)}>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                      </select>
                      <ChevronDownIcon className="ucm-caret" width={16} height={16} />
                    </div>
                    {errors.gender && <div className="ucm-error">{errors.gender}</div>}
                  </div>

                  <div className={`ucm-field ${errors.role ? 'is-error' : ''}`}>
                    <label className="ucm-label">Vai trò <span className="req">*</span></label>
                    <div className="ucm-inputwrap select">
                      <ShieldCheckIcon className="ucm-ico" width={16} height={16} />
                      <select value={form.role} onChange={(e)=>setField('role', e.target.value)}>
                        <option value="CUSTOMER">Khách hàng</option>
                        <option value="STAFF">Nhân viên</option>
                        <option value="MANAGER">Quản lí</option>
                        <option value="TECHNICIAN">Kỹ thuật viên</option>
                      </select>
                      <ChevronDownIcon className="ucm-caret" width={16} height={16} />
                    </div>
                    {errors.role && <div className="ucm-error">{errors.role}</div>}
                  </div>

                  <div className="ucm-field-inline">
                    <label className="ucm-switch">
                      <input type="checkbox" checked={form.isActive} onChange={(e)=>setField('isActive', e.target.checked)} />
                      <span /> Hoạt động
                    </label>
                    <label className="ucm-switch">
                      <input type="checkbox" checked={form.emailVerified} onChange={(e)=>setField('emailVerified', e.target.checked)} />
                      <span /> Xác thực email
                    </label>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="ucm-footer">
          <button type="button" className="ucm-btn ucm-btn--ghost" onClick={onClose}>Hủy</button>
          <button type="button" className="ucm-btn ucm-btn--primary" disabled={submitting} onClick={handleSubmit}>{submitting ? 'Đang tạo...' : 'Tạo người dùng'}</button>
        </div>
      </div>
    </div>
  )
}

export default UserCreateModal



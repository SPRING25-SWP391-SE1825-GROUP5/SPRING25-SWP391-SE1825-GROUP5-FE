import React, { useEffect, useState } from 'react'
import { XMarkIcon, MinusSmallIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/solid'
import type { Service } from '../../services/serviceManagementService'
import { toast } from 'react-hot-toast'
import './ServiceCreateModal.scss'

type Props = {
  open: boolean
  onClose: () => void
  initial?: Partial<Service> & { id?: number }
  onSaved?: () => void
}

export default function ServiceCreateModal({ open, onClose, initial, onSaved }: Props) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    price: 0,
    description: '',
    notes: '',
    isActive: true
  })
  const [priceMenuOpen, setPriceMenuOpen] = useState(false)
  const [priceOptions, setPriceOptions] = useState<number[]>([10000, 20000, 50000, 100000])
  const priceWrapRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (priceWrapRef.current && !priceWrapRef.current.contains(e.target as Node)) {
        setPriceMenuOpen(false)
      }
    }
    window.addEventListener('click', onClickOutside)
    return () => window.removeEventListener('click', onClickOutside)
  }, [])

  // Fill form when editing
  useEffect(() => {
    if (open) {
      setErrors({})
      if (initial) {
        setForm({
          name: initial.name || '',
          price: initial.price || 0,
          description: initial.description || '',
          notes: (initial as any).notes || '',
          isActive: initial.isActive ?? true
        })
      } else {
        setForm({ name: '', price: 0, description: '', notes: '', isActive: true })
      }
    }
  }, [open, initial])
  if (!open) return null

  return (
    <div className={`scm-overlay ${isMinimized ? 'scm-overlay--min' : ''}`} role="dialog" aria-modal="true">
      <div className={`scm-container ${isMinimized ? 'scm-container--min' : ''}`}>
        {/* Header */}
        <div className="scm-header">
          <div className="scm-title">
            <h3>{initial?.id ? 'Cập nhật Dịch vụ' : 'Tạo Dịch vụ Mới'}</h3>
            <p>{initial?.id ? 'Chỉnh sửa thông tin dịch vụ' : 'Thêm dịch vụ mới vào hệ thống'}</p>
          </div>
          <div className="scm-actions">
            {!isMinimized && (
              <button type="button" className="scm-action" aria-label="Thu nhỏ" onClick={() => setIsMinimized(true)}>
                <MinusSmallIcon width={18} height={18} />
              </button>
            )}
            {isMinimized && (
              <button type="button" className="scm-action" aria-label="Phóng to" onClick={() => setIsMinimized(false)}>
                <ArrowsPointingOutIcon width={18} height={18} />
              </button>
            )}
            <button type="button" className="scm-action" aria-label="Thêm tuỳ chọn">
              <EllipsisHorizontalIcon width={18} height={18} />
            </button>
            <button type="button" className="scm-action" aria-label="Đóng" onClick={onClose}>
              <XMarkIcon width={20} height={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="scm-body">
          <div className="scm-grid-2cols">
            {/* Left column */}
            <div className="scm-col">
              <div className="scm-field">
                <label>
                  Tên dịch vụ <span className="req">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e)=> setForm(v=>({ ...v, name: e.target.value }))}
                  placeholder="Nhập tên dịch vụ"
                />
                {errors.name && <span className="scm-error">{errors.name}</span>}
              </div>

              <div className="scm-field">
                <label>Mô tả</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e)=> setForm(v=>({ ...v, description: e.target.value }))}
                  placeholder="Nhập mô tả dịch vụ"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="scm-col">
              <div className="scm-field" ref={priceWrapRef}>
                <label>
                  Giá (VNĐ) <span className="req">*</span>
                </label>
                <div className="scm-combo">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.price === 0 ? '' : Number.isFinite(form.price) ? form.price : ''}
                    onChange={(e)=> setForm(v=>({ ...v, price: Number(e.target.value) }))}
                    placeholder="0"
                    onFocus={()=> setPriceMenuOpen(true)}
                  />
                  <button type="button" className="scm-combo-caret" onClick={()=> setPriceMenuOpen(v=>!v)} aria-label="Chọn nhanh giá" />
                  {priceMenuOpen && (
                    <ul className="scm-combo-menu">
                      {priceOptions.map((p)=> (
                        <li key={p} className="scm-combo-item" onClick={()=> { setForm(v=>({ ...v, price: p })); setPriceMenuOpen(false) }}>
                          {p.toLocaleString()} VNĐ
                        </li>
                      ))}
                      <li className="scm-combo-sep" />
                      <li className="scm-combo-item add" onClick={()=>{
                        const val = Math.max(0, Math.round(form.price))
                        if (!priceOptions.includes(val)) setPriceOptions(prev => [...prev, val].sort((a,b)=>a-b))
                        setPriceMenuOpen(false)
                      }}>
                        <PlusIcon width={14} height={14} style={{ marginRight: 6 }} /> Thêm giá {isNaN(form.price as any) ? '' : form.price.toLocaleString()} VNĐ
                      </li>
                    </ul>
                  )}
                </div>
                {errors.price && <span className="scm-error">{errors.price}</span>}
              </div>

              <div className="scm-field">
                <label>Ghi chú</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e)=> setForm(v=>({ ...v, notes: e.target.value }))}
                  placeholder="Nhập ghi chú (nếu có)"
                />
              </div>

              <div className="scm-field scm-switch">
                <label>Trạng thái</label>
                <div className="scm-switch-row">
                  <label className="scm-toggle">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e)=> setForm(v=>({ ...v, isActive: e.target.checked }))}
                    />
                    <span className="scm-toggle-slider" />
                  </label>
                  <span className="scm-switch-text">Hoạt động</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="scm-footer">
          <button type="button" className="scm-btn" onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="scm-btn scm-btn--primary"
            disabled={submitting}
            onClick={async ()=>{
              const next: Record<string,string> = {}
              if (!form.name.trim()) next.name = 'Tên dịch vụ là bắt buộc'
              if (form.price < 0) next.price = 'Giá phải lớn hơn hoặc bằng 0'
              setErrors(next)
              if (Object.keys(next).length) return
              try {
                setSubmitting(true)
                const { ServiceManagementService } = await import('../../services/serviceManagementService')
                if (initial?.id) {
                  await ServiceManagementService.updateService(initial.id, {
                    name: form.name,
                    description: form.description,
                    price: form.price,
                    notes: form.notes,
                    isActive: form.isActive
                  } as any)
                  toast.success('Cập nhật dịch vụ thành công')
                } else {
                  await ServiceManagementService.createService({
                    name: form.name,
                    description: form.description,
                    price: form.price,
                    notes: form.notes,
                    isActive: form.isActive
                  } as any)
                  toast.success('Tạo dịch vụ thành công')
                }
                onClose()
                onSaved && onSaved()
              } catch (err: any) {
                const msg = err?.response?.data?.message || err?.message || 'Không thể tạo dịch vụ'
                toast.error(msg)
                if (msg.toLowerCase().includes('giá') || msg.toLowerCase().includes('price')) setErrors({ price: msg })
                else setErrors({ name: msg })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {submitting ? (initial?.id ? 'Đang lưu...' : 'Đang tạo...') : (initial?.id ? 'Lưu thay đổi' : 'Tạo Dịch vụ')}
          </button>
        </div>
      </div>
    </div>
  )
}



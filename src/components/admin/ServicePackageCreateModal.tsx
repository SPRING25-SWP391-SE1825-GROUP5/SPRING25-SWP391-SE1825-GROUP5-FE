import React, { useEffect, useState } from 'react'
import { X, MoreHorizontal, Minus, Maximize2 } from 'lucide-react'
import { ServiceManagementService, type Service } from '../../services/serviceManagementService'
import './ServicePackageCreateModal.scss'

export type ServicePackageCreateModalProps = {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  mode?: 'create' | 'update' | 'view'
  initialData?: {
    id?: number
    packageName?: string
    packageCode?: string
    description?: string
    serviceId?: number
    totalCredits?: number
    price?: number
    discountPercent?: number
    isActive?: boolean
    validFrom?: string
    validTo?: string
  } | null
}

export default function ServicePackageCreateModal({ open, onClose, onSaved, mode = 'create', initialData }: ServicePackageCreateModalProps) {
  const [minimized, setMinimized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({
    packageName: '',
    packageCode: '',
    description: '',
    serviceId: 0,
    totalCredits: 1,
    price: 0,
    discountPercent: 0,
    isActive: true,
    validFrom: '',
    validTo: ''
  })

  const markTouched = (key: string) => setTouched(t => ({ ...t, [key]: true }))

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const res = await ServiceManagementService.getServices({ pageSize: 1000 })
        setServices(res.services.filter(s=> s.isActive !== false))
      } catch {}
    })()
  }, [open])

  // Prefill when editing or viewing
  useEffect(() => {
    if (open && initialData && (mode === 'update' || mode === 'view')) {
      setForm({
        packageName: initialData.packageName || '',
        packageCode: initialData.packageCode || '',
        description: initialData.description || '',
        serviceId: initialData.serviceId || 0,
        totalCredits: initialData.totalCredits ?? 1,
        price: initialData.price ?? 0,
        discountPercent: initialData.discountPercent ?? 0,
        isActive: initialData.isActive ?? true,
        validFrom: initialData.validFrom || '',
        validTo: initialData.validTo || ''
      })
      setErrors({})
      setTouched({})
    }
  }, [open, initialData, mode])

  const discountedPrice = Math.max(0, Math.round(form.price * (1 - (form.discountPercent || 0) / 100)))
  const hasError = (key: string) => Boolean(errors[key] && touched[key])
  const isReadOnly = mode === 'view'

  if (!open) return null
  return (
    <div className={`spc-overlay${minimized ? ' is-minimized' : ''}`}>
      <div className={`spc-modal${minimized ? ' is-minimized' : ''}`}>
        <div className="spc-header">
          <h3 className="spc-title">{mode === 'update' ? 'Cập nhật Gói Dịch vụ' : mode === 'view' ? 'Chi tiết Gói Dịch vụ' : 'Tạo Gói Dịch vụ'}</h3>
          <div className="spc-head-actions">
            {!minimized && (
              <button type="button" title="Thu nhỏ" onClick={()=>setMinimized(true)} className="icon-btn">
                <Minus size={18} />
              </button>
            )}
            {minimized && (
              <button type="button" title="Phóng to" onClick={()=>setMinimized(false)} className="icon-btn">
                <Maximize2 size={18} />
              </button>
            )}
            <button type="button" title="Tùy chọn" className="icon-btn">
              <MoreHorizontal size={18} />
            </button>
            <button type="button" title="Đóng" onClick={onClose} className="icon-btn danger">
              <X size={18} />
            </button>
          </div>
        </div>

        {!minimized && (
          <div className="spc-body">
            <div className="spc-form">
              {/* Row 1: Tên gói | Dịch vụ */}
              <div className="spc-row">
                <div className="spc-field">
                  <label className="spc-label">Tên gói dịch vụ <span style={{ color:'#e11d48' }}>*</span></label>
                  <input
                    className={`spc-input${hasError('packageName') ? ' is-invalid' : ''}`}
                    value={form.packageName}
                    onChange={(e)=> setForm(v=>({ ...v, packageName: e.target.value }))}
                    onBlur={()=> markTouched('packageName')}
                    placeholder="Nhập tên gói"
                    disabled={isReadOnly}
                  />
                  <span className={`spc-help${hasError('packageName') ? ' spc-error' : ''}`}>{hasError('packageName') ? errors.packageName : ''}</span>
                </div>
                <div className="spc-field">
                  <label className="spc-label">Dịch vụ <span style={{ color:'#e11d48' }}>*</span></label>
                  <select
                    className={`spc-select${hasError('serviceId') ? ' is-invalid' : ''}`}
                    value={form.serviceId}
                    onChange={(e)=> setForm(v=>({ ...v, serviceId: Number(e.target.value) }))}
                    onBlur={()=> markTouched('serviceId')}
                    disabled={isReadOnly}
                  >
                    <option value={0}>Chọn dịch vụ</option>
                    {services.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                  <span className={`spc-help${hasError('serviceId') ? ' spc-error' : ''}`}>{hasError('serviceId') ? errors.serviceId : ''}</span>
                </div>
              </div>

              {/* Row 2: Mã gói | Tổng credit */}
              <div className="spc-row">
                <div className="spc-field">
                  <label className="spc-label">Mã gói dịch vụ <span style={{ color:'#e11d48' }}>*</span></label>
                  <input
                    className={`spc-input${hasError('packageCode') ? ' is-invalid' : ''}`}
                    value={form.packageCode}
                    onChange={(e)=> setForm(v=>({ ...v, packageCode: e.target.value }))}
                    onBlur={()=> markTouched('packageCode')}
                    placeholder="Nhập mã gói"
                    disabled={isReadOnly}
                  />
                  <span className={`spc-help${hasError('packageCode') ? ' spc-error' : ''}`}>{hasError('packageCode') ? errors.packageCode : ''}</span>
                </div>
                <div className="spc-field">
                  <label className="spc-label">Tổng số credit <span style={{ color:'#e11d48' }}>*</span></label>
                  <input
                    className={`spc-input${hasError('totalCredits') ? ' is-invalid' : ''}`}
                    type="number" min={1} step={1}
                    value={form.totalCredits}
                    onChange={(e)=> setForm(v=>({ ...v, totalCredits: Number(e.target.value) }))}
                    onBlur={()=> markTouched('totalCredits')}
                    disabled={isReadOnly}
                  />
                  <span className={`spc-help${hasError('totalCredits') ? ' spc-error' : ''}`}>{hasError('totalCredits') ? errors.totalCredits : ''}</span>
                </div>
              </div>

              {/* Row 3: Giá | Giảm giá */}
              <div className="spc-row">
                <div className="spc-field">
                  <label className="spc-label">Giá (VNĐ) <span style={{ color:'#e11d48' }}>*</span></label>
                  <input
                    className={`spc-input${hasError('price') ? ' is-invalid' : ''}`}
                    type="number" min={0} step={1000}
                    value={form.price}
                    onChange={(e)=> setForm(v=>({ ...v, price: Number(e.target.value) }))}
                    onBlur={()=> markTouched('price')}
                    disabled={isReadOnly}
                  />
                  <span className={`spc-help${hasError('price') ? ' spc-error' : ''}`}>{hasError('price') ? errors.price : ''}</span>
                </div>
                <div className="spc-field">
                  <label className="spc-label">Giảm giá (%)</label>
                  <input
                    className={`spc-input${hasError('discountPercent') ? ' is-invalid' : ''}`}
                    type="number" min={0} max={100} step={0.1}
                    value={form.discountPercent}
                    onChange={(e)=> setForm(v=>({ ...v, discountPercent: Number(e.target.value) }))}
                    onBlur={()=> markTouched('discountPercent')}
                    disabled={isReadOnly}
                  />
                  <span className={`spc-help${hasError('discountPercent') ? ' spc-error' : ''}`}>{hasError('discountPercent') ? errors.discountPercent : ''}</span>
                </div>
              </div>

              {/* Row 4: Giá sau giảm | Trạng thái */}
              <div className="spc-row">
                <div className="spc-field">
                  <label className="spc-label">Giá sau giảm</label>
                  <div className="spc-input" style={{ display:'flex', alignItems:'center' }}>{discountedPrice.toLocaleString()} VNĐ</div>
                  <span className="spc-help">&nbsp;</span>
                </div>
                <div className="spc-field">
                  <label className="spc-label">Trạng thái</label>
                  <div className="spc-switch">
                    <label className="spc-toggle">
                      <input type="checkbox" checked={form.isActive} onChange={(e)=> setForm(v=>({ ...v, isActive: e.target.checked }))} disabled={isReadOnly} />
                      <span className="track" />
                      <span className="thumb" />
                    </label>
                  </div>
                  <span className="spc-help">&nbsp;</span>
                </div>
              </div>

              {/* Row 5: Mô tả (span 2 cols) */}
              <div className="spc-row" style={{ gridColumn: '1 / -1' }}>
                <div className="spc-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="spc-label">Mô tả</label>
                  <textarea className="spc-textarea" rows={3} value={form.description} onChange={(e)=> setForm(v=>({ ...v, description: e.target.value }))} placeholder="Nhập mô tả" disabled={isReadOnly} />
                  <span className="spc-help">&nbsp;</span>
                </div>
              </div>

              {/* Row 6: Ngày hiệu lực */}
              <div className="spc-row">
                <div className="spc-field">
                  <label className="spc-label">Có hiệu lực từ</label>
                  <input className="spc-input" type="date" value={form.validFrom} onChange={(e)=> setForm(v=>({ ...v, validFrom: e.target.value }))} onBlur={()=> markTouched('validFrom')} disabled={isReadOnly} />
                  <span className="spc-help">&nbsp;</span>
                </div>
                <div className="spc-field">
                  <label className="spc-label">Có hiệu lực đến</label>
                  <input className={`spc-input${hasError('validTo') ? ' is-invalid' : ''}`} type="date" value={form.validTo} onChange={(e)=> setForm(v=>({ ...v, validTo: e.target.value }))} onBlur={()=> markTouched('validTo')} disabled={isReadOnly} />
                  <span className={`spc-help${hasError('validTo') ? ' spc-error' : ''}`}>{hasError('validTo') ? errors.validTo : ''}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!minimized && (
          <div className="spc-footer">
            <button type="button" onClick={onClose} className="spc-btn cancel">Đóng</button>
            {mode !== 'view' && (
              <button
                type="button"
                disabled={submitting}
                onClick={async ()=>{
                  const next: Record<string,string> = {}
                  if (!form.packageName.trim()) next.packageName = 'Tên gói là bắt buộc'
                  if (!form.packageCode.trim()) next.packageCode = 'Mã gói là bắt buộc'
                  if (!form.serviceId || form.serviceId <= 0) next.serviceId = 'Chọn dịch vụ'
                  if (!Number.isInteger(form.totalCredits) || form.totalCredits <= 0) next.totalCredits = 'Credits phải là số nguyên > 0'
                  if (form.price < 0) next.price = 'Giá phải >= 0'
                  if (form.discountPercent < 0 || form.discountPercent > 100) next.discountPercent = 'Giảm giá 0–100%'
                  if (form.validFrom && form.validTo && new Date(form.validTo) < new Date(form.validFrom)) next.validTo = 'Ngày kết thúc phải ≥ ngày bắt đầu'
                  setErrors(next)
                  if (Object.keys(next).length) {
                    setTouched(t => ({ ...t, ...Object.fromEntries(Object.keys(next).map(k => [k, true])) }))
                    return
                  }
                  try {
                    setSubmitting(true)
                    if (mode === 'update' && initialData?.id) {
                      const updateBody = {
                        packageId: initialData.id,
                        packageName: form.packageName.trim(),
                        packageCode: form.packageCode.trim(),
                        description: form.description || undefined,
                        serviceId: form.serviceId,
                        totalCredits: form.totalCredits,
                        price: form.price,
                        discountPercent: form.discountPercent || undefined,
                        isActive: form.isActive,
                        validFrom: form.validFrom || undefined,
                        validTo: form.validTo || undefined
                      }
                      const updater: any = (ServiceManagementService as any).updateServicePackage
                      if (typeof updater === 'function') {
                        await updater(updateBody)
                      } else {
                        await ServiceManagementService.createServicePackage(updateBody as any)
                      }
                    } else {
                      await ServiceManagementService.createServicePackage({
                        packageName: form.packageName.trim(),
                        packageCode: form.packageCode.trim(),
                        description: form.description || undefined,
                        serviceId: form.serviceId,
                        totalCredits: form.totalCredits,
                        price: form.price,
                        discountPercent: form.discountPercent || undefined,
                        isActive: form.isActive,
                        validFrom: form.validFrom || undefined,
                        validTo: form.validTo || undefined
                      })
                    }
                    onClose()
                    onSaved && onSaved()
                  } finally {
                    setSubmitting(false)
                  }
                }}
                className="spc-btn primary"
              >
                {mode === 'update' ? 'Cập nhật gói dịch vụ' : 'Tạo gói dịch vụ'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}



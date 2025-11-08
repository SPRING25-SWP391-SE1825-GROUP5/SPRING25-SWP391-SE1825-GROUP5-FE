import React, { useState, useEffect } from 'react'
import {
  XMarkIcon,
  ArrowsPointingOutIcon,
  EllipsisHorizontalIcon,
  MinusSmallIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { ServiceChecklistTemplateService, ServiceChecklistTemplate, TemplateCreateRequest } from '@/services/serviceChecklistTemplateService'
import { ServiceManagementService } from '@/services/serviceManagementService'
import toast from 'react-hot-toast'
import './TemplateFormModal.scss'

interface TemplateFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  mode: 'create' | 'edit'
  template: ServiceChecklistTemplate | null
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  mode,
  template
}) => {
  const [minimized, setMinimized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    templateName: '',
    description: '',
    serviceId: 0,
    isActive: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [services, setServices] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    if (open) {
      loadServices()
      if (mode === 'edit' && template) {
        setForm({
          templateName: template.templateName || '',
          description: template.description || '',
          serviceId: template.serviceID || template.serviceId || 0,
          isActive: template.isActive ?? true
        })
      } else {
        setForm({
          templateName: '',
          description: '',
          serviceId: 0,
          isActive: true
        })
      }
      setErrors({})
    }
  }, [open, mode, template])

  const loadServices = async () => {
    try {
      const response = await ServiceManagementService.getServices({ pageSize: 1000, status: 'active' })
      setServices(response.services.map(s => ({ id: s.id, name: s.name })))
      if (mode === 'create' && response.services.length > 0) {
        setForm(prev => ({ ...prev, serviceId: response.services[0].id }))
      }
    } catch (err) {

    }
  }

  const setField = (k: keyof typeof form, v: string | number | boolean) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => ({ ...prev, [k]: '' }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.templateName.trim()) {
      e.templateName = 'Vui lòng nhập tên mẫu'
    }
    if (!form.serviceId || form.serviceId <= 0) {
      e.serviceId = 'Vui lòng chọn dịch vụ'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      setSubmitting(true)

      if (mode === 'create') {
        const request: TemplateCreateRequest = {
          serviceId: form.serviceId,
          templateName: form.templateName.trim(),
          description: form.description.trim() || undefined,
          isActive: form.isActive
        }
        await ServiceChecklistTemplateService.createTemplate(request)
        toast.success('Đã tạo template thành công')
      } else {
        const templateId = template?.templateID || template?.templateId
        if (!templateId) {
          toast.error('Không tìm thấy ID template')
          return
        }

        await ServiceChecklistTemplateService.updateTemplate(templateId, {
          templateName: form.templateName.trim(),
          description: form.description.trim() || undefined
        })
        toast.success('Đã cập nhật template thành công')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors as Record<string, string[]>
      const message = err?.response?.data?.message as string | undefined
      
      if (apiErrors) {
        const mapped: Record<string, string> = {}
        Object.entries(apiErrors).forEach(([k, v]) => {
          mapped[k] = (v?.[0] as string) || ''
        })
        setErrors(prev => ({ ...prev, ...mapped }))
      }
      
      if (message) {
        if (message.toLowerCase().includes('template') || message.toLowerCase().includes('mẫu')) {
          setErrors(prev => ({ ...prev, templateName: message }))
        } else if (message.toLowerCase().includes('service') || message.toLowerCase().includes('dịch vụ')) {
          setErrors(prev => ({ ...prev, serviceId: message }))
        } else {
          toast.error(message)
        }
      } else {
        toast.error(mode === 'create' ? 'Không thể tạo template' : 'Không thể cập nhật template')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className={`tfm-overlay ${minimized ? 'tfm-overlay--min' : ''}`} role="dialog" aria-modal="true">
      <div className={`tfm-container ${minimized ? 'tfm-container--min' : ''}`}>
        {/* Header */}
        <div className="tfm-header">
          <h3 className="tfm-title">{mode === 'create' ? 'Tạo mẫu checklist mới' : 'Chỉnh sửa mẫu checklist'}</h3>
          <div className="tfm-actions">
            {!minimized && (
              <button type="button" className="tfm-icon" aria-label="Thu nhỏ" onClick={() => setMinimized(true)}>
                <MinusSmallIcon width={18} height={18} />
              </button>
            )}
            {minimized && (
              <button type="button" className="tfm-icon" aria-label="Phóng to" onClick={() => setMinimized(false)}>
                <ArrowsPointingOutIcon width={18} height={18} />
              </button>
            )}
            <button type="button" className="tfm-icon" aria-label="Tùy chọn">
              <EllipsisHorizontalIcon width={18} height={18} />
            </button>
            <button type="button" className="tfm-icon tfm-close" aria-label="Đóng" onClick={onClose}>
              <XMarkIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="tfm-body">
          <form className="tfm-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="tfm-grid">
              {/* Left column */}
              <div className="tfm-col">
                <div className={`tfm-field ${errors.templateName ? 'is-error' : ''}`}>
                  <label className="tfm-label">Tên mẫu <span className="req">*</span></label>
                  <div className="tfm-inputwrap">
                    <DocumentTextIcon className="tfm-ico" width={16} height={16} />
                    <input
                      value={form.templateName}
                      onChange={(e) => setField('templateName', e.target.value)}
                      placeholder="Nhập tên mẫu checklist"
                      style={{ maxWidth: '420px' }}
                    />
                  </div>
                  {errors.templateName && <div className="tfm-error">{errors.templateName}</div>}
                </div>

                <div className={`tfm-field ${errors.serviceId ? 'is-error' : ''}`}>
                  <label className="tfm-label">Dịch vụ <span className="req">*</span></label>
                  <div className="tfm-inputwrap select" style={{ maxWidth: '420px' }}>
                    <WrenchScrewdriverIcon className="tfm-ico" width={16} height={16} />
                    <select
                      value={form.serviceId}
                      onChange={(e) => setField('serviceId', parseInt(e.target.value))}
                    >
                      <option value={0}>Chọn dịch vụ</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="tfm-caret" width={16} height={16} />
                  </div>
                  {errors.serviceId && <div className="tfm-error">{errors.serviceId}</div>}
                </div>
              </div>

              {/* Right column */}
              <div className="tfm-col">
                <div className="tfm-field">
                  <label className="tfm-label">Mô tả</label>
                  <div className="tfm-inputwrap" style={{ maxWidth: '420px' }}>
                    <DocumentTextIcon className="tfm-ico" width={16} height={16} />
                    <textarea
                      value={form.description}
                      onChange={(e) => setField('description', e.target.value)}
                      placeholder="Nhập mô tả (tùy chọn)"
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        resize: 'vertical',
                        paddingTop: '10px',
                        paddingBottom: '10px'
                      }}
                    />
                  </div>
                </div>

                <div className="tfm-field-inline">
                  <label className="tfm-switch">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setField('isActive', e.target.checked)}
                    />
                    <span /> Kích hoạt ngay
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="tfm-footer">
          <button type="button" className="tfm-btn tfm-btn--ghost" onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="tfm-btn tfm-btn--primary"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Đang xử lý...' : mode === 'create' ? 'Tạo mẫu' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplateFormModal


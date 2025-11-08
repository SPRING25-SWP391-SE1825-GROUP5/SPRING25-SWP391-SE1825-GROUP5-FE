import React, { useEffect, useState } from 'react'
import { CustomerService } from '@/services/customerService'
import { VehicleService, type Vehicle } from '@/services/vehicleService'
import api from '@/services/api'

interface VehicleModel {
  id?: number
  modelId?: number
  modelName: string
  brand?: string
}

interface CreateVehicleModalProps {
  open: boolean
  onClose: () => void
  onCreated: (vehicle: Vehicle, customerId?: number) => void
  guestCustomerInfo?: {
    fullName: string
    phone: string
    email: string
  }
}

const CreateVehicleModal: React.FC<CreateVehicleModalProps> = ({ open, onClose, onCreated, guestCustomerInfo }) => {
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    licensePlate: '',
    vin: '',
    color: '',
    currentMileage: '',
    modelId: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string>('')
  const [customerCreated, setCustomerCreated] = useState<boolean>(false)
  
  // Vehicle models state
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)

  // Danh sách màu sắc phổ biến cho xe
  const colorOptions = [
    { value: '', label: 'Chọn màu' },
    { value: 'Đen', label: 'Đen' },
    { value: 'Trắng', label: 'Trắng' },
    { value: 'Bạc', label: 'Bạc' },
    { value: 'Xám', label: 'Xám' },
    { value: 'Đỏ', label: 'Đỏ' },
    { value: 'Xanh dương', label: 'Xanh dương' },
    { value: 'Xanh lá', label: 'Xanh lá' },
    { value: 'Vàng', label: 'Vàng' },
    { value: 'Cam', label: 'Cam' },
    { value: 'Nâu', label: 'Nâu' },
    { value: 'Tím', label: 'Tím' },
    { value: 'Hồng', label: 'Hồng' },
    { value: 'Khác', label: 'Khác' }
  ]

  // Load vehicle models when modal opens
  useEffect(() => {
    if (!open) return
    
    const loadVehicleModels = async () => {
      setModelsLoading(true)
      try {
        const response = await api.get('/VehicleModel/active')
        
        // API trả về trực tiếp array của VehicleModelResponse
        let models = response.data
        
        // Nếu response.data không phải array, có thể bị wrap trong object
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          models = response.data.data || response.data.models || response.data.items || response.data
        }
        
        setVehicleModels(models || [])
      } catch (error: unknown) {
        // Fallback: không cần gọi lại cùng endpoint; giữ rỗng nếu lỗi
        setVehicleModels([])
      } finally {
        setModelsLoading(false)
      }
    }

    const load = async () => {
      // Load vehicle models first
      await loadVehicleModels()
      
      try {
        // Nếu có thông tin khách vãng lai, tạo customer mới cho họ
        if (guestCustomerInfo) {
          try {
            const createCustomerResp = await CustomerService.quickCreateCustomer({
              fullName: guestCustomerInfo.fullName,
              phoneNumber: guestCustomerInfo.phone,
              email: guestCustomerInfo.email
            })
            
            if (createCustomerResp?.data?.customerId) {
              setCustomerId(createCustomerResp.data.customerId)
              setCustomerCreated(true)
            } else {
              setCustomerId(null)
            }
          } catch (error) {
            // Fallback: thử tạo customer đơn giản hơn
            try {
              const simpleCustomerResp = await CustomerService.createCustomer({
                phoneNumber: guestCustomerInfo.phone,
                isGuest: true
              })
              if (simpleCustomerResp?.data?.customerId) {
                setCustomerId(simpleCustomerResp.data.customerId)
                setCustomerCreated(true)
              } else {
                setCustomerId(null)
              }
            } catch (fallbackError) {
              setCustomerId(null)
            }
          }
        } else {
          // Nếu không có thông tin guest, lấy customer hiện tại (cho trường hợp customer đã đăng nhập)
          try {
            const me = await CustomerService.getCurrentCustomer()
            
            if (me?.data?.customerId) {
              setCustomerId(me.data.customerId)
            } else {
              setCustomerId(null)
            }
          } catch (error) {
            
            // Fallback: Tạo customer record cho user đã đăng nhập
            try {
              // Lấy thông tin user từ auth store hoặc API
              const createCustomerResp = await CustomerService.createCustomer({
                phoneNumber: '0000000000', // Placeholder phone
                isGuest: false
              })
              
              if (createCustomerResp?.data?.customerId) {
                setCustomerId(createCustomerResp.data.customerId)
                setCustomerCreated(true)
              } else {
                setCustomerId(null)
              }
            } catch (createError) {
              setCustomerId(null)
            }
          }
        }
      } catch (error) {
        setCustomerId(null)
      }
    }
    load()
  }, [open, guestCustomerInfo])

  const setField = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }))

  const validate = () => {
    const e: Record<string, string> = {}
    const license = form.licensePlate.trim()
    if (!license) e.licensePlate = 'Biển số bắt buộc'
    else if (!/^[A-Z0-9\-\s]{5,20}$/i.test(license)) e.licensePlate = 'Biển số không hợp lệ'
    if (!form.vin.trim()) e.vin = 'VIN bắt buộc'
    if (!form.color.trim()) e.color = 'Màu bắt buộc'
    if (!form.modelId.trim()) e.modelId = 'Model xe bắt buộc'
    if (!form.currentMileage.trim() || isNaN(Number(form.currentMileage)) || Number(form.currentMileage) < 0) {
      e.currentMileage = 'Số km không hợp lệ'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = async () => {
    if (!validate()) return
    if (!customerId) {
      alert('Không xác định được khách hàng')
      return
    }
    setSaving(true)
    setGeneralError('')
    try {
      const resp = await VehicleService.createVehicle({
        customerId,
        vin: form.vin.trim(),
        licensePlate: form.licensePlate.trim(),
        color: form.color.trim(),
        currentMileage: Number(form.currentMileage),
        modelId: Number(form.modelId)
      })
      if (resp?.data) {
        onCreated(resp.data as Vehicle, customerId ?? undefined)
        onClose()
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: any } }
      let message = 'Tạo xe thất bại, vui lòng kiểm tra lại thông tin.'
      const resp = error?.response?.data

      // Map server-side field errors to UI fields
      const fieldErrs: Record<string, string> = {}
      const pushFieldError = (key: string, val: any) => {
        if (!val) return
        const text = Array.isArray(val) ? val.join(', ') : String(val)
        fieldErrs[key] = text
      }

      const mapKey = (k: string) => {
        const lower = k.toLowerCase()
        if (lower.includes('license') || lower.includes('plate')) return 'licensePlate'
        if (lower.includes('vin')) return 'vin'
        if (lower.includes('color')) return 'color'
        if (lower.includes('mileage')) return 'currentMileage'
        if (lower.includes('lastserv') || lower.includes('last_service')) return 'lastServiceDate'
        return ''
      }

      if (resp?.errors && typeof resp.errors === 'object') {
        for (const [k, v] of Object.entries(resp.errors)) {
          const uiKey = mapKey(k)
          if (uiKey) pushFieldError(uiKey, v)
        }
      }

      // Some .NET APIs may return { message, details } or flat problem+title
      if (Object.keys(fieldErrs).length === 0) {
        if (resp?.message) message = resp.message
        else if (resp?.error) message = resp.error
        else if (resp?.title) message = resp.title
        else if (err && typeof err === 'object' && 'userMessage' in err && typeof err.userMessage === 'string') {
          message = err.userMessage
        }
      }

      // Apply field errors if any; otherwise show general
      if (Object.keys(fieldErrs).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrs }))
      } else {
        setGeneralError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Tạo xe mới</h3>
        </div>
        
        <div className="modal-body">
          {customerCreated && (
            <div className="alert-success">
              {guestCustomerInfo ? (
                <>✅ Đã tạo hồ sơ khách hàng cho {guestCustomerInfo.fullName}. 
                Khách hàng có thể đăng ký tài khoản sau này để quản lý xe.</>
              ) : (
                <>✅ Đã tạo hồ sơ khách hàng cho tài khoản của bạn. 
                Bạn có thể quản lý xe và đặt lịch dịch vụ.</>
              )}
            </div>
          )}
          {!customerId && !guestCustomerInfo && (
            <div className="alert-error">
              Không thể xác định thông tin khách hàng. Vui lòng đăng nhập lại hoặc liên hệ hỗ trợ.
            </div>
          )}
          {generalError && <div className="alert-error">{generalError}</div>}
          
          <div className="form-grid">
            <div className="form-group">
              <label>
                Model xe <span className="required-star">*</span>
              </label>
              <select 
                value={form.modelId} 
                onChange={(e) => setField('modelId', e.target.value)}
                disabled={modelsLoading}
                className={errors.modelId ? 'error-input' : ''}
              >
                <option value="">{modelsLoading ? 'Đang tải...' : 'Chọn model xe'}</option>
                {vehicleModels.map((model) => {
                  const optionId = (model as any).modelId ?? model.id
                  return (
                    <option key={optionId} value={optionId}>
                      {model.modelName}
                    </option>
                  )
                })}
              </select>
              {errors.modelId && <span className="error-message">{errors.modelId}</span>}
            </div>
            
            <div className="form-group">
              <label>
                Biển số <span className="required-star">*</span>
              </label>
              <input 
                value={form.licensePlate} 
                onChange={(e) => setField('licensePlate', e.target.value)}
                placeholder="Nhập biển số xe"
                className={errors.licensePlate ? 'error-input' : ''}
              />
              <span className="helper-text">Biển số xe máy phải theo định dạng 29-T8 2843, 30-A1 1234</span>
              {errors.licensePlate && <span className="error-message">{errors.licensePlate}</span>}
            </div>
            
            <div className="form-group">
              <label>
                VIN <span className="required-star">*</span>
              </label>
              <input 
                value={form.vin} 
                onChange={(e) => setField('vin', e.target.value)}
                placeholder="Nhập số VIN"
                className={errors.vin ? 'error-input' : ''}
              />
              <span className="helper-text">Mã số khung xe (17 ký tự)</span>
              {errors.vin && <span className="error-message">{errors.vin}</span>}
            </div>
            
            <div className="form-group">
              <label>
                Màu <span className="required-star">*</span>
              </label>
              <select 
                value={form.color} 
                onChange={(e) => setField('color', e.target.value)}
                className={errors.color ? 'error-input' : ''}
              >
                {colorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.color && <span className="error-message">{errors.color}</span>}
            </div>
            
            <div className="form-group">
              <label>
                Số km <span className="required-star">*</span>
              </label>
              <input 
                type="number" 
                value={form.currentMileage} 
                onChange={(e) => setField('currentMileage', e.target.value)}
                placeholder="Nhập số km hiện tại"
                min="0"
                className={errors.currentMileage ? 'error-input' : ''}
              />
              <span className="helper-text">Số km đã đi hiện tại của xe (ví dụ: 15000)</span>
              {errors.currentMileage && <span className="error-message">{errors.currentMileage}</span>}
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </button>
          <button 
            className="btn-primary" 
            onClick={handleCreate} 
            disabled={saving || !customerId}
          >
            {saving ? 'Đang tạo...' : 'Tạo xe'}
          </button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { 
          position: fixed; 
          inset: 0; 
          background: rgba(0, 0, 0, 0.5); 
          backdrop-filter: blur(4px);
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 50; 
          padding: 1rem;
        }
        .modal { 
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px) saturate(180%);
          border-radius: 20px; 
          padding: 0; 
          width: 100%;
          max-width: 600px; 
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 
                      0 0 0 1px rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.5);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }
        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(229, 231, 235, 0.5);
          background: rgba(255, 255, 255, 0.6);
        }
        .modal-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .modal-body {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }
        .form-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 1.25rem; 
          margin-top: 1rem;
        }
        .form-group { 
          display: flex; 
          flex-direction: column; 
          gap: 0.5rem; 
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 0.9375rem;
          background: #ffffff;
          color: #111827;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .form-group input::placeholder {
          color: #9ca3af;
          opacity: 0.7;
        }
        .helper-text {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
          line-height: 1.4;
        }
        .form-group select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--progress-current, #1ec774);
          box-shadow: 0 0 0 4px rgba(30, 199, 116, 0.12);
        }
        .form-group input.error-input,
        .form-group select.error-input {
          border-color: #ef4444;
        }
        .form-group input.error-input:focus,
        .form-group select.error-input:focus {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
        }
        .error-message { 
          color: #ef4444; 
          font-size: 0.75rem; 
          margin-top: -0.25rem;
          font-weight: 500;
        }
        .required-star { 
          color: #ef4444; 
          margin-left: 4px; 
        }
        .alert-error { 
          background: #fef2f2; 
          color: #991b1b; 
          border: 1px solid #fecaca; 
          border-radius: 12px; 
          padding: 0.875rem 1rem; 
          margin-bottom: 1rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .alert-success { 
          background: #f0fdf4; 
          color: #166534; 
          border: 1px solid #bbf7d0; 
          border-radius: 12px; 
          padding: 0.875rem 1rem; 
          margin-bottom: 1rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .modal-actions { 
          display: flex; 
          justify-content: flex-end; 
          gap: 0.75rem;
          padding: 1.5rem 2rem;
          border-top: 1px solid rgba(229, 231, 235, 0.5);
          background: rgba(255, 255, 255, 0.4);
        }
        .btn-secondary {
          background: #ffffff;
          color: #0f172a;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-1px);
        }
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-primary {
          background: var(--progress-current, #1ec774);
          color: #ffffff;
          border: 2px solid var(--progress-current, #1ec774);
          border-radius: 10px;
          padding: 0.75rem 1.5rem;
          font-weight: 700;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(30, 199, 116, 0.25);
        }
        .btn-primary:hover:not(:disabled) {
          background: #16a34a;
          border-color: #16a34a;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(30, 199, 116, 0.35);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        @media (max-width: 640px) {
          .modal {
            max-width: 100%;
            border-radius: 16px;
          }
          .modal-header,
          .modal-body,
          .modal-actions {
            padding: 1.25rem;
          }
          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .modal-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  )
}

export default CreateVehicleModal



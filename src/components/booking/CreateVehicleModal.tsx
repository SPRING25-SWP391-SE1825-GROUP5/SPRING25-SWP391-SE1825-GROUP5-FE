import React, { useEffect, useState } from 'react'
import { CustomerService } from '@/services/customerService'
import { VehicleService, type Vehicle } from '@/services/vehicleService'
import api from '@/services/api'

interface VehicleModel {
  id: number
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
        console.log('Fetching vehicle models from /api/VehicleModel/active...')
        const response = await api.get('/api/VehicleModel/active')
        console.log('Vehicle models response:', response)

        console.log('Response type:', typeof response.data)
        console.log('Is array:', Array.isArray(response.data))
        
        // API trả về trực tiếp array của VehicleModelResponse
        let models = response.data
        
        // Nếu response.data không phải array, có thể bị wrap trong object
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          models = response.data.data || response.data.models || response.data.items || response.data
          console.log('Extracted models from nested structure:', models)
        }
        
        console.log('Final models array:', models)
        console.log('Models length:', models?.length)
        
        // Kiểm tra format của từng model
        if (models && models.length > 0) {
          console.log('First model structure:', models[0])
          console.log('Model keys:', Object.keys(models[0] || {}))
        }
        
        setVehicleModels(models || [])
      } catch (error: any) {
        console.error('Error fetching vehicle models:', error)
        console.error('Error details:', {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          message: error?.message,
          url: error?.config?.url
        })
        
        // Fallback: thử endpoint khác nếu /api/VehicleModel/active fail
        try {
          console.log('Trying fallback endpoint /VehicleModel/active...')
          const fallbackResponse = await api.get('/VehicleModel/active')
          console.log('Fallback response:', fallbackResponse.data)
          setVehicleModels(fallbackResponse.data || [])
        } catch (fallbackError: any) {
          console.error('Fallback also failed:', fallbackError)
          setVehicleModels([])
        }
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
          console.log('Creating customer for guest:', guestCustomerInfo)
          try {
            const createCustomerResp = await CustomerService.quickCreateCustomer({
              fullName: guestCustomerInfo.fullName,
              phoneNumber: guestCustomerInfo.phone,
              email: guestCustomerInfo.email
            })
            
            if (createCustomerResp?.data?.customerId) {
              setCustomerId(createCustomerResp.data.customerId)
              setCustomerCreated(true)
              console.log('Created guest customer ID:', createCustomerResp.data.customerId)
              console.log('Customer data:', createCustomerResp.data)
            } else {
              console.error('Failed to create guest customer:', createCustomerResp)
              setCustomerId(null)
            }
          } catch (error) {
            console.error('Error creating guest customer:', error)
            // Fallback: thử tạo customer đơn giản hơn
            try {
              const simpleCustomerResp = await CustomerService.createCustomer({
                phoneNumber: guestCustomerInfo.phone,
                isGuest: true
              })
              if (simpleCustomerResp?.data?.customerId) {
                setCustomerId(simpleCustomerResp.data.customerId)
                setCustomerCreated(true)
                console.log('Created simple guest customer ID:', simpleCustomerResp.data.customerId)
              } else {
                setCustomerId(null)
              }
            } catch (fallbackError) {
              console.error('Fallback customer creation also failed:', fallbackError)
              setCustomerId(null)
            }
          }
        } else {
          // Nếu không có thông tin guest, lấy customer hiện tại (cho trường hợp customer đã đăng nhập)
          console.log('Getting current customer for logged-in user...')
          try {
            const me = await CustomerService.getCurrentCustomer()
            console.log('Current customer response:', me)
            console.log('Current customer ID:', me?.data?.customerId)
            
            if (me?.data?.customerId) {
              setCustomerId(me.data.customerId)
              console.log('✅ Set customer ID for logged-in user:', me.data.customerId)
            } else {
              console.error('No customer ID found for logged-in user')
              setCustomerId(null)
            }
          } catch (error) {
            console.error('Error getting current customer for logged-in user:', error)
            console.log('Customer not found, trying to create customer for logged-in user...')
            
            // Fallback: Tạo customer record cho user đã đăng nhập
            try {
              // Lấy thông tin user từ auth store hoặc API
              const createCustomerResp = await CustomerService.createCustomer({
                phoneNumber: '0000000000', // Placeholder phone
                isGuest: false
              })
              
              console.log('Created customer for logged-in user:', createCustomerResp)
              if (createCustomerResp?.data?.customerId) {
                setCustomerId(createCustomerResp.data.customerId)
                setCustomerCreated(true)
                console.log('✅ Created customer ID for logged-in user:', createCustomerResp.data.customerId)
              } else {
                console.error('Failed to create customer for logged-in user')
                setCustomerId(null)
              }
            } catch (createError) {
              console.error('Error creating customer for logged-in user:', createError)
              setCustomerId(null)
            }
          }
        }
      } catch (error) {
        console.error('Error getting customer ID:', error)
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
        console.log('Passing customerId to onCreated:', customerId)
        onCreated(resp.data as Vehicle, customerId ?? undefined)
        onClose()
      }
    } catch (err: any) {
      console.error('Create vehicle error', err)
      let message = 'Tạo xe thất bại, vui lòng kiểm tra lại thông tin.'
      const resp = err?.response?.data

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
        else if (err?.userMessage) message = err.userMessage
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
        <h3>Tạo xe mới</h3>
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
        <div className="grid">
          <label>
            Model xe *
            <select 
              value={form.modelId} 
              onChange={(e) => setField('modelId', e.target.value)}
              disabled={modelsLoading}
            >
              <option value="">{modelsLoading ? 'Đang tải...' : 'Chọn model xe'}</option>
              {vehicleModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.brand ? `${model.brand} ${model.modelName}` : model.modelName}
                </option>
              ))}
            </select>
            {errors.modelId && <span className="error">{errors.modelId}</span>}
          </label>
          <label>
            Biển số *
            <input value={form.licensePlate} onChange={(e) => setField('licensePlate', e.target.value)} />
            {errors.licensePlate && <span className="error">{errors.licensePlate}</span>}
          </label>
          <label>
            VIN *
            <input value={form.vin} onChange={(e) => setField('vin', e.target.value)} />
            {errors.vin && <span className="error">{errors.vin}</span>}
          </label>
          <label>
            Màu *
            <select 
              value={form.color} 
              onChange={(e) => setField('color', e.target.value)}
            >
              {colorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.color && <span className="error">{errors.color}</span>}
          </label>
          <label>
            Số km *
            <input type="number" value={form.currentMileage} onChange={(e) => setField('currentMileage', e.target.value)} />
            {errors.currentMileage && <span className="error">{errors.currentMileage}</span>}
          </label>
        </div>
        <div className="actions">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Huỷ</button>
          <button 
            className="btn-primary" 
            onClick={handleCreate} 
            disabled={saving || !customerId}
          >
            Tạo xe
          </button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .modal { background: #fff; border-radius: 12px; padding: 20px; width: 520px; max-width: calc(100% - 24px); box-shadow: 0 10px 30px rgba(0,0,0,.15); border: 1px solid #e5e7eb; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
        label { display: flex; flex-direction: column; gap: 6px; font-size: .9rem; color: #374151; }
        input, select { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; font-size: 14px; }
        select { background-color: #fff; cursor: pointer; }
        select:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1); }
        .error { color: #ef4444; font-size: .75rem; }
        .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 10px; margin-top: 8px; }
        .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 10px; margin-top: 8px; font-size: 0.9rem; }
        .actions { display: flex; justify-content: flex-end; gap: 8px; }
      `}</style>
    </div>
  )
}

export default CreateVehicleModal



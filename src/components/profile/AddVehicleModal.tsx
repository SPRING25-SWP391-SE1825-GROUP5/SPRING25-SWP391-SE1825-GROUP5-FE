import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  XMarkIcon,
  TruckIcon,
  HashtagIcon,
  SwatchIcon,
  ArrowPathIcon,
  CalendarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { VehicleService } from '@/services/vehicleService'
import { vehicleModelService, type VehicleModelResponse } from '@/services/vehicleModelManagement'
import { useAppSelector } from '@/store/hooks'
import toast from 'react-hot-toast'

interface AddVehicleModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface VehicleModel {
  modelId: number
  modelName: string
  brand?: string
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ open, onClose, onSuccess }) => {
  const user = useAppSelector((s) => s.auth.user)
  const [loading, setLoading] = useState(false)
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    customerId: user?.customerId || 0,
    modelId: '',
    vin: '',
    licensePlate: '',
    color: '',
    currentMileage: '',
    lastServiceDate: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load vehicle models
  useEffect(() => {
    if (!open) return

    const loadVehicleModels = async () => {
      setModelsLoading(true)
      try {
        const models = await vehicleModelService.getActive()
        setVehicleModels(models.map(m => ({
          modelId: m.modelId,
          modelName: m.modelName,
          brand: m.brand
        })))
      } catch (error: unknown) {
        toast.error('Không thể tải danh sách mẫu xe')
      } finally {
        setModelsLoading(false)
      }
    }

    loadVehicleModels()
  }, [open])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        customerId: user?.customerId || 0,
        modelId: '',
        vin: '',
        licensePlate: '',
        color: '',
        currentMileage: '',
        lastServiceDate: ''
      })
      setErrors({})
    }
  }, [open, user?.customerId])

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'Vui lòng nhập biển số xe'
    }

    if (!formData.vin.trim()) {
      newErrors.vin = 'Vui lòng nhập số VIN'
    }

    if (!formData.color) {
      newErrors.color = 'Vui lòng chọn màu sắc'
    }

    if (!formData.currentMileage || parseInt(formData.currentMileage) < 0) {
      newErrors.currentMileage = 'Vui lòng nhập số km hợp lệ (≥ 0)'
    }

    if (!formData.modelId) {
      newErrors.modelId = 'Vui lòng chọn mẫu xe'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    if (!user?.customerId) {
      toast.error('Không tìm thấy thông tin khách hàng')
      return
    }

    setLoading(true)
    setErrors({}) // Clear previous errors
    
    try {
      const payload = {
        customerId: user.customerId,
        modelId: parseInt(formData.modelId),
        vin: formData.vin.trim(),
        licensePlate: formData.licensePlate.trim(),
        color: formData.color,
        currentMileage: parseInt(formData.currentMileage),
        lastServiceDate: formData.lastServiceDate || null
      }

      await VehicleService.createVehicle(payload)
      toast.success('Thêm phương tiện thành công!')
      onSuccess()
      onClose()
    } catch (error: any) {

      // Handle validation errors from backend
      if (error?.response?.status === 400 && error?.response?.data?.errors) {
        const validationErrors: Record<string, string> = {}
        const backendErrors = error.response.data.errors
        
        // Map backend field names (PascalCase) to form field names (camelCase)
        const fieldMapping: Record<string, string> = {
          'Vin': 'vin',
          'LicensePlate': 'licensePlate',
          'Color': 'color',
          'CurrentMileage': 'currentMileage',
          'LastServiceDate': 'lastServiceDate',
          'ModelId': 'modelId',
          'CustomerId': 'customerId'
        }
        
        // Extract first error message for each field
        Object.keys(backendErrors).forEach((backendField) => {
          const formField = fieldMapping[backendField] || backendField.toLowerCase()
          const errorMessages = backendErrors[backendField]
          if (Array.isArray(errorMessages) && errorMessages.length > 0) {
            validationErrors[formField] = errorMessages[0]
          }
        })
        
        setErrors(validationErrors)
      } else {
        // Handle other errors (network, server, etc.)
        const errorMessage = error?.response?.data?.message || error?.message || 'Không thể thêm phương tiện'
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!open) return null

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '20px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Thêm phương tiện mới
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <XMarkIcon width={24} height={24} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Mẫu xe - Cột 1 */}
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                <Cog6ToothIcon width={18} height={18} style={{ color: '#6b7280' }} />
                Mẫu xe <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.modelId}
                onChange={(e) => handleChange('modelId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  paddingLeft: '38px',
                  border: `2px solid ${errors.modelId ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
                disabled={modelsLoading}
              >
                <option value="">Chọn mẫu xe</option>
                {vehicleModels.map((model) => (
                  <option key={model.modelId} value={model.modelId}>
                    {model.brand ? `${model.brand} - ${model.modelName}` : model.modelName}
                  </option>
                ))}
              </select>
              {errors.modelId && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.modelId}</div>
              )}
            </div>

            {/* Biển số xe - Cột 2 */}
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                <TruckIcon width={18} height={18} style={{ color: '#6b7280' }} />
                Biển số xe <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <TruckIcon 
                  width={20} 
                  height={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} 
                />
                <input
                  type="text"
                  value={formData.licensePlate}
                  onChange={(e) => handleChange('licensePlate', e.target.value)}
                  placeholder="Nhập biển số xe (VD: 80-I1 9190)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingLeft: '38px',
                    border: `2px solid ${errors.licensePlate ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {errors.licensePlate && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.licensePlate}</div>
              )}
            </div>

            {/* VIN - Cột 1 */}
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                <HashtagIcon width={18} height={18} style={{ color: '#6b7280' }} />
                Số VIN <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <HashtagIcon 
                  width={20} 
                  height={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} 
                />
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => handleChange('vin', e.target.value)}
                  placeholder="Nhập số VIN của xe"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingLeft: '38px',
                    border: `2px solid ${errors.vin ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {errors.vin && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.vin}</div>
              )}
            </div>

            {/* Màu sắc - Cột 2 */}
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                <SwatchIcon width={18} height={18} style={{ color: '#6b7280' }} />
                Màu sắc <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <SwatchIcon 
                  width={20} 
                  height={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} 
                />
                <select
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingLeft: '38px',
                    border: `2px solid ${errors.color ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.color && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.color}</div>
              )}
            </div>

            {/* Số km hiện tại - Cột 1 */}
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                <ArrowPathIcon width={18} height={18} style={{ color: '#6b7280' }} />
                Số km hiện tại <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <ArrowPathIcon 
                  width={20} 
                  height={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} 
                />
                <input
                  type="number"
                  value={formData.currentMileage}
                  onChange={(e) => handleChange('currentMileage', e.target.value)}
                  placeholder="Nhập số km hiện tại (VD: 50000)"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingLeft: '38px',
                    border: `2px solid ${errors.currentMileage ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {errors.currentMileage && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.currentMileage}</div>
              )}
            </div>

            {/* Lần bảo dưỡng cuối - Cột 2 */}
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                <CalendarIcon width={18} height={18} style={{ color: '#6b7280' }} />
                Lần bảo dưỡng cuối
              </label>
              <div style={{ position: 'relative' }}>
                <CalendarIcon 
                  width={20} 
                  height={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} 
                />
                <input
                  type="date"
                  value={formData.lastServiceDate}
                  onChange={(e) => handleChange('lastServiceDate', e.target.value)}
                  placeholder="Chọn ngày bảo dưỡng"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingLeft: '38px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#fff',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#FFD875',
                color: '#111827',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FFE082'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FFD875'
                }
              }}
            >
              {loading ? 'Đang thêm...' : 'Thêm phương tiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Render modal using portal to document.body
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return null
}

export default AddVehicleModal

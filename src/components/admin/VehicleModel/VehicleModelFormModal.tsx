import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, Save } from 'lucide-react'
import { vehicleModelService, VehicleModelResponse, CreateVehicleModelRequest, UpdateVehicleModelRequest } from '@/services/vehicleModelManagement'
import toast from 'react-hot-toast'
import './_vehicle-model-modal.scss'

interface VehicleModelFormModalProps {
  isOpen: boolean
  model: VehicleModelResponse | null
  onClose: () => void
  onSuccess: () => void
}

const VehicleModelFormModal: React.FC<VehicleModelFormModalProps> = ({
  isOpen,
  model,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateVehicleModelRequest>({
    modelName: '',
    brand: '',
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = !!model

  useEffect(() => {
    if (isOpen) {
      if (model) {
        setFormData({
          modelName: model.modelName,
          brand: model.brand,
          isActive: model.isActive
        })
      } else {
        setFormData({
          modelName: '',
          brand: '',
          isActive: true
        })
      }
      setErrors({})
    }
  }, [isOpen, model])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.modelName?.trim()) {
      newErrors.modelName = 'Tên mẫu xe là bắt buộc'
    }

    if (!formData.brand?.trim()) {
      newErrors.brand = 'Hãng xe là bắt buộc'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      setLoading(true)
      
      if (isEditMode && model) {
        const updateData: UpdateVehicleModelRequest = {
          modelName: formData.modelName,
          brand: formData.brand,
          isActive: formData.isActive
        }
        await vehicleModelService.update(model.modelId, updateData)
        toast.success('Cập nhật mẫu xe thành công')
      } else {
        await vehicleModelService.create(formData)
        toast.success('Tạo mẫu xe thành công')
      }

      onSuccess()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra'
      
      // Handle validation errors from backend
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const backendErrors = err.response.data.errors
        setErrors(backendErrors)
        toast.error('Vui lòng kiểm tra lại thông tin')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="vehicle-model-modal-overlay" onClick={onClose}>
      <div className="vehicle-model-modal vehicle-model-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vehicle-model-modal__header">
          <div>
            <h2 className="vehicle-model-modal__title">
              {isEditMode ? 'Sửa mẫu xe' : 'Thêm mẫu xe mới'}
            </h2>
            <p className="vehicle-model-modal__subtitle">
              {isEditMode ? `ID: #${model?.modelId}` : 'Điền thông tin để tạo mẫu xe mới'}
            </p>
          </div>
          <button className="vehicle-model-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vehicle-model-modal__content">
          <div className="vehicle-model-modal__form-grid">
            {/* Model Name */}
            <div className="form-group">
              <label className="form-label">
                Tên mẫu xe <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.modelName ? 'error' : ''}`}
                value={formData.modelName}
                onChange={(e) => {
                  setFormData({ ...formData, modelName: e.target.value })
                  if (errors.modelName) {
                    setErrors({ ...errors, modelName: '' })
                  }
                }}
                placeholder="VD: Model 3, VF8, Camry..."
                disabled={loading}
              />
              {errors.modelName && (
                <div className="form-error">
                  <AlertCircle size={14} />
                  {errors.modelName}
                </div>
              )}
            </div>

            {/* Brand */}
            <div className="form-group">
              <label className="form-label">
                Hãng xe <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.brand ? 'error' : ''}`}
                value={formData.brand}
                onChange={(e) => {
                  setFormData({ ...formData, brand: e.target.value })
                  if (errors.brand) {
                    setErrors({ ...errors, brand: '' })
                  }
                }}
                placeholder="VD: Tesla, Vinfast, Toyota..."
                disabled={loading}
              />
              {errors.brand && (
                <div className="form-error">
                  <AlertCircle size={14} />
                  {errors.brand}
                </div>
              )}
            </div>

            {/* Is Active */}
            <div className="form-group form-group--full">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={loading}
                />
                <span>Hoạt động</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="vehicle-model-modal__actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              <Save size={16} /> {loading ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default VehicleModelFormModal

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, CheckCircle, X } from 'lucide-react'
import { InventoryPart, UpdatePartRequest } from '@/services/inventoryService'
import './InventoryManagement.scss'

interface EditProductModalProps {
  isOpen: boolean
  part: InventoryPart | null
  onClose: () => void
  onUpdatePart: (partData: UpdatePartRequest) => Promise<void>
  error?: string | null
  success?: string | null
}

export default function EditProductModal({
  isOpen,
  part,
  onClose,
  onUpdatePart,
  error,
  success
}: EditProductModalProps) {
  const [formData, setFormData] = useState<UpdatePartRequest>({
    partName: '',
    brand: '',
    unitPrice: 0,
    imageUrl: '',
    isActive: true
  })
  const [validationErrors, setValidationErrors] = useState<{
    partName?: string
    brand?: string
    unitPrice?: string
    imageUrl?: string
  }>({})
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (part) {
      setFormData({
        partName: part.partName,
        brand: part.brand,
        unitPrice: part.unitPrice,
        imageUrl: part.imageUrl || '',
        isActive: part.isActive
      })
    }
  }, [part])

  const validateForm = () => {
    const errors: { partName?: string; brand?: string; unitPrice?: string; imageUrl?: string } = {}
    
    if (!formData.partName.trim()) {
      errors.partName = 'Tên phụ tùng không được để trống'
    }
    
    if (!formData.brand.trim()) {
      errors.brand = 'Thương hiệu không được để trống'
    }
    
    if (formData.unitPrice <= 0) {
      errors.unitPrice = 'Giá phải lớn hơn 0'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setUpdating(true)
      await onUpdatePart(formData)
    } finally {
      setUpdating(false)
    }
  }

  const handleClose = () => {
    setFormData({
      partName: '',
      brand: '',
      unitPrice: 0,
      imageUrl: '',
      isActive: true
    })
    setValidationErrors({})
    onClose()
  }

  const handleInputChange = (field: keyof UpdatePartRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error when user types
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen || !part) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Chỉnh sửa thông tin phụ tùng</h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="form-group">
          <label className="form-label">Tên phụ tùng *</label>
          <input
            type="text"
            value={formData.partName}
            onChange={(e) => handleInputChange('partName', e.target.value)}
            className={`form-input ${validationErrors.partName ? 'error' : ''}`}
            placeholder="Nhập tên phụ tùng"
          />
          {validationErrors.partName && (
            <span style={{
              fontSize: '12px',
              color: '#EF4444',
              marginTop: '4px',
              display: 'block'
            }}>
              {validationErrors.partName}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Thương hiệu *</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => handleInputChange('brand', e.target.value)}
            className={`form-input ${validationErrors.brand ? 'error' : ''}`}
            placeholder="Nhập thương hiệu"
          />
          {validationErrors.brand && (
            <span style={{
              fontSize: '12px',
              color: '#EF4444',
              marginTop: '4px',
              display: 'block'
            }}>
              {validationErrors.brand}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Giá (VNĐ) *</label>
          <input
            type="number"
            min="0"
            value={formData.unitPrice || ''}
            onChange={(e) => handleInputChange('unitPrice', Number(e.target.value))}
            className={`form-input ${validationErrors.unitPrice ? 'error' : ''}`}
            placeholder="Nhập giá"
          />
          {validationErrors.unitPrice && (
            <span style={{
              fontSize: '12px',
              color: '#EF4444',
              marginTop: '4px',
              display: 'block'
            }}>
              {validationErrors.unitPrice}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">URL hình ảnh</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => handleInputChange('imageUrl', e.target.value)}
            className="form-input"
            placeholder="Nhập URL hình ảnh"
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              style={{ margin: 0 }}
            />
            Phụ tùng đang hoạt động
          </label>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-content">
              <AlertCircle size={16} />
              <span className="alert-text">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div className="alert-content">
              <CheckCircle size={16} />
              <span className="alert-text">{success}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            onClick={handleClose}
            disabled={updating}
            className="btn btn-secondary"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={updating}
            className="btn btn-primary"
          >
            {updating ? (
              <>
                <Loader2 size={16} className="spinner" />
                Đang cập nhật...
              </>
            ) : (
              'Cập nhật'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

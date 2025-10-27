import { useState } from 'react'
import { Loader2, AlertCircle, CheckCircle, X } from 'lucide-react'
import { AvailablePart, AddPartToInventoryRequest } from '@/services/inventoryService'
import './InventoryManagement.scss'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  availableParts: AvailablePart[]
  loadingAvailableParts: boolean
  onAddPart: (partData: AddPartToInventoryRequest) => Promise<void>
  error?: string | null
  success?: string | null
}

export default function AddProductModal({
  isOpen,
  onClose,
  availableParts,
  loadingAvailableParts,
  onAddPart,
  error,
  success
}: AddProductModalProps) {
  const [selectedPart, setSelectedPart] = useState<AvailablePart | null>(null)
  const [currentStock, setCurrentStock] = useState<number>(0)
  const [minimumStock, setMinimumStock] = useState<number>(0)
  const [addingPart, setAddingPart] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    currentStock?: string
    minimumStock?: string
  }>({})

  const validateForm = () => {
    const errors: { currentStock?: string; minimumStock?: string } = {}
    
    if (!currentStock || currentStock <= 0) {
      errors.currentStock = 'Số lượng hiện tại phải lớn hơn 0'
    }
    
    if (minimumStock < 0) {
      errors.minimumStock = 'Số lượng tối thiểu không được âm'
    }
    
    if (minimumStock > currentStock) {
      errors.minimumStock = 'Số lượng tối thiểu không được lớn hơn số lượng hiện tại'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddPart = async () => {
    if (!validateForm() || !selectedPart) {
      return
    }

    try {
      setAddingPart(true)
      const partData: AddPartToInventoryRequest = {
        partId: selectedPart.partId,
        currentStock: currentStock,
        minimumStock: minimumStock
      }

      await onAddPart(partData)
      
      // Reset form after successful add
      setSelectedPart(null)
      setCurrentStock(0)
      setMinimumStock(0)
      setValidationErrors({})
    } finally {
      setAddingPart(false)
    }
  }

  const handleClose = () => {
    setSelectedPart(null)
    setCurrentStock(0)
    setMinimumStock(0)
    setValidationErrors({})
    onClose()
  }

  const handleCurrentStockChange = (value: number) => {
    setCurrentStock(value)
    // Clear validation error when user types
    if (validationErrors.currentStock) {
      setValidationErrors(prev => ({ ...prev, currentStock: undefined }))
    }
  }

  const handleMinimumStockChange = (value: number) => {
    setMinimumStock(value)
    // Clear validation error when user types
    if (validationErrors.minimumStock) {
      setValidationErrors(prev => ({ ...prev, minimumStock: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Thêm sản phẩm vào kho</h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Part Selection */}
        <div className="form-group">
          <label className="form-label">Chọn phụ tùng *</label>
          {loadingAvailableParts ? (
            <div className="loading-parts">
              <Loader2 size={20} className="spinner" />
              Đang tải danh sách phụ tùng...
            </div>
          ) : (
            <div className="parts-list">
              {availableParts.length === 0 ? (
                <div className="empty-parts">
                  Không có phụ tùng nào có thể thêm
                </div>
              ) : (
                availableParts.map((part) => (
                  <div
                    key={part.partId}
                    onClick={() => setSelectedPart(part)}
                    className={`part-item ${selectedPart?.partId === part.partId ? 'selected' : ''}`}
                  >
                    <div className="part-info">
                      <div className="part-details">
                        <p className="part-name">{part.partName}</p>
                        <p className="part-meta">
                          {part.partNumber} • {part.brand}
                        </p>
                      </div>
                      <div className="part-price">
                        {part.price.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Stock Inputs */}
        {selectedPart && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="form-group">
              <label className="form-label">Số lượng hiện tại *</label>
              <input
                type="number"
                min="0"
                value={currentStock || ''}
                onChange={(e) => handleCurrentStockChange(Number(e.target.value))}
                className={`form-input ${validationErrors.currentStock ? 'error' : ''}`}
              />
              {validationErrors.currentStock && (
                <span style={{
                  fontSize: '12px',
                  color: '#EF4444',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  {validationErrors.currentStock}
                </span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Số lượng tối thiểu</label>
              <input
                type="number"
                min="0"
                value={minimumStock || ''}
                onChange={(e) => handleMinimumStockChange(Number(e.target.value))}
                className={`form-input ${validationErrors.minimumStock ? 'error' : ''}`}
              />
              {validationErrors.minimumStock && (
                <span style={{
                  fontSize: '12px',
                  color: '#EF4444',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  {validationErrors.minimumStock}
                </span>
              )}
            </div>
          </div>
        )}

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
            disabled={addingPart}
            className="btn btn-secondary"
          >
            Hủy
          </button>
          <button
            onClick={handleAddPart}
            disabled={addingPart || !selectedPart || currentStock <= 0}
            className="btn btn-primary"
          >
            {addingPart ? (
              <>
                <Loader2 size={16} className="spinner" />
                Đang thêm...
              </>
            ) : (
              'Thêm vào kho'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

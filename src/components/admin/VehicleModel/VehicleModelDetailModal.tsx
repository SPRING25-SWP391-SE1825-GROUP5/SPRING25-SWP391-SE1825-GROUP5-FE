import React from 'react'
import { createPortal } from 'react-dom'
import { X, Edit, Trash2, Car, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { VehicleModelResponse } from '@/services/vehicleModelManagement'
import './_vehicle-model-modal.scss'

interface VehicleModelDetailModalProps {
  isOpen: boolean
  model: VehicleModelResponse
  onClose: () => void
  onEdit: () => void
  onDelete: (model: VehicleModelResponse) => void
}

const VehicleModelDetailModal: React.FC<VehicleModelDetailModalProps> = ({
  isOpen,
  model,
  onClose,
  onEdit,
  onDelete
}) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive 
      ? 'status-badge status-badge--active' 
      : 'status-badge status-badge--inactive'
  }

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Hoạt động' : 'Tạm dừng'
  }

  if (!isOpen || !model) return null

  return createPortal(
    <div className="vehicle-model-modal-overlay" onClick={onClose}>
      <div className="vehicle-model-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vehicle-model-modal__header">
          <div>
            <h2 className="vehicle-model-modal__title">
              Chi tiết Mẫu xe #{model.modelId}
            </h2>
            <p className="vehicle-model-modal__subtitle">
              Ngày tạo: {formatDateTime(model.createdAt)}
            </p>
          </div>
          <button className="vehicle-model-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="vehicle-model-modal__content">
          {/* Status Badge */}
          <div className="vehicle-model-modal__status">
            <span className={getStatusBadgeClass(model.isActive)}>
              <span className="dot" />
              {getStatusLabel(model.isActive)}
            </span>
          </div>

          {/* Model Info */}
          <div className="vehicle-model-modal__section">
            <h3 className="vehicle-model-modal__section-title">
              <Car size={18} /> Thông tin mẫu xe
            </h3>
            <div className="vehicle-model-modal__info-grid">
              <div className="info-item">
                <label>ID:</label>
                <span>#{model.modelId}</span>
              </div>
              <div className="info-item">
                <label>Tên mẫu:</label>
                <span className="text-primary-bold">{model.modelName}</span>
              </div>
              <div className="info-item">
                <label>Hãng xe:</label>
                <span>{model.brand}</span>
              </div>
              <div className="info-item">
                <label>Trạng thái:</label>
                <span className={getStatusBadgeClass(model.isActive)}>
                  <span className="dot" />
                  {getStatusLabel(model.isActive)}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="vehicle-model-modal__section">
            <h3 className="vehicle-model-modal__section-title">
              <Calendar size={18} /> Thông tin thời gian
            </h3>
            <div className="vehicle-model-modal__info-grid">
              <div className="info-item">
                <label>Ngày tạo:</label>
                <span>{formatDateTime(model.createdAt)}</span>
              </div>
              {model.updatedAt && (
                <div className="info-item">
                  <label>Ngày cập nhật:</label>
                  <span>{formatDateTime(model.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="vehicle-model-modal__actions">
            <button className="btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button className="btn-warning" onClick={onEdit}>
              <Edit size={16} /> Sửa
            </button>
            <button className="btn-danger" onClick={() => {
              if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu xe "${model.modelName}"?`)) {
                onDelete(model)
                onClose()
              }
            }}>
              <Trash2 size={16} /> Xóa
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default VehicleModelDetailModal

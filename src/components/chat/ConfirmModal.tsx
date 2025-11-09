import React from 'react'
import { X } from 'lucide-react'
import './ConfirmModal.scss'

interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'delete' | 'warning' | 'info'
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xóa',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  type = 'delete'
}) => {
  if (!isOpen) return null

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal__header">
          {title && <h3 className="confirm-modal__title">{title}</h3>}
          <button
            className="confirm-modal__close"
            onClick={onCancel}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        <div className="confirm-modal__body">
          <p className="confirm-modal__message">{message}</p>
        </div>
        <div className="confirm-modal__footer">
          {cancelText && (
            <button
              className="confirm-modal__btn confirm-modal__btn--cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`confirm-modal__btn confirm-modal__btn--confirm confirm-modal__btn--${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal


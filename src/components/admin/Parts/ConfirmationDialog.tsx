import React from 'react'
import './ConfirmationDialog.scss'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'danger'
}: ConfirmationDialogProps) {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmBg: '#ef4444',
          confirmHoverBg: '#dc2626',
          iconBg: '#fef2f2'
        }
      case 'warning':
        return {
          icon: '⚠️',
          confirmBg: '#f59e0b',
          confirmHoverBg: '#d97706',
          iconBg: '#fffbeb'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          confirmBg: '#3b82f6',
          confirmHoverBg: '#2563eb',
          iconBg: '#eff6ff'
        }
      default:
        return {
          icon: '⚠️',
          confirmBg: '#ef4444',
          confirmHoverBg: '#dc2626',
          iconBg: '#fef2f2'
        }
    }
  }

  const typeStyles = getTypeStyles()

  return (
    <div className="confirmation-dialog">
      <div className="confirmation-dialog__content">
        <div className="confirmation-dialog__header">
          <div className={`confirmation-dialog__icon-wrapper confirmation-dialog__icon-wrapper--${type}`}>
            {typeStyles.icon}
          </div>
          <h3 className="confirmation-dialog__title">
            {title}
          </h3>
        </div>

        <p className="confirmation-dialog__message">
          {message}
        </p>

        <div className="confirmation-dialog__actions">
          <button
            onClick={onClose}
            className="confirmation-dialog__button confirmation-dialog__button--cancel"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`confirmation-dialog__button confirmation-dialog__button--confirm confirmation-dialog__button--confirm-${type}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}


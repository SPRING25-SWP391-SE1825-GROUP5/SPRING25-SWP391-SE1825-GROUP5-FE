import React from 'react'

interface NotificationProps {
  type: 'success' | 'error' | 'info'
  message: string
  onClose: () => void
  show: boolean
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose, show }) => {
  if (!show) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  const getStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '8px',
      color: '#fff',
      fontWeight: '500',
      fontSize: '14px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      animation: 'slideIn 0.3s ease-out'
    }

    switch (type) {
      case 'success':
        return { ...baseStyles, backgroundColor: '#10b981' }
      case 'error':
        return { ...baseStyles, backgroundColor: '#ef4444' }
      case 'info':
        return { ...baseStyles, backgroundColor: '#3b82f6' }
      default:
        return { ...baseStyles, backgroundColor: '#6b7280' }
    }
  }

  return (
    <div style={getStyles()}>
      <span>{getIcon()}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '0',
          marginLeft: '8px'
        }}
      >
        ×
      </button>
    </div>
  )
}

export default Notification

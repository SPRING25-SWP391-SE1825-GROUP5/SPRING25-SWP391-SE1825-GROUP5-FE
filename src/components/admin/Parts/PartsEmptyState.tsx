import React from 'react'

interface PartsEmptyStateProps {
  onAddPart: () => void
  hasFilters: boolean
  onResetFilters: () => void
}

export default function PartsEmptyState({ onAddPart, hasFilters, onResetFilters }: PartsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f1f5f9',
        padding: '80px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '50%',
          opacity: 0.1
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          borderRadius: '50%',
          opacity: 0.1
        }} />
        
        <div style={{
          fontSize: '80px',
          marginBottom: '24px',
          position: 'relative',
          animation: 'float 3s ease-in-out infinite'
        }}>
          🔍
        </div>
        <h3 style={{
          fontSize: '24px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 12px 0',
          fontFamily: '"Inter", system-ui, sans-serif'
        }}>
          Không tìm thấy phụ tùng
        </h3>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0 0 32px 0',
          fontWeight: '500',
          lineHeight: '1.6'
        }}>
          Không có phụ tùng nào phù hợp với bộ lọc hiện tại.<br />
          Hãy thử điều chỉnh tiêu chí tìm kiếm của bạn.
        </p>
        <button
          onClick={onResetFilters}
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 32px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 16px rgba(245, 158, 11, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(245, 158, 11, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.4)'
          }}
        >
          <span>🔄</span>
          <span>Đặt lại bộ lọc</span>
        </button>
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '24px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #f1f5f9',
      padding: '80px 40px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '120px',
        height: '120px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '50%',
        opacity: 0.1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        left: '-30px',
        width: '100px',
        height: '100px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        borderRadius: '50%',
        opacity: 0.1
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px',
        height: '200px',
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        borderRadius: '50%',
        opacity: 0.05
      }} />
      
      <div style={{
        fontSize: '100px',
        marginBottom: '24px',
        position: 'relative',
        animation: 'bounce 2s ease-in-out infinite'
      }}>
        📦
      </div>
      <h3 style={{
        fontSize: '28px',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        margin: '0 0 12px 0',
        fontFamily: '"Inter", system-ui, sans-serif'
      }}>
        Chưa có phụ tùng nào
      </h3>
      <p style={{
        fontSize: '16px',
        color: '#6b7280',
        margin: '0 0 40px 0',
        fontWeight: '500',
        lineHeight: '1.6'
      }}>
        Kho phụ tùng đang trống. Bắt đầu bằng cách thêm<br />
        phụ tùng đầu tiên để quản lý tồn kho hiệu quả.
      </p>
      
      {/* Features preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '40px',
        opacity: 0.7
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          <span style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>📊</span>
          Theo dõi tồn kho
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          <span style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>💰</span>
          Quản lý giá cả
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          <span style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>🏢</span>
          Theo dõi NCC
        </div>
      </div>
      
      <button
        onClick={onAddPart}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 32px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 16px rgba(16, 185, 129, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.4)'
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          background: 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)'
        }}>+</div>
        <span>Thêm phụ tùng đầu tiên</span>
      </button>
    </div>
  )
}


import React from 'react'

export default function WorkQueueHeader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h2 style={{
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 8px 0',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Hàng đợi công việc
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>
          Quản lý và theo dõi công việc được giao
        </p>
      </div>
    </div>
  )
}

import React from 'react'

export interface StatItem {
  label: string
  value: number
  color: string
  bgColor?: string
  icon: any
}

export default function WorkQueueStats({ stats }: { stats: StatItem[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      marginBottom: '16px'
    }}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            style={{
              background: '#fff',
              border: `1px solid ${stat.color}20`,
              borderRadius: 0,
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
              cursor: 'default',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 0,
              background: stat.bgColor || 'rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stat.color,
              flexShrink: 0
            }}>
              <Icon size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                lineHeight: '1.2',
                marginBottom: '2px'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                {stat.label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

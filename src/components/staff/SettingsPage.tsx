export default function SettingsPage() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
        Cài đặt
      </h2>
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)'
      }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cài đặt cá nhân và hệ thống sẽ được hiển thị ở đây...</p>
      </div>
    </div>
  )
}

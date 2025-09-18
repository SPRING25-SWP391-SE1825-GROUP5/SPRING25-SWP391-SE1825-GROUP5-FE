import './admin.scss'

export default function StaffManagementTest() {
  return (
    <div style={{ padding: '24px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: '700', 
        color: 'var(--text-primary)',
        margin: '0 0 8px 0'
      }}>
        Quản lý nhân sự - Test
      </h1>
      <p style={{ 
        fontSize: '16px', 
        color: 'var(--text-secondary)',
        margin: '0 0 32px 0'
      }}>
        Trang quản lý nhân sự đã được tạo thành công!
      </p>
      
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: '0 0 16px 0'
        }}>
          Thống kê nhân sự
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{
            background: 'var(--primary-50)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-500)' }}>6</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Tổng nhân viên</div>
          </div>
          <div style={{
            background: 'var(--success-50)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success-500)' }}>5</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Đang làm việc</div>
          </div>
          <div style={{
            background: 'var(--error-50)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--error-500)' }}>1</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nghỉ việc</div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: '0 0 16px 0'
        }}>
          Danh sách nhân viên
        </h3>
        <div style={{ 
          background: 'var(--bg-tertiary)', 
          padding: '12px', 
          borderRadius: '8px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          Danh sách nhân viên sẽ được hiển thị ở đây...
        </div>
      </div>
    </div>
  )
}

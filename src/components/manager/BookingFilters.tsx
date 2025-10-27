import { Search, Filter } from 'lucide-react'

interface BookingFiltersProps {
  searchTerm: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
}

export default function BookingFilters({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange
}: BookingFiltersProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      marginBottom: '24px'
    }}>
      <div style={{ 
        position: 'relative', 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)'
      }}>
        <Search size={20} style={{ color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            flex: 1,
            fontSize: '14px',
            color: 'var(--text-primary)'
          }}
        />
      </div>
      <div style={{
        background: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer'
      }}>
        <Filter size={20} style={{ color: 'var(--text-tertiary)' }} />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '14px',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>
    </div>
  )
}

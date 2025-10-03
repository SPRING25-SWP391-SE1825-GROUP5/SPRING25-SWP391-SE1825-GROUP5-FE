import { Search, Plus } from 'lucide-react'

interface StaffFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterDepartment: string
  onDepartmentChange: (value: string) => void
  filterStatus: string
  onStatusChange: (value: string) => void
  onAddStaff: () => void
}

export default function StaffFilters({
  searchTerm,
  onSearchChange,
  filterDepartment,
  onDepartmentChange,
  filterStatus,
  onStatusChange,
  onAddStaff
}: StaffFiltersProps) {
  const departments = [
    { value: 'all', label: 'Tất cả phòng ban' },
    { value: 'Kỹ thuật', label: 'Kỹ thuật' },
    { value: 'Dịch vụ khách hàng', label: 'Dịch vụ khách hàng' },
    { value: 'Quản lý', label: 'Quản lý' },
    { value: 'Kế toán', label: 'Kế toán' },
    { value: 'Nhân sự', label: 'Nhân sự' }
  ]

  const statuses = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang làm việc' },
    { value: 'inactive', label: 'Nghỉ việc' },
    { value: 'on-leave', label: 'Nghỉ phép' }
  ]

  return (
    <div style={{
      background: 'var(--bg-card)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid var(--border-primary)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
          <Search size={20} style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)'
          }} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc vị trí..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Department Filter */}
        <select
          value={filterDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            minWidth: '150px'
          }}
        >
          {departments.map(dept => (
            <option key={dept.value} value={dept.value}>{dept.label}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            minWidth: '150px'
          }}
        >
          {statuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        {/* Add Staff Button */}
        <button
          onClick={onAddStaff}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'var(--primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-600)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary-500)'}
        >
          <Plus size={16} />
          Thêm nhân viên
        </button>
      </div>
    </div>
  )
}

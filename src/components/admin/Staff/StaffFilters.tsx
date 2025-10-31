import { Search, Plus } from 'lucide-react'
import './StaffFilters.scss'

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
    <div className="staff-filters">
      <div className="staff-filters__container">
        {/* Search */}
        <div className="staff-filters__search">
          <Search size={20} className="staff-filters__search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc vị trí..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="staff-filters__search-input"
          />
        </div>

        {/* Department Filter */}
        <select
          value={filterDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="staff-filters__select"
        >
          {departments.map(dept => (
            <option key={dept.value} value={dept.value}>{dept.label}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="staff-filters__select"
        >
          {statuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        {/* Add Staff Button */}
        <button
          onClick={onAddStaff}
          className="staff-filters__add-button"
        >
          <Plus size={16} />
          Thêm nhân viên
        </button>
      </div>
    </div>
  )
}

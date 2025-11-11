import React from 'react'
import { Search, Wrench, Filter, ChevronDown, Plus, Clock } from 'lucide-react'

interface Props {
  searchTerm: string
  onSearchChange: (v: string) => void
  serviceTypeFilter: string
  onServiceTypeChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
  timeSlotFilter: string
  onTimeSlotChange: (v: string) => void
  availableTimeSlots: string[]
  showAllStatusesToggle: boolean
  onToggleShowAll: () => void
  onResetFilters: () => void
}

export default function WorkQueueToolbar({
  searchTerm,
  onSearchChange,
  serviceTypeFilter,
  onServiceTypeChange,
  statusFilter,
  onStatusChange,
  timeSlotFilter,
  onTimeSlotChange,
  availableTimeSlots,
  showAllStatusesToggle,
  onToggleShowAll,
  onResetFilters,
}: Props) {
  const [showRoleMenu, setShowRoleMenu] = React.useState(false)
  const [showStatusMenu, setShowStatusMenu] = React.useState(false)
  const [showTimeSlotMenu, setShowTimeSlotMenu] = React.useState(false)

  const getServiceTypeLabel = (val: string) => {
    if (val === 'maintenance') return 'Bảo dưỡng'
    if (val === 'repair') return 'Sửa chữa'
    if (val === 'inspection') return 'Kiểm tra'
    return 'Tất cả vai trò'
  }

  const getStatusLabel = (val: string) => {
    if (val === 'PENDING') return 'Chờ xác nhận'
    if (val === 'CONFIRMED') return 'Đã xác nhận'
    if (val === 'CHECKED_IN') return 'Đã check-in'
    if (val === 'IN_PROGRESS') return 'Đang làm việc'
    if (val === 'COMPLETED') return 'Hoàn thành'
    if (val === 'PAID') return 'Đã thanh toán'
    if (val === 'CANCELLED') return 'Đã hủy'
    return 'Tất cả trạng thái'
  }

  const getTimeSlotLabel = (val: string) => {
    if (val === 'all') return 'Tất cả khung giờ'
    return val || 'Tất cả khung giờ'
  }

  return (
    <div className="users-toolbar" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 0, border: 'none', marginBottom: 16 }}>
      {/* Row 1: Search + Toggle */}
      <div className="toolbar-top" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="toolbar-search" style={{ flex: 1, minWidth: 320 }}>
          <div className="search-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} className="icon" style={{ position: 'absolute', left: 12, color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              placeholder="Tìm kiếm theo tên, biển số, SĐT..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: 'none', borderBottom: '1px solid transparent', background: 'transparent', fontSize: 13, outline: 'none' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={onToggleShowAll} style={{ height: 32, padding: '0 12px', border: '1px solid #FFD875', borderRadius: '10px', background: showAllStatusesToggle ? '#FFF6D1' : '#FFFFFF', color: '#111827', fontSize: 13 }}>{showAllStatusesToggle ? 'Hiển thị: Tất cả' : 'Hiển thị: Quan trọng'}</button>
          <button type="button" onClick={onResetFilters} style={{ height: 32, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: '10px', background: '#FFFFFF', color: '#374151', fontSize: 13 }}>Đặt lại</button>
        </div>
      </div>

      {/* Row 2: Filters */}
      <div className="toolbar-filters" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Service Type */}
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => { setShowRoleMenu(!showRoleMenu); if (!showRoleMenu) { setShowStatusMenu(false); setShowTimeSlotMenu(false) } }}
            style={{ height: 36, padding: '0 12px', border: '1px solid var(--border-primary)', borderRadius: '10px', background: '#fff', color: 'var(--text-primary)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Wrench size={14} /> {getServiceTypeLabel(serviceTypeFilter)} <ChevronDown size={14} />
          </button>
          {showRoleMenu && (
            <div style={{ position: 'absolute', zIndex: 20, marginTop: 6, minWidth: 200, background: '#fff', border: '1px solid var(--border-primary)', borderRadius: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              {[
                { value: 'all', label: 'Tất cả vai trò' },
                { value: 'maintenance', label: 'Bảo dưỡng' },
                { value: 'repair', label: 'Sửa chữa' },
                { value: 'inspection', label: 'Kiểm tra' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => { onServiceTypeChange(opt.value); setShowRoleMenu(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => { setShowStatusMenu(!showStatusMenu); if (!showStatusMenu) { setShowRoleMenu(false); setShowTimeSlotMenu(false) } }}
            style={{ height: 36, padding: '0 12px', border: '1px solid var(--border-primary)', borderRadius: '10px', background: '#fff', color: 'var(--text-primary)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} /> {getStatusLabel(statusFilter)} <ChevronDown size={14} />
          </button>
          {showStatusMenu && (
            <div style={{ position: 'absolute', zIndex: 20, marginTop: 6, minWidth: 220, background: '#fff', border: '1px solid var(--border-primary)', borderRadius: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              {[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'PENDING', label: 'Chờ xác nhận' },
                { value: 'CONFIRMED', label: 'Đã xác nhận' },
                { value: 'CHECKED_IN', label: 'Đã check-in' },
                { value: 'IN_PROGRESS', label: 'Đang làm việc' },
                { value: 'COMPLETED', label: 'Hoàn thành' },
                { value: 'PAID', label: 'Đã thanh toán' },
                { value: 'CANCELLED', label: 'Đã hủy' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => { onStatusChange(opt.value); setShowStatusMenu(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time Slot */}
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => { setShowTimeSlotMenu(!showTimeSlotMenu); if (!showTimeSlotMenu) { setShowRoleMenu(false); setShowStatusMenu(false) } }}
            style={{ height: 36, padding: '0 12px', border: '1px solid var(--border-primary)', borderRadius: '10px', background: '#fff', color: 'var(--text-primary)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} /> {getTimeSlotLabel(timeSlotFilter)} <ChevronDown size={14} />
          </button>
          {showTimeSlotMenu && (
            <div style={{ position: 'absolute', zIndex: 20, marginTop: 6, minWidth: 200, maxHeight: 300, overflowY: 'auto', background: '#fff', border: '1px solid var(--border-primary)', borderRadius: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              <button key="all" type="button" onClick={() => { onTimeSlotChange('all'); setShowTimeSlotMenu(false) }}
                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                Tất cả khung giờ
              </button>
              {availableTimeSlots.map(slot => (
                <button key={slot} type="button" onClick={() => { onTimeSlotChange(slot); setShowTimeSlotMenu(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add filter (placeholder) */}
        <div style={{ position: 'relative' }}>
          <button type="button"
            onClick={() => { setShowRoleMenu(false); setShowStatusMenu(false); setShowTimeSlotMenu(false) }}
            style={{ height: 36, padding: '0 12px', border: '1px dashed var(--border-primary)', borderRadius: '10px', background: '#fff', color: 'var(--text-secondary)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Thêm bộ lọc
          </button>
        </div>
      </div>
    </div>
  )
}

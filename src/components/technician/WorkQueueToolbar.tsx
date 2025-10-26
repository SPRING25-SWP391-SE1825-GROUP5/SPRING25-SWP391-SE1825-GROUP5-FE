import React, { useEffect, useCallback } from 'react'
import { Search, RefreshCw, Calendar } from 'lucide-react'
import CustomSelect from './CustomSelect'
import './CustomSelect.scss'

interface WorkQueueToolbarProps {
  selectedDate: string
  setSelectedDate: (date: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  loading: boolean
  onRefresh: () => void
}

const WorkQueueToolbar: React.FC<WorkQueueToolbarProps> = ({
  selectedDate,
  setSelectedDate,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  loading,
  onRefresh
}) => {
  // Tự động fetch data khi thay đổi ngày
  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate)
    // Chỉ fetch khi thực sự thay đổi ngày
    if (newDate !== selectedDate) {
      onRefresh()
    }
  }, [selectedDate, onRefresh, setSelectedDate])

  return (
    <div className="work-queue__toolbar">
      <div className="work-queue__toolbar__controls">
        <div className="work-queue__toolbar__date-controls">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="work-queue__toolbar__date-input"
          />
        </div>

        <div className="work-queue__toolbar__search-wrapper">
          <div className="work-queue__toolbar__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="work-queue__toolbar__search__input"
            />
          </div>
        </div>

        <div className="work-queue__toolbar__filters">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'PENDING', label: 'Chờ xác nhận' },
              { value: 'CONFIRMED', label: 'Đã xác nhận' },
              { value: 'IN_PROGRESS', label: 'Đang làm việc' },
              { value: 'COMPLETED', label: 'Hoàn thành' },
              { value: 'PAID', label: 'Đã thanh toán' },
              { value: 'CANCELLED', label: 'Đã hủy' }
            ]}
            className="work-queue__toolbar__filters__custom-select"
          />
        </div>
      </div>
    </div>
  )
}

export default WorkQueueToolbar

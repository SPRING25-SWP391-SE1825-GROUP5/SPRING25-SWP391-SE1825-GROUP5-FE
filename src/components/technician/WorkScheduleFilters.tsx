import React from 'react'
import { X, Filter, Search } from 'lucide-react'
import './WorkScheduleFilters.scss'

interface WorkScheduleFiltersProps {
  isOpen: boolean
  onClose: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  filters: {
    status: string[]
    priority: string[]
    dateRange: {
      start: string
      end: string
    }
  }
  onFiltersChange: (filters: any) => void
}

export default function WorkScheduleFilters({
  isOpen,
  onClose,
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange
}: WorkScheduleFiltersProps) {
  const statusOptions = [
    { value: 'confirmed', label: 'Đã xác nhận', color: '#10b981' },
    { value: 'pending', label: 'Chờ xác nhận', color: '#f59e0b' },
    { value: 'cancelled', label: 'Đã hủy', color: '#ef4444' }
  ]

  const priorityOptions = [
    { value: 'high', label: 'Cao', color: '#ef4444' },
    { value: 'medium', label: 'Trung bình', color: '#f59e0b' },
    { value: 'low', label: 'Thấp', color: '#10b981' }
  ]

  const handleStatusChange = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    
    onFiltersChange({
      ...filters,
      status: newStatus
    })
  }

  const handlePriorityChange = (priority: string) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority]
    
    onFiltersChange({
      ...filters,
      priority: newPriority
    })
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      dateRange: {
        start: '',
        end: ''
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="work-schedule-filters">
      <div className="work-schedule-filters__overlay" onClick={onClose} />
      
      <div className="work-schedule-filters__content">
        <div className="work-schedule-filters__content__header">
          <h3 className="work-schedule-filters__content__header__title">
            <Filter size={20} />
            Bộ lọc lịch làm việc
          </h3>
          <button
            className="work-schedule-filters__content__header__close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="work-schedule-filters__content__body">
          {/* Search Section */}
          <div className="work-schedule-filters__content__body__section">
            <h3 className="work-schedule-filters__content__body__section__title">
              <Search size={16} />
              Tìm kiếm
            </h3>
            <div className="work-schedule-filters__content__body__section__search">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khách hàng, dịch vụ, hoặc xe..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="work-schedule-filters__content__body__section__search__input"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="work-schedule-filters__content__body__section">
            <h4 className="work-schedule-filters__content__body__section__title">
              Trạng thái
            </h4>
            <div className="work-schedule-filters__content__body__section__options">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="work-schedule-filters__content__body__section__options__item"
                >
                  <input
                    type="checkbox"
                    checked={filters.status.includes(option.value)}
                    onChange={() => handleStatusChange(option.value)}
                    className="work-schedule-filters__content__body__section__options__item__checkbox"
                  />
                  <span
                    className="work-schedule-filters__content__body__section__options__item__indicator"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="work-schedule-filters__content__body__section__options__item__label">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="work-schedule-filters__content__body__section">
            <h4 className="work-schedule-filters__content__body__section__title">
              Độ ưu tiên
            </h4>
            <div className="work-schedule-filters__content__body__section__options">
              {priorityOptions.map((option) => (
                <label
                  key={option.value}
                  className="work-schedule-filters__content__body__section__options__item"
                >
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(option.value)}
                    onChange={() => handlePriorityChange(option.value)}
                    className="work-schedule-filters__content__body__section__options__item__checkbox"
                  />
                  <span
                    className="work-schedule-filters__content__body__section__options__item__indicator"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="work-schedule-filters__content__body__section__options__item__label">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="work-schedule-filters__content__body__section">
            <h4 className="work-schedule-filters__content__body__section__title">
              Khoảng thời gian
            </h4>
            <div className="work-schedule-filters__content__body__section__date-range">
              <div className="work-schedule-filters__content__body__section__date-range__field">
                <label className="work-schedule-filters__content__body__section__date-range__field__label">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="work-schedule-filters__content__body__section__date-range__field__input"
                />
              </div>
              <div className="work-schedule-filters__content__body__section__date-range__field">
                <label className="work-schedule-filters__content__body__section__date-range__field__label">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="work-schedule-filters__content__body__section__date-range__field__input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="work-schedule-filters__content__footer">
          <button
            className="work-schedule-filters__content__footer__button work-schedule-filters__content__footer__button--secondary"
            onClick={clearFilters}
          >
            Xóa bộ lọc
          </button>
          <button
            className="work-schedule-filters__content__footer__button work-schedule-filters__content__footer__button--primary"
            onClick={onClose}
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  )
}

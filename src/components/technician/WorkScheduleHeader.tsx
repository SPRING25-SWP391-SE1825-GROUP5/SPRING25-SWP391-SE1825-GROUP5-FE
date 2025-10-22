import React from 'react'
import { Calendar, FileText, Filter } from 'lucide-react'
import './WorkScheduleHeader.scss'

interface WorkScheduleHeaderProps {
  onNavigateToLeaveRequest: () => void
  showFilters: boolean
  onToggleFilters: () => void
}

export default function WorkScheduleHeader({
  onNavigateToLeaveRequest,
  showFilters,
  onToggleFilters
}: WorkScheduleHeaderProps) {
  return (
    <div className="work-schedule-header">
      <div className="work-schedule-header__info">
        <h1 className="work-schedule-header__info__title">
          <Calendar className="work-schedule-header__info__title__icon" size={32} />
          Lịch làm việc
        </h1>
        <p className="work-schedule-header__info__description">
          Xem lịch trình công việc và cuộc hẹn của bạn
        </p>
      </div>

      <div className="work-schedule-header__actions">
        {/* Filters */}
        <button
          className={`work-schedule-header__actions__filter ${
            showFilters ? 'work-schedule-header__actions__filter--active' : ''
          }`}
          onClick={onToggleFilters}
        >
          <Filter size={16} />
          Bộ lọc
        </button>

        {/* Leave Request */}
        <button
          className="work-schedule-header__actions__button"
          onClick={onNavigateToLeaveRequest}
        >
          <FileText size={16} />
          Yêu cầu nghỉ phép
        </button>
      </div>
    </div>
  )
}

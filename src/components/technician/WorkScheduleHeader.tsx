import React from 'react'
import { Calendar } from 'lucide-react'
import './WorkScheduleHeader.scss'

interface WorkScheduleHeaderProps {
  // Removed props since we don't need them anymore
}

export default function WorkScheduleHeader({}: WorkScheduleHeaderProps) {
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
    </div>
  )
}

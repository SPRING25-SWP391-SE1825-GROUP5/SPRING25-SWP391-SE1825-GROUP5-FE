import React from 'react'
import { type TimeSlot } from '@/types/technician'
import './DayCell.scss'

interface DayCellProps {
  day: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: TimeSlot[]
  hasWork: boolean
  onDayClick: (day: Date) => void
}

export default function DayCell({
  day,
  isCurrentMonth,
  isToday,
  events,
  hasWork,
  onDayClick
}: DayCellProps) {
  // Check if day has events/time slots
  const hasEvents = events && events.length > 0

  // Handle day click
  const handleClick = () => {
    if (isCurrentMonth) {
      onDayClick(day)
    }
  }

  return (
    <div
      className={`day-cell ${
        isCurrentMonth 
          ? 'day-cell--active' 
          : 'day-cell--inactive'
      } ${
        isToday ? 'day-cell--today' : ''
      }`}
      onClick={handleClick}
      style={!isCurrentMonth ? { pointerEvents: 'none' } : {}}
    >
      {/* Day Number */}
      <div className="day-cell__number">
        {day.getDate()}
      </div>

      {/* Work Schedule Indicator - Green dot for days with work schedule */}
      {hasWork && (
        <div className="day-cell__work-indicator" />
      )}
    </div>
  )
}

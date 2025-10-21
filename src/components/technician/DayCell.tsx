import React from 'react'
import './DayCell.scss'

interface Appointment {
  id: number
  time: string
  customer: string
  service: string
  vehicle: string
  status: 'confirmed' | 'pending' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  serviceType?: 'repair' | 'maintenance' | 'inspection' | 'replacement' | 'other'
}

interface DayCellProps {
  day: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: Appointment[]
  onDayClick: (day: Date) => void
}

export default function DayCell({
  day,
  isCurrentMonth,
  isToday,
  events,
  onDayClick
}: DayCellProps) {
  // Check if day has events/appointments
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

      {/* Work Indicator - Blue dot for days with events */}
      {hasEvents && (
        <div className="day-cell__indicator" />
      )}
    </div>
  )
}

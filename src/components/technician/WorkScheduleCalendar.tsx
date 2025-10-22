import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import './WorkScheduleCalendar.scss'
import DayDetailModal from './DayDetailModal'
import DayCell from './DayCell'

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

interface WorkScheduleCalendarProps {
  viewMode: 'month'
  currentDate: Date
  onDateChange: (date: Date) => void
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onNavigateToVehicleDetails: () => void
}

export default function WorkScheduleCalendar({
  viewMode,
  currentDate,
  onDateChange,
  appointments,
  onAppointmentClick,
  onNavigateToVehicleDetails
}: WorkScheduleCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date): Appointment[] => {
    const dateString = date.toISOString().split('T')[0]
    // Mock logic - in real implementation, this would filter appointments by date
    // For now, return some appointments for demonstration
    return appointments.filter((_, index) => index < 3) // Show first 3 appointments as demo
  }

  // Check if a day has appointments
  const hasAppointments = (date: Date): boolean => {
    return getAppointmentsForDay(date).length > 0
  }

  // Handle day click
  const handleDayClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    setSelectedDay(dateString)
    setShowDayDetail(true)
  }

  // Close day detail modal
  const handleCloseDayDetail = () => {
    setShowDayDetail(false)
    setSelectedDay(null)
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    onDateChange(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  // Get month/year string
  const getMonthYearString = () => {
    return currentDate.toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric'
    })
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDay = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()
  const today = new Date()

  return (
    <>
      <div className="work-schedule-calendar">
        <div className="work-schedule-calendar__header">
          <div className="work-schedule-calendar__header__navigation">
            <button
              className="work-schedule-calendar__header__navigation__button"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="work-schedule-calendar__header__navigation__title">
              {getMonthYearString()}
            </h2>
            <button
              className="work-schedule-calendar__header__navigation__button"
              onClick={goToNextMonth}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            className="work-schedule-calendar__header__today"
            onClick={goToToday}
          >
            Hôm nay
          </button>
        </div>

        <div className="work-schedule-calendar__content">
          <div className="work-schedule-calendar__month">
            <div className="work-schedule-calendar__month__header">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                <div key={day} className="work-schedule-calendar__month__header__day">
                  {day}
                </div>
              ))}
            </div>
            <div className="work-schedule-calendar__month__body">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                const isToday = day.toDateString() === today.toDateString()
                const dayEvents = getAppointmentsForDay(day)

                return (
                  <DayCell
                    key={index}
                    day={day}
                    isCurrentMonth={isCurrentMonth}
                    isToday={isToday}
                    events={dayEvents}
                    onDayClick={handleDayClick}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <DayDetailModal
        isOpen={showDayDetail}
        onClose={handleCloseDayDetail}
        selectedDate={selectedDay}
        appointments={selectedDay ? getAppointmentsForDay(new Date(selectedDay)) : []}
        onAppointmentClick={onAppointmentClick}
        onNavigateToVehicleDetails={onNavigateToVehicleDetails}
      />
    </>
  )
}
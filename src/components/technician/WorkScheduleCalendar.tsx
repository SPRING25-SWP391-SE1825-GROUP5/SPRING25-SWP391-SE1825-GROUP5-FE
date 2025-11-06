import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { TechnicianTimeSlotService, type TechnicianTimeSlotData } from '@/services/technicianTimeSlotService'
import { TechnicianService } from '@/services/technicianService'
import { format } from 'date-fns'
import { type TimeSlot } from '@/types/technician'
import './WorkScheduleCalendar.scss'
import DayDetailModal from './DayDetailModal'
import DayCell from './DayCell'

interface WorkScheduleCalendarProps {
  viewMode: 'month'
  currentDate: Date
  onDateChange: (date: Date) => void
  appointments: TimeSlot[]
  onAppointmentClick: (appointment: TimeSlot) => void
}

export default function WorkScheduleCalendar({
  viewMode,
  currentDate,
  onDateChange,
  appointments,
  onAppointmentClick
}: WorkScheduleCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)
  const [workDays, setWorkDays] = useState<Set<string>>(new Set())
  const [timeSlots, setTimeSlots] = useState<TechnicianTimeSlotData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user data from Redux
  const user = useAppSelector((state) => state.auth.user)
  const [technicianId, setTechnicianId] = useState<number | null>(null)
  const [centerId, setCenterId] = useState<number | null>(null)

  // Load work schedule from API
  const loadWorkSchedule = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Check if user is available
      if (!user?.id) {
        setError('Vui lòng đăng nhập để xem lịch làm việc')
        setWorkDays(new Set())
        return
      }

      // Step 1: Resolve technicianId from userId

      const technicianInfo = await TechnicianService.getTechnicianIdByUserId(user.id)

      const technicianId = technicianInfo.data?.technicianId
      const centerId = technicianInfo.data?.centerId

      // Update state with resolved IDs
      setTechnicianId(technicianId)
      setCenterId(centerId)
      
      // Step 2: Get work schedule using the resolved technicianId and centerId

      const scheduleResponse = await TechnicianTimeSlotService.getTechnicianScheduleByCenter(technicianId, centerId)

      if (scheduleResponse.success && scheduleResponse.data && scheduleResponse.data.length > 0) {
        // Process work dates and create a Set of unique work days
        const workDaysSet = new Set<string>()
        
        scheduleResponse.data.forEach((slot: TechnicianTimeSlotData) => {
          // Normalize workDate to get only the date part (YYYY-MM-DD)
          const workDate = new Date(slot.workDate)
          const normalizedDate = format(workDate, 'yyyy-MM-dd')
          workDaysSet.add(normalizedDate)
        })

        )
        setWorkDays(workDaysSet)
        setTimeSlots(scheduleResponse.data)
      } else {

        setWorkDays(new Set())
      }
    } catch (error: any) {

      setError(error.message || 'Không thể tải lịch làm việc')
      setWorkDays(new Set())
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Load work schedule when component mounts or when month changes
  useEffect(() => {
    // Only load if user is available
    if (user?.id) {
      loadWorkSchedule()
    }
  }, [loadWorkSchedule, currentDate.getMonth(), currentDate.getFullYear(), user?.id])

  // Check if a day has work schedule
  const hasWork = (date: Date): boolean => {
    const dateString = format(date, 'yyyy-MM-dd')
    return workDays.has(dateString)
  }

  // Get time slots for a specific day
  const getTimeSlotsForDay = (date: Date): TimeSlot[] => {
    const dateString = format(date, 'yyyy-MM-dd')
    return timeSlots.filter(slot => {
      const slotDate = format(new Date(slot.workDate), 'yyyy-MM-dd')
      return slotDate === dateString
    })
  }


  // Handle day click
  const handleDayClick = (date: Date) => {
    // Format date as YYYY-MM-DD without timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
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
              disabled={loading}
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="work-schedule-calendar__header__navigation__title">
              {getMonthYearString()}
              {loading && <span className="text-sm text-gray-500 ml-2">(Đang tải...)</span>}
            </h2>
            <button
              className="work-schedule-calendar__header__navigation__button"
              onClick={goToNextMonth}
              disabled={loading}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            className="work-schedule-calendar__header__today"
            onClick={goToToday}
            disabled={loading}
          >
            Hôm nay
          </button>
        </div>


         {/* Loading State */}
         {(loading || !user?.id) && (
           <div className="work-schedule-calendar__loading">
             <p className="text-center text-gray-500">
               {!user?.id ? 'Đang tải thông tin người dùng...' : 'Đang tải dữ liệu lịch làm việc...'}
             </p>
           </div>
         )}

         {/* Error Message */}
         {error && (
           <div className="work-schedule-calendar__error">
             <p className="text-red-600 text-sm">⚠️ {error}</p>
           </div>
         )}

        {/* Calendar - only show when not loading, no error, and user is available */}
        {!loading && !error && user?.id && (
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
                       const hasWorkSchedule = hasWork(day)

                       return (
                         <DayCell
                           key={index}
                           day={day}
                           isCurrentMonth={isCurrentMonth}
                           isToday={isToday}
                           events={[]}
                           hasWork={hasWorkSchedule}
                           onDayClick={handleDayClick}
                         />
                       )
              })}
            </div>
          </div>
        </div>
        )}
      </div>

             <DayDetailModal
               isOpen={showDayDetail}
               onClose={handleCloseDayDetail}
               selectedDate={selectedDay}
               timeSlots={selectedDay ? getTimeSlotsForDay(new Date(selectedDay)) : []}
             />
    </>
  )
}
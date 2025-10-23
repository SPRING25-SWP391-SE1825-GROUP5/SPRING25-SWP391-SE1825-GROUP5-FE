import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { TechnicianTimeSlotService, type TechnicianTimeSlotData } from '@/services/technicianTimeSlotService'
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
      // Step 1: Get technician details first to get the correct centerId
      const tempTechnicianId = 4 // Default technician ID for testing
      
      console.log('🔍 Getting technician details for ID:', tempTechnicianId)
      
      const technicianResponse = await TechnicianTimeSlotService.getTechnicianById(tempTechnicianId)
      
      console.log('👤 Technician details response:', technicianResponse)

      if (technicianResponse.success && technicianResponse.data) {
        const technicianData = technicianResponse.data
        const actualTechnicianId = technicianData.technicianId || tempTechnicianId
        const actualCenterId = technicianData.centerId
        
        console.log('📋 Using technician and center IDs from technician API:', { 
          technicianId: actualTechnicianId,
          centerId: actualCenterId,
          technicianName: technicianData.userFullName
        })
        
        // Update state with actual IDs from technician API
        setTechnicianId(actualTechnicianId)
        setCenterId(actualCenterId)
        
        // Step 3: Get work schedule using the correct technicianId and centerId
        console.log('🔍 Getting work schedule with correct IDs:', { 
          technicianId: actualTechnicianId,
          centerId: actualCenterId
        })
        
        const scheduleResponse = await TechnicianTimeSlotService.getTechnicianScheduleByCenter(actualTechnicianId, actualCenterId)
        
        console.log('📡 Work schedule response:', scheduleResponse)

        if (scheduleResponse.success && scheduleResponse.data && scheduleResponse.data.length > 0) {
          // Process work dates and create a Set of unique work days
          const workDaysSet = new Set<string>()
          
          scheduleResponse.data.forEach((slot: TechnicianTimeSlotData) => {
            // Normalize workDate to get only the date part (YYYY-MM-DD)
            const workDate = new Date(slot.workDate)
            const normalizedDate = format(workDate, 'yyyy-MM-dd')
            workDaysSet.add(normalizedDate)
          })

          console.log('✅ Work days loaded:', Array.from(workDaysSet))
          setWorkDays(workDaysSet)
          setTimeSlots(scheduleResponse.data)
        } else {
          console.log('⚠️ No work schedule data found for this technician and center')
          setError('Không tìm thấy lịch làm việc cho technician này')
          setWorkDays(new Set())
        }
      } else {
        console.log('⚠️ No technician data found')
        setError('Không tìm thấy thông tin technician')
        setWorkDays(new Set())
      }
    } catch (error: any) {
      console.error('❌ Error loading work schedule:', error)
      setError(error.message || 'Không thể tải lịch làm việc')
      setWorkDays(new Set())
    } finally {
      setLoading(false)
    }
  }, [])

  // Load work schedule when component mounts or when month changes
  useEffect(() => {
    loadWorkSchedule()
  }, [loadWorkSchedule, currentDate.getMonth(), currentDate.getFullYear()])

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


         {/* Error Message */}
         {error && (
           <div className="work-schedule-calendar__error">
             <p className="text-red-600 text-sm">⚠️ {error}</p>
             <button 
               onClick={loadWorkSchedule}
               className="text-blue-600 text-sm underline ml-2"
             >
               Thử lại
             </button>
           </div>
         )}

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
      </div>

             <DayDetailModal
               isOpen={showDayDetail}
               onClose={handleCloseDayDetail}
               selectedDate={selectedDay}
               timeSlots={selectedDay ? getTimeSlotsForDay(new Date(selectedDay)) : []}
               onNavigateToVehicleDetails={onNavigateToVehicleDetails}
             />
    </>
  )
}
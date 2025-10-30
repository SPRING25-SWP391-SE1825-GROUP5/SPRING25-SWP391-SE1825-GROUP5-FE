import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Settings, Filter, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { TechnicianTimeSlotService, type TechnicianTimeSlotData } from '@/services/technicianTimeSlotService'
import { TechnicianService } from '@/services/technicianService'
import { format, addDays, subDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import './WorkScheduleCalendarNew.scss'

interface Booking {
  bookingId: number
  customerName: string
  serviceName: string
  startTime: string
  endTime: string
  status: 'completed' | 'cancelled' | 'waiting' | 'scheduled'
  date: string
}

interface WorkScheduleCalendarNewProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export default function WorkScheduleCalendarNew({
  currentDate,
  onDateChange
}: WorkScheduleCalendarNewProps) {
  const [workDays, setWorkDays] = useState<Set<string>>(new Set())
  const [timeSlots, setTimeSlots] = useState<TechnicianTimeSlotData[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(currentDate)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [bookingDetail, setBookingDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const user = useAppSelector((state) => state.auth.user)
  const [technicianId, setTechnicianId] = useState<number | null>(null)
  const [centerId, setCenterId] = useState<number | null>(null)

  // Fetch booking detail
  const fetchBookingDetail = async (bookingId: number) => {
    if (!technicianId) return
    
    setLoadingDetail(true)
    try {
      const response = await TechnicianService.getBookingDetail(technicianId, bookingId)
      setBookingDetail(response)
    } catch (error: any) {
      setError(error.message || 'Không thể tải thông tin chi tiết')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Handle appointment click
  const handleAppointmentClick = (appointment: Booking) => {
    setSelectedBooking(appointment)
    setShowModal(true)
    fetchBookingDetail(appointment.bookingId)
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedBooking(null)
    setBookingDetail(null)
  }

  const loadWorkSchedule = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!user?.id) {
        setError('Vui lòng đăng nhập để xem lịch làm việc')
        setWorkDays(new Set())
        return
      }

      const technicianInfo = await TechnicianService.getTechnicianIdByUserId(user.id)
      const technicianId = technicianInfo.data?.technicianId
      const centerId = technicianInfo.data?.centerId
      
      setTechnicianId(technicianId)
      setCenterId(centerId)
      
      // Load work schedule
      const scheduleResponse = await TechnicianTimeSlotService.getTechnicianScheduleByCenter(technicianId, centerId)
      
      if (scheduleResponse.success && scheduleResponse.data && scheduleResponse.data.length > 0) {
        const workDaysSet = new Set<string>()
        
        scheduleResponse.data.forEach((slot: TechnicianTimeSlotData) => {
          const workDate = new Date(slot.workDate)
          const normalizedDate = format(workDate, 'yyyy-MM-dd')
          workDaysSet.add(normalizedDate)
        })

        setWorkDays(workDaysSet)
        setTimeSlots(scheduleResponse.data)
      } else {
        setWorkDays(new Set())
      }

      // Load bookings
      const bookingsResponse = await TechnicianService.getTechnicianBookings(technicianId)
      
      if (bookingsResponse.success && bookingsResponse.data) {
        // Check if data is array or has nested array
        const bookingsArray = Array.isArray(bookingsResponse.data) 
          ? bookingsResponse.data 
          : bookingsResponse.data.bookings || bookingsResponse.data.data || []
        
        
        const bookingsData = bookingsArray.map((booking: any) => {
          // Use slotLabel directly if available, otherwise parse slotTime
          let startTime = '08:00'
          let endTime = '09:00'
          
          if (booking.slotLabel) {
            // Use slotLabel directly (e.g., "08:00-08:30" -> "08:00" and "08:30")
            const [start, end] = booking.slotLabel.split('-')
            startTime = start.trim()
            endTime = end.trim()
          } else if (booking.slotTime) {
            // Fallback: Convert "10:30 SA" to "10:30" or "3:00 CH" to "15:00"
            const timeStr = booking.slotTime.replace(/ SA| CH/g, '')
            const [hour, minute] = timeStr.split(':')
            const isPM = booking.slotTime.includes('CH')
            const hour24 = isPM ? (parseInt(hour) + 12) : parseInt(hour)
            startTime = `${String(hour24).padStart(2, '0')}:${minute}`
            
            // Calculate end time (add 1 hour)
            const endHour = hour24 + 1
            endTime = `${String(endHour).padStart(2, '0')}:${minute}`
          }

          // Map status
          let status = 'scheduled'
          if (booking.status === 'CONFIRMED') status = 'scheduled'
          else if (booking.status === 'CANCELLED') status = 'cancelled'
          else if (booking.status === 'PAID') status = 'completed'
          else if (booking.status === 'IN_PROGRESS') status = 'waiting'

          return {
            bookingId: booking.bookingId,
            customerName: booking.customerName || 'Khách hàng',
            serviceName: booking.serviceName || 'Dịch vụ',
            startTime: startTime,
            endTime: endTime,
            status: status,
            date: booking.date || format(selectedDate, 'yyyy-MM-dd') // Use API date or fallback to selected date
          }
        })
        
        setBookings(bookingsData)
      } else {
        setBookings([])
      }
    } catch (error: any) {
      setError(error.message || 'Không thể tải lịch làm việc')
      setWorkDays(new Set())
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadWorkSchedule()
    }
  }, [loadWorkSchedule, currentDate.getMonth(), currentDate.getFullYear(), user?.id])

  // Get current week range (Monday to Friday only)
  const getWeekRange = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start, end: addDays(start, 4) }) // Only 5 days (Mon-Fri)
    return weekDays
  }

  const weekDays = getWeekRange()

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date): Booking[] => {
    const dateString = format(date, 'yyyy-MM-dd')
    const dayBookings = bookings.filter(booking => booking.date === dateString)
    return dayBookings
  }

  // Get status color and icon
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          borderColor: '#4CAF50',
          bgColor: '#E8F5E8',
          textColor: '#2E7D32',
          icon: CheckCircle,
          label: 'Hoàn thành'
        }
      case 'cancelled':
        return {
          borderColor: '#F44336',
          bgColor: '#FFEBEE',
          textColor: '#C62828',
          icon: XCircle,
          label: 'Đã hủy'
        }
      case 'waiting':
        return {
          borderColor: '#FF9800',
          bgColor: '#FFF3E0',
          textColor: '#E65100',
          icon: User,
          label: 'Đang chờ'
        }
      case 'scheduled':
      default:
        return {
          borderColor: '#2196F3',
          bgColor: '#E3F2FD',
          textColor: '#1565C0',
          icon: Clock,
          label: 'Đã lên lịch'
        }
    }
  }

  // Navigation
  const goToPreviousWeek = () => {
    setSelectedDate(subDays(selectedDate, 7))
  }

  const goToNextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7))
  }

  const goToToday = () => {
    const today = new Date()
    setSelectedDate(today)
  }

  const today = new Date()
  const currentTime = format(new Date(), 'HH:mm')
  const currentDateString = format(today, 'yyyy-MM-dd')

  return (
    <div className="work-schedule-calendar-new">
      {/* Compact Header */}
      <div className="work-schedule-calendar-new__header">
        <div className="work-schedule-calendar-new__view-toggle">
          <button className="work-schedule-calendar-new__view-btn active">
            Lịch
          </button>
        </div>

        <div className="work-schedule-calendar-new__date-nav">
          <button 
            className="work-schedule-calendar-new__nav-btn"
            onClick={goToPreviousWeek}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="work-schedule-calendar-new__current-date">
            {format(selectedDate, 'dd/MM/yyyy')}
          </span>
          <button 
            className="work-schedule-calendar-new__nav-btn"
            onClick={goToNextWeek}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="work-schedule-calendar-new__actions">
          <button className="work-schedule-calendar-new__action-btn">
            <Filter size={16} />
          </button>
          <button className="work-schedule-calendar-new__action-btn">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="work-schedule-calendar-new__loading">
          Đang tải dữ liệu lịch làm việc...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="work-schedule-calendar-new__error">
          {error}
        </div>
      )}

      {/* Calendar Content */}
      {!loading && !error && (
        <div className="work-schedule-calendar-new__content">
          {/* Time Column */}
          <div className="work-schedule-calendar-new__time-col">
            <div className="work-schedule-calendar-new__timezone">GMT +7</div>
            {Array.from({ length: 19 }, (_, i) => {
              const hour = Math.floor(i / 2) + 8
              const minute = (i % 2) * 30
              return (
                <div key={i} className="work-schedule-calendar-new__time-slot">
                  {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                </div>
              )
            })}
          </div>

          {/* Days Grid */}
          <div className="work-schedule-calendar-new__days-grid">
            {/* Current Time Indicator */}
            {isSameDay(selectedDate, today) && (() => {
              const now = new Date()
              const currentHour = now.getHours()
              const currentMinute = now.getMinutes()
              
              // Calculate position: start from 8 AM, each slot is 8rem (128px)
              const slotHeight = 128 // 8rem in pixels
              const timezoneHeight = 64 // 4rem in pixels (timezone header height)
              
              // Calculate which slot we're in (0-based from 8 AM)
              const slotIndex = (currentHour - 8) * 2 + Math.floor(currentMinute / 30)
              
              // Calculate exact position within the slot
              const minutesInSlot = currentMinute % 30
              const positionInSlot = (minutesInSlot / 30) * slotHeight
              
              // Total position = timezone height + (slot index * slot height) + position within slot
              const totalPosition = timezoneHeight + (slotIndex * slotHeight) + positionInSlot
              
              
              return (
                <div 
                  className="work-schedule-calendar-new__current-time-line"
                  style={{ 
                    top: `${totalPosition}px` 
                  }}
                  data-time={currentTime}
                />
              )
            })()}
            {/* Day Headers */}
            <div className="work-schedule-calendar-new__days-header">
              {weekDays.map((day, index) => {
                const dayFormat = format(day, 'EEE d')
                const isCurrentDay = isSameDay(day, today)
                const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6']
                return (
                  <div 
                    key={index}
                    className={`work-schedule-calendar-new__day-header ${isCurrentDay ? 'active' : ''}`}
                    style={{
                      animationDelay: `${index * 0.2}s`
                    }}
                  >
                    {dayNames[index]}
                    <span className="work-schedule-calendar-new__day-number">
                      {dayFormat.split(' ')[1]}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Day Columns with Time Slots */}
            <div className="work-schedule-calendar-new__days-body">
              {weekDays.map((day, dayIndex) => {
                const dayAppointments = getAppointmentsForDay(day)
                const isCurrentDay = isSameDay(day, today)
                
                return (
                  <div 
                    key={dayIndex} 
                    className="work-schedule-calendar-new__day-column"
                    style={{
                      animationDelay: `${dayIndex * 0.2}s`
                    }}
                  >
                    {Array.from({ length: 19 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 8
                      const minute = (i % 2) * 30
                      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                      
                      const slotAppointments = dayAppointments.filter(app => {
                        const appStartTime = app.startTime
                        const matches = appStartTime === timeString
                        if (matches) {
                        }
                        return matches
                      })
                      
                      return (
                        <div key={i} className="work-schedule-calendar-new__hour-slot">
                          {slotAppointments.map((appointment, index) => {
                            const statusStyle = getStatusStyle(appointment.status)
                            const StatusIcon = statusStyle.icon
                            
                            return (
                              <div 
                                key={index}
                                className="work-schedule-calendar-new__appointment"
                                style={{
                                  borderLeftColor: statusStyle.borderColor,
                                  backgroundColor: statusStyle.bgColor,
                                  animationDelay: `${dayIndex * 0.2 + index * 0.1}s`
                                }}
                                onClick={() => handleAppointmentClick(appointment)}
                              >
                                <div className="work-schedule-calendar-new__appointment-content">
                                  <div className="work-schedule-calendar-new__appointment-time">
                                    {appointment.startTime} - {appointment.endTime}
                                  </div>
                                  <div className="work-schedule-calendar-new__appointment-customer">
                                    {appointment.customerName}
                                  </div>
                                  <div className="work-schedule-calendar-new__appointment-service">
                                    {appointment.serviceName}
                                  </div>
                                  <div 
                                    className="work-schedule-calendar-new__appointment-status"
                                    style={{
                                      backgroundColor: statusStyle.bgColor,
                                      color: statusStyle.textColor
                                    }}
                                  >
                                    <StatusIcon size={14} />
                                    {statusStyle.label}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {showModal && (
        <div className="work-schedule-calendar-new__modal-overlay" onClick={closeModal}>
          <div className="work-schedule-calendar-new__modal" onClick={(e) => e.stopPropagation()}>
            <div className="work-schedule-calendar-new__modal-header">
              <h3>Thông tin chi tiết booking</h3>
              <button 
                className="work-schedule-calendar-new__modal-close"
                onClick={closeModal}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="work-schedule-calendar-new__modal-content">
              {loadingDetail ? (
                <div className="work-schedule-calendar-new__modal-loading">
                  Đang tải thông tin...
                </div>
              ) : bookingDetail ? (
                <div className="work-schedule-calendar-new__modal-detail">
                  <div className="work-schedule-calendar-new__detail-section">
                    <h4>Thông tin cơ bản</h4>
                    <div className="work-schedule-calendar-new__detail-grid">
                      <div className="work-schedule-calendar-new__detail-item">
                        <label>Booking ID:</label>
                        <span>{bookingDetail.bookingId || selectedBooking?.bookingId}</span>
                      </div>
                      <div className="work-schedule-calendar-new__detail-item">
                        <label>Khách hàng:</label>
                        <span>{bookingDetail.customerName || selectedBooking?.customerName}</span>
                      </div>
                      <div className="work-schedule-calendar-new__detail-item">
                        <label>Dịch vụ:</label>
                        <span>{bookingDetail.serviceName || selectedBooking?.serviceName}</span>
                      </div>
                      <div className="work-schedule-calendar-new__detail-item">
                        <label>Thời gian:</label>
                        <span>{selectedBooking?.startTime} - {selectedBooking?.endTime}</span>
                      </div>
                      <div className="work-schedule-calendar-new__detail-item">
                        <label>Trạng thái:</label>
                        <span className={`work-schedule-calendar-new__status-${selectedBooking?.status}`}>
                          {selectedBooking?.status === 'completed' && 'Hoàn thành'}
                          {selectedBooking?.status === 'cancelled' && 'Đã hủy'}
                          {selectedBooking?.status === 'waiting' && 'Đang chờ'}
                          {selectedBooking?.status === 'scheduled' && 'Đã xác nhận'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {bookingDetail.vehiclePlate && (
                    <div className="work-schedule-calendar-new__detail-section">
                      <h4>Thông tin xe</h4>
                      <div className="work-schedule-calendar-new__detail-grid">
                        <div className="work-schedule-calendar-new__detail-item">
                          <label>Biển số:</label>
                          <span>{bookingDetail.vehiclePlate}</span>
                        </div>
                        {bookingDetail.vehicleModel && (
                          <div className="work-schedule-calendar-new__detail-item">
                            <label>Mẫu xe:</label>
                            <span>{bookingDetail.vehicleModel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {bookingDetail.customerPhone && (
                    <div className="work-schedule-calendar-new__detail-section">
                      <h4>Liên hệ</h4>
                      <div className="work-schedule-calendar-new__detail-grid">
                        <div className="work-schedule-calendar-new__detail-item">
                          <label>Số điện thoại:</label>
                          <span>{bookingDetail.customerPhone}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="work-schedule-calendar-new__modal-error">
                  Không thể tải thông tin chi tiết
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


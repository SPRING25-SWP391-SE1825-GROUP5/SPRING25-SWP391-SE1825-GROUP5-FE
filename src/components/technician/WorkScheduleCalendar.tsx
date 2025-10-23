import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Eye } from 'lucide-react'
import { technicianTimeSlotService, type TechnicianSlot, type ScheduleResponse } from '@/services/technicianTimeSlotService'
import { useAppSelector } from '@/store/hooks'
import './WorkScheduleCalendar.scss'

interface WorkScheduleCalendarProps {
  technicianId: number
  centerId: number
}

export default function WorkScheduleCalendar({ technicianId, centerId }: WorkScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<TechnicianSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<TechnicianSlot[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [workingTechnicianId, setWorkingTechnicianId] = useState<number | null>(null)
  const [workingTechnicianName, setWorkingTechnicianName] = useState<string | null>(null)
  const [workingCenterId, setWorkingCenterId] = useState<number | null>(null)

  const user = useAppSelector((state) => state.auth.user)

  // Kiểm tra user có phải technician không (case-insensitive)
  const isTechnician = user?.role?.toLowerCase() === 'technician'

  // Test API endpoint trực tiếp
  const testApiEndpoint = async () => {
    try {
      console.log('=== TESTING API ENDPOINT ===')
      const testUrl = `/TechnicianTimeSlot/technician/${technicianId}/center/${centerId}`
      console.log('Test URL:', testUrl)
      
      // Thử gọi API trực tiếp để xem response
      const response = await fetch(`/api${testUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      console.log('Direct API Response:', data)
      console.log('Response Status:', response.status)
      console.log('============================')
      
      return data
    } catch (error) {
      console.error('Direct API Test Error:', error)
      return null
    }
  }

  // Thử nhiều center ID và technician ID khác nhau
  const tryDifferentCenters = async (technicianId: number, year: number, month: number) => {
    const centerIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Thử nhiều center ID
    
    // KIỂM TRA LOCALSTORAGE TRƯỚC - NẾU CÓ THÌ SỬ DỤNG NGAY
    const savedTechnicianId = localStorage.getItem('workingTechnicianId')
    const savedCenterId = localStorage.getItem('workingCenterId')
    
    if (savedTechnicianId && savedCenterId) {
      console.log('🎯 USING SAVED TECHNICIAN ID:', savedTechnicianId)
      try {
        const response = await technicianTimeSlotService.getTechnicianScheduleByMonth(
          parseInt(savedTechnicianId),
          parseInt(savedCenterId),
          year,
          month
        )
        
        if (response.success && response.data && response.data.length > 0) {
          console.log('✅ SUCCESS with saved technician ID:', savedTechnicianId)
          return { response, centerId: parseInt(savedCenterId), technicianId: parseInt(savedTechnicianId) }
        }
      } catch (error) {
        console.log('❌ Saved technician ID failed, searching for new one...')
      }
    }
    
    // NẾU KHÔNG CÓ SAVED ID HOẶC FAIL - TÌM KIẾM TỪ ĐẦU
    console.log('🔍 SEARCHING FOR CORRECT TECHNICIAN ID...')
    
    // Thử các technician ID có thể: KHÔNG BAO GIỜ SỬ DỤNG USER ID
    const technicianIds = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30
    ]
    
    console.log('=== TRYING DIFFERENT COMBINATIONS ===')
    console.log('Center IDs to try:', centerIds)
    console.log('Technician IDs to try:', technicianIds)
    
    for (const centerId of centerIds) {
      for (const techId of technicianIds) {
        try {
          console.log(`Trying centerId: ${centerId}, technicianId: ${techId}`)
          const response = await technicianTimeSlotService.getTechnicianScheduleByMonth(
            techId,
            centerId,
            year,
            month
          )
          
          if (response.success && response.data && response.data.length > 0) {
            console.log(`✅ FOUND DATA! centerId: ${centerId}, technicianId: ${techId}`)
            console.log('Response data:', response.data)
            
            // BẮT BUỘC LẤY TECHNICIAN ID THỰC TẾ TỪ RESPONSE
            const actualTechnicianId = response.data[0]?.technicianId
            const actualTechnicianName = response.data[0]?.technicianName
            
            console.log('🎯 ACTUAL TECHNICIAN ID FROM API:', actualTechnicianId)
            console.log('🎯 ACTUAL TECHNICIAN NAME FROM API:', actualTechnicianName)
            console.log('🎯 USING ACTUAL TECHNICIAN ID INSTEAD OF:', techId)
            console.log('🎯 USING CENTER ID:', centerId, '(from search)')
            
            // Lưu technician ID ĐÚNG vào localStorage
            localStorage.setItem('workingTechnicianId', actualTechnicianId.toString())
            localStorage.setItem('workingCenterId', centerId.toString())
            localStorage.setItem('workingTechnicianName', actualTechnicianName)
            
            console.log('💾 SAVED CORRECT TECHNICIAN ID:', actualTechnicianId)
            console.log('💾 SAVED CORRECT CENTER ID:', centerId)
            console.log('💾 SAVED TECHNICIAN NAME:', actualTechnicianName)
            
            return { response, centerId, technicianId: actualTechnicianId }
          } else {
            console.log(`❌ No data for centerId: ${centerId}, technicianId: ${techId}`)
          }
        } catch (error: any) {
          console.log(`❌ Error for centerId: ${centerId}, technicianId: ${techId}:`, error.message)
          continue
        }
      }
    }
    
    throw new Error('Không tìm thấy technician trong bất kỳ center nào')
  }

  // Lấy dữ liệu lịch làm việc
  const fetchSchedules = async () => {
    // Validate parameters
    if (!technicianId || !centerId) {
      console.error('Missing required parameters:', { technicianId, centerId })
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      console.log('=== WORK SCHEDULE CALENDAR DEBUG ===')
      console.log('User object:', user)
      console.log('User ID:', user?.id)
      console.log('User role:', user?.role)
      console.log('User role (lowercase):', user?.role?.toLowerCase())
      console.log('Is technician:', isTechnician)
      console.log('Technician ID from props:', technicianId)
      console.log('Center ID from props:', centerId)
      console.log('API Parameters:', { technicianId, centerId, year, month })
      console.log('Current date:', currentDate)
      console.log('=====================================')
      
      // Kiểm tra user có phải technician không
      if (!isTechnician) {
        setError('Bạn không có quyền truy cập lịch làm việc của technician')
        return
      }

      // Test API endpoint trực tiếp
      await testApiEndpoint()
      
      // Thử tìm technician ID và center ID đúng
      console.log('=== STARTING SEARCH FOR CORRECT PARAMETERS ===')
      const result = await tryDifferentCenters(technicianId, year, month)
      const response = result.response
      const workingCenterId = result.centerId
      const workingTechnicianId = result.technicianId
      
      console.log('=== FINAL WORKING PARAMETERS ===')
      console.log('Working technicianId:', workingTechnicianId)
      console.log('Working centerId:', workingCenterId)
      console.log('================================')
      
      // Lưu working technician ID vào state
      setWorkingTechnicianId(workingTechnicianId)
      setWorkingTechnicianName(localStorage.getItem('workingTechnicianName'))
      setWorkingCenterId(workingCenterId)
      
      console.log('WorkScheduleCalendar - Final response:', response)
      console.log('WorkScheduleCalendar - Working centerId:', workingCenterId)
      
      if (response.success && response.data) {
        setSchedules(response.data)
        console.log('WorkScheduleCalendar - Schedules set:', response.data)
      } else {
        console.log('WorkScheduleCalendar - No data or success false:', response)
        setSchedules([])
      }
    } catch (error: any) {
      console.error('WorkScheduleCalendar - Error fetching schedules:', error)
      
      // Set user-friendly error message
      if (error.message.includes('Không tìm thấy technician')) {
        setError('Không tìm thấy technician trong center này. Vui lòng liên hệ admin để được assign vào center.')
      } else if (error.message.includes('Không tìm thấy technician trong bất kỳ center nào')) {
        setError('Không tìm thấy technician trong bất kỳ center nào. Vui lòng liên hệ admin.')
      } else {
        setError('Không thể tải lịch làm việc: ' + error.message)
      }
      
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  // BẮT BUỘC TÌM TECHNICIAN ID ĐÚNG
  const forceFindCorrectTechnicianId = async () => {
    console.log('🔍 FORCING SEARCH FOR CORRECT TECHNICIAN ID...')
    
    // Clear localStorage để force search
    localStorage.removeItem('workingTechnicianId')
    localStorage.removeItem('workingCenterId')
    
    // Tìm kiếm từ đầu
    const result = await tryDifferentCenters(technicianId, currentDate.getFullYear(), currentDate.getMonth() + 1)
    
    if (result) {
      console.log('✅ FOUND CORRECT TECHNICIAN ID:', result.technicianId)
      setSchedules(result.response.data)
    } else {
      console.log('❌ COULD NOT FIND CORRECT TECHNICIAN ID')
    }
  }

  // Clear saved parameters và search lại
  const clearSavedParametersAndSearch = () => {
    console.log('🧹 Clearing saved parameters and searching again...')
    localStorage.removeItem('workingTechnicianId')
    localStorage.removeItem('workingCenterId')
    fetchSchedules()
  }

  // Fetch schedules với technician ID đúng
  const fetchSchedulesWithCorrectId = async () => {
    const savedTechnicianId = localStorage.getItem('workingTechnicianId')
    const savedCenterId = localStorage.getItem('workingCenterId')
    
    console.log('=== CHECKING SAVED PARAMETERS ===')
    console.log('Saved technicianId:', savedTechnicianId)
    console.log('Saved centerId:', savedCenterId)
    
    if (!savedTechnicianId || !savedCenterId) {
      console.log('❌ No saved technician/center ID, searching for correct parameters')
      return fetchSchedules()
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const techId = parseInt(savedTechnicianId)
      const centerId = parseInt(savedCenterId)
      
      console.log('=== FETCHING WITH SAVED PARAMETERS ===')
      console.log('🎯 USING CORRECT TECHNICIAN ID:', techId, '(NOT user ID:', user?.id, ')')
      console.log('Using centerId:', centerId)
      console.log('Year:', year, 'Month:', month)
      
      const response = await technicianTimeSlotService.getTechnicianScheduleByMonth(
        techId,
        centerId,
        year,
        month
      )
      
      console.log('Response with saved parameters:', response)
      
      if (response.success && response.data) {
        setSchedules(response.data)
        console.log('✅ SUCCESS: Schedules updated with CORRECT technician ID:', techId)
      } else {
        console.log('❌ No data with saved parameters, falling back to search')
        return fetchSchedules()
      }
    } catch (error: any) {
      console.error('❌ Error with saved parameters:', error)
      console.log('Falling back to search for correct parameters')
      return fetchSchedules()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // BẮT BUỘC TÌM TECHNICIAN ID ĐÚNG MỖI LẦN
    console.log('🔄 Component mounted, FORCING search for correct technician ID...')
    
    // KHÔNG CLEAR LOCALSTORAGE - SỬ DỤNG NẾU CÓ, TÌM MỚI NẾU KHÔNG
    fetchSchedulesWithCorrectId()
  }, [technicianId, centerId, currentDate])

  // Tạo lịch tháng
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    // Debug: Log thông tin về ngày 1/11/2025
    const nov1Index = days.findIndex(day => 
      day.getDate() === 1 && day.getMonth() === 10 && day.getFullYear() === 2025
    )
    if (nov1Index !== -1) {
      console.log('🐛 DEBUG Calendar generation:', {
        nov1Index: nov1Index,
        nov1Date: days[nov1Index].toDateString(),
        nov1Month: days[nov1Index].getMonth(),
        currentMonth: month,
        currentDate: currentDate.toDateString()
      })
    }
    
    return days
  }, [currentDate])

  // Kiểm tra ngày có lịch làm việc
  const hasScheduleOnDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const hasSchedule = schedules.some(slot => slot.workDate.split('T')[0] === dateStr)
    console.log(`Checking date ${dateStr}:`, hasSchedule, 'Schedules count:', schedules.length)
    return hasSchedule
  }

  // Lấy lịch làm việc của ngày được chọn
  const getScheduleForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return schedules.filter(slot => slot.workDate.split('T')[0] === dateStr)
  }

  // Xử lý click vào ngày
  const handleDateClick = async (date: Date) => {
    // Chỉ cho phép click vào các ô thuộc tháng hiện tại
    const isCurrentMonth = date.getMonth() === currentDate.getMonth()
    if (!isCurrentMonth) {
      return // Không làm gì nếu không phải tháng hiện tại
    }
    
    setSelectedDate(date) // Always set selected date
    
    if (hasScheduleOnDate(date)) {
      const daySchedules = getScheduleForDate(date)
      setSelectedSchedule(daySchedules)
      setShowDetailModal(true)
    }
  }

  // Chuyển tháng
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  // Format thời gian
  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Lấy tên tháng
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  }

  // Debug schedules state
  console.log('=== CALENDAR RENDER DEBUG ===')
  console.log('Schedules state:', schedules)
  console.log('Schedules length:', schedules.length)
  console.log('Loading:', loading)
  console.log('Error:', error)
  console.log('=============================')

  // Hiển thị loading state
  if (loading) {
    return (
      <div className="work-schedule-calendar">
        <div className="work-schedule-calendar__loading">
          <div className="work-schedule-calendar__spinner"></div>
          <span>Đang tải lịch làm việc...</span>
        </div>
      </div>
    )
  }

  // Hiển thị error state
  if (error) {
    return (
      <div className="work-schedule-calendar">
        <div className="work-schedule-calendar__error">
          <div className="work-schedule-calendar__error__icon">⚠️</div>
          <h3>Không thể tải lịch làm việc</h3>
          <p>{error}</p>
          <button 
            className="work-schedule-calendar__error__retry"
            onClick={fetchSchedules}
          >
            Thử lại
          </button>
          <button 
            className="work-schedule-calendar__error__clear"
            onClick={forceFindCorrectTechnicianId}
            style={{ marginLeft: '10px', background: '#dc3545' }}
          >
            Tìm lại technician ID
          </button>
        </div>
      </div>
    )
  }

  return (
      <div className="work-schedule-calendar">
      {/* Header */}
        <div className="work-schedule-calendar__header">
        <div className="work-schedule-calendar__title-section">
          <h2 className="work-schedule-calendar__title">
            <Calendar size={24} />
            Lịch làm việc
          </h2>
          {workingTechnicianName && (
            <div className="work-schedule-calendar__info">
              <div className="work-schedule-calendar__info-item">
                <strong>Technician:</strong> {workingTechnicianName} (ID: {workingTechnicianId})
              </div>
              {workingCenterId && (
                <div className="work-schedule-calendar__info-item">
                  <strong>Center:</strong> #{workingCenterId}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="work-schedule-calendar__navigation">
            <button
            onClick={() => navigateMonth('prev')}
            className="work-schedule-calendar__nav-btn"
            >
              <ChevronLeft size={20} />
            </button>
          
          <h3 className="work-schedule-calendar__month">
            {getMonthName(currentDate)}
          </h3>
          
            <button
            onClick={() => navigateMonth('next')}
            className="work-schedule-calendar__nav-btn"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

      {/* Calendar Grid */}
      <div className="work-schedule-calendar__grid">
        {/* Days of week header */}
        <div className="work-schedule-calendar__weekdays">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
            <div key={day} className="work-schedule-calendar__weekday">
                  {day}
                </div>
              ))}
            </div>

        {/* Calendar days */}
        <div className="work-schedule-calendar__days">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear()
            const isToday = day.toDateString() === new Date().toDateString()
            const hasSchedule = isCurrentMonth && hasScheduleOnDate(day) // Chỉ hiển thị dot cho tháng hiện tại
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString()
            
            // Debug cho tất cả ngày ngoài tháng
            if (!isCurrentMonth) {
              console.log('🐛 DEBUG Outside month day:', {
                day: day.toDateString(),
                dayMonth: day.getMonth(),
                dayYear: day.getFullYear(),
                currentMonth: currentDate.getMonth(),
                currentYear: currentDate.getFullYear(),
                isCurrentMonth: isCurrentMonth,
                currentDate: currentDate.toDateString()
              })
            }

                const dayClasses = `work-schedule-calendar__day ${
                  !isCurrentMonth ? 'work-schedule-calendar__day--other-month' : ''
                } ${
                  isToday ? 'work-schedule-calendar__day--today' : ''
                } ${
                  hasSchedule ? 'work-schedule-calendar__day--has-schedule' : ''
                } ${
                  isSelected ? 'work-schedule-calendar__day--selected' : ''
                }`
                
                // Debug class names for outside month days
                if (!isCurrentMonth) {
                  console.log('🐛 DEBUG Class names for outside month:', {
                    day: day.toDateString(),
                    classes: dayClasses,
                    hasOtherMonthClass: dayClasses.includes('--other-month')
                  })
                }
                
                return (
              <div
                    key={index}
                className={dayClasses}
                onClick={() => handleDateClick(day)}
              >
                <span className="work-schedule-calendar__day-number">
                  {day.getDate()}
                </span>
                {hasSchedule && (
                  <div className="work-schedule-calendar__day-indicator">
                    <div className="work-schedule-calendar__day-dot"></div>
                  </div>
                )}
              </div>
                )
              })}
            </div>
          </div>

      {/* Legend */}
      <div className="work-schedule-calendar__legend">
        <div className="work-schedule-calendar__legend-item">
          <div className="work-schedule-calendar__legend-dot work-schedule-calendar__legend-dot--has-schedule"></div>
          <span>Có lịch làm việc</span>
        </div>
        <div className="work-schedule-calendar__legend-item">
          <div className="work-schedule-calendar__legend-dot work-schedule-calendar__legend-dot--today"></div>
          <span>Hôm nay</span>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSchedule && (
        <div className="work-schedule-calendar__modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="work-schedule-calendar__modal" onClick={(e) => e.stopPropagation()}>
            <div className="work-schedule-calendar__modal-header">
              <h3 className="work-schedule-calendar__modal-title">
                <Clock size={20} />
                Chi tiết lịch làm việc
              </h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="work-schedule-calendar__modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="work-schedule-calendar__modal-content">
              <div className="work-schedule-calendar__modal-info">
                <div className="work-schedule-calendar__modal-info-item">
                  <Calendar size={16} />
                  <span>
                    {selectedDate?.toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="work-schedule-calendar__modal-info-item">
                  <MapPin size={16} />
                  <span>Trung tâm #{centerId}</span>
                </div>
              </div>

              <div className="work-schedule-calendar__modal-schedule">
                <h4>Lịch làm việc trong ngày:</h4>
                <div className="work-schedule-calendar__time-slots">
                  {selectedSchedule.map((slot) => (
                    <div 
                      key={slot.technicianSlotId}
                      className={`work-schedule-calendar__time-slot ${
                        !slot.isAvailable ? 'work-schedule-calendar__time-slot--booked' : ''
                      }`}
                    >
                      <div className="work-schedule-calendar__time-slot__time">
                        {slot.slotTime}
                      </div>
                      <div className="work-schedule-calendar__time-slot__status">
                        {slot.isAvailable ? 'Trống' : 'Đã đặt'}
                      </div>
                      {slot.notes && (
                        <div className="work-schedule-calendar__time-slot__notes">
                          {slot.notes}
                        </div>
                      )}
                    </div>
                  ))}
        </div>
      </div>

              <div className="work-schedule-calendar__modal-stats">
                <div className="work-schedule-calendar__stat">
                  <span className="work-schedule-calendar__stat-label">Tổng ca:</span>
                  <span className="work-schedule-calendar__stat-value">{selectedSchedule.length}</span>
                </div>
                <div className="work-schedule-calendar__stat">
                  <span className="work-schedule-calendar__stat-label">Đã đặt:</span>
                  <span className="work-schedule-calendar__stat-value">{selectedSchedule.filter(s => !s.isAvailable).length}</span>
                </div>
                <div className="work-schedule-calendar__stat">
                  <span className="work-schedule-calendar__stat-label">Trống:</span>
                  <span className="work-schedule-calendar__stat-value">{selectedSchedule.filter(s => s.isAvailable).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
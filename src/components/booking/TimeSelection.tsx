import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User } from 'lucide-react'
import { Center } from '@/services/centerService'
// import { AvailabilityResponse, TimeSlotAvailability, TechnicianAvailability } from '@/services/bookingService'
import api from '@/services/api'

interface TimeSelectionProps {
  centers: Center[]
  selectedCenter: Center | null
  onSelectCenter: (center: Center) => void
  selectedDate: string
  onSelectDate: (date: string) => void
  selectedTimeSlot: any | null
  onSelectTimeSlot: (timeSlot: any) => void
  selectedTechnician: any | null
  onSelectTechnician: (technician: any) => void
  onNext: () => void
  onPrev: () => void
  loading: boolean
  error: string | null
}

const TimeSelection: React.FC<TimeSelectionProps> = ({
  centers,
  selectedCenter,
  onSelectCenter,
  selectedDate,
  onSelectDate,
  selectedTimeSlot,
  onSelectTimeSlot,
  selectedTechnician,
  onSelectTechnician,
  onNext,
  onPrev,
  loading,
  error
}) => {
  const [availability, setAvailability] = useState<any | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  // Generate available dates (from today onwards)
  const generateDates = () => {
    const dates = []
    const today = new Date()
    
    // Get today's date in local timezone (avoid UTC issues)
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const todayDate = today.getDate()
    
    // Generate next 14 days from today
    for (let i = 0; i < 14; i++) {
      const date = new Date(todayYear, todayMonth, todayDate + i)
      
      // Format date as YYYY-MM-DD in local timezone
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      
      dates.push({
        value: dateString,
        label: date.toLocaleDateString('vi-VN', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        isToday: i === 0,
        isPast: false
      })
    }
    return dates
  }

  const dates = generateDates()
  
  // Debug: Log generated dates
  console.log('Generated dates:', dates)

  // Generate time slots from 8:00 to 17:00 with 30-minute intervals
  const generateTimeSlots = (selectedDate?: string) => {
    const timeSlots = []
    let id = 1
    const today = new Date()
    const isToday = selectedDate === today.toISOString().split('T')[0]
    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()
    
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const endHour = minute === 30 ? hour + 1 : hour
        const endMinute = minute === 30 ? 0 : 30
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
        
        // Skip if end time is after 17:00
        if (endHour > 17 || (endHour === 17 && endMinute > 0)) {
          break
        }
        
        // Check if this time slot is in the past (only for today)
        let isPast = false
        if (isToday) {
          const slotTime = hour * 60 + minute
          const currentTime = currentHour * 60 + currentMinute
          isPast = slotTime <= currentTime
        }
        
        timeSlots.push({
          slotId: id++,
          slotTime: `${startTime} - ${endTime}`,
          isAvailable: !isPast && Math.random() > 0.3, // Not available if in past or randomly unavailable
          isPast
        })
      }
    }
    
    return timeSlots
  }

  // Load availability when center and date are selected
  useEffect(() => {
    if (selectedCenter && selectedDate) {
      const loadAvailability = async () => {
        setAvailabilityLoading(true)
        try {
          // Import PublicBookingService for unauthenticated access
          const { PublicBookingService } = await import('@/services/publicBookingService')
          
          // Get availability data from public API
          const availabilityResponse = await PublicBookingService.getAvailableTimeSlots(selectedCenter.centerId, selectedDate)
          
          // Convert to TimeSlotAvailability format - chỉ hiển thị timeslot available
          const timeSlots = availabilityResponse.data.timeSlots
            .filter(slot => slot.isAvailable && !slot.isBooked) // Chỉ lấy timeslot available
            .map(slot => ({
              slotId: slot.slotId,
              slotTime: slot.slotLabel,
              isAvailable: true, // Đã filter ở trên nên luôn true
              isPast: false // Will be calculated below
            }))
          
          // Mark past slots as unavailable
          const today = new Date()
          const isToday = selectedDate === today.toISOString().split('T')[0]
          const currentHour = today.getHours()
          const currentMinute = today.getMinutes()
          
          const processedTimeSlots = timeSlots.map(slot => {
            if (isToday) {
              const [startTime] = slot.slotTime.split(' - ')
              const [hour, minute] = startTime.split(':').map(Number)
              const slotTime = hour * 60 + minute
              const currentTime = currentHour * 60 + currentMinute
              const isPast = slotTime <= currentTime
              
              return {
                ...slot,
                isAvailable: !isPast, // Chỉ available nếu không phải quá khứ
                isPast
              }
            }
            return slot
          })
          
          // Get technicians for the center
          const { TechnicianService } = await import('@/services/technicianService')
          const techniciansResponse = await TechnicianService.list({ centerId: selectedCenter.centerId, pageSize: 100 })
          const technicians = (techniciansResponse.technicians || []).map(tech => ({
            id: tech.technicianId,
            name: tech.userFullName,
            specialization: tech.specialization || 'Kỹ thuật viên',
            available: true
          }))
          
          setAvailability({
            timeSlots: processedTimeSlots,
            technicians
          })
        } catch (error) {
          console.error('Error loading availability:', error)
          // Fallback: Try to get basic time slots from TimeSlot API
          try {
            const { data: timeSlotsResponse } = await api.get('/TimeSlot')
            const timeSlots = (timeSlotsResponse.data || []).map((slot: any, index: number) => ({
              slotId: slot.slotId,
              slotTime: slot.slotLabel,
              isAvailable: true, // Mark as available since we can't check booking status without auth
              isPast: false
            }))
            
            // Try to get technicians from API, otherwise empty array
            let technicians: any[] = []
            try {
              const { TechnicianService } = await import('@/services/technicianService')
              const techniciansResponse = await TechnicianService.list({ centerId: selectedCenter?.centerId, pageSize: 100 })
              technicians = (techniciansResponse.technicians || []).map((tech: any) => ({
                id: tech.technicianId,
                name: tech.userFullName,
                specialization: tech.specialization || 'Kỹ thuật viên',
                available: true
              }))
            } catch (techError) {
              console.warn('Could not load technicians in fallback:', techError)
              // Empty array - no mock data
            }
            
            setAvailability({
              timeSlots,
              technicians // Use real data from API only
            })
          } catch (fallbackError) {
            console.error('Fallback API also failed:', fallbackError)
            // No mock data - show empty state and error
            setAvailability({
              timeSlots: [],
              technicians: []
            })
            setError('Không thể tải thông tin lịch trống. Vui lòng thử lại sau.')
          }
        } finally {
          setAvailabilityLoading(false)
        }
      }

      loadAvailability()
    }
  }, [selectedCenter, selectedDate])

  const isStepValid = selectedCenter && selectedDate && selectedTimeSlot && selectedTechnician

  return (
    <div className="booking-step">
      <h2 style={{ 
        textAlign: 'center', 
        fontSize: '1.5rem', 
        fontWeight: '700', 
        color: '#1e293b', 
        marginBottom: '2rem' 
      }}>
        Chọn thời gian và kỹ thuật viên
      </h2>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <Clock size={24} style={{ marginBottom: '0.5rem' }} />
          <div>Đang tải thông tin...</div>
        </div>
      )}
      
      {error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Center Selection */}
          <div>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              color: '#1e293b', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <MapPin size={18} color="#10b981" />
              Chọn trung tâm
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '0.75rem' 
            }}>
              {Array.isArray(centers) && centers.map((center) => (
                <div 
                  key={center.centerId}
                  style={{
                    background: selectedCenter?.centerId === center.centerId ? '#f0fdf4' : '#fff',
                    border: `2px solid ${selectedCenter?.centerId === center.centerId ? '#10b981' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => onSelectCenter(center)}
                >
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#1e293b', 
                    marginBottom: '0.5rem' 
                  }}>
                    {center.centerName}
                  </h4>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: '#64748b', 
                    margin: 0 
                  }}>
                    {center.address}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          {selectedCenter && (
            <div>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={18} color="#10b981" />
                Chọn ngày
              </h3>
              
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                overflowX: 'auto',
                paddingBottom: '0.5rem'
              }}>
                {dates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => {
                      console.log('Date clicked:', date.value, 'Label:', date.label)
                      onSelectDate(date.value)
                    }}
                    style={{
                      background: selectedDate === date.value ? '#10b981' : '#f3f4f6',
                      color: selectedDate === date.value ? '#fff' : '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      minWidth: '120px'
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>
                      {date.label.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      {date.label.split(' ').slice(1).join(' ')}
                    </div>
                    {date.isToday && (
                      <div style={{ 
                        fontSize: '0.7rem', 
                        opacity: 0.8,
                        marginTop: '0.25rem'
                      }}>
                        Hôm nay
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Slot Selection */}
          {selectedCenter && selectedDate && (
            <div>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Clock size={18} color="#10b981" />
                Chọn giờ
              </h3>
              
              {availabilityLoading ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
                  Đang tải khung giờ...
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '0.5rem' 
                }}>
                  {Array.isArray(availability?.timeSlots) && availability?.timeSlots.map((slot) => (
                    <button
                      key={slot.slotId}
                      onClick={() => slot.isAvailable && onSelectTimeSlot(slot)}
                      disabled={!slot.isAvailable}
                      style={{
                        background: selectedTimeSlot?.slotId === slot.slotId ? '#10b981' : 
                                   slot.isAvailable ? '#f3f4f6' : '#f9fafb',
                        color: selectedTimeSlot?.slotId === slot.slotId ? '#fff' : 
                               slot.isAvailable ? '#374151' : '#9ca3af',
                        border: `2px solid ${selectedTimeSlot?.slotId === slot.slotId ? '#10b981' : 
                                         slot.isAvailable ? '#e5e7eb' : '#f3f4f6'}`,
                        borderRadius: '8px',
                        padding: '0.75rem',
                        cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        opacity: slot.isAvailable ? 1 : 0.6,
                        position: 'relative'
                      }}
                    >
                      <div style={{ fontWeight: '600' }}>
                        {slot.slotTime}
                      </div>
                      {!slot.isAvailable && (
                        <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                          {slot.isPast ? 'Đã qua' : 'Đã đầy'}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Technician Selection */}
          {selectedCenter && selectedDate && selectedTimeSlot && (
            <div>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <User size={18} color="#10b981" />
                Chọn kỹ thuật viên
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '0.75rem' 
              }}>
                {Array.isArray(availability?.technicians) && availability?.technicians.map((technician) => (
                  <div 
                    key={technician.id}
                    style={{
                      background: selectedTechnician?.id === technician.id ? '#f0fdf4' : '#fff',
                      border: `2px solid ${selectedTechnician?.id === technician.id ? '#10b981' : 
                                         technician.available ? '#e5e7eb' : '#f3f4f6'}`,
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: technician.available ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      opacity: technician.available ? 1 : 0.6
                    }}
                    onClick={() => technician.available && onSelectTechnician(technician)}
                  >
                    <h4 style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      marginBottom: '0.5rem' 
                    }}>
                      {technician.name}
                    </h4>
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: '#64748b', 
                      margin: 0 
                    }}>
                      {technician.specialization}
                    </p>
                    {!technician.available && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#ef4444',
                        marginTop: '0.5rem',
                        fontWeight: '500'
                      }}>
                        Không có sẵn
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '2rem' 
      }}>
        <button 
          onClick={onPrev}
          style={{
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          Quay lại
        </button>
        <button 
          onClick={onNext}
          disabled={!isStepValid}
          style={{
            background: isStepValid ? '#10b981' : '#d1d5db',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: isStepValid ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          Tiếp theo
        </button>
      </div>
    </div>
  )
}

export default TimeSelection

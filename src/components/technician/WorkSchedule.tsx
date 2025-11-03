import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import WorkScheduleCalendar from './WorkScheduleCalendar'
import WorkScheduleCalendarNew from './WorkScheduleCalendarNew'
import { useAppSelector } from '@/store/hooks'
import './WorkSchedule.scss'

interface Appointment {
  id: number
  time: string
  customer: string
  service: string
  vehicle: string
  status: 'confirmed' | 'pending' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
}

interface ScheduleData {
  id: number
  date: string
  timeSlot: string
  appointments: Appointment[]
  workload: 'light' | 'moderate' | 'heavy'
}

interface WorkScheduleProps {
  // No props needed
}

export default function WorkSchedule({}: WorkScheduleProps) {
  // Removed viewMode - only using month view
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user data from Redux
  const user = useAppSelector((state) => state.auth.user)

  // Load schedule data from API
  useEffect(() => {
    const loadScheduleData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // TODO: Replace with actual API call to get technician's appointments
        // For now, return empty array to indicate no mock data
        
        // This would be replaced with actual API call:
        // const response = await BookingService.getTechnicianAppointments(user?.id)
        // setScheduleData(response.data)
        
        setScheduleData([]) // Empty array - no mock data
      } catch (error: any) {
        console.error('❌ Error loading schedule data:', error)
        setError(error.message || 'Không thể tải dữ liệu lịch làm việc')
        setScheduleData([])
      } finally {
        setLoading(false)
      }
    }

    loadScheduleData()
  }, [user?.id])

  // Use schedule data directly without filtering
  const filteredScheduleData = scheduleData

  const handleAppointmentClick = (appointment: Appointment) => {
    console.log('Appointment clicked:', appointment)
    // Handle appointment click - could open modal, navigate, etc.
  }

  return (
    <div className="work-schedule">
      
      {/* Loading State */}
      {loading && (
        <div className="work-schedule__loading">
          <p className="text-center text-gray-500">Đang tải dữ liệu lịch làm việc...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="work-schedule__error">
          <p className="text-red-600 text-center">⚠️ {error}</p>
        </div>
      )}

      {/* Calendar - only show when not loading and no error */}
      {!loading && !error && (
        <WorkScheduleCalendarNew
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
      )}
    </div>
  )
}
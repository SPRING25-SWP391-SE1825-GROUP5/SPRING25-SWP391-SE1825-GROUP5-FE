import { useState } from 'react'
import WorkScheduleHeader from './WorkScheduleHeader'
import WorkScheduleCalendar from './WorkScheduleCalendar'
import WorkScheduleFilters from './WorkScheduleFilters'
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
  onNavigateToLeaveRequest: () => void
  onNavigateToVehicleDetails: () => void
}

export default function WorkSchedule({ onNavigateToLeaveRequest, onNavigateToVehicleDetails }: WorkScheduleProps) {
  // Removed viewMode - only using month view
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    dateRange: {
      start: '',
      end: ''
    }
  })

  const scheduleData: ScheduleData[] = [
    {
      id: 1,
      date: '2024-01-18',
      timeSlot: '08:00 - 17:00',
      appointments: [
        {
          id: 1,
          time: '09:00',
          customer: 'Nguyễn Văn An',
          service: 'Sửa chữa động cơ',
          vehicle: 'VF e34 - 30A-12345',
          status: 'confirmed',
          priority: 'high'
        },
        {
          id: 2,
          time: '14:00',
          customer: 'Trần Thị Bình',
          service: 'Bảo dưỡng định kỳ',
          vehicle: 'Newtech - 29B-67890',
          status: 'pending',
          priority: 'medium'
        }
      ],
      workload: 'moderate'
    },
    {
      id: 2,
      date: '2024-01-19',
      timeSlot: '08:00 - 17:00',
      appointments: [
        {
          id: 3,
          time: '08:00',
          customer: 'Lê Hoài Cường',
          service: 'Thay thế pin',
          vehicle: 'Xmen Neo - 51C-11111',
          status: 'confirmed',
          priority: 'high'
        },
        {
          id: 4,
          time: '10:30',
          customer: 'Phạm Thị Dung',
          service: 'Kiểm tra hệ thống điện',
          vehicle: 'VF 5 Plus - 52D-22222',
          status: 'confirmed',
          priority: 'medium'
        },
        {
          id: 5,
          time: '15:00',
          customer: 'Hoàng Văn Em',
          service: 'Sửa chữa phanh',
          vehicle: 'Klara S - 53E-33333',
          status: 'pending',
          priority: 'low'
        }
      ],
      workload: 'heavy'
    },
    {
      id: 3,
      date: '2024-01-20',
      timeSlot: '08:00 - 17:00',
      appointments: [
        {
          id: 6,
          time: '11:00',
          customer: 'Nguyễn Thị Phương',
          service: 'Bảo dưỡng định kỳ',
          vehicle: 'Feliz S - 54F-44444',
          status: 'confirmed',
          priority: 'low'
        }
      ],
      workload: 'light'
    }
  ]

  // Filter and search logic
  const filteredScheduleData = scheduleData.filter(schedule => {
    // Search filter
    if (searchTerm) {
      const hasMatchingAppointment = schedule.appointments.some(apt => 
        apt.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (!hasMatchingAppointment) return false
    }

    // Status filter
    if (filters.status.length > 0) {
      const hasMatchingStatus = schedule.appointments.some(apt => 
        filters.status.includes(apt.status)
      )
      if (!hasMatchingStatus) return false
    }

    // Priority filter
    if (filters.priority.length > 0) {
      const hasMatchingPriority = schedule.appointments.some(apt => 
        filters.priority.includes(apt.priority)
      )
      if (!hasMatchingPriority) return false
    }

    // Date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const scheduleDate = new Date(schedule.date)
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      
      if (scheduleDate < startDate || scheduleDate > endDate) {
        return false
      }
    }

    return true
  })

  const handleAppointmentClick = (appointment: Appointment) => {
    console.log('Appointment clicked:', appointment)
    // Handle appointment click - could open modal, navigate, etc.
  }

  return (
    <div className="work-schedule">
      <WorkScheduleHeader
        onNavigateToLeaveRequest={onNavigateToLeaveRequest}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      <WorkScheduleCalendar
        viewMode="month"
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        appointments={filteredScheduleData.flatMap(schedule => schedule.appointments)}
        onAppointmentClick={handleAppointmentClick}
        onNavigateToVehicleDetails={onNavigateToVehicleDetails}
      />

      <WorkScheduleFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  )
}
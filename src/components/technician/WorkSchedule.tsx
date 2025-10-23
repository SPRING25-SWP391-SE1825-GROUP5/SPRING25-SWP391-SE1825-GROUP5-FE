import { useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import WorkScheduleHeader from './WorkScheduleHeader'
import WorkScheduleCalendar from './WorkScheduleCalendar'
import WorkScheduleFilters from './WorkScheduleFilters'
import './WorkSchedule.scss'

interface WorkScheduleProps {
  onNavigateToLeaveRequest: () => void
  onNavigateToVehicleDetails: () => void
}

export default function WorkSchedule({ onNavigateToLeaveRequest, onNavigateToVehicleDetails }: WorkScheduleProps) {
  const user = useAppSelector((state) => state.auth.user)
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

  // Check if user is a technician (case-insensitive)
  const isTechnician = user?.role?.toLowerCase() === 'technician'

  // Navigation handlers
  const navigateToLeaveRequest = () => {
    onNavigateToLeaveRequest()
  }

  const navigateToVehicleDetails = () => {
    onNavigateToVehicleDetails()
  }

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  // Date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  return (
    <div className="work-schedule">
      <WorkScheduleHeader
        currentDate={currentDate}
        onNavigateDate={navigateDate}
        onNavigateToLeaveRequest={navigateToLeaveRequest}
        onNavigateToVehicleDetails={navigateToVehicleDetails}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onToggleFilters={toggleFilters}
        showFilters={showFilters}
      />

      {/* WorkScheduleCalendar handles all data fetching and state management */}
      <WorkScheduleCalendar
        technicianId={user?.id || 1}
        centerId={1}
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
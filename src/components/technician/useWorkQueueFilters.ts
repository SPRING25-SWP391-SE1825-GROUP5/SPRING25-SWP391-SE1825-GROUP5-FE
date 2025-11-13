import { useMemo } from 'react'
import { mapBookingStatus, getDateRange, getDateFromString } from './workQueueHelpers'
import type { WorkOrder } from './workQueueTypes'

export const useWorkQueueFilters = (
  workQueue: WorkOrder[],
  searchTerm: string,
  statusFilter: string,
  serviceTypeFilter: string,
  timeSlotFilter: string,
  dateFilterType: 'custom' | 'today' | 'thisWeek' | 'all',
  selectedDate: string,
  showAllStatusesToggle: boolean,
  sortBy: 'bookingId' | 'customer' | 'serviceName' | 'status' | 'createdAt' | 'scheduledDate' | 'licensePlate',
  sortOrder: 'asc' | 'desc'
) => {
  const filteredWork = useMemo(() => {
    return workQueue
      .filter(work => {
        // Search filter
        const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             work.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             work.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             work.customerPhone.includes(searchTerm) ||
                             (work.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase())

        // Status filter
        let matchesStatus = true
        if (statusFilter && statusFilter !== '' && statusFilter !== 'all') {
          const mappedStatus = mapBookingStatus(statusFilter)
          matchesStatus = work.status === mappedStatus
        }
        // Toggle to hide less-important statuses by default
        if (!showAllStatusesToggle) {
          const keep = work.status === 'pending' || work.status === 'in_progress' || work.status === 'confirmed' || work.status === 'checked_in'
          matchesStatus = matchesStatus && keep
        }

        // Service type filter
        let matchesServiceType = true
        if (serviceTypeFilter && serviceTypeFilter !== 'all') {
          matchesServiceType = work.serviceType === serviceTypeFilter
        }

        // Time slot filter
        let matchesTimeSlot = true
        if (timeSlotFilter && timeSlotFilter !== 'all') {
          const workSlotTime = work.slotLabel || work.scheduledTime || ''
          const workSlotStart = workSlotTime.split('-')[0].trim().split(' ')[0]
          const filterSlotStart = timeSlotFilter.split('-')[0].trim().split(' ')[0]
          matchesTimeSlot = workSlotStart === filterSlotStart || workSlotTime.includes(timeSlotFilter) || workSlotTime === timeSlotFilter
        }

        // Date filter
        let matchesDate = true
        if (dateFilterType !== 'all') {
          const dateRange = getDateRange(dateFilterType, selectedDate)
          const workDate = work.workDate || work.scheduledDate || work.createdAt
          const workDateStr = workDate ? getDateFromString(workDate) : null

          if (dateFilterType === 'custom' && workDateStr) {
            matchesDate = workDateStr === selectedDate
          } else if (dateFilterType === 'thisWeek' && dateRange && workDateStr) {
            if (dateRange.startDate && dateRange.endDate) {
              matchesDate = workDateStr >= dateRange.startDate && workDateStr <= dateRange.endDate
            }
          }
        }

        return matchesSearch && matchesStatus && matchesServiceType && matchesTimeSlot && matchesDate
      })
      .sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortBy) {
          case 'bookingId':
            aValue = a.bookingId || 0
            bValue = b.bookingId || 0
            break
          case 'customer':
            aValue = (a.customer || '').toLowerCase()
            bValue = (b.customer || '').toLowerCase()
            break
          case 'serviceName':
            aValue = (a.serviceName || a.title || '').toLowerCase()
            bValue = (b.serviceName || b.title || '').toLowerCase()
            break
          case 'status':
            aValue = (a.status || '').toLowerCase()
            bValue = (b.status || '').toLowerCase()
            break
          case 'createdAt':
            aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0
            bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0
            break
        case 'scheduledDate':
          aValue = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0
          bValue = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0
          break
        case 'licensePlate':
          aValue = (a.licensePlate || '').toLowerCase()
          bValue = (b.licensePlate || '').toLowerCase()
          break
        default:
          aValue = a.bookingId || 0
          bValue = b.bookingId || 0
        }

        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
  }, [workQueue, searchTerm, statusFilter, serviceTypeFilter, timeSlotFilter, dateFilterType, selectedDate, showAllStatusesToggle, sortBy, sortOrder])

  return filteredWork
}


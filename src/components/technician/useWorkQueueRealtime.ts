import { useEffect } from 'react'
import bookingRealtimeService from '@/services/bookingRealtimeService'
import { getCurrentDateString } from './workQueueHelpers'
import type { WorkOrder } from './workQueueTypes'

interface UseWorkQueueRealtimeParams {
  mode: 'technician' | 'staff'
  technicianId: number | null
  centerId: number | null
  workQueue: WorkOrder[]
  dateFilterType: 'custom' | 'today' | 'thisWeek' | 'all'
  selectedDate: string
  currentPage: number
  fetchTechnicianBookings: (date?: string, page: number) => Promise<void>
}

export const useWorkQueueRealtime = (params: UseWorkQueueRealtimeParams) => {
  const { mode, technicianId, centerId, workQueue, dateFilterType, selectedDate, currentPage, fetchTechnicianBookings } = params

  useEffect(() => {
    let isMounted = true

    // Join realtime group
    ;(async () => {
      try {
        const today = getCurrentDateString()
        const centerIdToUse = centerId || workQueue[0]?.centerId
        if (centerIdToUse && isMounted) {
          await bookingRealtimeService.joinCenterDate(centerIdToUse, today)
        }
      } catch (e) {
        console.warn('Không thể join realtime group:', e)
      }
    })()

    // Set up realtime callback với đúng parameters
    const handleBookingUpdate = () => {
      if (!isMounted) return

      // Refresh data với đúng page và date filter
      const refreshDate = dateFilterType === 'today'
        ? getCurrentDateString()
        : dateFilterType === 'custom'
        ? selectedDate
        : undefined

      // Trong staff mode, chỉ refresh khi có centerId
      if (mode === 'staff' && centerId) {
        fetchTechnicianBookings(refreshDate, currentPage)
      } else if (mode === 'technician' && technicianId) {
        fetchTechnicianBookings(refreshDate, currentPage)
      }
    }

    bookingRealtimeService.setOnBookingUpdated(handleBookingUpdate)

    // Cleanup: remove callback khi unmount hoặc dependencies thay đổi
    return () => {
      isMounted = false
      bookingRealtimeService.setOnBookingUpdated(() => {}) // Clear callback
    }
  }, [workQueue.length, selectedDate, mode, technicianId, centerId, dateFilterType, currentPage, fetchTechnicianBookings])
}


import { useEffect } from 'react'
import bookingRealtimeService from '@/services/bookingRealtimeService'
import { getCurrentDateString } from './workQueueHelpers'
import type { WorkOrder } from './workQueueTypes'

interface UseWorkQueueRealtimeParams {
  mode: 'technician' | 'staff'
  technicianId: number | null
  centerId: number | null
  workQueue: WorkOrder[]
  currentPage: number
  fetchTechnicianBookings: (date?: string, page?: number) => Promise<void>
}

export const useWorkQueueRealtime = (params: UseWorkQueueRealtimeParams) => {
  const { mode, technicianId, centerId, workQueue, currentPage, fetchTechnicianBookings } = params

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

      // Refresh data: fetch tất cả booking (filter sẽ được xử lý ở client-side)
      // Trong staff mode, chỉ refresh khi có centerId
      if (mode === 'staff' && centerId) {
        fetchTechnicianBookings(undefined, currentPage)
      } else if (mode === 'technician' && technicianId) {
        fetchTechnicianBookings(undefined, currentPage)
      }
    }

    bookingRealtimeService.setOnBookingUpdated(handleBookingUpdate)

    // Cleanup: remove callback khi unmount hoặc dependencies thay đổi
    return () => {
      isMounted = false
      bookingRealtimeService.setOnBookingUpdated(() => {}) // Clear callback
    }
  }, [workQueue.length, mode, technicianId, centerId, currentPage, fetchTechnicianBookings])
}


import React, { useState, useCallback } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { mapStatusToApi, canTransitionTo, getCurrentDateString } from './workQueueHelpers'
import type { WorkOrder } from './workQueueTypes'

export const useWorkQueueActions = (
  workQueue: WorkOrder[],
  dateFilterType: 'custom' | 'today' | 'thisWeek' | 'all',
  selectedDate: string,
  currentPage: number,
  fetchTechnicianBookings: (date?: string, page: number) => Promise<void>
): {
  updatingStatus: Set<number>
  handleStatusUpdate: (e: React.MouseEvent, workId: number, newStatus: string) => Promise<void>
  handleCancelBooking: (e: React.MouseEvent, workId: number) => Promise<void>
  canTransitionTo: (currentStatus: string, targetStatus: string) => boolean
} => {
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set())

  const confirmViaToast = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = toast.custom((t) => (
        <div style={{
          background: '#111827',
          color: '#fff',
          padding: '12px',
          borderRadius: 10,
          border: '1px solid #374151',
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
          minWidth: 280
        }}>
          <div style={{ fontSize: 14, marginBottom: 10 }}>{message}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { toast.dismiss(id); resolve(false) }}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: '#374151',
                color: '#E5E7EB',
                border: '1px solid #4B5563',
                cursor: 'pointer',
                fontSize: 12
              }}
            >Hủy</button>
            <button
              onClick={() => { toast.dismiss(id); resolve(true) }}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: '#10B981',
                color: '#0B1220',
                border: '1px solid #34D399',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >Xác nhận</button>
          </div>
        </div>
      ), { duration: Infinity })
    })
  }

  const handleStatusUpdate = useCallback(async (e: React.MouseEvent, workId: number, newStatus: string) => {
    e.stopPropagation()
    console.log('handleStatusUpdate called:', { workId, newStatus })
    setUpdatingStatus(prev => new Set(prev).add(workId))

    const currentWork = workQueue.find(w => w.id === workId)
    const currentStatus = currentWork?.status || ''
    console.log('Current work:', { workId, currentStatus, newStatus })

    try {
      if (newStatus === 'confirmed') {
        console.log('Showing confirmation dialog for confirmed status')
        const ok = await confirmViaToast('Xác nhận booking này?')
        console.log('Confirmation result:', ok)
        if (!ok) {
          console.log('User cancelled confirmation')
          setUpdatingStatus(prev => { const s = new Set(prev); s.delete(workId); return s });
          return
        }
      }
      if (newStatus === 'in_progress') {
        const ok = await confirmViaToast('Bắt đầu làm việc cho booking này?')
        if (!ok) { setUpdatingStatus(prev => { const s = new Set(prev); s.delete(workId); return s }); return }
      }
      if (newStatus === 'completed') {
        const ok = await confirmViaToast('Hoàn thành công việc? Hãy đảm bảo checklist và phụ tùng đã được xác nhận.')
        if (!ok) { setUpdatingStatus(prev => { const s = new Set(prev); s.delete(workId); return s }); return }
      }
      if (newStatus === 'cancelled') {
        const ok = await confirmViaToast('Hủy booking này? Hành động không thể hoàn tác.')
        if (!ok) { setUpdatingStatus(prev => { const s = new Set(prev); s.delete(workId); return s }); return }
      }

      console.log('Calling API to update status:', { workId, newStatus, apiStatus: mapStatusToApi(newStatus) })
      const response = await api.put(`/Booking/${workId}/status`, {
        status: mapStatusToApi(newStatus)
      })
      console.log('API response:', response.data)

      if (response.data) {
        toast.success(`Cập nhật trạng thái thành công!`)
        const today = getCurrentDateString()
        if (dateFilterType === 'today') {
          fetchTechnicianBookings(today, currentPage)
        } else if (dateFilterType === 'custom') {
          fetchTechnicianBookings(selectedDate, currentPage)
        } else {
          fetchTechnicianBookings(undefined, currentPage)
        }
      }
    } catch (err: any) {
      let errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.'

      if (newStatus === 'in_progress' && (currentStatus === 'confirmed' || currentStatus.toLowerCase() === 'confirmed')) {
        errorMessage = 'Khách hàng chưa tới check-in. Vui lòng đợi khách hàng check-in trước khi bắt đầu làm việc.'
      }

      toast.error(errorMessage)
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev)
        newSet.delete(workId)
        return newSet
      })
    }
  }, [workQueue, dateFilterType, selectedDate, currentPage, fetchTechnicianBookings])

  const handleCancelBooking = useCallback(async (e: React.MouseEvent, workId: number) => {
    e.stopPropagation()
    setUpdatingStatus(prev => new Set(prev).add(workId))
    try {
      const response = await api.put(`/Booking/${workId}/cancel`)

      if (response.data) {
        toast.success(`Hủy booking thành công!`)
        const today = getCurrentDateString()
        if (dateFilterType === 'today') {
          fetchTechnicianBookings(today, currentPage)
        } else if (dateFilterType === 'custom') {
          fetchTechnicianBookings(selectedDate, currentPage)
        } else {
          fetchTechnicianBookings(undefined, currentPage)
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi hủy booking.')
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev)
        newSet.delete(workId)
        return newSet
      })
    }
  }, [dateFilterType, selectedDate, currentPage, fetchTechnicianBookings])

  return {
    updatingStatus,
    handleStatusUpdate,
    handleCancelBooking,
    canTransitionTo
  }
}


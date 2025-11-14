
import { useState, useCallback } from 'react'
import { TechnicianService } from '@/services/technicianService'
import { BookingService } from '@/services/bookingService'
import toast from 'react-hot-toast'
import { getCurrentDateString, buildCreatedAt, mapBookingStatus } from './workQueueHelpers'
import type { TechnicianBookingResponse, TechnicianBooking, WorkOrder } from './workQueueTypes'

interface UseWorkQueueDataFetchParams {
  mode: 'technician' | 'staff'
  technicianId: number | null
  centerId: number | null
  itemsPerPage: number
  statusFilter: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface ApiPagination {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export const useWorkQueueDataFetch = (params: UseWorkQueueDataFetchParams) => {
  const { mode, technicianId, centerId, itemsPerPage, statusFilter, sortBy, sortOrder } = params

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workQueue, setWorkQueue] = useState<WorkOrder[]>([])
  const [apiPagination, setApiPagination] = useState<ApiPagination | null>(null)

  const fetchTechnicianBookings = useCallback(async (date?: string, page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      if (mode === 'technician' && !technicianId) {
        setLoading(false)
        return
      }

      let bookingsData: TechnicianBooking[] = []
      if (mode === 'technician') {
        const response: TechnicianBookingResponse = await TechnicianService.getTechnicianBookings(technicianId!, date)
        // Extract
        if (response?.success && response?.data?.bookings) bookingsData = response.data.bookings
        else if (response?.data && Array.isArray(response.data)) bookingsData = response.data
        else if (Array.isArray(response)) bookingsData = response as any
        else if (response?.bookings && Array.isArray(response.bookings)) bookingsData = response.bookings
      } else {
        // Staff mode: ưu tiên theo center được assign
        if (centerId) {
          try {
            // Sử dụng API với pagination
            const today = getCurrentDateString()
            const apiParams: any = {
              centerId,
              page,
              pageSize: itemsPerPage,
              sortBy: sortBy === 'createdAt' ? 'createdAt' : sortBy,
              sortOrder: sortOrder
            }

            // Không filter theo ngày ở API level, filter sẽ được xử lý ở client-side

            // Chỉ thêm status filter khi không phải 'all'
            if (statusFilter !== 'all') {
              apiParams.status = statusFilter.toUpperCase()
            }

            const centerResp = await BookingService.getBookingsByCenterAdmin(apiParams)
            const arr = (centerResp as any)?.data?.bookings || []
            bookingsData = (arr as any[]).map((b: any) => ({
              bookingId: b.bookingId || b.id,
              status: mapBookingStatus(b.status),
              serviceId: b.serviceInfo?.serviceId,
              serviceName: b.serviceInfo?.serviceName,
              centerId: b.centerInfo?.centerId,
              centerName: b.centerInfo?.centerName,
              slotId: b.timeSlotInfo?.slotId,
              technicianSlotId: b.timeSlotInfo?.slotId,
              slotTime: b.timeSlotInfo?.slotTime || b.timeSlotInfo?.slotLabel || '',
              slotLabel: b.timeSlotInfo?.slotLabel,
              date: b.timeSlotInfo?.workDate || b.bookingDate,
              customerName: b.customerInfo?.fullName,
              customerPhone: b.customerInfo?.phoneNumber,
              vehiclePlate: b.vehicleInfo?.licensePlate,
              technicianName: b.technicianInfo?.technicianName,
              technicianPhone: b.technicianInfo?.phoneNumber || b.technicianInfo?.technicianPhone,
              workStartTime: null,
              workEndTime: null,
              createdAt: b.createdAt || b.bookingDate
            }))
            // Lưu pagination info từ API
            if (centerResp?.data?.pagination) {
              setApiPagination(centerResp.data.pagination)
            }
          } catch (e: any) {
            const errorMsg = e?.message || 'Không thể tải lịch hẹn theo trung tâm'
            const statusCode = e?.response?.status

            setError(errorMsg)
            console.warn('Lỗi khi fetch booking data từ center:', errorMsg, 'Status:', statusCode, 'Giữ data cũ để tránh mất data.')

            if (statusCode !== 401 && statusCode !== 403) {
              toast.error(`Không thể cập nhật dữ liệu: ${errorMsg}`, { duration: 5000 })
            }
            return
          }
        } else {
          // Staff mode nhưng không có centerId - không thể lấy dữ liệu
          setError('Bạn chưa được gán vào trung tâm nào. Vui lòng liên hệ quản trị viên.')
          setWorkQueue([])
          setApiPagination(null)
          return
        }
      }

      // Kiểm tra nếu bookingsData là array và có length > 0
      if (Array.isArray(bookingsData) && bookingsData.length > 0) {
        // Transform API data to WorkOrder format
        const transformedData: WorkOrder[] = bookingsData.map((booking: TechnicianBooking) => {
          const createdAt = buildCreatedAt(booking, booking.date)

          // Lấy workDate từ booking.date (từ API), fallback về date parameter hoặc ngày hiện tại
          const getWorkDate = (): string => {
            if (booking.date) {
              // Nếu booking.date là string format YYYY-MM-DD, dùng luôn
              if (/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) {
                return booking.date
              }
              // Nếu là ISO string hoặc date string khác, extract date part
              try {
                const d = new Date(booking.date)
                if (!isNaN(d.getTime())) {
                  const year = d.getFullYear()
                  const month = String(d.getMonth() + 1).padStart(2, '0')
                  const day = String(d.getDate()).padStart(2, '0')
                  return `${year}-${month}-${day}`
                }
              } catch (e) {
                // Ignore
              }
            }
            // Fallback về date parameter hoặc ngày hiện tại
            return date || getCurrentDateString()
          }

          const workDateValue = getWorkDate()

          return {
            id: booking.bookingId,
            bookingId: booking.bookingId,
            title: booking.serviceName,
            customer: booking.customerName,
            customerPhone: booking.customerPhone,
            licensePlate: booking.vehiclePlate,
            bikeBrand: '',
            bikeModel: '',
            status: mapBookingStatus(booking.status) as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'paid' | 'cancelled',
            priority: 'medium' as 'low' | 'medium' | 'high',
            estimatedTime: '1 giờ',
            description: `Dịch vụ: ${booking.serviceName}`,
            scheduledDate: workDateValue,
            scheduledTime: booking.slotTime?.replace(' SA', '').replace(' CH', '') || '',
            createdAt: createdAt,
            serviceType: 'maintenance',
            assignedTechnician: '',
            parts: [],
            workDate: workDateValue,
            startTime: booking.workStartTime || '',
            endTime: booking.workEndTime || '',
            serviceName: booking.serviceName,
            vehicleId: undefined,
            centerId: booking.centerId,
            technicianName: booking.technicianName,
            technicianPhone: booking.technicianPhone,
            slotLabel: booking.slotLabel || booking.slotTime
          }
        })

        setWorkQueue(transformedData)
      } else {
        setWorkQueue([])
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Không thể tải dữ liệu'
      const statusCode = err?.response?.status

      setError(errorMsg)
      console.warn('Lỗi khi fetch booking data (technician mode):', errorMsg, 'Status:', statusCode, 'Giữ data cũ để tránh mất data.')

      if (statusCode !== 401 && statusCode !== 403) {
        toast.error(`Không thể cập nhật dữ liệu: ${errorMsg}`, { duration: 5000 })
      }
    } finally {
      setLoading(false)
    }
  }, [mode, technicianId, centerId, itemsPerPage, statusFilter, sortBy, sortOrder])

  return {
    loading,
    error,
    workQueue,
    setWorkQueue,
    apiPagination,
    setApiPagination,
    fetchTechnicianBookings
  }
}


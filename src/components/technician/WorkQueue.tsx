import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  Clock,
  Wrench,
  Package,
  CheckCircle,
  Eye,
  Edit,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Check,
  Flag,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List,
  EyeOff,
  Sliders,
  Calendar,
  Filter,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { TechnicianService } from '@/services/technicianService'
import { WorkOrderPartService } from '@/services/workOrderPartService'
import { BookingService } from '@/services/bookingService'
import { useAppSelector } from '@/store/hooks'
import api from '@/services/api'
import toast from 'react-hot-toast'
import WorkQueueRowExpansion from './WorkQueueRowExpansion'
import './WorkQueue.scss'
import './DatePicker.scss'
import bookingRealtimeService from '@/services/bookingRealtimeService'
import WorkQueueSlotHeader from './WorkQueueSlotHeader'

// API Response Interfaces
interface TechnicianBookingResponse {
  success: boolean
  message: string
  data: {
    technicianId: number
    date: string
    bookings: TechnicianBooking[]
  }
  bookings?: TechnicianBooking[] // Support direct bookings property
}

interface TechnicianBooking {
  bookingId: number
  status: string
  serviceId: number
  serviceName: string
  centerId: number
  centerName: string
  slotId: number
  technicianSlotId: number
  slotTime: string
  slotLabel?: string
  date?: string
  customerName: string
  customerPhone: string
  vehiclePlate: string
  workStartTime: string | null
  workEndTime: string | null
  createdAt?: string
  createdDate?: string
  created_at?: string
  bookingDate?: string
  updatedAt?: string
}

interface WorkOrder {
  id: number
  bookingId?: number
  title: string
  customer: string
  customerPhone: string
  customerEmail?: string
  licensePlate: string
  bikeBrand?: string
  bikeModel?: string
  status: 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'paid' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  description: string
  scheduledDate: string
  scheduledTime: string
  createdAt: string
  serviceType: string
  assignedTechnician?: string
  parts: string[]
  workDate?: string
  startTime?: string
  endTime?: string
  serviceName?: string
  vehicleId?: number
  centerId?: number
}

interface WorkQueueProps {
  onViewDetails?: (work: WorkOrder) => void
  onViewBookingDetail?: (bookingId: number) => void
}

export default function WorkQueue({ onViewDetails, onViewBookingDetail }: WorkQueueProps) {
  // Removed old search state - using searchTerm instead
  const [statusFilter, setStatusFilter] = useState('all')

  // Initialize with current date in local timezone
  const getCurrentDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [selectedDate, setSelectedDate] = useState(getCurrentDateString())
  const [dateFilterType, setDateFilterType] = useState<'custom' | 'today' | 'thisWeek' | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set())

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // Hàng mỗi trang

  // Virtualization state (windowed rows)
  const ROW_HEIGHT = 64 // px, ước lượng chiều cao mỗi hàng (bao gồm border)
  const VIEWPORT_HEIGHT = 520 // px
  const BUFFER_ROWS = 6
  const [virtStart, setVirtStart] = useState(0)
  const [virtEnd, setVirtEnd] = useState(20)
  const virtContainerRef = React.useRef<HTMLDivElement | null>(null)

  // Search state
  const [searchTerm, setSearchTerm] = useState('')

  // Additional filters
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all')
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showAddFilterMenu, setShowAddFilterMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  // Show only key statuses by default (set true to show all by default)
  const [showAllStatusesToggle, setShowAllStatusesToggle] = useState(true)

  const getServiceTypeLabel = (val: string) => {
    if (val === 'maintenance') return 'Bảo dưỡng'
    if (val === 'repair') return 'Sửa chữa'
    if (val === 'inspection') return 'Kiểm tra'
    return 'Tất cả vai trò'
  }
  const getStatusLabel = (val: string) => {
    if (val === 'PENDING') return 'Chờ xác nhận'
    if (val === 'CONFIRMED') return 'Đã xác nhận'
    if (val === 'CHECKED_IN') return 'Đã check-in'
    if (val === 'IN_PROGRESS') return 'Đang làm việc'
    if (val === 'COMPLETED') return 'Hoàn thành'
    if (val === 'PAID') return 'Đã thanh toán'
    if (val === 'CANCELLED') return 'Đã hủy'
    return 'Tất cả trạng thái'
  }

  const toggleAllSelected = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedWork.map(w => w.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleRowSelected = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  // Sort state - Default: bookingId desc (mới nhất)
  const [sortBy, setSortBy] = useState<'bookingId' | 'customer' | 'serviceName' | 'status' | 'createdAt' | 'scheduledDate'>('bookingId')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  // Expandable checklist & rating
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null)
  const [workIdToChecklist, setWorkIdToChecklist] = useState<Record<number, { resultId: number; partId: number; partName?: string; description?: string; result?: string; notes?: string }[]>>({})
  const [workIdToRating, setWorkIdToRating] = useState<Record<number, number>>({})

  // Lấy thông tin user từ store và resolve đúng technicianId
  const user = useAppSelector((state) => state.auth.user)
  const [technicianId, setTechnicianId] = useState<number | null>(null)

  // Resolve technicianId bằng cách gọi API để lấy technicianId chính xác từ userId
  useEffect(() => {
    const resolveTechnicianId = async () => {
      // Reset technicianId khi user thay đổi
      setTechnicianId(null)
      setWorkQueue([])
      setCurrentPage(1)

      // 1) Thử lấy từ localStorage trước (đã lưu trước đó) - cache theo userId
      const userId = user?.id
      if (userId) {
        try {
          const cacheKey = `technicianId_${userId}`
          const cached = localStorage.getItem(cacheKey)
          if (cached) {
            const parsed = Number(cached)
            if (Number.isFinite(parsed) && parsed > 0) {
              setTechnicianId(parsed)
              return
            }
          }
        } catch {}

        // 2) Gọi API để lấy technicianId chính xác từ userId
        if (Number.isFinite(Number(userId))) {
          try {
            const result = await TechnicianService.getTechnicianIdByUserId(Number(userId))

            if (result?.success && result?.data?.technicianId) {
              setTechnicianId(result.data.technicianId)
              // Cache lại để lần sau nhanh hơn - cache theo userId
              try {
                const cacheKey = `technicianId_${userId}`
                localStorage.setItem(cacheKey, String(result.data.technicianId))
              } catch {}
              return
            }
          } catch (e) {
            setTechnicianId(null)
            return
          }
        }
      }

      // 3) Fallback: null nếu không resolve được
      setTechnicianId(null)
    }

    resolveTechnicianId()
  }, [user?.id]) // Thay đổi dependency từ [user] thành [user?.id] để chỉ trigger khi userId thay đổi

  const [workQueue, setWorkQueue] = useState<WorkOrder[]>([])

  // Function để fetch bookings từ API
  const fetchTechnicianBookings = useCallback(async (date?: string, preservePage: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      // Clear work queue trước khi fetch data mới
      setWorkQueue([])

      if (!technicianId) {
        setWorkQueue([])
        return
      }

      const response: TechnicianBookingResponse = await TechnicianService.getTechnicianBookings(technicianId, date)

      // Lấy bookings từ response - xử lý nhiều format khác nhau
      let bookingsData: TechnicianBooking[] = []

      if (response?.success && response?.data?.bookings) {
        // Format: {success: true, data: {bookings: [...]}}
        bookingsData = response.data.bookings
      } else if (response?.data && Array.isArray(response.data)) {
        // Format: {success: true, data: [...]}
        bookingsData = response.data
      } else if (Array.isArray(response)) {
        // Format: [...] (direct array)
        bookingsData = response
      } else if (response?.bookings && Array.isArray(response.bookings)) {
        // Format: {bookings: [...]}
        bookingsData = response.bookings
      }

      // Helper: chuẩn hóa giờ phút từ slot
      const normalizeTime = (raw?: string): string => {
        if (!raw) return '00:00'
        let s = String(raw).trim()
        // Lấy phần đầu nếu là khoảng "hh:mm-hh:mm"
        if (s.includes('-')) s = s.split('-')[0].trim()
        // Loại bỏ ký hiệu SA/CH (vi) hoặc AM/PM
        s = s.replace(/\bSA\b|\bCH\b|am|pm|AM|PM/gi, '').trim()
        // Lấy nhóm giờ:phút
        const match = s.match(/(\d{1,2}):(\d{2})/)
        if (!match) return '00:00'
        let hour = Number(match[1])
        const minute = match[2]
        // Nếu > 23 thì đưa về 00
        if (!Number.isFinite(hour) || hour < 0 || hour > 23) hour = 0
        return `${String(hour).padStart(2, '0')}:${minute}`
      }

      const buildCreatedAt = (b: TechnicianBooking, fallbackDate?: string): string => {
        const raw = b.createdAt || b.createdDate || b.created_at || b.bookingDate
        // Nếu backend trả 0001-01-01... thì coi như invalid
        if (raw && !raw.startsWith('0001-01-01')) return raw
        const datePart = (b.date && !b.date.startsWith('0001-01-01')) ? b.date : (fallbackDate || getCurrentDateString())
        const timePart = normalizeTime(b.slotLabel || b.slotTime)
        try {
          const iso = new Date(`${datePart}T${timePart}:00`).toISOString()
          return iso
        } catch {
          return new Date().toISOString()
        }
      }

      // Kiểm tra nếu bookingsData là array và có length > 0
      if (Array.isArray(bookingsData) && bookingsData.length > 0) {
        // Transform API data to WorkOrder format
        const transformedData: WorkOrder[] = bookingsData.map((booking: TechnicianBooking) => {
          // Ưu tiên createdAt hợp lệ; nếu không, dựng từ date + slot
          const createdAt = buildCreatedAt(booking, date)

          return {
            id: booking.bookingId,
            bookingId: booking.bookingId,
            title: booking.serviceName,
            customer: booking.customerName,
            customerPhone: booking.customerPhone,
            licensePlate: booking.vehiclePlate,
            bikeBrand: '', // Không có trong API
            bikeModel: '', // Không có trong API
            status: mapBookingStatus(booking.status) as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'paid' | 'cancelled',
            priority: 'medium' as 'low' | 'medium' | 'high', // Default priority
            estimatedTime: '1 giờ', // Default time
            description: `Dịch vụ: ${booking.serviceName}`, // Tạo description từ serviceName
            scheduledDate: date || new Date().toISOString().split('T')[0],
            scheduledTime: booking.slotTime.replace(' SA', '').replace(' CH', ''),
            createdAt: createdAt, // Thời gian tạo booking
            serviceType: 'maintenance', // Default service type
            assignedTechnician: '', // Không có trong API
            parts: [], // Không có trong API
            workDate: date || new Date().toISOString().split('T')[0],
            startTime: booking.workStartTime || '',
            endTime: booking.workEndTime || '',
            serviceName: booking.serviceName,
            vehicleId: undefined, // Không có trong API
            centerId: booking.centerId
          }
        })

        setWorkQueue(transformedData)
      } else {
        setWorkQueue([])
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu')
      toast.error(err?.message || 'Không thể tải danh sách công việc')
      setWorkQueue([])
    } finally {
      setLoading(false)
    }
  }, [technicianId])

  // Helper functions để map data
  const mapBookingStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      // Uppercase status từ dropdown
      'PENDING': 'pending',
      'CONFIRMED': 'confirmed',
      'CHECKED_IN': 'checked_in',
      'IN_PROGRESS': 'in_progress',
      'COMPLETED': 'completed',
      'PAID': 'paid',
      'CANCELLED': 'cancelled',
      // Lowercase status từ API
      'pending': 'pending',
      'confirmed': 'confirmed',
      'checked_in': 'checked_in',
      'in_progress': 'in_progress',
      'processing': 'in_progress',
      'completed': 'completed',
      'done': 'completed',
      'paid': 'paid',
      'cancelled': 'cancelled'
    }
    return statusMap[status] || statusMap[status?.toLowerCase()] || 'pending'
  }

  const mapPriority = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'urgent': 'high',
      'high': 'high',
      'medium': 'medium',
      'normal': 'medium',
      'low': 'low'
    }
    return priorityMap[priority?.toLowerCase()] || 'medium'
  }

  // Load data khi component mount và khi date filter thay đổi
  useEffect(() => {
    // Khi dateFilterType là 'today', 'custom' thì fetch data theo ngày cụ thể
    // Còn 'thisWeek', 'all' thì chỉ filter ở client-side (data đã có)
    if (dateFilterType === 'today') {
      const today = getCurrentDateString()
      fetchTechnicianBookings(today, true)
    } else if (dateFilterType === 'custom') {
      fetchTechnicianBookings(selectedDate, true)
    }
    // 'thisWeek', 'all' không fetch, chỉ filter client-side với data đã có
  }, [fetchTechnicianBookings, dateFilterType, selectedDate])

  // Initial load: when technicianId is resolved, fetch without date to get all
  useEffect(() => {
    if (technicianId && workQueue.length === 0) {
      fetchTechnicianBookings(undefined, true)
    }
  }, [technicianId])

  // Realtime: join center-date group and refresh on booking.updated
  useEffect(() => {
    (async () => {
      try {
        const today = getCurrentDateString()
        const firstCenterId = workQueue[0]?.centerId
        if (firstCenterId) await bookingRealtimeService.joinCenterDate(firstCenterId, today)
      } catch {}
    })()
    bookingRealtimeService.setOnBookingUpdated(() => {
      // lightweight refresh
      fetchTechnicianBookings(selectedDate, true)
    })
    return () => { /* no-op cleanup */ }
  }, [workQueue.length, selectedDate])

  // Helper function để lấy date range từ dateFilterType
  const getDateRange = (filterType: typeof dateFilterType): { startDate?: string; endDate?: string } | null => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (filterType) {
      case 'today':
        const todayStr = getCurrentDateString()
        return { startDate: todayStr, endDate: todayStr }
      case 'thisWeek':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay()) // Chủ nhật đầu tuần
        const weekEnd = new Date(today)
        weekEnd.setDate(weekStart.getDate() + 6) // Thứ bảy cuối tuần
        return {
          startDate: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
          endDate: `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
        }
      case 'all':
        return null // Không filter theo ngày
      case 'custom':
        return { startDate: selectedDate, endDate: selectedDate }
      default:
        return null
    }
  }

  const filteredWork = workQueue
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
        const keep = work.status === 'in_progress' || work.status === 'confirmed' || work.status === 'checked_in'
        matchesStatus = matchesStatus && keep
      }

      // Service type filter
      let matchesServiceType = true
      if (serviceTypeFilter && serviceTypeFilter !== 'all') {
        matchesServiceType = work.serviceType === serviceTypeFilter
      }

      // Date filter - filter theo createdAt (thời gian tạo booking)
      let matchesDate = true
      if (dateFilterType !== 'all') {
        const dateRange = getDateRange(dateFilterType)

        // Extract date từ createdAt (format: YYYY-MM-DD)
        const getDateFromCreatedAt = (createdAt: string): string | null => {
          if (!createdAt) return null
          try {
            const date = new Date(createdAt)
            if (isNaN(date.getTime())) return null
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          } catch {
            return null
          }
        }

        const workCreatedDate = work.createdAt ? getDateFromCreatedAt(work.createdAt) : null

        if (dateRange && workCreatedDate) {
          if (dateRange.startDate && dateRange.endDate) {
            // Range filter (tuần này)
            matchesDate = workCreatedDate >= dateRange.startDate && workCreatedDate <= dateRange.endDate
          } else if (dateRange.startDate) {
            // Single date filter (hôm nay)
            matchesDate = workCreatedDate === dateRange.startDate
          }
        } else if (dateFilterType === 'custom' && workCreatedDate) {
          // Custom date filter
          matchesDate = workCreatedDate === selectedDate
        } else if (!workCreatedDate) {
          // Nếu không có createdAt, không match (trừ khi là 'all')
          matchesDate = false
        }
      }

      return matchesSearch && matchesStatus && matchesServiceType && matchesDate
    })
    .sort((a, b) => {
      // Quick sort functionality
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

  // Pagination logic
  const totalPages = Math.ceil(filteredWork.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWork = filteredWork.slice(startIndex, endIndex)

  // Determine virtualization usage
  // Disable virtualization when grouping by slot for simpler UX
  const useGrouping = true
  const useVirtualization = !useGrouping && filteredWork.length > 50
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + BUFFER_ROWS
  const totalRows = useVirtualization ? filteredWork.length : paginatedWork.length
  const displayRows = useVirtualization ? filteredWork.slice(virtStart, Math.min(virtEnd, filteredWork.length)) : paginatedWork

  // Handle scroll to compute virtual window
  const handleVirtScroll = useCallback(() => {
    if (!virtContainerRef.current) return
    const scrollTop = virtContainerRef.current.scrollTop
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - Math.floor(BUFFER_ROWS / 2))
    const end = start + visibleCount
    setVirtStart(start)
    setVirtEnd(end)
  }, [])

  // Initialize virtual window when data changes
  useEffect(() => {
    if (useVirtualization) {
      setVirtStart(0)
      setVirtEnd(visibleCount)
    }
  }, [useVirtualization, filteredWork.length])

  // Group by slot key for UI grouping
  const groupedSlots = useMemo(() => {
    const groups = new Map<string, WorkOrder[]>()
    filteredWork.forEach(w => {
      const key = (w.scheduledTime || '').trim()
      const k = key || '—'
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(w)
    })
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([slotKey, items]) => ({ slotKey, items }))
  }, [filteredWork])


  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, serviceTypeFilter, dateFilterType, selectedDate, sortBy, sortOrder])

  // Sort handlers
  const handleSort = (field: 'bookingId' | 'customer' | 'serviceName' | 'status' | 'createdAt' | 'scheduledDate') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc') // Default to descending
    }
  }

  const getSortIcon = (field: 'bookingId' | 'customer' | 'serviceName' | 'status' | 'createdAt' | 'scheduledDate') => {
    if (sortBy !== field) {
      return <ChevronUp size={14} style={{ opacity: 0.3 }} />
    }
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  // Làm mới: reset tất cả filter về mặc định và refetch theo hôm nay
  const handleRefreshFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('all')
    setServiceTypeFilter('all')
    setDateFilterType('all') // Hiển thị tất cả trong dataset hiện có
    setSortBy('bookingId')
    setSortOrder('desc')
    setCurrentPage(1)
    // Không refetch để giữ "tất cả" theo dataset hiện tại
  }, [])

  // Ensure selectedDate is always current date on mount
  useEffect(() => {
    const currentDateString = getCurrentDateString()
    if (selectedDate !== currentDateString) {
      setSelectedDate(currentDateString)
    }
  }, [])


  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận'
      case 'confirmed': return 'Đã xác nhận'
      case 'checked_in': return 'Đã check-in'
      case 'in_progress': return 'Đang làm việc'
      case 'completed': return 'Hoàn thành'
      case 'paid': return 'Đã thanh toán'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#8b5cf6' // Tím
      case 'confirmed': return '#F97316' // Cam
      case 'checked_in': return '#10B981' // Xanh lá
      case 'in_progress': return '#3B82F6' // Xanh dương
      case 'completed': return '#10B981' // Xanh lá
      case 'paid': return '#3B82F6' // Xanh dương
      case 'cancelled': return '#EF4444' // Đỏ
      default: return '#6B7280' // Xám
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'high': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Thấp'
      case 'medium': return 'Trung bình'
      case 'high': return 'Cao'
      default: return priority
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle size={12} />
      case 'medium': return <Clock size={12} />
      case 'low': return <CheckCircle2 size={12} />
      default: return <AlertTriangle size={12} />
    }
  }

  // Tính toán stats từ workQueue với useMemo để tối ưu performance
  const stats = useMemo(() => {
    const statsData = [
    {
      label: 'Chờ xác nhận',
      value: workQueue.filter(w => w.status === 'pending').length,
      color: '#8b5cf6',
        icon: Clock,
        bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    {
      label: 'Đã xác nhận',
      value: workQueue.filter(w => w.status === 'confirmed').length,
      color: '#3b82f6',
        icon: CheckCircle2,
        bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      label: 'Đang làm việc',
      value: workQueue.filter(w => w.status === 'in_progress').length,
      color: '#8b5cf6',
        icon: Wrench,
        bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    {
      label: 'Hoàn thành',
      value: workQueue.filter(w => w.status === 'completed').length,
      color: '#10b981',
        icon: CheckCircle,
        bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      label: 'Đã thanh toán',
      value: workQueue.filter(w => w.status === 'paid').length,
      color: '#059669',
        icon: Package,
        bgColor: 'rgba(5, 150, 105, 0.1)'
    },
    {
      label: 'Đã hủy',
      value: workQueue.filter(w => w.status === 'cancelled').length,
      color: '#ef4444',
        icon: XCircle,
        bgColor: 'rgba(239, 68, 68, 0.1)'
    }
  ]
    return statsData
  }, [workQueue])

  const handleStatusUpdate = async (e: React.MouseEvent, workId: number, newStatus: string) => {
    e.stopPropagation()
      setUpdatingStatus(prev => new Set(prev).add(workId))
    try {
      // Xác nhận bằng toast tùy biến thay cho window.confirm
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

      if (newStatus === 'in_progress') {
        const ok = await confirmViaToast('Bắt đầu làm việc cho booking này?')
        if (!ok) { setUpdatingStatus(prev => { const s = new Set(prev); s.delete(workId); return s }) ; return }
      }
      if (newStatus === 'completed') {
        const ok = await confirmViaToast('Hoàn thành công việc? Hãy đảm bảo checklist và phụ tùng đã được xác nhận.')
        if (!ok) { setUpdatingStatus(prev => { const s = new Set(prev); s.delete(workId); return s }) ; return }
      }
      if (newStatus === 'cancelled') {
        const ok = await confirmViaToast('Hủy booking này? Hành động không thể hoàn tác.')
        if (!ok) { setUpdatingStatus(prev => { const s = new Set(prev); s.delete(workId); return s }) ; return }
      }
      const response = await api.put(`/Booking/${workId}/status`, {
        status: mapStatusToApi(newStatus)
      })

      if (response.data) {
        toast.success(`Cập nhật trạng thái thành công!`)
        // Refresh the list after successful update
        fetchTechnicianBookings(selectedDate, true) // Preserve current page
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật trạng thái.'
      
      // Kiểm tra nếu lỗi liên quan đến checklist chưa được xác nhận
      const isChecklistError = errorMessage.toLowerCase().includes('checklist') || 
                                errorMessage.toLowerCase().includes('maintenance-checklist') ||
                                (newStatus === 'completed' && (errorMessage.toLowerCase().includes('xác nhận') || errorMessage.toLowerCase().includes('confirm')))
      
      if (isChecklistError) {
        // Format message đơn giản: loại bỏ phần API endpoint và giữ lại thông báo chính
        let displayMessage = errorMessage
        // Loại bỏ phần hướng dẫn gọi API nếu có
        if (displayMessage.includes('Vui lòng gọi API') || displayMessage.includes('/api/')) {
          // Lấy phần trước "Vui lòng gọi API" hoặc trước "/api/"
          const parts = displayMessage.split(/Vui lòng gọi API|\/api\//)
          displayMessage = parts[0].trim()
          if (!displayMessage.endsWith('.')) {
            displayMessage += '.'
          }
        }
        
        toast.error(displayMessage, {
          duration: 5000,
          style: {
            background: '#DC2626',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '450px',
            lineHeight: '1.5'
          }
        })
      } else {
        toast.error(errorMessage, {
          duration: 4000
        })
      }
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev)
        newSet.delete(workId)
        return newSet
      })
    }
  }

  const handleCancelBooking = async (e: React.MouseEvent, workId: number) => {
    e.stopPropagation()
    setUpdatingStatus(prev => new Set(prev).add(workId))
    try {
      const response = await api.put(`/Booking/${workId}/cancel`)

      if (response.data) {
        toast.success(`Hủy booking thành công!`)
        // Refresh the list after successful update
        fetchTechnicianBookings(selectedDate, true) // Preserve current page
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
  }

  // Helper function để map status từ UI sang API format
  const mapStatusToApi = (uiStatus: string): string => {
    if (!uiStatus) return 'PENDING'
    // Normalize to lowercase để xử lý cả chữ HOA và chữ thường
    const normalized = uiStatus.toLowerCase().trim()
    const statusMap: { [key: string]: string } = {
      'pending': 'PENDING',
      'confirmed': 'CONFIRMED',
      'checked_in': 'CHECKED_IN',
      'in_progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'paid': 'PAID',
      'cancelled': 'CANCELLED'
    }
    return statusMap[normalized] || 'PENDING'
  }

  // Helper function để kiểm tra trạng thái có thể chuyển được không
  const canTransitionTo = (currentStatus: string, targetStatus: string): boolean => {
    // Dùng chữ HOA để khớp với mapStatusToApi và dữ liệu từ backend
    const validTransitions: { [key: string]: string[] } = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['CHECKED_IN', 'IN_PROGRESS', 'CANCELLED'],
      'CHECKED_IN': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': ['PAID'],
      'PAID': [],
      'CANCELLED': []
    }

    const currentApiStatus = mapStatusToApi(currentStatus)
    const targetApiStatus = mapStatusToApi(targetStatus)

    return validTransitions[currentApiStatus]?.includes(targetApiStatus) || false
  }


  return (
    <div className="work-queue" style={{
      padding: '0px 16px 16px 16px',
      background: '#fff',
      minHeight: '100vh',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Hàng đợi công việc
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý và theo dõi công việc được giao
          </p>
        </div>
            </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              style={{
                background: '#fff',
                border: `1px solid ${stat.color}20`,
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                cursor: 'default',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: stat.bgColor || 'rgba(139, 92, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color,
                flexShrink: 0
              }}>
                <Icon size={16} />
                </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  lineHeight: '1.2',
                  marginBottom: '2px'
                }}>
                  {stat.value}
                    </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  {stat.label}
                    </div>
                    </div>
                      </div>
          )
        })}
                    </div>

      {/* Toolbar giống Admin Users */}
      <div className="users-toolbar" style={{
        background: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: 'none',
        marginBottom: '16px'
      }}>
        {/* Row 1: Tabs + Search + Actions */}
        <div className="toolbar-top" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* removed tabs */}
           </div>
          {/* Middle: Search */}
          <div className="toolbar-search" style={{ flex: 1, minWidth: '320px' }}>
            <div className="search-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} className="icon" style={{ position: 'absolute', left: '12px', color: '#9CA3AF', pointerEvents: 'none' }} />
              <input
                placeholder="Tìm kiếm theo tên, biển số, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', border: 'none', borderBottom: '1px solid transparent', background: 'transparent', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>
          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowAllStatusesToggle(v => !v)}
              style={{ height: '32px', padding: '0 12px', border: '1px solid #FFD875', borderRadius: '8px', background: showAllStatusesToggle ? '#FFF6D1' : '#FFFFFF', color: '#111827', fontSize: '13px' }}
            >{showAllStatusesToggle ? 'Hiển thị: Tất cả' : 'Hiển thị: Quan trọng'}</button>
          </div>
        </div>
        {/* Row 2: Filters */}
        <div className="toolbar-filters" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Custom dropdown: Vai trò (dịch vụ) */}
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => { setShowRoleMenu(!showRoleMenu); if (!showRoleMenu) setShowStatusMenu(false) }}
              style={{ height: '36px', padding: '0 12px', border: '1px solid var(--border-primary)', borderRadius: '8px', background: '#fff', color: 'var(--text-primary)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={14} /> {getServiceTypeLabel(serviceTypeFilter)}
              <ChevronDown size={14} />
            </button>
            {showRoleMenu && (
              <div style={{ position: 'absolute', zIndex: 20, marginTop: '6px', minWidth: '200px', background: '#fff', border: '1px solid var(--border-primary)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                {[
                  { value: 'all', label: 'Tất cả vai trò' },
                  { value: 'maintenance', label: 'Bảo dưỡng' },
                  { value: 'repair', label: 'Sửa chữa' },
                  { value: 'inspection', label: 'Kiểm tra' }
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => { setServiceTypeFilter(opt.value); setShowRoleMenu(false) }}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Custom dropdown: Trạng thái */}
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => { setShowStatusMenu(!showStatusMenu); if (!showStatusMenu) setShowRoleMenu(false) }}
              style={{ height: '36px', padding: '0 12px', border: '1px solid var(--border-primary)', borderRadius: '8px', background: '#fff', color: 'var(--text-primary)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} /> {getStatusLabel(statusFilter)}
              <ChevronDown size={14} />
            </button>
            {showStatusMenu && (
              <div style={{ position: 'absolute', zIndex: 20, marginTop: '6px', minWidth: '220px', background: '#fff', border: '1px solid var(--border-primary)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                {[
                  { value: 'all', label: 'Tất cả trạng thái' },
                  { value: 'PENDING', label: 'Chờ xác nhận' },
                  { value: 'CONFIRMED', label: 'Đã xác nhận' },
                  { value: 'CHECKED_IN', label: 'Đã check-in' },
                  { value: 'IN_PROGRESS', label: 'Đang làm việc' },
                  { value: 'COMPLETED', label: 'Hoàn thành' },
                  { value: 'PAID', label: 'Đã thanh toán' },
                  { value: 'CANCELLED', label: 'Đã hủy' }
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => { setStatusFilter(opt.value); setShowStatusMenu(false) }}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Add filter (like Admin) */}
          <div style={{ position: 'relative' }}>
            <button type="button"
              onClick={() => setShowAddFilterMenu((v) => !v)}
              style={{ height: '36px', padding: '0 12px', border: '1px dashed var(--border-primary)', borderRadius: '8px', background: '#fff', color: 'var(--text-secondary)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Thêm bộ lọc
            </button>
            {showAddFilterMenu && (
              <div style={{ position: 'absolute', zIndex: 25, marginTop: '6px', minWidth: '180px', background: '#fff', border: '1px solid var(--border-primary)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                <button type="button" onClick={() => { setShowAddFilterMenu(false); setShowRoleMenu(true); setShowStatusMenu(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>Dịch vụ</button>
                <button type="button" onClick={() => { setShowAddFilterMenu(false); setShowStatusMenu(true); setShowRoleMenu(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>Trạng thái</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Work Table */}
      <div style={{
        background: 'var(--bg-card)',
        padding: 0,
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none'
      }}>
              {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: 'var(--text-secondary)'
          }}>
            <RefreshCw size={48} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Đang tải dữ liệu...</p>
                    </div>
        ) : paginatedWork.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: 'var(--text-secondary)'
          }}>
            <Clock size={64} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
              {searchTerm || statusFilter !== 'all' ? 'Không tìm thấy công việc nào' : 'Chưa có công việc nào'}
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {searchTerm || statusFilter !== 'all' ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Hiện tại chưa có công việc nào trong hàng đợi'}
            </p>
                            </div>
                          ) : (
          <>
            <div style={{ display:'flex', justifyContent:'flex-end', margin: '8px 0 6px', color:'var(--text-secondary)', fontSize: 13 }}>
              Tổng số công việc: <strong style={{ marginLeft: 6, color:'var(--text-primary)' }}>{filteredWork.length}</strong>
                    </div>
      <div
        ref={virtContainerRef}
        onScroll={useVirtualization ? handleVirtScroll : undefined}
        style={{ overflow: 'auto', maxHeight: useVirtualization ? `${VIEWPORT_HEIGHT}px` : undefined }}
      >
              <table className="work-queue-table" style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                background: 'var(--bg-card)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                border: 'none'
              }}>
                <thead>
                  <tr className="table-header-yellow" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                    <th className="tq-id-col"
                                  style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'default',
                        userSelect: 'none',
                        transition: 'all 0.2s ease',
                        width: '165px',
                        minWidth: '165px',
                        maxWidth: '165px',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <div className="tq-id-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(() => {
                          const allSel = paginatedWork.length > 0 && selectedIds.size === paginatedWork.length
                          return (
                            <span className="tq-id-checkbox" style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <input
                                type="checkbox"
                                className="tq-id-checkbox-input"
                                checked={allSel}
                                onChange={(e) => toggleAllSelected(e.target.checked)}
                                style={{ width: 16, height: 16, appearance: 'auto', accentColor: '#9CA3AF', margin: 0 }}
                              />
                            </span>
                          )
                        })()}
                        <span>ID</span>
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('customer')}
                      style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span className="th-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Khách hàng
                        <div style={{ display: 'flex', alignItems: 'center', opacity: sortBy === 'customer' ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
                          {getSortIcon('customer')}
                        </div>
                                  </span>
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>
                      <span className="th-inner">Xe</span>
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>
                      <span className="th-inner">Dịch vụ</span>
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>
                      <span className="th-inner">Trạng thái</span>
                    </th>
                    <th
                                  style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'default',
                        userSelect: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span className="th-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Thời gian tạo
                        {/* sort removed */}
                      </span>
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>
                      <span className="th-inner" style={{ justifyContent:'flex-start' }}>Hành động</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {useVirtualization && (
                    <tr>
                      <td colSpan={7} style={{ height: Math.max(virtStart * ROW_HEIGHT, 0), padding: 0, border: 'none' }} />
                    </tr>
                  )}
                  {/* Group by scheduled time (slot) */}
                  {useGrouping && (
                    <>
                      {groupedSlots.map(({ slotKey, items }) => (
                        <React.Fragment key={`slot-${slotKey}`}>
                          <WorkQueueSlotHeader slotKey={slotKey} count={items.length} />
                          {items.map((work, i) => (
                            <React.Fragment key={work.id}>
                              <tr
                                onClick={() => {
                                  setExpandedRowId(prev => (prev === work.id ? null : work.id))
                                  ;(async () => {
                                    if (expandedRowId === work.id) return
                                    if (!work.bookingId) return
                                    try {
                                      // Gọi đúng API theo spec: GET /api/maintenance-checklist/{bookingId}
                                      const checklistRes = await TechnicianService.getMaintenanceChecklist(work.bookingId)
                                      // API có thể trả về: { success, checklistId, status, items: [...] } hoặc { success, data: { items: [...] } }
                                      const items = checklistRes?.items || checklistRes?.data?.items || checklistRes?.data?.results || []
                                      if (items.length > 0 || checklistRes?.success) {
                                        const mapped = items.map((r: any) => ({
                                          resultId: r.resultId,
                                          partId: r.partId, // optional
                                          partName: r.partName, // optional
                                          categoryId: r.categoryId,
                                          categoryName: r.categoryName,
                                          description: r.description,
                                          result: r.result,
                                          notes: r.notes,
                                          status: r.status
                                        }))
                                        setWorkIdToChecklist(prev => ({ ...prev, [work.id]: mapped }))
                                      } else {
                                        setWorkIdToChecklist(prev => ({ ...prev, [work.id]: [] }))
                                      }
                                    } catch (e) {
                                      setWorkIdToChecklist(prev => ({ ...prev, [work.id]: [] }))
                                    }
                                  })()
                                  setWorkIdToRating(prev => ({ ...prev, [work.id]: prev[work.id] || 0 }))
                                }}
                                style={{
                                  borderBottom: '1px solid var(--border-primary)',
                                  transition: 'background-color 0.2s ease',
                                  background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 216, 117, 0.12)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                                }}
                              >
                                <td className="tq-id-col" style={{ padding: '8px 12px', fontSize: '14px', color: '#FFD875', fontWeight: '600', width: '165px', minWidth: '165px', maxWidth: '165px', boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
                                  <div className="tq-id-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="tq-id-checkbox" style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <input
                                        type="checkbox"
                                        className="tq-id-checkbox-input"
                                        checked={selectedIds.has(work.id)}
                                        onChange={(e) => toggleRowSelected(work.id, e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: 16, height: 16, appearance: 'auto', accentColor: '#9CA3AF', margin: 0 }}
                                      />
                                    </span>
                                    <span>#{work.bookingId}</span>
                                  </div>
                                </td>
                                <td onClick={(e) => e.stopPropagation()} style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                  <div style={{ fontWeight: '500' }}>{work.customer}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{work.customerPhone}</div>
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                  <div style={{ fontWeight: '500' }}>{work.licensePlate}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{work.bikeBrand} {work.bikeModel}</div>
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                  <div style={{ fontWeight: '500' }}>{work.title}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  {work.serviceType === 'repair' ? 'Sửa chữa' :
                                   work.serviceType === 'maintenance' ? 'Bảo dưỡng' : 'Kiểm tra'}
                                    </div>
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <span className="status-badge" style={{
                                    backgroundColor: getStatusColor(work.status) + '15',
                                    color: getStatusColor(work.status),
                                    borderColor: getStatusColor(work.status),
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    width: 'fit-content'
                                  }}>
                                    {work.status === 'pending' && <Clock size={12} />}
                                    {work.status === 'confirmed' && <CheckCircle2 size={12} />}
                                    {work.status === 'in_progress' && <Wrench size={12} />}
                                    {work.status === 'completed' && <CheckCircle size={12} />}
                                    {work.status === 'paid' && <Package size={12} />}
                                    {work.status === 'cancelled' && <XCircle size={12} />}
                                    {getStatusText(work.status)}
                                  </span>
                                </div>
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                  {work.createdAt ? (
                                    <>
                                      <div style={{ fontWeight: '500' }}>
                                        {new Date(work.createdAt).toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })}
                                      </div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {new Date(work.createdAt).toLocaleDateString('vi-VN', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>N/A</div>
                                  )}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                                  <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center'
                                  }}>
                                    {/* Bắt đầu */}
                                  <button type="button"
                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(e, work.id, 'in_progress'); }}
                                    disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'in_progress')}
                                    style={{
                                      padding: '8px',
                                      border: '2px solid var(--border-primary)',
                                      borderRadius: '8px',
                                      background: '#6D28D9',
                                      color: '#ffffff',
                                      cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'in_progress')) ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease',
                                      width: '36px',
                                      height: '36px',
                                      opacity: !canTransitionTo(work.status, 'in_progress') ? 0.5 : 1
                                    }}
                                    title={canTransitionTo(work.status, 'in_progress') ? 'Bắt đầu làm việc' : 'Không khả dụng'}
                                  >
                                    {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                  </button>
                                  {/* Hoàn thành */}
                                  <button type="button"
                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(e, work.id, 'completed'); }}
                                    disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'completed')}
                                    style={{
                                      padding: '8px',
                                      border: '2px solid var(--border-primary)',
                                      borderRadius: '8px',
                                      background: '#059669',
                                      color: '#ffffff',
                                      cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'completed')) ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease',
                                      width: '36px',
                                      height: '36px',
                                      opacity: !canTransitionTo(work.status, 'completed') ? 0.5 : 1
                                    }}
                                    title={canTransitionTo(work.status, 'completed') ? 'Hoàn thành công việc' : 'Không khả dụng'}
                                  >
                                    {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                                  </button>
                                  {/* Hủy */}
                                  <button type="button"
                                    onClick={(e) => { e.stopPropagation(); handleCancelBooking(e, work.id); }}
                                    disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'cancelled')}
                                    style={{
                                      padding: '8px',
                                      border: '2px solid var(--border-primary)',
                                      borderRadius: '8px',
                                      background: '#DC2626',
                                      color: '#ffffff',
                                      cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'cancelled')) ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease',
                                      width: '36px',
                                      height: '36px',
                                      opacity: !canTransitionTo(work.status, 'cancelled') ? 0.5 : 1
                                    }}
                                    title={canTransitionTo(work.status, 'cancelled') ? 'Hủy booking' : 'Không khả dụng'}
                                  >
                                    {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                  </button>
                                  </div>
                                </td>
                              </tr>
                              {expandedRowId === work.id && (
                                <WorkQueueRowExpansion
                                  workId={work.id}
                                  bookingId={work.bookingId || work.id}
                                  centerId={work.centerId}
                                  status={work.status}
                                  items={workIdToChecklist[work.id] || []}
                                  onSetItemResult={async (resultId, partId, newResult, notes, replacementInfo) => {
                                    try {
                                      const response = await TechnicianService.updateMaintenanceChecklistItem(
                                        work.bookingId || work.id,
                                        resultId,
                                        newResult,
                                        notes,
                                        replacementInfo
                                      )
                                      if (response?.success) {
                                        setWorkIdToChecklist(prev => {
                                          const arr = (prev[work.id] || []).map((it) => it.resultId === resultId ? { ...it, result: newResult, notes: notes ?? it.notes } : it)
                                          return { ...prev, [work.id]: arr }
                                        })
                                        toast.success('Cập nhật đánh giá thành công')
                                      } else {
                                        toast.error(response?.message || 'Cập nhật đánh giá thất bại')
                                      }
                                    } catch (err: any) {
                                      toast.error('Lỗi khi cập nhật đánh giá')
                                    }
                                  }}
                                  onConfirmChecklist={async () => {
                                    try {
                                      const res = await TechnicianService.confirmMaintenanceChecklist(work.bookingId || work.id)
                                      if (res?.success) toast.success('Đã xác nhận checklist')
                                      else toast.error(res?.message || 'Xác nhận checklist thất bại')
                                    } catch { toast.error('Lỗi khi xác nhận checklist') }
                                  }}
                                  onConfirmParts={async () => {
                                    toast.success('Đã lưu phụ tùng phát sinh')
                                  }}
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                  {!useGrouping && (
                    <>
                      {displayRows.map((work, idx) => (
                        <React.Fragment key={work.id}>
                          <tr
                            onClick={() => {
                              setExpandedRowId(prev => (prev === work.id ? null : work.id))
                              // Load checklist from booking detail API when expanding the row (lazy)
                              ;(async () => {
                                if (expandedRowId === work.id) return
                                if (!work.bookingId) return
                                try {
                                  // Gọi đúng API theo spec: GET /api/maintenance-checklist/{bookingId}
                                  const checklistRes = await TechnicianService.getMaintenanceChecklist(work.bookingId)
                                  // API có thể trả về: { success, checklistId, status, items: [...] } hoặc { success, data: { items: [...] } }
                                  const items = checklistRes?.items || checklistRes?.data?.items || checklistRes?.data?.results || []
                                  if (items.length > 0 || checklistRes?.success) {
                                    const mapped = items.map((r: any) => ({
                                      resultId: r.resultId,
                                      partId: r.partId, // optional
                                      partName: r.partName, // optional
                                      categoryId: r.categoryId,
                                      categoryName: r.categoryName,
                                      description: r.description,
                                      result: r.result,
                                      notes: r.notes,
                                      status: r.status
                                    }))
                                    setWorkIdToChecklist(prev => ({ ...prev, [work.id]: mapped }))
                                  } else {
                                    // No checklist -> empty
                                    setWorkIdToChecklist(prev => ({ ...prev, [work.id]: [] }))
                                  }
                                } catch (e) {
                                  setWorkIdToChecklist(prev => ({ ...prev, [work.id]: [] }))
                                }
                              })()
                              setWorkIdToRating(prev => ({ ...prev, [work.id]: prev[work.id] || 0 }))
                            }}
                                    style={{
                              borderBottom: '1px solid var(--border-primary)',
                              transition: 'background-color 0.2s ease',
                              background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 216, 117, 0.12)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                            }}
                          >
                            <td className="tq-id-col" style={{ padding: '8px 12px', fontSize: '14px', color: '#FFD875', fontWeight: '600', width: '165px', minWidth: '165px', maxWidth: '165px', boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
                              <div className="tq-id-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="tq-id-checkbox" style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <input
                                    type="checkbox"
                                    className="tq-id-checkbox-input"
                                    checked={selectedIds.has(work.id)}
                                    onChange={(e) => toggleRowSelected(work.id, e.target.checked)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ width: 16, height: 16, appearance: 'auto', accentColor: '#9CA3AF', margin: 0 }}
                                  />
                                </span>
                                <span>#{work.bookingId}</span>
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()} style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                              <div style={{ fontWeight: '500' }}>{work.customer}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{work.customerPhone}</div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                              <div style={{ fontWeight: '500' }}>{work.licensePlate}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{work.bikeBrand} {work.bikeModel}</div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                              <div style={{ fontWeight: '500' }}>{work.title}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {work.serviceType === 'repair' ? 'Sửa chữa' :
                               work.serviceType === 'maintenance' ? 'Bảo dưỡng' : 'Kiểm tra'}
                                </div>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span className="status-badge" style={{
                                backgroundColor: getStatusColor(work.status) + '15',
                                color: getStatusColor(work.status),
                                borderColor: getStatusColor(work.status),
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: 'fit-content'
                              }}>
                                {work.status === 'pending' && <Clock size={12} />}
                                {work.status === 'confirmed' && <CheckCircle2 size={12} />}
                                {work.status === 'in_progress' && <Wrench size={12} />}
                                {work.status === 'completed' && <CheckCircle size={12} />}
                                {work.status === 'paid' && <Package size={12} />}
                                {work.status === 'cancelled' && <XCircle size={12} />}
                                {getStatusText(work.status)}
                              </span>
                              {/* action buttons removed from status column */}
                            </div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                              {work.createdAt ? (
                                <>
                                  <div style={{ fontWeight: '500' }}>
                                    {new Date(work.createdAt).toLocaleTimeString('vi-VN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {new Date(work.createdAt).toLocaleDateString('vi-VN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>N/A</div>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                justifyContent: 'flex-start',
                                alignItems: 'center'
                              }}>
                                {/* Bắt đầu */}
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(e, work.id, 'in_progress'); }}
                                  disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'in_progress')}
                                  style={{
                                    padding: '8px',
                                    border: '2px solid var(--border-primary)',
                                    borderRadius: '8px',
                                    background: '#6D28D9',
                                    color: '#ffffff',
                                    cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'in_progress')) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    width: '36px',
                                    height: '36px',
                                    opacity: !canTransitionTo(work.status, 'in_progress') ? 0.5 : 1
                                  }}
                                  title={canTransitionTo(work.status, 'in_progress') ? 'Bắt đầu làm việc' : 'Không khả dụng'}
                                >
                                  {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                </button>
                                {/* Hoàn thành */}
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(e, work.id, 'completed'); }}
                                  disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'completed')}
                                  style={{
                                    padding: '8px',
                                    border: '2px solid var(--border-primary)',
                                    borderRadius: '8px',
                                    background: '#059669',
                                    color: '#ffffff',
                                    cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'completed')) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    width: '36px',
                                    height: '36px',
                                    opacity: !canTransitionTo(work.status, 'completed') ? 0.5 : 1
                                  }}
                                  title={canTransitionTo(work.status, 'completed') ? 'Hoàn thành công việc' : 'Không khả dụng'}
                                >
                                  {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                                </button>
                                {/* Hủy */}
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); handleCancelBooking(e, work.id); }}
                                  disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'cancelled')}
                                  style={{
                                    padding: '8px',
                                    border: '2px solid var(--border-primary)',
                                    borderRadius: '8px',
                                    background: '#DC2626',
                                    color: '#ffffff',
                                    cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'cancelled')) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    width: '36px',
                                    height: '36px',
                                    opacity: !canTransitionTo(work.status, 'cancelled') ? 0.5 : 1
                                  }}
                                  title={canTransitionTo(work.status, 'cancelled') ? 'Hủy booking' : 'Không khả dụng'}
                                >
                                  {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                </button>
                            </div>
                            </td>
                          </tr>
                          {expandedRowId === work.id && (
                            <WorkQueueRowExpansion
                              workId={work.id}
                              bookingId={work.bookingId || work.id}
                              centerId={work.centerId}
                              status={work.status}
                              items={workIdToChecklist[work.id] || []}
                              onSetItemResult={async (resultId, partId, newResult, notes, replacementInfo) => {
                                try {
                                  const response = await TechnicianService.updateMaintenanceChecklistItem(
                                    work.bookingId || work.id,
                                    resultId,
                                    newResult,
                                    notes,
                                    replacementInfo
                                  )
                                  if (response?.success) {
                                    setWorkIdToChecklist(prev => {
                                      const arr = (prev[work.id] || []).map((it) => it.resultId === resultId ? { ...it, result: newResult, notes: notes ?? it.notes } : it)
                                      return { ...prev, [work.id]: arr }
                                    })
                                    toast.success('Cập nhật đánh giá thành công')
                                  } else {
                                    toast.error(response?.message || 'Cập nhật đánh giá thất bại')
                                  }
                                } catch (err: any) {
                                  toast.error('Lỗi khi cập nhật đánh giá')
                                }
                              }}
                              onConfirmChecklist={async () => {
                                try {
                                  const res = await TechnicianService.confirmMaintenanceChecklist(work.bookingId || work.id)
                                  if (res?.success) toast.success('Đã xác nhận checklist')
                                  else toast.error(res?.message || 'Xác nhận checklist thất bại')
                                } catch { toast.error('Lỗi khi xác nhận checklist') }
                              }}
                              onConfirmParts={async () => { toast.success('Đã lưu phụ tùng phát sinh') }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                  {useVirtualization && (
                    <tr>
                      <td colSpan={7} style={{ height: Math.max((totalRows - (virtEnd)) * ROW_HEIGHT, 0), padding: 0, border: 'none' }} />
                    </tr>
                  )}
                </tbody>
              </table>
            {/* footer removed as requested */}
                    </div>
          </>
        )}
          </div>

      {/* Pagination (ẩn khi dùng virtualization) */}
      {!loading && filteredWork.length > 0 && !useVirtualization && (
        <div style={{
          marginTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          background: 'transparent',
          padding: '8px 0'
        }}>
          <div className="pagination-info">
            <span className="pagination-label">Hiển thị</span>
            <span className="pagination-range">
              {startIndex + 1}–{Math.min(endIndex, filteredWork.length)} trong {filteredWork.length} kết quả
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className={`pager-btn ${currentPage === 1 ? 'is-disabled' : ''}`}
            >
              <ChevronsLeft size={16} />
            </button>
            <button type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`pager-btn ${currentPage === 1 ? 'is-disabled' : ''}`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="pager-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pager-btn ${currentPage === page ? 'is-active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`pager-btn ${currentPage === totalPages ? 'is-disabled' : ''}`}
            >
              <ChevronRight size={16} />
            </button>
            <button type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className={`pager-btn ${currentPage === totalPages ? 'is-disabled' : ''}`}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

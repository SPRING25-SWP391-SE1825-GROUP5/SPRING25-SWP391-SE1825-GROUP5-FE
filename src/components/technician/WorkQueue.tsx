import { useState, useEffect, useCallback } from 'react'
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
  ArrowRight
} from 'lucide-react'
import { TechnicianService } from '@/services/technicianService'
import { BookingService } from '@/services/bookingService'
import { useAppSelector } from '@/store/hooks'
import api from '@/services/api'
import toast from 'react-hot-toast'
import StatsCards from './StatsCards'
import WorkQueueToolbar from './WorkQueueToolbar'
import './WorkQueue.scss'
import './DatePicker.scss'

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
  customerName: string
  customerPhone: string
  vehiclePlate: string
  workStartTime: string | null
  workEndTime: string | null
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
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'paid' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  description: string
  scheduledDate: string
  scheduledTime: string
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set())
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // Hiển thị 10 kết quả 1 trang
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')

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
      
      // Kiểm tra nếu bookingsData là array và có length > 0
      if (Array.isArray(bookingsData) && bookingsData.length > 0) {
        // Transform API data to WorkOrder format
        const transformedData: WorkOrder[] = bookingsData.map((booking: TechnicianBooking) => ({
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
          serviceType: 'maintenance', // Default service type
          assignedTechnician: '', // Không có trong API
          parts: [], // Không có trong API
          workDate: date || new Date().toISOString().split('T')[0],
          startTime: booking.workStartTime || '',
          endTime: booking.workEndTime || '',
          serviceName: booking.serviceName,
          vehicleId: undefined, // Không có trong API
          centerId: booking.centerId
        }))
        
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
      'IN_PROGRESS': 'in_progress',
      'COMPLETED': 'completed',
      'PAID': 'paid',
      'CANCELLED': 'cancelled',
      // Lowercase status từ API
      'pending': 'pending',
      'confirmed': 'confirmed', 
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

  // Load data khi component mount và khi date thay đổi
  useEffect(() => {
    fetchTechnicianBookings(selectedDate, true) // Preserve current page
  }, [fetchTechnicianBookings, selectedDate])

  const filteredWork = workQueue
    .filter(work => {
      const matchesSearch = work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           work.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           work.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           work.customerPhone.includes(searchTerm)
      
      // Sửa logic filter status - map từ uppercase sang lowercase
      let matchesStatus = true
      if (statusFilter && statusFilter !== '' && statusFilter !== 'all') {
        // Map status filter từ uppercase sang lowercase để so sánh
        const mappedStatus = mapBookingStatus(statusFilter)
        matchesStatus = work.status === mappedStatus
      }
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Sort theo booking mới nhất (bookingId cao nhất)
      return b.bookingId - a.bookingId
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredWork.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWork = filteredWork.slice(startIndex, endIndex)


  // Reset to first page only when search or status filter changes (not date)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

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
      case 'in_progress': return '#3B82F6' // Xanh dương
      case 'completed': return '#10B981' // Xanh lá
      case 'paid': return '#059669' // Xanh lá đậm
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

  const stats = [
    {
      label: 'Chờ xác nhận',
      value: workQueue.filter(w => w.status === 'pending').length,
      color: '#8b5cf6',
      icon: Clock
    },
    {
      label: 'Đã xác nhận',
      value: workQueue.filter(w => w.status === 'confirmed').length,
      color: '#3b82f6',
      icon: CheckCircle2
    },
    {
      label: 'Đang làm việc',
      value: workQueue.filter(w => w.status === 'in_progress').length,
      color: '#8b5cf6',
      icon: Wrench
    },
    {
      label: 'Hoàn thành',
      value: workQueue.filter(w => w.status === 'completed').length,
      color: '#10b981',
      icon: CheckCircle
    },
    {
      label: 'Đã thanh toán',
      value: workQueue.filter(w => w.status === 'paid').length,
      color: '#059669',
      icon: Package
    },
    {
      label: 'Đã hủy',
      value: workQueue.filter(w => w.status === 'cancelled').length,
      color: '#ef4444',
      icon: XCircle
    }
  ]

  const handleStatusUpdate = async (e: React.MouseEvent, workId: number, newStatus: string) => {
    e.stopPropagation()
    setUpdatingStatus(prev => new Set(prev).add(workId))
    try {
      const response = await api.put(`/Booking/${workId}/status`, { 
        status: mapStatusToApi(newStatus) 
      })
      
      if (response.data) {
        toast.success(`Cập nhật trạng thái thành công!`)
        // Refresh the list after successful update
        fetchTechnicianBookings(selectedDate, true) // Preserve current page
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.')
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

  const handleViewBookingDetail = (bookingId: number) => {
    if (onViewBookingDetail) {
      onViewBookingDetail(bookingId)
    }
  }

  // Helper function để map status từ UI sang API format
  const mapStatusToApi = (uiStatus: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'PENDING',
      'confirmed': 'CONFIRMED',
      'in_progress': 'IN_PROGRESS', 
      'completed': 'COMPLETED',
      'paid': 'PAID',
      'cancelled': 'CANCELLED'
    }
    return statusMap[uiStatus] || 'PENDING'
  }

  // Helper function để kiểm tra trạng thái có thể chuyển được không
  const canTransitionTo = (currentStatus: string, targetStatus: string): boolean => {
    const validTransitions: { [key: string]: string[] } = {
      'pending': ['CONFIRMED', 'CANCELLED'],
      'confirmed': ['IN_PROGRESS', 'CANCELLED'],
      'in_progress': ['COMPLETED', 'CANCELLED'], // Đổi từ CONFIRMED thành COMPLETED
      'completed': ['PAID'],
      'paid': [], // Terminal state
      'cancelled': [] // Terminal state
    }
    
    const currentApiStatus = mapStatusToApi(currentStatus)
    const targetApiStatus = mapStatusToApi(targetStatus)
    
    return validTransitions[currentApiStatus]?.includes(targetApiStatus) || false
  }


  return (
    <div className="work-queue">
      {/* Main Content Area */}
      <div className="work-queue__main">

        {/* Enhanced Stats Cards with Colors */}
        <StatsCards stats={stats} />

        {/* Main Content Card */}
        <div className="work-queue__main-card">
          {/* Compact Toolbar */}
          <WorkQueueToolbar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            loading={loading}
              onRefresh={() => fetchTechnicianBookings(selectedDate, true)} // Preserve current page
          />

          {/* Work List */}
          <div className="work-queue__list-container">
            {/* Compact List Header */}
            <div className="work-queue__list-header">
              <div className="work-queue__list-header__item">ID</div>
              <div className="work-queue__list-header__item">Khách hàng</div>
              <div className="work-queue__list-header__item">Xe</div>
              <div className="work-queue__list-header__item">Dịch vụ</div>
              <div className="work-queue__list-header__item">Trạng thái</div>
              <div className="work-queue__list-header__item">Thời gian</div>
              <div className="work-queue__list-header__item">Hành động</div>
            </div>

            {/* Work Items List */}
            <div 
              className="work-queue__list"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {loading ? (
                <div className="work-queue__loading">
                  <RefreshCw size={24} className="animate-spin" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : paginatedWork.length > 0 ? (
                paginatedWork.map((work) => (
                <div key={work.id}>
                  {/* Main Work Card */}
                  <div 
                    className="work-queue__list__item"
                    onClick={() => handleViewBookingDetail(work.bookingId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="work-queue__list__item__cell">
                      <div className="work-queue__list__item__cell__primary" style={{ color: '#FFD875', fontWeight: '600' }}>#{work.bookingId}</div>
                    </div>
                    <div className="work-queue__list__item__cell">
                      <div className="work-queue__list__item__cell__primary">{work.customer}</div>
                      <div className="work-queue__list__item__cell__secondary">{work.customerPhone}</div>
                    </div>
                    <div className="work-queue__list__item__cell">
                      <div className="work-queue__list__item__cell__primary">{work.licensePlate}</div>
                      <div className="work-queue__list__item__cell__secondary">{work.bikeBrand} {work.bikeModel}</div>
                    </div>
                    <div className="work-queue__list__item__cell">
                      <div className="work-queue__list__item__cell__primary">{work.title}</div>
                      <div className="work-queue__list__item__cell__secondary">
                        {work.serviceType === 'repair' ? 'Sửa chữa' : 
                         work.serviceType === 'maintenance' ? 'Bảo dưỡng' : 'Kiểm tra'}
                      </div>
                    </div>
                    <div className="work-queue__list__item__cell">
                      {/* Show status badge and buttons for non-terminal states */}
                      {!['completed', 'paid', 'cancelled'].includes(work.status) ? (
                        <div className="work-queue__list__item__status-container">
                          {/* Sử dụng terminal-status style cho confirmed */}
                          {work.status === 'confirmed' ? (
                            <div className="work-queue__list__item__terminal-status">
                              <div className="work-queue__list__item__terminal-status__info">
                                <div 
                                  className="work-queue__list__item__terminal-status__icon"
                                  style={{ 
                                    backgroundColor: getStatusColor(work.status) + '15',
                                    color: getStatusColor(work.status)
                                  }}
                                >
                                  <CheckCircle2 size={14} />
                                </div>
                                <div className="work-queue__list__item__terminal-status__text">
                                  <span 
                                    className="work-queue__list__item__terminal-status__value"
                                    style={{ color: getStatusColor(work.status) }}
                                  >
                                    {getStatusText(work.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="work-queue__list__item__terminal-status">
                              <div className="work-queue__list__item__terminal-status__info">
                                <div 
                                  className="work-queue__list__item__terminal-status__icon"
                                  style={{ 
                                    backgroundColor: work.status === 'pending' ? '#8b5cf6' + '15' : getStatusColor(work.status) + '15',
                                    color: work.status === 'pending' ? '#8b5cf6' : getStatusColor(work.status)
                                  }}
                                >
                                  {work.status === 'pending' && <Clock size={14} />}
                                  {work.status === 'in_progress' && <Wrench size={14} />}
                                </div>
                                <div className="work-queue__list__item__terminal-status__text">
                                  <span 
                                    className="work-queue__list__item__terminal-status__value"
                                    style={{ color: work.status === 'pending' ? '#8b5cf6' : getStatusColor(work.status) }}
                                  >
                                    {getStatusText(work.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Status change buttons */}
                          <div className="work-queue__list__item__status-actions">

                            {/* CONFIRMED -> IN_PROGRESS */}
                            {work.status === 'confirmed' && canTransitionTo(work.status, 'in_progress') && (
                              <button
                                className="work-queue__list__item__status-btn work-queue__list__item__status-btn--start"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdate(e, work.id, 'in_progress')
                                }}
                                disabled={updatingStatus.has(work.id)}
                                title="Bắt đầu làm việc"
                              >
                                {updatingStatus.has(work.id) ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Play size={14} />
                                )}
                              </button>
                            )}

                            {/* IN_PROGRESS -> COMPLETED */}
                            {work.status === 'in_progress' && canTransitionTo(work.status, 'completed') && (
                              <button
                                className="work-queue__list__item__status-btn work-queue__list__item__status-btn--complete"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdate(e, work.id, 'completed')
                                }}
                                disabled={updatingStatus.has(work.id)}
                                title="Hoàn thành công việc"
                              >
                                {updatingStatus.has(work.id) ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Flag size={14} />
                                )}
                              </button>
                            )}


                            {/* Cancel button for non-terminal states */}
                            {!['paid', 'cancelled'].includes(work.status) && canTransitionTo(work.status, 'cancelled') && (
                              <button
                                className="work-queue__list__item__status-btn work-queue__list__item__status-btn--cancel"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelBooking(e, work.id)
                                }}
                                disabled={updatingStatus.has(work.id)}
                                title="Hủy booking"
                              >
                                {updatingStatus.has(work.id) ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <XCircle size={14} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Show terminal status box for completed/paid/cancelled states */
                        <div className="work-queue__list__item__terminal-status">
                          <div className="work-queue__list__item__terminal-status__info">
                            <div 
                              className="work-queue__list__item__terminal-status__icon"
                              style={{ 
                                backgroundColor: getStatusColor(work.status) + '15',
                                color: getStatusColor(work.status)
                              }}
                            >
                              {work.status === 'completed' && <CheckCircle size={14} />}
                              {work.status === 'paid' && <Package size={14} />}
                              {work.status === 'cancelled' && <XCircle size={14} />}
                            </div>
                            <div className="work-queue__list__item__terminal-status__text">
                              <span 
                                className="work-queue__list__item__terminal-status__value"
                                style={{ 
                                  color: getStatusColor(work.status),
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}
                              >
                                {getStatusText(work.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="work-queue__list__item__cell">
                      <div className="work-queue__list__item__cell__primary">{work.scheduledTime}</div>
                      <div className="work-queue__list__item__cell__secondary">{work.scheduledDate}</div>
                    </div>
                    <div className="work-queue__list__item__cell">
                      <div className="work-queue__list__item__actions">
                        <button
                          className="work-queue__list__item__action-btn work-queue__list__item__action-btn--view"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewBookingDetail(work.bookingId)
                          }}
                          title="Xem chi tiết"
                          style={{ background: '#FFD875', color: '#000000' }}
                        >
                          <Eye size={16} />
                        </button>
                        
                        {/* Nút xác nhận - hiển thị luôn nhưng disable khi không phù hợp */}
                        <button
                          className="work-queue__list__item__action-btn work-queue__list__item__action-btn--confirm"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (work.status === 'pending') {
                              handleStatusUpdate(e, work.id, 'confirmed')
                            }
                          }}
                          disabled={updatingStatus.has(work.id) || work.status !== 'pending'}
                          title={work.status === 'pending' ? 'Xác nhận' : 'Không thể xác nhận'}
                          style={{ 
                            background: work.status === 'pending' ? '#3b82f6' : '#e5e7eb',
                            color: work.status === 'pending' ? '#ffffff' : '#9ca3af',
                            cursor: work.status === 'pending' ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        
                        {/* Nút bắt đầu - hiển thị luôn nhưng disable khi không phù hợp */}
                        <button
                          className="work-queue__list__item__action-btn work-queue__list__item__action-btn--start"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (work.status === 'confirmed') {
                              handleStatusUpdate(e, work.id, 'in_progress')
                            }
                          }}
                          disabled={updatingStatus.has(work.id) || work.status !== 'confirmed'}
                          title={work.status === 'confirmed' ? 'Bắt đầu làm việc' : 'Không thể bắt đầu'}
                          style={{ 
                            background: work.status === 'confirmed' ? '#8b5cf6' : '#e5e7eb',
                            color: work.status === 'confirmed' ? '#ffffff' : '#9ca3af',
                            cursor: work.status === 'confirmed' ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        </button>
                        
                        {/* Nút hoàn thành - đổi từ in_progress sang completed */}
                        <button
                          className="work-queue__list__item__action-btn work-queue__list__item__action-btn--complete"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (work.status === 'in_progress') {
                              handleStatusUpdate(e, work.id, 'completed')
                            }
                          }}
                          disabled={updatingStatus.has(work.id) || work.status !== 'in_progress'}
                          title={work.status === 'in_progress' ? 'Hoàn thành công việc' : 'Không thể hoàn thành'}
                          style={{ 
                            background: work.status === 'in_progress' ? '#10b981' : '#e5e7eb',
                            color: work.status === 'in_progress' ? '#ffffff' : '#9ca3af',
                            cursor: work.status === 'in_progress' ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                        </button>
                        
                        
                        {/* Nút hủy - sử dụng API cancel */}
                        <button
                          className="work-queue__list__item__action-btn work-queue__list__item__action-btn--cancel"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (work.status !== 'completed' && work.status !== 'paid' && work.status !== 'cancelled') {
                              handleCancelBooking(e, work.id)
                            }
                          }}
                          disabled={updatingStatus.has(work.id) || ['completed', 'paid', 'cancelled'].includes(work.status)}
                          title={!['completed', 'paid', 'cancelled'].includes(work.status) ? 'Hủy booking' : 'Không thể hủy'}
                          style={{ 
                            background: !['completed', 'paid', 'cancelled'].includes(work.status) ? '#ef4444' : '#e5e7eb',
                            color: !['completed', 'paid', 'cancelled'].includes(work.status) ? '#ffffff' : '#9ca3af',
                            cursor: !['completed', 'paid', 'cancelled'].includes(work.status) ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))
              ) : (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  margin: '1rem 0'
                }}>
                  <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                    {searchTerm || statusFilter !== '' ? 'Không tìm thấy công việc phù hợp' : 'Chưa có công việc nào'}
                  </div>
                  <div>
                    {searchTerm || statusFilter !== '' ? 'Hãy thử điều chỉnh bộ lọc để tìm kiếm công việc khác' : 'Hiện tại chưa có công việc nào trong hàng đợi'}
                  </div>
                </div>
              )}
            </div>
          </div>

      {/* Pagination */}
      {!loading && filteredWork.length > 0 && (
        <div 
          className="work-queue__pagination"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            background: 'white',
            borderTop: '1px solid #e5e7eb',
            marginTop: '1rem',
            marginBottom: '2rem' // Thêm margin bottom để có thể scroll đến
          }}
        >
          <div className="work-queue__pagination__info">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredWork.length)} trong {filteredWork.length} kết quả
          </div>
          <div className="work-queue__pagination__controls">
            <button
              className="work-queue__pagination__button"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1
              }}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            
            <div className="work-queue__pagination__pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`work-queue__pagination__page ${
                    currentPage === page ? 'work-queue__pagination__page--active' : ''
                  }`}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    border: '1px solid #e5e7eb',
                    background: currentPage === page ? '#FFD875' : 'white',
                    color: currentPage === page ? '#000000' : '#374151',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 0.125rem'
                  }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              className="work-queue__pagination__button"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      )}
          </div>
      </div>
    </div>
  )
}
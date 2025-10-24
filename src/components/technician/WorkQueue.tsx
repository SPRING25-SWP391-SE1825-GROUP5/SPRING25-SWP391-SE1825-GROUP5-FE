import { useState, useEffect } from 'react'
import { 
  Search, 
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
  Calendar,
  RefreshCw
} from 'lucide-react'
import { TechnicianService } from '@/services/technicianService'
import { BookingService } from '@/services/bookingService'
import { useAppSelector } from '@/store/hooks'
import toast from 'react-hot-toast'
import './WorkQueue.scss'

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
  onViewDetails: (work: WorkOrder) => void
}

export default function WorkQueue({ onViewDetails }: WorkQueueProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
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
  const itemsPerPage = 5

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
      setExpandedRows(new Set())
      
      // 1) Thử lấy từ localStorage trước (đã lưu trước đó) - cache theo userId
      const userId = user?.id
      if (userId) {
        try {
          const cacheKey = `technicianId_${userId}`
          const cached = localStorage.getItem(cacheKey)
          if (cached) {
            const parsed = Number(cached)
            if (Number.isFinite(parsed) && parsed > 0) {
              console.log('✅ Using cached technicianId:', parsed, 'for userId:', userId)
              setTechnicianId(parsed)
              return
            }
          }
        } catch {}

        // 2) Gọi API để lấy technicianId chính xác từ userId
        if (Number.isFinite(Number(userId))) {
          try {
            console.log('🔍 Resolving technicianId for userId:', userId)
            const result = await TechnicianService.getTechnicianIdByUserId(Number(userId))
            
            if (result?.technicianId) {
              console.log('✅ Resolved technicianId:', result.technicianId, 'for userId:', userId)
              setTechnicianId(result.technicianId)
              // Cache lại để lần sau nhanh hơn - cache theo userId
              try { 
                const cacheKey = `technicianId_${userId}`
                localStorage.setItem(cacheKey, String(result.technicianId)) 
              } catch {}
              return
            }
          } catch (e) {
            console.warn('Could not resolve technicianId for userId:', userId, e)
            // Không dùng fallback vì userId không phải technicianId
            console.log('⚠️ Could not resolve technicianId, skipping bookings fetch')
            setTechnicianId(null)
            return
          }
        }
      }

      // 3) Fallback: null nếu không resolve được
      console.log('⚠️ Could not resolve technicianId')
      setTechnicianId(null)
    }

    resolveTechnicianId()
  }, [user?.id]) // Thay đổi dependency từ [user] thành [user?.id] để chỉ trigger khi userId thay đổi

  const [workQueue, setWorkQueue] = useState<WorkOrder[]>([])

  // Function để fetch bookings từ API
  const fetchTechnicianBookings = async (date?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      if (!technicianId) {
        console.log('TechnicianId is not resolved yet, skipping bookings fetch')
        setWorkQueue([])
        return
      }
      const response = await TechnicianService.getTechnicianBookings(technicianId, date)
      
      console.log('API Response:', response) // Debug log
      
      // Kiểm tra cấu trúc response và lấy data array
      let bookingsData = []
      
      if (response?.success && response?.data) {
        // Case 1: response.data là array
        if (Array.isArray(response.data)) {
          bookingsData = response.data
        }
        // Case 2: response.data có property chứa array
        else if (response.data.bookings && Array.isArray(response.data.bookings)) {
          bookingsData = response.data.bookings
        }
        // Case 3: response.data có property khác chứa array
        else if (response.data.items && Array.isArray(response.data.items)) {
          bookingsData = response.data.items
        }
        // Case 4: response.data có property results
        else if (response.data.results && Array.isArray(response.data.results)) {
          bookingsData = response.data.results
        }
      }
      // Case 5: response trực tiếp là array
      else if (Array.isArray(response)) {
        bookingsData = response
      }
      // Case 6: response.data trực tiếp là array (không có success flag)
      else if (Array.isArray(response?.data)) {
        bookingsData = response.data
      }
      
      console.log('Bookings Data:', bookingsData) // Debug log
      
      // Kiểm tra nếu bookingsData là array và có length > 0
      if (Array.isArray(bookingsData) && bookingsData.length > 0) {
        // Transform API data to WorkOrder format
        const transformedData: WorkOrder[] = bookingsData.map((booking: any) => ({
          id: booking.bookingId || booking.id,
          bookingId: booking.bookingId || booking.id,
          title: booking.serviceName || booking.title || 'Dịch vụ bảo dưỡng',
          customer: booking.customerName || booking.customer || 'Khách hàng',
          customerPhone: booking.customerPhone || booking.phone || '',
          customerEmail: booking.customerEmail || booking.email,
          licensePlate: booking.licensePlate || booking.vehiclePlate || '',
          bikeBrand: booking.vehicleBrand || booking.brand,
          bikeModel: booking.vehicleModel || booking.model,
          status: mapBookingStatus(booking.status) as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'paid' | 'cancelled',
          priority: mapPriority(booking.priority) as 'low' | 'medium' | 'high',
          estimatedTime: booking.estimatedTime || booking.duration || '1 giờ',
          description: booking.description || booking.notes || 'Không có mô tả',
          scheduledDate: booking.workDate || booking.scheduledDate || booking.date,
          scheduledTime: booking.startTime || booking.scheduledTime || booking.time,
          serviceType: booking.serviceType || 'maintenance',
          assignedTechnician: booking.technicianName || booking.assignedTechnician,
          parts: booking.parts || booking.requiredParts || [],
          workDate: booking.workDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          serviceName: booking.serviceName,
          vehicleId: booking.vehicleId,
          centerId: booking.centerId
        }))
        
        setWorkQueue(transformedData)
      } else {
        console.log('No bookings data found or empty array')
        setWorkQueue([])
        // Không hiển thị error nếu không có data, chỉ log
        if (bookingsData.length === 0) {
          console.log('No bookings found for the selected date')
        }
      }
    } catch (err: any) {
      console.error('Error fetching technician bookings:', err)
      setError(err?.message || 'Không thể tải dữ liệu')
      toast.error('Không thể tải danh sách công việc')
      
      // Set empty array instead of mock data
      setWorkQueue([])
    } finally {
      setLoading(false)
    }
  }

  // Helper functions để map data
  const mapBookingStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'pending',
      'confirmed': 'confirmed', 
      'in_progress': 'in_progress',
      'processing': 'in_progress',
      'completed': 'completed',
      'done': 'completed',
      'paid': 'paid',
      'cancelled': 'cancelled'
    }
    return statusMap[status?.toLowerCase()] || 'pending'
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
    fetchTechnicianBookings(selectedDate)
  }, [technicianId, selectedDate])

  const filteredWork = workQueue.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(search.toLowerCase()) ||
                         work.customer.toLowerCase().includes(search.toLowerCase()) ||
                         work.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
                         work.customerPhone.includes(search)
    const matchesStatus = statusFilter === 'all' || work.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredWork.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWork = filteredWork.slice(startIndex, endIndex)


  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, selectedDate])

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
      case 'pending': return '#F59E0B' // Vàng
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
      color: '#f59e0b',
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
    }
  ]

  const handleStatusUpdate = async (workId: number, newStatus: string) => {
    try {
      // Thêm workId vào set updating để hiển thị loading
      setUpdatingStatus(prev => new Set(prev).add(workId))
      
      // Map status từ UI sang API format
      const apiStatus = mapStatusToApi(newStatus)
      
      console.log('🔄 Updating booking status:', { workId, newStatus, apiStatus })
      
      // Gọi API để cập nhật trạng thái
      await BookingService.updateBookingStatus(workId, apiStatus)
      
      // Cập nhật local state nếu API thành công
      setWorkQueue(prev => prev.map(work => 
        work.id === workId ? { ...work, status: newStatus as any } : work
      ))
      
      // Hiển thị thông báo thành công
      const statusText = getStatusText(newStatus)
      toast.success(`Đã cập nhật trạng thái thành: ${statusText}`)
      
      // Làm mới dữ liệu để đồng bộ với server
      await fetchTechnicianBookings(selectedDate)
      
    } catch (error: any) {
      console.error('❌ Error updating booking status:', error)
      toast.error(error.message || 'Không thể cập nhật trạng thái')
    } finally {
      // Xóa workId khỏi set updating
      setUpdatingStatus(prev => {
        const newSet = new Set(prev)
        newSet.delete(workId)
        return newSet
      })
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
      'in_progress': ['COMPLETED', 'CANCELLED'],
      'completed': ['PAID'],
      'paid': [], // Terminal state
      'cancelled': [] // Terminal state
    }
    
    const currentApiStatus = mapStatusToApi(currentStatus)
    const targetApiStatus = mapStatusToApi(targetStatus)
    
    return validTransitions[currentApiStatus]?.includes(targetApiStatus) || false
  }

  const toggleRowExpansion = (workId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(workId)) {
        newSet.delete(workId)
      } else {
        newSet.add(workId)
      }
      return newSet
    })
  }

  return (
    <div className="work-queue">
      {/* Main Content Area */}
        <div 
          className="work-queue__main"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#F3F4F6',
            padding: '1.5rem',
            gap: '1.5rem'
          }}
        >
      {/* Header */}
      <div className="work-queue__header">
          <h1 className="work-queue__header__title">Hàng đợi công việc</h1>
      </div>

        {/* Stats Cards */}
      <div className="work-queue__stats">
        {stats.map((stat, index) => (
          <div key={index} className="work-queue__stats__card">
              <div 
                className="work-queue__stats__card__icon"
                style={{ backgroundColor: stat.color + '15', color: stat.color }}
              >
                <stat.icon size={20} />
              </div>
              <div className="work-queue__stats__card__content">
                <div className="work-queue__stats__card__content__value">{stat.value}</div>
                <div className="work-queue__stats__card__content__label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

        {/* Main Content Card */}
        <div className="work-queue__main-card">
          {/* Toolbar */}
          <div className="work-queue__toolbar">
            {/* Date and Controls Row */}
            <div className="work-queue__toolbar__date-row">
              <div className="work-queue__toolbar__date-controls">
                <Calendar size={16} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="work-queue__toolbar__date-input"
                />
                <button
                  onClick={() => fetchTechnicianBookings(selectedDate)}
                  disabled={loading}
                  className="work-queue__toolbar__refresh-btn"
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
              </div>
              
              {error && (
                <div className="work-queue__toolbar__error">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Search and Filter Row */}
            <div className="work-queue__toolbar__search-wrapper">
              <input
                type="text"
                placeholder="Tìm theo tên khách hàng, biển số, mã công việc..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="work-queue__toolbar__search__input"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="work-queue__toolbar__filters__select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="in_progress">Đang làm việc</option>
                <option value="completed">Hoàn thành</option>
                <option value="paid">Đã thanh toán</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Action Buttons */}
          </div>

          {/* Work List */}
          <div className="work-queue__list-container">
            {/* List Header */}
            <div className="work-queue__list-header">
              <div className="work-queue__list-header__item">Khách hàng</div>
              <div className="work-queue__list-header__item">Xe</div>
              <div className="work-queue__list-header__item">Dịch vụ</div>
              <div className="work-queue__list-header__item">Trạng thái</div>
              <div className="work-queue__list-header__item">Hẹn lúc</div>
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
              ) : (
                paginatedWork.map((work) => (
                <div key={work.id}>
                  {/* Main Work Card */}
                  <div 
                    className="work-queue__list__item"
                    onClick={() => toggleRowExpansion(work.id)}
                  >
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
                          <span 
                            className={`work-queue__list__item__status work-queue__list__item__status--${work.status}`}
                            style={{ 
                              backgroundColor: getStatusColor(work.status) + '15',
                              color: getStatusColor(work.status),
                              borderColor: getStatusColor(work.status) + '40'
                            }}
                          >
                            {getStatusText(work.status)}
                          </span>
                          
                          {/* Status change buttons */}
                          <div className="work-queue__list__item__status-actions">
                            {/* PENDING -> CONFIRMED */}
                            {work.status === 'pending' && canTransitionTo(work.status, 'confirmed') && (
                              <button
                                className="work-queue__list__item__status-btn work-queue__list__item__status-btn--confirm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdate(work.id, 'confirmed')
                                }}
                                disabled={updatingStatus.has(work.id)}
                                title="Xác nhận"
                              >
                                {updatingStatus.has(work.id) ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                              </button>
                            )}

                            {/* CONFIRMED -> IN_PROGRESS */}
                            {work.status === 'confirmed' && canTransitionTo(work.status, 'in_progress') && (
                              <button
                                className="work-queue__list__item__status-btn work-queue__list__item__status-btn--start"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdate(work.id, 'in_progress')
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
                                  handleStatusUpdate(work.id, 'completed')
                                }}
                                disabled={updatingStatus.has(work.id)}
                                title="Hoàn thành"
                              >
                                {updatingStatus.has(work.id) ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={14} />
                                )}
                              </button>
                            )}

                            {/* COMPLETED -> PAID */}
                            {work.status === 'completed' && canTransitionTo(work.status, 'paid') && (
                              <button
                                className="work-queue__list__item__status-btn work-queue__list__item__status-btn--paid"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdate(work.id, 'paid')
                                }}
                                disabled={updatingStatus.has(work.id)}
                                title="Đánh dấu đã thanh toán"
                              >
                                {updatingStatus.has(work.id) ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Package size={14} />
                                )}
                              </button>
                            )}

                            {/* Cancel button for non-terminal states */}
                            {!['paid', 'cancelled'].includes(work.status) && canTransitionTo(work.status, 'cancelled') && (
                              <button
                                className="work-queue__list__item__status-btn work-queue__list__item__status-btn--cancel"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm('Bạn có chắc chắn muốn hủy công việc này?')) {
                                    handleStatusUpdate(work.id, 'cancelled')
                                  }
                                }}
                                disabled={updatingStatus.has(work.id)}
                                title="Hủy"
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
                              {work.status === 'completed' && <CheckCircle size={16} />}
                              {work.status === 'paid' && <Package size={16} />}
                              {work.status === 'cancelled' && <XCircle size={16} />}
                            </div>
                            <div className="work-queue__list__item__terminal-status__text">
                              <span className="work-queue__list__item__terminal-status__label">
                                TRẠNG THÁI CUỐI CÙNG:
                              </span>
                              <span 
                                className="work-queue__list__item__terminal-status__value"
                                style={{ color: getStatusColor(work.status) }}
                              >
                                {getStatusText(work.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="work-queue__list__item__cell">
                      <div className="work-queue__list__item__cell__primary">{work.scheduledDate}</div>
                      <div className="work-queue__list__item__cell__secondary">{work.scheduledTime}</div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRows.has(work.id) && (
                    <div className="work-queue__list__item__expanded">
                      <div className="work-queue__list__item__expanded__content">
                        <div className="work-queue__list__item__expanded__details">
                          <div className="work-queue__list__item__expanded__section">
                            <h4>Mô tả công việc</h4>
                            <p>{work.description}</p>
                          </div>

                          <div className="work-queue__list__item__expanded__section">
                            <h4>Linh kiện cần thiết</h4>
                            <div className="work-queue__list__item__expanded__parts">
                              {work.parts.map((part, index) => (
                                <span key={index} className="work-queue__list__item__expanded__part">
                                  {part}
                                </span>
                              ))}
                            </div>
                          </div>

                        </div>


                      </div>
                    </div>
                  )}
                </div>
              ))
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
                    background: currentPage === page ? '#004030' : 'white',
                    color: currentPage === page ? 'white' : '#374151',
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

      {/* Empty State */}
      {!loading && filteredWork.length === 0 && (
        <div className="work-queue__empty">
          <div className="work-queue__empty__icon">
                <Clock size={48} />
          </div>
          <h3 className="work-queue__empty__title">
                {search || statusFilter !== 'all'
              ? 'Không tìm thấy công việc phù hợp'
              : 'Chưa có công việc nào'
            }
          </h3>
          <p className="work-queue__empty__description">
                {search || statusFilter !== 'all'
              ? 'Hãy thử điều chỉnh bộ lọc để tìm kiếm công việc khác'
                  : 'Hiện tại chưa có công việc nào trong hàng đợi'
            }
          </p>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
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
  status: 'waiting' | 'processing' | 'completed' | 'pending' | 'in_progress' | 'done'
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Lấy thông tin user từ store và resolve đúng technicianId
  const user = useAppSelector((state) => state.auth.user)
  const [technicianId, setTechnicianId] = useState<number | null>(null)

  // Resolve technicianId bằng cách gọi API để lấy technicianId chính xác từ userId
  useEffect(() => {
    const resolveTechnicianId = async () => {
      // 1) Thử lấy từ localStorage trước (đã lưu trước đó)
      try {
        const cached = localStorage.getItem('technicianId')
        if (cached) {
          const parsed = Number(cached)
          if (Number.isFinite(parsed) && parsed > 0) {
            console.log('✅ Using cached technicianId:', parsed)
            setTechnicianId(parsed)
            return
          }
        }
      } catch {}

      // 2) Gọi API để lấy technicianId chính xác từ userId
      const userId = user?.id
      if (userId && Number.isFinite(Number(userId))) {
        try {
          console.log('🔍 Resolving technicianId for userId:', userId)
          const result = await TechnicianService.getTechnicianIdByUserId(Number(userId))
          
          if (result?.technicianId) {
            console.log('✅ Resolved technicianId:', result.technicianId, 'for userId:', userId)
            setTechnicianId(result.technicianId)
            // Cache lại để lần sau nhanh hơn
            try { localStorage.setItem('technicianId', String(result.technicianId)) } catch {}
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

      // 3) Fallback: null nếu không resolve được
      console.log('⚠️ Could not resolve technicianId')
      setTechnicianId(null)
    }

    resolveTechnicianId()
  }, [user])

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
          status: mapBookingStatus(booking.status) as 'waiting' | 'processing' | 'completed' | 'pending' | 'in_progress' | 'done',
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
      
      // Fallback: sử dụng mock data nếu API fail
      console.log('Using fallback mock data due to API error')
      setWorkQueue([
        {
          id: 1,
          title: 'Sửa chữa động cơ xe điện',
          customer: 'Nguyễn Văn An',
          customerPhone: '0901234567',
          customerEmail: 'nguyenvana@email.com',
          licensePlate: '30A-12345',
          bikeBrand: 'VinFast',
          bikeModel: 'VF e34',
          status: 'waiting',
          priority: 'high',
          estimatedTime: '2 giờ',
          description: 'Động cơ kêu lạ, cần kiểm tra và thay thế linh kiện',
          scheduledDate: selectedDate,
          scheduledTime: '09:00',
          serviceType: 'repair',
          assignedTechnician: 'Trần Văn B',
          parts: ['Động cơ', 'Dây dẫn', 'IC điều khiển']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Helper functions để map data
  const mapBookingStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'waiting',
      'confirmed': 'waiting', 
      'in_progress': 'processing',
      'processing': 'processing',
      'completed': 'completed',
      'done': 'completed',
      'cancelled': 'waiting'
    }
    return statusMap[status?.toLowerCase()] || 'waiting'
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
      case 'waiting': return 'Chờ tiếp nhận'
      case 'processing': return 'Đang xử lý'
      case 'completed': return 'Hoàn thành'
      default: return status
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
      label: 'Chờ tiếp nhận',
      value: workQueue.filter(w => w.status === 'waiting').length,
      color: '#f59e0b',
      icon: Clock
    },
    {
      label: 'Đang xử lý',
      value: workQueue.filter(w => w.status === 'processing').length,
      color: '#3b82f6',
      icon: Wrench
    },
    {
      label: 'Hoàn thành',
      value: workQueue.filter(w => w.status === 'completed').length,
      color: '#10b981',
      icon: CheckCircle
    }
  ]

  const handleStatusUpdate = (workId: number, newStatus: string) => {
    setWorkQueue(prev => prev.map(work => 
      work.id === workId ? { ...work, status: newStatus as any } : work
    ))
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
                <option value="waiting">Chờ tiếp nhận</option>
                <option value="processing">Đang xử lý</option>
                <option value="completed">Hoàn thành</option>
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
                      <span className={`work-queue__list__item__status work-queue__list__item__status--${work.status}`}>
                        {getStatusText(work.status)}
                      </span>
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

                          <div className="work-queue__list__item__expanded__section">
                            <h4>Thông tin bổ sung</h4>
                            <div className="work-queue__list__item__expanded__info">
                              <div className="work-queue__list__item__expanded__info-item">
                                <span>Thời gian ước tính:</span>
                                <span>{work.estimatedTime}</span>
                              </div>
                              <div className="work-queue__list__item__expanded__info-item">
                                <span>Mức độ ưu tiên:</span>
                                <span 
                                  className="work-queue__list__item__expanded__priority"
                                  style={{ color: getPriorityColor(work.priority) }}
                                >
                                  {getPriorityText(work.priority)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="work-queue__list__item__expanded__actions">
                          {work.status === 'waiting' && (
                            <button
                              className="work-queue__list__item__expanded__action-btn work-queue__list__item__expanded__action-btn--start"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusUpdate(work.id, 'processing')
                              }}
                            >
                              <Play size={16} />
                              Bắt đầu xử lý
                            </button>
                          )}
                          
                          {work.status === 'processing' && (
                            <button
                              className="work-queue__list__item__expanded__action-btn work-queue__list__item__expanded__action-btn--complete"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusUpdate(work.id, 'completed')
                              }}
                            >
                              <CheckCircle size={16} />
                              Hoàn thành
                            </button>
                          )}
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
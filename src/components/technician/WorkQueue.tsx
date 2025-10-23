import { useState } from 'react'
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
  XCircle
} from 'lucide-react'
import './WorkQueue.scss'

interface WorkOrder {
  id: number
  title: string
  customer: string
  customerPhone: string
  customerEmail?: string
  licensePlate: string
  bikeBrand?: string
  bikeModel?: string
  status: 'waiting' | 'processing' | 'completed'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  description: string
  scheduledDate: string
  scheduledTime: string
  serviceType: string
  assignedTechnician?: string
  parts: string[]
}

interface WorkQueueProps {
  onViewDetails: (work: WorkOrder) => void
}

export default function WorkQueue({ onViewDetails }: WorkQueueProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const [workQueue, setWorkQueue] = useState<WorkOrder[]>([
    {
      id: 1,
      title: 'Sửa chữa động cơ xe điện',
      customer: 'Nguyễn Văn An',
      customerPhone: '0901234567',
      customerEmail: 'nguyenvana@email.com',
      licensePlate: '30A-12345',
      bikeBrand: 'VinFast',
      bikeModel: 'VF e34',
      status: 'processing',
      priority: 'high',
      estimatedTime: '2 giờ',
      description: 'Động cơ kêu lạ, cần kiểm tra và thay thế linh kiện',
      scheduledDate: '2024-01-18',
      scheduledTime: '09:00',
      serviceType: 'repair',
      assignedTechnician: 'Trần Văn B',
      parts: ['Động cơ', 'Dây dẫn', 'IC điều khiển']
    },
    {
      id: 2,
      title: 'Bảo dưỡng định kỳ',
      customer: 'Trần Thị Bình',
      customerPhone: '0902345678',
      licensePlate: '29B-67890',
      bikeBrand: 'Pega',
      bikeModel: 'Newtech',
      status: 'waiting',
      priority: 'medium',
      estimatedTime: '1.5 giờ',
      description: 'Bảo dưỡng định kỳ 6 tháng, kiểm tra tổng quát',
      scheduledDate: '2024-01-18',
      scheduledTime: '14:00',
      serviceType: 'maintenance',
      parts: ['Dầu nhờn', 'Lọc gió', 'Phanh']
    },
    {
      id: 3,
      title: 'Thay thế pin xe điện',
      customer: 'Lê Hoài Cường',
      customerPhone: '0903456789',
      licensePlate: '51C-11111',
      bikeBrand: 'Yadea',
      bikeModel: 'Xmen Neo',
      status: 'waiting',
      priority: 'high',
      estimatedTime: '3 giờ',
      description: 'Pin cũ hỏng, cần thay pin mới hoàn toàn',
      scheduledDate: '2024-01-17',
      scheduledTime: '08:00',
      serviceType: 'repair',
      assignedTechnician: 'Phạm Văn C',
      parts: ['Pin Lithium 48V', 'Sạc pin', 'Cáp kết nối']
    },
    {
      id: 4,
      title: 'Kiểm tra hệ thống phanh',
      customer: 'Phạm Thị Dung',
      customerPhone: '0904567890',
      licensePlate: '43D-22222',
      bikeBrand: 'Honda',
      bikeModel: 'Lead',
      status: 'completed',
      priority: 'low',
      estimatedTime: '1 giờ',
      description: 'Khách hàng phản ánh phanh không ăn, cần kiểm tra',
      scheduledDate: '2024-01-17',
      scheduledTime: '10:00',
      serviceType: 'inspection',
      assignedTechnician: 'Nguyễn Văn D',
      parts: ['Phanh trước', 'Phanh sau', 'Dầu phanh']
    },
    {
      id: 5,
      title: 'Thay lốp xe điện',
      customer: 'Hoàng Văn E',
      customerPhone: '0905678901',
      licensePlate: '12E-33333',
      bikeBrand: 'Yamaha',
      bikeModel: 'NMAX',
      status: 'waiting',
      priority: 'medium',
      estimatedTime: '1 giờ',
      description: 'Lốp sau bị thủng, cần thay lốp mới',
      scheduledDate: '2024-01-19',
      scheduledTime: '11:00',
      serviceType: 'repair',
      parts: ['Lốp sau 120/70-12', 'Van lốp']
    }
  ])

  const filteredWork = workQueue.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(search.toLowerCase()) ||
                         work.customer.toLowerCase().includes(search.toLowerCase()) ||
                         work.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
                         work.customerPhone.includes(search)
    const matchesStatus = statusFilter === 'all' || work.status === statusFilter
    
    return matchesSearch && matchesStatus
  })


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
      <div className="work-queue__main">
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
            <div className="work-queue__toolbar__search">
              <Search size={16} className="work-queue__toolbar__search__icon" />
          <input
            type="text"
                placeholder="Tìm theo tên khách hàng, biển số, mã công việc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
                className="work-queue__toolbar__search__input"
          />
        </div>

            <div className="work-queue__toolbar__filters">
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

            <button className="work-queue__toolbar__create-btn">
              <Plus size={16} />
              Tạo công việc mới
            </button>
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
            <div className="work-queue__list">
              {filteredWork.map((work) => (
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
              ))}
            </div>
          </div>

      {/* Empty State */}
      {filteredWork.length === 0 && (
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
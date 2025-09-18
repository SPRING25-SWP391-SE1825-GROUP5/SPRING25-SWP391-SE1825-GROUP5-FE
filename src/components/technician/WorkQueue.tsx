import { useState } from 'react'
import './WorkQueue.scss'

interface WorkOrder {
  id: number
  title: string
  customer: string
  licensePlate: string
  status: string
  priority: string
  estimatedTime: string
  description: string
  scheduledDate: string
  scheduledTime: string
  serviceType: string
  assignedTechnician?: string
  parts: string[]
  customerPhone: string
  customerEmail?: string
  bikeBrand?: string
  bikeModel?: string
  partChecklist?: Record<string, { checked: boolean; status: string | null; notes: string }>
  notes?: string
}

interface WorkQueueProps {
  onViewDetails: (work: WorkOrder) => void
}

export default function WorkQueue({ onViewDetails }: WorkQueueProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [serviceType, setServiceType] = useState('all')

  const [workQueue, setWorkQueue] = useState<WorkOrder[]>([
    {
      id: 1,
      title: 'Sửa chữa động cơ xe điện',
      customer: 'Nguyễn Văn An',
      licensePlate: '30A-12345',
      status: 'in-progress',
      priority: 'high',
      estimatedTime: '2 giờ',
      description: 'Động cơ kêu lạ, cần kiểm tra và thay thế linh kiện',
      scheduledDate: '2024-01-18',
      scheduledTime: '09:00',
      serviceType: 'repair',
      assignedTechnician: 'Trần Văn B',
      parts: ['Động cơ', 'Dây dẫn', 'IC điều khiển'],
      customerPhone: '0901234567',
      customerEmail: 'nguyenvana@email.com',
      bikeBrand: 'VinFast',
      bikeModel: 'VF e34'
    },
    {
      id: 2,
      title: 'Bảo dưỡng định kỳ',
      customer: 'Trần Thị Bình',
      licensePlate: '29B-67890',
      status: 'pending',
      priority: 'medium',
      estimatedTime: '1.5 giờ',
      description: 'Bảo dưỡng định kỳ 6 tháng, kiểm tra tổng quát',
      scheduledDate: '2024-01-18',
      scheduledTime: '14:00',
      serviceType: 'maintenance',
      parts: ['Dầu nhờn', 'Lọc gió', 'Phanh'],
      customerPhone: '0902345678',
      bikeBrand: 'Pega',
      bikeModel: 'Newtech'
    },
    {
      id: 3,
      title: 'Thay thế pin xe điện',
      customer: 'Lê Hoài Cường',
      licensePlate: '51C-11111',
      status: 'completed',
      priority: 'high',
      estimatedTime: '3 giờ',
      description: 'Pin cũ hỏng, cần thay pin mới hoàn toàn',
      scheduledDate: '2024-01-17',
      scheduledTime: '08:00',
      serviceType: 'repair',
      assignedTechnician: 'Phạm Văn C',
      parts: ['Pin Lithium 48V', 'Sạc pin', 'Cáp kết nối'],
      customerPhone: '0903456789',
      bikeBrand: 'Yadea',
      bikeModel: 'Xmen Neo'
    }
  ])

  const filteredWork = workQueue.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(search.toLowerCase()) ||
                         work.customer.toLowerCase().includes(search.toLowerCase()) ||
                         work.licensePlate.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = status === 'all' || work.status === status
    const matchesPriority = priority === 'all' || work.priority === priority
    const matchesServiceType = serviceType === 'all' || work.serviceType === serviceType
    
    return matchesSearch && matchesStatus && matchesPriority && matchesServiceType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'in-progress': return '#3b82f6'
      case 'completed': return '#10b981'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý'
      case 'in-progress': return 'Đang thực hiện'
      case 'completed': return 'Hoàn thành'
      case 'cancelled': return 'Đã hủy'
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
      case 'high': return <i className="fas fa-exclamation-triangle text-red-500"></i>
      case 'medium': return <i className="fas fa-exclamation-triangle text-yellow-500"></i>
      case 'low': return <i className="fas fa-check-circle text-green-500"></i>
      default: return <i className="fas fa-exclamation-triangle text-gray-500"></i>
    }
  }

  const stats = [
    {
      label: 'Tổng công việc',
      value: workQueue.length,
      icon: <i className="fas fa-clipboard-list text-blue-500"></i>
    },
    {
      label: 'Chờ xử lý',
      value: workQueue.filter(w => w.status === 'pending').length,
      icon: <i className="fas fa-clock text-yellow-500"></i>
    },
    {
      label: 'Đang thực hiện',
      value: workQueue.filter(w => w.status === 'in-progress').length,
      icon: <i className="fas fa-wrench text-blue-500"></i>
    },
    {
      label: 'Hoàn thành',
      value: workQueue.filter(w => w.status === 'completed').length,
      icon: <i className="fas fa-check-circle text-green-500"></i>
    }
  ]

  return (
    <div className="work-queue">
      {/* Header */}
      <div className="work-queue__header">
        <div className="work-queue__header__info">
          <h1 className="work-queue__header__info__title">
            <div className="work-queue__header__info__title__icon">
              <i className="fas fa-wrench text-white"></i>
            </div>
            Hàng đợi công việc
          </h1>
          <p className="work-queue__header__info__description">
            Quản lý và theo dõi tất cả các công việc sửa chữa và bảo dưỡng xe điện
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="work-queue__stats">
        {stats.map((stat, index) => (
          <div key={index} className="work-queue__stats__card">
            <div className="work-queue__stats__card__icon">
              {stat.icon}
            </div>
            <div className="work-queue__stats__card__content">
              <div className="work-queue__stats__card__content__value">
                {stat.value}
              </div>
              <div className="work-queue__stats__card__content__label">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="work-queue__filters">
        <div className="work-queue__filters__search">
          <div className="work-queue__filters__search__icon">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            className="work-queue__filters__search__input"
            type="text"
            placeholder="Tìm kiếm theo tên, khách hàng, biển số..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="work-queue__filters__select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="in-progress">Đang thực hiện</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        <select
          className="work-queue__filters__select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="all">Tất cả mức độ</option>
          <option value="high">Cao</option>
          <option value="medium">Trung bình</option>
          <option value="low">Thấp</option>
        </select>

        <select
          className="work-queue__filters__select"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          <option value="all">Tất cả loại dịch vụ</option>
          <option value="repair">Sửa chữa</option>
          <option value="maintenance">Bảo dưỡng</option>
          <option value="inspection">Kiểm tra</option>
        </select>
      </div>

      {/* Work List */}
      <div className="work-queue__list">
        {filteredWork.map((work) => (
          <div key={work.id} className="work-queue__list__item">
            {/* Item Header */}
            <div className="work-queue__list__item__header">
              <div className="work-queue__list__item__header__left">
                <h3 className="work-queue__list__item__header__left__title">
                  {work.title}
                </h3>
                <div className="work-queue__list__item__header__left__meta">
                  <span className="work-queue__list__item__header__left__meta__customer">
                    <i className="fas fa-user text-gray-500 mr-2"></i> {work.customer}
                  </span>
                  <span className="work-queue__list__item__header__left__meta__plate">
                    <i className="fas fa-car text-gray-500 mr-2"></i> {work.licensePlate}
                  </span>
                  <span className="work-queue__list__item__header__left__meta__time">
                    <i className="fas fa-clock text-gray-500 mr-2"></i> {work.scheduledDate} lúc {work.scheduledTime}
                  </span>
                </div>
              </div>

              <div className="work-queue__list__item__header__right">
                <span 
                  className="work-queue__list__item__header__right__priority"
                  style={{ 
                    backgroundColor: work.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 
                                   work.priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: getPriorityColor(work.priority)
                  }}
                >
                  {getPriorityIcon(work.priority)}
                  {getPriorityText(work.priority)}
                </span>
                <span 
                  className="work-queue__list__item__header__right__status"
                  style={{ backgroundColor: getStatusColor(work.status), color: 'white' }}
                >
                  {getStatusText(work.status)}
                </span>
              </div>
            </div>

            {/* Item Body */}
            <div className="work-queue__list__item__body">
              <div className="work-queue__list__item__body__content">
                <div className="work-queue__list__item__body__content__description">
                  <h4>Mô tả công việc:</h4>
                  <p>{work.description}</p>
                </div>

                <div className="work-queue__list__item__body__content__details">
                  <div className="work-queue__list__item__body__content__details__item">
                    <span className="work-queue__list__item__body__content__details__item__label">
                      Thời gian ước tính:
                    </span>
                    <span className="work-queue__list__item__body__content__details__item__value">
                      {work.estimatedTime}
                    </span>
                  </div>
                  <div className="work-queue__list__item__body__content__details__item">
                    <span className="work-queue__list__item__body__content__details__item__label">
                      Loại dịch vụ:
                    </span>
                    <span className="work-queue__list__item__body__content__details__item__value">
                      {work.serviceType === 'repair' ? 'Sửa chữa' : 
                       work.serviceType === 'maintenance' ? 'Bảo dưỡng' : 'Kiểm tra'}
                    </span>
                  </div>
                  {work.assignedTechnician && (
                    <div className="work-queue__list__item__body__content__details__item">
                      <span className="work-queue__list__item__body__content__details__item__label">
                        Kỹ thuật viên:
                      </span>
                      <span className="work-queue__list__item__body__content__details__item__value">
                        {work.assignedTechnician}
                      </span>
                    </div>
                  )}
                </div>

                <div className="work-queue__list__item__body__content__parts">
                  <h4>Linh kiện cần thiết:</h4>
                  <div className="work-queue__list__item__body__content__parts__list">
                    {work.parts.map((part, index) => (
                      <span key={index} className="work-queue__list__item__body__content__parts__list__item">
                        <i className="fas fa-cube text-gray-500 mr-2"></i> {part}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="work-queue__list__item__body__actions">
                <button
                  className="work-queue__list__item__body__actions__button work-queue__list__item__body__actions__button--primary"
                  onClick={() => onViewDetails(work)}
                >
                  <i className="fas fa-eye mr-2"></i> Xem chi tiết
                </button>
                
                {work.status === 'pending' && (
                  <button
                    className="work-queue__list__item__body__actions__button work-queue__list__item__body__actions__button--success"
                    onClick={() => {
                      setWorkQueue(workQueue.map(w => 
                        w.id === work.id 
                          ? { ...w, status: 'in-progress' }
                          : w
                      ))
                    }}
                  >
                    <i className="fas fa-wrench mr-2"></i> Bắt đầu làm việc
                  </button>
                )}
                
                {work.status === 'in-progress' && (
                  <button
                    className="work-queue__list__item__body__actions__button work-queue__list__item__body__actions__button--success"
                    onClick={() => {
                      setWorkQueue(workQueue.map(w => 
                        w.id === work.id 
                          ? { ...w, status: 'completed' }
                          : w
                      ))
                    }}
                  >
                    <i className="fas fa-check-circle mr-2"></i> Hoàn thành
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredWork.length === 0 && (
        <div className="work-queue__empty">
          <div className="work-queue__empty__icon">
            <i className="fas fa-clipboard-list text-gray-400"></i>
          </div>
          <h3 className="work-queue__empty__title">
            {search || status !== 'all' || priority !== 'all' || serviceType !== 'all'
              ? 'Không tìm thấy công việc phù hợp'
              : 'Chưa có công việc nào'
            }
          </h3>
          <p className="work-queue__empty__description">
            {search || status !== 'all' || priority !== 'all' || serviceType !== 'all'
              ? 'Hãy thử điều chỉnh bộ lọc để tìm kiếm công việc khác'
              : 'Hiện tại chưa có công việc nào trong hàng đợi. Các công việc mới sẽ xuất hiện ở đây khi được tạo.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
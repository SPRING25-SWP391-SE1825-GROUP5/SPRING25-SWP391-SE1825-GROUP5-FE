import { useState } from 'react'
import { User, Calendar, Eye, MessageSquare, CheckCircle, Car, Wrench, X, Plus } from 'lucide-react'
import './CustomerRequests.scss'

interface CustomerRequest {
  id: number
  customerName: string
  vehicleInfo: {
    brand: string
    model: string
    year: number
    licensePlate: string
  }
  issues: string[]
  description: string
  images: string[]
  submittedAt: string
  status: 'pending' | 'in-review' | 'assessed' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assessment?: {
    technicianNotes: string
    estimatedCost: string
    severity: 'minor' | 'moderate' | 'major'
    recommendedActions: string[]
    estimatedTime: string
  }
}

interface AssessmentModalProps {
  request: CustomerRequest | null
  onClose: () => void
  onSubmit: (assessment: {
    technicianNotes: string
    estimatedCost: string
    severity: 'minor' | 'moderate' | 'major'
    recommendedActions: string[]
    estimatedTime: string
  }) => void
}

function AssessmentModal({ request, onClose, onSubmit }: AssessmentModalProps) {
  const [notes, setNotes] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('minor')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [recommendedActions, setRecommendedActions] = useState<string[]>([])
  const [newAction, setNewAction] = useState('')

  const addRecommendedAction = () => {
    if (newAction.trim()) {
      setRecommendedActions([...recommendedActions, newAction.trim()])
      setNewAction('')
    }
  }

  const removeRecommendedAction = (index: number) => {
    setRecommendedActions(recommendedActions.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    onSubmit({
      technicianNotes: notes,
      estimatedCost,
      severity,
      recommendedActions,
      estimatedTime
    })
    onClose()
  }

  if (!request) return null

  return (
    <div className="assessment-modal">
      <div className="assessment-modal__content">
        {/* Modal Header */}
        <div className="assessment-modal__content__header">
          <div className="assessment-modal__content__header__info">
            <h2 className="assessment-modal__content__header__info__title">
              Đánh giá yêu cầu khách hàng
            </h2>
            <p className="assessment-modal__content__header__info__subtitle">
              #{request.id} - {request.customerName}
            </p>
          </div>
          <button 
            className="assessment-modal__content__header__close" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="assessment-modal__content__body">
          {/* Problem Summary */}
          <div className="assessment-modal__content__body__section">
            <h3 className="assessment-modal__content__body__section__title">
              Tóm tắt vấn đề
            </h3>
            <div className="assessment-modal__content__body__section__recap">
              <ul>
                {request.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Assessment Form */}
          <div className="assessment-modal__content__body__form">
            <div className="assessment-modal__content__body__form__field">
              <label className="assessment-modal__content__body__form__field__label">
                Ghi chú kỹ thuật
              </label>
              <textarea 
                className="assessment-modal__content__body__form__field__textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập đánh giá chi tiết về vấn đề..."
              />
            </div>

            <div className="assessment-modal__content__body__form__field__grid">
              <div className="assessment-modal__content__body__form__field">
                <label className="assessment-modal__content__body__form__field__label">
                  Mức độ nghiêm trọng
                </label>
                <select 
                  className="assessment-modal__content__body__form__field__select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as 'minor' | 'moderate' | 'major')}
                >
                  <option value="minor">Nhẹ</option>
                  <option value="moderate">Vừa</option>
                  <option value="major">Nghiêm trọng</option>
                </select>
              </div>

              <div className="assessment-modal__content__body__form__field">
                <label className="assessment-modal__content__body__form__field__label">
                  Chi phí ước tính
                </label>
                <input 
                  className="assessment-modal__content__body__form__field__input"
                  type="text"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="VD: 500000-1000000"
                />
              </div>

              <div className="assessment-modal__content__body__form__field">
                <label className="assessment-modal__content__body__form__field__label">
                  Thời gian ước tính
                </label>
                <input 
                  className="assessment-modal__content__body__form__field__input"
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="VD: 2-3 ngày"
                />
              </div>
            </div>

            <div className="assessment-modal__content__body__form__field">
              <label className="assessment-modal__content__body__form__field__label">
                Hành động khuyến nghị
              </label>
              <div className="assessment-modal__content__body__form__field__actions">
                <input 
                  className="assessment-modal__content__body__form__field__actions__input"
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="Nhập hành động khuyến nghị..."
                  onKeyPress={(e) => e.key === 'Enter' && addRecommendedAction()}
                />
                <button 
                  className="assessment-modal__content__body__form__field__actions__button"
                  type="button"
                  onClick={addRecommendedAction}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="assessment-modal__content__body__form__field__tags">
                {recommendedActions.map((action, index) => (
                  <div key={index} className="assessment-modal__content__body__form__field__tags__item">
                    {action}
                    <button 
                      className="assessment-modal__content__body__form__field__tags__item__remove"
                      onClick={() => removeRecommendedAction(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="assessment-modal__content__body__actions">
            <button 
              className="assessment-modal__content__body__actions__button assessment-modal__content__body__actions__button--secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button 
              className="assessment-modal__content__body__actions__button assessment-modal__content__body__actions__button--primary"
              onClick={handleSubmit}
            >
              <CheckCircle size={16} />
              Hoàn thành đánh giá
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomerRequestsContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)

  const [requests, setRequests] = useState<CustomerRequest[]>([
    {
      id: 1001,
      customerName: 'Nguyễn Văn An',
      vehicleInfo: {
        brand: 'VinFast',
        model: 'VF e34',
        year: 2023,
        licensePlate: '30A-12345'
      },
      issues: ['Pin yếu', 'Sạc chậm', 'Đèn báo lỗi'],
      description: 'Xe bị yếu pin sau 6 tháng sử dụng. Thời gian sạc tăng gấp đôi so với ban đầu.',
      images: ['image1.jpg', 'image2.jpg'],
      submittedAt: '2024-01-18 14:30',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 1002,
      customerName: 'Trần Thị Bình',
      vehicleInfo: {
        brand: 'Pega',
        model: 'Newtech',
        year: 2022,
        licensePlate: '29B-67890'
      },
      issues: ['Động cơ kêu lạ', 'Rung lắc'],
      description: 'Xe phát ra tiếng kêu lạ khi tăng tốc, đồng thời có hiện tượng rung lắc.',
      images: ['image3.jpg'],
      submittedAt: '2024-01-19 09:15',
      status: 'in-review',
      priority: 'medium'
    },
    {
      id: 1003,
      customerName: 'Lê Hoài Cường',
      vehicleInfo: {
        brand: 'Yadea',
        model: 'Xmen Neo',
        year: 2023,
        licensePlate: '51C-11111'
      },
      issues: ['Không sạc được pin', 'Đèn báo lỗi bật'],
      description: 'Xe điện không sạc được đầy pin, chỉ sạc được khoảng 80%. Đèn báo lỗi màu đỏ thường xuyên bật.',
      images: ['image3.jpg'],
      submittedAt: '2024-01-20 10:15',
      status: 'assessed',
      priority: 'high',
      assessment: {
        technicianNotes: 'Có thể do hệ thống sạc hoặc pin bị lỗi. Cần kiểm tra chi tiết.',
        estimatedCost: '2000000-3000000',
        severity: 'major',
        recommendedActions: ['Thay pin mới', 'Kiểm tra hệ thống sạc', 'Cập nhật firmware'],
        estimatedTime: '3-5 ngày'
      }
    }
  ])

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         request.vehicleInfo.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#fbbf24'
      case 'in-review': return '#60a5fa'
      case 'assessed': return '#34d399'
      case 'completed': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý'
      case 'in-review': return 'Đang xem xét'
      case 'assessed': return 'Đã đánh giá'
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return '#10b981'
      case 'moderate': return '#f59e0b'
      case 'major': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'minor': return 'Nhẹ'
      case 'moderate': return 'Vừa'
      case 'major': return 'Nghiêm trọng'
      default: return severity
    }
  }

  const handleAssessment = (requestId: number, assessment: {
    technicianNotes: string
    estimatedCost: string
    severity: 'minor' | 'moderate' | 'major'
    recommendedActions: string[]
    estimatedTime: string
  }) => {
    setRequests(requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'assessed' as const, assessment } 
        : req
    ))
  }

  const stats = [
    {
      label: 'Tổng yêu cầu',
      value: requests.length,
      color: '#3b82f6',
      indicator: '#3b82f6'
    },
    {
      label: 'Chờ xử lý',
      value: requests.filter(r => r.status === 'pending').length,
      color: '#f59e0b',
      indicator: '#f59e0b'
    },
    {
      label: 'Đang xem xét',
      value: requests.filter(r => r.status === 'in-review').length,
      color: '#60a5fa',
      indicator: '#60a5fa'
    },
    {
      label: 'Đã đánh giá',
      value: requests.filter(r => r.status === 'assessed').length,
      color: '#10b981',
      indicator: '#10b981'
    },
    {
      label: 'Ưu tiên cao',
      value: requests.filter(r => r.priority === 'high').length,
      color: '#ef4444',
      indicator: '#ef4444'
    }
  ]

  return (
    <div className="customer-requests">
      {/* Header */}
      <div className="customer-requests__header">
        <div className="customer-requests__header__info">
          <h1 className="customer-requests__header__info__title">
            <div className="customer-requests__header__info__title__icon">📋</div>
            Yêu cầu khách hàng
          </h1>
          <p className="customer-requests__header__info__description">
            Quản lý và xử lý các yêu cầu thông tin xe từ khách hàng
          </p>
        </div>
        
        <div className="customer-requests__header__actions">
          <div className="customer-requests__header__actions__search">
            <User className="customer-requests__header__actions__search__icon" size={16} />
            <input 
              className="customer-requests__header__actions__search__input"
              type="text"
              placeholder="Tìm theo tên khách hàng hoặc biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="customer-requests__header__actions__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="in-review">Đang xem xét</option>
            <option value="assessed">Đã đánh giá</option>
            <option value="completed">Hoàn thành</option>
          </select>
          
          <select 
            className="customer-requests__header__actions__select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">Tất cả mức độ</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="customer-requests__stats">
        {stats.map((stat, index) => (
          <div key={index} className="customer-requests__stats__card">
            <div className="customer-requests__stats__card__header">
              <span className="customer-requests__stats__card__header__label">
                {stat.label}
              </span>
              <div 
                className="customer-requests__stats__card__header__indicator"
                style={{ backgroundColor: stat.indicator }}
              />
            </div>
            <div 
              className="customer-requests__stats__card__value"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Requests List */}
      <div className="customer-requests__list">
        {filteredRequests.map((request) => (
          <div key={request.id} className="customer-requests__list__item">
            {/* Request Header */}
            <div className="customer-requests__list__item__header">
              <div className="customer-requests__list__item__header__top">
                <div className="customer-requests__list__item__header__top__info">
                  <h3 className="customer-requests__list__item__header__top__info__title">
                    {request.customerName}
                  </h3>
                  <div className="customer-requests__list__item__header__top__info__meta">
                    <span>
                      <Calendar size={14} /> {request.submittedAt}
                    </span>
                    <span>
                      <Car size={14} /> {request.vehicleInfo.licensePlate}
                    </span>
                  </div>
                </div>
                
                <div className="customer-requests__list__item__header__top__badges">
                  <span 
                    className="customer-requests__list__item__header__top__badges__priority"
                    style={{ backgroundColor: getPriorityColor(request.priority), color: 'white' }}
                  >
                    {getPriorityText(request.priority)}
                  </span>
                  <span 
                    className="customer-requests__list__item__header__top__badges__status"
                    style={{ backgroundColor: getStatusColor(request.status), color: 'white' }}
                  >
                    {getStatusText(request.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Request Body */}
            <div className="customer-requests__list__item__body">
              <div className="customer-requests__list__item__body__content">
                {/* Main Content */}
                <div className="customer-requests__list__item__body__content__main">
                  <h4 className="customer-requests__list__item__body__content__main__title">
                    Vấn đề báo cáo
                  </h4>
                  <ul className="customer-requests__list__item__body__content__main__issues">
                    {request.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                  <p className="customer-requests__list__item__body__content__main__description">
                    {request.description}
                  </p>
                </div>

                {/* Vehicle Info */}
                <div className="customer-requests__list__item__body__content__vehicle">
                  <h4 className="customer-requests__list__item__body__content__vehicle__title">
                    Thông tin xe
                  </h4>
                  <div className="customer-requests__list__item__body__content__vehicle__info">
                    <div className="customer-requests__list__item__body__content__vehicle__info__field">
                      <span className="customer-requests__list__item__body__content__vehicle__info__field__label">
                        Hãng xe:
                      </span>
                      <span className="customer-requests__list__item__body__content__vehicle__info__field__value">
                        {request.vehicleInfo.brand}
                      </span>
                    </div>
                    <div className="customer-requests__list__item__body__content__vehicle__info__field">
                      <span className="customer-requests__list__item__body__content__vehicle__info__field__label">
                        Model:
                      </span>
                      <span className="customer-requests__list__item__body__content__vehicle__info__field__value">
                        {request.vehicleInfo.model}
                      </span>
                    </div>
                    <div className="customer-requests__list__item__body__content__vehicle__info__field">
                      <span className="customer-requests__list__item__body__content__vehicle__info__field__label">
                        Năm sản xuất:
                      </span>
                      <span className="customer-requests__list__item__body__content__vehicle__info__field__value">
                        {request.vehicleInfo.year}
                      </span>
                    </div>
                    <div className="customer-requests__list__item__body__content__vehicle__info__field">
                      <span className="customer-requests__list__item__body__content__vehicle__info__field__label">
                        Biển số:
                      </span>
                      <span className="customer-requests__list__item__body__content__vehicle__info__field__value">
                        {request.vehicleInfo.licensePlate}
                      </span>
                    </div>
                  </div>
                  
                  <div className="customer-requests__list__item__body__content__vehicle__images">
                    <h5 className="customer-requests__list__item__body__content__vehicle__images__title">
                      Hình ảnh ({request.images.length})
                    </h5>
                    <div className="customer-requests__list__item__body__content__vehicle__images__grid">
                      {request.images.map((_, index) => (
                        <div key={index} className="customer-requests__list__item__body__content__vehicle__images__grid__item">
                          📷
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Results */}
              {request.assessment && (
                <div className="customer-requests__list__item__body__assessment">
                  <h4 className="customer-requests__list__item__body__assessment__title">
                    <CheckCircle size={16} /> Kết quả đánh giá
                  </h4>
                  <div className="customer-requests__list__item__body__assessment__grid">
                    <div className="customer-requests__list__item__body__assessment__grid__item">
                      <div className="customer-requests__list__item__body__assessment__grid__item__label">
                        Mức độ nghiêm trọng
                      </div>
                      <div 
                        className="customer-requests__list__item__body__assessment__grid__item__value"
                        style={{ color: getSeverityColor(request.assessment.severity) }}
                      >
                        {getSeverityText(request.assessment.severity)}
                      </div>
                    </div>
                    <div className="customer-requests__list__item__body__assessment__grid__item">
                      <div className="customer-requests__list__item__body__assessment__grid__item__label">
                        Chi phí ước tính
                      </div>
                      <div className="customer-requests__list__item__body__assessment__grid__item__value">
                        {request.assessment.estimatedCost} VND
                      </div>
                    </div>
                    <div className="customer-requests__list__item__body__assessment__grid__item">
                      <div className="customer-requests__list__item__body__assessment__grid__item__label">
                        Thời gian ước tính
                      </div>
                      <div className="customer-requests__list__item__body__assessment__grid__item__value">
                        {request.assessment.estimatedTime}
                      </div>
                    </div>
                  </div>
                  <p className="customer-requests__list__item__body__assessment__notes">
                    {request.assessment.technicianNotes}
                  </p>
                  <div className="customer-requests__list__item__body__assessment__actions">
                    {request.assessment.recommendedActions.map((action, index) => (
                      <span key={index} className="customer-requests__list__item__body__assessment__actions__item">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="customer-requests__list__item__body__actions">
                {request.status === 'pending' && (
                  <>
                    <button 
                      className="customer-requests__list__item__body__actions__button customer-requests__list__item__body__actions__button--secondary"
                      onClick={() => setRequests(requests.map(r => 
                        r.id === request.id ? { ...r, status: 'in-review' } : r
                      ))}
                    >
                      <Eye size={16} />
                      Bắt đầu xem xét
                    </button>
                    <button 
                      className="customer-requests__list__item__body__actions__button customer-requests__list__item__body__actions__button--primary"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowAssessmentModal(true)
                      }}
                    >
                      <Wrench size={16} />
                      Đánh giá ngay
                    </button>
                  </>
                )}
                
                {request.status === 'in-review' && (
                  <button 
                    className="customer-requests__list__item__body__actions__button customer-requests__list__item__body__actions__button--success"
                    onClick={() => {
                      setSelectedRequest(request)
                      setShowAssessmentModal(true)
                    }}
                  >
                    <CheckCircle size={16} />
                    Hoàn thành đánh giá
                  </button>
                )}
                
                {request.status === 'assessed' && (
                  <button className="customer-requests__list__item__body__actions__button customer-requests__list__item__body__actions__button--secondary">
                    <MessageSquare size={16} />
                    Gửi báo cáo cho quản lý
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assessment Modal */}
      {showAssessmentModal && (
        <AssessmentModal 
          request={selectedRequest}
          onClose={() => setShowAssessmentModal(false)}
          onSubmit={(assessment) => selectedRequest && handleAssessment(selectedRequest.id, assessment)}
        />
      )}
    </div>
  )
}
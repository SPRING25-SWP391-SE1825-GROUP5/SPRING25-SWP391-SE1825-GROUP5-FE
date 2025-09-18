import { useState } from 'react'
import { FileText, Calendar, User, CheckCircle, XCircle, AlertCircle, Plus, X } from 'lucide-react'
import './LeaveRequest.scss'

interface LeaveRequest {
  id: number
  type: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectReason?: string
}

interface NewRequestData {
  type: string
  startDate: string
  endDate: string
  reason: string
}

export default function LeaveRequest() {
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [newRequest, setNewRequest] = useState<NewRequestData>({
    type: 'sick',
    startDate: '',
    endDate: '',
    reason: ''
  })

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: 1,
      type: 'sick',
      startDate: '2024-01-22',
      endDate: '2024-01-24',
      days: 3,
      reason: 'Bị cảm lạnh, cần nghỉ dưỡng bệnh',
      status: 'approved',
      submittedAt: '2024-01-20 09:30',
      reviewedAt: '2024-01-20 14:15',
      reviewedBy: 'Nguyễn Văn Quản Lý'
    },
    {
      id: 2,
      type: 'personal',
      startDate: '2024-02-05',
      endDate: '2024-02-07',
      days: 3,
      reason: 'Có việc gia đình cần xử lý',
      status: 'pending',
      submittedAt: '2024-01-18 16:45'
    },
    {
      id: 3,
      type: 'vacation',
      startDate: '2024-03-10',
      endDate: '2024-03-15',
      days: 6,
      reason: 'Nghỉ phép thường niên',
      status: 'rejected',
      submittedAt: '2024-01-15 11:20',
      reviewedAt: '2024-01-16 10:30',
      reviewedBy: 'Trần Thị Quản Lý',
      rejectReason: 'Thời gian này đã có nhiều nhân viên nghỉ phép'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981'
      case 'rejected': return '#ef4444'
      case 'pending': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt'
      case 'rejected': return 'Từ chối'
      case 'pending': return 'Chờ duyệt'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} />
      case 'rejected': return <XCircle size={16} />
      case 'pending': return <AlertCircle size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  const getLeaveTypeText = (type: string) => {
    switch (type) {
      case 'sick': return 'Nghỉ ốm'
      case 'personal': return 'Nghỉ việc riêng'
      case 'vacation': return 'Nghỉ phép'
      case 'emergency': return 'Nghỉ khẩn cấp'
      default: return type
    }
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const handleSubmitRequest = () => {
    if (!newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    const days = calculateDays(newRequest.startDate, newRequest.endDate)
    const newLeaveRequest: LeaveRequest = {
      id: leaveRequests.length + 1,
      type: newRequest.type,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      days,
      reason: newRequest.reason,
      status: 'pending',
      submittedAt: new Date().toLocaleString('vi-VN')
    }

    setLeaveRequests([newLeaveRequest, ...leaveRequests])
    setNewRequest({ type: 'sick', startDate: '', endDate: '', reason: '' })
    setShowNewRequestModal(false)
  }

  const stats = [
    {
      label: 'Tổng yêu cầu',
      value: leaveRequests.length,
      color: '#3b82f6'
    },
    {
      label: 'Chờ duyệt',
      value: leaveRequests.filter(r => r.status === 'pending').length,
      color: '#f59e0b'
    },
    {
      label: 'Đã duyệt',
      value: leaveRequests.filter(r => r.status === 'approved').length,
      color: '#10b981'
    },
    {
      label: 'Từ chối',
      value: leaveRequests.filter(r => r.status === 'rejected').length,
      color: '#ef4444'
    }
  ]

  return (
    <div className="leave-request">
      {/* Header */}
      <div className="leave-request__header">
        <div className="leave-request__header__info">
          <h1 className="leave-request__header__info__title">
            <FileText className="leave-request__header__info__title__icon" size={32} />
            Yêu cầu nghỉ phép
          </h1>
          <p className="leave-request__header__info__description">
            Quản lý các yêu cầu nghỉ phép của bạn
          </p>
        </div>

        <button
          className="leave-request__header__button"
          onClick={() => setShowNewRequestModal(true)}
        >
          <Plus size={16} />
          Tạo yêu cầu mới
        </button>
      </div>

      {/* Stats */}
      <div className="leave-request__stats">
        {stats.map((stat, index) => (
          <div key={index} className="leave-request__stats__card">
            <div 
              className="leave-request__stats__card__value"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="leave-request__stats__card__label">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Requests List */}
      <div className="leave-request__list">
        {leaveRequests.map((request) => (
          <div key={request.id} className="leave-request__list__item">
            {/* Request Header */}
            <div className="leave-request__list__item__header">
              <div className="leave-request__list__item__header__left">
                <h3 className="leave-request__list__item__header__left__type">
                  {getLeaveTypeText(request.type)}
                </h3>
                <div className="leave-request__list__item__header__left__dates">
                  <Calendar size={14} />
                  {request.startDate} - {request.endDate} ({request.days} ngày)
                </div>
              </div>

              <div className="leave-request__list__item__header__right">
                <span 
                  className="leave-request__list__item__header__right__status"
                  style={{ backgroundColor: getStatusColor(request.status), color: 'white' }}
                >
                  {getStatusIcon(request.status)}
                  {getStatusText(request.status)}
                </span>
              </div>
            </div>

            {/* Request Body */}
            <div className="leave-request__list__item__body">
              <div className="leave-request__list__item__body__content">
                <div className="leave-request__list__item__body__content__reason">
                  <h4>Lý do nghỉ phép:</h4>
                  <p>{request.reason}</p>
                </div>

                <div className="leave-request__list__item__body__content__timeline">
                  <div className="leave-request__list__item__body__content__timeline__item">
                    <span className="leave-request__list__item__body__content__timeline__item__label">
                      Ngày gửi:
                    </span>
                    <span className="leave-request__list__item__body__content__timeline__item__value">
                      {request.submittedAt}
                    </span>
                  </div>

                  {request.reviewedAt && (
                    <div className="leave-request__list__item__body__content__timeline__item">
                      <span className="leave-request__list__item__body__content__timeline__item__label">
                        Ngày duyệt:
                      </span>
                      <span className="leave-request__list__item__body__content__timeline__item__value">
                        {request.reviewedAt}
                      </span>
                    </div>
                  )}

                  {request.reviewedBy && (
                    <div className="leave-request__list__item__body__content__timeline__item">
                      <span className="leave-request__list__item__body__content__timeline__item__label">
                        Người duyệt:
                      </span>
                      <span className="leave-request__list__item__body__content__timeline__item__value">
                        <User size={14} />
                        {request.reviewedBy}
                      </span>
                    </div>
                  )}

                  {request.rejectReason && (
                    <div className="leave-request__list__item__body__content__reject">
                      <h4>Lý do từ chối:</h4>
                      <p>{request.rejectReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {leaveRequests.length === 0 && (
        <div className="leave-request__empty">
          <div className="leave-request__empty__icon">
            <FileText size={64} />
          </div>
          <h3 className="leave-request__empty__title">
            Chưa có yêu cầu nghỉ phép
          </h3>
          <p className="leave-request__empty__description">
            Bạn chưa tạo yêu cầu nghỉ phép nào
          </p>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="leave-request__modal">
          <div className="leave-request__modal__content">
            <div className="leave-request__modal__content__header">
              <h2 className="leave-request__modal__content__header__title">
                Tạo yêu cầu nghỉ phép mới
              </h2>
              <button 
                className="leave-request__modal__content__header__close"
                onClick={() => setShowNewRequestModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="leave-request__modal__content__body">
              <div className="leave-request__modal__content__body__field">
                <label className="leave-request__modal__content__body__field__label">
                  Loại nghỉ phép
                </label>
                <select 
                  className="leave-request__modal__content__body__field__select"
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                >
                  <option value="sick">Nghỉ ốm</option>
                  <option value="personal">Nghỉ việc riêng</option>
                  <option value="vacation">Nghỉ phép</option>
                  <option value="emergency">Nghỉ khẩn cấp</option>
                </select>
              </div>

              <div className="leave-request__modal__content__body__row">
                <div className="leave-request__modal__content__body__field">
                  <label className="leave-request__modal__content__body__field__label">
                    Ngày bắt đầu
                  </label>
                  <input 
                    className="leave-request__modal__content__body__field__input"
                    type="date"
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                  />
                </div>

                <div className="leave-request__modal__content__body__field">
                  <label className="leave-request__modal__content__body__field__label">
                    Ngày kết thúc
                  </label>
                  <input 
                    className="leave-request__modal__content__body__field__input"
                    type="date"
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="leave-request__modal__content__body__field">
                <label className="leave-request__modal__content__body__field__label">
                  Lý do nghỉ phép
                </label>
                <textarea 
                  className="leave-request__modal__content__body__field__textarea"
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  placeholder="Nhập lý do nghỉ phép..."
                  rows={4}
                />
              </div>

              {newRequest.startDate && newRequest.endDate && (
                <div className="leave-request__modal__content__body__summary">
                  <strong>Tổng số ngày nghỉ: {calculateDays(newRequest.startDate, newRequest.endDate)} ngày</strong>
                </div>
              )}
            </div>

            <div className="leave-request__modal__content__actions">
              <button 
                className="leave-request__modal__content__actions__button leave-request__modal__content__actions__button--secondary"
                onClick={() => setShowNewRequestModal(false)}
              >
                Hủy
              </button>
              <button 
                className="leave-request__modal__content__actions__button leave-request__modal__content__actions__button--primary"
                onClick={handleSubmitRequest}
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
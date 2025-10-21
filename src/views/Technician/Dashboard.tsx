import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import { 
  Wrench, 
  ClipboardCheck, 
  Package, 
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Bell,
  Search,
  Menu,
  Settings,
  BarChart3,
  Calendar,
  FileText,
  Car,
  MessageSquare
} from 'lucide-react'
import {
  WorkQueue,
  CustomerRequestsContent,
  WorkSchedule,
  LeaveRequest,
  VehicleDetails
} from '@/components/technician'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import './technician.scss'
import './technician-dashboard.scss'

// Work Detail Modal Component (kept for WorkQueue compatibility)
interface WorkDetailModalProps {
  selectedWork: any
  setSelectedWork: (work: any) => void
  setIsDetailModalOpen: (open: boolean) => void
  setWorkQueue: (updater: (prev: any) => any) => void
}

function WorkDetailModal({ selectedWork, setSelectedWork, setIsDetailModalOpen, setWorkQueue }: WorkDetailModalProps) {
  const [workNotes, setWorkNotes] = useState(selectedWork?.notes || '')
  const [workProgress] = useState([
    {
      id: 1,
      step: 'Tiếp nhận xe',
      description: 'Kiểm tra tình trạng xe khi tiếp nhận',
      completed: true,
      completedAt: '2024-01-20 09:15',
      technician: 'Kỹ thuật viên hiện tại'
    },
    {
      id: 2,
      step: 'Chẩn đoán sự cố',
      description: 'Xác định nguyên nhân và phạm vi sửa chữa',
      completed: selectedWork?.status !== 'Chờ nhận',
      completedAt: selectedWork?.status !== 'Chờ nhận' ? '2024-01-20 09:30' : null,
      technician: selectedWork?.status !== 'Chờ nhận' ? 'Kỹ thuật viên hiện tại' : null
    },
    {
      id: 3,
      step: 'Thực hiện sửa chữa',
      description: 'Tiến hành các công việc theo yêu cầu',
      completed: selectedWork?.status === 'Hoàn thành',
      completedAt: selectedWork?.status === 'Hoàn thành' ? '2024-01-20 11:00' : null,
      technician: selectedWork?.status === 'Hoàn thành' ? 'Kỹ thuật viên hiện tại' : null
    },
    {
      id: 4,
      step: 'Kiểm tra chất lượng',
      description: 'Kiểm tra và test thử xe sau khi sửa chữa',
      completed: selectedWork?.status === 'Hoàn thành',
      completedAt: selectedWork?.status === 'Hoàn thành' ? '2024-01-20 11:15' : null,
      technician: selectedWork?.status === 'Hoàn thành' ? 'Kỹ thuật viên hiện tại' : null
    },
    {
      id: 5,
      step: 'Giao xe',
      description: 'Bàn giao xe cho khách hàng',
      completed: false,
      completedAt: null,
      technician: null
    }
  ])
  
  const [activeTab, setActiveTab] = useState('overview')
  // timeEntries removed as it's not used

  const handleStatusUpdate = (newStatus: string) => {
    setWorkQueue((prev: any) => 
      prev.map((work: any) => 
        work.id === selectedWork.id 
          ? { ...work, status: newStatus }
          : work
      )
    )
    setSelectedWork((prev: any) => ({ ...prev, status: newStatus }))
  }

  // handleStepComplete removed as it's not used

  const completedSteps = workProgress.filter(step => step.completed).length
  const totalSteps = workProgress.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Cao': return '#ef4444'
      case 'Trung bình': return '#f59e0b'
      case 'Thấp': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Cao': return AlertCircle
      case 'Trung bình': return Clock
      case 'Thấp': return CheckCircle
      default: return Clock
    }
  }

  if (!selectedWork) return null

  return (
    <div className="work-detail-modal">
      <div className="work-detail-modal__content">
        {/* Header */}
        <div className="work-detail-modal__content__header">
          <div className="work-detail-modal__content__header__info">
            <h2 className="work-detail-modal__content__header__info__title">
              <div className="work-detail-modal__content__header__info__title__icon">
                <Wrench size={20} />
              </div>
              Chi tiết công việc #{selectedWork.id}
            </h2>
            <div className="work-detail-modal__content__header__info__meta">
              <span>{selectedWork.customer}</span>
              <span>•</span>
              <span>{selectedWork.licensePlate}</span>
              <span>•</span>
              <span className="work-detail-modal__content__header__info__meta__status">
                {selectedWork.status}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsDetailModalOpen(false)
              setSelectedWork(null)
            }}
            className="work-detail-modal__content__header__close"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="work-detail-modal__content__progress">
          <div className="work-detail-modal__content__progress__header">
            <span className="work-detail-modal__content__progress__header__label">
              Tiến độ công việc
            </span>
            <span className="work-detail-modal__content__progress__header__value">
              {completedSteps}/{totalSteps} bước ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <div className="work-detail-modal__content__progress__bar">
            <div 
              className="work-detail-modal__content__progress__bar__fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="work-detail-modal__content__tabs">
          <div className="work-detail-modal__content__tabs__nav">
            {[
              { id: 'overview', label: 'Tổng quan', icon: Settings },
              { id: 'progress', label: 'Tiến độ', icon: Clock },
              { id: 'parts', label: 'Phụ tùng', icon: Package },
              { id: 'time', label: 'Thời gian', icon: BarChart3 },
              { id: 'notes', label: 'Ghi chú', icon: ClipboardCheck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`work-detail-modal__content__tabs__nav__item ${
                  activeTab === tab.id ? 'work-detail-modal__content__tabs__nav__item--active' : ''
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="work-detail-modal__content__body">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-tab__grid">
                {/* Customer Info */}
                <div className="overview-tab__card">
                  <h3 className="overview-tab__card__title">
                    <User size={20} />
                    Thông tin khách hàng
                  </h3>
                  <div>
                    <div className="overview-tab__card__field">
                      <span className="overview-tab__card__field__label">Họ tên</span>
                      <span className="overview-tab__card__field__value">{selectedWork.customer}</span>
                    </div>
                    <div className="overview-tab__card__field">
                      <span className="overview-tab__card__field__label">Số điện thoại</span>
                      <span className="overview-tab__card__field__value">{selectedWork.customerPhone}</span>
                    </div>
                    <div className="overview-tab__card__field">
                      <span className="overview-tab__card__field__label">Email</span>
                      <span className="overview-tab__card__field__value">{selectedWork.customerEmail || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="overview-tab__card">
                  <h3 className="overview-tab__card__title">
                    🏍️ Thông tin xe
                  </h3>
                  <div>
                    <div className="overview-tab__card__field">
                      <span className="overview-tab__card__field__label">Biển số xe</span>
                      <span className="overview-tab__card__field__value">{selectedWork.licensePlate}</span>
                    </div>
                    <div className="overview-tab__card__field">
                      <span className="overview-tab__card__field__label">Hãng xe</span>
                      <span className="overview-tab__card__field__value">{selectedWork.bikeBrand || 'Honda Lead'}</span>
                    </div>
                    <div className="overview-tab__card__field">
                      <span className="overview-tab__card__field__label">Năm sản xuất</span>
                      <span className="overview-tab__card__field__value">{selectedWork.bikeModel || '2023'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="overview-tab__service-details">
                <h3 className="overview-tab__service-details__title">
                  <Settings size={20} />
                  Chi tiết dịch vụ
                </h3>
                <div className="overview-tab__service-details__grid">
                  <div className="overview-tab__service-details__field">
                    <span className="overview-tab__service-details__field__label">Loại dịch vụ</span>
                    <span className="overview-tab__service-details__field__value">{selectedWork.serviceType}</span>
                  </div>
                  <div className="overview-tab__service-details__field">
                    <span className="overview-tab__service-details__field__label">Độ ưu tiên</span>
                    <span className="overview-tab__service-details__field__value overview-tab__service-details__field__value--priority" style={{ color: getPriorityColor(selectedWork.priority) }}>
                      {React.createElement(getPriorityIcon(selectedWork.priority), { size: 16 })}
                      {selectedWork.priority}
                    </span>
                  </div>
                  <div className="overview-tab__service-details__field">
                    <span className="overview-tab__service-details__field__label">Thời gian ước tính</span>
                    <span className="overview-tab__service-details__field__value">{selectedWork.estimatedTime}</span>
                  </div>
                  <div className="overview-tab__service-details__field">
                    <span className="overview-tab__service-details__field__label">Ngày hẹn</span>
                    <span className="overview-tab__service-details__field__value">{selectedWork.scheduledDate} - {selectedWork.scheduledTime}</span>
                  </div>
                </div>
                <div className="overview-tab__service-details__description">
                  <span className="overview-tab__service-details__description__label">Mô tả công việc</span>
                  <p className="overview-tab__service-details__description__text">
                    {selectedWork.description}
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="overview-tab__actions">
                {selectedWork.status === 'Chờ nhận' && (
                  <button
                    onClick={() => handleStatusUpdate('Đang thực hiện')}
                    className="overview-tab__actions__button overview-tab__actions__button--primary"
                  >
                    <Settings size={16} />
                    Nhận việc
                  </button>
                )}
                
                {selectedWork.status === 'Đang thực hiện' && (
                  <button
                    onClick={() => handleStatusUpdate('Hoàn thành')}
                    className="overview-tab__actions__button overview-tab__actions__button--success"
                  >
                    <CheckCircle size={16} />
                    Hoàn thành
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'parts' && (
            <div className="parts-tab">
              <h3 className="parts-tab__title">
                Checklist kiểm tra phụ tùng
              </h3>
              {selectedWork.parts && selectedWork.parts.length > 0 ? (
                <div className="parts-tab__list">
                  {selectedWork.parts.map((part: string, index: number) => (
                    <div key={index} className="parts-tab__list__item">
                      <span>{part}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parts-tab__empty">
                  <Package size={48} className="parts-tab__empty__icon" />
                  <p>Không cần kiểm tra phụ tùng cho công việc này</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="notes-tab">
              <h3 className="notes-tab__title">
                Ghi chú công việc
              </h3>
              <textarea
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                placeholder="Thêm ghi chú về quá trình thực hiện..."
                className="notes-tab__textarea"
              />
              <div className="notes-tab__actions">
                <button className="notes-tab__actions__button">
                  Lưu ghi chú
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedWork, setSelectedWork] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/auth/login')
  }

  // Dashboard overview data
  const dashboardData = {
    workCompleted: [
      { name: 'T2', value: 4 },
      { name: 'T3', value: 6 },
      { name: 'T4', value: 3 },
      { name: 'T5', value: 8 },
      { name: 'T6', value: 5 },
      { name: 'T7', value: 7 },
      { name: 'CN', value: 2 }
    ],
    workTypes: [
      { name: 'Bảo dưỡng', value: 45, color: '#0088FE' },
      { name: 'Sửa chữa', value: 30, color: '#00C49F' },
      { name: 'Thay thế', value: 25, color: '#FFBB28' }
    ]
  }

  const stats = [
    {
      title: 'Công việc hoàn thành',
      value: 156,
      change: '+12%',
      icon: CheckCircle,
      color: 'var(--success-500)'
    },
    {
      title: 'Đang thực hiện',
      value: 8,
      change: '+3',
      icon: Clock,
      color: 'var(--primary-500)'
    },
    {
      title: 'Chờ nhận',
      value: 12,
      change: '-2',
      icon: AlertCircle,
      color: 'var(--warning-500)'
    },
    {
      title: 'Đánh giá trung bình',
      value: 4.8,
      change: '+0.2',
      icon: User,
      color: 'var(--primary-500)'
    }
  ]

  const quickActions = [
    {
      title: 'Hàng đợi công việc',
      description: 'Xem và nhận công việc mới',
      icon: Wrench,
      page: 'work-queue',
      color: 'var(--primary-500)'
    },
    {
      title: 'Lịch làm việc',
      description: 'Xem lịch trình và ca làm việc',
      icon: Calendar,
      page: 'work-schedule',
      color: 'var(--success-500)'
    },
    {
      title: 'Yêu cầu nghỉ phép',
      description: 'Tạo đơn xin nghỉ phép',
      icon: FileText,
      page: 'leave-request',
      color: '#ef4444'
    },
    {
      title: 'Chi tiết xe khách',
      description: 'Xem thông tin xe và phụ tùng',
      icon: Car,
      page: 'vehicle-details',
      color: '#06b6d4'
    },
    {
      title: 'Yêu cầu khách hàng',
      description: 'Đánh giá thông tin xe từ khách hàng',
      icon: MessageSquare,
      page: 'customer-requests',
      color: '#8b5cf6'
    },
    {
      title: 'Danh sách kiểm tra',
      description: 'Checklist bảo trì và sửa chữa',
      icon: ClipboardCheck,
      page: 'checklists',
      color: 'var(--success-500)'
    }
  ]

  // Page components
  const renderPageContent = () => {
    switch (activePage) {
      case 'work-queue':
        return <WorkQueue onViewDetails={(work) => {
          setSelectedWork(work)
          setIsDetailModalOpen(true)
        }} />
      case 'work-schedule':
        return <WorkSchedule 
          onNavigateToLeaveRequest={() => setActivePage('leave-request')}
          onNavigateToVehicleDetails={() => setActivePage('vehicle-details')}
        />
      case 'leave-request':
        return <LeaveRequest />
      case 'vehicle-details':
        return <VehicleDetails />
      case 'customer-requests':
        return <CustomerRequestsContent />
      case 'checklists':
        return (
          <div>
            <h2>Danh sách kiểm tra</h2>
            <p>Tính năng đang được phát triển...</p>
          </div>
        )
      case 'parts-request':
        return (
          <div>
            <h2>Yêu cầu phụ tùng</h2>
            <p>Tính năng đang được phát triển...</p>
          </div>
        )
      case 'settings':
        return (
          <div>
            <h2>Cài đặt</h2>
            <p>Tính năng đang được phát triển...</p>
          </div>
        )
      default:
        return <DashboardOverview />
    }
  }

  function DashboardOverview() {
    return (
      <div className="dashboard-overview">
        {/* Welcome Section */}
        <div className="dashboard-overview__welcome">
          <div className="dashboard-overview__welcome__decoration dashboard-overview__welcome__decoration--top" />
          <div className="dashboard-overview__welcome__decoration dashboard-overview__welcome__decoration--bottom" />
          
          <div className="dashboard-overview__welcome__content">
            <h1 className="dashboard-overview__welcome__content__title">
              Chào mừng trở lại! 👋
        </h1>
            <p className="dashboard-overview__welcome__content__subtitle">
              Hôm nay bạn có 8 công việc đang chờ xử lý
            </p>
            <div className="dashboard-overview__welcome__content__meta">
              <div className="dashboard-overview__welcome__content__meta__item">
                <Calendar size={16} />
                <span>{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="dashboard-overview__welcome__content__meta__item">
                <Clock size={16} />
                <span>Ca sáng: 8:00 - 17:00</span>
              </div>
            </div>
          </div>
      </div>

        {/* Stats Cards */}
        <div className="dashboard-overview__stats">
        {stats.map((stat, index) => (
            <div key={index} className="dashboard-overview__stats__card">
              <div className="dashboard-overview__stats__card__header">
                <div 
                  className="dashboard-overview__stats__card__header__icon"
                  style={{ background: stat.color + '15' }}
                >
                  <stat.icon size={24} style={{ color: stat.color }} />
              </div>
                <span className={`dashboard-overview__stats__card__header__change ${
                  stat.change.startsWith('+') ? 'dashboard-overview__stats__card__header__change--positive' : 'dashboard-overview__stats__card__header__change--negative'
                }`}>
                {stat.change}
                </span>
              </div>
              <div className="dashboard-overview__stats__card__value">
                {stat.value}
            </div>
              <div className="dashboard-overview__stats__card__label">
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
        <div className="dashboard-overview__charts">
          {/* Work Completed Chart */}
          <div className="dashboard-overview__charts__card">
            <h3 className="dashboard-overview__charts__card__title">
              Công việc hoàn thành tuần này
          </h3>
          <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.workCompleted}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
              <Area
                type="monotone"
                  dataKey="value" 
                  stroke="var(--primary-500)" 
                  fill="var(--primary-100)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

          {/* Work Types Pie Chart */}
          <div className="dashboard-overview__charts__card">
            <h3 className="dashboard-overview__charts__card__title">
              Loại công việc
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.workTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardData.workTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

        {/* Quick Actions */}
        <div className="dashboard-overview__quick-actions">
          <h3 className="dashboard-overview__quick-actions__title">
            Thao tác nhanh
          </h3>
          <div className="dashboard-overview__quick-actions__grid">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => setActivePage(action.page)}
                className="dashboard-overview__quick-actions__grid__item"
                style={{
                  '--action-color': action.color
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = action.color + '10'
                  e.currentTarget.style.borderColor = action.color + '40'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                }}
              >
                <div 
                  className="dashboard-overview__quick-actions__grid__item__icon"
                  style={{ background: action.color + '15' }}
                >
                  <action.icon size={24} style={{ color: action.color }} />
                </div>
                <div className="dashboard-overview__quick-actions__grid__item__content">
                  <h4 className="dashboard-overview__quick-actions__grid__item__content__title">
                    {action.title}
                  </h4>
                  <p className="dashboard-overview__quick-actions__grid__item__content__description">
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
                </div>
    )
  }

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard'
      case 'work-queue': return 'Hàng đợi công việc'
      case 'work-schedule': return 'Lịch làm việc'
      case 'leave-request': return 'Yêu cầu nghỉ phép'
      case 'vehicle-details': return 'Chi tiết xe khách'
      case 'customer-requests': return 'Yêu cầu khách hàng'
      case 'checklists': return 'Danh sách kiểm tra'
      case 'parts-request': return 'Yêu cầu phụ tùng'
      case 'settings': return 'Cài đặt'
      default: return 'Dashboard'
    }
  }

  return (
    <div className="technician-dashboard">
      {/* Sidebar */}
      <div className={`technician-dashboard__sidebar ${sidebarCollapsed ? 'technician-dashboard__sidebar--collapsed' : ''}`}>
          {/* Logo */}
        <div className={`technician-dashboard__sidebar__logo ${sidebarCollapsed ? 'technician-dashboard__sidebar__logo--collapsed' : ''}`}>
          <div className="technician-dashboard__sidebar__logo__icon">
            🔧
            </div>
            {!sidebarCollapsed && (
            <div className="technician-dashboard__sidebar__logo__text">
              <div className="technician-dashboard__sidebar__logo__text__title">
                Technician
              </div>
              <div className="technician-dashboard__sidebar__logo__text__subtitle">
                Kỹ thuật viên
              </div>
              </div>
            )}
          </div>

          {/* Navigation */}
        <div className={`technician-dashboard__sidebar__nav ${sidebarCollapsed ? 'technician-dashboard__sidebar__nav--collapsed' : ''}`}>
          {/* Main Navigation */}
          <div className="technician-dashboard__sidebar__nav__section">
            <h3 className={`technician-dashboard__sidebar__nav__section__title ${sidebarCollapsed ? 'technician-dashboard__sidebar__nav__section__title--hidden' : ''}`}>
                Tổng quan
              </h3>
            {[
              { icon: BarChart3, label: 'Dashboard', page: 'dashboard' }
            ].map((item, index) => (
              <div 
                key={index}
                onClick={() => setActivePage(item.page)}
                title={sidebarCollapsed ? item.label : ''}
                className={`technician-dashboard__sidebar__nav__section__item ${
                  sidebarCollapsed ? 'technician-dashboard__sidebar__nav__section__item--collapsed' : ''
                } ${
                  activePage === item.page ? 'technician-dashboard__sidebar__nav__section__item--active' : ''
                }`}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
            ))}
            </div>

          {/* Work Navigation */}
          <div className="technician-dashboard__sidebar__nav__section">
            <h3 className={`technician-dashboard__sidebar__nav__section__title ${sidebarCollapsed ? 'technician-dashboard__sidebar__nav__section__title--hidden' : ''}`}>
                Công việc
              </h3>
              {[
                { icon: Wrench, label: 'Hàng đợi công việc', page: 'work-queue' },
              { icon: Calendar, label: 'Lịch làm việc', page: 'work-schedule' },
              { icon: FileText, label: 'Yêu cầu nghỉ phép', page: 'leave-request' },
              { icon: Car, label: 'Chi tiết xe khách', page: 'vehicle-details' },
              { icon: MessageSquare, label: 'Yêu cầu khách hàng', page: 'customer-requests' },
                { icon: ClipboardCheck, label: 'Danh sách kiểm tra', page: 'checklists' },
                { icon: Package, label: 'Yêu cầu phụ tùng', page: 'parts-request' },
                { icon: Settings, label: 'Cài đặt', page: 'settings' }
              ].map((item, index) => (
                <div 
                  key={index}
                  onClick={() => setActivePage(item.page)}
                title={sidebarCollapsed ? item.label : ''}
                className={`technician-dashboard__sidebar__nav__section__item ${
                  sidebarCollapsed ? 'technician-dashboard__sidebar__nav__section__item--collapsed' : ''
                } ${
                  activePage === item.page ? 'technician-dashboard__sidebar__nav__section__item--active' : ''
                }`}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
              ))}
            </div>
        </div>

        {/* Sidebar Toggle */}
        <div className={`technician-dashboard__sidebar__toggle ${sidebarCollapsed ? 'technician-dashboard__sidebar__toggle--collapsed' : ''}`}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="technician-dashboard__sidebar__toggle__button"
          >
            <Menu size={16} />
            {!sidebarCollapsed && <span>Thu gọn</span>}
        </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="technician-dashboard__main">
        {/* Header */}
        <div className="technician-dashboard__main__header">
          <h2 className="technician-dashboard__main__header__title">
            {getPageTitle()}
          </h2>

          <div className="technician-dashboard__main__header__actions">
            {/* Search */}
            <div className="technician-dashboard__main__header__actions__search">
              <Search size={16} className="technician-dashboard__main__header__actions__search__icon" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="technician-dashboard__main__header__actions__search__input"
              />
            </div>

            {/* Notifications */}
            <div className="technician-dashboard__main__header__actions__notification">
              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
              <div className="technician-dashboard__main__header__actions__notification__badge" />
            </div>

            {/* User Profile */}
            <div className="technician-dashboard__main__header__actions__profile" onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <div className="technician-dashboard__main__header__actions__profile__avatar">
                KT
              </div>
              <div className="technician-dashboard__main__header__actions__profile__info">
                <span className="technician-dashboard__main__header__actions__profile__info__name">
                  Kỹ thuật viên
                </span>
                <span className="technician-dashboard__main__header__actions__profile__info__role">
                  Technician
                </span>
              </div>
              <div style={{ marginLeft: '8px', color: 'var(--text-tertiary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="technician-dashboard__main__content">
        {renderPageContent()}
      </div>
      </div>

      {/* Work Detail Modal */}
      {isDetailModalOpen && selectedWork && (
        <WorkDetailModal 
          selectedWork={selectedWork}
          setSelectedWork={setSelectedWork}
          setIsDetailModalOpen={setIsDetailModalOpen}
          setWorkQueue={() => {}} // Empty function since we're not managing work queue here
        />
      )}
    </div>
  )
}

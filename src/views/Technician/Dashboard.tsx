import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import toast from 'react-hot-toast'
import { TechnicianService } from '@/services/technicianService'
import { 
  Wrench, 
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
  AlertCircle,
  User,
  Bell,
  Menu,
  Calendar,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react'
import {
  WorkQueue,
  WorkSchedule
} from '@/components/technician'
import BookingDetail from '@/components/technician/BookingDetail'
import TechnicianProfile from '@/components/technician/TechnicianProfile'
import NotificationBell from '@/components/common/NotificationBell'
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
      case 'Trung bình': return CheckCircle
      case 'Thấp': return CheckCircle
      default: return CheckCircle
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
              { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
              { id: 'progress', label: 'Tiến độ', icon: BarChart3 },
              { id: 'time', label: 'Thời gian', icon: BarChart3 },
              { id: 'notes', label: 'Ghi chú', icon: FileText }
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
  const { user } = useAppSelector((s) => s.auth)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('work-queue')
  const [selectedWork, setSelectedWork] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null)
  
  // State cho thông tin kỹ thuật viên và trung tâm
  const [technicianInfo, setTechnicianInfo] = useState<any>(null)
  const [centerInfo, setCenterInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasCenter, setHasCenter] = useState(false)

  // Load thông tin kỹ thuật viên khi component mount
  useEffect(() => {
    const loadTechnicianInfo = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Lấy technicianId từ userId
        const techInfo = await TechnicianService.getTechnicianIdByUserId(user.id)
        
        if (techInfo.success && techInfo.data) {
          setTechnicianInfo(techInfo.data)
          
          
          // Kiểm tra xem technician có centerId không
          if (techInfo.data.centerId) {
            setHasCenter(true)
            
            // Lấy thông tin chi tiết về trung tâm từ danh sách technicians của center
            try {
              const centerTechnicians = await TechnicianService.getTechniciansByCenter(techInfo.data.centerId)
              
              if (centerTechnicians?.success && centerTechnicians?.data?.technicians) {
                // Tìm technician hiện tại trong danh sách để lấy thông tin center
                const currentTech = centerTechnicians.data.technicians.find((t: any) => 
                  t.technicianId === techInfo.data.technicianId || t.userId === user.id
                )
                
                if (currentTech) {
                  setCenterInfo({
                    centerId: currentTech.centerId,
                    centerName: currentTech.centerName || 'Trung tâm chưa có tên'
                  })
                } else {
                  // Fallback: sử dụng thông tin từ techInfo
                  setCenterInfo({
                    centerId: techInfo.data.centerId,
                    centerName: `Trung tâm ${techInfo.data.centerId}`
                  })
                }
              } else {
                // Fallback: sử dụng thông tin từ techInfo
                setCenterInfo({
                  centerId: techInfo.data.centerId,
                  centerName: `Trung tâm ${techInfo.data.centerId}`
                })
              }
            } catch (centerError) {
              // Fallback: sử dụng thông tin từ techInfo
              setCenterInfo({
                centerId: techInfo.data.centerId,
                centerName: `Trung tâm ${techInfo.data.centerId}`
              })
            }
          } else {
            setHasCenter(false)
            setCenterInfo(null)
          }
        } else {
          setHasCenter(false)
          setCenterInfo(null)
        }
        
      } catch (error) {
        toast.error('Không thể tải thông tin kỹ thuật viên')
        setHasCenter(false)
      } finally {
        setLoading(false)
      }
    }

    loadTechnicianInfo()
  }, [user?.id])

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Đăng xuất thành công!')
    navigate('/auth/login')
  }




  // Page components
  const renderPageContent = () => {
    switch (activePage) {
      case 'work-queue':
        return <WorkQueue onViewDetails={(work) => {
          setSelectedWork(work)
          setIsDetailModalOpen(true)
        }} onViewBookingDetail={handleViewBookingDetail} />
      case 'work-schedule':
        return <WorkSchedule />
      case 'booking-detail':
        return selectedBookingId ? (
          <BookingDetail 
            bookingId={selectedBookingId}
            onBack={handleBackFromBookingDetail}
          />
        ) : null
      case 'profile':
        return <TechnicianProfile />
      default:
        return <WorkQueue onViewDetails={(work) => {
          setSelectedWork(work)
          setIsDetailModalOpen(true)
        }} onViewBookingDetail={handleViewBookingDetail} />
    }
  }


  const getPageTitle = () => {
    return centerInfo?.centerName || 'Dashboard'
  }

  const handleViewBookingDetail = (bookingId: number) => {
    setSelectedBookingId(bookingId)
    setActivePage('booking-detail')
  }

  const handleBackFromBookingDetail = () => {
    setSelectedBookingId(null)
    setActivePage('work-queue')
  }


  return (
    <div className="technician-dashboard">
      {/* Sidebar */}
      <div className={`technician-dashboard__sidebar ${sidebarCollapsed ? 'technician-dashboard__sidebar--collapsed' : ''}`}>
          {/* Logo */}
        <div className={`technician-dashboard__sidebar__logo ${sidebarCollapsed ? 'technician-dashboard__sidebar__logo--collapsed' : ''}`}>
          <div className="technician-dashboard__sidebar__logo__image">
             <img 
               src="/src/assets/images/10.webp" 
               alt="Logo" 
               style={{ width: '48px', height: '48px', objectFit: 'contain' }}
             />
          </div>
          </div>

          {/* Navigation */}
        <div className={`technician-dashboard__sidebar__nav ${sidebarCollapsed ? 'technician-dashboard__sidebar__nav--collapsed' : ''}`}>
          <div className="technician-dashboard__sidebar__nav__section">
            {[
              { icon: Wrench, label: 'Hàng đợi công việc', page: 'work-queue' },
              { icon: Calendar, label: 'Lịch làm việc', page: 'work-schedule' },
              { icon: Settings, label: 'Thông tin cá nhân', page: 'profile' }
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
          <div className="technician-dashboard__main__header__left">
            <h2 className="technician-dashboard__main__header__title">
              {getPageTitle()}
            </h2>
            {technicianInfo?.centerName && (
              <div className="technician-dashboard__main__header__center">
                <span className="technician-dashboard__main__header__center__name">
                  {technicianInfo.centerName}
                </span>
              </div>
            )}
          </div>

          <div className="technician-dashboard__main__header__actions">
            {/* Notifications */}
            <NotificationBell />

            {/* User Profile */}
            <div className="technician-dashboard__main__header__actions__profile" onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <div className="technician-dashboard__main__header__actions__profile__avatar">
                {technicianInfo?.technicianName ? technicianInfo.technicianName.charAt(0).toUpperCase() : 
                 user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'KT'}
              </div>
              <div className="technician-dashboard__main__header__actions__profile__info">
                <span className="technician-dashboard__main__header__actions__profile__info__name">
                  {technicianInfo?.technicianName || user?.fullName || 'Kỹ thuật viên'}
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

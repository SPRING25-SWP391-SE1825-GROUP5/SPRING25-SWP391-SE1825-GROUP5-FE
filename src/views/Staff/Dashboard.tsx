import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import toast from 'react-hot-toast'
import {
  Calendar,
  ClipboardList,
  Menu,
  LogOut,
  BarChart3,
  Package
} from 'lucide-react'
import InventoryPage from '@/components/staff/InventoryPage'
import AppointmentManagement from '@/components/staff/AppointmentManagement'
import ServiceOrdersPage from '@/components/staff/ServiceOrdersPage'
import TechnicianSchedulePage from '@/components/staff/TechnicianSchedulePage'
import './staff.scss'
import PartsApproval from '@/components/booking/PartsApproval'
import { WorkOrderPartService } from '@/services/workOrderPartService'
import PaymentModal from '@/components/payment/PaymentModal'
import { BookingService } from '@/services/bookingService'
import FeedbackModal from '@/components/feedback/FeedbackModal'
import { feedbackService } from '@/services/feedbackService'
import logoImage from '@/assets/images/10.webp'
import WorkQueue from '@/components/technician/WorkQueue'

export default function StaffDashboard() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('work-queue')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [approvalBookingId, setApprovalBookingId] = useState<number | ''>('')
  const [parts, setParts] = useState<Array<{ id: number; partId: number; partName?: string; status?: string }>>([])
  const [loadingParts, setLoadingParts] = useState(false)
  const [paymentBookingId, setPaymentBookingId] = useState<number | ''>('')
  const [paymentTotalAmount, setPaymentTotalAmount] = useState<number>(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loadingPaymentBooking, setLoadingPaymentBooking] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackBookingId, setFeedbackBookingId] = useState<number | ''>('')

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Đăng xuất thành công!')
    navigate('/auth/login')
  }

  // Page components
  const renderPageContent = () => {
    switch (activePage) {
      case 'appointments':
        return <AppointmentManagement />
      case 'service-orders':
        return <ServiceOrdersPage />
      case 'inventory':
        return <InventoryPage />
      case 'technician-schedule':
        return <TechnicianSchedulePage />
      case 'work-queue':
        return <WorkQueue mode="staff" />
      default:
        return <WorkQueue mode="staff" />
    }
  }


  return (
    <div className="staff-dashboard" style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Staff Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: sidebarCollapsed ? '80px' : '280px',
        right: 0,
        height: '64px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1003,
        transition: 'left 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              color: 'var(--text-primary)'
            }}
            className="mobile-menu-btn"
            title="Toggle mobile menu"
            aria-label="Toggle mobile menu"
          >
            <Menu size={20} />
          </button>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Staff Panel
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--primary-50)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={handleLogout}
          >
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--primary-500)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              S
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Staff User
            </span>
            <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`staff-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-primary)',
          transition: 'width 0.3s ease',
          position: 'fixed',
          height: '100vh',
          zIndex: 1004,
          top: 0
        }}
      >
        <div style={{ padding: '24px' }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '32px',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
          }}>
            <img
              src={logoImage}
              alt="Logo"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                marginRight: sidebarCollapsed ? '0' : '12px',
                objectFit: 'cover',
                boxShadow: '0 0 12px rgba(255, 216, 117, 0.6)'
              }}
            />
            {!sidebarCollapsed && (
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Staff Panel
                </h1>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  margin: '0'
                }}>
                  Quản lý dịch vụ
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 12px 0',
                display: sidebarCollapsed ? 'none' : 'block'
              }}>
                Tác vụ
              </h3>
              <div
                onClick={() => setActivePage('work-queue')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: activePage === 'work-queue' ? 'var(--primary-500)' : 'var(--text-secondary)',
                  background: activePage === 'work-queue' ? 'var(--primary-50)' : 'transparent',
                  fontWeight: '500',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activePage !== 'work-queue') {
                    e.currentTarget.style.background = 'var(--primary-50)'
                    e.currentTarget.style.color = 'var(--primary-500)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activePage !== 'work-queue') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <ClipboardList size={20} style={{ marginRight: sidebarCollapsed ? '0' : '12px' }} />
                {!sidebarCollapsed && 'Hàng đợi công việc'}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 12px 0',
                display: sidebarCollapsed ? 'none' : 'block'
              }}>
                Quản lý
              </h3>
              {[
                { icon: Calendar, label: 'Lịch hẹn', page: 'appointments' },
                { icon: Package, label: 'Quản lý kho', page: 'inventory' }
              ].map((item, index) => (
                <div
                  key={index}
                  onClick={() => setActivePage(item.page)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: activePage === item.page ? 'var(--primary-500)' : 'var(--text-secondary)',
                    background: activePage === item.page ? 'var(--primary-50)' : 'transparent',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (activePage !== item.page) {
                      e.currentTarget.style.background = 'var(--primary-50)'
                      e.currentTarget.style.color = 'var(--primary-500)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activePage !== item.page) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <item.icon size={20} style={{ marginRight: sidebarCollapsed ? '0' : '12px' }} />
                  {!sidebarCollapsed && item.label}
                </div>
              ))}

              {/* Technician Schedule Link */}
              <div
                onClick={() => setActivePage('technician-schedule')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: activePage === 'technician-schedule' ? 'var(--primary-500)' : 'var(--text-secondary)',
                  background: activePage === 'technician-schedule' ? 'var(--primary-50)' : 'transparent',
                  transition: 'all 0.2s ease',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  if (activePage !== 'technician-schedule') {
                    e.currentTarget.style.background = 'var(--primary-50)'
                    e.currentTarget.style.color = 'var(--primary-500)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activePage !== 'technician-schedule') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <Calendar size={20} style={{ marginRight: sidebarCollapsed ? '0' : '12px' }} />
                {!sidebarCollapsed && 'Lịch kỹ thuật viên'}
              </div>
            </div>
          </nav>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'absolute',
            top: '24px',
            right: '-12px',
            width: '24px',
            height: '24px',
            background: 'var(--primary-500)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Main Content */}
      <div
        className="staff-main-content"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          padding: '32px',
          paddingTop: '96px',
          background: '#fff',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
          maxWidth: 'none'
        }}
      >
        {renderPageContent()}
        {/* Quick Parts Approval Panel */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            background: '#fff',
            border: '1px solid var(--border-primary)',
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <ClipboardList size={18} />
              <strong>Phê duyệt phụ tùng nhanh (hỗ trợ khách)</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <input
                type="number"
                placeholder="Booking ID"
                value={approvalBookingId}
                onChange={(e) => setApprovalBookingId(e.target.value ? Number(e.target.value) : '')}
                style={{ padding: '8px 10px', border: '1px solid var(--border-primary)', borderRadius: 8 }}
              />
              <button
                onClick={async () => {
                  if (!approvalBookingId) return
                  setLoadingParts(true)
                  try {
                    const items = await WorkOrderPartService.list(Number(approvalBookingId))
                    setParts(items.map(it => ({ id: it.id, partId: it.partId, partName: it.partName, status: it.status })))
                  } finally {
                    setLoadingParts(false)
                  }
                }}
                className="btn-primary"
                style={{ padding: '8px 12px' }}
              >
                Tải phụ tùng
              </button>
            </div>
            {loadingParts ? (
              <div style={{ color: 'var(--text-secondary)' }}>Đang tải...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {parts.map(p => (
                  <PartsApproval
                    key={p.id}
                    bookingId={Number(approvalBookingId)}
                    workOrderPartId={p.id}
                    partId={p.partId}
                    partName={p.partName}
                    mode="staff"
                    status={p.status}
                    onApproved={async () => {
                      if (approvalBookingId) {
                        setLoadingParts(true)
                        try {
                          const items = await WorkOrderPartService.list(Number(approvalBookingId))
                          setParts(items.map(it => ({ id: it.id, partId: it.partId, partName: it.partName, status: it.status })))
                        } finally {
                          setLoadingParts(false)
                        }
                      }
                    }}
                  />
                ))}
                {approvalBookingId && parts.length === 0 && (
                  <div style={{ color: 'var(--text-secondary)' }}>Không có phụ tùng cần phê duyệt.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Payment for Customer Panel */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            background: '#fff',
            border: '1px solid var(--border-primary)',
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <ClipboardList size={18} />
              <strong>Tạo thanh toán cho khách (nhập Booking ID)</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <input
                type="number"
                placeholder="Booking ID"
                value={paymentBookingId}
                onChange={(e) => setPaymentBookingId(e.target.value ? Number(e.target.value) : '')}
                style={{ padding: '8px 10px', border: '1px solid var(--border-primary)', borderRadius: 8 }}
              />
              <button
                className="btn-primary"
                style={{ padding: '8px 12px' }}
                disabled={loadingPaymentBooking || !paymentBookingId}
                onClick={async () => {
                  if (!paymentBookingId) return
                  setLoadingPaymentBooking(true)
                  try {
                    const detail = await BookingService.getBookingDetail(Number(paymentBookingId))
                    if (detail?.success && detail?.data) {
                      setPaymentTotalAmount(detail.data.totalAmount || 0)
                      setShowPaymentModal(true)
                    } else {
                      toast.error('Không thể lấy thông tin booking')
                    }
                  } catch (e: any) {
                    toast.error(e?.message || 'Không thể tải thông tin thanh toán')
                  } finally {
                    setLoadingPaymentBooking(false)
                  }
                }}
              >
                {loadingPaymentBooking ? 'Đang tải...' : 'Mở phương thức thanh toán'}
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--border-primary)' }}
                disabled={!paymentBookingId}
                onClick={() => {
                  if (!paymentBookingId) return
                  setFeedbackBookingId(paymentBookingId)
                  setShowFeedbackModal(true)
                }}
              >
                Mở Feedback ngay
              </button>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Gợi ý: Sau khi thanh toán xong (đặc biệt với thanh toán offline), hệ thống sẽ bật cửa sổ Feedback để nhân viên hỗ trợ khách đánh giá ngay.
            </div>
          </div>
        </div>

        {/* Payment Modal for Staff */}
        {showPaymentModal && paymentBookingId && (
          <PaymentModal
            bookingId={Number(paymentBookingId)}
            totalAmount={paymentTotalAmount}
            open={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onPaymentSuccess={() => {
              setShowPaymentModal(false)
              setFeedbackBookingId(Number(paymentBookingId))
              setShowFeedbackModal(true)
            }}
          />
        )}

        {/* Feedback Modal for Staff */}
        {showFeedbackModal && feedbackBookingId && (
          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            bookingId={String(feedbackBookingId)}
            serviceName={''}
            technician={'Kỹ thuật viên'}
            partsUsed={[]}
            onSubmit={async (fb) => {
              try {
                await feedbackService.submitFeedback(String(feedbackBookingId), 0, fb)
                toast.success('Gửi đánh giá thành công')
                setShowFeedbackModal(false)
              } catch (err: any) {
                toast.error(err?.message || 'Không thể gửi đánh giá')
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

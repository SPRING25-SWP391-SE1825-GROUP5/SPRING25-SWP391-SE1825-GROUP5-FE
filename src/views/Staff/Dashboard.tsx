import { useState, useEffect } from 'react'
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
  Package,
  QrCode,
  MapPin
} from 'lucide-react'
import InventoryPage from '@/components/staff/InventoryPage'
import ServiceOrdersPage from '@/components/staff/ServiceOrdersPage'
import TechnicianSchedulePage from '@/components/staff/TechnicianSchedulePage'
import CreateBookingPage from '@/components/staff/CreateBookingPage'
import './staff.scss'
import PaymentModal from '@/components/payment/PaymentModal'
import { BookingService } from '@/services/bookingService'
import FeedbackModal from '@/components/feedback/FeedbackModal'
import { feedbackService } from '@/services/feedbackService'
import logoImage from '@/assets/images/10.webp'
import WorkQueue from '@/components/technician/WorkQueue'
import QRCheckIn from './QRCheckIn'
import { StaffService } from '@/services/staffService'

export default function StaffDashboard() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('work-queue')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [paymentBookingId, setPaymentBookingId] = useState<number | ''>('')
  const [paymentTotalAmount, setPaymentTotalAmount] = useState<number>(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loadingPaymentBooking, setLoadingPaymentBooking] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackBookingId, setFeedbackBookingId] = useState<number | ''>('')
  const [centerName, setCenterName] = useState<string>('')
  const [loadingCenter, setLoadingCenter] = useState(true)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Đăng xuất thành công!')
    navigate('/auth/login')
  }

  // Lấy thông tin chi nhánh của staff
  useEffect(() => {
    const fetchCenterInfo = async () => {
      try {
        setLoadingCenter(true)
        const assignment = await StaffService.getCurrentStaffAssignment()
        if (assignment?.centerName) {
          setCenterName(assignment.centerName)
        }
      } catch (error: any) {
        console.error('Lỗi khi lấy thông tin chi nhánh:', error)
        // Không hiển thị toast để tránh làm phiền user
      } finally {
        setLoadingCenter(false)
      }
    }

    fetchCenterInfo()
  }, [])

  // Page components
  const renderPageContent = () => {
    switch (activePage) {
      case 'qr-checkin':
        return <QRCheckIn />
      case 'service-orders':
        return <ServiceOrdersPage />
      case 'inventory':
        return <InventoryPage />
      case 'technician-schedule':
        return <TechnicianSchedulePage />
      case 'create-booking':
        return <CreateBookingPage />
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
            fontSize: '14px',
            fontWeight: '300',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Staff Panel
          </h1>
          {centerName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: 'var(--primary-50)',
              borderRadius: '6px',
              marginLeft: '12px'
            }}>
              <MapPin size={14} style={{ color: 'var(--primary-600)' }} />
              <span style={{
                fontSize: '12px',
                fontWeight: '400',
                color: 'var(--primary-700)'
              }}>
                {centerName}
              </span>
            </div>
          )}
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
              fontSize: '12px',
              fontWeight: '300'
            }}>
              S
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: '300',
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
                  fontSize: '14px',
                  fontWeight: '300',
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Staff Panel
                </h1>
                <p style={{
                  fontSize: '11px',
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
                fontSize: '10px',
                fontWeight: '300',
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
                  fontWeight: '300',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease',
                  fontSize: '12px'
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
                fontSize: '10px',
                fontWeight: '300',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 12px 0',
                display: sidebarCollapsed ? 'none' : 'block'
              }}>
                Quản lý
              </h3>
              {[
                { icon: QrCode, label: 'Quét mã Check-in', page: 'qr-checkin' },
                { icon: Package, label: 'Quản lý kho', page: 'inventory' },
                { icon: ClipboardList, label: 'Tạo booking', page: 'create-booking' }
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
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '300'
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
                  marginBottom: '4px',
                  fontSize: '12px',
                  fontWeight: '300'
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

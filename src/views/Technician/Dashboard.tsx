import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import toast from 'react-hot-toast'
import { TechnicianService } from '@/services/technicianService'
import {
  Wrench,
  Menu,
  Calendar,
  LogOut
} from 'lucide-react'
import {
  WorkQueue,
  WorkSchedule
} from '@/components/technician'
import NotificationBell from '@/components/common/NotificationBell'
import './technician.scss'
import './technician-dashboard.scss'

export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('work-queue')

  // State cho thông tin kỹ thuật viên và trung tâm
  const [technicianInfo, setTechnicianInfo] = useState<any>(null)
  const [centerInfo, setCenterInfo] = useState<any>(null)

  // Load thông tin kỹ thuật viên khi component mount
  useEffect(() => {
    const loadTechnicianInfo = async () => {
      if (!user?.id) {
        return
      }

      try {

        // Lấy technicianId từ userId
        const techInfo = await TechnicianService.getTechnicianIdByUserId(user.id)

        if (techInfo.success && techInfo.data) {
          setTechnicianInfo(techInfo.data)


          // Kiểm tra xem technician có centerId không
          if (techInfo.data.centerId) {
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
            } catch {
              // Fallback: sử dụng thông tin từ techInfo
              setCenterInfo({
                centerId: techInfo.data.centerId,
                centerName: `Trung tâm ${techInfo.data.centerId}`
              })
            }
          } else {
            setCenterInfo(null)
          }
        } else {
          setCenterInfo(null)
        }

      } catch {
        toast.error('Không thể tải thông tin kỹ thuật viên')
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
        return <WorkQueue />
      case 'work-schedule':
        return <WorkSchedule />
      case 'profile':
        return <WorkQueue />
      default:
        return <WorkQueue />
    }
  }


  const getPageTitle = () => {
    return centerInfo?.centerName || 'Dashboard'
  }


  return (
    <div className="technician-dashboard" style={{ display: 'block', minHeight: '100vh', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif', position: 'relative' }}>
      {/* Header Fixed */}
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
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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
          >
            <Menu size={20} />
          </button>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {getPageTitle()}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <NotificationBell />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#FFF6D1',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={handleLogout}
          >
            <div style={{
              width: '32px',
              height: '32px',
              background: '#FFD875',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {technicianInfo?.technicianName ? technicianInfo.technicianName.charAt(0).toUpperCase() :
               user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'KT'}
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              {technicianInfo?.technicianName || user?.fullName || 'Kỹ thuật viên'}
            </span>
            <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`technician-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
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
            <img src="/src/assets/images/10.webp" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', marginRight: sidebarCollapsed ? '0' : '12px', boxShadow: '0 0 12px rgba(255, 216, 117, 0.6)' }} />
            {!sidebarCollapsed && (
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Technician Panel
                </h1>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  margin: '0'
                }}>
                  Kỹ thuật viên
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
                Công việc
              </h3>
            {[
              { icon: Wrench, label: 'Hàng đợi công việc', page: 'work-queue' },
              { icon: Calendar, label: 'Lịch làm việc', page: 'work-schedule' }
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
        className="technician-main-content"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          padding: '0px',
          paddingTop: '64px',
          background: '#fff',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
          maxWidth: 'none',
          position: 'relative'
        }}
      >
        {renderPageContent()}
      </div>
    </div>
  )
}

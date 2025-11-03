import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import { 
  Menu,
  LogOut,
  Settings,
  BarChart3,
  Users,
  FileText,
  Target,
  Calendar
} from 'lucide-react'
import {
  DashboardOverview,
  StaffManagement,
  InventoryManagement
} from '../../components/manager'
import NotificationBell from '@/components/common/NotificationBell'
import BookingManagement from '@/components/manager/BookingManagement'
import './manager.scss'

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  

  const handleLogout = () => {
    dispatch(logout())
    navigate('/auth/login')
  }

  const renderPageContent = () => {
    switch (activePage) {
      case 'staff':
        return <StaffManagement />
      case 'bookings':
        return <BookingManagement />
      case 'inventory':
        return <InventoryManagement />
      // settings tab removed
      default:
        return <DashboardOverview onNavigate={setActivePage} />
    }
  }

  return (
    <div className="manager-dashboard" style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Manager Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: sidebarCollapsed ? '80px' : '280px',
        right: 0,
        height: '64px',
        background: '#fff',
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
          >
            <Menu size={20} />
          </button>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Chi nhánh Quận 7
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <NotificationBell />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#FFF8E5',
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
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              M
            </div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)'
            }}>
              Người dùng Quản lý
            </span>
            <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div 
        style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: '#fff',
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
              src="/src/assets/images/10.webp" 
              alt="Logo" 
              style={{ 
                width: '40px', 
                height: '40px', 
                objectFit: 'contain',
                marginRight: sidebarCollapsed ? '0' : '12px'
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
                  AutoEV
                </h1>
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  margin: '0'
                }}>
                  EV Service Center
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
                Tổng quan
              </h3>
              <div 
                onClick={() => setActivePage('dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: activePage === 'dashboard' ? '#FFD875' : 'var(--text-secondary)',
                  background: activePage === 'dashboard' ? '#FFF8E5' : 'transparent',
                  fontWeight: '500',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activePage !== 'dashboard') {
                    e.currentTarget.style.background = '#FFF8E5'
                    e.currentTarget.style.color = '#FFD875'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activePage !== 'dashboard') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <BarChart3 size={20} style={{ marginRight: sidebarCollapsed ? '0' : '12px' }} />
                {!sidebarCollapsed && 'Báo cáo'}
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
                { icon: Users, label: 'Nhân viên', page: 'staff' },
                { icon: Calendar, label: 'Quản lý đặt lịch', page: 'bookings' },
                { icon: Target, label: 'Kho', page: 'inventory' }
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
                    color: activePage === item.page ? '#FFD875' : 'var(--text-secondary)',
                    background: activePage === item.page ? '#FFF8E5' : 'transparent',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (activePage !== item.page) {
                      e.currentTarget.style.background = '#FFF8E5'
                      e.currentTarget.style.color = '#FFD875'
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

        {/* Sidebar Toggle */}
        <div style={{ position: 'absolute', bottom: '24px', left: '0', right: '0', padding: '0 24px' }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#FFD875',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: sidebarCollapsed ? '0' : '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <Menu size={16} />
            {!sidebarCollapsed && <span>Thu gọn</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div 
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          padding: '32px',
          paddingTop: '96px', // Add space for header
          background: '#fff',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
          maxWidth: 'none'
        }}
      >
        {renderPageContent()}
      </div>
    </div>
  )
}
import { useState } from 'react'
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Bell,
  Search,
  Menu,
  LogOut,
  Settings,
  BarChart3,
  MessageSquare,
  FileText,
  Target,
  PieChart,
  Activity
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import './manager.scss'

export default function ManagerDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Page components
  const renderPageContent = () => {
    switch (activePage) {
      case 'branches':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Quản lý chi nhánh
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Danh sách chi nhánh và thông tin chi tiết sẽ được hiển thị ở đây...</p>
            </div>
          </div>
        )
      case 'staff':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Quản lý nhân viên
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Quản lý nhân viên và phân công công việc sẽ được hiển thị ở đây...</p>
            </div>
          </div>
        )
      case 'reports':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Báo cáo chi nhánh
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Báo cáo doanh thu và hiệu suất chi nhánh sẽ được hiển thị ở đây...</p>
            </div>
          </div>
        )
      case 'inventory':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Quản lý kho
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Quản lý tồn kho và phụ tùng sẽ được hiển thị ở đây...</p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Cài đặt chi nhánh
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Cài đặt chi nhánh và hệ thống sẽ được hiển thị ở đây...</p>
            </div>
          </div>
        )
      default:
        return renderDashboardContent()
    }
  }

  const renderDashboardContent = () => (
    <>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          margin: '0 0 8px 0'
        }}>
          Manager Dashboard
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Quản lý chi nhánh và hiệu suất kinh doanh
        </p>
      </div>

      {/* Stats Grid */}
      <div 
        className="manager-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
          width: '100%'
        }}
      >
        {stats.map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: stat.color,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={24} />
              </div>
              <div style={{
                padding: '4px 8px',
                borderRadius: '20px',
                background: stat.changeType === 'positive' ? 'var(--success-50)' : 'var(--error-50)',
                color: stat.changeType === 'positive' ? 'var(--success-700)' : 'var(--error-700)',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {stat.change}
              </div>
            </div>
            <h3 style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              margin: '0 0 8px 0',
              fontWeight: '500'
            }}>
              {stat.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'var(--text-primary)'
              }}>
                {stat.value}
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)'
              }}>
                {stat.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ marginBottom: '32px', width: '100%' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: '0 0 24px 0'
        }}>
          Biểu đồ thống kê chi nhánh
        </h2>
        
        {/* Revenue Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Doanh thu theo tháng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `${value}M`}
              />
              <Tooltip 
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                formatter={(value, name) => [
                  `${value}M VNĐ`,
                  name === 'revenue' ? 'Doanh thu' : 'Lợi nhuận'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary-500)"
                fill="var(--primary-50)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="var(--success-500)"
                fill="var(--success-50)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Branch Performance Pie Chart */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: '0 0 20px 0'
            }}>
              Hiệu suất chi nhánh
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={branchPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {branchPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value) => [`${value}%`, 'Tỷ lệ']}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Staff Performance Chart */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: '0 0 20px 0'
            }}>
              Hiệu suất nhân viên
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={staffPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis 
                  dataKey="staff" 
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend />
                <Bar dataKey="tasks" fill="var(--primary-500)" name="Nhiệm vụ" />
                <Bar dataKey="completed" fill="var(--success-500)" name="Hoàn thành" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', width: '100%' }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Thao tác quản lý
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => setActivePage(action.page)}
                style={{
                  background: 'var(--bg-card)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: action.color,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
                }}>
                  <action.icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    margin: '0 0 4px 0'
                  }}>
                    {action.title}
                  </h3>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Status */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Trạng thái chi nhánh
          </h2>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            overflow: 'hidden'
          }}>
            {branchStatus.map((branch, index) => (
              <div 
                key={branch.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < branchStatus.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: branch.status === 'active' ? 'var(--success-500)' : 
                             branch.status === 'maintenance' ? 'var(--warning-500)' : 'var(--error-500)',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: 'var(--text-primary)',
                    margin: '0 0 2px 0'
                  }}>
                    {branch.name}
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {branch.location} • {branch.staff} nhân viên
                  </p>
                </div>
                <span style={{ 
                  fontSize: '11px', 
                  color: branch.status === 'active' ? 'var(--success-700)' : 
                         branch.status === 'maintenance' ? 'var(--warning-700)' : 'var(--error-700)',
                  whiteSpace: 'nowrap',
                  fontWeight: '500'
                }}>
                  {branch.status === 'active' ? 'Hoạt động' : 
                   branch.status === 'maintenance' ? 'Bảo trì' : 'Tạm dừng'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  // Chart data
  const revenueData = [
    { month: 'T1', revenue: 45, profit: 12 },
    { month: 'T2', revenue: 52, profit: 15 },
    { month: 'T3', revenue: 48, profit: 13 },
    { month: 'T4', revenue: 61, profit: 18 },
    { month: 'T5', revenue: 55, profit: 16 },
    { month: 'T6', revenue: 67, profit: 22 }
  ]

  const branchPerformanceData = [
    { name: 'Chi nhánh 1', value: 35, color: 'var(--primary-500)' },
    { name: 'Chi nhánh 2', value: 28, color: 'var(--success-500)' },
    { name: 'Chi nhánh 3', value: 22, color: 'var(--warning-500)' },
    { name: 'Chi nhánh 4', value: 15, color: 'var(--info-500)' }
  ]

  const staffPerformanceData = [
    { staff: 'Nguyễn A', tasks: 25, completed: 23 },
    { staff: 'Trần B', tasks: 30, completed: 28 },
    { staff: 'Lê C', tasks: 22, completed: 20 },
    { staff: 'Phạm D', tasks: 28, completed: 26 }
  ]

  // Mock data for dashboard stats
  const stats = [
    {
      title: 'Doanh thu tháng này',
      value: '67.2',
      unit: 'M VNĐ',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'var(--success-500)'
    },
    {
      title: 'Chi nhánh hoạt động',
      value: '4',
      unit: 'chi nhánh',
      change: '+1',
      changeType: 'positive',
      icon: Building2,
      color: 'var(--primary-500)'
    },
    {
      title: 'Nhân viên',
      value: '28',
      unit: 'người',
      change: '+3',
      changeType: 'positive',
      icon: Users,
      color: 'var(--info-500)'
    },
    {
      title: 'Hiệu suất trung bình',
      value: '94.2',
      unit: '%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'var(--warning-500)'
    }
  ]

  const quickActions = [
    {
      title: 'Quản lý chi nhánh',
      description: 'Xem và quản lý các chi nhánh',
      icon: Building2,
      page: 'branches',
      color: 'var(--primary-500)'
    },
    {
      title: 'Quản lý nhân viên',
      description: 'Phân công và quản lý nhân viên',
      icon: Users,
      page: 'staff',
      color: 'var(--success-500)'
    },
    {
      title: 'Báo cáo chi nhánh',
      description: 'Xem báo cáo doanh thu và hiệu suất',
      icon: FileText,
      page: 'reports',
      color: 'var(--info-500)'
    },
    {
      title: 'Quản lý kho',
      description: 'Theo dõi tồn kho và phụ tùng',
      icon: Target,
      page: 'inventory',
      color: 'var(--warning-500)'
    },
    {
      title: 'Cài đặt',
      description: 'Cài đặt chi nhánh và hệ thống',
      icon: Settings,
      page: 'settings',
      color: 'var(--text-secondary)'
    }
  ]

  const branchStatus = [
    {
      id: 1,
      name: 'Chi nhánh Quận 1',
      location: '123 Nguyễn Huệ, Q1',
      staff: 8,
      status: 'active'
    },
    {
      id: 2,
      name: 'Chi nhánh Quận 3',
      location: '456 Lê Văn Sỹ, Q3',
      staff: 6,
      status: 'active'
    },
    {
      id: 3,
      name: 'Chi nhánh Quận 7',
      location: '789 Nguyễn Thị Thập, Q7',
      staff: 7,
      status: 'maintenance'
    },
    {
      id: 4,
      name: 'Chi nhánh Quận 10',
      location: '321 Cách Mạng Tháng 8, Q10',
      staff: 5,
      status: 'active'
    }
  ]

  return (
    <div className="manager-dashboard" style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Manager Header */}
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
          >
            <Menu size={20} />
          </button>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Manager Panel
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Bell size={20} style={{ color: 'var(--text-tertiary)' }} />
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              background: 'var(--error-500)',
              borderRadius: '50%'
            }} />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--primary-50)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
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
              M
            </div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)'
            }}>
              Manager User
            </span>
            <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div 
        className={`manager-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
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
            <div style={{
              width: '40px',
              height: '40px',
              background: 'var(--primary-500)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              marginRight: sidebarCollapsed ? '0' : '12px'
            }}>
              M
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Manager Panel
                </h1>
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  margin: '0'
                }}>
                  Quản lý chi nhánh và kinh doanh
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
                  color: activePage === 'dashboard' ? 'var(--primary-500)' : 'var(--text-secondary)',
                  background: activePage === 'dashboard' ? 'var(--primary-50)' : 'transparent',
                  fontWeight: '500',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activePage !== 'dashboard') {
                    e.currentTarget.style.background = 'var(--primary-50)'
                    e.currentTarget.style.color = 'var(--primary-500)'
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
                {!sidebarCollapsed && 'Dashboard'}
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
                { icon: Building2, label: 'Chi nhánh', page: 'branches' },
                { icon: Users, label: 'Nhân viên', page: 'staff' },
                { icon: FileText, label: 'Báo cáo', page: 'reports' },
                { icon: Target, label: 'Kho', page: 'inventory' },
                { icon: Settings, label: 'Cài đặt', page: 'settings' }
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
        className="manager-main-content"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          padding: '32px',
          paddingTop: '96px', // Add space for header
          background: 'var(--bg-secondary)',
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

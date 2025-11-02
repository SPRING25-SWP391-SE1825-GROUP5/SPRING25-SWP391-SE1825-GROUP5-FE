import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import toast from 'react-hot-toast'
import {
  Users,
  Package,
  Package2,
  FileText,
  Settings,
  Calendar,
  ChevronRight,
  BarChart3,
  Wrench,
  Bell,
  Menu,
  LogOut,
  Globe,
  Gift,
  ShoppingCart,
  CalendarCheck,
  MessageSquare,
  Warehouse,
  Car
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import './admin.scss'
import UsersComponent from './Users'
import ServicesManagement from '../../components/manager/ServicesManagement'
import ServicesManagementAdmin from '../../components/admin/ServicesManagementAdmin'
import CenterManagement from '../../components/admin/CenterManagement'
import StaffManagement from '../../components/admin/StaffManagement'
import PromotionManagement from '../../components/admin/PromotionManagement'
import ServicePackageManagement from '../../components/admin/ServicePackageManagement'
import PartManagement from '../../components/admin/PartManagement'
import { useAppSelector } from '@/store/hooks'
import TimeSlotManagement from './TimeSlotManagement'
import SystemSettings from './SystemSettings'
import ServiceTemplateManagement from './ServiceTemplateManagement'
import InventoryManagement from '../../components/admin/InventoryManagement'
import BookingManagement from '../../components/admin/BookingManagement'
import VehicleModelManagement from '../../components/admin/VehicleModelManagement'


export default function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const role = useAppSelector(s => s.auth.user?.role)
  
  // Empty data arrays - to be populated from API
  const revenueData: Array<{ month: string; revenue: number; orders: number }> = []
  const serviceData: Array<{ name: string; value: number; color: string }> = []
  const customerGrowthData: Array<{ month: string; newCustomers: number; returningCustomers: number }> = []
  const partsInventoryData: Array<{ name: string; stock: number; minStock: number; color: string }> = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats: Array<{ title: string; value: string; unit: string; change: string; changeType: string; icon: any; color: string }> = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quickActions: Array<{ title: string; description: string; icon: any; page: string; route: string; color: string }> = [
    {
      title: 'Quản lý nhân sự',
      description: 'Thêm, sửa, xóa nhân viên',
      icon: Users,
      page: 'staff',
      route: '/admin/staff',
      color: 'var(--primary-500)'
    },
    {
      title: 'Quản lý dịch vụ',
      description: 'Thêm, sửa, xóa dịch vụ',
      icon: Wrench,
      page: 'services',
      route: '/admin/services',
      color: 'var(--success-500)'
    },
    {
      title: 'Quản lý phụ tùng',
      description: 'Kiểm tra tồn kho, nhập hàng',
      icon: Package,
      page: 'parts',
      route: '/admin/parts-management',
      color: 'var(--success-500)'
    },
    {
      title: 'Cài đặt hệ thống',
      description: 'Cấu hình và tùy chỉnh hệ thống',
      icon: Settings,
      page: 'settings',
      route: '/admin/settings',
      color: '#6366f1'
    },
    {
      title: 'Báo cáo',
      description: 'Xem báo cáo doanh thu, thống kê',
      icon: BarChart3,
      page: 'reports',
      route: '/admin/reports',
      color: 'var(--info-500)'
    },
    {
      title: 'Quản lý người dùng',
      description: 'Quản lý tài khoản khách hàng',
      icon: Users,
      page: 'users',
      route: '/admin/users',
      color: 'var(--warning-500)'
    },
    {
      title: 'Mẫu Checklist bảo trì',
      description: 'Quản lý mẫu checklist bảo trì',
      icon: FileText,
      page: 'maintenance-checklist',
      route: '/admin/maintenance-checklist',
      color: 'var(--info-500)'
    }
  ]
  const recentActivities: Array<{ id: number; action: string; description: string; time: string; type: string }> = []
  
  // Sync activePage with current route
  useEffect(() => {
    const pathname = location.pathname
    const routeMap: Record<string, string> = {
      '/admin': 'dashboard',
      '/admin/': 'dashboard',
      '/admin/orders': 'orders',
      '/admin/bookings': 'bookings',
      '/admin/feedback': 'feedback',
      '/admin/users': 'users',
      '/admin/staff': 'staff',
      '/admin/services': 'services',
      '/admin/service-packages': 'service-packages',
      '/admin/parts-management': 'parts',
      '/admin/inventory': 'inventory',
      '/admin/service-centers': 'service-centers',
      '/admin/vehicle-models': 'vehicle-models',
      '/admin/time-slots': 'time-slots',
      '/admin/maintenance-checklist': 'maintenance-checklist',
      '/admin/promotions': 'promotions',
      '/admin/reports': 'reports',
      '/admin/account-settings': 'account-settings',
      '/admin/settings': 'settings'
    }
    
    if (routeMap[pathname]) {
      setActivePage(routeMap[pathname])
    } else if (pathname.startsWith('/admin/')) {
      // Extract route name from path
      const routeMatch = pathname.match(/\/admin\/([^/]+)/)
      if (routeMatch) {
        const routeName = routeMatch[1]
        // Map route names to page names
        const routeToPage: Record<string, string> = {
          'orders': 'orders',
          'bookings': 'bookings',
          'feedback': 'feedback',
          'users': 'users',
          'staff': 'staff',
          'services': 'services',
          'service-packages': 'service-packages',
          'parts-management': 'parts',
          'inventory': 'inventory',
          'service-centers': 'service-centers',
          'vehicle-models': 'vehicle-models',
          'time-slots': 'time-slots',
          'maintenance-checklist': 'maintenance-checklist',
          'promotions': 'promotions',
          'reports': 'reports',
          'account-settings': 'account-settings',
          'settings': 'settings'
        }
        if (routeToPage[routeName]) {
          setActivePage(routeToPage[routeName])
        }
      }
    }
  }, [location.pathname])
  
  const isAdmin = (() => {
    const r = (role || '').toString().toLowerCase()
    // Robust: treat any role containing 'admin' as admin, but exclude manager
    if (!r) return false
    if (r.includes('manager')) return false
    return r.includes('admin')
  })()

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Đăng xuất thành công!')
    navigate('/auth/login')
  }

  // Page components
  const renderPageContent = () => {
    switch (activePage) {
      case 'orders':
        return (
      <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Đơn hàng
            </h2>
      <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Quản lý đơn hàng sẽ được hiển thị ở đây...</p>
      </div>
    </div>
  )
      case 'bookings':
        return <BookingManagement />
      case 'feedback':
        return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Phản hồi
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
            borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Quản lý phản hồi sẽ được hiển thị ở đây...</p>
      </div>
    </div>
  )
      case 'users':
        return <UsersComponent />
      case 'staff':
        return <StaffManagement />
      case 'parts':
        return <PartManagement />
      case 'inventory':
        return <InventoryManagement />
      case 'vehicle-models':
        return <VehicleModelManagement />
      case 'services':
        return isAdmin
          ? <ServicesManagementAdmin />
          : <ServicesManagement />
      case 'service-centers':
        return <CenterManagement />
      case 'promotions':
        return <PromotionManagement />
      case 'service-packages':
        return <ServicePackageManagement />
      case 'reports':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Báo cáo
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Nội dung báo cáo sẽ được hiển thị ở đây...</p>
            </div>
          </div>
        )
      case 'time-slots':
        return <TimeSlotManagement />
      case 'settings':
        return <SystemSettings />
      case 'maintenance-checklist':
        return <ServiceTemplateManagement />
      case 'account-settings':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Cài đặt tài khoản
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Cài đặt tài khoản sẽ được hiển thị ở đây...</p>
            </div>
          </div>
        )
      case 'dashboard':
        return renderDashboardContent()
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
          Dashboard
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Tổng quan hệ thống quản lý dịch vụ xe điện
        </p>
      </div>

      {/* Stats Grid */}
      <div
        className="admin-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
          width: '100%'
        }}
      >
        {stats.length > 0 ? (
          stats.map((stat, index) => (
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
        ))
        ) : (
          <div style={{
            gridColumn: '1 / -1',
            background: 'var(--bg-card)',
            padding: '48px 24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <p style={{ margin: 0, fontSize: '16px' }}>Chưa có dữ liệu thống kê</p>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div style={{ marginBottom: '32px', width: '100%' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: '0 0 24px 0'
        }}>
          Biểu đồ thống kê
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
          {revenueData.length > 0 ? (
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
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                formatter={(value, name) => [
                  name === 'revenue' ? `${(value as number).toLocaleString('vi-VN')} VND` : value,
                  name === 'revenue' ? 'Doanh thu' : 'Đơn hàng'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary-500)"
                fill="var(--primary-50)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ margin: 0, fontSize: '16px' }}>Chưa có dữ liệu doanh thu</p>
            </div>
          )}
        </div>

        {/* Charts Grid */}
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Service Distribution Pie Chart */}
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
              Phân bố dịch vụ
            </h3>
            {serviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
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
              </PieChart>
            </ResponsiveContainer>
            ) : (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <p style={{ margin: 0, fontSize: '16px' }}>Chưa có dữ liệu phân bố dịch vụ</p>
              </div>
            )}
          </div>

          {/* Customer Growth Chart */}
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
              Tăng trưởng khách hàng
            </h3>
            {customerGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis
                  dataKey="month"
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
                <Bar dataKey="newCustomers" fill="var(--success-500)" name="Khách hàng mới" />
                <Bar dataKey="returningCustomers" fill="var(--primary-500)" name="Khách hàng cũ" />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <p style={{ margin: 0, fontSize: '16px' }}>Chưa có dữ liệu tăng trưởng khách hàng</p>
              </div>
            )}
          </div>
        </div>

        {/* Parts Inventory Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Tình trạng tồn kho phụ tùng
          </h3>
          {partsInventoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partsInventoryData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis
                type="number"
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="var(--text-secondary)"
                fontSize={12}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                formatter={(value, name) => [
                  `${value} sản phẩm`,
                  name === 'stock' ? 'Tồn kho' : 'Tồn kho tối thiểu'
                ]}
              />
              <Bar dataKey="stock" fill="var(--primary-500)" name="Tồn kho hiện tại" />
              <Bar dataKey="minStock" fill="var(--border-secondary)" name="Tồn kho tối thiểu" />
            </BarChart>
          </ResponsiveContainer>
          ) : (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ margin: 0, fontSize: '16px' }}>Chưa có dữ liệu tồn kho</p>
            </div>
          )}
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
            Thao tác nhanh
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {quickActions.length > 0 ? (
              quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => {
                  if (action.route) {
                    navigate(action.route)
                  } else {
                    setActivePage(action.page)
                  }
                }}
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
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ))
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                background: 'var(--bg-card)',
                padding: '48px 24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <p style={{ margin: 0, fontSize: '16px' }}>Chưa có thao tác nhanh</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Hoạt động gần đây
          </h2>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            overflow: 'hidden'
          }}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
              <div
                key={activity.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < recentActivities.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activity.type === 'order' ? 'var(--success-500)' :
                    activity.type === 'inventory' ? 'var(--info-500)' :
                      activity.type === 'maintenance' ? 'var(--warning-500)' : 'var(--primary-500)',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    margin: '0 0 2px 0'
                  }}>
                    {activity.action}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {activity.description}
                  </p>
                </div>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  whiteSpace: 'nowrap'
                }}>
                  {activity.time}
                </span>
              </div>
            ))
            ) : (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <p style={{ margin: 0, fontSize: '16px' }}>Chưa có hoạt động gần đây</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="admin-dashboard" style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Admin Header */}
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
            Admin Panel
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              A
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Admin User
            </span>
            <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-primary)',
          transition: 'width 0.3s ease',
          position: 'fixed',
          height: '100vh',
          zIndex: 1004,
          top: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Scrollable Content */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px',
          paddingBottom: '24px'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '32px',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
          }}>
            <img src="/email/10.webp" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', marginRight: sidebarCollapsed ? '0' : '12px', boxShadow: '0 0 12px rgba(255, 216, 117, 0.6)' }} />
            {!sidebarCollapsed && (
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Admin Panel
                </h1>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  margin: '0'
                }}>
                  Quản trị hệ thống
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
                {!sidebarCollapsed && 'Bảng điều khiển'}
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
                // Quản lý đơn hàng & lịch hẹn
                { icon: ShoppingCart, label: 'Đơn hàng', page: 'orders', route: '/admin/orders' },
                { icon: CalendarCheck, label: 'Đặt lịch', page: 'bookings', route: '/admin/bookings' },
                { icon: MessageSquare, label: 'Phản hồi', page: 'feedback', route: '/admin/feedback' },
                // Quản lý người dùng
                { icon: Users, label: 'Người dùng', page: 'users', route: '/admin/users' },
                // Quản lý dịch vụ
                { icon: Wrench, label: 'Dịch vụ', page: 'services', route: '/admin/services' },
                { icon: Package2, label: 'Gói dịch vụ', page: 'service-packages', route: '/admin/service-packages' },
                // Quản lý sản phẩm & kho
                { icon: Package, label: 'Phụ tùng', page: 'parts', route: '/admin/parts-management' },
                { icon: Warehouse, label: 'Kho hàng', page: 'inventory', route: '/admin/inventory' },
                // Quản lý địa điểm & thời gian
                { icon: Globe, label: 'Trung tâm', page: 'service-centers', route: '/admin/service-centers' },
                { icon: Car, label: 'Mẫu xe', page: 'vehicle-models', route: '/admin/vehicle-models' },
                { icon: Calendar, label: 'Khung giờ làm việc', page: 'time-slots', route: '/admin/time-slots' },
                // Quản lý khác
                { icon: FileText, label: 'Mẫu Checklist bảo trì', page: 'maintenance-checklist', route: '/admin/maintenance-checklist' },
                { icon: Gift, label: 'Khuyến mãi', page: 'promotions', route: '/admin/promotions' },
                // Báo cáo & Cài đặt
                { icon: FileText, label: 'Báo cáo', page: 'reports', route: '/admin/reports' },
                { icon: Settings, label: 'Cài đặt tài khoản', page: 'account-settings', route: '/admin/account-settings' },
                { icon: Settings, label: 'Cài đặt hệ thống', page: 'settings', route: '/admin/settings' }
              ].map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (item.route) {
                      navigate(item.route)
                    } else {
                      setActivePage(item.page)
                    }
                  }}
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

        {/* Collapse Button - Fixed position */}
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
            fontSize: '12px',
            zIndex: 1005,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Main Content */}
      <div
        className="admin-main-content"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          padding: '0px',
          paddingTop: '96px',
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
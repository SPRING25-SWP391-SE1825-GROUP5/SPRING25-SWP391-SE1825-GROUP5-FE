import { useState, useEffect, useRef } from 'react'
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
  Car,
  Shield,
  Server,
  Palette,
  AlertTriangle,
  Key,
  Info,
  Mail,
  Smartphone,
  RefreshCw,
  CheckCircle,
  Save,
  UserCheck,
  DollarSign,
  Activity
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
import { CenterService, type Center } from '../../services/centerService'
import { ReportsService } from '../../services/reportsService'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const role = useAppSelector(s => s.auth.user?.role)

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

  // Dashboard data state
  const [centers, setCenters] = useState<Center[]>([])
  const selectedCenterId: number | 'all' = 'all' // Always load all centers
  const [dashboardData, setDashboardData] = useState<{
    revenue: any
    bookings: any
  } | null>(null)
  const [dashboardSummary, setDashboardSummary] = useState<{
    totalRevenue: number
    totalEmployees: number
    totalCompletedBookings: number
    serviceRevenue: number
    partsRevenue: number
  } | null>(null)
  const [revenueByStore, setRevenueByStore] = useState<{
    stores: Array<{
      storeId: number
      storeName: string
      revenue: number
      completedBookings: number
    }>
    totalRevenue: number
  } | null>(null)
  const [revenueDateRange, setRevenueDateRange] = useState<{
    fromDate: string
    toDate: string
  }>(() => {
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 7) // Default: 7 days ago
    return {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0]
    }
  })
  const [revenueGranularity, setRevenueGranularity] = useState<'day' | 'month' | 'quarter' | 'year'>('day')
  const [revenueFilterApplyKey, setRevenueFilterApplyKey] = useState(0)
  const [servicesStats, setServicesStats] = useState<{
    totalServiceRevenue: number
    totalCompletedBookings: number
    services: Array<{ serviceId: number; serviceName: string; bookingCount: number; serviceRevenue: number }>
  } | null>(null)
  const [bookingStatusCenterId, setBookingStatusCenterId] = useState<number | 'all'>('all')
  const [bookingStatus, setBookingStatus] = useState<{
    total: number
    items: Array<{ status: string; count: number }>
  } | null>(null)
  const centersLoadedRef = useRef(false)

  // Handler for quick period selection
  
  const [loading, setLoading] = useState(false)
  const [loadingStoreRevenue, setLoadingStoreRevenue] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Đăng xuất thành công!')
    navigate('/auth/login')
  }

  // Load centers list
  useEffect(() => {
    if (centersLoadedRef.current) return
    centersLoadedRef.current = true
    ;(async () => {
      try {
        const response = await CenterService.getCenters({ pageSize: 1000 })
        setCenters(response.centers || [])
      } catch (err) {

      }
    })()
  }, [])

  // Load dashboard summary
  const loadDashboardSummary = async () => {
    try {
      const params: { centerId?: number; fromDate?: string; toDate?: string } = {}
      
      if (selectedCenterId !== 'all') {
        params.centerId = selectedCenterId
      }
      // Use the same time range as the revenue chart filters
      params.fromDate = revenueDateRange.fromDate
      params.toDate = revenueDateRange.toDate

      const response = await ReportsService.getDashboardSummary(params)
      if (response?.success && response.data?.summary) {
        const s: any = response.data.summary
        const mapped = {
          totalRevenue: Number(s.totalRevenue ?? s.TotalRevenue ?? 0),
          totalEmployees: Number(s.totalEmployees ?? s.TotalEmployees ?? 0),
          totalCompletedBookings: Number(s.totalCompletedBookings ?? s.TotalCompletedBookings ?? 0),
          serviceRevenue: Number(s.serviceRevenue ?? s.ServiceRevenue ?? 0),
          partsRevenue: Number(s.partsRevenue ?? s.PartsRevenue ?? 0),
        }
        setDashboardSummary(mapped)
      }
    } catch (err: any) {
      console.error('Failed to load dashboard summary:', err)
      // Don't show error toast for summary, just log it
    }
  }

  // Load revenue by store
  const loadRevenueByStore = async () => {
    try {
      setLoadingStoreRevenue(true)
      const response = await ReportsService.getRevenueByStore({
        fromDate: revenueDateRange.fromDate,
        toDate: revenueDateRange.toDate
      })
      
      if (response.success && response.data?.stores) {
        setRevenueByStore({
          stores: response.data.stores,
          totalRevenue: response.data.totalRevenue
        })
      }
    } catch (err: any) {
      console.error('Failed to load revenue by store:', err)
      toast.error('Không thể tải dữ liệu doanh thu theo cửa hàng')
    } finally {
      setLoadingStoreRevenue(false)
    }
  }

  // Load services booking stats (system-wide)
  const loadServicesStats = async () => {
    try {
      const response = await ReportsService.getServicesBookingStats({
        fromDate: revenueDateRange.fromDate,
        toDate: revenueDateRange.toDate,
      })
      if (response?.success && response.data?.services) {
        setServicesStats({
          totalServiceRevenue: Number(response.data.totalServiceRevenue || 0),
          totalCompletedBookings: Number(response.data.totalCompletedBookings || 0),
          services: response.data.services || [],
        })
      } else {
        setServicesStats(null)
      }
    } catch (err) {
      setServicesStats(null)
    }
  }

  // Load booking status (per center or all centers aggregated)
  const loadBookingStatus = async () => {
    try {
      const from = revenueDateRange.fromDate
      const to = revenueDateRange.toDate
      if (bookingStatusCenterId === 'all') {
        const activeCenters = centers && centers.length > 0 ? centers.filter(c => c.isActive) : []
        const results = await Promise.allSettled(
          activeCenters.map(c => ReportsService.getBookingStatusCounts(c.centerId, { from, to }))
        )
        const itemsMap = new Map<string, number>()
        let total = 0
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value && ((r.value as any).items || (r.value as any).data?.items)) {
            const payload: any = (r.value as any).data?.items ? (r.value as any).data : r.value
            const arr = payload.items || []
            const t = payload.total || 0
            total += Number(t)
            arr.forEach((it: any) => {
              const key = (it.status || it.Status || '').toString()
              const cnt = Number(it.count ?? it.Count ?? 0)
              itemsMap.set(key, (itemsMap.get(key) || 0) + cnt)
            })
          }
        })
        const items = Array.from(itemsMap.entries()).map(([status, count]) => ({ status, count }))
        setBookingStatus({ total, items })
      } else {
        const resp: any = await ReportsService.getBookingStatusCounts(bookingStatusCenterId, { from, to })
        const payload: any = resp.data?.items ? resp.data : resp
        setBookingStatus({
          total: Number(payload.total || 0),
          items: (payload.items || []).map((it: any) => ({ status: it.status || it.Status, count: Number(it.count ?? it.Count ?? 0) }))
        })
      }
    } catch (err) {
      setBookingStatus(null)
    }
  }

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use date range from state for revenue chart
      const startDateStr = revenueDateRange.fromDate
      const endDateStr = revenueDateRange.toDate

      // Use selected granularity directly
      const granularity = revenueGranularity

      if (selectedCenterId === 'all') {
        // Load total revenue for entire system via /Reports/total-revenue, using the chart's own date filter
        try {
          const revenueResponse = await ReportsService.getTotalRevenue({
            from: startDateStr,
            to: endDateStr,
            granularity: granularity
          })

          if (revenueResponse) {
            const payload = (revenueResponse as any).data ?? revenueResponse
            const periods = payload.periods || payload.Periods || []
            const revenueByPeriod = periods.map((p: any) => ({
              period: p.periodKey || p.PeriodKey || p.period || p.Period,
              revenue: Number(p.revenue ?? p.Revenue ?? 0),
              bookings: 0
            }))

            setDashboardData({
              revenue: {
                summary: {
                  totalRevenue: Number(payload.totalRevenue ?? payload.TotalRevenue ?? 0),
                  totalBookings: 0,
                  averageRevenuePerBooking: 0
                },
                revenueByPeriod,
                groupedData: { byService: [] }
              },
              bookings: {
                totalBookings: 0,
                completedBookings: 0,
                cancelledBookings: 0,
                pendingBookings: 0
              }
            })
          } else {
            setDashboardData({
              revenue: {
                summary: { totalRevenue: 0, totalBookings: 0, averageRevenuePerBooking: 0 },
                revenueByPeriod: [],
                groupedData: { byService: [] }
              },
              bookings: { totalBookings: 0, completedBookings: 0, cancelledBookings: 0, pendingBookings: 0 }
            })
          }
        } catch (err: any) {
          console.error('Failed to load dashboard data:', err)
          setError('Không thể tải dữ liệu doanh thu')
        }
      } else {
        // Load revenue for selected center only
        const [revenueResponse, bookingResponse] = await Promise.all([
          ReportsService.getCenterRevenue(selectedCenterId, {
            from: startDateStr,
            to: endDateStr,
            granularity: granularity
          }),
          ReportsService.getTodayBookings(selectedCenterId)
        ])


        // Transform response to match expected format
        const items = (revenueResponse as any).items || (revenueResponse as any).Items || []
        const revenueByPeriod = items.map((item: any) => ({
          period: item.period || item.Period,
          revenue: Number(item.revenue ?? item.Revenue ?? 0),
          bookings: 0
        }))

        setDashboardData({
          revenue: {
            summary: {
              totalRevenue: Number((revenueResponse as any).totalRevenue ?? (revenueResponse as any).TotalRevenue ?? 0),
              totalBookings: bookingResponse.data?.totalBookings || 0,
              averageRevenuePerBooking: revenueResponse.totalRevenue > 0 && bookingResponse.data?.totalBookings > 0
                ? revenueResponse.totalRevenue / bookingResponse.data.totalBookings
                : 0
            },
            revenueByPeriod: revenueByPeriod,
            groupedData: {
              byService: [] // Not available from this API
            }
          },
          bookings: bookingResponse.data || {
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            pendingBookings: 0
          }
        })
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tải dữ liệu dashboard')
      toast.error('Không thể tải dữ liệu doanh thu')
    } finally {
      setLoading(false)
    }
  }

  // Load all dashboard pieces in parallel to speed up perceived load and avoid duplicate calls
  const loadAllDashboardData = async () => {
    await Promise.allSettled([
      (async () => { await loadDashboardData() })(),
      (async () => { await loadServicesStats() })(),
      (async () => { await loadDashboardSummary() })(),
      (async () => { await loadRevenueByStore() })(),
    ])
  }

  // Aggregate revenue data from multiple centers
  const aggregateRevenueData = (revenueDataArray: any[]) => {
    if (!revenueDataArray || revenueDataArray.length === 0) {
      return {
        summary: {
          totalRevenue: 0,
          totalBookings: 0,
          averageRevenuePerBooking: 0
        },
        revenueByPeriod: [],
        groupedData: {
          byService: []
        }
      }
    }

    // Aggregate totals from Summary
    const totalRevenue = revenueDataArray.reduce((sum, data) => sum + (data.summary?.totalRevenue || data.Summary?.TotalRevenue || 0), 0)
    const totalBookings = revenueDataArray.reduce((sum, data) => sum + (data.summary?.totalBookings || data.Summary?.TotalBookings || 0), 0)
    const averageRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0

    // Aggregate revenue by period
    const periodMap = new Map<string, { revenue: number; bookings: number }>()
    revenueDataArray.forEach(data => {
      // Handle both camelCase and PascalCase
      const periods = data.revenueByPeriod || data.RevenueByPeriod || []
      periods.forEach((item: any) => {
        const period = item.period || item.Period || ''
        const revenue = item.revenue || item.Revenue || 0
        const bookings = item.bookings || item.Bookings || 0
        const existing = periodMap.get(period) || { revenue: 0, bookings: 0 }
        periodMap.set(period, {
          revenue: existing.revenue + revenue,
          bookings: existing.bookings + bookings
        })
      })
    })
    const revenueByPeriod = Array.from(periodMap.entries()).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      bookings: data.bookings
    })).sort((a, b) => {
      // Sort by period (month format: yyyy-MM)
      return a.period.localeCompare(b.period)
    })

    // Aggregate revenue by service from GroupedData
    const serviceMap = new Map<string, { revenue: number; bookings: number }>()
    revenueDataArray.forEach(data => {
      // Handle both camelCase and PascalCase
      const byService = data.groupedData?.byService || data.GroupedData?.ByService || []
      byService.forEach((item: any) => {
        const serviceName = item.serviceName || item.ServiceName || ''
        const revenue = item.revenue || item.Revenue || 0
        const bookings = item.bookings || item.Bookings || 0
        const existing = serviceMap.get(serviceName) || { revenue: 0, bookings: 0 }
        serviceMap.set(serviceName, {
          revenue: existing.revenue + revenue,
          bookings: existing.bookings + bookings
        })
      })
    })
    const byService = Array.from(serviceMap.entries()).map(([serviceName, data]) => ({
      serviceName,
      revenue: data.revenue,
      bookings: data.bookings
    })).sort((a, b) => b.revenue - a.revenue)

    return {
      summary: {
        totalRevenue,
        totalBookings,
        averageRevenuePerBooking
      },
      revenueByPeriod,
      groupedData: {
        byService
      }
    }
  }

  // Aggregate bookings data
  const aggregateBookingsData = (bookingsDataArray: any[]) => {
    if (!bookingsDataArray || bookingsDataArray.length === 0) {
      return {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        pendingBookings: 0
      }
    }

    return {
      totalBookings: bookingsDataArray.reduce((sum, data) => sum + (data.totalBookings || 0), 0),
      completedBookings: bookingsDataArray.reduce((sum, data) => sum + (data.completedBookings || 0), 0),
      cancelledBookings: bookingsDataArray.reduce((sum, data) => sum + (data.cancelledBookings || 0), 0),
      pendingBookings: bookingsDataArray.reduce((sum, data) => sum + (data.pendingBookings || 0), 0)
    }
  }

  

  // Load dashboard data when center selection or user clicks Apply on revenue filters
  useEffect(() => {
    loadAllDashboardData()
    loadBookingStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCenterId, revenueFilterApplyKey])

  // Ensure first visit shows last-7-days stats by triggering an initial apply
  useEffect(() => {
    setRevenueFilterApplyKey((k) => k + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Also fetch once immediately on mount to avoid any race before apply key updates
  useEffect(() => {
    loadAllDashboardData()
    loadBookingStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload booking status when user switches the dropdown center
  useEffect(() => {
    loadBookingStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingStatusCenterId])

  // (kept) separate calls handled above

  // Load revenue by store when clicking Apply
  useEffect(() => {
    loadRevenueByStore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenueFilterApplyKey])

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
      case 'dashboard':
        return renderDashboardContent()
      default:
        return renderDashboardContent()
    }
  }

  const renderDashboardContent = () => {
    // Backend returns: data.summary.totalRevenue, data.revenueByPeriod, data.groupedData.byService
    // Handle both camelCase and PascalCase from backend
    const revenue = dashboardData?.revenue
    const summary = revenue?.summary || revenue?.Summary
    const revenueByPeriod = revenue?.revenueByPeriod || revenue?.RevenueByPeriod || []
    const groupedData = revenue?.groupedData || revenue?.GroupedData
    const byService = groupedData?.byService || groupedData?.ByService || []

    // Prepare revenue data for chart: normalize, fill gaps to cover full range by selected granularity
    const startDate = new Date(revenueDateRange.fromDate)
    const endDate = new Date(revenueDateRange.toDate)

    const normalizeKey = (raw: string): string => {
      const s = (raw || '').trim()
      if (!s) return ''
      // Already in quarter form like '2025-Q1'
      if (/^\d{4}-Q[1-4]$/i.test(s)) return s
      // Year only
      if (/^\d{4}$/.test(s)) return s
      // Date forms
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
      if (/^\d{4}-\d{2}$/.test(s)) return s
      // Fallback try to slice
      if (s.length >= 10) return s.substring(0, 10)
      if (s.length >= 7) return s.substring(0, 7)
      return s
    }

    const getKeyForDate = (d: Date): string => {
      const y = d.getFullYear()
      const m = `${d.getMonth() + 1}`.padStart(2, '0')
      switch (revenueGranularity) {
        case 'day':
          const day = `${d.getDate()}`.padStart(2, '0')
          return `${y}-${m}-${day}`
        case 'month':
          return `${y}-${m}`
        case 'quarter':
          return `${y}-Q${Math.floor(d.getMonth() / 3) + 1}`
        case 'year':
          return `${y}`
      }
    }

    const iterateRangeKeys = (): string[] => {
      const keys: string[] = []
      const d = new Date(startDate)
      d.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(0, 0, 0, 0)

      while (d <= end) {
        keys.push(getKeyForDate(d))
        switch (revenueGranularity) {
          case 'day':
            d.setDate(d.getDate() + 1)
            break
          case 'month':
            d.setMonth(d.getMonth() + 1)
            d.setDate(1)
            break
          case 'quarter':
            d.setMonth(d.getMonth() + 3)
            d.setDate(1)
            break
          case 'year':
            d.setFullYear(d.getFullYear() + 1)
            d.setMonth(0, 1)
            break
        }
      }
      return keys
    }

    const apiMap = new Map<string, number>()
    ;(revenueByPeriod || []).forEach((item: any) => {
      const key = normalizeKey(item.period || item.Period || '')
      const val = Number(item.revenue || item.Revenue || 0)
      if (key) apiMap.set(key, val)
    })

    const revenueData = iterateRangeKeys().map((key) => ({
      month: key,
      revenue: apiMap.get(key) ?? 0,
      orders: 0,
    }))

    const totalRevenueForChart = revenueData.reduce((sum: number, it: any) => sum + (Number(it.revenue) || 0), 0)

    // Prepare service data for pie chart
    const serviceData = byService.length > 0
      ? byService.slice(0, 4).map((item: any, index: number) => {
          const colors = ['var(--primary-500)', 'var(--success-500)', 'var(--warning-500)', 'var(--info-500)']
          const totalRevenue = Number(summary?.totalRevenue || summary?.TotalRevenue || 0)
          const itemRevenue = Number(item.revenue || item.Revenue || 0)
          const itemBookings = Number(item.bookings || item.Bookings || 0)
          return {
            name: item.serviceName || item.ServiceName || '',
            value: totalRevenue > 0 ? Math.round((itemRevenue / totalRevenue) * 100) : 0,
            color: colors[index % colors.length],
            revenue: itemRevenue,
            bookingCount: itemBookings
          }
        })
      : []

    // Prepare stats strictly from dashboard summary API (already filtered by global time range)
    const summaryData = dashboardSummary || {
      totalRevenue: 0,
      totalEmployees: 0,
      totalCompletedBookings: 0,
      serviceRevenue: 0,
      partsRevenue: 0
    }

    const totalRevenue = summaryData.totalRevenue
    const totalBookings = summary?.totalBookings || summary?.TotalBookings || 0
    const completedBookings = summaryData.totalCompletedBookings
    const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0'

    const quickActions: Array<{ title: string; description: string; icon: any; page: string; route?: string; color: string }> = [
      {
        title: 'Quản lý nhân sự',
        description: 'Thêm, sửa, xóa nhân viên',
        icon: UserCheck,
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
        color: 'var(--info-500)'
      },
      {
        title: 'Quản lý người dùng',
        description: 'Quản lý tài khoản khách hàng',
        icon: Users,
        page: 'users',
        color: 'var(--warning-500)'
      }
    ]

    const stats = [
      {
        title: 'Tổng doanh thu',
        value: totalRevenue.toLocaleString('vi-VN'),
        unit: 'VND',
        change: dashboardSummary ? '' : '+12.5%', // Hide change percentage if using API data
        changeType: 'positive' as const,
        icon: DollarSign,
        color: 'var(--primary-500)'
      },
      {
        title: 'Tổng nhân viên',
        value: summaryData.totalEmployees.toString(),
        unit: 'người',
        change: dashboardSummary ? '' : '+8.2%',
        changeType: 'positive' as const,
        icon: UserCheck,
        color: 'var(--success-500)'
      },
      {
        title: 'Đơn hoàn thành',
        value: completedBookings.toString(),
        unit: 'đơn',
        change: dashboardSummary ? '' : '+5.1%',
        changeType: 'positive' as const,
        icon: Users,
        color: 'var(--info-500)'
      },
      {
        title: 'Doanh thu từ dịch vụ',
        value: summaryData.serviceRevenue.toLocaleString('vi-VN'),
        unit: 'VND',
        change: dashboardSummary ? '' : '',
        changeType: 'positive' as const,
        icon: Wrench,
        color: 'var(--warning-500)'
      },
      {
        title: 'Doanh thu từ phụ tùng',
        value: summaryData.partsRevenue.toLocaleString('vi-VN'),
        unit: 'VND',
        change: dashboardSummary ? '' : '',
        changeType: 'positive' as const,
        icon: Package,
        color: 'var(--info-500)'
      }
    ]

    return (
      <>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
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

        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px'
          }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Đang tải dữ liệu doanh thu...
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#991b1b', fontSize: '14px' }}>{error}</span>
            <button
              onClick={loadDashboardData}
              style={{
                background: 'transparent',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                padding: '4px 8px',
                color: '#991b1b',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Bộ lọc thời gian chung */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-card)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Từ ngày:
            </label>
            <input
              type="date"
              value={revenueDateRange.fromDate}
              onChange={(e) => { setRevenueDateRange(prev => ({ ...prev, fromDate: e.target.value })) }}
              style={{ padding: '8px 12px', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-primary)'}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Đến ngày:
            </label>
            <input
              type="date"
              value={revenueDateRange.toDate}
              onChange={(e) => { setRevenueDateRange(prev => ({ ...prev, toDate: e.target.value })) }}
              max={new Date().toISOString().split('T')[0]}
              style={{ padding: '8px 12px', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-primary)'}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Granularity:
            </label>
            <select
              value={revenueGranularity}
              onChange={(e) => setRevenueGranularity(e.target.value as 'day' | 'month' | 'quarter' | 'year')}
              style={{ padding: '8px 12px', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-primary)'}
            >
              <option value="day">Ngày</option>
              <option value="month">Tháng</option>
              <option value="quarter">Quý</option>
              <option value="year">Năm</option>
            </select>
          </div>
          <button
            onClick={() => setRevenueFilterApplyKey((k) => k + 1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--primary-500)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-600)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-500)' }}
          >
            Áp dụng
          </button>
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
              {stat.change && (
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
              )}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
                margin: '0'
            }}>
                Doanh thu theo thời gian
            </h3>
            <span style={{
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              Tổng: {totalRevenueForChart.toLocaleString('vi-VN')} VND
            </span>
          </div>
            {loading && (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            )}
          </div>
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
            {
              // Prefer system-wide services stats if available; fall back to previous byService/mocks
              (() => {
                const colors = ['var(--primary-500)', 'var(--success-500)', 'var(--warning-500)', 'var(--info-500)']
                let chartData: Array<{ name: string; value: number; color: string; revenue?: number; bookingCount?: number }> = []
                if (servicesStats && servicesStats.services && servicesStats.services.length > 0) {
                  const total = servicesStats.totalServiceRevenue || 0
                  const fallbackTotalBookings = servicesStats.totalCompletedBookings || 0
                  chartData = servicesStats.services.slice(0, 6).map((s, idx) => ({
                    name: s.serviceName,
                    value: total > 0 ? Math.round((s.serviceRevenue / total) * 100) : (fallbackTotalBookings > 0 ? Math.round((s.bookingCount / fallbackTotalBookings) * 100) : 0),
                    color: colors[idx % colors.length],
                    revenue: s.serviceRevenue,
                    bookingCount: s.bookingCount,
                  }))
                  // Lưu ý: servicesStats.totalCompletedBookings có thể khác với dashboardSummary.totalCompletedBookings
                  // vì servicesStats đếm theo PaidAt, còn dashboardSummary đếm theo CreatedAt
                } else if (serviceData && serviceData.length > 0) {
                  chartData = serviceData
                } else {
                  chartData = []
                }
                return chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
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
                  formatter={(value, _name, item: any) => {
                    const p = item && item.payload
                    if (p && (p.revenue !== undefined || p.bookingCount !== undefined)) {
                      const revenueText = `${Number(p.revenue || 0).toLocaleString('vi-VN')} VND`
                      const bookingText = `${p.bookingCount || 0} lượt`
                      return [`${revenueText} | ${bookingText}`, p.name]
                    }
                    return [`${value}%`, 'Tỷ lệ']
                  }}
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
                )
              })()
            }
          </div>

          {/* Revenue by Store Chart */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0'
            }}>
              Doanh thu giữa các chi nhánh
            </h3>
            {loadingStoreRevenue && (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            )}
        </div>
          {revenueByStore && revenueByStore.stores.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={revenueByStore.stores} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis
                  dataKey="storeName"
                stroke="var(--text-secondary)"
                fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') {
                      return [`${Number(value).toLocaleString('vi-VN')} VND`, 'Doanh thu']
                    }
                    if (name === 'completedBookings') {
                      return [value, 'Đơn hoàn thành']
                    }
                    return [value, name]
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  fill="var(--primary-500)" 
                  name="Doanh thu (VND)"
                  radius={[8, 8, 0, 0]}
                />
            </BarChart>
          </ResponsiveContainer>
          ) : loadingStoreRevenue ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '16px' }}>Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ margin: 0, fontSize: '16px' }}>Chưa có dữ liệu doanh thu theo cửa hàng</p>
            </div>
          )}
          </div>

          {/* Booking Status by Center (table) */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                Trạng thái đơn theo chi nhánh
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Chi nhánh:</label>
                <select
                  value={bookingStatusCenterId === 'all' ? 'all' : String(bookingStatusCenterId)}
                  onChange={(e) => {
                    const v = e.target.value
                    setBookingStatusCenterId(v === 'all' ? 'all' : Number(v))
                  }}
                  style={{ padding: '8px 12px', border: '1px solid var(--border-primary)', borderRadius: '8px', background: 'var(--bg-card)', cursor: 'pointer' }}
                >
                  <option value="all">Tất cả chi nhánh</option>
                  {centers.map(c => (
                    <option key={c.centerId} value={c.centerId}>{c.centerName}</option>
                  ))}
                </select>
              </div>
            </div>
            {bookingStatus && bookingStatus.items && bookingStatus.items.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px' }}>Trạng thái</th>
                      <th style={{ padding: '10px' }}>Số lượng</th>
                      <th style={{ padding: '10px' }}>Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const STATUS_LABELS: Record<string, string> = {
                        'PENDING': 'Chờ xử lý',
                        'CONFIRMED': 'Đã xác nhận',
                        'IN_PROGRESS': 'Đang thực hiện',
                        'COMPLETED': 'Hoàn thành',
                        'CANCELLED': 'Đã hủy',
                        'CANCELED': 'Đã hủy',
                        'PAID': 'Đã thanh toán',
                      }
                      const humanize = (s: string) => STATUS_LABELS[(s || '').toUpperCase()] || s
                      return bookingStatus.items.map((it, idx) => {
                      const pct = bookingStatus.total > 0 ? Math.round((it.count / bookingStatus.total) * 100) : 0
                      return (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border-primary)' }}>
                          <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{humanize(it.status)}</td>
                          <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{it.count}</td>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{pct}%</td>
                        </tr>
                      )
                    })})()}
                    <tr style={{ borderTop: '1px solid var(--border-primary)', background: 'var(--primary-50)' }}>
                      <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>Tổng lịch hẹn</td>
                      <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>{bookingStatus.total}</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Chưa có dữ liệu trạng thái đơn cho phạm vi thời gian này
              </div>
            )}
          </div>
        </div>
      </div>

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
    </>
  )
  }

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
                // Quản lý đơn hàng & lịch hẹn
                { icon: ShoppingCart, label: 'Đơn hàng', page: 'orders', route: '/admin/orders' },
                { icon: CalendarCheck, label: 'Đặt lịch', page: 'bookings', route: '/admin/bookings' },
                { icon: MessageSquare, label: 'Phản hồi', page: 'feedback', route: '/admin/feedback' },
                // Quản lý người dùng
                { icon: Users, label: 'Người dùng', page: 'users', route: '/admin/users' },
                { icon: UserCheck, label: 'Nhân sự', page: 'staff', route: '/admin/staff' },
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
          padding: '24px',
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

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { 
  Users, 
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ReportsService } from '@/services/reportsService'
import { StaffService } from '@/services/staffService'
import './DashboardOverview.scss'


interface DashboardOverviewProps {
  onNavigate: (page: string) => void
}

export default function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [staffList, setStaffList] = useState<any[]>([])

  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const centerId = user?.centerId || 2
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = getStartDateByPeriod('MONTHLY')

      // Load dashboard data in parallel
      const [
        revenueResponse,
        bookingResponse,
        technicianResponse,
        inventoryResponse,
        staffResponse
      ] = await Promise.all([
        ReportsService.getRevenueReport(centerId, {
          startDate,
          endDate,
          reportType: 'MONTHLY'
        }),
        ReportsService.getTodayBookings(centerId),
        ReportsService.getTechnicianPerformance(centerId, 'MONTHLY'),
        ReportsService.getInventoryUsage(centerId, 'MONTHLY'),
        StaffService.getStaffList({ centerId, pageSize: 10 })
      ])

      setDashboardData({
        revenue: revenueResponse.data,
        bookings: bookingResponse.data,
        technicians: technicianResponse.data,
        inventory: inventoryResponse.data
      })
      setStaffList(staffResponse.data.staff || [])

    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getStartDateByPeriod = (period: string): string => {
    const today = new Date()
    switch (period) {
      case 'MONTHLY':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        return monthAgo.toISOString().split('T')[0]
      default:
        return today.toISOString().split('T')[0]
    }
  }

  if (loading) {
    return (
      <div className="dashboard-overview">
        <div className="loading-state">
        Đang tải dữ liệu dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-overview">
        <div className="error-state">
          <div className="error-message">{error}</div>
        <button 
          onClick={loadDashboardData}
            className="retry-button"
        >
          Thử lại
        </button>
        </div>
      </div>
    )
  }

  // Prepare stats data
  const stats = [
    {
      title: 'Doanh thu tháng này',
      value: (dashboardData?.revenue?.summary?.totalRevenue ? Number(dashboardData.revenue.summary.totalRevenue) : 0).toLocaleString('vi-VN'),
      unit: 'VNĐ',
      change: dashboardData?.revenue?.summary?.growthRate || '+0%',
      changeType: 'positive',
      icon: DollarSign,
      color: '#FFD875'
    },
    {
      title: 'Tổng số đặt chỗ hôm nay',
      value: dashboardData?.bookings?.summary?.totalBookings ? dashboardData.bookings.summary.totalBookings.toString() : '0',
      unit: 'đặt chỗ',
      change: dashboardData?.bookings?.summary?.completedBookings ? `${dashboardData.bookings.summary.completedBookings} hoàn thành` : '0 hoàn thành',
      changeType: 'positive',
      icon: TrendingUp,
      color: '#FFD875'
    },
    {
      title: 'Nhân viên hoạt động',
      value: staffList.length.toString(),
      unit: 'người',
      change: staffList.filter((s: any) => s.isActive).length.toString(),
      changeType: 'positive',
      icon: Users,
      color: '#FFD875'
    }
  ]

  // Prepare chart data
  const revenueData = dashboardData?.revenue?.revenueByPeriod?.map((item: any) => ({
    month: item.period,
    revenue: item.revenue,
    profit: (item.revenue * 0.3)
  })) || []

  const staffPerformanceData = dashboardData?.technicians?.technicians?.slice(0, 5).map((tech: any) => ({
    staff: tech.technicianName,
    tasks: tech.totalBookings || 0,
    completed: tech.completedBookings || 0
  })) || []

  return (
    <div className="dashboard-overview">
      {/* Header */}
      <div className="header">
        <h1>Quản lý chi nhánh và hiệu suất kinh doanh</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <stat.icon size={24} />
              </div>
              <div className={`stat-change ${stat.changeType}`}>
                {stat.change}
              </div>
            </div>
            <h3 className="stat-title">{stat.title}</h3>
            <div className="stat-value">
              <span className="value">{stat.value}</span>
              <span className="unit">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="charts-section">
        <h2>Biểu đồ thống kê chi nhánh</h2>
        
        {/* Revenue Chart */}
        <div className="chart-card">
          <h3>Doanh thu hàng tháng</h3>
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
                  tickFormatter={(value: number) => Number(value).toLocaleString('vi-VN')}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString('vi-VN')} VNĐ`,
                    name === 'revenue' ? 'Doanh thu' : 'Lợi nhuận'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FFD875"
                  fill="rgba(255, 216, 117, 0.1)"
                  strokeWidth={2}
                  dot
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#22C55E"
                  fill="rgba(34, 197, 94, 0.1)"
                  strokeWidth={2}
                  dot
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              Không có dữ liệu doanh thu
            </div>
          )}
        </div>

        {/* Staff Performance Chart - Line Chart */}
        <div className="chart-card">
          <h3>Hiệu suất nhân viên</h3>
            {staffPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={staffPerformanceData}>
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
                <Line type="monotone" dataKey="tasks" stroke="#FFD875" strokeWidth={3} name="Tổng công việc" />
                <Line type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={3} name="Đã hoàn thành" />
              </LineChart>
              </ResponsiveContainer>
            ) : (
            <div className="empty-state">
                Không có dữ liệu nhân viên
              </div>
            )}
        </div>
      </div>

      {/* Staff List */}
      <div className="quick-actions">
        <h2>Danh sách nhân viên của trung tâm</h2>
        {/* Luôn hiển thị điểm dữ liệu; bỏ checkbox tùy chọn */}
        <div className="staff-list">
          {staffList.length > 0 ? (
            staffList.slice(0, 5).map((staff: any) => (
              <div
                key={staff.staffId}
                className="staff-card"
              >
                <div className="staff-info">
                  <div className="staff-avatar">
                    {staff.fullName?.charAt(0) || 'NV'}
                  </div>
                  <div className="staff-details">
                    <h3>{staff.fullName || 'N/A'}</h3>
                    <p>{staff.position || 'Nhân viên'}</p>
                  </div>
                </div>
                <div className={`staff-status ${staff.isActive ? 'active' : 'inactive'}`}>
                  {staff.isActive ? 'Đang làm việc' : 'Nghỉ phép'}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">
              <p>Chưa có nhân viên nào</p>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
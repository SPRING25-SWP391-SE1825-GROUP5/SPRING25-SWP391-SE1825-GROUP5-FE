import { useState, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { 
  DollarSign,
  ShoppingCart,
  Download,
  TrendingUp,
  Users,
  Package,
  AlertTriangle
} from 'lucide-react'
import {
  LineChart,
  Line,
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
import { ReportsService } from '@/services/reportsService'

export default function ReportsManagement() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportPeriod, setReportPeriod] = useState('MONTHLY')
  const [revenueData, setRevenueData] = useState<any>(null)
  const [partsUsageData, setPartsUsageData] = useState<any>(null)
  const [bookingData, setBookingData] = useState<any>(null)
  const [technicianData, setTechnicianData] = useState<any>(null)
  const [inventoryData, setInventoryData] = useState<any>(null)

  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    loadReportsData()
  }, [reportPeriod])

  const loadReportsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const centerId = user?.centerId || 2
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = getStartDateByPeriod(reportPeriod)

      // Load all reports in parallel
      const [
        revenueResponse,
        partsResponse,
        bookingResponse,
        technicianResponse,
        inventoryResponse
      ] = await Promise.all([
        ReportsService.getRevenueReport(centerId, {
          startDate,
          endDate,
          reportType: reportPeriod as any
        }),
        ReportsService.getPartsUsageReport(centerId, {
          startDate,
          endDate,
          reportType: reportPeriod as any
        }),
        ReportsService.getTodayBookings(centerId),
        ReportsService.getTechnicianPerformance(centerId, reportPeriod),
        ReportsService.getInventoryUsage(centerId, reportPeriod)
      ])

      setRevenueData(revenueResponse.data)
      setPartsUsageData(partsResponse.data)
      setBookingData(bookingResponse.data)
      setTechnicianData(technicianResponse.data)
      setInventoryData(inventoryResponse.data)

    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const getStartDateByPeriod = (period: string): string => {
    const today = new Date()
    switch (period) {
      case 'DAILY':
        return today.toISOString().split('T')[0]
      case 'WEEKLY':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return weekAgo.toISOString().split('T')[0]
      case 'MONTHLY':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        return monthAgo.toISOString().split('T')[0]
      case 'YEARLY':
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        return yearAgo.toISOString().split('T')[0]
      default:
        return today.toISOString().split('T')[0]
    }
  }

  const getPeriodLabel = (period: string): string => {
    switch (period) {
      case 'DAILY': return 'Hôm nay'
      case 'WEEKLY': return 'Tuần này'
      case 'MONTHLY': return 'Tháng này'
      case 'YEARLY': return 'Năm nay'
      default: return 'Tháng này'
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '16px',
        color: 'var(--text-secondary)'
      }}>
        Đang tải dữ liệu báo cáo...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        gap: '16px'
      }}>
        <div style={{ fontSize: '16px', color: '#EF4444' }}>{error}</div>
        <button 
          onClick={loadReportsData}
          style={{
            padding: '8px 16px',
            background: '#FFD875',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Thử lại
        </button>
      </div>
    )
  }

  // Prepare chart data
  const revenueChartData = revenueData?.revenueByPeriod?.map((item: any) => ({
    period: item.period,
    revenue: item.revenue / 1000000, // Convert to millions
    bookings: item.bookings
  })) || []

  const serviceChartData = revenueData?.revenueByService?.map((item: any) => ({
    name: item.serviceName,
    value: item.bookings,
    color: item.serviceName.includes('Bảo dưỡng') ? '#FFD875' : '#22C55E'
  })) || []

  // Calculate stats
  const reportStats = [
    {
      title: 'Doanh thu',
      value: revenueData ? (revenueData.totalRevenue / 1000000).toFixed(1) : '0',
      unit: 'triệu VNĐ',
      icon: DollarSign,
      color: '#FFD875'
    },
    {
      title: 'Đơn hàng',
      value: bookingData?.totalBookings?.toString() || '0',
      unit: 'đơn',
      icon: ShoppingCart,
      color: '#22C55E'
    },
    {
      title: 'Kỹ thuật viên',
      value: technicianData?.summary?.totalTechnicians?.toString() || '0',
      unit: 'người',
      icon: Users,
      color: '#3B82F6'
    },
    {
      title: 'Phụ tùng',
      value: inventoryData?.totalParts?.toString() || '0',
      unit: 'loại',
      icon: Package,
      color: '#F59E0B'
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Báo cáo Chi nhánh
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="DAILY">Hôm nay</option>
            <option value="WEEKLY">Tuần này</option>
            <option value="MONTHLY">Tháng này</option>
            <option value="YEARLY">Năm nay</option>
          </select>
          <button 
            onClick={loadReportsData}
            style={{
              padding: '10px 20px',
              background: '#FFD875',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {reportStats.map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: stat.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={20} />
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)',
                  margin: '0 0 4px 0',
                  fontWeight: '500'
                }}>
                  {stat.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: 'var(--text-primary)'
                  }}>
                    {stat.value}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)'
                  }}>
                    {stat.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Revenue Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Doanh thu theo thời gian
          </h3>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis 
                  dataKey="period" 
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
                  formatter={(value) => [`${value} triệu VNĐ`, 'Doanh thu']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FFD875" 
                  strokeWidth={2}
                  name="Doanh thu"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '300px',
              color: 'var(--text-secondary)'
            }}>
              Không có dữ liệu doanh thu
            </div>
          )}
        </div>

        {/* Service Distribution Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Phân bố dịch vụ
          </h3>
          {serviceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={serviceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceChartData.map((entry, index) => (
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
                  formatter={(value, name) => [`${value} đơn`, name]}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '300px',
              color: 'var(--text-secondary)'
            }}>
              Không có dữ liệu dịch vụ
            </div>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: '0 0 16px 0'
        }}>
          Thông tin bổ sung
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
              Giá trị đơn hàng trung bình
            </p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {revenueData?.averageOrderValue ? revenueData.averageOrderValue.toLocaleString() : '0'} VNĐ
            </p>
          </div>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
              Tỷ lệ hoàn thành
            </p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {bookingData?.totalBookings > 0 
                ? ((bookingData.completedBookings / bookingData.totalBookings) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
              Phụ tùng sắp hết
            </p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#F59E0B', margin: 0 }}>
              {inventoryData?.lowStockParts || 0} loại
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
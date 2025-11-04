import { useState, useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { getCurrentUser } from '@/store/authSlice'
import { 
  DollarSign,
  ShoppingCart,
  CheckCircle,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Calendar
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
  // Chế độ mặc định: 7 ngày gần nhất, cho phép tùy chỉnh
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('day')
  const [revenueData, setRevenueData] = useState<any>(null)
  const [partsUsageData, setPartsUsageData] = useState<any>(null)
  const [bookingData, setBookingData] = useState<any>(null)
  const [technicianData, setTechnicianData] = useState<any>(null)
  const [inventoryData, setInventoryData] = useState<any>(null)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [serviceRevenueItems, setServiceRevenueItems] = useState<any[]>([])
  const [utilizationRate, setUtilizationRate] = useState<number | null>(null)

  const user = useAppSelector((state) => state.auth.user)
  const dispatch = useAppDispatch()
  const profileFetchAttempted = useRef(false)

  // Fetch profile nếu thiếu centerId (chỉ một lần)
  useEffect(() => {
    const fetchProfileIfNeeded = async () => {
      // Chỉ fetch một lần nếu user tồn tại nhưng thiếu centerId
      if (!profileFetchAttempted.current && user && !user.centerId) {
        profileFetchAttempted.current = true
        try {
          await dispatch(getCurrentUser()).unwrap()
        } catch (error) {
          console.error('Failed to fetch user profile:', error)
        }
      }
    }
    fetchProfileIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Chỉ chạy khi user.id thay đổi (khi user được set lần đầu)

  // Khởi tạo mặc định: 7 ngày gần nhất và tự tải dữ liệu
  useEffect(() => {
    // Chỉ load data khi đã có centerId
    if (!user?.centerId) {
      return
    }
    
    const today = new Date()
    const sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
    const d2 = today.toISOString().split('T')[0]
    const d1 = sevenDaysAgo.toISOString().split('T')[0]
    setFromDate(d1)
    setToDate(d2)
    setGranularity('day')
    // Tải sau khi state set (microtask)
    setTimeout(() => {
      loadReportsData(d1, d2, 'day')
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.centerId])

  const loadReportsData = async (
    overrideFrom?: string,
    overrideTo?: string,
    overrideGranularity?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ) => {
    try {
      setLoading(true)
      setError(null)
      
      const centerId = user?.centerId
      
      if (!centerId) {
        setError('Không tìm thấy thông tin chi nhánh. Vui lòng đăng nhập lại.')
        setLoading(false)
        return
      }
      const startDate = overrideFrom || fromDate
      const endDate = overrideTo || toDate

      // Revenue: luôn dùng API mới theo BE
      let revenuePayload: any
      const effectiveGran = overrideGranularity || (granularity || deriveGranularity(startDate, endDate))
      const res = await ReportsService.getCenterRevenue(centerId, {
        from: startDate,
        to: endDate,
        granularity: effectiveGran
      })
      const total = res.totalRevenue ?? (res.items?.reduce((s, it) => s + (it.revenue || 0), 0) || 0)
      revenuePayload = {
        totalRevenue: total,
        revenueByPeriod: (res.items || []).map((it: any) => ({
          period: it.period,
          revenue: it.revenue,
          bookings: 0
        })),
        revenueByService: []
      }

      // Load remaining reports in non-blocking mode
      const results = await Promise.allSettled([
        ReportsService.getPartsUsageReport(centerId, { startDate, endDate, reportType: 'DAILY' as any }),
        ReportsService.getBookingStatusCounts(centerId, { from: startDate, to: endDate }),
        ReportsService.getTechnicianPerformance(centerId, 'month'),
        ReportsService.getInventoryUsage(centerId, 'month'),
        ReportsService.getRevenueByService(centerId, { from: startDate, to: endDate }),
        ReportsService.getBookingCancellation(centerId, { from: startDate, to: endDate }),
        ReportsService.getInventoryLowStock(centerId, { threshold: 5 }),
        ReportsService.getUtilizationRate(centerId, { from: startDate, to: endDate })
      ])

      setRevenueData(revenuePayload)
      const [partsR, bookingR, techR, invR, revServiceR, cancelR, lowStockR, utilizationR] = results
      if (partsR.status === 'fulfilled') setPartsUsageData(partsR.value.data)
      if (bookingR.status === 'fulfilled') {
        const total = bookingR.value.total ?? 0
        const items = bookingR.value.items || []
        // Lấy số lượng bookings có status PAID
        const paidCount = items.find((item: any) => 
          item.status?.toUpperCase() === 'PAID'
        )?.count || 0
        setBookingData({ totalBookings: paidCount })
      }
      if (techR.status === 'fulfilled') setTechnicianData(techR.value.data)
      if (invR.status === 'fulfilled') setInventoryData(invR.value.data)
      if (revServiceR.status === 'fulfilled') {
        const raw = revServiceR.value?.items || revServiceR.value || []
        const arr: any[] = Array.isArray(raw) ? raw : []
        const normalized = arr.map((it: any) => {
          const name = it.serviceName || it.name || it.ServiceName || 'Không rõ'
          const revenue = Number(it.revenue ?? it.totalRevenue ?? 0) || 0
          const bookingCount = Number(
            it.usageCount ?? it.bookings ?? it.count ?? it.totalBookings ?? it.bookingCount ?? it.timesUsed ?? 0
          ) || 0
          return { serviceName: name, revenue, bookingCount }
        })
        setServiceRevenueItems(normalized)
      }
      if (cancelR.status === 'fulfilled') {
        const rate = Number(cancelR.value?.cancellationRate ?? 0)
        setInventoryData((prev: any) => ({ ...(prev || {}), __cancellationRate: rate }))
      }
      if (lowStockR.status === 'fulfilled') {
        const items = lowStockR.value?.items || []
        setLowStockItems(Array.isArray(items) ? items : [])
      }
      if (utilizationR.status === 'fulfilled') {
        const response = utilizationR.value as any
        
        // Lấy tỉ lệ lấp đầy trung bình
        let averageRate = 0
        
        // Nếu có field averageUtilizationRate trực tiếp
        if (response?.averageUtilizationRate !== undefined) {
          averageRate = Number(response.averageUtilizationRate)
        }
        // Nếu có items array, tính trung bình từ các items
        else if (response?.items && Array.isArray(response.items) && response.items.length > 0) {
          const rates = response.items
            .map((item: any) => Number(item.utilizationRate ?? item.rate ?? 0))
            .filter((rate: number) => !isNaN(rate) && rate > 0)
          
          if (rates.length > 0) {
            averageRate = rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length
          }
        }
        // Nếu có utilizationRate trực tiếp (có thể đã là trung bình)
        else if (response?.utilizationRate !== undefined) {
          averageRate = Number(response.utilizationRate)
        }
        // Tính từ usedSlots / totalSlots nếu có
        else if (response?.usedSlots && response?.totalSlots) {
          averageRate = Number(response.usedSlots) / Number(response.totalSlots)
        }
        
        setUtilizationRate(averageRate)
      } else if (utilizationR.status === 'rejected') {
        setUtilizationRate(0)
      }

    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu báo cáo')
    } finally {
      setLoading(false)
    }
  }

  // Bỏ preset: không dùng nữa

  const deriveGranularity = (from: string, to: string): 'day' | 'week' | 'month' | 'quarter' | 'year' => {
    try {
      const start = new Date(from)
      const end = new Date(to)
      const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      if (diffDays <= 31) return 'day'
      if (diffDays <= 180) return 'week'
      if (diffDays <= 730) return 'month'
      return 'quarter'
    } catch {
      return 'day'
    }
  }

  // Format helpers for professional range label
  const formatDateShort = (iso: string): { d: string; m: string; y: string; text: string } => {
    try {
      const d = new Date(iso + 'T00:00:00')
      const day = d.getDate().toString().padStart(2, '0')
      const monthShort = new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(d) // "thg 11"
      const year = d.getFullYear().toString()
      const prettyMonth = monthShort.replace('thg ', 'Thg ')
      return { d: day, m: prettyMonth, y: year, text: `${day} ${prettyMonth} ${year}` }
    } catch {
      return { d: iso, m: '', y: '', text: iso }
    }
  }

  const formatRangeLabel = (from?: string, to?: string, g?: string): string => {
    if (!from || !to) return ''
    const a = formatDateShort(from)
    const b = formatDateShort(to)
    // Same year and month → "02–04 Thg 11 2025"
    if (a.y === b.y && a.m === b.m) {
      const core = `${a.d}–${b.d} ${a.m} ${a.y}`
      return g === 'week' ? `Tuần: ${core}` : core
    }
    // Same year, different month → "28 Thg 10 – 04 Thg 11 2025"
    if (a.y === b.y) {
      const core = `${a.d} ${a.m} – ${b.d} ${b.m} ${a.y}`
      return g === 'week' ? `Tuần: ${core}` : core
    }
    // Different year → "30 Thg 12 2024 – 04 Thg 1 2025"
    const core = `${a.d} ${a.m} ${a.y} – ${b.d} ${b.m} ${b.y}`
    return g === 'week' ? `Tuần: ${core}` : core
  }

  // Beautify period label from backend (e.g., "2025-11-02_to_2025-11-04")
  const beautifyPeriod = (raw: string): string => {
    if (!raw) return ''
    // Weekly pattern: YYYY-MM-DD_to_YYYY-MM-DD
    if (raw.includes('_to_')) {
      const [a, b] = raw.split('_to_')
      return formatRangeLabel(a, b, granularity)
    }
    // ISO date -> dd Thg mm
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const f = formatDateShort(raw)
      return `${f.d} ${f.m}`
    }
    return raw
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
            onClick={() => {
              if (!fromDate || !toDate) {
                setError('Vui lòng chọn đầy đủ khoảng thời gian')
                return
              }
              // Ensure from <= to
              if (new Date(fromDate) > new Date(toDate)) {
                setError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc')
                return
              }
              setError(null)
              loadReportsData(fromDate, toDate, granularity)
            }}
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
    revenue: item.revenue,
    bookings: item.bookings
  })) || []

  const palette = ['#FFD875','#22C55E','#3B82F6','#F59E0B','#EF4444','#A78BFA','#14B8A6','#F472B6','#84CC16','#06B6D4']
  const serviceChartData = (serviceRevenueItems || []).map((item: any, idx: number) => {
    const count = Number(item.bookingCount ?? item.count ?? item.bookings ?? item.usageCount ?? 0) || 0
    const revenue = Number(item.revenue ?? 0) || 0
    return {
      name: item.serviceName,
      value: revenue, // dùng doanh thu làm tỷ lệ
      revenue,
      count,
      color: palette[idx % palette.length]
    }
  })

  // Calculate stats
  // Tính tổng doanh thu theo dịch vụ
  const totalServiceRevenue = (serviceRevenueItems || []).reduce((sum, item) => {
    return sum + (Number(item.revenue) || 0)
  }, 0)

  const reportStats = [
    {
      title: 'Tổng doanh thu',
      value: (revenueData?.totalRevenue ? Number(revenueData.totalRevenue) : 0).toLocaleString('vi-VN'),
      unit: 'VNĐ',
      icon: DollarSign,
      color: '#FFD875'
    },
    {
      title: 'Lịch hẹn',
      value: bookingData?.totalBookings?.toString() || '0',
      unit: 'đơn',
      icon: Calendar,
      color: '#22C55E'
    },
    {
      title: 'Doanh thu theo dịch vụ',
      value: totalServiceRevenue.toLocaleString('vi-VN'),
      unit: 'VNĐ',
      icon: Package,
      color: '#3B82F6'
    },
    {
      title: 'Tỉ lệ lấp đầy',
      value: utilizationRate !== null ? `${(utilizationRate * 100).toFixed(1)}` : '0',
      unit: '%',
      icon: TrendingUp,
      color: '#A78BFA'
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Báo cáo Chi nhánh
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>đến</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              />
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="day">Theo ngày</option>
                <option value="week">Theo tuần</option>
                <option value="month">Theo tháng</option>
                <option value="quarter">Theo quý</option>
                <option value="year">Theo năm</option>
              </select>
              {/* Pretty range label */}
              {fromDate && toDate && (
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  padding: '6px 10px',
                  border: '1px dashed var(--border-primary)',
                  borderRadius: '8px',
                  background: 'var(--bg-card)'
                }}>
                  {formatRangeLabel(fromDate, toDate, granularity)}
                </span>
              )}
          </div>

          <button 
            onClick={() => {
              if (!fromDate || !toDate) {
                setError('Vui lòng chọn đầy đủ khoảng thời gian')
                return
              }
              // Ensure from <= to
              if (new Date(fromDate) > new Date(toDate)) {
                setError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc')
                return
              }
              setError(null)
              loadReportsData(fromDate, toDate, granularity)
            }}
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
            <CheckCircle size={16} />
            Áp dụng
          </button>
          {/* Luôn hiển thị điểm dữ liệu (đã bật cố định) */}
          {/* Bỏ chọn chỉ số; luôn dùng doanh thu làm tỷ lệ, tooltip hiển thị cả 2 */}
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
                  tickFormatter={(value: string) => beautifyPeriod(value)}
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
                  formatter={(value) => [`${Number(value).toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                  labelFormatter={(label) => beautifyPeriod(label as string)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FFD875" 
                  strokeWidth={2}
                  name="Doanh thu"
                  dot
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
                  nameKey="name"
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
                  formatter={(value: number, name: string, entry: any) => {
                    const d = (entry && entry.payload) ? entry.payload : {}
                    const rev = d.revenue ?? d.totalRevenue ?? value ?? 0
                    const cnt = d.count ?? d.usageCount ?? d.bookings ?? d.totalBookings ?? 0
                    const display = `${Number(rev).toLocaleString('vi-VN')} VNĐ • ${Number(cnt).toLocaleString('vi-VN')} lượt`
                    const label = d.name || d.serviceName || name || 'Dịch vụ'
                    return [display, label]
                  }}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
              Tỷ lệ hủy đơn
            </p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {typeof inventoryData?.__cancellationRate === 'number'
                ? (inventoryData.__cancellationRate * 100).toFixed(1)
                : '0'}%
            </p>
          </div>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
              Phụ tùng sắp hết (≤ 5)
            </p>
            {lowStockItems && lowStockItems.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
                {lowStockItems.slice(0, 6).map((p: any) => (
                  <li key={p.partId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{p.partName || 'Không rõ'}</span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>{p.currentStock}/{p.minThreshold}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Không có phụ tùng sắp hết</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


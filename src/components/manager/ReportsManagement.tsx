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
  BarChart,
  Bar,
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
  const [technicianBookingStats, setTechnicianBookingStats] = useState<any[]>([])
  const [peakHourStats, setPeakHourStats] = useState<any[]>([])

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
        ReportsService.getInventoryLowStock(centerId, { threshold: 5 }),
        ReportsService.getTechnicianBookingStats(centerId, { from: startDate, to: endDate }),
        ReportsService.getPeakHourStats(centerId, { from: startDate, to: endDate })
      ])

      setRevenueData(revenuePayload)
      const [partsR, bookingR, techR, invR, revServiceR, lowStockR, techBookingStatsR, peakHourStatsR] = results
      if (partsR.status === 'fulfilled') setPartsUsageData(partsR.value.data)
      if (bookingR.status === 'fulfilled') {
        const response = bookingR.value as any
        console.log('[ReportsManagement] Booking status response:', response)
        
        // Kiểm tra nhiều format response có thể có
        const total = response.total ?? response.data?.total ?? 0
        const items = response.items ?? response.data?.items ?? []
        
        console.log('[ReportsManagement] Booking status items:', items)
        console.log('[ReportsManagement] Booking status total:', total)
        
        // Lấy số lượng bookings theo từng status
        const getBookingCount = (status: string) => {
          const item = items.find((item: any) => {
            const itemStatus = item.status?.toUpperCase() ?? item.Status?.toUpperCase() ?? ''
            return itemStatus === status.toUpperCase()
          })
          const count = item?.count ?? item?.Count ?? 0
          console.log(`[ReportsManagement] Status ${status}:`, count)
          return Number(count) || 0
        }
        
        const paidCount = getBookingCount('PAID')
        const cancelledCount = getBookingCount('CANCELLED')
        const completedCount = getBookingCount('COMPLETED')
        const inProgressCount = getBookingCount('IN_PROGRESS')
        const inProgressCountAlt = getBookingCount('INPROGRESS') // Alternative format
        const pendingCount = getBookingCount('PENDING')
        
        // Tính tổng từ items nếu total không có
        const calculatedTotal = total > 0 ? total : items.reduce((sum: number, item: any) => {
          const count = item?.count ?? item?.Count ?? 0
          return sum + (Number(count) || 0)
        }, 0)
        
        // Kết hợp IN_PROGRESS và INPROGRESS nếu có
        const finalInProgressCount = inProgressCount + inProgressCountAlt
        
        console.log('[ReportsManagement] Final booking stats:', {
          totalAllBookings: calculatedTotal,
          paidBookings: paidCount,
          cancelledBookings: cancelledCount,
          completedBookings: completedCount,
          inProgressBookings: finalInProgressCount,
          pendingBookings: pendingCount
        })
        
        // Lưu tất cả thông tin booking để hiển thị
        setBookingData({ 
          totalBookings: paidCount, // Giữ lại cho stats card "Lịch hẹn"
          totalAllBookings: calculatedTotal, // Tổng tất cả các booking
          paidBookings: paidCount, // Booking đã thanh toán
          cancelledBookings: cancelledCount, // Booking đã hủy
          completedBookings: completedCount, // Booking đã hoàn thành
          inProgressBookings: finalInProgressCount, // Booking đang xử lý
          pendingBookings: pendingCount // Booking chờ xử lý
        })
      } else if (bookingR.status === 'rejected') {
        console.error('[ReportsManagement] Failed to fetch booking status:', bookingR.reason)
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
      if (lowStockR.status === 'fulfilled') {
        const items = lowStockR.value?.items || []
        setLowStockItems(Array.isArray(items) ? items : [])
      }
      if (techBookingStatsR.status === 'fulfilled') {
        const response = techBookingStatsR.value as any
        console.log('[ReportsManagement] Raw technician booking stats response:', response)
        
        // Xử lý nhiều cấu trúc response khác nhau
        let items: any[] = []
        if (response?.technicians && Array.isArray(response.technicians)) {
          // API trả về { success: true, technicians: [...] }
          items = response.technicians
          console.log('[ReportsManagement] Found items in response.technicians')
        } else if (response?.items && Array.isArray(response.items)) {
          items = response.items
          console.log('[ReportsManagement] Found items in response.items')
        } else if (response?.data?.technicians && Array.isArray(response.data.technicians)) {
          items = response.data.technicians
          console.log('[ReportsManagement] Found items in response.data.technicians')
        } else if (response?.data?.items && Array.isArray(response.data.items)) {
          items = response.data.items
          console.log('[ReportsManagement] Found items in response.data.items')
        } else if (response?.data && Array.isArray(response.data)) {
          items = response.data
          console.log('[ReportsManagement] Found items in response.data')
        } else if (Array.isArray(response)) {
          items = response
          console.log('[ReportsManagement] Response is array directly')
        } else {
          console.warn('[ReportsManagement] Unknown response structure:', Object.keys(response || {}))
          // Thử tìm trong các field khác
          if (response && typeof response === 'object') {
            const allKeys = Object.keys(response)
            console.log('[ReportsManagement] Available keys in response:', allKeys)
            // Có thể response có structure khác, thử tìm array trong các field
            for (const key of allKeys) {
              if (Array.isArray(response[key])) {
                console.log(`[ReportsManagement] Found array in key: ${key}`, response[key])
                items = response[key]
                break
              }
            }
          }
        }
        console.log('[ReportsManagement] Final technician booking stats items:', items)
        setTechnicianBookingStats(items)
      } else if (techBookingStatsR.status === 'rejected') {
        const error = techBookingStatsR.reason
        console.error('[ReportsManagement] Error loading technician booking stats:', error)
        console.error('[ReportsManagement] Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          statusText: error?.response?.statusText
        })
        setTechnicianBookingStats([])
      }

      // Handle Peak Hour Stats
      if (peakHourStatsR.status === 'fulfilled') {
        const response = peakHourStatsR.value as any
        console.log('[ReportsManagement] Peak hour stats response (full):', JSON.stringify(response, null, 2))
        
        // Xử lý nhiều cấu trúc response khác nhau
        let items: any[] = []
        if (response?.hourlyStats && Array.isArray(response.hourlyStats)) {
          items = response.hourlyStats
          console.log('[ReportsManagement] Found items in response.hourlyStats')
        } else if (response?.items && Array.isArray(response.items)) {
          items = response.items
          console.log('[ReportsManagement] Found items in response.items')
        } else if (response?.data?.hourlyStats && Array.isArray(response.data.hourlyStats)) {
          items = response.data.hourlyStats
          console.log('[ReportsManagement] Found items in response.data.hourlyStats')
        } else if (response?.data?.items && Array.isArray(response.data.items)) {
          items = response.data.items
          console.log('[ReportsManagement] Found items in response.data.items')
        } else if (response?.data && Array.isArray(response.data)) {
          items = response.data
          console.log('[ReportsManagement] Found items in response.data')
        } else if (Array.isArray(response)) {
          items = response
          console.log('[ReportsManagement] Response is array directly')
        } else {
          console.warn('[ReportsManagement] Unknown peak hour stats response structure:', Object.keys(response || {}))
          // Thử tìm array trong bất kỳ field nào
          if (response && typeof response === 'object') {
            const allKeys = Object.keys(response)
            for (const key of allKeys) {
              if (Array.isArray(response[key])) {
                items = response[key]
                console.log(`[ReportsManagement] Found array in response.${key}`)
                break
              }
            }
          }
        }
        
        console.log('[ReportsManagement] Peak hour stats items (parsed):', items)
        console.log('[ReportsManagement] Peak hour stats items count:', items.length)
        setPeakHourStats(items)
      } else if (peakHourStatsR.status === 'rejected') {
        const error = peakHourStatsR.reason
        console.error('[ReportsManagement] Error loading peak hour stats:', error)
        console.error('[ReportsManagement] Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          statusText: error?.response?.statusText
        })
        setPeakHourStats([])
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

  // Prepare technician booking stats chart data
  const technicianChartData = (technicianBookingStats || [])
    .filter((tech: any) => tech && (tech.technicianId || tech.technicianName)) // Filter out invalid entries
    .map((tech: any) => {
      // Xử lý nhiều format khác nhau của response
      const name = tech.technicianName || tech.name || tech.fullName || `KTV ${tech.technicianId || tech.id || ''}` || 'Không rõ'
      // API trả về bookingCount, map thành totalBookings
      const total = Number(tech.totalBookings ?? tech.bookingCount ?? tech.total ?? tech.count ?? 0) || 0
      const completed = Number(tech.completedBookings ?? tech.completed ?? tech.completedCount ?? 0) || 0
      const cancelled = Number(tech.cancelledBookings ?? tech.cancelled ?? tech.cancelledCount ?? 0) || 0
      const inProgress = Number(tech.inProgressBookings ?? tech.inProgress ?? tech.inProgressCount ?? 0) || 0
      const pending = Number(tech.pendingBookings ?? tech.pending ?? tech.pendingCount ?? 0) || 0
      const rating = Number(tech.averageRating ?? tech.rating ?? tech.avgRating ?? 0) || 0
      const revenue = Number(tech.revenue ?? tech.totalRevenue ?? 0) || 0
      
      return {
        name,
        totalBookings: total,
        completedBookings: completed,
        cancelledBookings: cancelled,
        inProgressBookings: inProgress,
        pendingBookings: pending,
        averageRating: rating,
        revenue
      }
    })
    .sort((a, b) => b.totalBookings - a.totalBookings) // Sort by total bookings descending

  console.log('[ReportsManagement] Technician chart data:', technicianChartData)

  // Prepare peak hour stats chart data
  const peakHourChartData = (peakHourStats || [])
    .filter((item: any) => {
      // Nới lỏng filter - chỉ cần có dữ liệu hợp lệ
      if (!item || typeof item !== 'object') return false
      // Kiểm tra xem có ít nhất một trong các field: slotId, slotLabel, slotTime, totalBookedSlots
      const hasSlotId = item.slotId !== undefined
      const hasSlotLabel = item.slotLabel || item.slotName || item.timeSlot || item.slot
      const hasSlotTime = item.slotTime || item.hour || item.hourOfDay
      const hasCount = item.totalBookedSlots !== undefined || item.bookingCount !== undefined || item.count !== undefined || item.totalBookings !== undefined
      return hasSlotId || hasSlotLabel || hasSlotTime || hasCount
    })
    .map((item: any) => {
      // Xử lý nhiều format khác nhau, ưu tiên format mới từ API
      const slotLabel = item.slotLabel || item.slotName || item.timeSlot || item.slot || item.SlotLabel || item.SlotName || item.TimeSlot || 'Không rõ'
      const slotTime = item.slotTime || item.time || item.hour || item.hourOfDay || ''
      
      // Parse hour từ slotTime để sort (ví dụ: "08:00" -> 8)
      let hour = 0
      if (slotTime) {
        const timeMatch = slotTime.toString().match(/(\d+)/)
        if (timeMatch) {
          hour = parseInt(timeMatch[1], 10)
        }
      } else if (item.hour !== undefined) {
        hour = Number(item.hour) || 0
      } else if (item.slotId !== undefined) {
        // Nếu không có time, có thể dùng slotId làm thứ tự
        hour = Number(item.slotId) || 0
      }
      
      const bookingCount = Number(item.totalBookedSlots ?? item.bookingCount ?? item.count ?? item.totalBookings ?? item.BookingCount ?? item.Count ?? 0) || 0
      const totalSlots = Number(item.totalSlots ?? item.availableSlots ?? item.TotalSlots ?? item.AvailableSlots ?? 0) || 0
      const utilizationRate = Number(item.utilizationRate ?? item.rate ?? item.UtilizationRate ?? item.Rate ?? 0) || 0
      
      return {
        name: slotLabel,
        hour: hour,
        slotTime: slotTime,
        bookingCount: bookingCount,
        totalSlots: totalSlots,
        utilizationRate: utilizationRate,
        slotId: item.slotId
      }
    })
    .sort((a: any, b: any) => {
      // Sort by slotId hoặc hour hoặc slotTime
      if (a.slotId !== undefined && b.slotId !== undefined) {
        return a.slotId - b.slotId
      }
      if (a.hour !== undefined && b.hour !== undefined) {
        return a.hour - b.hour
      }
      if (a.slotTime && b.slotTime) {
        return a.slotTime.localeCompare(b.slotTime)
      }
      return (a.name || '').localeCompare(b.name || '')
    })

  console.log('[ReportsManagement] Peak hour chart data (final):', peakHourChartData)
  console.log('[ReportsManagement] Peak hour chart data count:', peakHourChartData.length)

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
      title: 'Doanh thu theo phụ tùng',
      value: (partsUsageData?.totalValue ? Number(partsUsageData.totalValue) : 0).toLocaleString('vi-VN'),
      unit: 'VNĐ',
      icon: Package,
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

      {/* Charts Row - Technician Performance and Peak Hour Stats */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        {/* Technician Performance Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)',
          flex: '1',
          minWidth: '500px'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Hiệu suất Kỹ thuật viên
          </h3>
        </div>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            color: 'var(--text-secondary)'
          }}>
            Đang tải dữ liệu...
          </div>
        ) : technicianChartData.length > 0 ? (
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={technicianChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
              <YAxis 
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={(value) => Number(value).toLocaleString('vi-VN')}
                domain={[0, 'auto']}
              />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      totalBookings: 'Tổng đơn',
                      completedBookings: 'Đã hoàn thành',
                      cancelledBookings: 'Đã hủy',
                      inProgressBookings: 'Đang xử lý',
                      pendingBookings: 'Chờ xử lý',
                      revenue: 'Doanh thu (VNĐ)',
                      averageRating: 'Đánh giá TB'
                    }
                    if (name === 'revenue') {
                      return [`${Number(value).toLocaleString('vi-VN')} VNĐ`, labels[name] || name]
                    }
                    if (name === 'averageRating') {
                      return [`${Number(value).toFixed(1)}`, labels[name] || name]
                    }
                    return [`${Number(value).toLocaleString('vi-VN')}`, labels[name] || name]
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      totalBookings: 'Tổng đơn',
                      completedBookings: 'Đã hoàn thành',
                      cancelledBookings: 'Đã hủy',
                      inProgressBookings: 'Đang xử lý',
                      pendingBookings: 'Chờ xử lý'
                    }
                    return labels[value] || value
                  }}
                />
                <Bar 
                  dataKey="totalBookings" 
                  fill="#3B82F6" 
                  name="totalBookings"
                  radius={[4, 4, 0, 0]}
                />
                {technicianChartData.some((d: any) => d.completedBookings > 0) && (
                  <Bar 
                    dataKey="completedBookings" 
                    fill="#22C55E" 
                    name="completedBookings"
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {technicianChartData.some((d: any) => d.cancelledBookings > 0) && (
                  <Bar 
                    dataKey="cancelledBookings" 
                    fill="#EF4444" 
                    name="cancelledBookings"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            color: 'var(--text-secondary)',
            gap: '8px'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>Không có dữ liệu hiệu suất Kỹ thuật viên</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Vui lòng chọn khoảng thời gian khác hoặc kiểm tra lại dữ liệu
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                <summary style={{ cursor: 'pointer' }}>Debug Info</summary>
                <pre style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '10px'
                }}>
                  {JSON.stringify({ 
                    technicianBookingStats, 
                    technicianChartData,
                    fromDate,
                    toDate
                  }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        </div>

        {/* Peak Hour Stats Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)',
          flex: '1',
          minWidth: '500px'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Thống kê giờ cao điểm
          </h3>
        </div>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            color: 'var(--text-secondary)'
          }}>
            Đang tải dữ liệu...
          </div>
        ) : peakHourChartData.length > 0 ? (
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={peakHourChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis 
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  tickFormatter={(value) => Number(value).toLocaleString('vi-VN')}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      bookingCount: 'Số lượng đặt chỗ',
                      totalSlots: 'Tổng slot',
                      utilizationRate: 'Tỷ lệ sử dụng (%)'
                    }
                    if (name === 'utilizationRate') {
                      return [`${(Number(value) * 100).toFixed(1)}%`, labels[name] || name]
                    }
                    return [`${Number(value).toLocaleString('vi-VN')}`, labels[name] || name]
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      bookingCount: 'Số lượng đặt chỗ',
                      totalSlots: 'Tổng slot',
                      utilizationRate: 'Tỷ lệ sử dụng'
                    }
                    return labels[value] || value
                  }}
                />
                <Bar 
                  dataKey="bookingCount" 
                  fill="#FFD875" 
                  name="bookingCount"
                  radius={[4, 4, 0, 0]}
                />
                {peakHourChartData.some((d: any) => d.totalSlots > 0) && (
                  <Bar 
                    dataKey="totalSlots" 
                    fill="#94A3B8" 
                    name="totalSlots"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            color: 'var(--text-secondary)',
            gap: '8px'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>Không có dữ liệu thống kê giờ cao điểm</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Vui lòng chọn khoảng thời gian khác hoặc kiểm tra lại dữ liệu
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                <summary style={{ cursor: 'pointer' }}>Debug Info</summary>
                <pre style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '10px'
                }}>
                  {JSON.stringify({ 
                    peakHourStats, 
                    peakHourChartData,
                    fromDate,
                    toDate
                  }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Additional Info and Low Stock Items - Side by Side */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginTop: '32px',
        flexWrap: 'wrap'
      }}>
        {/* Additional Info */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)',
          flex: '1',
          minWidth: '300px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 16px 0'
          }}>
            Thông tin bổ sung
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tổng các booking */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-primary)' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Tổng các booking
              </p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {bookingData?.totalAllBookings ? bookingData.totalAllBookings.toLocaleString('vi-VN') : '0'}
              </p>
            </div>

            {/* Booking đã thanh toán */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-primary)' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Booking đã thanh toán
              </p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#22C55E', margin: 0 }}>
                {bookingData?.paidBookings ? bookingData.paidBookings.toLocaleString('vi-VN') : '0'}
              </p>
            </div>

            {/* Booking đã hủy */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-primary)' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Booking đã hủy
              </p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#EF4444', margin: 0 }}>
                {bookingData?.cancelledBookings ? bookingData.cancelledBookings.toLocaleString('vi-VN') : '0'}
              </p>
            </div>

            {/* Booking đã hoàn thành */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-primary)' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Booking đã hoàn thành
              </p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#3B82F6', margin: 0 }}>
                {bookingData?.completedBookings ? bookingData.completedBookings.toLocaleString('vi-VN') : '0'}
              </p>
            </div>

            {/* Booking đang xử lý */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Booking đang xử lý
              </p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#F59E0B', margin: 0 }}>
                {bookingData?.inProgressBookings ? bookingData.inProgressBookings.toLocaleString('vi-VN') : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock Items - Separate Section */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)',
          flex: '1',
          minWidth: '300px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 16px 0'
          }}>
            Phụ tùng sắp hết (≤ 5)
          </h3>
          {lowStockItems && lowStockItems.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {lowStockItems.slice(0, 10).map((p: any) => (
                <li 
                  key={p.partId} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-primary)'
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                    {p.partName || 'Không rõ'}
                  </span>
                  <span style={{ 
                    color: '#F59E0B', 
                    fontWeight: 600,
                    fontSize: '14px',
                    padding: '4px 12px',
                    background: '#FEF3C7',
                    borderRadius: '6px'
                  }}>
                    {p.currentStock}/{p.minThreshold}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ 
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '14px'
            }}>
              Không có phụ tùng sắp hết
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


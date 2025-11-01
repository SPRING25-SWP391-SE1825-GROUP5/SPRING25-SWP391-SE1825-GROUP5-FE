import api from './api'

// Revenue Report
export interface RevenueReportRequest {
  startDate: string
  endDate: string
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
}

export interface RevenueReportResponse {
  success: boolean
  message: string
  data: {
    totalRevenue: number
    totalBookings: number
    averageOrderValue: number
    revenueByPeriod: Array<{
      period: string
      revenue: number
      bookings: number
    }>
    revenueByService: Array<{
      serviceName: string
      revenue: number
      bookings: number
    }>
  }
}

// Parts Usage Report
export interface PartsUsageReportRequest {
  startDate: string
  endDate: string
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
}

export interface PartsUsageReportResponse {
  success: boolean
  message: string
  data: {
    totalPartsUsed: number
    totalValue: number
    partsUsage: Array<{
      partName: string
      quantityUsed: number
      totalValue: number
      usagePercentage: number
    }>
    usageByPeriod: Array<{
      period: string
      partsUsed: number
      value: number
    }>
  }
}

// Booking Reports
export interface BookingReportsResponse {
  success: boolean
  message: string
  data: {
    totalBookings: number
    completedBookings: number
    cancelledBookings: number
    pendingBookings: number
    bookingsByStatus: Array<{
      status: string
      count: number
      percentage: number
    }>
    bookingsByService: Array<{
      serviceName: string
      count: number
      percentage: number
    }>
  }
}

// Technician Performance Report
export interface TechnicianPerformanceResponse {
  success: boolean
  message: string
  data: {
    technicians: Array<{
      technicianId: number
      technicianName: string
      completedBookings: number
      averageRating: number
      totalRevenue: number
      efficiency: number
    }>
    summary: {
      totalTechnicians: number
      averagePerformance: number
      topPerformer: string
    }
  }
}

// Inventory Usage Report
export interface InventoryUsageResponse {
  success: boolean
  message: string
  data: {
    totalParts: number
    lowStockParts: number
    outOfStockParts: number
    totalValue: number
    usageByCategory: Array<{
      category: string
      partsCount: number
      value: number
    }>
    topUsedParts: Array<{
      partName: string
      quantityUsed: number
      value: number
    }>
  }
}

// Helper function to convert period to backend format for Technician/Inventory
// Backend expects: week, month, quarter, year
const convertPeriodForTechnicianInventory = (period: string): string => {
  // Normalize input
  const normalized = period.toUpperCase()
  
  const mapping: Record<string, string> = {
    'WEEKLY': 'week',
    'MONTHLY': 'month',
    'QUARTERLY': 'quarter',
    'YEARLY': 'year',
    'WEEK': 'week',
    'MONTH': 'month',
    'QUARTER': 'quarter',
    'YEAR': 'year',
    'DAILY': 'week' // Map daily to week for technician/inventory reports
  }
  
  const result = mapping[normalized]
  if (result) return result
  
  // If input is already in lowercase and matches expected values, return as is
  const lower = period.toLowerCase()
  const validPeriods = ['week', 'month', 'quarter', 'year']
  if (validPeriods.includes(lower)) return lower
  
  // Default fallback
  return 'month'
}

const convertPeriodForRevenue = (period: string): string => {
  const periodUpper = period.toUpperCase()
  const mapping: Record<string, string> = {
    'DAILY': 'daily',
    'WEEKLY': 'weekly',
    'MONTHLY': 'monthly',
    'YEARLY': 'yearly'
  }
  return mapping[periodUpper] || period.toLowerCase()
}

export const ReportsService = {
  // Revenue Report
  async getRevenueReport(centerId: number, request: RevenueReportRequest, groupBy: string = 'service'): Promise<RevenueReportResponse> {
    // Backend expects: StartDate, EndDate, Period (lowercase: daily/weekly/monthly/quarterly), GroupBy
    const params = {
      startDate: request.startDate,
      endDate: request.endDate,
      period: convertPeriodForRevenue(request.reportType),
      groupBy: groupBy, // 'service' to get revenue by service data
      compareWithPrevious: false
    }
    const response = await api.get(`/Reports/revenue/${centerId}`, { params })
    return response.data
  },

  // Parts Usage Report
  async getPartsUsageReport(centerId: number, request: PartsUsageReportRequest): Promise<PartsUsageReportResponse> {
    const params = {
      startDate: request.startDate,
      endDate: request.endDate,
      compareWithPrevious: false,
      pageNumber: 1,
      pageSize: 20
    }
    const response = await api.get(`/Reports/parts-usage/${centerId}`, { params })
    return response.data
  },

  // Today's Bookings
  async getTodayBookings(centerId: number): Promise<BookingReportsResponse> {
    const response = await api.get(`/Reports/bookings/today/${centerId}`)
    return response.data
  },

  // Bookings Report
  async getBookingsReport(centerId: number, pageNumber: number = 1, pageSize: number = 10, status?: string): Promise<BookingReportsResponse> {
    const params: Record<string, string | number> = { pageNumber, pageSize }
    if (status) params.status = status
    
    const response = await api.get(`/Reports/bookings/${centerId}`, { params })
    return response.data
  },

  // Technician Performance
  async getTechnicianPerformance(centerId: number, period: string = 'month'): Promise<TechnicianPerformanceResponse> {
    const convertedPeriod = convertPeriodForTechnicianInventory(period)
    const response = await api.get(`/Reports/technicians/performance/${centerId}`, { params: { period: convertedPeriod } })
    return response.data
  },

  // Technician Schedule
  async getTechnicianSchedule(centerId: number, date: string): Promise<unknown> {
    const response = await api.get(`/Reports/technicians/schedule/${centerId}`, { params: { date } })
    return response.data
  },

  // Inventory Usage
  async getInventoryUsage(centerId: number, period: string = 'month'): Promise<InventoryUsageResponse> {
    const convertedPeriod = convertPeriodForTechnicianInventory(period)
    const response = await api.get(`/Reports/inventory/usage/${centerId}`, { params: { period: convertedPeriod } })
    return response.data
  }
}

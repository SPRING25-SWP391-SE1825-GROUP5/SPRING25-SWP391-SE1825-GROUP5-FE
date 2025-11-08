import api from './api'

// Revenue Report
export interface RevenueReportRequest {
  startDate: string
  endDate: string
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
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
    'QUARTERLY': 'quarterly',
    'YEARLY': 'yearly'
  }
  return mapping[periodUpper] || period.toLowerCase()
}

export const ReportsService = {
  // Total Revenue across the whole system (all centers)
  async getTotalRevenue(
    params: {
      from?: string
      to?: string
      granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year'
    }
  ): Promise<{
    success?: boolean
    totalRevenue?: number
    granularity?: string
    items?: Array<{ period: string; revenue: number }>
    Items?: Array<{ Period: string; Revenue: number }>
    TotalRevenue?: number
  }> {
    const response = await api.get('/Reports/total-revenue', {
      params: {
        from: params.from,
        to: params.to,
        granularity: params.granularity || 'day',
      },
    })
    return response.data
  },

  // Services booking stats across the whole system (revenue + successful bookings)
  async getServicesBookingStats(params?: { fromDate?: string; toDate?: string }): Promise<{
    success: boolean
    message?: string
    data: {
      success?: boolean
      generatedAt?: string
      fromDate?: string
      toDate?: string
      totalCompletedBookings?: number
      totalServiceRevenue?: number
      services: Array<{
        serviceId: number
        serviceName: string
        bookingCount: number
        serviceRevenue: number
      }>
    }
  }> {
    const response = await api.get('/Reports/services-booking-stats', {
      params: params ? { fromDate: params.fromDate, toDate: params.toDate } : undefined,
    })
    return response.data
  },
  // Center Revenue by range (aligns with BE: GET /api/Report/centers/{centerId}/revenue)
  async getCenterRevenue(
    centerId: number,
    params: {
      from?: string
      to?: string
      granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year'
    }
  ): Promise<{
    success?: boolean
    totalRevenue: number
    granularity: string
    items: Array<{ period: string; revenue: number }>
  }> {
    const response = await api.get(`/Report/centers/${centerId}/revenue`, {
      params: {
        from: params.from,
        to: params.to,
        granularity: params.granularity || 'day',
      },
    })
    return response.data
  },

  // Revenue by Service within range
  async getRevenueByService(
    centerId: number,
    params: { from?: string; to?: string }
  ): Promise<{
    success?: boolean
    items: Array<{
      serviceId?: number
      serviceName: string
      revenue: number
      bookings?: number
      usageCount?: number
      count?: number
    }>
  }> {
    const response = await api.get(`/Report/centers/${centerId}/revenue-by-service`, {
      params: { from: params.from, to: params.to },
    })
    return response.data
  },

  // Booking Status Counts by range
  async getBookingStatusCounts(
    centerId: number,
    params: { from?: string; to?: string }
  ): Promise<{
    success?: boolean
    total: number
    items: Array<{ status: string; count: number }>
  }> {
    const response = await api.get(`/Report/centers/${centerId}/bookings/status`, {
      params: { from: params.from, to: params.to },
    })
    return response.data
  },

  // Booking Cancellation rate by range
  async getBookingCancellation(
    centerId: number,
    params: { from?: string; to?: string }
  ): Promise<{
    success?: boolean
    cancelled: number
    totalServed: number
    cancellationRate: number
  }> {
    const response = await api.get(`/Report/centers/${centerId}/booking-cancellation`, {
      params: { from: params.from, to: params.to },
    })
    return response.data
  },

  // Inventory Low Stock list
  async getInventoryLowStock(
    centerId: number,
    params: { threshold?: number }
  ): Promise<{
    success?: boolean
    items: Array<{ partId: number; partName: string; currentStock: number; minThreshold: number }>
  }> {
    const response = await api.get(`/Report/centers/${centerId}/inventory/low-stock`, {
      params: { threshold: params.threshold ?? 5 },
    })
    return response.data
  },

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
  },

  // Utilization Rate
  async getUtilizationRate(
    centerId: number,
    params?: { from?: string; to?: string }
  ): Promise<{
    success?: boolean
    utilizationRate?: number
    averageUtilizationRate?: number
    totalSlots?: number
    usedSlots?: number
    items?: Array<{ period: string; utilizationRate: number }>
  }> {
    const response = await api.get(`/Report/centers/${centerId}/utilization-rate`, {
      params: params ? { from: params.from, to: params.to } : undefined,
    })
    return response.data
  },

  // Technician Booking Stats
  async getTechnicianBookingStats(
    centerId: number,
    params?: { from?: string; to?: string }
  ): Promise<{
    success?: boolean
    items?: Array<{
      technicianId: number
      technicianName: string
      totalBookings: number
      completedBookings: number
      cancelledBookings: number
      inProgressBookings?: number
      pendingBookings?: number
      averageRating?: number
      revenue?: number
    }>
  }> {
    try {
      console.log('[ReportsService] Calling getTechnicianBookingStats with:', { centerId, params })
      const response = await api.get(`/Report/centers/${centerId}/technicians/booking-stats`, {
        params: params ? { from: params.from, to: params.to } : undefined,
      })
      console.log('[ReportsService] getTechnicianBookingStats response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('[ReportsService] Error in getTechnicianBookingStats:', error)
      console.error('[ReportsService] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url
      })
      throw error
    }
  },

  // Peak Hour Stats
  async getPeakHourStats(
    centerId: number,
    params?: { from?: string; to?: string }
  ): Promise<{
    success?: boolean
    hourlyStats?: Array<{
      hour: number
      slotName?: string
      bookingCount: number
      totalSlots?: number
      utilizationRate?: number
    }>
    items?: Array<{
      hour: number
      slotName?: string
      bookingCount: number
      totalSlots?: number
      utilizationRate?: number
    }>
  }> {
    const response = await api.get(`/Report/centers/${centerId}/peak-hour-stats`, {
      params: params ? { from: params.from, to: params.to } : undefined,
    })
    return response.data
  },

  // Dashboard Summary
  async getDashboardSummary(params?: { centerId?: number; fromDate?: string; toDate?: string }): Promise<{
    success: boolean
    message: string
    data: {
      success: boolean
      generatedAt: string
      fromDate: string
      toDate: string
      summary: {
        totalRevenue: number
        totalEmployees: number
        totalCompletedBookings: number
        serviceRevenue: number
        partsRevenue: number
      }
    }
  }> {
    const apiParams: Record<string, string | number> = {}
    if (params?.centerId) apiParams.centerId = params.centerId
    if (params?.fromDate) apiParams.fromDate = params.fromDate
    if (params?.toDate) apiParams.toDate = params.toDate

    const response = await api.get('/Reports/dashboard-summary', { params: Object.keys(apiParams).length > 0 ? apiParams : undefined })
    return response.data
  },

  // Revenue by Store
  async getRevenueByStore(params?: { fromDate?: string; toDate?: string }): Promise<{
    success: boolean
    message: string
    data: {
      success: boolean
      generatedAt: string
      fromDate: string
      toDate: string
      stores: Array<{
        storeId: number
        storeName: string
        revenue: number
        completedBookings: number
      }>
      totalRevenue: number
    }
  }> {
    const apiParams: Record<string, string> = {}
    if (params?.fromDate) apiParams.fromDate = params.fromDate
    if (params?.toDate) apiParams.toDate = params.toDate

    const response = await api.get('/Reports/revenue-by-store', { params: Object.keys(apiParams).length > 0 ? apiParams : undefined })
    return response.data
  }
}

// Helper functions for WorkQueue component

export const getCurrentDateString = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const normalizeTime = (raw?: string): string => {
  if (!raw) return '00:00'
  let s = String(raw).trim()
  // Lấy phần đầu nếu là khoảng "hh:mm-hh:mm"
  if (s.includes('-')) s = s.split('-')[0].trim()
  // Loại bỏ ký hiệu SA/CH (vi) hoặc AM/PM
  s = s.replace(/\bSA\b|\bCH\b|am|pm|AM|PM/gi, '').trim()
  // Lấy nhóm giờ:phút
  const match = s.match(/(\d{1,2}):(\d{2})/)
  if (!match) return '00:00'
  let hour = Number(match[1])
  const minute = match[2]
  // Nếu > 23 thì đưa về 00
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) hour = 0
  return `${String(hour).padStart(2, '0')}:${minute}`
}

export const buildCreatedAt = (booking: any, fallbackDate?: string): string => {
  const raw = booking.createdAt || booking.createdDate || booking.created_at || booking.bookingDate
  // Nếu backend trả 0001-01-01... thì coi như invalid
  if (raw && !raw.startsWith('0001-01-01')) return raw
  const datePart = (booking.date && !booking.date.startsWith('0001-01-01')) ? booking.date : (fallbackDate || getCurrentDateString())
  const timePart = normalizeTime(booking.slotLabel || booking.slotTime)
  try {
    const iso = new Date(`${datePart}T${timePart}:00`).toISOString()
    return iso
  } catch {
    return new Date().toISOString()
  }
}

export const mapBookingStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    // Uppercase status từ dropdown
    'PENDING': 'pending',
    'CONFIRMED': 'confirmed',
    'CHECKED_IN': 'checked_in',
    'IN_PROGRESS': 'in_progress',
    'COMPLETED': 'completed',
    'PAID': 'paid',
    'CANCELLED': 'cancelled',
    // Lowercase status từ API
    'pending': 'pending',
    'confirmed': 'confirmed',
    'checked_in': 'checked_in',
    'in_progress': 'in_progress',
    'processing': 'in_progress',
    'completed': 'completed',
    'done': 'completed',
    'paid': 'paid',
    'cancelled': 'cancelled'
  }
  return statusMap[status] || statusMap[status?.toLowerCase()] || 'pending'
}

export const mapStatusToApi = (uiStatus: string): string => {
  if (!uiStatus) return 'PENDING'
  // Normalize to lowercase để xử lý cả chữ HOA và chữ thường
  const normalized = uiStatus.toLowerCase().trim()
  const statusMap: { [key: string]: string } = {
    'pending': 'PENDING',
    'confirmed': 'CONFIRMED',
    'checked_in': 'CHECKED_IN',
    'in_progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'paid': 'PAID',
    'cancelled': 'CANCELLED'
  }
  return statusMap[normalized] || 'PENDING'
}

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return 'Chờ xác nhận'
    case 'confirmed': return 'Đã xác nhận'
    case 'checked_in': return 'Đã check-in'
    case 'in_progress': return 'Đang làm việc'
    case 'completed': return 'Hoàn thành'
    case 'paid': return 'Đã thanh toán'
    case 'cancelled': return 'Đã hủy'
    default: return status
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#8b5cf6' // Tím
    case 'confirmed': return '#F97316' // Cam
    case 'checked_in': return '#10B981' // Xanh lá
    case 'in_progress': return '#3B82F6' // Xanh dương
    case 'completed': return '#10B981' // Xanh lá
    case 'paid': return '#3B82F6' // Xanh dương
    case 'cancelled': return '#EF4444' // Đỏ
    default: return '#6B7280' // Xám
  }
}

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low': return '#10b981'
    case 'medium': return '#f59e0b'
    case 'high': return '#ef4444'
    default: return '#6b7280'
  }
}

export const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'low': return 'Thấp'
    case 'medium': return 'Trung bình'
    case 'high': return 'Cao'
    default: return priority
  }
}

export const canTransitionTo = (currentStatus: string, targetStatus: string): boolean => {
  const validTransitions: { [key: string]: string[] } = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['CHECKED_IN', 'IN_PROGRESS', 'CANCELLED'],
    'CHECKED_IN': ['IN_PROGRESS'], // Không cho phép hủy khi đã check-in
    'IN_PROGRESS': ['COMPLETED'], // Không cho phép hủy khi đang xử lý
    'COMPLETED': ['PAID'],
    'PAID': [],
    'CANCELLED': []
  }

  const currentApiStatus = mapStatusToApi(currentStatus)
  const targetApiStatus = mapStatusToApi(targetStatus)

  return validTransitions[currentApiStatus]?.includes(targetApiStatus) || false
}

export const getDateRange = (
  filterType: 'custom' | 'today' | 'thisWeek' | 'all',
  selectedDate?: string
): { startDate?: string; endDate?: string } | null => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filterType) {
    case 'today':
      const todayStr = getCurrentDateString()
      return { startDate: todayStr, endDate: todayStr }
    case 'thisWeek':
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay()) // Chủ nhật đầu tuần
      const weekEnd = new Date(today)
      weekEnd.setDate(weekStart.getDate() + 6) // Thứ bảy cuối tuần
      return {
        startDate: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
        endDate: `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
      }
    case 'all':
      return null // Không filter theo ngày
    case 'custom':
      return selectedDate ? { startDate: selectedDate, endDate: selectedDate } : null
    default:
      return null
  }
}

export const getDateFromString = (dateStr: string): string | null => {
  if (!dateStr) return null
  try {
    // Nếu đã là format YYYY-MM-DD thì trả về luôn
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return null
  }
}


/**
 * Centralized Booking Status Utilities
 * Tất cả status constants, labels, và helper functions được định nghĩa ở đây
 */

export const BOOKING_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
} as const

export type BookingStatus = typeof BOOKING_STATUSES[keyof typeof BOOKING_STATUSES]

/**
 * Status labels in Vietnamese
 */
export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã check-in',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy'
}

/**
 * CSS classes for status badges
 */
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: 'status-badge status-badge--pending',
  CONFIRMED: 'status-badge status-badge--confirmed',
  CHECKED_IN: 'status-badge status-badge--checked-in',
  IN_PROGRESS: 'status-badge status-badge--in-progress',
  COMPLETED: 'status-badge status-badge--completed',
  PAID: 'status-badge status-badge--paid',
  CANCELLED: 'status-badge status-badge--cancelled'
}

/**
 * Get Vietnamese label for a booking status
 */
export const getStatusLabel = (status: string): string => {
  const upperStatus = status.toUpperCase()
  return STATUS_LABELS[upperStatus] || status
}

/**
 * Get CSS class for status badge
 */
export const getStatusBadgeClass = (status: string): string => {
  const upperStatus = status.toUpperCase()
  return STATUS_BADGE_CLASSES[upperStatus] || 'status-badge status-badge--default'
}

/**
 * Check if status is a finished status (cannot be changed)
 */
export const isFinishedStatus = (status: string): boolean => {
  const upperStatus = status.toUpperCase()
  return upperStatus === BOOKING_STATUSES.COMPLETED ||
         upperStatus === BOOKING_STATUSES.PAID ||
         upperStatus === BOOKING_STATUSES.CANCELLED
}

/**
 * Check if status allows payment
 */
export const allowsPayment = (status: string): boolean => {
  const upperStatus = status.toUpperCase()
  return upperStatus === BOOKING_STATUSES.COMPLETED
}

/**
 * Get status color (for custom styling if needed)
 */
export const getStatusColor = (status: string): string => {
  const upperStatus = status.toUpperCase()
  const colorMap: Record<string, string> = {
    PENDING: '#F59E0B',      // amber
    CONFIRMED: '#3B82F6',    // blue
    CHECKED_IN: '#10B981',  // green
    IN_PROGRESS: '#8B5CF6',  // purple
    COMPLETED: '#6366F1',    // indigo
    PAID: '#059669',         // emerald
    CANCELLED: '#EF4444'     // red
  }
  return colorMap[upperStatus] || '#6B7280' // gray default
}

/**
 * Allowed status transitions
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'IN_PROGRESS', 'CANCELLED'],
  CHECKED_IN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['PAID'],
  PAID: [],
  CANCELLED: []
}

/**
 * Check if a status transition is valid
 */
export const isValidTransition = (fromStatus: string, toStatus: string): boolean => {
  const upperFrom = fromStatus.toUpperCase()
  const upperTo = toStatus.toUpperCase()
  const allowed = ALLOWED_STATUS_TRANSITIONS[upperFrom] || []
  return allowed.includes(upperTo)
}


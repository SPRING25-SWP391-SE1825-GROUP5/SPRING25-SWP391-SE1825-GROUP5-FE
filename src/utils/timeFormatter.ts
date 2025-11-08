/**
 * Format relative time for conversation list items
 * Examples: "1 ngày", "3 ngày", "1 tuần", "2 tuần", "5 tuần"
 */
export function formatConversationTime(timestamp: string | Date | undefined | null): string {
  // Handle undefined/null
  if (!timestamp) {
    return 'vừa xong'
  }

  // Parse timestamp - backend returns UTC time, need to handle correctly
  let date: Date
  if (typeof timestamp === 'string') {
    const timestampStr = timestamp.trim()
    // Check if it has timezone indicator (Z, +HH:MM, -HH:MM)
    const hasTimezone = timestampStr.endsWith('Z') ||
                        /[+-]\d{2}:?\d{2}$/.test(timestampStr)

    if (!hasTimezone && timestampStr.length > 0) {
      // No timezone indicator - assume UTC from backend and append Z
      date = new Date(timestampStr + 'Z')
    } else {
      date = new Date(timestampStr)
    }
  } else {
    date = timestamp
  }

  // Validate date
  if (isNaN(date.getTime())) {
    return 'vừa xong'
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffWeeks > 0) {
    return `${diffWeeks} tuần`
  }

  if (diffDays > 0) {
    return `${diffDays} ngày`
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours > 0) {
    return `${diffHours} giờ`
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes > 0) {
    return `${diffMinutes} phút`
  }

  return 'vừa xong'
}

/**
 * Format relative time for messages
 * Examples: "1 ngày trước", "2 giờ trước", "vừa xong"
 */
export function formatRelativeTime(timestamp: string | Date | undefined | null): string {
  // Handle undefined/null
  if (!timestamp) {
    return 'vừa xong'
  }

  // Parse timestamp - backend returns UTC time, need to handle correctly
  let date: Date
  if (typeof timestamp === 'string') {
    const timestampStr = timestamp.trim()
    // Check if it has timezone indicator (Z, +HH:MM, -HH:MM)
    const hasTimezone = timestampStr.endsWith('Z') ||
                        /[+-]\d{2}:?\d{2}$/.test(timestampStr)

    if (!hasTimezone && timestampStr.length > 0) {
      // No timezone indicator - assume UTC from backend and append Z
      date = new Date(timestampStr + 'Z')
    } else {
      date = new Date(timestampStr)
    }
  } else {
    date = timestamp
  }

  // Validate date
  if (isNaN(date.getTime())) {
    return 'vừa xong'
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffYears > 0) {
    return `${diffYears} ${diffYears === 1 ? 'năm' : 'năm'} trước`
  }

  if (diffMonths > 0) {
    return `${diffMonths} ${diffMonths === 1 ? 'tháng' : 'tháng'} trước`
  }

  if (diffWeeks > 0) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'tuần' : 'tuần'} trước`
  }

  if (diffDays > 0) {
    return `${diffDays} ${diffDays === 1 ? 'ngày' : 'ngày'} trước`
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? 'giờ' : 'giờ'} trước`
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes > 0) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'phút' : 'phút'} trước`
  }

  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds > 10) {
    return `${diffSeconds} giây trước`
  }

  return 'vừa xong'
}


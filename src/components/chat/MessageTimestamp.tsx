import React from 'react'
import { formatRelativeTime } from '@/utils/timeFormatter'
import './MessageTimestamp.scss'

interface MessageTimestampProps {
  timestamp: string | undefined | null
  showRelative?: boolean
  className?: string
}

const MessageTimestamp: React.FC<MessageTimestampProps> = ({
  timestamp,
  showRelative = true,
  className = ''
}) => {
  // Validate timestamp
  if (!timestamp) {
    return null
  }

  try {
    const formatted = showRelative
      ? formatRelativeTime(timestamp)
      : new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    return (
      <span className={`message-timestamp ${className}`}>
        {formatted}
      </span>
    )
  } catch (error) {
    return null
  }
}

export default MessageTimestamp


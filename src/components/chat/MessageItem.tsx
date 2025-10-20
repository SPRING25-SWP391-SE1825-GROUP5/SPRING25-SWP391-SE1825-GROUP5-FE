import React, { useState } from 'react'
// Removed date-fns dependency; use Intl.DateTimeFormat instead
import { Reply, Smile, MoreVertical } from 'lucide-react'
import type { ChatMessage } from '@/types/chat'
import './MessageItem.scss'

interface MessageItemProps {
  message: ChatMessage
  isOwn: boolean
  showSenderInfo: boolean
  showTimestamp: boolean
  onReply?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  className?: string
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  showSenderInfo,
  showTimestamp,
  onReply,
  onReact,
  className = ''
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  const formatMessageTime = (timestamp: string) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(timestamp))
    } catch {
      return ''
    }
  }

  const handleMouseEnter = () => {
    setShowActions(true)
  }

  const handleMouseLeave = () => {
    setShowActions(false)
    setShowReactions(false)
  }

  const handleReply = () => {
    onReply?.(message.id)
  }

  const handleReact = (emoji: string) => {
    onReact?.(message.id, emoji)
    setShowReactions(false)
  }

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡']

  return (
    <div
      className={`message-item ${isOwn ? 'message-item--own' : 'message-item--other'} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!isOwn && showSenderInfo && (
        <div className="message-item__sender">
          <div className="message-item__sender-avatar">
            <div className="message-item__sender-avatar-placeholder">
              {message.senderName.charAt(0).toUpperCase()}
            </div>
          </div>
          <span className="message-item__sender-name">{message.senderName}</span>
        </div>
      )}

      <div className="message-item__content">
        <div className={`message-item__bubble ${isOwn ? 'message-item__bubble--own' : 'message-item__bubble--other'}`}>

          <div className="message-item__text">
            {message.content}
          </div>

        </div>

        {showTimestamp && (
          <div className="message-item__time">
            {formatMessageTime(message.timestamp)}
            {isOwn && (
              <span className={`message-item__status ${message.isRead ? 'message-item__status--read' : 'message-item__status--sent'}`}>
                {message.isRead ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        )}
      </div>

      {showActions && (
        <div className="message-item__actions">
          <button
            className="message-item__action-btn"
            onClick={handleReply}
            aria-label="Trả lời"
            title="Trả lời"
          >
            <Reply size={14} />
          </button>
          
          <div className="message-item__reaction-menu">
            <button
              className="message-item__action-btn"
              onClick={() => setShowReactions(!showReactions)}
              aria-label="Thêm phản ứng"
              title="Thêm phản ứng"
            >
              <Smile size={14} />
            </button>
            
            {showReactions && (
              <div className="message-item__reaction-picker">
                {commonReactions.map((emoji) => (
                  <button
                    key={emoji}
                    className="message-item__reaction-btn"
                    onClick={() => handleReact(emoji)}
                    aria-label={`Phản ứng ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="message-item__action-btn"
            aria-label="Tùy chọn"
            title="Tùy chọn"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export default MessageItem
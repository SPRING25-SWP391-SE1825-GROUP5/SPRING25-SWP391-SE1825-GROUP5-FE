import React, { useState } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
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
    return format(new Date(timestamp), 'HH:mm', { locale: vi })
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
            {message.senderAvatar ? (
              <img 
                src={message.senderAvatar} 
                alt={message.senderName} 
                className="message-item__sender-avatar-img"
              />
            ) : (
              <div className="message-item__sender-avatar-placeholder">
                {message.senderName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="message-item__sender-name">{message.senderName}</span>
        </div>
      )}

      <div className="message-item__content">
        <div className={`message-item__bubble ${isOwn ? 'message-item__bubble--own' : 'message-item__bubble--other'}`}>
          {message.replyTo && (
            <div className="message-item__reply">
              <div className="message-item__reply-line"></div>
              <div className="message-item__reply-content">
                <span className="message-item__reply-sender">Trả lời tin nhắn</span>
                <span className="message-item__reply-text">Tin nhắn đã được trả lời</span>
              </div>
            </div>
          )}

          <div className="message-item__text">
            {message.content}
          </div>

          {message.reactions && message.reactions.length > 0 && (
            <div className="message-item__reactions">
              {message.reactions.map((reaction, index) => (
                <div key={index} className="message-item__reaction">
                  <span className="message-item__reaction-emoji">{reaction.emoji}</span>
                  <span className="message-item__reaction-count">
                    {message.reactions?.filter(r => r.emoji === reaction.emoji).length}
                  </span>
                </div>
              ))}
            </div>
          )}
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

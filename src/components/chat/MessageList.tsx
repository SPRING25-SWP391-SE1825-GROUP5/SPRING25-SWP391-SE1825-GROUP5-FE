import React, { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { ChatMessage } from '@/types/chat'
import MessageItem from './MessageItem'
import './MessageList.scss'

interface MessageListProps {
  messages: ChatMessage[]
  currentUserId: string
  onReply?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  className?: string
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onReply,
  onReact,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.timestamp)
      const dateKey = format(date, 'yyyy-MM-dd')
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return groups
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hôm nay'
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Hôm qua'
    } else {
      return format(date, 'dd/MM/yyyy', { locale: vi })
    }
  }

  const groupedMessages = groupMessagesByDate(messages)

  if (messages.length === 0) {
    return (
      <div className={`message-list message-list--empty ${className}`}>
        <div className="message-list__empty">
          <div className="message-list__empty-icon">💬</div>
          <p className="message-list__empty-text">Chưa có tin nhắn nào</p>
          <p className="message-list__empty-subtext">Hãy bắt đầu cuộc trò chuyện!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`message-list ${className}`} ref={messagesContainerRef}>
      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
        <div key={dateKey} className="message-list__date-group">
          <div className="message-list__date-header">
            <span className="message-list__date-text">
              {formatDateHeader(dateKey)}
            </span>
          </div>
          
          <div className="message-list__messages">
            {dateMessages.map((message, index) => {
              const prevMessage = index > 0 ? dateMessages[index - 1] : null
              const nextMessage = index < dateMessages.length - 1 ? dateMessages[index + 1] : null
              
              // Determine if we should show sender info
              const showSenderInfo = !prevMessage || 
                prevMessage.senderId !== message.senderId ||
                (new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) > 5 * 60 * 1000 // 5 minutes
              
              // Determine if we should show timestamp
              const showTimestamp = !nextMessage || 
                nextMessage.senderId !== message.senderId ||
                (new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime()) > 5 * 60 * 1000 // 5 minutes
              
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  showSenderInfo={showSenderInfo}
                  showTimestamp={showTimestamp}
                  onReply={onReply}
                  onReact={onReact}
                />
              )
            })}
          </div>
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessageList

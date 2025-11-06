import React, { useEffect, useRef } from 'react'
import type { ChatMessage, ChatUser } from '@/types/chat'
import MessageBubble from './MessageBubble'
import './MessageList.scss'

interface MessageListProps {
  conversationId: string
  messages: ChatMessage[]
  currentUser: ChatUser | null
  onReply?: (messageId: string) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
  className?: string
}

const MessageList: React.FC<MessageListProps> = ({
  conversationId,
  messages,
  currentUser,
  onReply,
  onReact,
  onEdit,
  onDelete,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null
        // Compare as strings to ensure correct comparison
        const currentUserIdStr = currentUser?.id ? String(currentUser.id) : ''
        const messageSenderIdStr = String(message.senderId)
        const isOwn = currentUserIdStr === messageSenderIdStr

        // Determine if we should show sender info
        const showSenderInfo = !prevMessage ||
          prevMessage.senderId !== message.senderId ||
          (new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) > 5 * 60 * 1000 // 5 minutes

        // Determine if we should show timestamp
        const showTimestamp = !prevMessage ||
          (new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) > 5 * 60 * 1000 ||
          index === messages.length - 1

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={isOwn}
            showSenderInfo={showSenderInfo}
            showTimestamp={showTimestamp}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessageList

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Paperclip, Headphones } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleWidget, openWidget, closeWidget } from '@/store/chatSlice'
import type { ChatMessage } from '@/types/chat'
import './ChatWidget.scss'

/**
 * ChatWidget - Hộp thoại tin nhắn nhỏ với hỗ trợ khách hàng
 * 
 * Đây là widget chat nhỏ gọn hiển thị ở góc màn hình, khác biệt hoàn toàn với:
 * - ChatInterface: Trang chat đầy đủ với 3 cột (danh sách, chat, thông tin)
 * 
 * Tính năng:
 * - Chat nhanh với nhân viên hỗ trợ
 * - Tự động phản hồi
 * - Giao diện nhỏ gọn, không chiếm nhiều không gian
 * - State riêng biệt, không ảnh hưởng đến ChatInterface
 */
interface ChatWidgetProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark'
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  className = '',
  position = 'bottom-right',
  theme = 'light'
}) => {
  const dispatch = useAppDispatch()
  const { isWidgetOpen } = useAppSelector((state) => state.chat)
  const user = useAppSelector((state) => state.auth.user)
  
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      conversationId: 'widget-conversation',
      senderId: 'staff',
      senderName: 'Nhân viên hỗ trợ',
      content: 'Xin chào! Chào mừng bạn đến với EV Center, chúng tôi có thể giúp gì cho bạn',
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: true
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleToggleWidget = () => {
    dispatch(toggleWidget())
  }

  const handleClose = () => {
    dispatch(closeWidget())
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        conversationId: 'widget-conversation',
        senderId: String(user?.userId || 'current-user'),
        senderName: user?.fullName || 'Bạn',
        content: message.trim(),
        timestamp: new Date().toISOString(),
        type: 'text',
        isRead: true
      }

      setMessages(prev => [...prev, newMessage])
      setMessage('')

      // Simulate staff response after 2 seconds
      setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => {
          const staffResponse: ChatMessage = {
            id: `staff-${Date.now()}`,
            conversationId: 'widget-conversation',
            senderId: 'staff',
            senderName: 'Nhân viên hỗ trợ',
            content: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
            timestamp: new Date().toISOString(),
            type: 'text',
            isRead: true
          }
          setMessages(prev => [...prev, staffResponse])
          setIsTyping(false)
        }, 1500)
      }, 2000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Get staff avatar icon (Headphones for customer support)
  const getStaffIcon = () => {
    return <Headphones size={16} />
  }

  const positionClasses = {
    'bottom-right': 'chat-widget--bottom-right',
    'bottom-left': 'chat-widget--bottom-left',
    'top-right': 'chat-widget--top-right',
    'top-left': 'chat-widget--top-left'
  }

  const themeClasses = {
    light: 'chat-widget--light',
    dark: 'chat-widget--dark'
  }

  return (
    <div className={`chat-widget ${positionClasses[position]} ${themeClasses[theme]} ${className}`}>
      {/* Chat Icon Button */}
      {!isWidgetOpen && (
        <button
          className="chat-widget__toggle"
          onClick={handleToggleWidget}
          aria-label="Open chat"
          title="Mở chat với nhân viên"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isWidgetOpen && (
        <div className="chat-widget__window">
          {/* Window Header */}
          <div className="chat-widget__header">
            <div className="chat-widget__header-left">
              <div className="chat-widget__avatar">
                <MessageCircle size={20} />
              </div>
              <div className="chat-widget__title">
                <span className="chat-widget__title-text">Hỗ trợ khách hàng</span>
                <span className="chat-widget__subtitle">
                  <span className="chat-widget__online-indicator"></span>
                  Trực tuyến
                </span>
              </div>
            </div>
            <div className="chat-widget__header-right">
              <button
                className="chat-widget__header-btn chat-widget__header-btn--close"
                onClick={handleClose}
                aria-label="Close chat"
                title="Đóng chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="chat-widget__content">
              {/* Messages */}
              <div className="chat-widget__messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-widget__message ${
                      msg.senderId === (user?.userId || 'current-user') 
                        ? 'chat-widget__message--own' 
                        : 'chat-widget__message--other'
                    }`}
                  >
                    {msg.senderId !== (user?.userId || 'current-user') && (
                      <div className="chat-widget__message-avatar">
                        <div className="chat-widget__message-avatar-icon">
                          {getStaffIcon()}
                        </div>
                      </div>
                    )}
                    
                    <div className="chat-widget__message-content">
                      <div className="chat-widget__message-bubble">
                        {msg.content}
                      </div>
                      <div className="chat-widget__message-time">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="chat-widget__typing">
                    <div className="chat-widget__typing-avatar">
                      <div className="chat-widget__typing-avatar-icon">
                        {getStaffIcon()}
                      </div>
                    </div>
                    <div className="chat-widget__typing-content">
                      <div className="chat-widget__typing-bubble">
                        <div className="chat-widget__typing-dots">
                          {/* Only 2 dots - removed third dot */}
                          <span key="dot1"></span>
                          <span key="dot2"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="chat-widget__quick-actions">
                <button className="chat-widget__quick-btn">
                  FAQ
                </button>
                <button className="chat-widget__quick-btn">
                  Dịch vụ
                </button>
              </div>

              {/* Message Input */}
              <div className="chat-widget__input-container">
                <button
                  className="chat-widget__attach-btn"
                  aria-label="Đính kèm file"
                  title="Đính kèm file"
                >
                  <Paperclip size={20} />
                </button>
                
                <div className="chat-widget__input-wrapper">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    className="chat-widget__input"
                    rows={1}
                    maxLength={1000}
                  />
                </div>
                
                <button
                  className="chat-widget__send-btn"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  aria-label="Gửi tin nhắn"
                  title="Gửi tin nhắn"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  )
}

export default ChatWidget
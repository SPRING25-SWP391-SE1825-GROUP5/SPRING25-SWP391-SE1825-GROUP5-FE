import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Paperclip, Headphones, Play } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleWidget, openWidget, closeWidget } from '@/store/chatSlice'
import type { ChatMessage } from '@/types/chat'
import ChatService from '@/services/chatService'
import signalRService from '@/services/signalRService'
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [isConversationStarted, setIsConversationStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check for existing conversation when component mounts
  useEffect(() => {
    const checkExistingConversation = async () => {
      const savedConversationId = localStorage.getItem('currentConversationId')
      if (savedConversationId && savedConversationId !== 'null') {
        setConversationId(parseInt(savedConversationId))
        setIsConversationStarted(true)
        
        // Join SignalR conversation group
        try {
          await signalRService.joinConversation(savedConversationId)
        } catch (error) {
          console.error('Error joining SignalR conversation:', error)
        }
        
        // Load existing messages
        try {
          const response = await ChatService.getConversationMessages(parseInt(savedConversationId))
          if (response.success && response.data) {
            const formattedMessages = response.data.map((msg: any) => ({
              id: String(msg.id),
              conversationId: String(savedConversationId),
              senderId: String(msg.senderUserId || msg.senderGuestSessionId || ''),
              senderName: msg.senderName || 'Nhân viên hỗ trợ',
              content: msg.content,
              timestamp: msg.createdAt,
              type: 'text' as const,
              isRead: true
            }))
            setMessages(formattedMessages)
          }
        } catch (error) {
          console.error('Error loading existing conversation:', error)
        }
      }
    }
    
    checkExistingConversation()
  }, [])

  // Setup SignalR event handlers for real-time messages
  useEffect(() => {
    // Handle new messages from staff
    signalRService.setOnMessageReceived((message: ChatMessage) => {
      console.log('Customer received new message:', message)
      
      // If message is for current conversation, add it to messages
      if (conversationId && message.conversationId === String(conversationId)) {
        setMessages(prev => [...prev, message])
      }
    })

    // Handle typing indicators
    signalRService.setOnTypingStarted((userId: string, conversationId: string) => {
      if (conversationId && String(conversationId) === conversationId) {
        setIsTyping(true)
      }
    })

    signalRService.setOnTypingStopped((userId: string, conversationId: string) => {
      if (conversationId && String(conversationId) === conversationId) {
        setIsTyping(false)
      }
    })

    return () => {
      // Cleanup event handlers
      signalRService.setOnMessageReceived(undefined)
      signalRService.setOnTypingStarted(undefined)
      signalRService.setOnTypingStopped(undefined)
    }
  }, [conversationId])

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

  const handleToggleWidget = async () => {
    dispatch(toggleWidget())
    
    // If opening widget and we have a conversation, load messages
    if (!isWidgetOpen && conversationId && conversationId > 0) {
      try {
        const response = await ChatService.getConversationMessages(conversationId)
        if (response.success && response.data) {
          const formattedMessages = response.data.map((msg: any) => ({
            id: String(msg.id),
            conversationId: String(conversationId),
            senderId: String(msg.senderUserId || msg.senderGuestSessionId || ''),
            senderName: msg.senderName || 'Nhân viên hỗ trợ',
            content: msg.content,
            timestamp: msg.createdAt,
            type: 'text' as const,
            isRead: true
          }))
          setMessages(formattedMessages)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }
  }

  const handleClose = () => {
    // Don't reset conversation state when closing, just close the widget
    // This allows users to continue their conversation when reopening
    dispatch(closeWidget())
  }

  const handleStartNewConversation = () => {
    // Reset everything for a new conversation
    setIsConversationStarted(false)
    setConversationId(null)
    setMessages([])
    setMessage('')
    setIsTyping(false)
    localStorage.removeItem('currentConversationId')
  }

  const handleStartConversation = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // Store user info for API calls
      if (user?.userId) {
        localStorage.setItem('userId', String(user.userId))
      } else {
        // Generate guest session ID if not logged in
        const guestSessionId = localStorage.getItem('guestSessionId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('guestSessionId', guestSessionId)
      }
      
      const response = await ChatService.getOrCreateSupportConversation()
      console.log('Conversation response:', response)
      
      if (response.success) {
        const newConversationId = response.data.conversationId || response.data.id
        setConversationId(newConversationId)
        setIsConversationStarted(true)
        
        // Save conversation ID to localStorage
        localStorage.setItem('currentConversationId', String(newConversationId))
        
        // Join SignalR conversation group
        try {
          await signalRService.joinConversation(String(newConversationId))
        } catch (error) {
          console.error('Error joining SignalR conversation:', error)
        }
        
        // Load existing messages if any
        if (response.data.messages && response.data.messages.length > 0) {
          const formattedMessages = response.data.messages.map((msg: any) => ({
            id: String(msg.id),
            conversationId: String(response.data.conversationId || response.data.id),
            senderId: String(msg.senderUserId || msg.senderGuestSessionId || ''),
            senderName: msg.senderName || 'Nhân viên hỗ trợ',
            content: msg.content,
            timestamp: msg.createdAt,
            type: 'text' as const,
            isRead: true
          }))
          setMessages(formattedMessages)
        } else {
          // Add welcome message
          const welcomeMessage: ChatMessage = {
            id: 'welcome-1',
            conversationId: String(response.data.conversationId || response.data.id),
            senderId: 'staff',
            senderName: 'Nhân viên hỗ trợ',
            content: 'Xin chào! Chào mừng bạn đến với EV Center, chúng tôi có thể giúp gì cho bạn?',
            timestamp: new Date().toISOString(),
            type: 'text',
            isRead: true
          }
          setMessages([welcomeMessage])
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      // Fallback to local conversation
      setIsConversationStarted(true)
      setConversationId(0) // Use 0 as fallback
      const welcomeMessage: ChatMessage = {
        id: 'welcome-1',
        conversationId: '0',
        senderId: 'staff',
        senderName: 'Nhân viên hỗ trợ',
        content: 'Xin chào! Chào mừng bạn đến với EV Center, chúng tôi có thể giúp gì cho bạn?',
        timestamp: new Date().toISOString(),
        type: 'text',
        isRead: true
      }
      setMessages([welcomeMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !isConversationStarted) return

    console.log('Sending message - conversationId:', conversationId, 'isConversationStarted:', isConversationStarted)

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      conversationId: String(conversationId || '0'),
      senderId: String(user?.userId || 'current-user'),
      senderName: user?.fullName || 'Bạn',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: true
    }

    setMessages(prev => [...prev, userMessage])
    const messageContent = message.trim()
    setMessage('')

    try {
      if (conversationId && conversationId > 0) {
        console.log('Attempting to send message to conversation:', conversationId)
        
        // Send via SignalR for real-time delivery
        try {
          await signalRService.sendMessage(String(conversationId), messageContent)
        } catch (signalRError) {
          console.warn('SignalR send failed, continuing with API only:', signalRError)
        }
        
        // Save to database via API
        const response = await ChatService.sendMessageToConversation(conversationId, messageContent)
        console.log('Message sent successfully via API:', response)
      } else {
        console.error('Invalid conversationId:', conversationId)
        throw new Error('Invalid conversation ID')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        conversationId: String(conversationId || '0'),
        senderId: 'system',
        senderName: 'Hệ thống',
        content: 'Không thể gửi tin nhắn. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
        type: 'text',
        isRead: true
      }
      setMessages(prev => [...prev, errorMessage])
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
              {isConversationStarted && (
                <button
                  className="chat-widget__header-btn"
                  onClick={handleStartNewConversation}
                  aria-label="Start new conversation"
                  title="Bắt đầu cuộc trò chuyện mới"
                >
                  <MessageCircle size={16} />
                </button>
              )}
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
            {!isConversationStarted ? (
              /* Start Conversation Screen */
              <div className="chat-widget__start-screen">
                <div className="chat-widget__start-content">
                  <div className="chat-widget__start-icon">
                    <MessageCircle size={48} />
                  </div>
                  <h3 className="chat-widget__start-title">Chào mừng đến với EV Center</h3>
                  <p className="chat-widget__start-description">
                    Chúng tôi sẵn sàng hỗ trợ bạn 24/7. Nhấn "Bắt đầu" để kết nối với nhân viên hỗ trợ.
                  </p>
                  <button
                    className="chat-widget__start-btn"
                    onClick={handleStartConversation}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="chat-widget__loading-spinner"></div>
                        Đang kết nối...
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        Bắt đầu
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="chat-widget__messages">
                  {messages.map((msg, index) => {
                    // Debug: log message info
                    console.log('Customer Chat - Message:', {
                      id: msg.id,
                      senderId: msg.senderId,
                      senderName: msg.senderName,
                      content: msg.content,
                      userUserId: user?.userId,
                      currentUserId: String(user?.userId || 'current-user')
                    })
                    
                    // Determine if this is user's own message
                    // For customer messages, check if senderId matches user ID or if it's a guest session
                    const currentUserId = user?.userId ? String(user.userId) : 'current-user'
                    const isOwnMessage = msg.senderId === currentUserId || 
                                       msg.senderId === 'current-user' ||
                                       (msg.senderId && msg.senderId.includes('user-')) ||
                                       msg.senderName === (user?.fullName || 'Bạn') ||
                                       msg.senderName === 'Bạn' ||
                                       msg.senderId === String(user?.userId || '')
                    
                    return (
                    <div
                      key={msg.id || `msg-${index}`}
                      className={`chat-widget__message ${
                        isOwnMessage 
                          ? 'chat-widget__message--own' 
                          : 'chat-widget__message--other'
                      }`}
                    >
                      {!isOwnMessage && (
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
                    )
                  })}
                  
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatWidget
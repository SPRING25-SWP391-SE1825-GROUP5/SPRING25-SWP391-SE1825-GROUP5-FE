import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Paperclip, Users, Bell, User } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import type { ChatMessage, ChatConversation } from '@/types/chat'
import ChatService from '@/services/chatService'
import signalRService from '@/services/signalRService'
import { NotificationService } from '@/services/notificationService'
import { DEFAULT_VALUES } from '@/constants/appConstants'
import './StaffChatInterface.scss'

interface StaffChatInterfaceProps {
  className?: string
}

const StaffChatInterface: React.FC<StaffChatInterfaceProps> = ({
  className = ''
}) => {
  const user = useAppSelector((state) => state.auth.user)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
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

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Setup SignalR event handlers
  useEffect(() => {
    // Handle new messages
    signalRService.setOnMessageReceived((message: ChatMessage) => {
      
      // If message is for current conversation, add it to messages
      if (selectedConversation && message.conversationId === selectedConversation.id) {
        setMessages(prev => [...prev, message])
      }
      
      // Update conversations list to show new message
      setConversations(prev => prev.map(conv => {
        if (conv.id === message.conversationId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount: conv.unreadCount + 1
          }
        }
        return conv
      }))
      
      // Update unread count
      setUnreadCount(prev => prev + 1)
      
      // Show notification if message is not from current user
      const isFromCurrentUser = message.senderId === String(user?.userId || 'staff')
      if (!isFromCurrentUser) {
        NotificationService.showMessageNotification(
          message.senderName,
          message.content,
          message.conversationId
        )
        NotificationService.playNotificationSound()
      }
    })

    // Handle typing indicators
    signalRService.setOnTypingStarted((userId: string, conversationId: string) => {
      if (selectedConversation && conversationId === selectedConversation.id) {
        setIsTyping(true)
      }
    })

    signalRService.setOnTypingStopped((userId: string, conversationId: string) => {
      if (selectedConversation && conversationId === selectedConversation.id) {
        setIsTyping(false)
      }
    })

    return () => {
      // Cleanup event handlers
      signalRService.setOnMessageReceived(undefined)
      signalRService.setOnTypingStarted(undefined)
      signalRService.setOnTypingStopped(undefined)
    }
  }, [selectedConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      
      // Debug: Test staff endpoint first
      try {
        await ChatService.testStaffEndpoint()
      } catch (debugError) {
        // Debug endpoint failed
      }
      
      const response = await ChatService.getConversations()
      setConversations(response)
      
      // Calculate unread count
      const totalUnread = response.reduce((sum, conv) => sum + conv.unreadCount, 0)
      setUnreadCount(totalUnread)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectConversation = async (conversation: ChatConversation) => {
    console.log('Selecting conversation:', conversation)
    
    // Leave previous conversation if any
    if (selectedConversation) {
      try {
        await signalRService.leaveConversation(selectedConversation.id)
      } catch (error) {
        console.error('Error leaving conversation:', error)
      }
    }

    setSelectedConversation(conversation)
    setMessages([]) // Clear previous messages
    
    try {
      // Join new conversation SignalR group
      await signalRService.joinConversation(conversation.id)
      
      // Load messages
      console.log('Loading messages for conversation ID:', conversation.id)
      const response = await ChatService.getConversationMessages(parseInt(conversation.id))
      console.log('Messages API response:', response)
      console.log('Response success:', response.success)
      console.log('Response data:', response.data)
      console.log('Is array:', Array.isArray(response.data))
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const formattedMessages = response.data.map((msg: any) => {
          console.log('Processing message:', msg)
          
          // Simple logic: if senderUserId exists, it's a customer, otherwise it's staff
          const isCustomer = msg.senderUserId || msg.senderGuestSessionId
          const senderName = isCustomer ? 
            (msg.senderName || 'Khách hàng') : 
            (msg.senderName || 'Nhân viên hỗ trợ')
          
          console.log('Message sender info:', { 
            senderUserId: msg.senderUserId, 
            senderGuestSessionId: msg.senderGuestSessionId,
            senderName: msg.senderName,
            isCustomer,
            finalSenderName: senderName
          })
          
          return {
            id: String(msg.id),
            conversationId: String(conversation.id),
            senderId: String(msg.senderUserId || msg.senderGuestSessionId || ''),
            senderName: senderName,
            content: msg.content,
            timestamp: msg.createdAt,
            type: 'text' as const,
            isRead: true
          }
        })
        console.log('Formatted messages:', formattedMessages)
        setMessages(formattedMessages)
      } else {
        console.log('No messages found or invalid response format')
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return

    const userMessage: ChatMessage = {
      id: `staff-${Date.now()}`,
      conversationId: String(selectedConversation.id),
      senderId: String(user?.userId || 'staff'),
      senderName: user?.fullName || 'Staff',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: true
    }

    setMessages(prev => [...prev, userMessage])
    const messageContent = message.trim()
    setMessage('')

    try {
      console.log('Staff sending message to conversation:', selectedConversation.id, 'Content:', messageContent)
      
      // Send via SignalR for real-time delivery
      try {
        await signalRService.sendMessage(selectedConversation.id, messageContent)
      } catch (signalRError) {
        console.warn('SignalR send failed, continuing with API only:', signalRError)
      }
      
      // Also save to database via API
      const response = await ChatService.sendMessageToConversation(parseInt(selectedConversation.id), messageContent)
      console.log('Staff message sent successfully via API:', response)
    } catch (error) {
      console.error('Error sending message:', error)
      console.error('Error details:', error.response?.data || error.message)
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        conversationId: String(selectedConversation.id),
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

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getConversationTitle = (conversation: ChatConversation) => {
    const customer = conversation.participants.find(p => p.role === 'customer')
    return customer?.name || 'Khách hàng'
  }

  const getLastMessagePreview = (conversation: ChatConversation) => {
    if (!conversation.lastMessage) return 'Chưa có tin nhắn'
    return conversation.lastMessage.content.length > 50 
      ? conversation.lastMessage.content.substring(0, 50) + '...'
      : conversation.lastMessage.content
  }

  return (
    <div className={`staff-chat-interface ${className}`}>
      <div className="staff-chat-interface__container">
        {/* Header */}
        <div className="staff-chat-interface__header">
          <div className="staff-chat-interface__header-left">
            <div className="staff-chat-interface__avatar">
              <User size={20} />
            </div>
            <div className="staff-chat-interface__title">
              <span className="staff-chat-interface__title-text">Staff Chat</span>
              <span className="staff-chat-interface__subtitle">
                {user?.fullName || DEFAULT_VALUES.STAFF_MEMBER}
              </span>
            </div>
          </div>
          <div className="staff-chat-interface__header-right">
            {unreadCount > 0 && (
              <div className="staff-chat-interface__notification">
                <Bell size={16} />
                <span className="staff-chat-interface__notification-count">{unreadCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="staff-chat-interface__content">
          {/* Conversations List */}
          <div className="staff-chat-interface__conversations">
            <div className="staff-chat-interface__conversations-header">
              <h3>Cuộc trò chuyện</h3>
              <span className="staff-chat-interface__conversations-count">
                {conversations.length} cuộc trò chuyện
              </span>
            </div>
            
            <div className="staff-chat-interface__conversations-list">
              {isLoading ? (
                <div className="staff-chat-interface__loading">
                  <div className="staff-chat-interface__loading-spinner"></div>
                  Đang tải...
                </div>
              ) : conversations.length === 0 ? (
                <div className="staff-chat-interface__empty">
                  <MessageCircle size={48} />
                  <p>Chưa có cuộc trò chuyện nào</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`staff-chat-interface__conversation-item ${
                      selectedConversation?.id === conversation.id ? 'active' : ''
                    }`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="staff-chat-interface__conversation-avatar">
                      <Users size={16} />
                    </div>
                    <div className="staff-chat-interface__conversation-content">
                      <div className="staff-chat-interface__conversation-title">
                        {getConversationTitle(conversation)}
                        {conversation.unreadCount > 0 && (
                          <span className="staff-chat-interface__unread-badge">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="staff-chat-interface__conversation-preview">
                        {getLastMessagePreview(conversation)}
                      </div>
                      <div className="staff-chat-interface__conversation-time">
                        {conversation.lastMessage && formatTime(conversation.lastMessage.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="staff-chat-interface__chat-area">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="staff-chat-interface__chat-header">
                  <div className="staff-chat-interface__chat-header-left">
                    <div className="staff-chat-interface__chat-avatar">
                      <Users size={20} />
                    </div>
                    <div className="staff-chat-interface__chat-info">
                      <div className="staff-chat-interface__chat-title">
                        {getConversationTitle(selectedConversation)}
                      </div>
                      <div className="staff-chat-interface__chat-subtitle">
                        Cuộc trò chuyện với khách hàng
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="staff-chat-interface__messages">
                  {(() => {
                    console.log('Rendering messages:', messages)
                    return null
                  })()}
                  {messages.length === 0 ? (
                    <div className="staff-chat-interface__no-messages">
                      <p>Chưa có tin nhắn nào trong cuộc trò chuyện này</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                    // Simple logic: if message has senderUserId or senderGuestSessionId, it's from customer
                    const isStaffMessage = !msg.senderId || 
                                         msg.senderId === String(user?.userId || 'staff') || 
                                         msg.senderName === (user?.fullName || 'Staff') ||
                                         msg.senderName === 'Nhân viên hỗ trợ'
                    
                    console.log('Message:', msg, 'isStaffMessage:', isStaffMessage, 'user:', user)
                    
                    return (
                      <div
                        key={msg.id || `msg-${index}`}
                        className={`staff-chat-interface__message ${
                          isStaffMessage ? 'staff-chat-interface__message--own' : 'staff-chat-interface__message--other'
                        }`}
                      >
                        {!isStaffMessage && (
                          <div className="staff-chat-interface__message-avatar">
                            <div className="staff-chat-interface__message-avatar-icon">
                              <Users size={16} />
                            </div>
                          </div>
                        )}
                        
                        <div className="staff-chat-interface__message-content">
                          {!isStaffMessage && (
                            <div className="staff-chat-interface__message-sender">
                              {msg.senderName}
                            </div>
                          )}
                          <div className="staff-chat-interface__message-bubble">
                            {msg.content}
                          </div>
                          <div className="staff-chat-interface__message-time">
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    )
                  }))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="staff-chat-interface__typing">
                      <div className="staff-chat-interface__typing-avatar">
                        <div className="staff-chat-interface__typing-avatar-icon">
                          <Users size={16} />
                        </div>
                      </div>
                      <div className="staff-chat-interface__typing-content">
                        <div className="staff-chat-interface__typing-bubble">
                          <div className="staff-chat-interface__typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="staff-chat-interface__input-container">
                  <button
                    className="staff-chat-interface__attach-btn"
                    aria-label="Đính kèm file"
                    title="Đính kèm file"
                  >
                    <Paperclip size={20} />
                  </button>
                  
                  <div className="staff-chat-interface__input-wrapper">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn..."
                      className="staff-chat-interface__input"
                      rows={1}
                      maxLength={1000}
                    />
                  </div>
                  
                  <button
                    className="staff-chat-interface__send-btn"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    aria-label="Gửi tin nhắn"
                    title="Gửi tin nhắn"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="staff-chat-interface__no-conversation">
                <MessageCircle size={64} />
                <h3>Chọn một cuộc trò chuyện</h3>
                <p>Chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu chat với khách hàng</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffChatInterface

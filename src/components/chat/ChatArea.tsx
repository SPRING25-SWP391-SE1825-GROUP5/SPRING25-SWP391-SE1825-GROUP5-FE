import React, { useState, useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { addMessage } from '@/store/chatSlice'
import { Send, Phone, Video, Info, Smile, Paperclip, Image, FileText } from 'lucide-react'
import { ChatService } from '@/services/chatService'
import type { ChatConversation, ChatMessage, ChatUser } from '@/types/chat'
import './ChatArea.scss'

interface ChatAreaProps {
  conversation: ChatConversation | null
  currentUser: ChatUser
  onInfoClick: () => void
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentUser,
  onInfoClick
}) => {
  const dispatch = useAppDispatch()
  const { messages } = useAppSelector((state) => state.chat)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get messages for current conversation
  const conversationMessages = conversation ? (messages[conversation.id] || []) : []

  useEffect(() => {
    scrollToBottom()
  }, [conversationMessages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newMessage])

  // Messages are now loaded from Redux state, no need for separate loading

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!conversation || !newMessage.trim() || sending) return

    try {
      setSending(true)
      const message = await ChatService.sendMessage({ conversationId: conversation.id, content: newMessage.trim() })
      dispatch(addMessage({ conversationId: conversation.id, message }))
      setNewMessage('')
      
      // Mark as read
      await ChatService.markAsRead(conversation.id, [message.id])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && conversation) {
      // Handle file upload
      console.log('Files to upload:', files)
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDateSeparator = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
    
    if (messageDate.getTime() === todayDate.getTime()) {
      return 'Hôm nay'
    } else if (messageDate.getTime() === yesterdayDate.getTime()) {
      return 'Hôm qua'
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }

  const shouldShowDateSeparator = (currentMessage: ChatMessage, previousMessage: ChatMessage | null) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.timestamp)
    const previousDate = new Date(previousMessage.timestamp)
    
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    const previousDateOnly = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate())
    
    return currentDateOnly.getTime() !== previousDateOnly.getTime()
  }

  const getOtherParticipant = () => {
    if (!conversation) return null
    return conversation.participants.find(p => p.id !== currentUser.id)
  }

  const renderMessage = (message: ChatMessage, index: number) => {
    // Logic đúng: tin nhắn của currentUser (người gửi) bên phải, người khác bên trái
    // Đảm bảo so sánh string với string
    const isCurrentUser = String(message.senderId) === String(currentUser.id)
    const isLink = message.type === 'link' && message.content.includes('http')
    const senderDisplayName = message.senderName || (isCurrentUser ? currentUser.name : getOtherParticipant()?.name || 'Người dùng')
    
    // Logic: tin nhắn có senderId '1' (user) hiển thị bên phải, còn lại bên trái
    const isUserMessage = message.senderId === '1'

    return (
      <div key={message.id} className={`message ${isUserMessage ? 'message--sent' : 'message--received'}`}>
        <div className="message-content">
          <div className="message-sender">{senderDisplayName}</div>
          {isLink && message.content.includes('youtube.com') ? (
            <div className="link-preview">
              <div className="link-content">
                <div className="video-thumbnail">
                  <div className="play-button">▶</div>
                </div>
                <div className="link-info">
                  <h4>4K VIDEO ultrahd hdr sony 4K VIDEOS</h4>
                  <p>YouTube</p>
                </div>
              </div>
              <a href={message.content} target="_blank" rel="noopener noreferrer">
                {message.content}
              </a>
            </div>
          ) : (
            <p>{message.content}</p>
          )}
          <span className="message-time">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="chat-area">
        <div className="chat-area__empty">
          <div className="empty-state">
            <h3 style={{ color: '#ffffff' }}>Chọn một cuộc trò chuyện</h3>
          </div>
        </div>
      </div>
    )
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className="chat-area">
      <div className="chat-area__header">
        <div className="participant-info">
          <img 
            src={otherParticipant?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmM2Y0ZjYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5Ljc5MDg2IDE0IDggMTUuNzkwOSA4IDE4VjIwSDE2VjE4QzE2IDE1Ljc5MDkgMTQuMjA5MSAxNCAxMiAxNFoiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+Cjwvc3ZnPgo='} 
            alt={otherParticipant?.name}
            className="participant-avatar"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmM2Y0ZjYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5Ljc5MDg2IDE0IDggMTUuNzkwOSA4IDE4VjIwSDE2VjE4QzE2IDE1Ljc5MDkgMTQuMjA5MSAxNCAxMiAxNFoiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+Cjwvc3ZnPgo='
            }}
          />
          <div className="participant-details">
            <h3>{otherParticipant?.name}</h3>
            <div className="participant-info">
              <span className="participant-role">
                {otherParticipant?.role === 'technician' ? 'Kỹ thuật viên' : 
                 otherParticipant?.role === 'staff' ? 'Nhân viên' : 
                 otherParticipant?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
              </span>
              <span className="participant-status">
                {otherParticipant?.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="chat-actions">
          <button className="action-btn" title="Gọi điện">
            <Phone size={20} />
          </button>
          <button className="action-btn" title="Gọi video">
            <Video size={20} />
          </button>
          <button className="action-btn" onClick={onInfoClick} title="Thông tin">
            <Info size={20} />
          </button>
        </div>
      </div>

      <div className="chat-area__messages">
        {loading ? (
          <div className="loading-messages">
            <div className="loading-skeleton">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="message-skeleton">
                  <div className="avatar-skeleton"></div>
                  <div className="content-skeleton"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-container">
            {conversationMessages.map((message, index) => {
              const previousMessage = index > 0 ? conversationMessages[index - 1] : null
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
              
              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="date-separator">
                      <span className="date-separator__text">
                        --- {formatDateSeparator(message.timestamp)} ---
                      </span>
                    </div>
                  )}
                  {renderMessage(message, index)}
                </React.Fragment>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="chat-area__input">
        <div className="input-container">
          <button 
            className="attachment-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Đính kèm file"
          >
            <Paperclip size={20} />
          </button>
          
          <div className="message-input">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              rows={1}
              disabled={sending}
            />
          </div>
          
          <button 
            className="emoji-btn"
            title="Biểu tượng cảm xúc"
          >
            <Smile size={20} />
          </button>
          
          <button 
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            title="Gửi tin nhắn"
          >
            <Send size={20} />
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

export default ChatArea

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { addMessage } from '@/store/chatSlice'
import { Send, Phone, Video, Info, Smile, Paperclip } from 'lucide-react'
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
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const conversationMessages = useMemo(() => {
    return conversation ? (messages[conversation.id] || []) : []
  }, [conversation, messages])

  useEffect(() => {
    scrollToBottom()
  }, [conversationMessages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!conversation || !newMessage.trim() || sending) return

    try {
      setSending(true)
      const message = await ChatService.sendMessage({ conversationId: conversation.id, content: newMessage.trim() })
      const currentUserId = currentUser?.id?.toString() || localStorage.getItem('userId') || 'guest'
      dispatch(addMessage({ conversationId: conversation.id, message, currentUserId }))
      setNewMessage('')
      await ChatService.markAsRead(conversation.id)
    } catch {
      // Error handling
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
      // File upload handling
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

  const renderMessage = (message: ChatMessage) => {
    const isCurrentUser = String(message.senderId) === String(currentUser.id)
    const isLink = message.type === 'link' && message.content.includes('http')
    const senderDisplayName = message.senderName || (isCurrentUser ? currentUser.name : getOtherParticipant()?.name || 'Người dùng')
    const isUserMessage = isCurrentUser

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
                  <h4>Video YouTube</h4>
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
          <div className="participant-avatar-wrapper">
            {otherParticipant?.avatar ? (
          <img
                src={otherParticipant.avatar}
            alt={otherParticipant?.name}
            className="participant-avatar"
            onError={(e) => {
              const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const placeholder = target.parentElement?.querySelector('.participant-avatar-placeholder') as HTMLElement
                  if (placeholder) {
                    placeholder.style.display = 'flex'
                  }
                }}
              />
            ) : null}
            <div
              className="participant-avatar-placeholder"
              style={{ display: otherParticipant?.avatar ? 'none' : 'flex' }}
            >
              {otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
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
                  {renderMessage(message)}
                </React.Fragment>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
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

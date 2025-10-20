import React from 'react'
import { ArrowLeft, Plus, MoreVertical, Phone, Video } from 'lucide-react'
import type { ChatConversation } from '@/types/chat'
import './ChatHeader.scss'

interface ChatHeaderProps {
  conversation?: ChatConversation
  onBack: () => void
  onNewConversation: () => void
  className?: string
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onBack,
  onNewConversation,
  className = ''
}) => {
  const getConversationTitle = () => {
    if (!conversation) return 'Chọn cuộc trò chuyện'
    
    if (conversation.participants.length === 2) {
      // Direct message - show other participant's name
      const otherParticipant = conversation.participants.find(p => p.id !== 'current-user')
      return otherParticipant?.name || 'Cuộc trò chuyện'
    } else {
      // Group chat - show group name or participant count
      return `Nhóm ${conversation.participants.length} người`
    }
  }

  const getConversationSubtitle = () => {
    if (!conversation) return ''
    
    const onlineCount = conversation.participants.filter(p => p.isOnline).length
    if (onlineCount > 0) {
      return `${onlineCount} người đang hoạt động`
    }
    return 'Tất cả đang offline'
  }

  const getConversationAvatar = () => {
    if (!conversation) return null
    
    if (conversation.participants.length === 2) {
      // Direct message - show other participant's avatar
      const otherParticipant = conversation.participants.find(p => p.id !== 'current-user')
      return otherParticipant?.avatar
    } else {
      // Group chat - show first participant's avatar or default
      return conversation.participants[0]?.avatar
    }
  }

  return (
    <div className={`chat-header ${className}`}>
      <div className="chat-header__left">
        <button
          className="chat-header__back-btn"
          onClick={onBack}
          aria-label="Quay lại danh sách cuộc trò chuyện"
          title="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="chat-header__info">
          <div className="chat-header__avatar">
            {getConversationAvatar() ? (
              <img 
                src={getConversationAvatar()} 
                alt="Avatar" 
                className="chat-header__avatar-img"
              />
            ) : (
              <div className="chat-header__avatar-placeholder">
                {getConversationTitle().charAt(0).toUpperCase()}
              </div>
            )}
            {conversation && conversation.participants.some(p => p.isOnline) && (
              <div className="chat-header__online-indicator"></div>
            )}
          </div>

          <div className="chat-header__details">
            <h3 className="chat-header__title">{getConversationTitle()}</h3>
            <p className="chat-header__subtitle">{getConversationSubtitle()}</p>
          </div>
        </div>
      </div>

      <div className="chat-header__right">
        {conversation && (
          <>
            <button
              className="chat-header__action-btn"
              aria-label="Gọi điện"
              title="Gọi điện"
            >
              <Phone size={18} />
            </button>
            <button
              className="chat-header__action-btn"
              aria-label="Gọi video"
              title="Gọi video"
            >
              <Video size={18} />
            </button>
          </>
        )}
        
        <button
          className="chat-header__action-btn"
          onClick={onNewConversation}
          aria-label="Cuộc trò chuyện mới"
          title="Cuộc trò chuyện mới"
        >
          <Plus size={18} />
        </button>

        <button
          className="chat-header__action-btn"
          aria-label="Tùy chọn"
          title="Tùy chọn"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader

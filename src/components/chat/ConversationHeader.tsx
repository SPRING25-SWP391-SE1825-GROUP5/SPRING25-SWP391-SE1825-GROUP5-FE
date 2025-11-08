import React from 'react'
import { useLocation } from 'react-router-dom'
import type { ChatConversation } from '@/types/chat'
import './ConversationHeader.scss'

interface ConversationHeaderProps {
  conversation: ChatConversation
  typingUserIds: string[]
  onMinimize?: () => void
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  typingUserIds,
  onMinimize
}) => {
  const location = useLocation()
  const isContactPage = location.pathname === '/contact'
  const currentUserId = localStorage.getItem('userId') || 'guest'
  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId) || conversation.participants[0]
  const displayName = otherParticipant?.name || 'Người dùng'
  const displayEmail = otherParticipant?.email || ''

  return (
    <div className="conversation-header">
      <div className="conversation-header__info">
        <div className="conversation-header__avatar">
          {otherParticipant?.avatar ? (
            <img
              src={otherParticipant.avatar}
              alt={displayName}
            />
          ) : (
            <div className="conversation-header__avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="conversation-header__details">
          <h3 className="conversation-header__name">{displayName}</h3>
          {displayEmail && (
            <p className="conversation-header__email">{displayEmail}</p>
          )}
          {typingUserIds.length > 0 && (
            <div className="conversation-header__typing">
              <span className="conversation-header__typing-text">Đang gõ</span>
              <div className="conversation-header__typing-dots">
                <span className="conversation-header__typing-dot"></span>
                <span className="conversation-header__typing-dot"></span>
                <span className="conversation-header__typing-dot"></span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Bỏ icon thu nhỏ ở trang contact */}
    </div>
  )
}

export default ConversationHeader


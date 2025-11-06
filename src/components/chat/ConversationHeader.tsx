import React from 'react'
import type { ChatConversation } from '@/types/chat'
import './ConversationHeader.scss'

interface ConversationHeaderProps {
  conversation: ChatConversation
  typingUserIds: string[]
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  typingUserIds
}) => {
  const currentUserId = localStorage.getItem('userId') || 'guest'
  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId) || conversation.participants[0]
  const displayName = otherParticipant?.name || 'Người dùng'
  const displayEmail = otherParticipant?.email || ''

  return (
    <div className="conversation-header">
      <div className="conversation-header__info">
        <div className="conversation-header__avatar">
          <img
            src={otherParticipant?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
            alt={displayName}
          />
        </div>
        <div className="conversation-header__details">
          <h3 className="conversation-header__name">{displayName}</h3>
          {displayEmail && (
            <p className="conversation-header__email">{displayEmail}</p>
          )}
          {typingUserIds.length > 0 && (
            <p className="conversation-header__typing">Đang gõ...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConversationHeader


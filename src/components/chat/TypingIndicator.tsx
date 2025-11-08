import React from 'react'
import type { ChatConversation } from '@/types/chat'
import './TypingIndicator.scss'

interface TypingIndicatorProps {
  conversation: ChatConversation
  typingUserIds: string[]
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ conversation, typingUserIds }) => {
  if (typingUserIds.length === 0) {
    return null
  }

  const currentUserId = localStorage.getItem('userId') || 'guest'
  const typingUsers = conversation.participants.filter(p =>
    typingUserIds.includes(p.id) && p.id !== currentUserId
  )

  if (typingUsers.length === 0) {
    return null
  }

  const displayName = typingUsers.length === 1
    ? typingUsers[0].name
    : `${typingUsers.length} người đang gõ`

  return (
    <div className="typing-indicator">
      <div className="typing-indicator__avatar">
        {typingUsers[0]?.avatar ? (
          <img
            src={typingUsers[0].avatar}
            alt={displayName}
          />
        ) : (
          <div className="typing-indicator__avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="typing-indicator__bubble">
        <div className="typing-indicator__dots">
          <span className="typing-indicator__dot"></span>
          <span className="typing-indicator__dot"></span>
          <span className="typing-indicator__dot"></span>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator


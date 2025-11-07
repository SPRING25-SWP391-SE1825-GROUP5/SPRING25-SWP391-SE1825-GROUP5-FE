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
        <img
          src={typingUsers[0]?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
          alt={displayName}
        />
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


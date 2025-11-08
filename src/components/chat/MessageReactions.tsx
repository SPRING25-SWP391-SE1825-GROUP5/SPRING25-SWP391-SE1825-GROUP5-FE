import React from 'react'
import { Smile } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { addReaction } from '@/store/chatSlice'
import type { MessageReaction } from '@/types/chat'
import './MessageReactions.scss'

interface MessageReactionsProps {
  conversationId: string
  messageId: string
  reactions?: MessageReaction[]
  onAddReaction?: (emoji: string) => void
  className?: string
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  conversationId,
  messageId,
  reactions = [],
  onAddReaction,
  className = ''
}) => {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.auth.user)
  const [showPicker, setShowPicker] = React.useState(false)

  const commonEmojis = ['👍', '❤️', '😄', '😮', '😢', '🙏']

  const handleReactionClick = (emoji: string) => {
    const userId = currentUser?.id?.toString() || 'guest'
    dispatch(addReaction({ conversationId, messageId, emoji, userId }))
    if (onAddReaction) {
      onAddReaction(emoji)
    }
    setShowPicker(false)
  }

  const hasUserReacted = (reaction: MessageReaction) => {
    const userId = currentUser?.id?.toString() || 'guest'
    return reaction.userIds.includes(userId)
  }

  return (
    <div className={`message-reactions ${className}`}>
      {reactions.map((reaction, index) => (
        <button
          key={index}
          className={`message-reactions__reaction ${hasUserReacted(reaction) ? 'active' : ''}`}
          onClick={() => handleReactionClick(reaction.emoji)}
          title={`${reaction.count} phản ứng`}
        >
          <span className="message-reactions__emoji">{reaction.emoji}</span>
          <span className="message-reactions__count">{reaction.count}</span>
        </button>
      ))}

      <div className="message-reactions__picker-container">
        <button
          className="message-reactions__add-btn"
          onClick={() => setShowPicker(!showPicker)}
          title="Thêm reaction"
        >
          <Smile size={16} />
        </button>

        {showPicker && (
          <div className="message-reactions__picker">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                className="message-reactions__picker-item"
                onClick={() => handleReactionClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageReactions


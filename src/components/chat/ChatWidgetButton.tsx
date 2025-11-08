import React from 'react'
import { MessageCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { openWidget } from '@/store/chatSlice'
import './ChatWidgetButton.scss'

interface ChatWidgetButtonProps {
  className?: string
}

const ChatWidgetButton: React.FC<ChatWidgetButtonProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch()
  const { isWidgetOpen, isContactMinimized, conversations, activeConversationId } = useAppSelector((state) => state.chat)
  const authUser = useAppSelector((state) => state.auth.user)

  // Don't show button if widget is already open or minimized widget is showing
  if (isWidgetOpen || isContactMinimized) {
    return null
  }

  const selectedConversation = conversations.find(conv => conv.id === activeConversationId)
  const otherParticipant = selectedConversation?.participants.find(
    p => p.id !== (authUser?.id?.toString() || 'guest')
  ) || selectedConversation?.participants[0]

  const handleClick = () => {
    dispatch(openWidget())
  }

  return (
    <button
      className={`chat-widget-button ${className}`}
      onClick={handleClick}
      aria-label="Mở chat"
      title="Mở chat"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        border: '3px solid #FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#FFFFFF',
        zIndex: 99999,
        padding: 0,
        margin: 0,
        outline: 'none',
        boxSizing: 'border-box'
      }}
    >
      <MessageCircle size={24} />
      {selectedConversation && otherParticipant && (
        <div className="chat-widget-button__avatar">
          {otherParticipant.avatar ? (
            <img src={otherParticipant.avatar} alt={otherParticipant.name} />
          ) : (
            <div className="chat-widget-button__avatar-placeholder">
              {otherParticipant.name?.charAt(0).toUpperCase() || 'M'}
            </div>
          )}
        </div>
      )}
    </button>
  )
}

export default ChatWidgetButton

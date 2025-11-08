import React, { useEffect, useState } from 'react'
import { X, MessageCircle } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setActiveConversation, updateUnreadCount } from '@/store/chatSlice'
import type { ChatMessage, ChatConversation } from '@/types/chat'
import './NewMessageNotification.scss'

interface NewMessageNotificationProps {
  onClose?: () => void
}

const NewMessageNotification: React.FC<NewMessageNotificationProps> = ({ onClose }) => {
  const dispatch = useAppDispatch()
  const { conversations, activeConversationId, messages } = useAppSelector((state) => state.chat)
  const authUser = useAppSelector((state) => state.auth.user)
  const [notification, setNotification] = useState<{
    conversation: ChatConversation
    message: ChatMessage
  } | null>(null)

  useEffect(() => {
    // Listen for new messages from other people
    const checkForNewMessages = () => {
      const currentUserId = authUser?.id?.toString() || localStorage.getItem('userId') || 'guest'

      // Find conversations with unread messages from other people
      const conversationsWithUnread = conversations.filter(conv => {
        // Skip if this is the active conversation
        if (conv.id === activeConversationId) return false

        // Check if conversation has unread messages
        if (conv.unreadCount === 0) return false

        // Check if there are messages from other people
        const conversationMessages = messages[conv.id] || []
        const hasUnreadFromOthers = conversationMessages.some(msg => {
          const isFromOthers = String(msg.senderId) !== String(currentUserId)
          return isFromOthers && !msg.isRead
        })

        return hasUnreadFromOthers
      })

      if (conversationsWithUnread.length > 0) {
        // Get the most recent conversation with unread messages
        const mostRecent = conversationsWithUnread.sort((a, b) => {
          const aLastMessage = messages[a.id]?.[messages[a.id].length - 1]
          const bLastMessage = messages[b.id]?.[messages[b.id].length - 1]
          if (!aLastMessage || !bLastMessage) return 0
          return new Date(bLastMessage.timestamp).getTime() - new Date(aLastMessage.timestamp).getTime()
        })[0]

        const conversationMessages = messages[mostRecent.id] || []
        const unreadMessages = conversationMessages.filter(msg => {
          const isFromOthers = String(msg.senderId) !== String(currentUserId)
          return isFromOthers && !msg.isRead
        })

        if (unreadMessages.length > 0) {
          const latestUnreadMessage = unreadMessages[unreadMessages.length - 1]
          setNotification({
            conversation: mostRecent,
            message: latestUnreadMessage
          })
        }
      } else {
        setNotification(null)
      }
    }

    checkForNewMessages()

    // Check periodically for new messages
    const interval = setInterval(checkForNewMessages, 1000)

    return () => clearInterval(interval)
  }, [conversations, activeConversationId, messages, authUser?.id])

  const handleClick = () => {
    if (notification) {
      dispatch(setActiveConversation(notification.conversation.id))
      setNotification(null)
      if (onClose) onClose()
    }
  }

  const handleClose = () => {
    setNotification(null)
    if (onClose) onClose()
  }

  if (!notification) return null

  const otherParticipant = notification.conversation.participants.find(
    p => p.id !== (authUser?.id?.toString() || 'guest')
  ) || notification.conversation.participants[0]

  return (
    <div className="new-message-notification" onClick={handleClick}>
      <div className="new-message-notification__content">
        <div className="new-message-notification__avatar">
          {otherParticipant.avatar ? (
            <img src={otherParticipant.avatar} alt={otherParticipant.name} />
          ) : (
            <div className="new-message-notification__avatar-placeholder">
              {otherParticipant.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="new-message-notification__info">
          <div className="new-message-notification__name">
            {otherParticipant.name || 'Người dùng'}
          </div>
          <div className="new-message-notification__message">
            {notification.message.content || 'Tin nhắn mới'}
          </div>
        </div>
        {notification.conversation.unreadCount > 0 && (
          <div className="new-message-notification__badge">
            {notification.conversation.unreadCount > 99 ? '99+' : notification.conversation.unreadCount}
          </div>
        )}
        <button
          className="new-message-notification__close"
          onClick={(e) => {
            e.stopPropagation()
            handleClose()
          }}
          aria-label="Đóng"
          title="Đóng"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default NewMessageNotification


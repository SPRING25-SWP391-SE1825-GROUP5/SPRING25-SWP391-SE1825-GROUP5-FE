import React, { useMemo, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setContactMinimized, closeWidget } from '@/store/chatSlice'
import MessageList from './MessageList'
import MessageInput, { MessageInputRef } from './MessageInput'
import type { ChatUser } from '@/types/chat'
import '../../views/Contact.scss'

const MinimizedContactWidget: React.FC = () => {
  const dispatch = useAppDispatch()
  const { conversations, activeConversationId, messages, isContactMinimized } = useAppSelector((state) => state.chat)
  const authUser = useAppSelector((state) => state.auth.user)
  const messageInputRef = useRef<MessageInputRef | null>(null)

  const selectedConversation = useMemo(() => {
    return conversations.find(conv => conv.id === activeConversationId) || null
  }, [conversations, activeConversationId])

  const otherParticipant = useMemo(() => {
    if (!selectedConversation) return null
    const currentUserId = authUser?.id?.toString() || localStorage.getItem('userId') || 'guest'
    return selectedConversation.participants.find(p => p.id !== currentUserId) || selectedConversation.participants[0]
  }, [selectedConversation, authUser?.id])

  const currentUser: ChatUser | null = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id?.toString() || '',
        name: authUser.fullName || '',
        avatar: authUser.avatar || undefined,
        role: 'customer',
        isOnline: true
      }
    }
    return null
  }, [authUser])

  const conversationMessages = selectedConversation ? (messages[selectedConversation.id] || []) : []

  // Click icon ChevronDown (mũi tên xuống) -> thu về widget button
  const handleHideWidget = () => {
    dispatch(setContactMinimized(false))
    dispatch(closeWidget())
  }

  if (!isContactMinimized) {
    return null
  }

  return (
    <div className="contact-page contact-page--minimized">
      <div className="contact-page__minimized-box">
        <div className="contact-page__minimized-header">
          <div className="contact-page__minimized-header-left">
            {selectedConversation && otherParticipant ? (
              <>
                <div className="contact-page__minimized-avatar">
                  {otherParticipant.avatar ? (
                    <img src={otherParticipant.avatar} alt={otherParticipant.name} />
                  ) : (
                    <div className="contact-page__minimized-avatar-placeholder">
                      {otherParticipant.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="contact-page__minimized-info">
                  <h3 className="contact-page__minimized-name">{otherParticipant.name || 'Người dùng'}</h3>
                </div>
              </>
            ) : (
              <div className="contact-page__minimized-info">
                <h3 className="contact-page__minimized-name">Hỗ trợ khách hàng</h3>
              </div>
            )}
          </div>
          {/* Icon ChevronDown luôn hiển thị bên ngoài header-left */}
          <button
            type="button"
            className="contact-page__minimize-icon-btn"
            aria-label="Thu lại widget"
            onClick={handleHideWidget}
            title="Thu lại widget"
            style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {selectedConversation && (
          <>
            <div className="contact-page__minimized-messages">
              <MessageList
                conversationId={selectedConversation.id}
                messages={conversationMessages}
                currentUser={currentUser}
                conversation={selectedConversation}
                className="contact-page__minimized-message-list"
              />
            </div>
            <div className="contact-page__minimized-input">
              <MessageInput
                ref={messageInputRef}
                conversationId={selectedConversation.id}
                className="contact-page__minimized-message-input"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MinimizedContactWidget

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setConversations, setActiveConversation, setMessages, addMessage } from '@/store/chatSlice'
import { ChatService } from '@/services/chatService'
import signalRService from '@/services/signalRService'
import ConfirmModal from './ConfirmModal'
import MessageInput, { MessageInputRef } from './MessageInput'
import MessageList from './MessageList'
import type { ChatMessage, ChatUser } from '@/types/chat'
import '../../views/Contact.scss'
import './ChatWidget.scss'
import { useLocation } from 'react-router-dom'

interface ChatWidgetProps {
  className?: string
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch()
  const { conversations, activeConversationId, isWidgetOpen, isContactMinimized, messages } = useAppSelector((state) => state.chat)
  const authUser = useAppSelector((state) => state.auth.user)

  const [isConversationStarted, setIsConversationStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<MessageInputRef | null>(null)

  const location = useLocation()
  const isContactPage = location.pathname === '/contact'

  useEffect(() => {
    if (isWidgetOpen && !isContactMinimized) {
      checkExistingConversation()
      setupSignalR()
    }

    return () => {
      if (!isWidgetOpen || isContactMinimized) {
        signalRService.setOnMessageReceived(undefined)
        signalRService.setOnNewConversation(undefined)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWidgetOpen, isContactMinimized])

  useEffect(() => {
    if (isWidgetOpen && !isContactMinimized && activeConversationId) {
      loadMessages(activeConversationId)
      joinConversation(activeConversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWidgetOpen, isContactMinimized, activeConversationId])

  const checkExistingConversation = async () => {
    try {
      const convs = await ChatService.getConversations()
      if (convs.length > 0) {
        dispatch(setConversations(convs))
        dispatch(setActiveConversation(convs[0].id))
        setIsConversationStarted(true)
      }
    } catch {
      // Error handled silently
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await ChatService.getConversationMessages(parseInt(conversationId), 1, 100)
      if (response.success && response.data) {
        const messages = Array.isArray(response.data) ? response.data : response.data.messages || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedMessages = messages.map((msg: any) => ({
          id: String(msg.messageId || msg.id || ''),
          conversationId: conversationId,
          senderId: String(msg.senderUserId || msg.senderId || ''),
          senderName: msg.senderName || '',
          content: msg.content || '',
          timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
          type: msg.type || 'text',
          isRead: msg.isRead || false,
          messageStatus: msg.messageStatus || 'sent',
          attachments: msg.attachments || []
        }))
        dispatch(setMessages({ conversationId, messages: formattedMessages }))
      }
    } catch {
      // Error handled silently
    }
  }

  const setupSignalR = async () => {
    try {
      await signalRService.connect()

      const currentUserId = authUser?.id?.toString() || localStorage.getItem('userId') || 'guest'

      if (currentUserId !== 'guest') {
        await signalRService.joinUserGroup(currentUserId)
      }

      signalRService.setOnMessageReceived((message: ChatMessage) => {
        const currentUserIdForMessage = authUser?.id?.toString() || localStorage.getItem('userId') || 'guest'
        dispatch(addMessage({
          conversationId: message.conversationId,
          message,
          currentUserId: currentUserIdForMessage
        }))
      })

      signalRService.setOnNewConversation(() => {
        checkExistingConversation()
      })
    } catch {
      // Error handled silently
    }
  }

  const joinConversation = async (conversationId: string) => {
    try {
      await signalRService.joinConversation(conversationId)
    } catch {
      // Error handled silently
    }
  }

  const handleStartConversation = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      if (authUser?.id) {
        localStorage.setItem('userId', String(authUser.id))
      } else {
        const guestSessionId = localStorage.getItem('guestSessionId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('guestSessionId', guestSessionId)
      }

      const response = await ChatService.getOrCreateSupportConversation()

      if (response.success && response.data) {
        const newConversationId = response.data.conversationId || response.data.id || response.data.conversationID
        if (newConversationId) {
          const conversationId = String(newConversationId)

          const convs = await ChatService.getConversations()
          dispatch(setConversations(convs))
          dispatch(setActiveConversation(conversationId))
          setIsConversationStarted(true)

          try {
            await signalRService.joinConversation(conversationId)
          } catch {
            // Error handled silently
          }
        }
      }
    } catch {
      setShowErrorModal(true)
    } finally {
      setIsLoading(false)
    }
  }


  const selectedConversation = conversations.find(conv => conv.id === activeConversationId) || null
  const otherParticipant = selectedConversation?.participants.find(p => p.id !== (authUser?.id?.toString() || 'guest')) || selectedConversation?.participants[0]
  const conversationMessages = selectedConversation ? (messages[selectedConversation.id] || []) : []

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

  // Don't render if widget is closed or minimized widget is showing
  if (!isWidgetOpen || isContactMinimized || isContactPage) {
    return null
  }

  // Always show box widget (same design as minimized ProtectedContact)
  return (
    <div className={`contact-page contact-page--minimized ${className}`} ref={widgetRef}>
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
        </div>

          {!isConversationStarted ? (
          <div className="contact-page__minimized-messages" style={{ padding: '20px', textAlign: 'center' }}>
            <p>Chào mừng đến với EV Center</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Chúng tôi sẵn sàng hỗ trợ bạn 24/7
              </p>
              <button
                onClick={handleStartConversation}
                disabled={isLoading}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: '#FFD875',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'wait' : 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
              >
                {isLoading ? 'Đang kết nối...' : 'Bắt đầu'}
              </button>
            </div>
        ) : selectedConversation ? (
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
        ) : null}
      </div>

      <ConfirmModal
        isOpen={showErrorModal}
        title="Lỗi kết nối"
        message="Không thể kết nối. Vui lòng thử lại sau."
        confirmText="Đóng"
        cancelText=""
        onConfirm={() => setShowErrorModal(false)}
        onCancel={() => setShowErrorModal(false)}
        type="info"
      />
    </div>
  )
}

export default ChatWidget

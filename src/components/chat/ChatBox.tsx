import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Play } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setConversations, setActiveConversation, setMessages, addMessage } from '@/store/chatSlice'
import { ChatService } from '@/services/chatService'
import signalRService from '@/services/signalRService'
import ConversationSidebar from './ConversationSidebar'
import ConversationDetail from './ConversationDetail'
import type { ChatMessage } from '@/types/chat'
import './ChatBox.scss'

interface ChatBoxProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const ChatBox: React.FC<ChatBoxProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const dispatch = useAppDispatch()
  const { conversations, activeConversationId } = useAppSelector((state) => state.chat)
  const authUser = useAppSelector((state) => state.auth.user)

  const [isConversationStarted, setIsConversationStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const chatBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      checkExistingConversation()
      setupSignalR()
    }

    return () => {
      if (!isOpen) {
        signalRService.disconnect()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (isOpen && activeConversationId) {
      loadMessages(activeConversationId)
      joinConversation(activeConversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeConversationId])

  const checkExistingConversation = async () => {
    try {
      const convs = await ChatService.getConversations()
      if (convs.length > 0) {
        dispatch(setConversations(convs))
        dispatch(setActiveConversation(convs[0].id))
        setIsConversationStarted(true)
      }
    } catch (error) {

    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await ChatService.getConversationMessages(parseInt(conversationId), 1, 100)
      if (response.success && response.data) {
        const messages = Array.isArray(response.data) ? response.data : response.data.messages || []
        const formattedMessages = messages.map((msg: any) => ({
          id: String(msg.messageId || msg.id || ''),
          conversationId: conversationId,
          senderId: String(msg.senderUserId || msg.senderId || ''),
          senderName: msg.senderName || 'Người dùng',
          content: msg.content || '',
          timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
          type: msg.type || 'text',
          isRead: msg.isRead || false,
          messageStatus: msg.messageStatus || 'sent',
          attachments: msg.attachments || []
        }))
        dispatch(setMessages({ conversationId, messages: formattedMessages }))
      }
    } catch (error) {

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
        dispatch(addMessage({
          conversationId: message.conversationId,
          message
        }))
      })

      signalRService.setOnNewConversation((data) => {
        checkExistingConversation()
      })
    } catch (error) {

    }
  }

  const joinConversation = async (conversationId: string) => {
    try {
      await signalRService.joinConversation(conversationId)
    } catch (error) {

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
          } catch (error) {

          }
        }
      }
    } catch (error) {

      alert('Không thể kết nối. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedConversation = conversations.find(conv => conv.id === activeConversationId) || null

  if (!isOpen) return null

  return (
    <div className={`chat-box ${className}`} ref={chatBoxRef}>
      <div className="chat-box__overlay" onClick={onClose}></div>
      <div className="chat-box__container">
        {!isConversationStarted ? (
          <div className="chat-box__welcome">
            <div className="chat-box__welcome-header">
              <div className="chat-box__welcome-header-left">
                <div className="chat-box__welcome-icon-wrapper">
                  <MessageCircle size={20} className="chat-box__welcome-icon" />
                </div>
                <div className="chat-box__welcome-header-info">
                  <span className="chat-box__welcome-header-title">Hỗ trợ khách hàng</span>
                  <span className="chat-box__welcome-header-status">
                    <span className="chat-box__status-dot online"></span>
                    Trực tuyến
                  </span>
                </div>
              </div>
              <button
                className="chat-box__close-btn"
                onClick={onClose}
                aria-label="Close chat"
                title="Đóng chat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="chat-box__welcome-content">
              <div className="chat-box__welcome-icon-large">
                <MessageCircle size={64} />
              </div>
              <h2 className="chat-box__welcome-title">
                Chào mừng đến với<br />EV Center
              </h2>
              <p className="chat-box__welcome-description">
                Chúng tôi sẵn sàng hỗ trợ bạn 24/7. Nhấn "Bắt đầu" để kết nối với nhân viên hỗ trợ.
              </p>
              <button
                className="chat-box__start-btn"
                onClick={handleStartConversation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="chat-box__spinner"></div>
                    Đang kết nối...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Bắt đầu
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-box__layout">
            <ConversationSidebar onCreateNewChat={handleStartConversation} />
            <ConversationDetail conversation={selectedConversation} />
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatBox


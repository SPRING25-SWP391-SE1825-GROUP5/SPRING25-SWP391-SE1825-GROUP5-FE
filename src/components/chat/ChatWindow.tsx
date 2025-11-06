import React, { useState, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setActiveConversation, addMessage, setMessages, setConversations } from '@/store/chatSlice'
import { ChatService } from '@/services/chatService'
import ConversationList from './ConversationList'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import './ChatWindow.scss'

interface ChatWindowProps {
  className?: string
}

const ChatWindow: React.FC<ChatWindowProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch()
  const { 
    activeConversationId, 
    conversations, 
    messages, 
    currentUserId 
  } = useAppSelector((state) => ({
    activeConversationId: state.chat.activeConversationId,
    conversations: state.chat.conversations,
    messages: state.chat.messages,
    currentUserId: String(state.auth.user?.userId || '')
  }))

  const [showConversationList, setShowConversationList] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
    }
  }, [activeConversationId])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages, activeConversationId])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const response = await ChatService.getConversations()
      dispatch(setConversations(response))
    } catch (err: any) {
      setError('Không thể tải danh sách cuộc trò chuyện')

    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoading(true)
      const response = await ChatService.getMessages(conversationId)
      dispatch(setMessages({ conversationId, messages: response }))
    } catch (err: any) {
      setError('Không thể tải tin nhắn')

    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    dispatch(setActiveConversation(conversationId))
    setShowConversationList(false)
  }

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!activeConversationId || !content.trim()) return

    try {
      const messageData = {
        conversationId: activeConversationId,
        content: content.trim(),
        type
      }

      const newMessage = await ChatService.sendMessage(messageData)
      dispatch(addMessage({ conversationId: activeConversationId, message: newMessage }))
    } catch (err: any) {
      setError('Không thể gửi tin nhắn')

    }
  }

  const handleNewConversation = () => {
    setShowConversationList(true)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : []
  const currentConversation = conversations.find(conv => conv.id === activeConversationId)

  return (
    <div className={`chat-window ${className}`}>
      {error && (
        <div className="chat-window__error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showConversationList ? (
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onClose={() => setShowConversationList(false)}
        />
      ) : (
        <>
          <ChatHeader
            conversation={currentConversation}
            onBack={() => setShowConversationList(true)}
            onNewConversation={handleNewConversation}
          />

          <div className="chat-window__messages">
            {isLoading && currentMessages.length === 0 ? (
              <div className="chat-window__loading">
                <div className="loading-spinner"></div>
                <span>Đang tải tin nhắn...</span>
              </div>
            ) : (
              <>
                <MessageList
                  messages={currentMessages}
                  currentUserId={currentUserId}
                />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={!activeConversationId || isLoading}
            placeholder={activeConversationId ? "Nhập tin nhắn..." : "Chọn cuộc trò chuyện để bắt đầu"}
          />
        </>
      )}
    </div>
  )
}

export default ChatWindow

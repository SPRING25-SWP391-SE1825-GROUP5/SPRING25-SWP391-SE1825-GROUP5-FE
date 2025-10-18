import React, { useState, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'
import type { ChatConversation, ChatUser } from '@/types/chat'
import { ChatService } from '@/services/chatService'
import { useAppDispatch } from '@/store/hooks'
import { addConversation, setActiveConversation } from '@/store/chatSlice'
import './ConversationList.scss'

interface ConversationListProps {
  conversations: ChatConversation[]
  activeConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
  onClose: () => void
  className?: string
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onClose,
  className = ''
}) => {
  const dispatch = useAppDispatch()
  const [searchTerm, setSearchTerm] = useState('')
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([])
  const [showUserList, setShowUserList] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load available users for new conversation
  useEffect(() => {
    if (showUserList) {
      loadAvailableUsers()
    }
  }, [showUserList])

  const loadAvailableUsers = async () => {
    try {
      setIsLoading(true)
      const response = await ChatService.getAvailableUsers()
      setAvailableUsers(response.users)
    } catch (error) {
      console.error('Error loading available users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartConversation = async (userId: string) => {
    try {
      const conversation = await ChatService.getOrCreateConversation(userId)
      dispatch(addConversation(conversation))
      dispatch(setActiveConversation(conversation.id))
      onSelectConversation(conversation.id)
      setShowUserList(false)
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return conv.participants.some(p => 
      p.name.toLowerCase().includes(searchLower)
    ) || (conv.lastMessage?.content.toLowerCase().includes(searchLower))
  })

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('vi-VN', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const getConversationTitle = (conversation: ChatConversation) => {
    if (conversation.participants.length === 2) {
      const otherParticipant = conversation.participants.find(p => p.id !== 'current-user')
      return otherParticipant?.name || 'Cuộc trò chuyện'
    } else {
      return `Nhóm ${conversation.participants.length} người`
    }
  }

  const getConversationAvatar = (conversation: ChatConversation) => {
    if (conversation.participants.length === 2) {
      const otherParticipant = conversation.participants.find(p => p.id !== 'current-user')
      return otherParticipant?.avatar
    } else {
      return conversation.participants[0]?.avatar
    }
  }

  return (
    <div className={`conversation-list ${className}`}>
      {/* Header */}
      <div className="conversation-list__header">
        <div className="conversation-list__header-left">
          <h3 className="conversation-list__title">Cuộc trò chuyện</h3>
        </div>
        <div className="conversation-list__header-right">
          <button
            className="conversation-list__new-btn"
            onClick={() => setShowUserList(true)}
            aria-label="Cuộc trò chuyện mới"
            title="Cuộc trò chuyện mới"
          >
            <Plus size={18} />
          </button>
          <button
            className="conversation-list__close-btn"
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="conversation-list__search">
        <div className="conversation-list__search-input-wrapper">
          <Search size={16} className="conversation-list__search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="conversation-list__search-input"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="conversation-list__content">
        {filteredConversations.length === 0 ? (
          <div className="conversation-list__empty">
            <div className="conversation-list__empty-icon">
              <Search size={32} />
            </div>
            <p className="conversation-list__empty-text">
              {searchTerm ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
            </p>
            {!searchTerm && (
              <button
                className="conversation-list__empty-btn"
                onClick={() => setShowUserList(true)}
              >
                Bắt đầu cuộc trò chuyện
              </button>
            )}
          </div>
        ) : (
          <div className="conversation-list__items">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  activeConversationId === conversation.id ? 'conversation-item--active' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="conversation-item__avatar">
                  {getConversationAvatar(conversation) ? (
                    <img 
                      src={getConversationAvatar(conversation)} 
                      alt="Avatar" 
                      className="conversation-item__avatar-img"
                    />
                  ) : (
                    <div className="conversation-item__avatar-placeholder">
                      {getConversationTitle(conversation).charAt(0).toUpperCase()}
                    </div>
                  )}
                  {conversation.participants.some(p => p.isOnline) && (
                    <div className="conversation-item__online-indicator"></div>
                  )}
                </div>

                <div className="conversation-item__content">
                  <div className="conversation-item__header">
                    <h4 className="conversation-item__title">
                      {getConversationTitle(conversation)}
                    </h4>
                    {conversation.lastMessage && (
                      <span className="conversation-item__time">
                        {formatLastMessageTime(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>

                  <div className="conversation-item__footer">
                    <p className="conversation-item__preview">
                      {conversation.lastMessage?.content || 'Chưa có tin nhắn nào'}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="conversation-item__badge">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User List Modal */}
      {showUserList && (
        <div className="conversation-list__user-modal">
          <div className="conversation-list__user-modal-content">
            <div className="conversation-list__user-modal-header">
              <h3>Chọn người để trò chuyện</h3>
              <button
                className="conversation-list__user-modal-close"
                onClick={() => setShowUserList(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="conversation-list__user-modal-body">
              {isLoading ? (
                <div className="conversation-list__user-modal-loading">
                  <div className="loading-spinner"></div>
                  <span>Đang tải...</span>
                </div>
              ) : (
                <div className="conversation-list__user-list">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="conversation-list__user-item"
                      onClick={() => handleStartConversation(user.id)}
                    >
                      <div className="conversation-list__user-avatar">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="conversation-list__user-avatar-img"
                          />
                        ) : (
                          <div className="conversation-list__user-avatar-placeholder">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {user.isOnline && (
                          <div className="conversation-list__user-online-indicator"></div>
                        )}
                      </div>
                      <div className="conversation-list__user-info">
                        <h4 className="conversation-list__user-name">{user.name}</h4>
                        <p className="conversation-list__user-role">{user.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationList

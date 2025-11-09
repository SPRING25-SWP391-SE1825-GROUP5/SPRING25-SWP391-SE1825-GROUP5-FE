import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAppSelector } from '@/store/hooks'
import { Search, Plus, Pin, Archive, MoreVertical } from 'lucide-react'
import { ChatService } from '@/services/chatService'
import type { ChatConversation } from '@/types/chat'
import './ChatList.scss'

interface ChatListProps {
  selectedConversationId?: string
  onConversationSelect: (conversation: ChatConversation) => void
  onCreateNewChat: () => void
}

const ChatList: React.FC<ChatListProps> = ({
  selectedConversationId,
  onConversationSelect,
  onCreateNewChat
}) => {
  const { conversations, isLoading } = useAppSelector((state) => state.chat)
  const currentUser = useAppSelector((state) => state.auth.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([])
  const [loadingAvatars, setLoadingAvatars] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    setFilteredConversations(conversations)
  }, [conversations])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const filtered = conversations.filter(conv =>
        conv.participants.some(p =>
          p.name.toLowerCase().includes(query.toLowerCase())
        ) ||
        conv.lastMessage?.content.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(conversations)
    }
  }, [conversations])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
    }
  }, [conversations, searchQuery])

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('vi-VN', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      })
    }
  }, [])

  const authUser = useAppSelector((state) => state.auth.user)

  const getParticipantName = useCallback((conversation: ChatConversation) => {
    const currentId = authUser ? String(authUser.id ?? authUser.userId ?? '') : undefined
    const otherParticipant = conversation.participants.find(p => p.id !== currentId) || conversation.participants.find(p => p.role !== 'customer')
    return otherParticipant?.name || conversation.participants[0]?.name || 'Người dùng'
  }, [authUser?.id, authUser?.userId])

  const getParticipantAvatar = useCallback((conversation: ChatConversation) => {
    const currentId = authUser ? String(authUser.id ?? authUser.userId ?? '') : undefined
    const otherParticipant = conversation.participants.find(p => p.id !== currentId) || conversation.participants.find(p => p.role !== 'customer')
    return otherParticipant?.avatar || null
  }, [authUser?.id, authUser?.userId])

  const getParticipantRole = useCallback((conversation: ChatConversation) => {
    const currentId = authUser ? String(authUser.id ?? authUser.userId ?? '') : undefined
    const otherParticipant = conversation.participants.find(p => p.id !== currentId) || conversation.participants.find(p => p.role !== 'customer')
    return otherParticipant?.role || 'customer'
  }, [authUser?.id, authUser?.userId])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'technician': return '#f97316' // Màu cam cho kỹ thuật viên
      case 'staff': return '#3B82F6' // Màu xanh dương cho nhân viên
      case 'admin': return '#27AE60' // Màu xanh lá đậm AutoEV cho admin
      default: return '#6b7280' // Màu xám mặc định
    }
  }

  const getRoleLabel = useCallback((role: string) => {
    switch (role) {
      case 'customer': return 'Khách hàng'
      case 'technician': return 'Kỹ thuật viên'
      case 'staff': return 'Nhân viên'
      case 'admin': return 'Quản trị viên'
      default: return 'Khách hàng'
    }
  }, [])

  const handleImageLoad = useCallback((conversationId: string) => {
    setLoadingAvatars(prev => {
      const newSet = new Set(prev)
      newSet.delete(conversationId)
      return newSet
    })
  }, [])

  const handleImageError = useCallback((conversationId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.style.display = 'none'
    const placeholder = target.parentElement?.querySelector('.conversation-avatar-placeholder') as HTMLElement
    if (placeholder) {
      placeholder.style.display = 'flex'
    }
    setAvatarErrors(prev => new Set(prev).add(conversationId))
    setLoadingAvatars(prev => {
      const newSet = new Set(prev)
      newSet.delete(conversationId)
      return newSet
    })
  }, [avatarErrors])

  const handleImageLoadStart = useCallback((conversationId: string) => {
    setLoadingAvatars(prev => new Set(prev).add(conversationId))
  }, [])

  const toggleSearch = useCallback(() => {
    setIsSearching(prev => {
      const newValue = !prev
      if (newValue) {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 100)
      } else {
        setSearchQuery('')
        setFilteredConversations(conversations)
      }
      return newValue
    })
  }, [conversations])

  const groupedConversations = useMemo(() => {
    const grouped = new Map<string, ChatConversation>()

    filteredConversations.forEach((conversation) => {
      const otherParticipant = conversation.participants.find(p => p.role !== 'customer')
      if (otherParticipant) {
        const participantId = otherParticipant.id
        const existing = grouped.get(participantId)

        if (!existing || new Date(conversation.updatedAt) > new Date(existing.updatedAt)) {
          grouped.set(participantId, conversation)
        }
      }
    })

    return Array.from(grouped.values()).sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [filteredConversations])

  const conversationsList = useMemo(() => {
    return groupedConversations.map((conversation) => {
      const participantName = getParticipantName(conversation)
      const participantAvatar = getParticipantAvatar(conversation)
      const participantRole = getParticipantRole(conversation)
      const roleColor = getRoleColor(participantRole)
      const roleLabel = getRoleLabel(participantRole)
      const lastMessageTime = conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ''

      return {
        ...conversation,
        participantName,
        participantAvatar,
        participantRole,
        roleColor,
        roleLabel,
        lastMessageTime
      }
    })
  }, [groupedConversations, getParticipantName, getParticipantAvatar, getParticipantRole, getRoleLabel, formatTime])

  if (isLoading) {
    return (
      <div className="chat-list">
        <div className="chat-list__header">
          <h2>Chats</h2>
          <div className="header-actions">
            <button className="search-toggle-btn" onClick={toggleSearch}>
              <Search size={20} />
            </button>
            <button className="new-chat-btn" onClick={onCreateNewChat}>
              <Plus size={20} />
            </button>
          </div>
        </div>
        {isSearching && (
          <div className="chat-list__search">
            <div className="search-input">
              <Search size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="chat-list__loading">
          <div className="loading-skeleton">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="conversation-skeleton">
                <div className="avatar-skeleton"></div>
                <div className="content-skeleton">
                  <div className="name-skeleton"></div>
                  <div className="message-skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-list">
      <div className="chat-list__header">
        <h2>Chats</h2>
        <div className="header-actions">
          <button className="search-toggle-btn" onClick={toggleSearch}>
            <Search size={20} />
          </button>
          <button className="new-chat-btn" onClick={onCreateNewChat}>
            <Plus size={20} />
          </button>
        </div>
      </div>

      {isSearching && (
        <div className="chat-list__search">
          <div className="search-input">
            <Search size={16} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="chat-list__content">
        {conversationsList.length === 0 ? (
          <div className="empty-state">
            <p>{searchQuery ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}</p>
            <button onClick={onCreateNewChat} className="start-chat-btn">
              Bắt đầu trò chuyện
            </button>
          </div>
        ) : (
          <div className="conversations">
            {conversationsList.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  selectedConversationId === conversation.id ? 'active' : ''
                }`}
                onClick={() => onConversationSelect(conversation)}
              >
                <div className={`conversation-avatar ${loadingAvatars.has(conversation.id) ? 'loading' : ''}`}>
                  {conversation.participantAvatar ? (
                    <img
                      src={conversation.participantAvatar}
                      alt={conversation.participantName}
                      loading="lazy"
                      onLoad={() => handleImageLoad(conversation.id)}
                      onError={(e) => handleImageError(conversation.id, e)}
                      style={{
                        opacity: loadingAvatars.has(conversation.id) ? 0 : 1,
                        animation: loadingAvatars.has(conversation.id) ? 'none' : 'fadeIn 0.3s ease'
                      }}
                    />
                  ) : null}
                  <div
                    className="conversation-avatar-placeholder"
                    style={{ display: conversation.participantAvatar ? 'none' : 'flex' }}
                  >
                    {conversation.participantName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div
                    className="role-indicator"
                    style={{ backgroundColor: conversation.roleColor }}
                  >
                    {conversation.roleLabel.charAt(0)}
                  </div>
                </div>

                <div className="conversation-content">
                  <div className="conversation-header">
                    <h3 className="conversation-name">
                      {conversation.participantName}
                    </h3>
                    <div className="conversation-meta">
                      {conversation.isPinned && (
                        <Pin size={12} className="pin-icon" />
                      )}
                      <span className="conversation-time">
                        {conversation.lastMessageTime}
                      </span>
                    </div>
                  </div>

                  <div className="conversation-preview">
                    <p className="last-message">
                      {conversation.lastMessage?.content || 'Chưa có tin nhắn'}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <div className={`unread-badge ${conversation.unreadCount === 1 ? 'dot' : ''}`}>
                        {conversation.unreadCount === 1 ? '' : (conversation.unreadCount > 99 ? '99+' : conversation.unreadCount)}
                      </div>
                    )}
                  </div>

                  <div className="conversation-actions">
                    <span
                      className="participant-role"
                      style={{ backgroundColor: conversation.roleColor }}
                    >
                      {conversation.roleLabel}
                    </span>
                    <button
                      className="more-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatList

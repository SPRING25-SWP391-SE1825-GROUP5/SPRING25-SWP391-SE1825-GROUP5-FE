import React, { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setActiveConversation } from '@/store/chatSlice'
import ConversationSearch from './ConversationSearch'
import ConversationFilters from './ConversationFilters'
import ConversationItem from './ConversationItem'
import type { ChatConversation } from '@/types/chat'
import './ConversationSidebar.scss'

interface ConversationSidebarProps {
  onCreateNewChat?: () => void
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({ onCreateNewChat }) => {
  const dispatch = useAppDispatch()
  const { conversations, activeConversationId, activeFilter, searchQuery } = useAppSelector((state) => state.chat)

  const filteredConversations = useMemo(() => {
    let filtered = [...conversations]

    // Apply filter
    if (activeFilter === 'unread') {
      filtered = filtered.filter(conv => conv.unreadCount > 0)
    } else if (activeFilter === 'pinned') {
      filtered = filtered.filter(conv => conv.isPinned)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(conv => {
        const participantNames = conv.participants.map(p => p.name.toLowerCase()).join(' ')
        const lastMessageContent = conv.lastMessage?.content.toLowerCase() || ''
        return participantNames.includes(query) || lastMessageContent.includes(query)
      })
    }

    // Sort: pinned first, then by updatedAt
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return filtered
  }, [conversations, activeFilter, searchQuery])

  const handleConversationSelect = (conversation: ChatConversation) => {
    dispatch(setActiveConversation(conversation.id))
  }

  return (
    <div className="conversation-sidebar">
      <div className="conversation-sidebar__header">
        <div className="conversation-sidebar__header-top">
          <ConversationSearch />
          {onCreateNewChat && (
            <button
              className="conversation-sidebar__new-chat-btn"
              onClick={onCreateNewChat}
              title="Tạo cuộc trò chuyện mới"
              aria-label="Tạo cuộc trò chuyện mới"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="conversation-sidebar__filters">
        <ConversationFilters />
      </div>

      <div className="conversation-sidebar__list">
        {filteredConversations.length === 0 ? (
          <div className="conversation-sidebar__empty">
            <p>Không có cuộc trò chuyện nào</p>
            {onCreateNewChat && (
              <button
                className="conversation-sidebar__start-chat-btn"
                onClick={onCreateNewChat}
              >
                <Plus size={18} />
                Bắt đầu cuộc trò chuyện
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === activeConversationId}
              onSelect={handleConversationSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ConversationSidebar


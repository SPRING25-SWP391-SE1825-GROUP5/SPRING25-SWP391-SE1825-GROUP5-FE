import React, { useState } from 'react'
import { Pin, MoreVertical } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { pinConversation, archiveConversation, removeConversation } from '@/store/chatSlice'
import ConversationItemActions from './ConversationItemActions'
import ConfirmModal from './ConfirmModal'
import { formatConversationTime } from '@/utils/timeFormatter'
import { ChatService } from '@/services/chatService'
import toast from 'react-hot-toast'
import type { ChatConversation } from '@/types/chat'
import './ConversationItem.scss'

interface ConversationItemProps {
  conversation: ChatConversation
  isSelected: boolean
  onSelect: (conversation: ChatConversation) => void
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect
}) => {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.auth.user)
  const currentUserId = currentUser?.id?.toString() || localStorage.getItem('userId') || 'guest'
  const [showActions, setShowActions] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId) || conversation.participants[0]
  const displayName = otherParticipant?.name || 'Người dùng'
  const displayAvatar = otherParticipant?.avatar || undefined

  const handleClick = () => {
    onSelect(conversation)
  }

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(pinConversation(conversation.id))
  }

  const handleArchive = () => {
    dispatch(archiveConversation(conversation.id))
    setShowActions(false)
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
    setShowActions(false)
  }

  const confirmDelete = async () => {
    try {
      await ChatService.deleteConversation(conversation.id)
      dispatch(removeConversation(conversation.id))
      toast.success('Đã xóa cuộc trò chuyện thành công')
      setShowDeleteModal(false)
    } catch (error: any) {
      toast.error(error?.message || 'Không thể xóa cuộc trò chuyện')
      setShowDeleteModal(false)
    }
  }

  return (
    <div
      className={`conversation-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="conversation-item__avatar">
        <img src={displayAvatar} alt={displayName} />
        {conversation.isPinned && (
          <div className="conversation-item__pin-badge">
            <Pin size={12} />
          </div>
        )}
      </div>

      <div className="conversation-item__content">
        <div className="conversation-item__header">
          <span className="conversation-item__name">{displayName}</span>
          {conversation.lastMessage && (
            <span className="conversation-item__time">
              {formatConversationTime(conversation.lastMessage.timestamp)}
            </span>
          )}
        </div>

        <div className="conversation-item__footer">
          <span className={`conversation-item__preview ${conversation.unreadCount > 0 ? 'conversation-item__preview--unread' : ''}`}>
            {conversation.lastMessage?.content || 'Không có tin nhắn'}
          </span>
          {conversation.unreadCount > 0 && (
            <span className="conversation-item__unread">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <ConversationItemActions
          onPin={handlePin}
          onArchive={handleArchive}
          onDelete={handleDelete}
          isPinned={conversation.isPinned}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        message="Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        type="delete"
      />
    </div>
  )
}

export default ConversationItem


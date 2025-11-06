import React, { useState } from 'react'
import { Edit, Trash2, Reply, Check, CheckCheck } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateMessage, removeMessage } from '@/store/chatSlice'
import { ChatService } from '@/services/chatService'
import MessageContent from './MessageContent'
import MessageImage from './MessageImage'
import MessageTimestamp from './MessageTimestamp'
import type { ChatMessage } from '@/types/chat'
import './MessageBubble.scss'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showSenderInfo: boolean
  showTimestamp: boolean
  onReply?: (messageId: string) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showSenderInfo,
  showTimestamp,
  onReply,
  onEdit,
  onDelete
}) => {
  const dispatch = useAppDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showActions, setShowActions] = useState(false)

  const handleEdit = async () => {
    if (isEditing) {
      try {
        await ChatService.updateMessage(message.id, editContent)
        dispatch(updateMessage({
          conversationId: message.conversationId,
          messageId: message.id,
          updates: { content: editContent, isEdited: true, editedAt: new Date().toISOString() }
        }))
        setIsEditing(false)
        if (onEdit) {
          onEdit(message.id, editContent)
        }
      } catch (error) {

      }
    } else {
      setIsEditing(true)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
      try {
        await ChatService.deleteMessage(message.id)
        dispatch(removeMessage({
          conversationId: message.conversationId,
          messageId: message.id
        }))
        if (onDelete) {
          onDelete(message.id)
        }
      } catch (error) {

      }
    }
  }

  const handleReply = () => {
    if (onReply) {
      onReply(message.id)
    }
  }

  const getStatusIcon = () => {
    if (!isOwn) return null

    switch (message.messageStatus) {
      case 'sending':
        return <span className="message-bubble__status">...</span>
      case 'sent':
        return <Check size={14} className="message-bubble__status-icon" />
      case 'delivered':
        return <CheckCheck size={14} className="message-bubble__status-icon delivered" />
      case 'read':
        return <CheckCheck size={14} className="message-bubble__status-icon read" />
      default:
        return <Check size={14} className="message-bubble__status-icon" />
    }
  }

  return (
    <div
      className={`message-bubble ${isOwn ? 'message-bubble--own' : 'message-bubble--other'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showSenderInfo && !isOwn && (
        <div className="message-bubble__sender">
          {message.senderName}
        </div>
      )}

      {message.replyToMessage && (
        <div className="message-bubble__reply">
          <Reply size={14} />
          <div className="message-bubble__reply-content">
            <div className="message-bubble__reply-name">{message.replyToMessage.senderName}</div>
            <div className="message-bubble__reply-text">{message.replyToMessage.content}</div>
          </div>
        </div>
      )}

      <div className="message-bubble__content-wrapper">
        {isEditing ? (
          <div className="message-bubble__edit">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="message-bubble__edit-input"
              autoFocus
              onBlur={handleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleEdit()
                }
                if (e.key === 'Escape') {
                  setIsEditing(false)
                  setEditContent(message.content)
                }
              }}
            />
          </div>
        ) : (
          <>
            {message.attachments
              ?.filter((attachment) => attachment.type === 'image')
              .map((attachment) => (
                <MessageImage key={attachment.id} attachment={attachment} />
              ))}

            <MessageContent message={message} />
          </>
        )}

        {message.isEdited && (
          <span className="message-bubble__edited">(đã chỉnh sửa)</span>
        )}
      </div>

      <div className="message-bubble__footer">
        {showTimestamp && (
          <MessageTimestamp timestamp={message.timestamp} />
        )}

        {isOwn && (
          <div className="message-bubble__status">
            {getStatusIcon()}
          </div>
        )}

        {message.isRead && !isOwn && (
          <div className="message-bubble__read-receipt" title="Đã đọc">
            ✓
          </div>
        )}
      </div>

      {showActions && (
        <div className="message-bubble__actions">
          {!isOwn && (
            <button
              className="message-bubble__action-btn"
              onClick={handleReply}
              title="Trả lời"
            >
              <Reply size={16} />
            </button>
          )}

          {isOwn && (
            <>
              <button
                className="message-bubble__action-btn"
                onClick={handleEdit}
                title="Chỉnh sửa"
              >
                <Edit size={16} />
              </button>
              <button
                className="message-bubble__action-btn"
                onClick={handleDelete}
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default MessageBubble


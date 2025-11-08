import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setMessages, markMessagesAsRead, updateUnreadCount } from '@/store/chatSlice'
import { ChatService } from '@/services/chatService'
import ConversationHeader from './ConversationHeader'
import MessageList from './MessageList'
import MessageInput, { MessageInputRef } from './MessageInput'
import type { ChatConversation, ChatUser, ChatMessage } from '@/types/chat'
import { normalizeImageUrl } from '@/utils/imageUrl'
import './ConversationDetail.scss'

interface ConversationDetailProps {
  conversation: ChatConversation | null
  onMinimize?: () => void
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation, onMinimize }) => {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((state) => state.auth.user)
  const { messages, typingUsers } = useAppSelector((state) => state.chat)

  const currentUser: ChatUser | null = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id?.toString() || '',
        name: authUser.fullName || '',
        avatar: authUser.avatar || undefined,
        email: authUser.email,
        role: 'customer',
        isOnline: true
      }
    }
    return null
  }, [authUser])

  const conversationMessages = conversation ? (messages[conversation.id] || []) : []
  const typingUserIds = conversation ? (typingUsers[conversation.id] || []) : []
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null)
  const messageInputRef = useRef<MessageInputRef | null>(null)

  useEffect(() => {
    // Typing users updated
  }, [typingUserIds, conversation?.id, typingUsers, conversationMessages.length])

  useEffect(() => {
    if (conversation) {
      loadMessages(conversation.id)
      // Always mark as read when entering conversation
      markConversationAsRead(conversation.id)
      // Reset unread count immediately when entering conversation
      dispatch(updateUnreadCount({
        conversationId: conversation.id,
        count: 0
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id])

  useEffect(() => {
    if (conversation && conversationMessages.length > 0) {
      const unreadMessageIds = conversationMessages
        .filter(msg => !msg.isRead && String(msg.senderId) !== String(currentUser?.id))
        .map(msg => msg.id)

      if (unreadMessageIds.length > 0) {
        // Mark all unread messages as read
        dispatch(markMessagesAsRead({
          conversationId: conversation.id,
          messageIds: unreadMessageIds
        }))
        // Update unread count to 0
        dispatch(updateUnreadCount({
          conversationId: conversation.id,
          count: 0
        }))
        // Mark conversation as read in backend
        markConversationAsRead(conversation.id)
      } else {
        // Even if no unread messages, ensure unreadCount is 0 when viewing conversation
        dispatch(updateUnreadCount({
          conversationId: conversation.id,
          count: 0
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, conversationMessages.length])

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
          // Parse attachments from Attachments array (preferred) or AttachmentUrl (fallback)
          attachments: (() => {
            // If message has attachments array (camelCase or PascalCase), use it
            const attachmentsArray = msg.attachments || msg.Attachments
            if (attachmentsArray && Array.isArray(attachmentsArray)) {
              return attachmentsArray.map((att: any) => ({
                id: att.id || att.Id || `att-${Date.now()}`,
                type: (att.type || att.Type || 'image') as 'image' | 'file' | 'video',
                url: normalizeImageUrl(att.url || att.Url || ''),
                name: att.name || att.Name || 'attachment',
                size: att.size || att.Size || 0,
                thumbnail: normalizeImageUrl(att.thumbnail || att.Thumbnail || att.url || att.Url || '')
              }))
            }
            // If message has AttachmentUrl, convert to attachments array (backward compatibility)
            if (msg.attachmentUrl || msg.AttachmentUrl) {
              const url = msg.attachmentUrl || msg.AttachmentUrl
              if (url) {
                const normalizedUrl = normalizeImageUrl(url)
                return [{
                  id: `att-${Date.now()}`,
                  type: 'image' as const,
                  url: normalizedUrl,
                  name: url.split('/').pop() || 'image',
                  size: 0,
                  thumbnail: normalizedUrl
                }]
              }
            }
            return []
          })(),
          replyToMessageId: msg.replyToMessageId ? String(msg.replyToMessageId) : undefined,
          replyToMessage: msg.replyToMessage ? {
            id: String(msg.replyToMessage.messageId || msg.replyToMessage.id || msg.replyToMessageId || ''),
            senderName: msg.replyToMessage.senderName || 'Người dùng',
            content: msg.replyToMessage.content || '',
            senderId: String(msg.replyToMessage.senderUserId || msg.replyToMessage.senderId || ''),
            conversationId: String(msg.replyToMessage.conversationId || conversation?.id || ''),
            timestamp: msg.replyToMessage.createdAt || msg.replyToMessage.timestamp || new Date().toISOString(),
            type: 'text' as const,
            isRead: false,
            messageStatus: 'sent' as const,
            attachments: []
          } : undefined,
          reactions: msg.reactions || [],
          isEdited: msg.isEdited || false,
          editedAt: msg.editedAt
        }))
        dispatch(setMessages({ conversationId, messages: formattedMessages }))
      }
    } catch (error) {

    }
  }

  const markConversationAsRead = async (conversationId: string) => {
    try {
      await ChatService.markAsRead(conversationId)
    } catch (error) {

    }
  }

  const handleReply = (messageId: string) => {
    const messageToReply = conversationMessages.find(msg => msg.id === messageId)
    if (messageToReply) {
      setReplyToMessage(messageToReply)
      // Scroll to input and focus
      setTimeout(() => {
        messageInputRef.current?.setReplyTo(messageToReply)
      }, 100)
    } else {
      // If message not found in current list, try to find by ID from all messages
      // This handles cases where message might not be loaded yet
      const allMessages = Object.values(messages).flat()
      const foundMessage = allMessages.find(msg => msg.id === messageId)
      if (foundMessage) {
        setReplyToMessage(foundMessage)
        setTimeout(() => {
          messageInputRef.current?.setReplyTo(foundMessage)
        }, 100)
    }
  }
  }


  const handleEdit = async (messageId: string, content: string) => {
    // MessageBubble already handles the API call, this is just for logging

  }

  const handleDelete = async (messageId: string) => {
    // MessageBubble already handles the API call, this is just for logging

  }

  if (!conversation) {
    return (
      <div className="conversation-detail conversation-detail--empty">
        <div className="conversation-detail__empty-state">
          <p>Chọn một cuộc trò chuyện để bắt đầu</p>
        </div>
      </div>
    )
  }

  return (
    <div className="conversation-detail">
      <ConversationHeader conversation={conversation} typingUserIds={typingUserIds} onMinimize={onMinimize} />
      <MessageList
        conversationId={conversation.id}
        messages={conversationMessages}
        currentUser={currentUser}
        conversation={conversation}
        typingUserIds={typingUserIds}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <MessageInput
        ref={messageInputRef}
        conversationId={conversation.id}
        replyToMessage={replyToMessage}
        onReplyCancel={() => setReplyToMessage(null)}
      />
    </div>
  )
}

export default ConversationDetail


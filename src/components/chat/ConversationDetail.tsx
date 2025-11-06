import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setMessages, markMessagesAsRead } from '@/store/chatSlice'
import { ChatService } from '@/services/chatService'
import ConversationHeader from './ConversationHeader'
import MessageList from './MessageList'
import MessageInput, { MessageInputRef } from './MessageInput'
import type { ChatConversation, ChatUser, ChatMessage } from '@/types/chat'
import './ConversationDetail.scss'

interface ConversationDetailProps {
  conversation: ChatConversation | null
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation }) => {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((state) => state.auth.user)
  const { messages, typingUsers } = useAppSelector((state) => state.chat)

  const currentUser: ChatUser | null = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id?.toString() || '1',
        name: authUser.fullName || 'Nguyễn Văn A',
        avatar: authUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
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
    if (conversation) {
      loadMessages(conversation.id)
      markConversationAsRead(conversation.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id])

  useEffect(() => {
    if (conversation && conversationMessages.length > 0) {
      const unreadMessageIds = conversationMessages
        .filter(msg => !msg.isRead && String(msg.senderId) !== String(currentUser?.id))
        .map(msg => msg.id)

      if (unreadMessageIds.length > 0) {
        dispatch(markMessagesAsRead({
          conversationId: conversation.id,
          messageIds: unreadMessageIds
        }))
        markConversationAsRead(conversation.id)
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
          attachments: msg.attachments || [],
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
      <ConversationHeader conversation={conversation} typingUserIds={typingUserIds} />
      <MessageList
        conversationId={conversation.id}
        messages={conversationMessages}
        currentUser={currentUser}
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


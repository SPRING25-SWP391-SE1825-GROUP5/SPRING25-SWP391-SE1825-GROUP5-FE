import React, { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setConversations, setActiveConversation, setMessages, addMessage, addTypingUser, removeTypingUser, addConversation, removeMessage } from '@/store/chatSlice'
import ConversationLayout from '@/components/chat/ConversationLayout'
import { ChatService } from '@/services/chatService'
import signalRService from '@/services/signalRService'
import type { ChatMessage, ChatConversation } from '@/types/chat'
import { store } from '@/store'
import './Contact.scss'

const ProtectedContact: React.FC = () => {
  const dispatch = useAppDispatch()
  const { conversations, activeConversationId, messages } = useAppSelector((state) => state.chat)
  const authUser = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    loadConversations()
    setupSignalR()

    return () => {
      // Cleanup SignalR on unmount
      signalRService.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
      joinConversation(activeConversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId])

  const loadConversations = async (mergeWithExisting = false) => {
    try {
      const convs = await ChatService.getConversations()

      if (mergeWithExisting && convs.length === 0) {
        // If merging and got empty array, don't overwrite - keep existing
        return
      }

      if (convs.length > 0) {
        if (mergeWithExisting) {
          // Merge: add new ones, update existing ones
          convs.forEach(conv => {
            dispatch(addConversation(conv))
          })
        } else {
          // Replace all
          dispatch(setConversations(convs))
        }

        if (!activeConversationId || !convs.some(c => c.id === activeConversationId)) {
          dispatch(setActiveConversation(convs[0].id))
        }
      } else if (!mergeWithExisting) {
        // Only clear if not merging and explicitly want to replace
        dispatch(setConversations([]))
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
      // Error loading messages
    }
  }

  const setupSignalR = async () => {
    try {
      // Setup event handlers first (before connecting)
      signalRService.setOnMessageReceived((messageData: any) => {
        console.log('[ProtectedContact] SignalR message received', messageData)

        // Get fresh state from store to avoid stale closure
        const currentState = store.getState()
        const currentMessages = currentState.chat.messages
        const currentAuthUser = currentState.auth.user

        // Validate message data
        const messageId = String(messageData.messageId || messageData.MessageId || messageData.id || '')
        const conversationId = String(messageData.conversationId || messageData.ConversationId || '')

        console.log('[ProtectedContact] Parsed message data', { messageId, conversationId })
        console.log('[ProtectedContact] Current messages state', {
          conversationKeys: Object.keys(currentMessages),
          totalConversations: Object.keys(currentMessages).length
        })

        // Skip if message ID or conversation ID is missing
        if (!messageId || !conversationId) {
          console.warn('[ProtectedContact] Skipping message - missing ID or conversationId', { messageId, conversationId })
          return
        }

        // Transform message từ SignalR format (PascalCase) sang ChatMessage format (camelCase)
        const message: ChatMessage = {
          id: messageId,
          conversationId: conversationId,
          senderId: String(messageData.senderUserId || messageData.SenderUserId || messageData.senderId || ''),
          senderName: messageData.senderName || messageData.SenderName || 'Người dùng',
          content: messageData.content || messageData.Content || '',
          timestamp: messageData.createdAt || messageData.CreatedAt || messageData.timestamp || new Date().toISOString(),
          type: (messageData.type || 'text') as 'text' | 'image' | 'file' | 'link',
          isRead: messageData.isRead || false,
          messageStatus: (messageData.messageStatus || 'sent') as 'sending' | 'sent' | 'delivered' | 'read',
          attachments: messageData.attachments || [],
          replyToMessageId: messageData.replyToMessageId || messageData.ReplyToMessageId ? String(messageData.replyToMessageId || messageData.ReplyToMessageId) : undefined,
          // Find replyToMessage from existing messages in store or from messageData
          replyToMessage: (() => {
            const replyToId = messageData.replyToMessageId || messageData.ReplyToMessageId
            if (!replyToId) return undefined

            // First, try to get from messageData (if backend sends it) - this is more reliable
            if (messageData.replyToMessage || messageData.ReplyToMessage) {
              const replyData = messageData.replyToMessage || messageData.ReplyToMessage
              return {
                id: String(replyData.messageId || replyData.id || replyData.MessageId || replyData.Id || replyToId),
                senderName: replyData.senderName || replyData.SenderName || 'Người dùng',
                content: replyData.content || replyData.Content || '',
                senderId: String(replyData.senderUserId || replyData.senderId || replyData.SenderUserId || replyData.SenderId || ''),
                conversationId: String(replyData.conversationId || replyData.ConversationId || conversationId),
                timestamp: replyData.timestamp || replyData.createdAt || replyData.Timestamp || replyData.CreatedAt || new Date().toISOString(),
                type: 'text' as const,
                isRead: false,
                messageStatus: 'sent' as const,
                attachments: []
              }
            }

            // If not in messageData, search in all messages across all conversations
            const allMessages = Object.values(currentMessages).flat()
            const replyToMsg = allMessages.find(msg => msg.id === String(replyToId))

            if (replyToMsg) {
              return {
                id: replyToMsg.id,
                senderName: replyToMsg.senderName,
                content: replyToMsg.content,
                senderId: replyToMsg.senderId,
                conversationId: replyToMsg.conversationId,
                timestamp: replyToMsg.timestamp,
                type: replyToMsg.type,
                isRead: replyToMsg.isRead,
                messageStatus: replyToMsg.messageStatus,
                attachments: replyToMsg.attachments || []
              }
            }

            return undefined
          })()
        }

        // Check if message already exists in store (by ID) to avoid duplicates
        // Check across all conversations to catch duplicates even if conversation not loaded yet
        const allMessages = Object.values(currentMessages).flat()
        const existingMessage = allMessages.find((msg: ChatMessage) => msg.id === message.id)

        console.log('[ProtectedContact] Checking for duplicate', {
          messageId: message.id,
          existingMessage: existingMessage ? { id: existingMessage.id, content: existingMessage.content } : null,
          totalMessages: allMessages.length,
          conversationMessages: currentMessages[message.conversationId]?.length || 0
        })

        if (existingMessage) {
          // Message already exists, skip adding
          console.log('[ProtectedContact] Duplicate message detected, skipping', message.id)
          return
        }

        // Get conversation messages for temp message replacement
        const conversationMessages = currentMessages[message.conversationId] || []
        console.log('[ProtectedContact] Conversation messages count', {
          conversationId: message.conversationId,
          count: conversationMessages.length,
          messageIds: conversationMessages.map(m => m.id).slice(-5) // Last 5 message IDs for debugging
        })

        // Check if this message is from current user to remove temp message BEFORE adding
        const currentUserId = currentAuthUser?.id?.toString() || localStorage.getItem('userId') || 'guest'
        const messageSenderId = String(messageData.senderUserId || messageData.SenderUserId || '')

        // If message is from current user, check for temp message to replace
        if (String(messageSenderId) === String(currentUserId)) {
          console.log('[ProtectedContact] Message from current user, checking for temp message', {
            messageSenderId,
            currentUserId,
            messageContent: message.content
          })

          // Find temp message with same content (sent within last 15 seconds)
          const now = Date.now()
          const tempMessage = conversationMessages.find((msg: ChatMessage) => {
            if (msg.id.startsWith('temp-')) {
              const timeDiff = now - parseInt(msg.id.replace('temp-', ''))
              return timeDiff < 15000 && msg.content === message.content && String(msg.senderId) === String(currentUserId)
            }
            return false
          })

          console.log('[ProtectedContact] Temp message search result', {
            found: !!tempMessage,
            tempMessageId: tempMessage?.id
          })

          // If found temp message, remove it BEFORE adding real message
          if (tempMessage) {
            console.log('[ProtectedContact] Removing temp message', tempMessage.id)
            dispatch(removeMessage({ conversationId: message.conversationId, messageId: tempMessage.id }))
          }
        }

        // Always add message from SignalR (reducer will handle duplicate check by ID)
        console.log('[ProtectedContact] Adding message to store', {
          messageId: message.id,
          conversationId: message.conversationId,
          content: message.content,
          senderId: message.senderId
        })

        dispatch(addMessage({
          conversationId: message.conversationId,
          message
        }))

        console.log('[ProtectedContact] Message added to store successfully')
      })

      signalRService.setOnTypingStarted((userId: string, conversationId: string) => {
        dispatch(addTypingUser({ conversationId, userId }))
      })

      signalRService.setOnTypingStopped((userId: string, conversationId: string) => {
        dispatch(removeTypingUser({ conversationId, userId }))
      })

      signalRService.setOnNewConversation((data) => {
        loadConversations()
      })

      signalRService.setOnCenterReassigned((data) => {
        loadConversations()
      })

      // Try to connect (may fail if backend doesn't have SignalR configured)
      try {
        await signalRService.connect()

        const currentUserId = authUser?.id?.toString() || localStorage.getItem('userId') || 'guest'

        // Join user group for notifications
        if (currentUserId !== 'guest') {
          await signalRService.joinUserGroup(currentUserId)
        }
      } catch (error) {
        // SignalR connection failed - app can still work without realtime features
      }
    } catch (error) {
      // Error setting up SignalR
    }
  }

  const joinConversation = async (conversationId: string) => {
    // Try to join, but don't fail if SignalR is not available
    try {
      await signalRService.joinConversation(conversationId)
    } catch (error) {
      // Silently fail - app can work without SignalR
    }
  }

  const handleCreateNewChat = async () => {
    try {
      // Set userId if user is logged in
      if (authUser?.id) {
        localStorage.setItem('userId', String(authUser.id))
      } else {
        // Create guest session if not exists
        const guestSessionId = localStorage.getItem('guestSessionId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('guestSessionId', guestSessionId)
      }

      const response = await ChatService.getOrCreateSupportConversation()

      if (response.success && response.data) {
        const data = response.data
        const conversationId = String(data.conversationId || data.id || data.conversationID || '')

        // Create conversation object from response
        const newConversation: ChatConversation = {
          id: conversationId,
          participants: data.members?.map((m: any) => ({
            id: String(m.userId || m.guestSessionId || ''),
            name: m.userName || m.userFullName || 'Nhân viên hỗ trợ',
            avatar: m.avatar || undefined,
            role: (m.roleInConversation === 'STAFF' ? 'staff' : 'customer') as 'customer' | 'staff',
            isOnline: true
          })) || [
            {
              id: String(authUser?.id || 'guest'),
              name: authUser?.fullName || 'Bạn',
              avatar: authUser?.avatar,
              role: 'customer' as const,
              isOnline: true
            },
            {
              id: 'staff',
              name: 'Nhân viên hỗ trợ',
              role: 'staff' as const,
              isOnline: true
            }
          ],
          lastMessage: data.lastMessage ? {
            id: String(data.lastMessage.messageId || data.lastMessage.id || ''),
            conversationId: conversationId,
            senderId: String(data.lastMessage.senderUserId || ''),
            senderName: data.lastMessage.senderName || 'Nhân viên hỗ trợ',
            content: data.lastMessage.content || '',
            timestamp: data.lastMessage.createdAt || new Date().toISOString(),
            type: 'text' as const,
            isRead: false
          } : undefined,
          unreadCount: 0,
          isPinned: false,
          isArchived: false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || data.lastMessageAt || new Date().toISOString()
        }

        // Add conversation to Redux state immediately
        dispatch(addConversation(newConversation))

        // Set active conversation
        dispatch(setActiveConversation(conversationId))

        // Join SignalR conversation group
        try {
          await signalRService.joinConversation(conversationId)
        } catch (signalRError) {
          // Error joining SignalR conversation
        }

        // Load messages for the new conversation
        await loadMessages(conversationId)

        // Reload conversations in merge mode to avoid overwriting the new conversation
        // Use merge mode to keep the conversation we just added
        setTimeout(() => {
          loadConversations(true).catch(() => {
            // Error reloading conversations after create
          })
        }, 1000)
      } else {
        alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.')
      }
    } catch (error) {
      alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.')
    }
  }

  return (
    <div className="contact-page contact-page--fullscreen">
      <ConversationLayout onCreateNewChat={handleCreateNewChat} />
    </div>
  )
}

export default ProtectedContact

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { Minimize2, Maximize2, ChevronDown, X } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setConversations, setActiveConversation, setMessages, addMessage, addTypingUser, removeTypingUser, addConversation, removeMessage, setReadReceipt, markMessagesAsRead, setContactMinimized } from '@/store/chatSlice'
import ConversationLayout from '@/components/chat/ConversationLayout'
import NewMessageNotification from '@/components/chat/NewMessageNotification'
import MessageList from '@/components/chat/MessageList'
import MessageInput, { MessageInputRef } from '@/components/chat/MessageInput'
import { ChatService } from '@/services/chatService'
import { CenterService, type Center } from '@/services/centerService'
import signalRService from '@/services/signalRService'
import type { ChatMessage, ChatConversation, ChatUser } from '@/types/chat'
import { normalizeImageUrl } from '@/utils/imageUrl'
import { store } from '@/store'
import './Contact.scss'

const ProtectedContact: React.FC = () => {
  const dispatch = useAppDispatch()
  const { conversations, activeConversationId, messages } = useAppSelector((state) => state.chat)
  const authUser = useAppSelector((state) => state.auth.user)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isWidgetHidden, setIsWidgetHidden] = useState(false)
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [availableStaff, setAvailableStaff] = useState<any[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)

  const selectedConversation = useMemo(() => {
    return conversations.find(conv => conv.id === activeConversationId) || null
  }, [conversations, activeConversationId])

  const otherParticipant = useMemo(() => {
    if (!selectedConversation) return null
    const currentUserId = authUser?.id?.toString() || localStorage.getItem('userId') || 'guest'
    return selectedConversation.participants.find(p => p.id !== currentUserId) || selectedConversation.participants[0]
  }, [selectedConversation, authUser?.id])

  const currentUser: ChatUser | null = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id?.toString() || '',
        name: authUser.fullName || '',
        avatar: authUser.avatar || undefined,
        role: 'customer',
        isOnline: true
      }
    }
    return null
  }, [authUser])

  const conversationMessages = selectedConversation ? (messages[selectedConversation.id] || []) : []
  const messageInputRef = useRef<MessageInputRef | null>(null)

  // Load centers when component mounts
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const response = await CenterService.getActiveCenters()
        setCenters(response.centers || [])
      } catch {
        // Error handled silently
      }
    }
    loadCenters()
  }, [])

  // Load staff when center is selected
  useEffect(() => {
    if (selectedCenterId) {
      const loadStaff = async () => {
        setLoadingStaff(true)
        try {
          const response = await ChatService.getStaffByCenter(selectedCenterId)
          if (response.success && response.data) {
            setAvailableStaff(response.data)
          }
        } catch {
          setAvailableStaff([])
        } finally {
          setLoadingStaff(false)
        }
      }
      loadStaff()
    } else {
      setAvailableStaff([])
      setSelectedStaffId(null)
    }
  }, [selectedCenterId])

  useEffect(() => {
    loadConversations()
    setupSignalR()

    // Auto-load conversation when starting (don't auto-create)
    const initializeConversation = async () => {
      try {
        const convs = await ChatService.getConversations()
        if (convs.length > 0) {
          // If conversation exists, set it as active
          dispatch(setConversations(convs))
          dispatch(setActiveConversation(convs[0].id))
        }
        // If no conversation exists, don't auto-create - let user choose center and staff first
      } catch {
        // Error handled silently
      }
    }

    initializeConversation()

    return () => {
      // Don't disconnect SignalR on unmount - let it stay connected for other components
      // Only cleanup handlers to prevent memory leaks
      signalRService.setOnMessageReceived(undefined)
      signalRService.setOnTypingStarted(undefined)
      signalRService.setOnTypingStopped(undefined)
      signalRService.setOnNewConversation(undefined)
      signalRService.setOnCenterReassigned(undefined)
      signalRService.setOnMessageRead(undefined)
      signalRService.setOnConnectionStatusChanged(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
      joinConversation(activeConversationId)
      // Re-setup SignalR handlers to ensure they're not overridden by other components
      setupSignalR()
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
            conversationId: String(msg.replyToMessage.conversationId || conversationId),
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
      // Error loading messages
    }
  }

  const setupSignalR = async () => {
    try {
      // Setup event handlers first (before connecting)
      signalRService.setOnMessageReceived((messageData: any) => {
        // Get fresh state from store to avoid stale closure
        const currentState = store.getState()
        const currentMessages = currentState.chat.messages
        const currentAuthUser = currentState.auth.user

        // Validate message data
        const messageId = String(messageData.messageId || messageData.MessageId || messageData.id || '')
        const conversationId = String(messageData.conversationId || messageData.ConversationId || '')

        // Skip if message ID or conversation ID is missing
        if (!messageId || !conversationId) {
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
          // Parse attachments from Attachments array (preferred) or AttachmentUrl (fallback)
          attachments: (() => {
            // If backend sends attachments array (camelCase or PascalCase), use it
            const attachmentsArray = messageData.attachments || messageData.Attachments
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
            // If backend sends AttachmentUrl, convert to attachments array (backward compatibility)
            if (messageData.attachmentUrl || messageData.AttachmentUrl) {
              const url = messageData.attachmentUrl || messageData.AttachmentUrl
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

        if (existingMessage) {
          // Message already exists, skip adding
          return
        }

        // Get conversation messages for temp message replacement
        const conversationMessages = currentMessages[message.conversationId] || []

        // Check if this message is from current user to remove temp message BEFORE adding
        const currentUserId = currentAuthUser?.id?.toString() || localStorage.getItem('userId') || 'guest'
        const messageSenderId = String(messageData.senderUserId || messageData.SenderUserId || '')

        // If message is from current user, check for temp message to replace
        if (String(messageSenderId) === String(currentUserId)) {
          // Find temp message with same content (sent within last 15 seconds)
          const now = Date.now()
          const tempMessage = conversationMessages.find((msg: ChatMessage) => {
            if (msg.id.startsWith('temp-')) {
              const timeDiff = now - parseInt(msg.id.replace('temp-', ''))
              return timeDiff < 15000 && msg.content === message.content && String(msg.senderId) === String(currentUserId)
            }
            return false
          })

          // If found temp message, remove it BEFORE adding real message
          if (tempMessage) {
            dispatch(removeMessage({ conversationId: message.conversationId, messageId: tempMessage.id }))
          }
        }

        // Always add message from SignalR (reducer will handle duplicate check by ID)
        // Use currentUserId from above (already declared at line 203)
        dispatch(addMessage({
          conversationId: message.conversationId,
          message,
          currentUserId
        }))
      })

      signalRService.setOnConnectionStatusChanged((isConnected: boolean) => {
        // When reconnected, join active conversation again
        if (isConnected && activeConversationId) {
          joinConversation(activeConversationId)
        }
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

      signalRService.setOnMessageRead((data) => {
        // Update read status in realtime when other users read messages
        const conversationId = String(data.conversationId || '')
        const lastReadAt = data.lastReadAt || new Date().toISOString()

        if (!conversationId) {
          return
        }

        // Get current user ID to check if this read status is from current user
        const currentState = store.getState()
        const currentAuthUser = currentState.auth.user
        const currentUserId = currentAuthUser?.id?.toString() || localStorage.getItem('userId') || 'guest'
        const readUserId = data.userId?.toString() || data.guestSessionId || ''

        // Only update read status if it's from another user (not current user)
        // Current user's read status is already updated when they view the conversation
        if (String(readUserId) !== String(currentUserId)) {
          // Mark all messages before lastReadAt as read for this user
          const conversationMessages = currentState.chat.messages[conversationId] || []
          const messagesToMarkAsRead = conversationMessages.filter((msg: ChatMessage) => {
            // Mark messages that were sent before or at the lastReadAt time
            const messageTime = new Date(msg.timestamp).getTime()
            const readTime = new Date(lastReadAt).getTime()
            return messageTime <= readTime && String(msg.senderId) !== String(readUserId)
          })

          if (messagesToMarkAsRead.length > 0) {
            const messageIds = messagesToMarkAsRead.map(msg => msg.id)
            dispatch(markMessagesAsRead({ conversationId, messageIds }))
          }
        }
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
      // Validate selectedStaffId: Ensure it's from availableStaff list (which only contains STAFF role)
      if (selectedStaffId) {
        const isValidStaff = availableStaff.some(staff => staff.staffId === selectedStaffId)
        if (!isValidStaff) {
          alert('Nhân viên được chọn không hợp lệ. Vui lòng chọn lại.')
          return
        }
      }

      // Set userId if user is logged in
      if (authUser?.id) {
        localStorage.setItem('userId', String(authUser.id))
      } else {
        // Create guest session if not exists
        const guestSessionId = localStorage.getItem('guestSessionId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('guestSessionId', guestSessionId)
      }

      // Try to get user location (optional, backend will fallback to booking if not available)
      let customerLat: number | undefined
      let customerLng: number | undefined
      try {
        const location = await ChatService.getUserLocation()
        if (location) {
          customerLat = location.lat
          customerLng = location.lng
        }
      } catch (locationError) {
        // Location not available, continue without it
      }

      // Always create new conversation (never get existing)
      // Backend will validate that preferredStaffId has STAFF role (not MANAGER)
      // If invalid, backend will auto-assign a STAFF member
      const response = await ChatService.createNewSupportConversation(
        customerLat,
        customerLng,
        selectedCenterId || undefined,
        selectedStaffId || undefined
      )

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

  const handleMinimize = () => {
    // Use requestAnimationFrame to prevent jerky transition
    requestAnimationFrame(() => {
      setIsMinimized(true)
      dispatch(setContactMinimized(true))
    })
  }

  const handleMaximize = () => {
    // Use requestAnimationFrame to prevent jerky transition
    requestAnimationFrame(() => {
      setIsMinimized(false)
      dispatch(setContactMinimized(false))
    })
  }

  const handleHideWidget = () => {
    // Hide widget completely when clicking ChevronDown
    setIsWidgetHidden(true)
    dispatch(setContactMinimized(false))
  }

  // If widget is hidden, don't render anything
  if (isWidgetHidden) {
    return null
  }

  // When minimized, widget will be rendered in AppLayout, so don't render here
  if (isMinimized) {
    return null
  }

  const hasConversation = conversations.length > 0 && activeConversationId

  return (
    <div className="contact-page contact-page--fullscreen">
      {!hasConversation && (
        <div className="contact-page__staff-selection">
          <div className="staff-selection">
            <h3 className="staff-selection__title">Chọn chi nhánh và nhân viên</h3>
            <div className="staff-selection__center">
              <label className="staff-selection__label">Chi nhánh:</label>
              <select
                className="staff-selection__select"
                value={selectedCenterId || ''}
                onChange={(e) => setSelectedCenterId(Number(e.target.value) || null)}
              >
                <option value="">-- Chọn chi nhánh --</option>
                {centers.map(center => (
                  <option key={center.centerId} value={center.centerId}>
                    {center.centerName}
                  </option>
                ))}
              </select>
            </div>

            {selectedCenterId && (
              <div className="staff-selection__staff">
                <label className="staff-selection__label">Nhân viên (tùy chọn):</label>
                {loadingStaff ? (
                  <div className="staff-selection__loading">Đang tải...</div>
                ) : (
                  <select
                    className="staff-selection__select"
                    value={selectedStaffId || ''}
                    onChange={(e) => setSelectedStaffId(Number(e.target.value) || null)}
                  >
                    <option value="">-- Chọn nhân viên (tùy chọn) --</option>
                    {availableStaff.map(staff => (
                      <option key={staff.staffId} value={staff.staffId}>
                        {staff.fullName} {staff.phoneNumber ? `(${staff.phoneNumber})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {!loadingStaff && availableStaff.length === 0 && (
                  <div className="staff-selection__empty">Không có nhân viên nào tại chi nhánh này</div>
                )}
              </div>
            )}

            <button
              className="staff-selection__button"
              onClick={handleCreateNewChat}
              disabled={!selectedCenterId}
            >
              Bắt đầu chat
            </button>
          </div>
        </div>
      )}

      <ConversationLayout onCreateNewChat={handleCreateNewChat} onMinimize={handleMinimize} />
      <NewMessageNotification />
    </div>
  )
}

export default ProtectedContact


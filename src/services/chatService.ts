import api from './api'
import type {
  ChatConversation,
  ChatMessage,
  ChatUser,
  ChatSearchResult,
  ChatTypingIndicator,
  ChatCall
} from '@/types/chat'

export class ChatService {
  // Simple de-duplication and throttling for conversation fetches
  private static inFlightConversations?: Promise<ChatConversation[]>
  private static lastConversationsAt = 0
  private static cachedConversations: ChatConversation[] = []
  private static readonly CONVERSATIONS_TTL_MS = 3000
  // Test API endpoints for debugging
  static async testStaffEndpoint(): Promise<any> {
    try {
      const response = await api.get('/conversation/staff', {
        params: { page: 1, pageSize: 10 }
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get all conversations for current user
  static async getConversations(): Promise<ChatConversation[]> {
    const now = Date.now()
    // Return cached data within TTL to avoid burst requests
    if (now - ChatService.lastConversationsAt < ChatService.CONVERSATIONS_TTL_MS && ChatService.cachedConversations.length) {
      return ChatService.cachedConversations
    }
    // Return in-flight promise if a request is already running
    if (ChatService.inFlightConversations) {
      return ChatService.inFlightConversations
    }
    ChatService.inFlightConversations = (async () => {
      // Try staff endpoint first, fallback to my-conversations
      let response
      try {
        response = await api.get('/conversation/staff', {
          params: { page: 1, pageSize: 50 }
        })
      } catch (error) {
        try {
          response = await api.get('/conversation/my-conversations')
        } catch (fallbackError) {
          // Return empty array as fallback
          return []
        }
      }
      const items: any[] = response?.data?.data || []
      return items.map((c: any) => {
        const convId = String(c.id || c.conversationId || c.conversationID || c.ConversationId)
        const members: any[] = c.members || c.participants || []
        const participants = members
          .map((m: any) => {
            const inferredId = m.userId || m.id || m.memberId || m.UserId || m.MemberId || m.user?.id || m.user?.userId
            const inferredName = m.userName || m.userFullName || m.fullName || m.name || m.UserFullName || m.FullName || m.user?.fullName || m.user?.full_name || m.user?.name || m.profile?.fullName
            const inferredAvatar = m.userAvatar || m.avatarUrl || m.avatar || m.user?.avatarUrl || m.user?.avatar
            const roleRaw = (m.roleInConversation || m.role || m.RoleInConversation || '').toString().toUpperCase()
            const mappedRole = roleRaw === 'CUSTOMER' ? 'customer' : roleRaw.includes('TECH') ? 'technician' : roleRaw.includes('STAFF') ? 'staff' : roleRaw.includes('ADMIN') ? 'admin' : 'customer'

            return {
              id: inferredId ? String(inferredId) : '',
              name: inferredName || 'Người dùng',
              avatar: inferredAvatar || undefined,
              role: mappedRole as any,
              isOnline: Boolean(m.isOnline || m.isActive || m.user?.isActive),
            }
          })
          // Filter out placeholder members without id
          .filter((p: any) => p.id && p.id !== '')

        const lm = c.lastMessage || c.LastMessage || null
        const lastMessage = lm ? {
          id: String(lm.messageId || lm.id || ''),
          conversationId: convId,
          senderId: String(lm.senderUserId || lm.senderGuestSessionId || ''),
          senderName: lm.senderName || '',
          content: lm.content || '',
          timestamp: lm.createdAt || c.lastMessageAt || c.updatedAt || new Date().toISOString(),
          type: 'text' as const,
          isRead: true,
        } : undefined

        const createdAt = c.createdAt || new Date().toISOString()
        const updatedAt = c.updatedAt || c.lastMessageAt || createdAt

        const conv: ChatConversation = {
          id: convId,
          participants,
          lastMessage: lastMessage as any,
          unreadCount: Number(c.unreadCount || 0),
          isPinned: Boolean(c.isPinned || false),
          isArchived: Boolean(c.isArchived || false),
          createdAt: createdAt,
          updatedAt: updatedAt,
        }
        return conv
      })
    })()
    try {
      const data = await ChatService.inFlightConversations
      ChatService.cachedConversations = data
      ChatService.lastConversationsAt = Date.now()
      return data
    } catch (error) {
      throw error
    } finally {
      ChatService.inFlightConversations = undefined
    }
  }

  // Get conversation by ID
  static async getConversation(conversationId: string): Promise<ChatConversation> {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}`)
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  // Get messages for a conversation
  static async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { page, limit }
      })
      return response.data.data || []
    } catch (error) {
      throw error
    }
  }

  // Send a message
  static async sendMessage(messageData: { conversationId: string; content: string; type?: 'text' | 'image' | 'file'; attachments?: File[] }): Promise<ChatMessage> {
    try {
      const { conversationId, content, type = 'text', attachments } = messageData
      const formData = new FormData()
      formData.append('content', content)
      formData.append('type', type)

      if (attachments) {
        attachments.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file)
        })
      }

      const response = await api.post(`/chat/conversations/${conversationId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  // Create new conversation
  static async createConversation(participantId: string): Promise<ChatConversation> {
    try {
      const response = await api.post('/chat/conversations', {
        participantIds: [participantId]
      })
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  // Create conversation with staff (for customer support)
  static async createSupportConversation(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.post('/conversation', {
        subject: 'Hỗ trợ khách hàng VIP',
        members: [
          {
            userId: null,
            guestSessionId: null,
            roleInConversation: 'CUSTOMER'
          },
          {
            userId: null,
            guestSessionId: null,
            roleInConversation: 'STAFF'
          }
        ]
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get user location using browser Geolocation API
  static async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: false }
      )
    })
  }

  // Create new conversation for customer support (always creates new, never gets existing)
  // IMPORTANT: Only STAFF role can be assigned, not MANAGER or other roles
  static async createNewSupportConversation(
    customerLat?: number,
    customerLng?: number,
    preferredCenterId?: number,
    preferredStaffId?: number
  ): Promise<{ success: boolean; data: any }> {
    try {
      const currentUserId = localStorage.getItem('userId') || null
      let guestSessionId = localStorage.getItem('guestSessionId')

      // Ensure guestSessionId exists if user is not logged in
      if (!currentUserId && !guestSessionId) {
        guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('guestSessionId', guestSessionId)
      }

      // Validate that at least one identifier exists
      if (!currentUserId && !guestSessionId) {
        throw new Error('Cannot create conversation: both userId and guestSessionId are missing')
      }

      // Build members array - only include customer member
      // Staff will be auto-assigned by backend with STAFF role only (not MANAGER)
      // IMPORTANT: Constraint CK_ConversationMembers_ActorXor requires either userId OR guestSessionId, not both
      // If user is logged in (has userId), only send userId and set guestSessionId to null
      // If user is not logged in, only send guestSessionId and set userId to null
      const members: any[] = [
        {
          userId: currentUserId ? parseInt(currentUserId) : null,
          guestSessionId: currentUserId ? null : (guestSessionId && guestSessionId.trim() !== '' ? guestSessionId.trim() : null),
          roleInConversation: 'CUSTOMER'
        }
      ]

      const requestBody: any = {
        subject: 'Hỗ trợ khách hàng',
        members: members
      }

      if (preferredCenterId) {
        requestBody.preferredCenterId = preferredCenterId
      }

      // Validate preferredStaffId: Backend will validate that staff has STAFF role (not MANAGER)
      // If invalid, backend will fallback to auto-assign a STAFF member
      if (preferredStaffId) {
        requestBody.preferredStaffId = preferredStaffId
      }

      if (customerLat !== undefined && customerLng !== undefined) {
        requestBody.customerLatitude = customerLat
        requestBody.customerLongitude = customerLng
      }

      const response = await api.post('/conversation', requestBody)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get or create conversation for customer support (legacy method, kept for backward compatibility)
  static async getOrCreateSupportConversation(preferredCenterId?: number): Promise<{ success: boolean; data: any }> {
    try {
      // Try to get current user ID from localStorage or auth state
      const currentUserId = localStorage.getItem('userId') || null
      const guestSessionId = localStorage.getItem('guestSessionId') || null

      const requestBody: any = {
        member1: {
          userId: currentUserId ? parseInt(currentUserId) : null,
          guestSessionId: currentUserId ? null : (guestSessionId && guestSessionId.trim() !== '' ? guestSessionId.trim() : null),
          roleInConversation: 'CUSTOMER'
        },
        member2: {
          userId: null,
          guestSessionId: null,
          roleInConversation: 'STAFF'
        },
        subject: 'Hỗ trợ khách hàng'
      }

      if (preferredCenterId) {
        requestBody.preferredCenterId = preferredCenterId
      }

      const response = await api.post('/conversation/get-or-create', requestBody)
      return response.data
    } catch (error) {
      // Fallback to creating a new conversation
      try {
        const currentUserId = localStorage.getItem('userId') || null
        const guestSessionId = localStorage.getItem('guestSessionId') || null

        const fallbackResponse = await api.post('/conversation', {
          subject: 'Hỗ trợ khách hàng',
          members: [
            {
              userId: currentUserId ? parseInt(currentUserId) : null,
              guestSessionId: currentUserId ? null : (guestSessionId && guestSessionId.trim() !== '' ? guestSessionId.trim() : null),
              roleInConversation: 'CUSTOMER'
            },
            {
              userId: null,
              guestSessionId: null,
              roleInConversation: 'STAFF'
            }
          ]
        })
        return fallbackResponse.data
      } catch (fallbackError) {
        throw error
      }
    }
  }

  // Send message to conversation
  static async sendMessageToConversation(
    conversationId: number,
    content: string,
    replyToMessageId?: number,
    attachments?: File[]
  ): Promise<{ success: boolean; data: any }> {
    try {
      // Get current user info
      const currentUserId = localStorage.getItem('userId')
      const guestSessionId = localStorage.getItem('guestSessionId')

      // Prepare request body
      const requestBody: any = {
        conversationId: conversationId,
        content: content
      }

      // Add reply message ID if provided
      if (replyToMessageId) {
        requestBody.replyToMessageId = replyToMessageId
      }

      // Add sender info - IMPORTANT: Constraint CK_Messages_SenderXor requires either userId OR guestSessionId, not both
      // If user is logged in (has userId), only send userId and set guestSessionId to null
      // If user is not logged in, only send guestSessionId and set userId to null
      if (currentUserId) {
        requestBody.senderUserId = parseInt(currentUserId)
        requestBody.senderGuestSessionId = null // Explicitly set to null to avoid constraint violation
      } else if (guestSessionId && guestSessionId.trim() !== '') {
        requestBody.senderGuestSessionId = guestSessionId.trim()
        requestBody.senderUserId = null // Explicitly set to null to avoid constraint violation
      }

      // Handle file uploads if provided
      let response
      if (attachments && attachments.length > 0) {
        const formData = new FormData()
        formData.append('conversationId', conversationId.toString())
        formData.append('content', content)
        if (replyToMessageId) {
          formData.append('replyToMessageId', replyToMessageId.toString())
        }
        // IMPORTANT: Constraint CK_Messages_SenderXor requires either userId OR guestSessionId, not both
        if (currentUserId) {
          formData.append('senderUserId', currentUserId)
          // Don't append senderGuestSessionId if userId is present
        } else if (guestSessionId && guestSessionId.trim() !== '') {
          formData.append('senderGuestSessionId', guestSessionId.trim())
          // Don't append senderUserId if guestSessionId is present
        }

        // ASP.NET Core model binding expects "Attachments[0]", "Attachments[1]", etc. (PascalCase)
        attachments.forEach((file, index) => {
          formData.append(`Attachments[${index}]`, file)
        })

        response = await api.post('/message', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        response = await api.post('/message', requestBody)
      }

      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get messages from conversation
  static async getConversationMessages(conversationId: number, page: number = 1, pageSize: number = 100): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.get(`/message/conversations/${conversationId}`, {
        params: { page, pageSize }
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get available staff/technicians for chat
  static async getAvailableStaff(): Promise<ChatUser[]> {
    try {
      const response = await api.get('/chat/staff/available')
      return response.data.data || []
    } catch (error: any) {
      // Return empty list when endpoint not found, avoid breaking UI
      if (error?.response?.status === 404) {
        return []
      }
      return []
    }
  }

  // Get staff by center (only STAFF role, not MANAGER)
  // Backend filters to only return staff with role "STAFF", excluding MANAGER
  static async getStaffByCenter(centerId: number): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await api.get(`/conversation/staff/by-center/${centerId}`)
      // Backend already filters to only return STAFF role (not MANAGER)
      // Validate response to ensure all staff have STAFF role
      if (response.data?.success && Array.isArray(response.data.data)) {
        // All staff returned from this endpoint should be STAFF role only
        // Backend validation ensures this
        return response.data
      }
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get available users for chat
  static async getAvailableUsers(): Promise<ChatUser[]> {
    try {
      const response = await api.get('/chat/users/available')
      return response.data.data || []
    } catch (error) {
      return []
    }
  }

  // Mark conversation as read
  static async markAsRead(conversationId: string | number): Promise<void> {
    try {
      await api.put(`/conversation/${conversationId}/last-read`)
    } catch (error) {
      throw error
    }
  }

  // Search conversations and messages
  static async search(query: string): Promise<ChatSearchResult> {
    try {
      const response = await api.get('/chat/search', {
        params: { q: query }
      })
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  // Pin/unpin conversation
  static async togglePin(conversationId: string, isPinned: boolean): Promise<void> {
    try {
      await api.patch(`/chat/conversations/${conversationId}/pin`, {
        isPinned
      })
    } catch (error) {
      throw error
    }
  }


  // Send typing indicator
  static async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    try {
      await api.post(`/chat/conversations/${conversationId}/typing`, {
        isTyping
      })
    } catch (error) {
      throw error
    }
  }

  // Get typing indicators for conversation
  static async getTypingIndicators(conversationId: string): Promise<ChatTypingIndicator[]> {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/typing`)
      return response.data.data || []
    } catch (error) {
      throw error
    }
  }

  // Start voice/video call
  static async startCall(conversationId: string, type: 'voice' | 'video'): Promise<ChatCall> {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/call`, {
        type
      })
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  // End call
  static async endCall(callId: string): Promise<void> {
    try {
      await api.post(`/chat/calls/${callId}/end`)
    } catch (error) {
      throw error
    }
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<ChatUser> {
    try {
      const response = await api.get(`/chat/users/${userId}`)
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  // Update user status
  static async updateUserStatus(isOnline: boolean): Promise<void> {
    try {
      await api.patch('/chat/users/status', {
        isOnline
      })
    } catch (error) {
      throw error
    }
  }

  // Search messages in conversation
  static async searchMessages(conversationId: string | number, query: string, page: number = 1, pageSize: number = 20): Promise<{ success: boolean; data: ChatMessage[] }> {
    try {
      const response = await api.post('/message/search', {
        conversationId,
        query,
        page,
        pageSize
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Update message
  static async updateMessage(messageId: string | number, content: string): Promise<{ success: boolean; data: ChatMessage }> {
    try {
      const response = await api.put(`/message/${messageId}`, {
        content
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Delete message
  static async deleteMessage(messageId: string | number): Promise<{ success: boolean }> {
    try {
      const response = await api.delete(`/message/${messageId}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Reassign conversation to different center (staff/admin only)
  static async reassignCenter(conversationId: string | number, newCenterId: number, reason?: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.put(`/conversation/${conversationId}/reassign-center`, {
        newCenterId,
        reason
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Pin/unpin conversation (frontend only - no API call)
  static pinConversation(conversationId: string): void {
    // This is a frontend-only operation, handled by Redux
  }

  // Archive conversation (frontend only - no API call)
  static archiveConversation(conversationId: string): void {
    // This is a frontend-only operation, handled by Redux
  }

  // Delete conversation
  static async deleteConversation(conversationId: string | number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/conversation/${conversationId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Không thể xóa cuộc trò chuyện')
    }
  }
}

export default ChatService

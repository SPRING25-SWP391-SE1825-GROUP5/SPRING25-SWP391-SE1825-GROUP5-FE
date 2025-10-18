import api from './api'
import type {
  ChatMessage,
  ChatConversation,
  ChatUser,
  ChatGroup,
  SendMessageRequest,
  CreateConversationRequest,
  ChatApiResponse,
  MessageListResponse,
  ConversationListResponse,
  ChatNotification
} from '@/types/chat'

/**
 * Chat Service
 * Handles all chat-related API operations
 * 
 * @class ChatService
 * @description Service responsible for chat functionality including messages, conversations, and real-time features
 */
export const ChatService = {
  // ==================== CONVERSATIONS ====================

  /**
   * Get user's conversations
   */
  async getConversations(params: {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
  } = {}): Promise<ConversationListResponse> {
    const defaultParams = { pageNumber: 1, pageSize: 20, ...params }
    const { data } = await api.get<ConversationListResponse>('/Chat/conversations', { params: defaultParams })
    return data
  },

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<ChatConversation> {
    const { data } = await api.get<ChatApiResponse<ChatConversation>>(`/Chat/conversations/${conversationId}`)
    return data.data
  },

  /**
   * Create new conversation
   */
  async createConversation(conversationData: CreateConversationRequest): Promise<ChatConversation> {
    const { data } = await api.post<ChatApiResponse<ChatConversation>>('/Chat/conversations', conversationData)
    return data.data
  },

  /**
   * Get or create conversation with specific user
   */
  async getOrCreateConversation(userId: string): Promise<ChatConversation> {
    const { data } = await api.post<ChatApiResponse<ChatConversation>>('/Chat/conversations/with-user', { userId })
    return data.data
  },

  // ==================== MESSAGES ====================

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, params: {
    pageNumber?: number
    pageSize?: number
    before?: string
  } = {}): Promise<MessageListResponse> {
    const defaultParams = { pageNumber: 1, pageSize: 50, ...params }
    const { data } = await api.get<MessageListResponse>(`/Chat/conversations/${conversationId}/messages`, { params: defaultParams })
    return data
  },

  /**
   * Send message to conversation
   */
  async sendMessage(messageData: SendMessageRequest): Promise<ChatMessage> {
    const { data } = await api.post<ChatApiResponse<ChatMessage>>('/Chat/messages', messageData)
    return data.data
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    await api.patch(`/Chat/conversations/${conversationId}/messages/read`, { messageIds })
  },

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/Chat/messages/${messageId}`)
  },

  /**
   * Edit message
   */
  async editMessage(messageId: string, content: string): Promise<ChatMessage> {
    const { data } = await api.patch<ChatApiResponse<ChatMessage>>(`/Chat/messages/${messageId}`, { content })
    return data.data
  },

  // ==================== USERS & GROUPS ====================

  /**
   * Get online users
   */
  async getOnlineUsers(): Promise<ChatUser[]> {
    const { data } = await api.get<ChatApiResponse<ChatUser[]>>('/Chat/users/online')
    return data.data
  },

  /**
   * Get available users for chat
   */
  async getAvailableUsers(params: {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
    role?: string
  } = {}): Promise<{ users: ChatUser[], total: number }> {
    const defaultParams = { pageNumber: 1, pageSize: 50, ...params }
    const { data } = await api.get<ChatApiResponse<{ users: ChatUser[], total: number }>>('/Chat/users/available', { params: defaultParams })
    return data.data
  },

  /**
   * Get user groups
   */
  async getUserGroups(): Promise<ChatGroup[]> {
    const { data } = await api.get<ChatApiResponse<ChatGroup[]>>('/Chat/groups')
    return data.data
  },

  /**
   * Create group
   */
  async createGroup(groupData: {
    name: string
    description?: string
    participantIds: string[]
    isPrivate?: boolean
  }): Promise<ChatGroup> {
    const { data } = await api.post<ChatApiResponse<ChatGroup>>('/Chat/groups', groupData)
    return data.data
  },

  // ==================== NOTIFICATIONS ====================

  /**
   * Get chat notifications
   */
  async getNotifications(params: {
    pageNumber?: number
    pageSize?: number
    unreadOnly?: boolean
  } = {}): Promise<{ notifications: ChatNotification[], total: number }> {
    const defaultParams = { pageNumber: 1, pageSize: 20, ...params }
    const { data } = await api.get<ChatApiResponse<{ notifications: ChatNotification[], total: number }>>('/Chat/notifications', { params: defaultParams })
    return data.data
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await api.patch(`/Chat/notifications/${notificationId}/read`)
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    await api.patch('/Chat/notifications/read-all')
  },

  // ==================== REACTIONS ====================

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, emoji: string): Promise<void> {
    await api.post(`/Chat/messages/${messageId}/reactions`, { emoji })
  },

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await api.delete(`/Chat/messages/${messageId}/reactions/${emoji}`)
  },

  // ==================== TYPING INDICATORS ====================

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string): Promise<void> {
    await api.post(`/Chat/conversations/${conversationId}/typing`)
  },

  /**
   * Stop typing indicator
   */
  async stopTypingIndicator(conversationId: string): Promise<void> {
    await api.delete(`/Chat/conversations/${conversationId}/typing`)
  },

  // ==================== FILE UPLOAD ====================

  /**
   * Upload file for chat
   */
  async uploadFile(file: File, conversationId: string): Promise<{ fileUrl: string, fileName: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversationId', conversationId)

    const { data } = await api.post<ChatApiResponse<{ fileUrl: string, fileName: string }>>('/Chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data.data
  },

  // ==================== SEARCH ====================

  /**
   * Search messages
   */
  async searchMessages(params: {
    query: string
    conversationId?: string
    pageNumber?: number
    pageSize?: number
  }): Promise<{ messages: ChatMessage[], total: number }> {
    const defaultParams = { pageNumber: 1, pageSize: 20, ...params }
    const { data } = await api.get<ChatApiResponse<{ messages: ChatMessage[], total: number }>>('/Chat/search', { params: defaultParams })
    return data.data
  }
}

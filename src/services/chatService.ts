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
  // Get all conversations for current user
  static async getConversations(): Promise<ChatConversation[]> {
    try {
      const response = await api.get('/chat/conversations')
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  }

  // Get conversation by ID
  static async getConversation(conversationId: string): Promise<ChatConversation> {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching conversation:', error)
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
      console.error('Error fetching messages:', error)
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
      console.error('Error sending message:', error)
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
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  // Get available staff/technicians for chat
  static async getAvailableStaff(): Promise<ChatUser[]> {
    try {
      const response = await api.get('/chat/staff/available')
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching available staff:', error)
      throw error
    }
  }

  // Get available users for chat
  static async getAvailableUsers(): Promise<ChatUser[]> {
    try {
      const response = await api.get('/chat/users/available')
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching available users:', error)
      throw error
    }
  }

  // Mark messages as read
  static async markAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    try {
      await api.post(`/chat/conversations/${conversationId}/read`, {
        messageIds
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
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
      console.error('Error searching:', error)
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
      console.error('Error toggling pin:', error)
      throw error
    }
  }

  // Archive conversation
  static async archiveConversation(conversationId: string): Promise<void> {
    try {
      await api.patch(`/chat/conversations/${conversationId}/archive`)
    } catch (error) {
      console.error('Error archiving conversation:', error)
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
      console.error('Error sending typing indicator:', error)
      throw error
    }
  }

  // Get typing indicators for conversation
  static async getTypingIndicators(conversationId: string): Promise<ChatTypingIndicator[]> {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/typing`)
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching typing indicators:', error)
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
      console.error('Error starting call:', error)
      throw error
    }
  }

  // End call
  static async endCall(callId: string): Promise<void> {
    try {
      await api.post(`/chat/calls/${callId}/end`)
    } catch (error) {
      console.error('Error ending call:', error)
      throw error
    }
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<ChatUser> {
    try {
      const response = await api.get(`/chat/users/${userId}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching user profile:', error)
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
      console.error('Error updating user status:', error)
      throw error
    }
  }
}

export default ChatService
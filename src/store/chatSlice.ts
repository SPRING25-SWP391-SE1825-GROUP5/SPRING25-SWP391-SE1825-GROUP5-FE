import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ChatState, ChatMessage, ChatConversation, ChatUser, ChatNotification } from '@/types/chat'

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  onlineUsers: [],
  isWidgetOpen: false,
  isLoading: false,
  error: null
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // ==================== WIDGET CONTROLS ====================
    
    /**
     * Toggle chat widget visibility
     */
    toggleWidget: (state) => {
      state.isWidgetOpen = !state.isWidgetOpen
    },

    /**
     * Open chat widget
     */
    openWidget: (state) => {
      state.isWidgetOpen = true
    },

    /**
     * Close chat widget
     */
    closeWidget: (state) => {
      state.isWidgetOpen = false
    },

    // ==================== CONVERSATIONS ====================

    /**
     * Set conversations list
     */
    setConversations: (state, action: PayloadAction<ChatConversation[]>) => {
      state.conversations = action.payload
    },

    /**
     * Add new conversation
     */
    addConversation: (state, action: PayloadAction<ChatConversation>) => {
      const existingIndex = state.conversations.findIndex(conv => conv.id === action.payload.id)
      if (existingIndex >= 0) {
        state.conversations[existingIndex] = action.payload
      } else {
        state.conversations.unshift(action.payload)
      }
    },

    /**
     * Update conversation
     */
    updateConversation: (state, action: PayloadAction<{ id: string; updates: Partial<ChatConversation> }>) => {
      const index = state.conversations.findIndex(conv => conv.id === action.payload.id)
      if (index >= 0) {
        state.conversations[index] = { ...state.conversations[index], ...action.payload.updates }
      }
    },

    /**
     * Remove conversation
     */
    removeConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(conv => conv.id !== action.payload)
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = null
      }
    },

    /**
     * Set active conversation
     */
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload
    },

    // ==================== MESSAGES ====================

    /**
     * Set messages for conversation
     */
    setMessages: (state, action: PayloadAction<{ conversationId: string; messages: ChatMessage[] }>) => {
      state.messages[action.payload.conversationId] = action.payload.messages
    },

    /**
     * Add message to conversation
     */
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: ChatMessage }>) => {
      const { conversationId, message } = action.payload
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = []
      }
      
      // Check if message already exists
      const existingIndex = state.messages[conversationId].findIndex(msg => msg.id === message.id)
      if (existingIndex >= 0) {
        state.messages[conversationId][existingIndex] = message
      } else {
        state.messages[conversationId].push(message)
      }

      // Update conversation's last message
      const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId)
      if (conversationIndex >= 0) {
        state.conversations[conversationIndex].lastMessage = message
        state.conversations[conversationIndex].updatedAt = message.timestamp
        
        // Move conversation to top
        const conversation = state.conversations.splice(conversationIndex, 1)[0]
        state.conversations.unshift(conversation)
      }
    },

    /**
     * Update message
     */
    updateMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string; updates: Partial<ChatMessage> }>) => {
      const { conversationId, messageId, updates } = action.payload
      const messages = state.messages[conversationId]
      
      if (messages) {
        const index = messages.findIndex(msg => msg.id === messageId)
        if (index >= 0) {
          messages[index] = { ...messages[index], ...updates }
        }
      }
    },

    /**
     * Remove message
     */
    removeMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string }>) => {
      const { conversationId, messageId } = action.payload
      const messages = state.messages[conversationId]
      
      if (messages) {
        state.messages[conversationId] = messages.filter(msg => msg.id !== messageId)
      }
    },

    /**
     * Mark messages as read
     */
    markMessagesAsRead: (state, action: PayloadAction<{ conversationId: string; messageIds: string[] }>) => {
      const { conversationId, messageIds } = action.payload
      const messages = state.messages[conversationId]
      
      if (messages) {
        messages.forEach(message => {
          if (messageIds.includes(message.id)) {
            message.isRead = true
          }
        })
      }

      // Update conversation unread count
      const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId)
      if (conversationIndex >= 0) {
        const unreadCount = messages?.filter(msg => !msg.isRead).length || 0
        state.conversations[conversationIndex].unreadCount = unreadCount
      }
    },

    // ==================== USERS ====================

    /**
     * Set online users
     */
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload
    },

    /**
     * Add online user
     */
    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload)
      }
    },

    /**
     * Remove online user
     */
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(userId => userId !== action.payload)
    },

    // ==================== LOADING & ERROR ====================

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null
    },

    // ==================== UTILITY ====================

    /**
     * Reset chat state
     */
    resetChat: (state) => {
      state.conversations = []
      state.activeConversationId = null
      state.messages = {}
      state.onlineUsers = []
      state.isWidgetOpen = false
      state.isLoading = false
      state.error = null
    },

    /**
     * Update unread count for conversation
     */
    updateUnreadCount: (state, action: PayloadAction<{ conversationId: string; count: number }>) => {
      const conversationIndex = state.conversations.findIndex(conv => conv.id === action.payload.conversationId)
      if (conversationIndex >= 0) {
        state.conversations[conversationIndex].unreadCount = action.payload.count
      }
    }
  }
})

export const {
  // Widget controls
  toggleWidget,
  openWidget,
  closeWidget,
  
  // Conversations
  setConversations,
  addConversation,
  updateConversation,
  removeConversation,
  setActiveConversation,
  
  // Messages
  setMessages,
  addMessage,
  updateMessage,
  removeMessage,
  markMessagesAsRead,
  
  // Users
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  
  // Loading & Error
  setLoading,
  setError,
  clearError,
  
  // Utility
  resetChat,
  updateUnreadCount
} = chatSlice.actions

export default chatSlice.reducer

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ChatState, ChatMessage, ChatConversation, ChatUser, ChatNotification } from '@/types/chat'

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  onlineUsers: [],
  isWidgetOpen: false,
  isLoading: false,
  error: null,
  activeFilter: 'all',
  searchQuery: '',
  typingUsers: {}
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

      console.log('[chatSlice] addMessage called', {
        conversationId,
        messageId: message.id,
        content: message.content,
        senderId: message.senderId,
        timestamp: message.timestamp
      })

      if (!state.messages[conversationId]) {
        state.messages[conversationId] = []
      }

      // Check if message already exists
      const existingIndex = state.messages[conversationId].findIndex(msg => msg.id === message.id)
      if (existingIndex >= 0) {
        console.log('[chatSlice] Message already exists, updating', {
          messageId: message.id,
          existingIndex,
          oldContent: state.messages[conversationId][existingIndex].content,
          newContent: message.content
        })
        state.messages[conversationId][existingIndex] = message
      } else {
        console.log('[chatSlice] Adding new message', {
          messageId: message.id,
          conversationId,
          currentCount: state.messages[conversationId].length
        })
        state.messages[conversationId].push(message)
        console.log('[chatSlice] Message added, new count', state.messages[conversationId].length)
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
    },

    // ==================== FILTERS & SEARCH ====================

    /**
     * Set active filter
     */
    setActiveFilter: (state, action: PayloadAction<'all' | 'unread' | 'pinned'>) => {
      state.activeFilter = action.payload
    },

    /**
     * Set search query
     */
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    // ==================== PIN & ARCHIVE ====================

    /**
     * Pin/unpin conversation (frontend only)
     */
    pinConversation: (state, action: PayloadAction<string>) => {
      const conversationIndex = state.conversations.findIndex(conv => conv.id === action.payload)
      if (conversationIndex >= 0) {
        state.conversations[conversationIndex].isPinned = !state.conversations[conversationIndex].isPinned
      }
    },

    /**
     * Archive conversation (frontend only)
     */
    archiveConversation: (state, action: PayloadAction<string>) => {
      const conversationIndex = state.conversations.findIndex(conv => conv.id === action.payload)
      if (conversationIndex >= 0) {
        state.conversations[conversationIndex].isArchived = true
      }
    },

    // ==================== MESSAGE REACTIONS ====================

    /**
     * Add reaction to message
     */
    addReaction: (state, action: PayloadAction<{ conversationId: string; messageId: string; emoji: string; userId: string }>) => {
      const { conversationId, messageId, emoji, userId } = action.payload
      const messages = state.messages[conversationId]

      if (messages) {
        const messageIndex = messages.findIndex(msg => msg.id === messageId)
        if (messageIndex >= 0) {
          const message = messages[messageIndex]
          if (!message.reactions) {
            message.reactions = []
          }

          const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji)
          if (reactionIndex >= 0) {
            // Toggle: remove if already reacted
            const reaction = message.reactions[reactionIndex]
            if (reaction.userIds.includes(userId)) {
              reaction.userIds = reaction.userIds.filter(id => id !== userId)
              reaction.count = Math.max(0, reaction.count - 1)
              if (reaction.count === 0) {
                message.reactions.splice(reactionIndex, 1)
              }
            } else {
              reaction.userIds.push(userId)
              reaction.count++
            }
          } else {
            // Add new reaction
            message.reactions.push({
              emoji,
              userIds: [userId],
              count: 1
            })
          }
        }
      }
    },

    // ==================== MESSAGE STATUS & READ RECEIPTS ====================

    /**
     * Set message status
     */
    setMessageStatus: (state, action: PayloadAction<{ conversationId: string; messageId: string; status: 'sending' | 'sent' | 'delivered' | 'read' }>) => {
      const { conversationId, messageId, status } = action.payload
      const messages = state.messages[conversationId]

      if (messages) {
        const index = messages.findIndex(msg => msg.id === messageId)
        if (index >= 0) {
          messages[index].messageStatus = status
        }
      }
    },

    /**
     * Set read receipt
     */
    setReadReceipt: (state, action: PayloadAction<{ conversationId: string; messageId: string; isRead: boolean; readAt?: string }>) => {
      const { conversationId, messageId, isRead, readAt } = action.payload
      const messages = state.messages[conversationId]

      if (messages) {
        const index = messages.findIndex(msg => msg.id === messageId)
        if (index >= 0) {
          messages[index].isRead = isRead
          if (readAt) {
            messages[index].readAt = readAt
          }
        }
      }
    },

    // ==================== TYPING INDICATORS ====================

    /**
     * Set typing users for conversation
     */
    setTypingUsers: (state, action: PayloadAction<{ conversationId: string; userIds: string[] }>) => {
      const { conversationId, userIds } = action.payload
      state.typingUsers[conversationId] = userIds
    },

    /**
     * Add typing user
     */
    addTypingUser: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload
      console.log('[chatSlice] addTypingUser called', { conversationId, userId, currentState: state.typingUsers })

      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = []
      }
      if (!state.typingUsers[conversationId].includes(userId)) {
        state.typingUsers[conversationId].push(userId)
        console.log('[chatSlice] Typing user added', { conversationId, userId, updatedState: state.typingUsers })
      } else {
        console.log('[chatSlice] Typing user already exists', { conversationId, userId })
      }
    },

    /**
     * Remove typing user
     */
    removeTypingUser: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload
      console.log('[chatSlice] removeTypingUser called', { conversationId, userId, currentState: state.typingUsers })

      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(id => id !== userId)
        console.log('[chatSlice] Typing user removed', { conversationId, userId, updatedState: state.typingUsers })
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
  updateUnreadCount,

  // Filters & Search
  setActiveFilter,
  setSearchQuery,

  // Pin & Archive
  pinConversation,
  archiveConversation,

  // Message Reactions
  addReaction,

  // Message Status & Read Receipts
  setMessageStatus,
  setReadReceipt,

  // Typing Indicators
  setTypingUsers,
  addTypingUser,
  removeTypingUser
} = chatSlice.actions

export default chatSlice.reducer

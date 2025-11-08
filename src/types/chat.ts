export interface ChatUser {
  id: string
  name: string
  avatar?: string
  email?: string
  role: 'customer' | 'technician' | 'staff' | 'admin'
  isOnline: boolean
  lastSeen?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  type: 'text' | 'image' | 'file' | 'link'
  isRead: boolean
  attachments?: ChatAttachment[]
  messageStatus?: 'sending' | 'sent' | 'delivered' | 'read'
  replyToMessageId?: string
  replyToMessage?: ChatMessage
  reactions?: MessageReaction[]
  readAt?: string
  isEdited?: boolean
  editedAt?: string
  richTextContent?: string
  formatting?: 'plain' | 'markdown' | 'html'
}

export interface MessageReaction {
  emoji: string
  userIds: string[]
  count: number
}

export interface ChatAttachment {
  id: string
  type: 'image' | 'file' | 'video'
  url: string
  name: string
  size: number
  thumbnail?: string
}

export interface ChatConversation {
  id: string
  participants: ChatUser[]
  lastMessage?: ChatMessage
  unreadCount: number
  isPinned: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface ChatSettings {
  theme: 'light' | 'dark'
  notifications: boolean
  soundEnabled: boolean
  compactMode: boolean
  privateMode: boolean
  bordersEnabled: boolean
}

export interface ChatSearchResult {
  conversations: ChatConversation[]
  messages: ChatMessage[]
  users: ChatUser[]
}

export interface ChatTypingIndicator {
  conversationId: string
  userId: string
  userName: string
  isTyping: boolean
}

export interface ChatCall {
  id: string
  type: 'voice' | 'video'
  participants: string[]
  status: 'ringing' | 'active' | 'ended'
  startTime: string
  endTime?: string
}

export interface ChatState {
  isContactMinimized?: boolean
  conversations: ChatConversation[]
  activeConversationId: string | null
  messages: Record<string, ChatMessage[]>
  onlineUsers: string[]
  isWidgetOpen: boolean
  isLoading: boolean
  error: string | null
  activeFilter: 'all' | 'unread' | 'pinned'
  searchQuery: string
  typingUsers: Record<string, string[]>
}

export interface ChatNotification {
  id: string
  type: 'message' | 'call' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  conversationId?: string
}

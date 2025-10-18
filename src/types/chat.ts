/**
 * Chat System Types
 * TypeScript interfaces for chat functionality
 */

export interface ChatUser {
  id: string
  name: string
  avatar?: string
  role: 'admin' | 'manager' | 'staff' | 'technician' | 'customer'
  isOnline: boolean
  lastSeen?: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  type: 'text' | 'image' | 'file' | 'system'
  isRead: boolean
  replyTo?: string
  reactions?: ChatReaction[]
}

export interface ChatReaction {
  emoji: string
  userId: string
  userName: string
  timestamp: string
}

export interface ChatConversation {
  id: string
  participants: ChatUser[]
  lastMessage?: ChatMessage
  unreadCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ChatGroup {
  id: string
  name: string
  description?: string
  avatar?: string
  participants: ChatUser[]
  admins: string[]
  isPrivate: boolean
  createdAt: string
  updatedAt: string
}

export interface ChatState {
  conversations: ChatConversation[]
  activeConversationId: string | null
  messages: Record<string, ChatMessage[]>
  onlineUsers: string[]
  isWidgetOpen: boolean
  isLoading: boolean
  error: string | null
}

export interface SendMessageRequest {
  conversationId: string
  content: string
  type?: 'text' | 'image' | 'file'
  replyTo?: string
}

export interface CreateConversationRequest {
  participantIds: string[]
  isGroup?: boolean
  groupName?: string
}

export interface ChatNotification {
  id: string
  type: 'message' | 'mention' | 'reaction'
  conversationId: string
  messageId: string
  senderName: string
  content: string
  timestamp: string
  isRead: boolean
}

// Chat widget props
export interface ChatWidgetProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark'
}

export interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
  conversationId?: string
  className?: string
}

export interface MessageListProps {
  messages: ChatMessage[]
  currentUserId: string
  onReply?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  className?: string
}

export interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file') => void
  onTyping?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export interface ConversationListProps {
  conversations: ChatConversation[]
  activeConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
  className?: string
}

// API Response types
export interface ChatApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface MessageListResponse {
  messages: ChatMessage[]
  hasMore: boolean
  nextCursor?: string
}

export interface ConversationListResponse {
  conversations: ChatConversation[]
  total: number
  page: number
  pageSize: number
}

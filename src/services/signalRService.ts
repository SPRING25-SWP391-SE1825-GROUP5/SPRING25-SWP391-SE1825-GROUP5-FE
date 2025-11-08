import * as signalR from '@microsoft/signalr'
import type { ChatMessage } from '@/types/chat'

class SignalRService {
  private connection: signalR.HubConnection | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000

  // Event handlers
  private onMessageReceived?: (messageData: any) => void
  private onTypingStarted?: (userId: string, conversationId: string) => void
  private onTypingStopped?: (userId: string, conversationId: string) => void
  private onUserJoined?: (userId: string, conversationId: string) => void
  private onUserLeft?: (userId: string, conversationId: string) => void
  private onConnectionStatusChanged?: (isConnected: boolean) => void
  private onNewConversation?: (data: { conversationId: number; message: string; timestamp: string }) => void
  private onCenterReassigned?: (data: { conversationId: number; newCenterId: number; newStaffUserId: number; oldStaffUserId?: number; reason?: string; timestamp: string }) => void
  private onMessageRead?: (data: { conversationId: number; userId?: number; guestSessionId?: string; lastReadAt: string }) => void

  constructor() {
    this.initializeConnection()
  }

  private initializeConnection() {
    // Try to get base URL from env, fallback to http if https fails
    let baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001'

    // Remove trailing slash and /api if present (SignalR hubs are not under /api)
    baseUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')

    // SignalR hubs are mapped at /hubs/chat (not /api/hubs/chat)
    const hubUrl = `${baseUrl}/hubs/chat`

    // Check if we can use WebSocket directly (skipNegotiation only works with WebSocket)
    const useWebSocketOnly = true
    const skipNegotiation = useWebSocketOnly

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          // Get token from localStorage - try both 'token' and 'authToken'
          const token = localStorage.getItem('token') || localStorage.getItem('authToken') || ''
          return token
        },
        withCredentials: false,
        skipNegotiation: skipNegotiation, // Skip negotiation for faster WebSocket connection (only works with WebSocket transport)
        transport: signalR.HttpTransportType.WebSockets // Only use WebSocket for lowest latency
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount < 3) {
            return 1000 // Faster reconnection
          } else {
            return 5000
          }
        }
      })
      .configureLogging(signalR.LogLevel.Warning) // Reduce logging overhead
      .build()

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    if (!this.connection) return

    // Connection events
    this.connection.onclose((error) => {
      this.isConnected = false
      this.onConnectionStatusChanged?.(false)
      this.attemptReconnect()
    })

    this.connection.onreconnecting((error) => {
      this.isConnected = false
      this.onConnectionStatusChanged?.(false)
    })

    this.connection.onreconnected(() => {
      this.isConnected = true
      this.reconnectAttempts = 0
      this.onConnectionStatusChanged?.(true)
    })

    // Chat events
    this.connection.on('ReceiveMessage', (messageData: any) => {
      // Backend sends object with PascalCase, pass raw data to handler for transformation
      this.onMessageReceived?.(messageData)
    })

    this.connection.on('UserTyping', (data: any) => {
      // Backend sends object with ConversationId, UserId, IsTyping flag, etc.
      const userId = data?.UserId || data?.userId || data
      const conversationId = data?.ConversationId || data?.conversationId || ''
      const isTyping = data?.IsTyping !== false // Default to true if not specified

      // Validate data before calling handlers
      if (!conversationId || !userId) {
        return
      }

      if (isTyping) {
        this.onTypingStarted?.(String(userId), String(conversationId))
      } else {
        this.onTypingStopped?.(String(userId), String(conversationId))
      }
    })

    this.connection.on('UserJoined', (userId: string, conversationId: string) => {
      this.onUserJoined?.(userId, conversationId)
    })

    this.connection.on('UserLeft', (userId: string, conversationId: string) => {
      this.onUserLeft?.(userId, conversationId)
    })

    this.connection.on('MessageRead', (data: any) => {
      // Backend sends object with ConversationId, UserId, LastReadAt, etc.
      this.onMessageRead?.({
        conversationId: data?.ConversationId || data?.conversationId || 0,
        userId: data?.UserId || data?.userId,
        guestSessionId: data?.GuestSessionId || data?.guestSessionId,
        lastReadAt: data?.LastReadAt || data?.lastReadAt || new Date().toISOString()
      })
    })

    this.connection.on('NewConversation', (data: { conversationId: number; message: string; timestamp: string }) => {
      this.onNewConversation?.(data)
    })

    this.connection.on('CenterReassigned', (data: { conversationId: number; newCenterId: number; newStaffUserId: number; oldStaffUserId?: number; reason?: string; timestamp: string }) => {
      this.onCenterReassigned?.(data)
    })
  }

  async connect(): Promise<void> {
    // Check if we have a token before attempting connection
    const token = localStorage.getItem('token') || localStorage.getItem('authToken')
    if (!token) {
      this.isConnected = false
      return
    }

    if (!this.connection) {
      this.initializeConnection()
    }

    // Check connection state to avoid starting multiple times
    const state = this.connection.state
    if (state === signalR.HubConnectionState.Connected) {
      this.isConnected = true
      return
    }

    if (state === signalR.HubConnectionState.Connecting) {
      // Wait for connection to complete or fail
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        const checkState = () => {
          if (this.connection?.state === signalR.HubConnectionState.Connected) {
            clearTimeout(timeout)
            this.isConnected = true
            resolve()
          } else if (this.connection?.state === signalR.HubConnectionState.Disconnected) {
            clearTimeout(timeout)
            this.connection.start()
              .then(() => {
                this.isConnected = true
                this.reconnectAttempts = 0
                this.onConnectionStatusChanged?.(true)
                resolve()
              })
              .catch(reject)
          } else {
            setTimeout(checkState, 100)
          }
        }
        checkState()
      })
    }

    // Only start if disconnected
    if (state === signalR.HubConnectionState.Disconnected) {
      try {
        await this.connection.start()
        this.isConnected = true
        this.reconnectAttempts = 0
        this.onConnectionStatusChanged?.(true)
      } catch (error) {
        this.isConnected = false
        this.onConnectionStatusChanged?.(false)
        // Don't throw for 404 errors (backend might not have SignalR configured)
        if (error instanceof Error && error.message.includes('404')) {
          return
        }
        throw error
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.stop()
        this.isConnected = false
        this.onConnectionStatusChanged?.(false)
      } catch (error) {
        // Ignore disconnect errors
      }
    }
  }

  async joinConversation(conversationId: string): Promise<void> {
    if (!this.connection) {
      return
    }

    // Check actual connection state
    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    try {
      // Convert string to number as backend expects long
      const conversationIdNum = Number(conversationId)
      if (isNaN(conversationIdNum)) {
        return
      }
      await this.connection.invoke('JoinConversation', conversationIdNum)
    } catch (error) {
      // Don't throw - allow app to continue without SignalR
    }
  }

  async leaveConversation(conversationId: string): Promise<void> {
    if (!this.connection || !this.isConnected) {
      return
    }

    try {
      // Convert string to number as backend expects long
      const conversationIdNum = Number(conversationId)
      if (isNaN(conversationIdNum)) {
        return
      }
      await this.connection.invoke('LeaveConversation', conversationIdNum)
    } catch (error) {
      // Handle leave conversation error
    }
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }

    try {
      // Convert string to number as backend expects long
      const conversationIdNum = Number(conversationId)
      if (isNaN(conversationIdNum)) {
        throw new Error(`Invalid conversation ID: ${conversationId}`)
      }
      await this.connection.invoke('SendMessage', conversationIdNum, content)
    } catch (error) {
      throw error
    }
  }

  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    if (!this.connection) {
      return
    }

    // Check actual connection state and reconnect if disconnected
    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      // Try to reconnect if disconnected
      if (this.connection.state === signalR.HubConnectionState.Disconnected) {
        try {
          await this.connect()
          // After reconnecting, try to join conversation again
          await this.joinConversation(conversationId)
        } catch (error) {
          return
        }
      } else {
        // If connecting or reconnecting, just return (will retry later)
        return
      }
    }

    try {
      // Convert string to number as backend expects long
      const conversationIdNum = Number(conversationId)
      if (isNaN(conversationIdNum)) {
        return
      }
      // Backend uses NotifyTyping method with 4 parameters: conversationId, isTyping, userId, guestSessionId
      // userId and guestSessionId are optional, but SignalR requires all parameters to be sent
      // Backend expects userId as string?, not int?
      const currentUserId = localStorage.getItem('userId')
      const guestSessionId = localStorage.getItem('guestSessionId')
      await this.connection.invoke('NotifyTyping', conversationIdNum, isTyping, currentUserId || null, guestSessionId || null)
    } catch (error) {
      // Error handled silently
    }
  }

  async joinUserGroup(userId: string | number): Promise<void> {
    if (!this.connection) {
      return
    }

    // Check actual connection state
    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    try {
      await this.connection.invoke('JoinUserGroup', String(userId))
    } catch (error) {
      // Don't throw - allow app to continue without SignalR
    }
  }

  async leaveUserGroup(userId: string | number): Promise<void> {
    if (!this.connection || !this.isConnected) {
      return
    }

    try {
      await this.connection.invoke('LeaveUserGroup', String(userId))
    } catch (error) {
      // Handle leave user group error
    }
  }

  async notifyTyping(conversationId: string | number): Promise<void> {
    // Just send typing indicator - let MessageInput handle auto-stop
    await this.sendTypingIndicator(String(conversationId), true)
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        // Handle reconnection error
      }
    }, this.reconnectInterval)
  }

  // Event handler setters
  setOnMessageReceived(handler: (messageData: any) => void) {
    this.onMessageReceived = handler
  }

  setOnTypingStarted(handler: (userId: string, conversationId: string) => void) {
    this.onTypingStarted = handler
  }

  setOnTypingStopped(handler: (userId: string, conversationId: string) => void) {
    this.onTypingStopped = handler
  }

  setOnUserJoined(handler: (userId: string, conversationId: string) => void) {
    this.onUserJoined = handler
  }

  setOnUserLeft(handler: (userId: string, conversationId: string) => void) {
    this.onUserLeft = handler
  }

  setOnConnectionStatusChanged(handler: (isConnected: boolean) => void) {
    this.onConnectionStatusChanged = handler
  }

  setOnNewConversation(handler: (data: { conversationId: number; message: string; timestamp: string }) => void) {
    this.onNewConversation = handler
  }

  setOnCenterReassigned(handler: (data: { conversationId: number; newCenterId: number; newStaffUserId: number; oldStaffUserId?: number; reason?: string; timestamp: string }) => void) {
    this.onCenterReassigned = handler
  }

  setOnMessageRead(handler: (data: { conversationId: number; userId?: number; guestSessionId?: string; lastReadAt: string }) => void) {
    this.onMessageRead = handler
  }

  // Getters
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  getConnectionState(): signalR.HubConnectionState | undefined {
    return this.connection?.state
  }
}

// Create singleton instance
const signalRService = new SignalRService()

export default signalRService

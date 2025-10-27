import * as signalR from '@microsoft/signalr'
import type { ChatMessage } from '@/types/chat'

class SignalRService {
  private connection: signalR.HubConnection | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000

  // Event handlers
  private onMessageReceived?: (message: ChatMessage) => void
  private onTypingStarted?: (userId: string, conversationId: string) => void
  private onTypingStopped?: (userId: string, conversationId: string) => void
  private onUserJoined?: (userId: string, conversationId: string) => void
  private onUserLeft?: (userId: string, conversationId: string) => void
  private onConnectionStatusChanged?: (isConnected: boolean) => void

  constructor() {
    this.initializeConnection()
  }

  private initializeConnection() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001'
    const hubUrl = `${baseUrl}/chathub`

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          // Get token from localStorage or auth state
          return localStorage.getItem('token') || ''
        },
        withCredentials: false
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount < 3) {
            return 2000
          } else {
            return 10000
          }
        }
      })
      .configureLogging(signalR.LogLevel.Information)
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

    this.connection.onreconnected((connectionId) => {
      this.isConnected = true
      this.reconnectAttempts = 0
      this.onConnectionStatusChanged?.(true)
    })

    // Chat events
    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      this.onMessageReceived?.(message)
    })

    this.connection.on('UserTyping', (userId: string, conversationId: string) => {
      this.onTypingStarted?.(userId, conversationId)
    })

    this.connection.on('UserStoppedTyping', (userId: string, conversationId: string) => {
      this.onTypingStopped?.(userId, conversationId)
    })

    this.connection.on('UserJoined', (userId: string, conversationId: string) => {
      this.onUserJoined?.(userId, conversationId)
    })

    this.connection.on('UserLeft', (userId: string, conversationId: string) => {
      this.onUserLeft?.(userId, conversationId)
    })
  }

  async connect(): Promise<void> {
    if (!this.connection) {
      this.initializeConnection()
    }

    if (this.isConnected) {
      return
    }

    try {
      await this.connection.start()
      this.isConnected = true
      this.reconnectAttempts = 0
      this.onConnectionStatusChanged?.(true)
    } catch (error) {
      this.isConnected = false
      this.onConnectionStatusChanged?.(false)
      throw error
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
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }

    try {
      await this.connection.invoke('JoinConversation', conversationId)
    } catch (error) {
      throw error
    }
  }

  async leaveConversation(conversationId: string): Promise<void> {
    if (!this.connection || !this.isConnected) {
      return
    }

    try {
      await this.connection.invoke('LeaveConversation', conversationId)
    } catch (error) {
      // Handle leave conversation error
    }
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }

    try {
      await this.connection.invoke('SendMessage', conversationId, content)
    } catch (error) {
      throw error
    }
  }

  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    if (!this.connection || !this.isConnected) {
      return
    }

    try {
      if (isTyping) {
        await this.connection.invoke('StartTyping', conversationId)
      } else {
        await this.connection.invoke('StopTyping', conversationId)
      }
    } catch (error) {
      // Handle typing indicator error
    }
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
  setOnMessageReceived(handler: (message: ChatMessage) => void) {
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

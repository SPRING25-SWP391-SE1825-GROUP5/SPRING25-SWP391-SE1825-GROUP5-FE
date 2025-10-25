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
      console.log('SignalR connection closed:', error)
      this.isConnected = false
      this.onConnectionStatusChanged?.(false)
      this.attemptReconnect()
    })

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error)
      this.isConnected = false
      this.onConnectionStatusChanged?.(false)
    })

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId)
      this.isConnected = true
      this.reconnectAttempts = 0
      this.onConnectionStatusChanged?.(true)
    })

    // Chat events
    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      console.log('Received message:', message)
      this.onMessageReceived?.(message)
    })

    this.connection.on('UserTyping', (userId: string, conversationId: string) => {
      console.log('User typing:', userId, conversationId)
      this.onTypingStarted?.(userId, conversationId)
    })

    this.connection.on('UserStoppedTyping', (userId: string, conversationId: string) => {
      console.log('User stopped typing:', userId, conversationId)
      this.onTypingStopped?.(userId, conversationId)
    })

    this.connection.on('UserJoined', (userId: string, conversationId: string) => {
      console.log('User joined:', userId, conversationId)
      this.onUserJoined?.(userId, conversationId)
    })

    this.connection.on('UserLeft', (userId: string, conversationId: string) => {
      console.log('User left:', userId, conversationId)
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
      console.log('SignalR connected successfully')
      this.onConnectionStatusChanged?.(true)
    } catch (error) {
      console.error('SignalR connection failed:', error)
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
        console.log('SignalR disconnected')
        this.onConnectionStatusChanged?.(false)
      } catch (error) {
        console.error('SignalR disconnect error:', error)
      }
    }
  }

  async joinConversation(conversationId: string): Promise<void> {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }

    try {
      await this.connection.invoke('JoinConversation', conversationId)
      console.log('Joined conversation:', conversationId)
    } catch (error) {
      console.error('Failed to join conversation:', error)
      throw error
    }
  }

  async leaveConversation(conversationId: string): Promise<void> {
    if (!this.connection || !this.isConnected) {
      return
    }

    try {
      await this.connection.invoke('LeaveConversation', conversationId)
      console.log('Left conversation:', conversationId)
    } catch (error) {
      console.error('Failed to leave conversation:', error)
    }
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR not connected')
    }

    try {
      await this.connection.invoke('SendMessage', conversationId, content)
      console.log('Message sent:', conversationId, content)
    } catch (error) {
      console.error('Failed to send message:', error)
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
      console.error('Failed to send typing indicator:', error)
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('Reconnection failed:', error)
        this.attemptReconnect()
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

import React, { useEffect, useState } from 'react'
import StaffChatInterface from '@/components/chat/StaffChatInterface'
import signalRService from '@/services/signalRService'
import type { ChatMessage } from '@/types/chat'

const StaffChat: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize SignalR connection
    const initializeSignalR = async () => {
      try {
        // Set up event handlers
        signalRService.setOnMessageReceived((message: ChatMessage) => {

          // Handle new message - could trigger notifications, update UI, etc.
        })

        signalRService.setOnTypingStarted((userId: string, conversationId: string) => {

          // Handle typing indicator
        })

        signalRService.setOnTypingStopped((userId: string, conversationId: string) => {

          // Handle typing indicator
        })

        signalRService.setOnUserJoined((userId: string, conversationId: string) => {

          // Handle user joined
        })

        signalRService.setOnUserLeft((userId: string, conversationId: string) => {

          // Handle user left
        })

        signalRService.setOnConnectionStatusChanged((connected: boolean) => {
          setIsConnected(connected)
          if (connected) {
            setConnectionError(null)
          }
        })

        // Connect to SignalR
        await signalRService.connect()

      } catch (error) {

        setConnectionError('Không thể kết nối đến máy chủ chat. Vui lòng thử lại sau.')
      }
    }

    initializeSignalR()

    // Cleanup on unmount
    return () => {
      signalRService.disconnect()
    }
  }, [])

  return (
    <div className="staff-chat-page">
      <div className="staff-chat-page__header">
        <h1>Staff Chat</h1>
        <div className="staff-chat-page__status">
          <div className={`staff-chat-page__status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="staff-chat-page__status-dot"></div>
            <span>{isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
          </div>
        </div>
      </div>

      {connectionError && (
        <div className="staff-chat-page__error">
          <div className="staff-chat-page__error-content">
            <span>⚠️</span>
            <span>{connectionError}</span>
          </div>
        </div>
      )}

      <div className="staff-chat-page__content">
        <StaffChatInterface />
      </div>
    </div>
  )
}

export default StaffChat

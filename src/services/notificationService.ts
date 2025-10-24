/**
 * Notification Service for Staff Chat
 * Handles browser notifications and sound alerts
 */

class NotificationService {
  private permission: NotificationPermission = 'default'
  private isEnabled = true

  constructor() {
    this.initialize()
  }

  private async initialize() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      this.isEnabled = false
      return
    }

    // Request permission
    this.permission = await this.requestPermission()
  }

  private async requestPermission(): Promise<NotificationPermission> {
    if (this.permission === 'granted') {
      return 'granted'
    }

    if (this.permission === 'denied') {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  // Show notification for new message
  async showMessageNotification(
    senderName: string, 
    message: string, 
    conversationId: string
  ): Promise<void> {
    if (!this.isEnabled || this.permission !== 'granted') {
      return
    }

    try {
      const notification = new Notification(`Tin nhắn mới từ ${senderName}`, {
        body: message.length > 100 ? message.substring(0, 100) + '...' : message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `chat-${conversationId}`,
        requireInteraction: false,
        silent: false
      })

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Handle click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  // Play notification sound
  playNotificationSound(): void {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create a simple beep sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.error('Error playing notification sound:', error)
    }
  }

  // Show typing notification
  async showTypingNotification(senderName: string, conversationId: string): Promise<void> {
    if (!this.isEnabled || this.permission !== 'granted') {
      return
    }

    try {
      const notification = new Notification(`${senderName} đang nhập...`, {
        body: 'Đang nhập tin nhắn',
        icon: '/favicon.ico',
        tag: `typing-${conversationId}`,
        requireInteraction: false,
        silent: true
      })

      // Auto close after 2 seconds
      setTimeout(() => {
        notification.close()
      }, 2000)
    } catch (error) {
      console.error('Error showing typing notification:', error)
    }
  }

  // Check if notifications are enabled
  isNotificationEnabled(): boolean {
    return this.isEnabled && this.permission === 'granted'
  }

  // Enable/disable notifications
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission
  }

  // Request permission again
  async requestPermissionAgain(): Promise<NotificationPermission> {
    this.permission = await this.requestPermission()
    return this.permission
  }
}

// Create singleton instance
const notificationService = new NotificationService()

export default notificationService

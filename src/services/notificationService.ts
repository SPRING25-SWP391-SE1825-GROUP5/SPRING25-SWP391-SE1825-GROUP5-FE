import api from './api'

export interface Notification {
  notificationId: number
  userId: number
  title: string
  message: string
  createdAt: string
  readAt: string | null
  type: string
  status: 'NEW' | 'READ'
}

export interface NotificationResponse {
  success: boolean
  message: string
  data: Notification[]
}

export interface UnreadCountResponse {
  success: boolean
  message: string
  data: {
    unreadCount: number
  }
}

export const NotificationService = {
  // Lấy danh sách thông báo của user hiện tại
  async getMyNotifications(): Promise<NotificationResponse> {
    try {
      const { data } = await api.get('/Notification/my-notifications')
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể tải danh sách thông báo',
        data: []
      }
    }
  },

  // Đánh dấu thông báo đã đọc
  async markAsRead(notificationId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { data } = await api.put(`/Notification/${notificationId}/read`)
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể đánh dấu thông báo đã đọc'
      }
    }
  },

  // Lấy số lượng thông báo chưa đọc
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const { data } = await api.get('/Notification/unread-count')
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Không thể tải số lượng thông báo chưa đọc',
        data: { unreadCount: 0 }
      }
    }
  },

  // Play notification sound
  playNotificationSound(): void {
    try {
      const audio = new Audio('/notification-sound.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        // Ignore errors if audio can't play
      })
    } catch (error) {
      // Ignore errors
    }
  },

  // Show message notification
  showMessageNotification(senderName: string, content: string, conversationId: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Tin nhắn từ ${senderName}`, {
        body: content,
        icon: '/favicon.ico',
        tag: conversationId
      })
    }
  }
}
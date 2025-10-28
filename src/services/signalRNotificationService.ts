import * as signalR from '@microsoft/signalr'
import toast from 'react-hot-toast'

export interface SignalRNotification {
  notificationId: number
  userId: number
  title: string
  message: string
  createdAt: string
  type: string
  status: 'NEW' | 'READ'
  readAt: string | null
}

class SignalRService {
  private connection: signalR.HubConnection | null = null
  private isConnected = false
  private onNotificationReceived?: (notification: SignalRNotification) => void
  private onUnreadCountUpdate?: (count: number) => void
  private isConnecting = false

  async connect(token: string): Promise<void> {
    try {
      // Nếu đã kết nối rồi thì không kết nối lại
      if (this.connection && this.isConnected) {
        return
      }

      // Nếu đang kết nối thì không kết nối lại
      if (this.isConnecting) {
        return
      }

      this.isConnecting = true

      // Disconnect nếu đã kết nối trước đó
      if (this.connection) {
        await this.disconnect()
      }

      // Sử dụng đúng endpoint SignalR Hub
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001/api'
      const hubUrl = baseUrl.replace('/api', '') + '/hubs/booking'
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build()

      // Lắng nghe thông báo từ server
      this.connection.on('ReceiveNotification', (notification: SignalRNotification) => {
        this.handleNotification(notification)
      })

      // Lắng nghe connection events
      this.connection.onclose(() => {
        this.isConnected = false
      })

      this.connection.onreconnecting(() => {
        // Reconnecting...
      })

      this.connection.onreconnected(() => {
        this.isConnected = true
      })

      await this.connection.start()
      this.isConnected = true
      this.isConnecting = false
      
      // Join Staff group để nhận notifications cho technician
      try {
        await this.connection.invoke('JoinStaffGroup')
      } catch {
        // Could not join group
      }
    } catch {
      this.isConnected = false
      this.isConnecting = false
    }
  }

  private handleNotification(notification: SignalRNotification): void {
    // Hiển thị toast notification
    this.showToast(notification)
    
    // Gọi callback để cập nhật UI
    if (this.onNotificationReceived) {
      this.onNotificationReceived(notification)
    }
    
    // Cập nhật unread count (chỉ tăng nếu notification mới)
    if (notification.status === 'NEW' && this.onUnreadCountUpdate) {
      this.onUnreadCountUpdate(1)
    }
  }

  private showToast(notification: SignalRNotification): void {
    toast.success(notification.message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#363636',
        color: '#fff',
      },
    })
  }

  // Đăng ký callback để nhận thông báo
  onNotification(callback: (notification: SignalRNotification) => void): void {
    this.onNotificationReceived = callback
  }

  // Đăng ký callback để cập nhật unread count
  onUnreadCountChange(callback: (count: number) => void): void {
    this.onUnreadCountUpdate = callback
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop()
      this.isConnected = false
      this.isConnecting = false
    }
  }

  getConnectionState(): boolean {
    return this.isConnected
  }

  // Method để disconnect khi logout
  async forceDisconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
      this.isConnected = false
      this.isConnecting = false
    }
  }
}

export default new SignalRService()

import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, RefreshCw } from 'lucide-react'
import { NotificationService, Notification } from '@/services/notificationService'
import signalRService from '@/services/signalRNotificationService'
import { useAppSelector } from '@/store/hooks'
import './NotificationBell.scss'

interface NotificationBellProps {
  className?: string
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const callbacksRegistered = useRef(false)
  
  const { user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Lấy token từ Redux hoặc localStorage
    const token = user?.token || localStorage.getItem('token')
    
    if (token) {
      loadNotifications()
      loadUnreadCount()
      
      // Kết nối SignalR (chỉ kết nối nếu chưa kết nối)
      signalRService.connect(token)
      
      // Đăng ký callback để nhận thông báo real-time (chỉ đăng ký một lần)
      if (!callbacksRegistered.current) {
        signalRService.onNotification((notification) => {
          setNotifications(prev => [notification, ...prev])
          // Chỉ tăng unread count nếu notification mới
          if (notification.status === 'NEW') {
            setUnreadCount(prev => prev + 1)
          }
        })
        
        signalRService.onUnreadCountChange((count) => {
          setUnreadCount(prev => prev + count)
        })
        
        callbacksRegistered.current = true
      }
    }

    // Không disconnect trong cleanup để giữ connection
    return () => {
      // Chỉ cleanup callbacks, không disconnect SignalR
    }
  }, [user?.id]) // Chỉ re-run khi user ID thay đổi (login/logout)

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await NotificationService.getMyNotifications()
      if (response.success) {
        setNotifications(response.data)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await NotificationService.getUnreadCount()
      if (response.success) {
        setUnreadCount(response.data.unreadCount)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await NotificationService.markAsRead(notificationId)
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => {
            if (n.notificationId === notificationId && n.status === 'NEW') {
              // Chỉ giảm unread count nếu notification chưa đọc
              setUnreadCount(prev => Math.max(0, prev - 1))
              return { ...n, readAt: new Date().toISOString(), status: 'READ' }
            }
            return n
          })
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    return date.toLocaleDateString('vi-VN')
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
    if (!showDropdown) {
      loadNotifications()
    }
  }

  return (
    <div className={`notification-bell ${className}`} ref={dropdownRef}>
      <button 
        className="notification-bell__trigger"
        onClick={toggleDropdown}
        aria-label="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <h3>Thông báo</h3>
            <button 
              className="notification-bell__refresh"
              onClick={loadNotifications}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            </button>
          </div>

          <div className="notification-bell__content">
            {loading ? (
              <div className="notification-bell__loading">
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-bell__empty">
                Không có thông báo nào
              </div>
            ) : (
              <div className="notification-bell__list">
                {notifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`notification-bell__item ${
                      notification.status === 'NEW' ? 'unread' : ''
                    }`}
                    onClick={() => markAsRead(notification.notificationId)}
                  >
                    <div className="notification-bell__item-content">
                      <div className="notification-bell__item-header">
                        <h4 className="notification-bell__item-title">
                          {notification.title}
                        </h4>
                        {notification.status === 'NEW' && (
                          <div className="notification-bell__item-dot" />
                        )}
                      </div>
                      <p className="notification-bell__item-message">
                        {notification.message}
                      </p>
                      <span className="notification-bell__item-time">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell

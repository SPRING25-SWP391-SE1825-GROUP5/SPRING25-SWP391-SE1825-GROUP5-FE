import { useState, useEffect, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { NotificationService, Notification } from '@/services/notificationService'
import './ProfileNotifications.scss'
 
const ITEMS_PER_PAGE = 7

export default function ProfileNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await NotificationService.getMyNotifications()
      
      if (response && response.success && Array.isArray(response.data)) {
        setNotifications(response.data)
        setCurrentPage(1) // Reset về trang 1 khi load lại
      } else {
        setNotifications([])
      }
    } catch (error) {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const notification = notifications.find(n => n.notificationId === notificationId)
      
      if (!notification || notification.status !== 'NEW') {
        return
      }

      const response = await NotificationService.markAsRead(notificationId)
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => {
            if (n.notificationId === notificationId && n.status === 'NEW') {
              return { ...n, readAt: new Date().toISOString(), status: 'READ' }
            }
            return n
          })
        )
      }
    } catch (error) {
      // Silent fail
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status === 'NEW')
      
      if (unreadNotifications.length === 0) {
        return
      }

      // Mark tất cả thông báo chưa đọc thành đã đọc
      const markPromises = unreadNotifications.map(notification => 
        NotificationService.markAsRead(notification.notificationId)
      )
      
      const results = await Promise.allSettled(markPromises)
      
      // Cập nhật state sau khi mark thành công
      const successIds = results
        .map((result, index) => 
          result.status === 'fulfilled' && result.value.success 
            ? unreadNotifications[index].notificationId 
            : null
        )
        .filter(id => id !== null) as number[]

      if (successIds.length > 0) {
        setNotifications(prev => 
          prev.map(n => {
            if (n.status === 'NEW' && successIds.includes(n.notificationId)) {
              return { ...n, readAt: new Date().toISOString(), status: 'READ' }
            }
            return n
          })
        )
      }
    } catch (error) {
      // Silent fail
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE)
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return notifications.slice(startIndex, endIndex)
  }, [notifications, currentPage])

  // Tự động mark as read khi notification được hiển thị (sau 2 giây)
  useEffect(() => {
    if (paginatedNotifications.length === 0) return

    const timer = setTimeout(() => {
      paginatedNotifications.forEach(notification => {
        if (notification.status === 'NEW') {
          // Chỉ mark notification hiện tại đang được hiển thị
          const notificationId = notification.notificationId
          markAsRead(notificationId)
        }
      })
    }, 2000) // Auto mark sau 2 giây khi xem

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, paginatedNotifications.length])

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      // Hiển thị tất cả số trang nếu <= 7
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Logic phân trang với ellipsis
      if (currentPage <= 3) {
        // Trang đầu: 1 2 3 ... last
        for (let i = 1; i <= 3; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Trang cuối: 1 ... (n-2) (n-1) n
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Trang giữa: 1 ... (current-1) current (current+1) ... last
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFirstPage = () => handlePageChange(1)
  const handlePrevPage = () => handlePageChange(currentPage - 1)
  const handleNextPage = () => handlePageChange(currentPage + 1)
  const handleLastPage = () => handlePageChange(totalPages)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    
    // Format: DD/MM/YYYY HH:mm
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const translateStatus = (message: string): string => {
    return message
      .replace(/COMPLETED/g, 'Hoàn thành')
      .replace(/IN_PROGRESS/g, 'Đang xử lý')
      .replace(/CONFIRMED/g, 'Đã xác nhận')
      .replace(/PENDING/g, 'Chờ xác nhận')
      .replace(/CANCELLED/g, 'Đã hủy')
      .replace(/PAID/g, 'Đã thanh toán')
  }

  return (
    <div className="profile-v2__section">
      <div className="profile-notifications">
        <div className="profile-notifications__header">
          <h2 className="profile-notifications__title">Thông báo</h2>
          <div className="profile-notifications__header-actions">
            {notifications.some(n => n.status === 'NEW') && (
              <button
                className="profile-notifications__mark-all-read"
                onClick={markAllAsRead}
                title="Đánh dấu tất cả đã đọc"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
            <button 
              className="profile-notifications__refresh"
              onClick={loadNotifications}
              disabled={loading}
              title="Làm mới"
            >
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="profile-notifications__loading">
            <div className="profile-notifications__spinner"></div>
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="profile-notifications__empty">
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              Bạn chưa có thông báo nào.
            </p>
            <p style={{ fontSize: '14px', color: '#999', margin: '8px 0 0 0' }}>
              Các thông báo về đơn hàng, khuyến mãi và cập nhật sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <>
            <div className="profile-notifications__list">
              {paginatedNotifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className={`profile-notifications__item ${
                    notification.status === 'NEW' ? 'unread' : ''
                  }`}
                  onClick={() => {
                    if (notification.status === 'NEW') {
                      markAsRead(notification.notificationId)
                    }
                  }}
                >
                  <div className="profile-notifications__item-content">
                    <div className="profile-notifications__item-header">
                      <h4 className="profile-notifications__item-title">
                        {notification.title}
                      </h4>
                      {notification.status === 'NEW' && (
                        <div className="profile-notifications__item-dot" />
                      )}
                    </div>
                    <p className="profile-notifications__item-message">
                      {translateStatus(notification.message)}
                    </p>
                    <div className="profile-notifications__item-footer">
                      <span className="profile-notifications__item-time">
                        {formatTime(notification.createdAt)}
                      </span>
                      {notification.type && (
                        <span className="profile-notifications__item-type">
                          {notification.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="profile-notifications__pagination">
                <button
                  className="profile-notifications__pagination-btn"
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  title="Trang đầu"
                >
                  «
                </button>
                <button
                  className="profile-notifications__pagination-btn"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  title="Trang trước"
                >
                  ‹
                </button>
                
                {getPageNumbers().map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="profile-notifications__pagination-ellipsis">
                        ...
                      </span>
                    )
                  }
                  
                  const pageNum = page as number
                  return (
                    <button
                      key={pageNum}
                      className={`profile-notifications__pagination-number ${
                        currentPage === pageNum ? 'active' : ''
                      }`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  className="profile-notifications__pagination-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  title="Trang sau"
                >
                  ›
                </button>
                <button
                  className="profile-notifications__pagination-btn"
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages}
                  title="Trang cuối"
                >
                  »
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


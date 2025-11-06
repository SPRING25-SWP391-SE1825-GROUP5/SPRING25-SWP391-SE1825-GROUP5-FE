import { useState, useEffect } from 'react'
import { Search, Filter, Star, MessageSquare, Calendar, User, Wrench, Package, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { FeedbackCard } from '@/components/feedback'
import { BookingData, feedbackService } from '@/services/feedbackService'
import { FeedbackData } from '@/components/feedback'
import './customer.scss'
import './MaintenanceHistory.scss'

export default function MaintenanceHistory() {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feedbackFilter, setFeedbackFilter] = useState('all')

  // Load bookings data
  const loadBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await feedbackService.getBookingsWithFeedback()
      setBookings(data)
    } catch (err: any) {
      setError('Không thể tải dữ liệu lịch sử bảo dưỡng')

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  // Handle feedback submission
  const handleSubmitFeedback = async (bookingId: string, feedback: FeedbackData) => {
    try {
      await feedbackService.submitFeedback(bookingId, 0, feedback)
      // Reload data to show updated feedback
      await loadBookings()
    } catch (err: any) {
      setError('Không thể gửi đánh giá')

    }
  }

  // Handle feedback update
  const handleEditFeedback = async (bookingId: string, feedback: FeedbackData) => {
    try {
      await feedbackService.updateFeedback(Number(bookingId), feedback)
      // Reload data to show updated feedback
      await loadBookings()
    } catch (err: any) {
      setError('Không thể cập nhật đánh giá')

    }
  }

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.partsUsed.some(part => part.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    const matchesFeedback = feedbackFilter === 'all' || 
                           (feedbackFilter === 'rated' && booking.feedback) ||
                           (feedbackFilter === 'not-rated' && !booking.feedback)
    
    return matchesSearch && matchesStatus && matchesFeedback
  })

  // Get statistics
  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    rated: bookings.filter(b => b.feedback).length,
    pending: bookings.filter(b => b.status === 'pending').length
  }

  return (
    <section className="maintenance-history">
      {/* Header */}
      <div className="maintenance-history__header">
        <div className="maintenance-history__header__info">
          <h1 className="maintenance-history__header__info__title">
            <Calendar className="maintenance-history__header__info__title__icon" size={32} />
            Lịch sử bảo dưỡng
          </h1>
          <p className="maintenance-history__header__info__description">
            Xem lịch sử dịch vụ và đánh giá trải nghiệm của bạn
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="maintenance-history__stats">
        <div className="maintenance-history__stats__card">
          <div className="maintenance-history__stats__card__icon">
            <Calendar size={20} />
          </div>
          <div className="maintenance-history__stats__card__content">
            <div className="maintenance-history__stats__card__content__value">
              {stats.total}
            </div>
            <div className="maintenance-history__stats__card__content__label">
              Tổng dịch vụ
            </div>
          </div>
        </div>

        <div className="maintenance-history__stats__card">
          <div className="maintenance-history__stats__card__icon">
            <CheckCircle size={20} />
          </div>
          <div className="maintenance-history__stats__card__content">
            <div className="maintenance-history__stats__card__content__value">
              {stats.completed}
            </div>
            <div className="maintenance-history__stats__card__content__label">
              Đã hoàn thành
            </div>
          </div>
        </div>

        <div className="maintenance-history__stats__card">
          <div className="maintenance-history__stats__card__icon">
            <Star size={20} />
          </div>
          <div className="maintenance-history__stats__card__content">
            <div className="maintenance-history__stats__card__content__value">
              {stats.rated}
            </div>
            <div className="maintenance-history__stats__card__content__label">
              Đã đánh giá
            </div>
          </div>
        </div>

        <div className="maintenance-history__stats__card">
          <div className="maintenance-history__stats__card__icon">
            <AlertCircle size={20} />
          </div>
          <div className="maintenance-history__stats__card__content">
            <div className="maintenance-history__stats__card__content__value">
              {stats.pending}
            </div>
            <div className="maintenance-history__stats__card__content__label">
              Chờ xử lý
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="maintenance-history__filters">
        <div className="maintenance-history__filters__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm theo dịch vụ, kỹ thuật viên, phụ tùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="maintenance-history__filters__selects">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Hoàn thành</option>
            <option value="in-progress">Đang thực hiện</option>
            <option value="pending">Chờ xử lý</option>
          </select>

          <select
            value={feedbackFilter}
            onChange={(e) => setFeedbackFilter(e.target.value)}
          >
            <option value="all">Tất cả đánh giá</option>
            <option value="rated">Đã đánh giá</option>
            <option value="not-rated">Chưa đánh giá</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="maintenance-history__error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="maintenance-history__loading">
          <Loader2 size={32} className="animate-spin" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="maintenance-history__list">
          {filteredBookings.length === 0 ? (
            <div className="maintenance-history__empty">
              <div className="maintenance-history__empty__icon">
                <Calendar size={64} />
              </div>
              <h3 className="maintenance-history__empty__title">
                Không có dịch vụ nào
              </h3>
              <p className="maintenance-history__empty__description">
                {searchTerm || statusFilter !== 'all' || feedbackFilter !== 'all'
                  ? 'Không tìm thấy dịch vụ phù hợp với bộ lọc'
                  : 'Bạn chưa có dịch vụ nào trong hệ thống'
                }
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <FeedbackCard
                key={booking.id}
                booking={booking}
                onSubmitFeedback={handleSubmitFeedback}
                onEditFeedback={handleEditFeedback}
              />
            ))
          )}
        </div>
      )}
    </section>
  )
}

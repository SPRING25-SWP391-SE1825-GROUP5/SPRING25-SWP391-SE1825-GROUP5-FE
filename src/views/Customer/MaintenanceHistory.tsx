import { useState, useEffect } from 'react'
import { Search, Filter, Star, MessageSquare, Calendar, User, Wrench, Package, AlertCircle, CheckCircle, Loader2, CreditCard } from 'lucide-react'
import { FeedbackCard } from '@/components/feedback'
import { BookingData, feedbackService } from '@/services/feedbackService'
import { FeedbackData } from '@/components/feedback'
import './customer.scss'
import './MaintenanceHistory.scss'
import { WorkOrderPartService } from '@/services/workOrderPartService'
import PartsApproval from '@/components/booking/PartsApproval'
import PaymentModal from '@/components/payment/PaymentModal'
import { BookingService } from '@/services/bookingService'
import toast from 'react-hot-toast'

export default function MaintenanceHistory() {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feedbackFilter, setFeedbackFilter] = useState('all')
  const [selectedBookingForApproval, setSelectedBookingForApproval] = useState<BookingData | null>(null)
  const [parts, setParts] = useState<Record<string, any[]>>({})
  const [loadingParts, setLoadingParts] = useState(false)
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<{ bookingId: number; totalAmount: number } | null>(null)
  const [loadingBookingDetail, setLoadingBookingDetail] = useState(false)

  // Load bookings data
  const loadBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await feedbackService.getBookingsWithFeedback()
      setBookings(data)
    } catch (err: any) {
      setError('Không thể tải dữ liệu lịch sử bảo dưỡng')
      console.error('Error loading bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const openApprovalModal = async (booking: BookingData) => {
    setSelectedBookingForApproval(booking)
    setLoadingParts(true)
    try {
      const items = await WorkOrderPartService.list(Number(booking.id))
      setParts(prev => ({ ...prev, [booking.id]: items }))
    } catch {
      setParts(prev => ({ ...prev, [booking.id]: [] }))
    } finally {
      setLoadingParts(false)
    }
  }

  const closeApprovalModal = () => {
    setSelectedBookingForApproval(null)
  }

  // Xử lý mở modal thanh toán
  const handleOpenPaymentModal = async (bookingId: string) => {
    setLoadingBookingDetail(true)
    try {
      const bookingDetail = await BookingService.getBookingDetail(Number(bookingId))
      if (bookingDetail?.success && bookingDetail?.data) {
        const totalAmount = bookingDetail.data.totalAmount || 0
        setSelectedBookingForPayment({ bookingId: Number(bookingId), totalAmount })
      } else {
        toast.error('Không thể lấy thông tin booking')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải thông tin thanh toán')
    } finally {
      setLoadingBookingDetail(false)
    }
  }

  const handleClosePaymentModal = () => {
    setSelectedBookingForPayment(null)
  }

  const handlePaymentSuccess = async () => {
    // Reload lại danh sách booking sau khi thanh toán thành công
    await loadBookings()
    handleClosePaymentModal()
  }

  // Handle feedback submission
  const handleSubmitFeedback = async (bookingId: string, feedback: FeedbackData) => {
    try {
      await feedbackService.submitFeedback(bookingId, 0, feedback)
      // Reload data to show updated feedback
      await loadBookings()
    } catch (err: any) {
      setError('Không thể gửi đánh giá')
      console.error('Error submitting feedback:', err)
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
      console.error('Error updating feedback:', err)
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
              <div key={booking.id} style={{ position: 'relative' }}>
                <FeedbackCard
                  booking={booking}
                  onSubmitFeedback={handleSubmitFeedback}
                  onEditFeedback={handleEditFeedback}
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {/* Nút phê duyệt phụ tùng - chỉ hiển thị khi cần */}
                  {booking.status === 'in-progress' && (
                    <button
                      onClick={() => openApprovalModal(booking)}
                      className="btn-primary"
                      style={{ padding: '8px 12px' }}
                    >
                      Phê duyệt phụ tùng
                    </button>
                  )}
                  {/* Nút thanh toán - chỉ hiển thị khi đã COMPLETED */}
                  {booking.status === 'completed' && (
                    <button
                      onClick={() => handleOpenPaymentModal(booking.id)}
                      disabled={loadingBookingDetail}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#10B981',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: loadingBookingDetail ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        opacity: loadingBookingDetail ? 0.7 : 1
                      }}
                    >
                      <CreditCard size={16} />
                      {loadingBookingDetail ? 'Đang tải...' : 'Thanh toán'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Approval Modal */}
      {selectedBookingForApproval && (
        <div className="approval-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: 'min(900px, 92vw)', maxHeight: '84vh', overflow: 'auto', background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--border-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Phê duyệt phụ tùng — Booking #{selectedBookingForApproval.id}</h3>
              <button onClick={closeApprovalModal} className="btn-secondary" style={{ background: 'transparent', border: '1px solid var(--border-primary)' }}>Đóng</button>
            </div>
            {loadingParts ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải danh sách phụ tùng...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {(parts[String(selectedBookingForApproval.id)] || []).map((p: any) => (
                  <PartsApproval 
                    key={p.id} 
                    bookingId={Number(selectedBookingForApproval.id)} 
                    workOrderPartId={p.id} 
                    partId={p.partId} 
                    partName={p.partName} 
                    mode="customer"
                    status={p.status}
                    onApproved={async () => {
                      // Reload lại danh sách sau khi approve/reject
                      if (selectedBookingForApproval) {
                        setLoadingParts(true)
                        try {
                          const items = await WorkOrderPartService.list(Number(selectedBookingForApproval.id))
                          setParts(prev => ({ ...prev, [selectedBookingForApproval.id]: items }))
                        } finally {
                          setLoadingParts(false)
                        }
                      }
                    }}
                  />
                ))}
                {(parts[String(selectedBookingForApproval.id)] || []).length === 0 && (
                  <div style={{ padding: 16, color: 'var(--text-secondary)' }}>Không có phụ tùng cần phê duyệt.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedBookingForPayment && (
        <PaymentModal
          bookingId={selectedBookingForPayment.bookingId}
          totalAmount={selectedBookingForPayment.totalAmount}
          open={!!selectedBookingForPayment}
          onClose={handleClosePaymentModal}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </section>
  )
}

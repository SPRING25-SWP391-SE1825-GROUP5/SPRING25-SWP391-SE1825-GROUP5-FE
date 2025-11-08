import { useState, useEffect } from 'react'
import { BookingService, type CustomerBooking } from '@/services/bookingService'
import { CustomerService } from '@/services/customerService'
import { useAppSelector } from '@/store/hooks'
import { PayOSService } from '@/services/payOSService'
import toast from 'react-hot-toast'
import BookingHistoryCard from './BookingHistoryCard'
import PaymentModal from '@/components/payment/PaymentModal'

export default function ProfileHistory() {
  const user = useAppSelector((state) => state.auth.user)
  const [bookings, setBookings] = useState<CustomerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null)
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null)
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null)
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<{ bookingId: number; totalAmount: number } | null>(null)
  const [loadingBookingDetail, setLoadingBookingDetail] = useState(false)
  const itemsPerPage = 5

  useEffect(() => {
    const loadBookings = async () => {
      if (!user?.id) {
        setLoading(false)
        setBookings([])
        return
      }

      try {
        setLoading(true)

        // Get customerId - check user first, then load from API
        let currentCustomerId = user.customerId
        if (!currentCustomerId) {
          try {
            const customerResponse = await CustomerService.getCurrentCustomer()
            if (customerResponse.success && customerResponse.data) {
              currentCustomerId = customerResponse.data.customerId
            }
          } catch (error) {

            setLoading(false)
            setBookings([])
            return
          }
        }

        if (!currentCustomerId) {
          setLoading(false)
          setBookings([])
          return
        }

        // Load bookings using CustomerService (has pagination support)
        const response = await CustomerService.getCustomerBookings(currentCustomerId, { pageNumber: 1, pageSize: 100 })

        let bookingsArray: CustomerBooking[] = []
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            bookingsArray = response.data
          } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
            bookingsArray = response.data.bookings
          }
        }

        setBookings(bookingsArray)
      } catch (error: unknown) {
        const err = error as { message?: string }
        toast.error(err.message || 'Không thể tải lịch sử đặt lịch')
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [user?.id, user?.customerId])

  // Ensure bookings is always an array before rendering
  const bookingsArray = Array.isArray(bookings) ? bookings : []

  // Find newest booking (highest bookingId or latest createdAt)
  const newestBookingId = bookingsArray.length > 0
    ? bookingsArray.reduce((newest, booking) => {
        if (!newest) return booking
        const newestDate = new Date(newest.createdAt || 0).getTime()
        const bookingDate = new Date(booking.createdAt || 0).getTime()
        return bookingDate > newestDate || (bookingDate === newestDate && booking.bookingId > newest.bookingId)
          ? booking : newest
      }).bookingId
    : null

  // Calculate pagination
  const totalPages = Math.ceil(bookingsArray.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBookings = bookingsArray.slice(startIndex, endIndex)

  // Reset to page 1 when bookings change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [bookingsArray.length, currentPage, totalPages])

  // Handle cancel booking
  const handleCancelBooking = async (bookingId: number) => {
    try {
      setCancellingBookingId(bookingId)
      const result = await BookingService.cancelBooking(bookingId)

      if (result.success) {
        // Update booking status in state
        setBookings(prev => prev.map(booking =>
          booking.bookingId === bookingId
            ? { ...booking, status: 'CANCELLED' }
            : booking
        ))
        toast.success('Đã hủy đặt lịch thành công')

        // Close expanded section if this booking was expanded
        if (expandedBookingId === bookingId) {
          setExpandedBookingId(null)
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Không thể hủy đặt lịch')
    } finally {
      setCancellingBookingId(null)
    }
  }

  // Handle payment - mở modal thanh toán
  const handlePayment = async (bookingId: number) => {
    setProcessingPaymentId(bookingId)
    setLoadingBookingDetail(true)
    try {
      const bookingDetail = await BookingService.getBookingDetail(bookingId)
      if (bookingDetail?.success && bookingDetail?.data) {
        const totalAmount = bookingDetail.data.totalAmount || 0
        setSelectedBookingForPayment({ bookingId, totalAmount })
      } else {
        toast.error('Không thể lấy thông tin booking')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải thông tin thanh toán')
    } finally {
      setLoadingBookingDetail(false)
      setProcessingPaymentId(null)
    }
  }

  const handleClosePaymentModal = () => {
    setSelectedBookingForPayment(null)
  }

  const handlePaymentSuccess = async () => {
    // Reload lại danh sách booking sau khi thanh toán thành công
    if (!user?.id) return
    
    try {
      setLoading(true)
      let currentCustomerId = user.customerId
      if (!currentCustomerId) {
        const customerResponse = await CustomerService.getCurrentCustomer()
        if (customerResponse.success && customerResponse.data) {
          currentCustomerId = customerResponse.data.customerId
        }
      }

      if (currentCustomerId) {
        const response = await CustomerService.getCustomerBookings(currentCustomerId, { pageNumber: 1, pageSize: 100 })
        let bookingsArray: CustomerBooking[] = []
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            bookingsArray = response.data
          } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
            bookingsArray = response.data.bookings
          }
        }
        setBookings(bookingsArray)
      }
    } catch (error) {
      console.error('Error reloading bookings:', error)
    } finally {
      setLoading(false)
      handleClosePaymentModal()
    }
  }

  if (loading) {
    return (
      <div className="profile-v2__section">
        <div className="profile-v2__empty">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-v2__section">
        <div className="profile-v2__empty">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              Vui lòng đăng nhập để xem lịch sử đặt lịch.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (bookingsArray.length === 0) {
    return (
      <div className="profile-v2__section">
        <div className="profile-v2__empty">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              Bạn chưa có lịch sử đặt lịch nào.
            </p>
            <p style={{ fontSize: '14px', color: '#999', margin: '8px 0 0 0' }}>
              Lịch sử các lần đặt lịch dịch vụ sẽ được hiển thị tại đây.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-v2__section">
      <div className="card-header" style={{ padding: '0 0 8px' }}>
        <h3 className="card-title">Lịch sử đặt lịch</h3>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px 0'
      }}>
        {currentBookings.map((booking) => {
          return (
            <BookingHistoryCard
              key={booking.bookingId}
              booking={booking}
              isNewest={booking.bookingId === newestBookingId}
              isExpanded={expandedBookingId === booking.bookingId}
              onToggle={() => {
                if (expandedBookingId === booking.bookingId) {
                  setExpandedBookingId(null)
                } else {
                  setExpandedBookingId(booking.bookingId)
                  // Scroll to details after a short delay for smooth animation
                  setTimeout(() => {
                    const element = document.getElementById(`booking-details-${booking.bookingId}`)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    }
                  }, 100)
                }
              }}
              onCancel={handleCancelBooking}
              onPayment={handlePayment}
              isCancelling={cancellingBookingId === booking.bookingId}
              isProcessingPayment={processingPaymentId === booking.bookingId}
            />
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{ padding: '6px 10px', border: '1px solid #f1f5f9', borderRadius: 6 }}
          >
            ‹
          </button>

          {(() => {
            const pages: (number | '...')[] = []
            const add = (p: number | '...') => pages.push(p)
            const window = 1
            const start = Math.max(1, currentPage - window)
            const end = Math.min(totalPages, currentPage + window)
            if (start > 1) { add(1); if (start > 2) add('...') }
            for (let p = start; p <= end; p++) add(p)
            if (end < totalPages) { if (end < totalPages - 1) add('...'); add(totalPages) }
            return (
              <div style={{ display: 'flex', gap: 4 }}>
                {pages.map((p, idx) => (
                  p === '...'
                    ? <span key={`e-${idx}`} style={{ padding: '0 6px', color: '#9ca3af' }}>…</span>
                    : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        style={{
                          minWidth: 32,
                          height: 32,
                          border: '1px solid',
                          borderColor: currentPage === p ? '#FFE9A8' : '#f1f5f9',
                          background: currentPage === p ? '#FFD875' : '#fff',
                          borderRadius: 6,
                          fontWeight: 400
                        }}
                      >
                        {p}
                      </button>
                    )
                ))}
              </div>
            )
          })()}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{ padding: '6px 10px', border: '1px solid #f1f5f9', borderRadius: 6 }}
          >
            ›
          </button>
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
    </div>
  )
}


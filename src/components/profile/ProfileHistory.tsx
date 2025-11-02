import { useState, useEffect } from 'react'
import { BookingService, type CustomerBooking } from '@/services/bookingService'
import { CustomerService } from '@/services/customerService'
import { useAppSelector } from '@/store/hooks'
import { PayOSService } from '@/services/payOSService'
import toast from 'react-hot-toast'
import BookingHistoryCard from './BookingHistoryCard'

export default function ProfileHistory() {
  const user = useAppSelector((state) => state.auth.user)
  const [bookings, setBookings] = useState<CustomerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null)
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null)
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null)
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
            console.error('Error loading customer:', error)
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

  // Handle payment
  const handlePayment = async (bookingId: number) => {
    try {
      setProcessingPaymentId(bookingId)
      const paymentResponse = await PayOSService.createPaymentLink(bookingId)

      if (paymentResponse.success && paymentResponse.data?.checkoutUrl) {
        window.location.href = paymentResponse.data.checkoutUrl
      } else {
        toast.error('Không thể tạo link thanh toán')
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo link thanh toán')
    } finally {
      setProcessingPaymentId(null)
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px 0'
      }}>
        {currentBookings.map((booking) => (
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
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: currentPage === 1 ? '#f3f4f6' : '#ffffff',
              color: currentPage === 1 ? '#9ca3af' : '#374151',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.backgroundColor = '#ffffff'
              }
            }}
          >
            Trước
          </button>

          <div style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
          }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  minWidth: '36px',
                  height: '36px',
                  padding: '0 12px',
                  border: '1px solid',
                  borderColor: currentPage === page ? '#FFD875' : '#e5e7eb',
                  borderRadius: '6px',
                  background: currentPage === page ? '#FFD875' : '#ffffff',
                  color: currentPage === page ? '#111827' : '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: currentPage === page ? '600' : '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== page) {
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== page) {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.backgroundColor = '#ffffff'
                  }
                }}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
              color: currentPage === totalPages ? '#9ca3af' : '#374151',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.backgroundColor = '#ffffff'
              }
            }}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}


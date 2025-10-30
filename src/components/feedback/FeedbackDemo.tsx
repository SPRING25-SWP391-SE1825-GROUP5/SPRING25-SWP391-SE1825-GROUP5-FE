import { useState } from 'react'
import { FeedbackCard, FeedbackModal, FeedbackData } from './index'
import { BookingData, feedbackService } from '@/services/feedbackService'

// Demo component để test tính năng feedback
export default function FeedbackDemo() {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(false)

  // Load demo data
  const loadDemoData = async () => {
    setLoading(true)
    try {
      const data = await feedbackService.getBookingsWithFeedback()
      setBookings(data)
    } catch (error) {
      console.error('Error loading demo data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle feedback submission
  const handleSubmitFeedback = async (bookingId: string, feedback: FeedbackData) => {
    try {
      await feedbackService.submitFeedback(bookingId, 0, feedback)
      // Reload data
      await loadDemoData()
      alert('Đánh giá đã được gửi thành công!')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Có lỗi xảy ra khi gửi đánh giá')
    }
  }

  // Handle feedback update
  const handleEditFeedback = async (bookingId: string, feedback: FeedbackData) => {
    try {
      await feedbackService.updateFeedback(Number(bookingId), feedback)
      // Reload data
      await loadDemoData()
      alert('Đánh giá đã được cập nhật thành công!')
    } catch (error) {
      console.error('Error updating feedback:', error)
      alert('Có lỗi xảy ra khi cập nhật đánh giá')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>
        Demo Tính Năng Feedback
      </h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={loadDemoData}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: 'var(--primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? 'Đang tải...' : 'Tải dữ liệu demo'}
        </button>
      </div>

      {bookings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {bookings.map((booking) => (
            <FeedbackCard
              key={booking.id}
              booking={booking}
              onSubmitFeedback={handleSubmitFeedback}
              onEditFeedback={handleEditFeedback}
            />
          ))}
        </div>
      )}

      {bookings.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: 'var(--text-secondary)'
        }}>
          <p>Nhấn "Tải dữ liệu demo" để xem các ví dụ về tính năng feedback</p>
        </div>
      )}
    </div>
  )
}

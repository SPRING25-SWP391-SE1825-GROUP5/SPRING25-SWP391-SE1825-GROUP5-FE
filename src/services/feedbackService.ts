import api from './api'
import { FeedbackData } from '@/components/feedback'

export interface BookingData {
  id: string
  serviceName: string
  date: string
  technician: string
  partsUsed: string[]
  status: 'completed' | 'in-progress' | 'pending'
  feedback?: FeedbackData
}

export interface FeedbackResponse {
  success: boolean
  message: string
  data?: FeedbackData
}

export interface FeedbackStats {
  totalBookings: number
  ratedBookings: number
  averageTechnicianRating: number
  averagePartsRating: number
  ratingDistribution: {
    [key: number]: number
  }
}

class FeedbackService {
  // Submit feedback for a booking (technician)
  async submitFeedback(bookingId: string, technicianId: number, feedback: FeedbackData): Promise<FeedbackResponse> {
    try {
      const response = await api.post(`/Feedback/bookings/${bookingId}/technicians/${technicianId}`, feedback)
      return response.data
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      throw new Error(error.response?.data?.message || 'Không thể gửi đánh giá')
    }
  }

  // Submit feedback for a booking using new API structure
  async submitBookingFeedback(bookingId: string, feedbackData: {
    customerId: number
    rating: number
    comment: string
    isAnonymous: boolean
    technicianId: number
    partId?: number
  }): Promise<FeedbackResponse> {
    try {
      console.log('🌐 Submitting booking feedback:', { bookingId, feedbackData })
      const response = await api.post(`/Feedback/bookings/${bookingId}`, feedbackData)
      console.log('✅ Feedback submitted successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error submitting booking feedback:', error)
      throw new Error(error.response?.data?.message || 'Không thể gửi đánh giá')
    }
  }

  // Submit feedback for parts
  async submitPartsFeedback(bookingId: string, partId: number, feedback: FeedbackData): Promise<FeedbackResponse> {
    try {
      const response = await api.post(`/Feedback/bookings/${bookingId}/parts/${partId}`, feedback)
      return response.data
    } catch (error: any) {
      console.error('Error submitting parts feedback:', error)
      throw new Error(error.response?.data?.message || 'Không thể gửi đánh giá phụ tùng')
    }
  }

  // Update existing feedback
  async updateFeedback(feedbackId: number, feedback: FeedbackData): Promise<FeedbackResponse> {
    try {
      const response = await api.put(`/Feedback/${feedbackId}`, feedback)
      return response.data
    } catch (error: any) {
      console.error('Error updating feedback:', error)
      throw new Error(error.response?.data?.message || 'Không thể cập nhật đánh giá')
    }
  }

  // Get feedback for a specific booking
  async getFeedback(bookingId: string): Promise<FeedbackData | null> {
    try {
      const response = await api.get(`/Feedback/bookings/${bookingId}`)
      return response.data.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error('Error getting feedback:', error)
      throw new Error(error.response?.data?.message || 'Không thể lấy thông tin đánh giá')
    }
  }

  // Get all bookings with feedback status
  async getBookingsWithFeedback(): Promise<BookingData[]> {
    try {
      const response = await api.get('/bookings/feedback')
      return response.data.data
    } catch (error: any) {
      console.error('Error getting bookings with feedback:', error)
      throw new Error(error.response?.data?.message || 'Không thể lấy danh sách đặt lịch')
    }
  }

  // Get feedback statistics
  async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      const response = await api.get('/feedback/stats')
      return response.data.data
    } catch (error: any) {
      console.error('Error getting feedback stats:', error)
      throw new Error(error.response?.data?.message || 'Không thể lấy thống kê đánh giá')
    }
  }

  // Delete feedback
  async deleteFeedback(bookingId: string): Promise<FeedbackResponse> {
    try {
      const response = await api.delete(`/feedback/${bookingId}`)
      return response.data
    } catch (error: any) {
      console.error('Error deleting feedback:', error)
      throw new Error(error.response?.data?.message || 'Không thể xóa đánh giá')
    }
  }
}

export const feedbackService = new FeedbackService()

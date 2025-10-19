import { BookingData } from '@/services/feedbackService'
import { FeedbackData } from '@/components/feedback'

// Mock feedback data
export const mockFeedbackData: FeedbackData[] = [
  {
    technicianRating: 5,
    partsRating: 4,
    comment: 'Kỹ thuật viên rất chuyên nghiệp và nhiệt tình. Xe được sửa chữa nhanh chóng và đúng hẹn.',
    tags: ['Nhanh chóng', 'Chuyên nghiệp', 'Kỹ thuật viên giỏi']
  },
  {
    technicianRating: 4,
    partsRating: 3,
    comment: 'Kỹ thuật viên giải thích rõ ràng về vấn đề và cách khắc phục. Phụ tùng hơi đắt nhưng chất lượng tốt.',
    tags: ['Giải thích rõ ràng', 'Thái độ tốt', 'Phụ tùng chính hãng']
  },
  {
    technicianRating: 5,
    partsRating: 5,
    comment: 'Tuyệt vời! Kỹ thuật viên rất giỏi, phụ tùng chính hãng. Xe chạy mượt mà hơn nhiều sau khi bảo dưỡng.',
    tags: ['Nhanh chóng', 'Chuyên nghiệp', 'Kỹ thuật viên giỏi', 'Phụ tùng chính hãng']
  }
]

// Mock booking data with feedback
export const mockBookingData: BookingData[] = [
  {
    id: 'BK001',
    serviceName: 'Bảo dưỡng định kỳ',
    date: '2024-01-15',
    technician: 'Nguyễn Văn A',
    partsUsed: ['Dầu nhớt 5W-30', 'Lọc dầu', 'Bugí'],
    status: 'completed',
    feedback: mockFeedbackData[0]
  },
  {
    id: 'BK002', 
    serviceName: 'Thay phanh trước',
    date: '2024-01-10',
    technician: 'Trần Thị B',
    partsUsed: ['Má phanh Brembo', 'Dầu phanh DOT4'],
    status: 'completed',
    feedback: mockFeedbackData[1]
  },
  {
    id: 'BK003',
    serviceName: 'Sửa chữa động cơ',
    date: '2024-01-05',
    technician: 'Lê Văn C',
    partsUsed: ['Bugi Denso', 'Dây bugi', 'Bộ lọc gió'],
    status: 'completed',
    feedback: mockFeedbackData[2]
  },
  {
    id: 'BK004',
    serviceName: 'Thay lốp xe',
    date: '2024-01-20',
    technician: 'Phạm Thị D',
    partsUsed: ['Lốp Michelin 185/65R15', 'Van lốp'],
    status: 'completed'
    // No feedback yet
  },
  {
    id: 'BK005',
    serviceName: 'Kiểm tra hệ thống điện',
    date: '2024-01-18',
    technician: 'Hoàng Văn E',
    partsUsed: ['Cầu chì', 'Dây điện'],
    status: 'in-progress'
    // Cannot rate yet
  },
  {
    id: 'BK006',
    serviceName: 'Bảo dưỡng pin',
    date: '2024-01-12',
    technician: 'Vũ Thị F',
    partsUsed: ['Dung dịch điện phân', 'Bộ sạc pin'],
    status: 'completed'
    // No feedback yet
  }
]

// Mock feedback statistics
export const mockFeedbackStats = {
  totalBookings: 6,
  ratedBookings: 3,
  averageTechnicianRating: 4.7,
  averagePartsRating: 4.0,
  ratingDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 1,
    5: 2
  }
}

// Mock service for testing
export class MockFeedbackService {
  private bookings: BookingData[] = [...mockBookingData]
  private feedbacks: Map<string, FeedbackData> = new Map()

  constructor() {
    // Initialize with existing feedback
    mockBookingData.forEach(booking => {
      if (booking.feedback) {
        this.feedbacks.set(booking.id, booking.feedback)
      }
    })
  }

  async submitFeedback(bookingId: string, feedback: FeedbackData): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    this.feedbacks.set(bookingId, feedback)
    
    // Update booking data
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId)
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].feedback = feedback
    }
    
    return {
      success: true,
      message: 'Đánh giá đã được gửi thành công',
      data: feedback
    }
  }

  async updateFeedback(bookingId: string, feedback: FeedbackData): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    this.feedbacks.set(bookingId, feedback)
    
    // Update booking data
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId)
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].feedback = feedback
    }
    
    return {
      success: true,
      message: 'Đánh giá đã được cập nhật thành công',
      data: feedback
    }
  }

  async getFeedback(bookingId: string): Promise<FeedbackData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return this.feedbacks.get(bookingId) || null
  }

  async getBookingsWithFeedback(): Promise<BookingData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return [...this.bookings]
  }

  async getFeedbackStats(): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    return mockFeedbackStats
  }

  async deleteFeedback(bookingId: string): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    this.feedbacks.delete(bookingId)
    
    // Update booking data
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId)
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].feedback = undefined
    }
    
    return {
      success: true,
      message: 'Đánh giá đã được xóa thành công'
    }
  }
}

export const mockFeedbackService = new MockFeedbackService()

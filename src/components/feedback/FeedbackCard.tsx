import { useState } from 'react'
import { Star, MessageSquare, Calendar, User, Wrench, Package, ThumbsUp, ChevronDown, ChevronRight } from 'lucide-react'
import StarRating from './StarRating'
import FeedbackModal from './FeedbackModal'
import { FeedbackData } from './FeedbackForm'
import './FeedbackCard.scss'

interface BookingData {
  id: string
  serviceName: string
  date: string
  technician: string
  partsUsed: string[]
  status: 'completed' | 'in-progress' | 'pending'
  feedback?: FeedbackData
}

interface FeedbackCardProps {
  booking: BookingData
  onSubmitFeedback: (bookingId: string, feedback: FeedbackData) => Promise<void>
  onEditFeedback?: (bookingId: string, feedback: FeedbackData) => Promise<void>
  isExpanded?: boolean
  onToggleExpand?: (bookingId: string) => void
}

export default function FeedbackCard({
  booking,
  onSubmitFeedback,
  onEditFeedback,
  isExpanded = false,
  onToggleExpand
}: FeedbackCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const hasFeedback = booking.feedback && 
    booking.feedback.technicianRating > 0 && 
    booking.feedback.partsRating > 0

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand(booking.id)
    }
  }

  const handleSubmitFeedback = async (feedback: FeedbackData) => {
    setIsLoading(true)
    try {
      if (hasFeedback && onEditFeedback) {
        await onEditFeedback(booking.id, feedback)
      } else {
        await onSubmitFeedback(booking.id, feedback)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--success-500)'
      case 'in-progress': return 'var(--warning-500)'
      case 'pending': return 'var(--info-500)'
      default: return 'var(--text-tertiary)'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành'
      case 'in-progress': return 'Đang thực hiện'
      case 'pending': return 'Chờ xử lý'
      default: return status
    }
  }

  return (
    <>
      <div className="feedback-card">
        {/* Header */}
        <div className="feedback-card__header" onClick={handleToggleExpand}>
          <div className="feedback-card__header__info">
            <h3 className="feedback-card__header__info__title">
              {booking.serviceName}
            </h3>
            <div className="feedback-card__header__info__meta">
              <span className="feedback-card__header__info__meta__item">
                <Calendar size={14} />
                {booking.date}
              </span>
              <span className="feedback-card__header__info__meta__item">
                <User size={14} />
                {booking.technician}
              </span>
            </div>
          </div>
          
          <div className="feedback-card__header__right">
            <div className="feedback-card__header__status">
              <span 
                className="feedback-card__header__status__badge"
                style={{ 
                  backgroundColor: getStatusColor(booking.status),
                  color: 'white'
                }}
              >
                {getStatusText(booking.status)}
              </span>
            </div>
            
            <div className="feedback-card__header__chevron">
              {isExpanded ? (
                <ChevronDown size={20} className="chevron-icon" />
              ) : (
                <ChevronRight size={20} className="chevron-icon" />
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        <div className={`feedback-card__content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {/* Parts Used */}
          {booking.partsUsed.length > 0 && (
          <div className="feedback-card__parts">
            <div className="feedback-card__parts__header">
              <Package size={16} />
              <span>Phụ tùng đã sử dụng</span>
            </div>
            <div className="feedback-card__parts__list">
              {booking.partsUsed.map((part, index) => (
                <span key={index} className="feedback-card__parts__list__item">
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Section */}
        <div className="feedback-card__feedback">
          {hasFeedback ? (
            <div className="feedback-card__feedback__submitted">
              <div className="feedback-card__feedback__submitted__header">
                <ThumbsUp size={16} />
                <span>Đã đánh giá</span>
              </div>
              
              <div className="feedback-card__feedback__submitted__ratings">
                <div className="feedback-card__feedback__submitted__ratings__item">
                  <span>Kỹ thuật viên:</span>
                  <StarRating
                    rating={booking.feedback!.technicianRating}
                    onRatingChange={() => {}}
                    size="sm"
                    readonly
                  />
                </div>
                
                <div className="feedback-card__feedback__submitted__ratings__item">
                  <span>Phụ tùng:</span>
                  <StarRating
                    rating={booking.feedback!.partsRating}
                    onRatingChange={() => {}}
                    size="sm"
                    readonly
                  />
                </div>
                
              </div>

              {booking.feedback!.comment && (
                <div className="feedback-card__feedback__submitted__comment">
                  <MessageSquare size={14} />
                  <p>{booking.feedback!.comment}</p>
                </div>
              )}

              {booking.feedback!.tags.length > 0 && (
                <div className="feedback-card__feedback__submitted__tags">
                  {booking.feedback!.tags.map((tag, index) => (
                    <span key={index} className="feedback-card__feedback__submitted__tags__item">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {onEditFeedback && (
                <button
                  className="feedback-card__feedback__submitted__edit"
                  onClick={handleOpenModal}
                  disabled={isLoading}
                >
                  Chỉnh sửa đánh giá
                </button>
              )}
            </div>
          ) : (
            <div className="feedback-card__feedback__pending">
              <div className="feedback-card__feedback__pending__content">
                <MessageSquare size={20} />
                <div>
                  <p>Chưa có đánh giá</p>
                  <span>Hãy chia sẻ trải nghiệm của bạn</span>
                </div>
              </div>
              
              <button
                className="feedback-card__feedback__pending__button"
                onClick={handleOpenModal}
                disabled={isLoading || booking.status !== 'completed'}
              >
                <Star size={16} />
                Đánh giá ngay
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showModal}
        onClose={handleCloseModal}
        bookingId={booking.id}
        serviceName={booking.serviceName}
        technician={booking.technician}
        partsUsed={booking.partsUsed}
        onSubmit={handleSubmitFeedback}
        initialData={booking.feedback}
      />
    </>
  )
}

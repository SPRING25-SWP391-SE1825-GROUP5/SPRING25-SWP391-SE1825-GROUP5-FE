import { useState } from 'react'
import { X, Send, MessageSquare, Star } from 'lucide-react'
import StarRating from './StarRating'
import './FeedbackForm.scss'

export interface FeedbackData {
  technicianRating: number
  partsRating: number
  comment: string
  tags: string[]
}

interface FeedbackFormProps {
  bookingId: string
  serviceName: string
  technician: string
  partsUsed: string[]
  onSubmit: (feedback: FeedbackData) => void
  onCancel: () => void
  initialData?: Partial<FeedbackData>
  isLoading?: boolean
}

const FEEDBACK_TAGS = [
  'Nhanh chóng',
  'Chuyên nghiệp', 
  'Giá cả hợp lý',
  'Thái độ tốt',
  'Chất lượng cao',
  'Thời gian đúng hẹn',
  'Giải thích rõ ràng',
  'Cơ sở vật chất tốt',
  'Kỹ thuật viên giỏi',
  'Phụ tùng chính hãng'
]

export default function FeedbackForm({
  bookingId,
  serviceName,
  technician,
  partsUsed,
  onSubmit,
  onCancel,
  initialData = {},
  isLoading = false
}: FeedbackFormProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({
    technicianRating: initialData.technicianRating || 0,
    partsRating: initialData.partsRating || 0,
    comment: initialData.comment || '',
    tags: initialData.tags || []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleRatingChange = (type: keyof Pick<FeedbackData, 'technicianRating' | 'partsRating'>) => 
    (rating: number) => {
      setFeedback(prev => ({ ...prev, [type]: rating }))
      // Clear error when user starts rating
      if (errors[type]) {
        setErrors(prev => ({ ...prev, [type]: '' }))
      }
    }

  const handleCommentChange = (comment: string) => {
    setFeedback(prev => ({ ...prev, comment }))
    if (errors.comment) {
      setErrors(prev => ({ ...prev, comment: '' }))
    }
  }

  const handleTagToggle = (tag: string) => {
    setFeedback(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (feedback.technicianRating === 0) {
      newErrors.technicianRating = 'Vui lòng đánh giá kỹ thuật viên'
    }

    if (feedback.partsRating === 0) {
      newErrors.partsRating = 'Vui lòng đánh giá phụ tùng'
    }

    if (feedback.comment.trim().length < 10) {
      newErrors.comment = 'Vui lòng nhập ít nhất 10 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(feedback)
    }
  }

  const isFormValid = feedback.technicianRating > 0 && 
                     feedback.partsRating > 0 && 
                     feedback.comment.trim().length >= 10

  return (
    <div className="feedback-form">
      <div className="feedback-form__header">
        <div className="feedback-form__header__info">
          <h3 className="feedback-form__header__info__title">
            <MessageSquare size={20} />
            Đánh giá dịch vụ
          </h3>
          <p className="feedback-form__header__info__subtitle">
            Booking #{bookingId} - {serviceName}
          </p>
        </div>
        <button 
          className="feedback-form__header__close"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="feedback-form__body">
        {/* Technician Rating */}
        <div className="feedback-form__section">
          <label className="feedback-form__section__label">
            Đánh giá kỹ thuật viên *
          </label>
          <div className="feedback-form__technician-info">
            <p className="feedback-form__technician-info__text">
              Kỹ thuật viên: {technician}
            </p>
          </div>
          <StarRating
            rating={feedback.technicianRating}
            onRatingChange={handleRatingChange('technicianRating')}
            size="lg"
            showLabel={false}
          />
          {errors.technicianRating && (
            <span className="feedback-form__error">
              {errors.technicianRating}
            </span>
          )}
        </div>

        {/* Parts Rating */}
        <div className="feedback-form__section">
          <label className="feedback-form__section__label">
            Đánh giá phụ tùng *
          </label>
          <div className="feedback-form__parts-info">
            <p className="feedback-form__parts-info__text">
              Phụ tùng đã sử dụng: {partsUsed.join(', ')}
            </p>
          </div>
          <StarRating
            rating={feedback.partsRating}
            onRatingChange={handleRatingChange('partsRating')}
            size="lg"
            showLabel={false}
          />
          {errors.partsRating && (
            <span className="feedback-form__error">
              {errors.partsRating}
            </span>
          )}
        </div>


        {/* Comment */}
        <div className="feedback-form__section">
          <label className="feedback-form__section__label">
            Nhận xét chi tiết *
          </label>
          <textarea
            className="feedback-form__textarea"
            value={feedback.comment}
            onChange={(e) => handleCommentChange(e.target.value)}
            placeholder="Hãy chia sẻ trải nghiệm của bạn về dịch vụ..."
            rows={4}
            disabled={isLoading}
          />
          <div className="feedback-form__char-count">
            {feedback.comment.length}/500
          </div>
          {errors.comment && (
            <span className="feedback-form__error">
              {errors.comment}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="feedback-form__section">
          <label className="feedback-form__section__label">
            Từ khóa mô tả (tùy chọn)
          </label>
          <div className="feedback-form__tags">
            {FEEDBACK_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                className={`feedback-form__tag ${
                  feedback.tags.includes(tag) ? 'feedback-form__tag--active' : ''
                }`}
                onClick={() => handleTagToggle(tag)}
                disabled={isLoading}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="feedback-form__actions">
          <button
            type="button"
            className="feedback-form__actions__button feedback-form__actions__button--secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="feedback-form__actions__button feedback-form__actions__button--primary"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <div className="feedback-form__spinner" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={16} />
                Gửi đánh giá
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

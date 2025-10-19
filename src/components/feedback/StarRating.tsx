import { useState } from 'react'
import { Star } from 'lucide-react'
import './StarRating.scss'

interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  showLabel?: boolean
  label?: string
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  size = 'md',
  readonly = false,
  showLabel = false,
  label = 'Đánh giá'
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'star-rating--sm',
    md: 'star-rating--md', 
    lg: 'star-rating--lg'
  }

  const handleStarClick = (starRating: number) => {
    if (!readonly) {
      onRatingChange(starRating)
    }
  }

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating)
    }
  }

  const handleStarLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Rất tệ'
      case 2: return 'Tệ'
      case 3: return 'Bình thường'
      case 4: return 'Tốt'
      case 5: return 'Rất tốt'
      default: return 'Chưa đánh giá'
    }
  }

  return (
    <div className={`star-rating ${sizeClasses[size]} ${readonly ? 'star-rating--readonly' : ''}`}>
      {showLabel && (
        <label className="star-rating__label">
          {label}
        </label>
      )}
      
      <div className="star-rating__container">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoverRating || rating)
          return (
            <button
              key={star}
              type="button"
              className={`star-rating__star ${isActive ? 'star-rating__star--active' : ''}`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              onMouseLeave={handleStarLeave}
              disabled={readonly}
            >
              <Star 
                size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
                fill={isActive ? 'currentColor' : 'none'}
              />
            </button>
          )
        })}
      </div>
      
      {rating > 0 && (
        <span className="star-rating__text">
          {getRatingText(rating)}
        </span>
      )}
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Star, User } from 'lucide-react'
import { feedbackService, Review } from '@/services/feedbackService'
import './ProfileReviews.scss'
 
const ITEMS_PER_PAGE = 20

export default function ProfileReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(ITEMS_PER_PAGE)

  useEffect(() => {
    loadReviews()
  }, [currentPage])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = await feedbackService.getMyReviews(currentPage, pageSize)
      
      if (response.success) {
        setReviews(response.data)
        setTotal(response.total)
      } else {
        setReviews([])
        setTotal(0)
      }
    } catch (error) {
      setReviews([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFirstPage = () => handlePageChange(1)
  const handlePrevPage = () => handlePageChange(currentPage - 1)
  const handleNextPage = () => handlePageChange(currentPage + 1)
  const handleLastPage = () => handlePageChange(totalPages)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      return (
        <Star
          key={index}
          className={`profile-reviews__star ${
            starValue <= rating ? 'filled' : 'empty'
          }`}
          size={18}
          fill={starValue <= rating ? 'currentColor' : 'none'}
        />
      )
    })
  }

  const getReviewType = (review: Review) => {
    if (review.bookingId) {
      return 'Đánh giá dịch vụ'
    }
    if (review.partId) {
      return 'Đánh giá phụ tùng'
    }
    return 'Đánh giá'
  }

  return (
    <div className="profile-v2__section">
      <div className="profile-reviews">
        <div className="profile-reviews__header">
          <h2 className="profile-reviews__title">Đánh giá của tôi</h2>
          <button 
            className="profile-reviews__refresh"
            onClick={loadReviews}
            disabled={loading}
            title="Làm mới"
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="profile-reviews__loading">
            <div className="profile-reviews__spinner"></div>
            <p>Đang tải đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="profile-reviews__empty">
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              Bạn chưa có đánh giá nào.
            </p>
            <p style={{ fontSize: '14px', color: '#999', margin: '8px 0 0 0' }}>
              Hãy để lại đánh giá sau khi sử dụng dịch vụ để giúp chúng tôi cải thiện chất lượng phục vụ.
            </p>
          </div>
        ) : (
          <>
            <div className="profile-reviews__list">
              {reviews.map((review) => (
                <div key={review.feedbackId} className="profile-reviews__item">
                  <div className="profile-reviews__item-header">
                    <div className="profile-reviews__item-meta">
                      <div className="profile-reviews__item-rating">
                        {renderStars(review.rating)}
                        <span className="profile-reviews__item-rating-value">
                          {review.rating}.0
                        </span>
                      </div>
                      <span className="profile-reviews__item-type">
                        {getReviewType(review)}
                      </span>
                      {review.isAnonymous && (
                        <span className="profile-reviews__item-anonymous">
                          <User size={14} />
                          Ẩn danh
                        </span>
                      )}
                    </div>
                    <span className="profile-reviews__item-date">
                      {formatTime(review.createdAt)}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="profile-reviews__item-comment">
                      {review.comment}
                    </p>
                  )}

                  <div className="profile-reviews__item-details">
                    {review.technicianName && (
                      <div className="profile-reviews__item-detail">
                        <span className="profile-reviews__item-detail-label">Kỹ thuật viên:</span>
                        <span className="profile-reviews__item-detail-value">
                          {review.technicianName}
                        </span>
                      </div>
                    )}
                    {review.partName && (
                      <div className="profile-reviews__item-detail">
                        <span className="profile-reviews__item-detail-label">Phụ tùng:</span>
                        <span className="profile-reviews__item-detail-value">
                          {review.partName}
                        </span>
                      </div>
                    )}
                    {review.bookingId && (
                      <div className="profile-reviews__item-detail">
                        <span className="profile-reviews__item-detail-label">Mã booking:</span>
                        <span className="profile-reviews__item-detail-value">
                          #{review.bookingId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="profile-reviews__pagination">
                <button
                  className="profile-reviews__pagination-btn"
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  title="Trang đầu"
                >
                  «
                </button>
                <button
                  className="profile-reviews__pagination-btn"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  title="Trang trước"
                >
                  ‹
                </button>
                
                {getPageNumbers().map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="profile-reviews__pagination-ellipsis">
                        ...
                      </span>
                    )
                  }
                  
                  const pageNum = page as number
                  return (
                    <button
                      key={pageNum}
                      className={`profile-reviews__pagination-number ${
                        currentPage === pageNum ? 'active' : ''
                      }`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  className="profile-reviews__pagination-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  title="Trang sau"
                >
                  ›
                </button>
                <button
                  className="profile-reviews__pagination-btn"
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages}
                  title="Trang cuối"
                >
                  »
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

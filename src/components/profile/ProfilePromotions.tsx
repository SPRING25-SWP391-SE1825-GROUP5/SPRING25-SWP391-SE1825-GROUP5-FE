import { useState, useEffect } from 'react'
import { PromotionBookingService, type SavedPromotion } from '@/services/promotionBookingService'
import { useAppSelector } from '@/store/hooks'
import toast from 'react-hot-toast'
import { TagIcon } from '@heroicons/react/24/outline'

export default function ProfilePromotions() {
  const user = useAppSelector((state) => state.auth.user)
  const [promotions, setPromotions] = useState<SavedPromotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSavedPromotions = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const savedPromotions = await PromotionBookingService.getSavedPromotions()
        setPromotions(savedPromotions)
      } catch (error: unknown) {
        const err = error as { message?: string }
        toast.error(err.message || 'Không thể tải danh sách mã khuyến mãi đã lưu')
        setPromotions([])
      } finally {
        setLoading(false)
      }
    }

    loadSavedPromotions()
  }, [user])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫'
  }

  const getDiscountText = (promo: SavedPromotion) => {
    if (promo.discountType === 'PERCENT') {
      return `${promo.discountValue}%`
    }
    return formatCurrency(promo.discountValue)
  }

  const getStatusBadge = (promo: SavedPromotion) => {
    if (promo.isExpired) {
      return <span className="promotion-badge expired">Đã hết hạn</span>
    }
    if (promo.isUsageLimitReached) {
      return <span className="promotion-badge expired">Đã hết lượt</span>
    }
    if (promo.isActive) {
      return <span className="promotion-badge active">Đang hoạt động</span>
    }
    return <span className="promotion-badge inactive">Không hoạt động</span>
  }

  if (loading) {
    return (
      <div className="profile-v2__section">
        <div className="profile-v2__empty">Đang tải...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-v2__section">
        <div className="profile-v2__empty">Vui lòng đăng nhập để xem mã khuyến mãi đã lưu.</div>
      </div>
    )
  }

  if (promotions.length === 0) {
    return (
      <div className="profile-v2__section">
        <div className="profile-v2__empty">Bạn chưa lưu mã khuyến mãi nào.</div>
      </div>
    )
  }

  return (
    <div className="profile-v2__section">
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '20px',
        padding: '16px 0'
      }}>
        {promotions.map((promotion) => (
          <div 
            key={promotion.promotionId} 
            className="profile-v2__card"
            style={{ 
              padding: '20px',
              border: `1px solid ${promotion.isActive && !promotion.isExpired ? '#e5e7eb' : '#f3f4f6'}`,
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Status Badge */}
            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
              {getStatusBadge(promotion)}
            </div>

            {/* Code Section */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              marginBottom: '16px',
              paddingRight: '100px'
            }}>
              <TagIcon width={20} height={20} style={{ color: '#FFD875', flexShrink: 0 }} />
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827',
                letterSpacing: '0.5px'
              }}>
                {promotion.code}
              </span>
            </div>

            {/* Discount Value */}
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#FFD875',
              marginBottom: '12px'
            }}>
              {getDiscountText(promotion)}
              {promotion.discountType === 'PERCENT' && promotion.maxDiscount && (
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '400', marginLeft: '6px' }}>
                  (Tối đa {formatCurrency(promotion.maxDiscount)})
                </span>
              )}
            </div>

            {/* Description */}
            <div style={{ 
              fontSize: '14px', 
              color: '#4b5563',
              marginBottom: '16px',
              lineHeight: '1.5',
              minHeight: '40px'
            }}>
              {promotion.description}
            </div>

            {/* Details */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              {promotion.minOrderAmount > 0 && (
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Đơn tối thiểu: <strong>{formatCurrency(promotion.minOrderAmount)}</strong>
                </div>
              )}
              
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Hiệu lực: {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .promotion-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .promotion-badge.active {
          background: #dcfce7;
          color: #166534;
        }
        .promotion-badge.expired {
          background: #fee2e2;
          color: #991b1b;
        }
        .promotion-badge.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }
      `}</style>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { PromotionBookingService, type SavedPromotion } from '@/services/promotionBookingService'
import type { Promotion } from '@/types/promotion'
import { useAppSelector } from '@/store/hooks'

interface PromotionSelectorProps {
  onPromotionApplied: (promotion: Promotion | null, discountAmount: number) => void
  onPromotionRemoved: () => void
  orderAmount: number
  appliedPromotion?: Promotion | null
  discountAmount?: number
}

interface PromotionValidationResponse {
  isValid: boolean
  message: string
  discountAmount: number
  finalAmount: number
  promotion?: Promotion
}

// Helper function to map SavedPromotion to Promotion type
const mapSavedPromotionToPromotion = (saved: SavedPromotion): Promotion => {
  // Backend trả về 'FIXED' hoặc 'PERCENT', map trực tiếp sang Promotion type
  return {
    promotionId: saved.promotionId,
    code: saved.code,
    description: saved.description,
    discountValue: saved.discountValue,
    discountType: saved.discountType, // 'FIXED' | 'PERCENT' - map trực tiếp
    minOrderAmount: saved.minOrderAmount,
    startDate: saved.startDate,
    endDate: saved.endDate,
    maxDiscount: saved.maxDiscount,
    status: saved.status as 'ACTIVE' | 'INACTIVE' | 'EXPIRED',
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
    usageLimit: saved.usageLimit,
    usageCount: saved.usageCount,
    isActive: saved.isActive,
    isExpired: saved.isExpired,
    isUsageLimitReached: saved.isUsageLimitReached,
    remainingUsage: saved.remainingUsage
  }
}

const PromotionSelector: React.FC<PromotionSelectorProps> = ({
  onPromotionApplied,
  onPromotionRemoved,
  orderAmount,
  appliedPromotion,
  discountAmount = 0
}) => {
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([])
  const [loadingPromotions, setLoadingPromotions] = useState(false)
  const auth = useAppSelector((s) => s.auth)

  // Load saved promotions từ API GET /api/Promotion/promotions (promotions đã lưu của customer)
  useEffect(() => {
    const loadSavedPromotions = async () => {
      // Chỉ load nếu user đã đăng nhập
      if (!auth.user || !auth.token) {
        setAvailablePromotions([])
        return
      }

      try {
        setLoadingPromotions(true)
        // Call API GET /api/Promotion/promotions để lấy danh sách promotion đã lưu của customer
        const savedPromotions = await PromotionBookingService.getSavedPromotions()
        
        if (savedPromotions && savedPromotions.length > 0) {
          // Map SavedPromotion[] sang Promotion[] và lọc chỉ lấy promotions có thể sử dụng
          const mappedPromotions = savedPromotions
            .map(mapSavedPromotionToPromotion)
            .filter((p: Promotion) => {
              // Chỉ hiển thị promotions active, chưa hết hạn, chưa hết lượt dùng
              const isActive = p.isActive && !p.isExpired && !p.isUsageLimitReached
              // Kiểm tra đơn tối thiểu
              const meetsMinOrder = !p.minOrderAmount || p.minOrderAmount <= orderAmount
              // Kiểm tra ngày hiệu lực
              const now = new Date()
              const startDate = new Date(p.startDate)
              const endDate = p.endDate ? new Date(p.endDate) : null
              const isInValidPeriod = now >= startDate && (!endDate || now <= endDate)
              
              return isActive && meetsMinOrder && isInValidPeriod
            })
          
          setAvailablePromotions(mappedPromotions)
        } else {
          setAvailablePromotions([])
        }
      } catch (error) {
        // Silently handle error - không hiển thị lỗi nếu không có promotions
        console.error('Error loading saved promotions:', error)
        setAvailablePromotions([])
      } finally {
        setLoadingPromotions(false)
      }
    }
    
    loadSavedPromotions()
  }, [orderAmount, auth.user, auth.token])

  // Helper function to calculate discount amount from promotion info
  const calculateDiscountAmount = (promotion: Promotion, orderAmount: number): number => {
    if (promotion.discountType === 'PERCENT') {
      // Tính discount theo phần trăm
      let discount = (orderAmount * promotion.discountValue) / 100
      // Áp dụng maxDiscount nếu có
      if (promotion.maxDiscount && discount > promotion.maxDiscount) {
        discount = promotion.maxDiscount
      }
      return Math.round(discount)
    } else {
      // Discount cố định
      return promotion.discountValue
    }
  }

  const handleApplyPromotion = async () => {
    if (!promoCode.trim()) {
      setError('Vui lòng nhập mã khuyến mãi')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Tìm promotion từ danh sách đã lưu
      const promotion = availablePromotions.find(p => p.code.toUpperCase() === promoCode.trim().toUpperCase())
      
      if (!promotion) {
        setError('Mã khuyến mãi không hợp lệ hoặc không có trong danh sách đã lưu')
        setLoading(false)
        return
      }

      // Kiểm tra điều kiện sử dụng
      if (!promotion.isActive || promotion.isExpired || promotion.isUsageLimitReached) {
        setError('Mã khuyến mãi không còn hiệu lực')
        setLoading(false)
        return
      }

      // Kiểm tra đơn tối thiểu
      if (promotion.minOrderAmount && orderAmount < promotion.minOrderAmount) {
        setError(`Đơn hàng tối thiểu ${formatPrice(promotion.minOrderAmount)} để sử dụng mã này`)
        setLoading(false)
        return
      }

      // Tính discount amount từ promotion info
      const discountAmount = calculateDiscountAmount(promotion, orderAmount)
      
      // Áp dụng promotion
      onPromotionApplied(promotion, discountAmount)
      setSuccess(`Áp dụng mã khuyến mãi thành công! Giảm ${formatPrice(discountAmount)}`)
      setPromoCode('')
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi áp dụng mã khuyến mãi')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePromotion = () => {
    onPromotionRemoved()
    setSuccess(null)
    setError(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDiscount = (promotion: Promotion) => {
    if (promotion.discountType === 'PERCENT') {
      // Hiển thị phần trăm giảm giá
      return `Giảm ${promotion.discountValue}%`
    } else {
      // Hiển thị số tiền giảm cố định
      return `Giảm ${formatPrice(promotion.discountValue)}`
    }
  }

  return (
    <div className="promotion-selector">
      <h3>🎁 Mã khuyến mãi</h3>
      
      {appliedPromotion ? (
        <div className="applied-promotion">
          <div className="promotion-info">
            <div className="promotion-header">
              <span className="promotion-code">{appliedPromotion.code}</span>
              <span className="promotion-discount">{formatDiscount(appliedPromotion)}</span>
            </div>
            <p className="promotion-description">{appliedPromotion.description}</p>
            <div className="discount-amount">
              <span>Giảm giá: </span>
              <span className="discount-value">{formatPrice(discountAmount)}</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleRemovePromotion}
            className="btn-remove-promotion"
          >
            ✕ Gỡ bỏ
          </button>
        </div>
      ) : (
        <div className="promotion-input-section">
          <div className="input-group">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã khuyến mãi"
              className="promo-input"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleApplyPromotion}
              disabled={loading || !promoCode.trim()}
              className="btn-apply-promotion"
            >
              {loading ? 'Đang kiểm tra...' : 'Áp dụng'}
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {success}
            </div>
          )}
        </div>
      )}

      {/* Available promotions list - Hiển thị danh sách promotion đã lưu của customer */}
      {!appliedPromotion && (
        <div className="available-promotions">
          {loadingPromotions ? (
            <div className="loading-promotions">
              <div className="loading-spinner-small"></div>
              <span>Đang tải mã khuyến mãi đã lưu...</span>
            </div>
          ) : availablePromotions.length > 0 ? (
            <>
              <h4>Mã khuyến mãi đã lưu của bạn:</h4>
              <div className="promotion-list">
                {availablePromotions
                  .map((promotion) => (
                  <div key={promotion.promotionId} className="promotion-item">
                    <div className="promotion-details">
                      <span className="promotion-code">{promotion.code}</span>
                      <span className="promotion-discount">{formatDiscount(promotion)}</span>
                    </div>
                    <p className="promotion-description">{promotion.description}</p>
                    {promotion.minOrderAmount && (
                      <p className="min-order">
                        Đơn tối thiểu: {formatPrice(promotion.minOrderAmount)}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        // Chỉ hiển thị code lên textbox, không apply ngay
                        setPromoCode(promotion.code)
                        setError(null)
                        setSuccess(null)
                      }}
                      className="btn-use-promotion"
                    >
                      Sử dụng ngay
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : auth.user && auth.token ? (
            <div className="no-promotions">
              <p>Bạn chưa có mã khuyến mãi đã lưu nào.</p>
              <p className="hint">Nhập mã khuyến mãi ở trên để áp dụng.</p>
            </div>
          ) : null}
        </div>
      )}

      <style>{`
        .promotion-selector {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .promotion-selector h3 {
          margin: 0 0 0.875rem 0;
          color: #1e293b;
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .applied-promotion {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.75rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .promotion-info {
          flex: 1;
        }

        .promotion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;
          gap: 0.5rem;
        }

        .applied-promotion .promotion-code {
          font-weight: 700;
          font-size: 0.9rem;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .applied-promotion .promotion-discount {
          background: rgba(255,255,255,0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.7rem;
          flex-shrink: 0;
        }

        .applied-promotion .promotion-description {
          margin: 0 0 0.375rem 0;
          font-size: 0.75rem;
          opacity: 0.9;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .discount-amount {
          font-size: 0.75rem;
          opacity: 0.9;
        }

        .discount-value {
          font-weight: 700;
          color: #fbbf24;
        }

        .btn-remove-promotion {
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.75rem;
          transition: background 0.2s ease;
          width: 100%;
          margin-top: 0.25rem;
        }

        .btn-remove-promotion:hover {
          background: rgba(255,255,255,0.3);
        }

        .promotion-input-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .promo-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.8rem;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .promo-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .btn-apply-promotion {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.2s ease;
          white-space: nowrap;
          width: 100%;
        }

        .btn-apply-promotion:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-apply-promotion:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .error-message, .success-message {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .success-message {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .available-promotions {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .available-promotions h4 {
          margin: 0 0 0.75rem 0;
          color: #374151;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .promotion-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .promotion-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.625rem;
          transition: all 0.2s ease;
        }

        .promotion-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 1px 4px rgba(59, 130, 246, 0.1);
        }

        .promotion-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;
          gap: 0.5rem;
        }

        .promotion-item .promotion-code {
          font-weight: 700;
          color: #1e293b;
          font-size: 0.8rem;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .promotion-item .promotion-discount {
          background: #dbeafe;
          color: #1e40af;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .promotion-item .promotion-description {
          margin: 0 0 0.375rem 0;
          color: #6b7280;
          font-size: 0.7rem;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .min-order {
          margin: 0 0 0.375rem 0;
          color: #9ca3af;
          font-size: 0.65rem;
        }

        .remaining-usage {
          margin: 0 0 0.375rem 0;
          color: #059669;
          font-size: 0.65rem;
          font-weight: 500;
        }

        .btn-use-promotion {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 0.375rem 0.625rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .btn-use-promotion:hover:not(:disabled) {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        .btn-use-promotion:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .loading-promotions {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.75rem;
          color: #6b7280;
          font-size: 0.75rem;
        }

        .loading-spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid #e2e8f0;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-promotions {
          padding: 0.75rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.75rem;
        }

        .no-promotions .hint {
          margin-top: 0.375rem;
          color: #9ca3af;
          font-size: 0.65rem;
        }

        @media (max-width: 1024px) {
          .promotion-selector {
            padding: 0.875rem;
          }
        }

        @media (max-width: 768px) {
          .input-group {
            flex-direction: column;
          }

          .btn-apply-promotion {
            width: 100%;
          }

          .applied-promotion {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-remove-promotion {
            width: 100%;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default PromotionSelector

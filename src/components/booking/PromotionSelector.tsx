import React, { useState, useEffect } from 'react'
import { PromotionService } from '@/services/promotionService'
import type { Promotion } from '@/types/promotion'

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

  // Load available promotions
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const response = await PromotionService.getActivePromotions()
        setAvailablePromotions(response.data || [])
      } catch (error) {
        console.error('Error loading promotions:', error)
      }
    }
    loadPromotions()
  }, [])

  const validatePromotion = async (code: string): Promise<PromotionValidationResponse> => {
    try {
      // Gọi API trực tiếp để validate promotion
      const response = await fetch('/api/promotion/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          orderAmount: orderAmount,
          orderType: 'BOOKING'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi xác thực mã khuyến mãi')
      }

      return data.data
    } catch (error: any) {
      throw new Error(error.message || 'Lỗi xác thực mã khuyến mãi')
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
      const validation = await validatePromotion(promoCode)
      
      if (validation.isValid && validation.promotion) {
        onPromotionApplied(validation.promotion, validation.discountAmount)
        setSuccess(`Áp dụng mã khuyến mãi thành công! Giảm ${formatPrice(validation.discountAmount)}`)
        setPromoCode('')
      } else {
        setError(validation.message)
      }
    } catch (error: any) {
      setError(error.message)
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
      return `${promotion.discountValue}%`
    } else {
      return formatPrice(promotion.discountValue)
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

      {/* Available promotions list */}
      {availablePromotions.length > 0 && !appliedPromotion && (
        <div className="available-promotions">
          <h4>Mã khuyến mãi có sẵn:</h4>
          <div className="promotion-list">
            {availablePromotions.slice(0, 3).map((promotion) => (
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
                    setPromoCode(promotion.code)
                    handleApplyPromotion()
                  }}
                  className="btn-use-promotion"
                >
                  Sử dụng
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .promotion-selector {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1rem 0;
        }

        .promotion-selector h3 {
          margin: 0 0 1rem 0;
          color: #1e293b;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .applied-promotion {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .promotion-info {
          flex: 1;
        }

        .promotion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .promotion-code {
          font-weight: 700;
          font-size: 1.125rem;
        }

        .promotion-discount {
          background: rgba(255,255,255,0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .promotion-description {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .discount-amount {
          font-size: 0.875rem;
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
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s ease;
        }

        .btn-remove-promotion:hover {
          background: rgba(255,255,255,0.3);
        }

        .promotion-input-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-group {
          display: flex;
          gap: 0.75rem;
        }

        .promo-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }

        .promo-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .btn-apply-promotion {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
          white-space: nowrap;
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
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.875rem;
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
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .available-promotions h4 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1rem;
          font-weight: 600;
        }

        .promotion-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .promotion-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          transition: all 0.2s ease;
        }

        .promotion-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .promotion-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .promotion-item .promotion-code {
          font-weight: 700;
          color: #1e293b;
        }

        .promotion-item .promotion-discount {
          background: #dbeafe;
          color: #1e40af;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .promotion-item .promotion-description {
          margin: 0 0 0.5rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .min-order {
          margin: 0 0 0.75rem 0;
          color: #9ca3af;
          font-size: 0.75rem;
        }

        .btn-use-promotion {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-use-promotion:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
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
            align-self: flex-end;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default PromotionSelector

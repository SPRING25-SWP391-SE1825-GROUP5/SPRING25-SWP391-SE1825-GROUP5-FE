import { useState } from 'react'
import { Bookmark, BookmarkCheck, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './TicketCard.module.scss'
import type { Promotion } from '@/types/promotion'
import { useAppSelector } from '@/store/hooks'
import { PromotionBookingService } from '@/services/promotionBookingService'

type TicketCardProps = {
  promotion?: Promotion
  width?: number
  height?: number
  className?: string
  imageUrl?: string
}

export default function TicketCard({
  promotion,
  width = 720,
  height,
  className = '',
  imageUrl = 'https://picsum.photos/seed/donut/180'
}: TicketCardProps) {
  const user = useAppSelector((state) => state.auth.user)
  const [savedCodes, setSavedCodes] = useState<Set<string>>(new Set())

  const wrapperStyle: React.CSSProperties = {
    width: `${width}px`,
    height: height ? `${height}px` : 'auto',
    position: 'relative',
    minHeight: height ? `${height}px` : undefined
  }

  if (!promotion) {
    return (
      <div className={className} style={wrapperStyle}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#999',
          fontSize: '14px'
        }}>
          Không có dữ liệu khuyến mãi
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const discountLabel = promotion.discountType === 'PERCENT'
    ? `${promotion.discountValue}%`
    : `${promotion.discountValue.toLocaleString('vi-VN')}₫`

  // Màu sắc cho right panel - dựa trên promotionId
  const panelColors = ['#a5d6a7', '#ffa366', '#f8bbd0', '#fff9c4', '#c5cae9', '#ffccbc']
  const rightPanelColor = promotion ? panelColors[promotion.promotionId % panelColors.length] : '#ffa366'

  const handleSaveCode = async (code: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu mã khuyến mãi')
      return
    }

    if (user.role && user.role !== 'CUSTOMER' && user.role !== 'customer') {
      toast.error('Chức năng này chỉ dành cho khách hàng')
      return
    }

    const codeUpper = code.toUpperCase()

    if (savedCodes.has(codeUpper)) {
      toast.success('Mã này đã được lưu rồi!')
      return
    }

    try {
      const response = await PromotionBookingService.saveCustomerPromotion(code)
      
      if (response.success) {
        setSavedCodes((prev) => new Set([...prev, codeUpper]))
        toast.success(response.message || 'Đã lưu mã khuyến mãi thành công!')
      } else {
        toast.error(response.message || 'Không thể lưu mã khuyến mãi')
      }
    } catch (err: unknown) {
      const error = err as { 
        message?: string
        response?: { 
          data?: { message?: string }
          status?: number
        }
      }
      
      const errorMessage = error.message || error.response?.data?.message || 'Không thể lưu mã khuyến mãi'
      
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền thực hiện hành động này. Vui lòng kiểm tra lại tài khoản.')
      } else if (error.response?.status === 500) {
        toast.error('Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.')
      } else {
        toast.error(errorMessage)
      }
    }
  }

  return (
    <div className={className} style={wrapperStyle}>
      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <div className={styles.leftInner}>
            <div className={styles.titleBlock}>
              <div className={styles.titleLine1}>{promotion.description}</div>
            </div>

            {/* details chips based on promotion */}
            <div className={styles.detailsRow}>
              <span className={styles.chip}>Mã: {promotion.code}</span>
              <span className={styles.chip}>Ưu đãi: {discountLabel}</span>
              {promotion.maxDiscount !== null && (
                <span className={styles.chip}>Giảm tối đa: {promotion.maxDiscount.toLocaleString('vi-VN')} ₫</span>
              )}
              <span className={styles.chip}>Hiệu lực: {formatDate(promotion.startDate)} - {promotion.endDate ? formatDate(promotion.endDate) : 'Không giới hạn'}</span>
              {promotion.minOrderAmount !== null && (
                <span className={styles.chip}>Tối thiểu {promotion.minOrderAmount.toLocaleString('vi-VN')}₫</span>
              )}
              {promotion.usageLimit !== null && (() => {
                const remaining = Math.max((promotion.remainingUsage ?? (promotion.usageLimit - promotion.usageCount)), 0)
                return (
                  <div className={styles.usageChip}>
                    <div className={styles.usageLine}>
                      <div 
                        className={styles.usageLineFill}
                        style={{
                          width: `${(remaining / promotion.usageLimit) * 100}%`
                        }}
                      />
                    </div>
                    <span className={styles.usageText}>{remaining}/{promotion.usageLimit}</span>
                  </div>
                )
              })()}
            </div>
            <div className={styles.descriptionContainer}>
              <div className={styles.descriptionText}>
                {promotion.description}
              </div>
              <div className={styles.infoIconWrapper} title="Hover để xem mô tả đầy đủ">
                <Info 
                  size={14} 
                  className={styles.infoIcon}
                />
                <div className={styles.descriptionTooltip}>
                  {promotion.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div 
          className={styles.rightPanel}
          style={{ background: rightPanelColor }}
        >
          <div className={styles.rightInner}>
            <div className={styles.discountGroup}>
              <div className={styles.percentText}>{discountLabel}</div>
              <div className={styles.discountText}>DISCOUNT</div>
            </div>
            <span 
              className={`${styles.chip} ${styles.codeChip} ${styles.saveable} ${styles.rightChip}`}
              onClick={() => handleSaveCode(promotion.code)}
              title={savedCodes.has(promotion.code.toUpperCase()) ? "Đã lưu" : "Click để lưu mã"}
            >
              {promotion.code}
              {savedCodes.has(promotion.code.toUpperCase()) ? (
                <BookmarkCheck size={12} className={styles.saveIcon} />
              ) : (
                <Bookmark size={12} className={styles.saveIcon} />
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

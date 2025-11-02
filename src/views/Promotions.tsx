import { useEffect, useState } from 'react'
import TicketCard from '@/components/common/TicketCard'
import PromotionBanner from '@/components/common/PromotionBanner'
import { PromotionService } from '@/services/promotionService'
import { handleApiError } from '@/utils/errorHandler'
import type { Promotion } from '@/types/promotion'
import styles from './Promotions.module.scss'

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
      setLoading(true)
        const res = await PromotionService.getActivePromotions()
        const list = res?.data ?? []
        setPromotions(list)
      setError(null)
      } catch (e) {
        setError('Không thể tải khuyến mãi')
        handleApiError(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className={styles.promotionsPage}>
      {/* Promotion Banner - Full Width, sát header */}
      <div className={styles.bannerWrapper}>
        <PromotionBanner />
        </div>

      <div className={styles.contentWrapper}>
        <div className={styles.container}>
        {loading && (
            <div className={styles.loading}>Đang tải...</div>
          )}
          {!loading && error && (
            <div className={styles.error}>{error}</div>
          )}
          {!loading && !error && promotions.length === 0 && (
            <div className={styles.empty}>Không có khuyến mãi nào</div>
          )}
          {!loading && !error && promotions.length > 0 && (
            <div className={styles.grid}>
              {promotions.map((promotion) => (
                <div key={promotion.promotionId} className={styles.cardWrapper}>
                  <TicketCard 
                    promotion={promotion}
                    width={600}
                    height={280}
                  />
                </div>
              ))}
                    </div>
                  )}
                </div>
              </div>
    </div>
  )
}

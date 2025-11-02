import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { savePromotion, clearAllSavedPromotions } from '@/store/promoSlice'
import { PromotionService, type Promotion } from '@/services/promotionService'
import { PromotionBookingService } from '@/services/promotionBookingService'
import { CustomerService } from '@/services/customerService'
import { handleApiError } from '@/utils/errorHandler'
import toast from 'react-hot-toast'
import { Percent, DollarSign, Truck, Sparkles } from 'lucide-react'
import TicketCard from '@/components/common/TicketCard'
import PromotionBanner from '@/components/common/PromotionBanner'
import type { Promotion as PromotionType } from '@/types/promotion'
import styles from './Promotions.module.scss'

export default function Promotions() {
  // Redux and hooks must be declared first
  const dispatch = useAppDispatch()
  const auth = useAppSelector(state => state.auth)
  const promo = useAppSelector(state => state.promo)
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const typeParam = searchParams.get('type')

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [savingPromotion, setSavingPromotion] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')

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

  // Load customerId when user is logged in
  useEffect(() => {
    const loadCustomerId = async () => {
      if (!auth.user?.id) {
        return
      }

      try {
        const response = await CustomerService.getCurrentCustomer()
        if (response.success && response.data) {
          setCustomerId(response.data.customerId)
        }
      } catch (error) {
        console.error('Error loading customerId:', error)
      }
    }

    loadCustomerId()
  }, [auth.user?.id])

  // Load saved promotions from API when user is logged in
  useEffect(() => {
    const loadSavedPromotions = async () => {
      if (!customerId) {
        // Clear saved promotions if customerId is not available
        return
      }

      try {
        const savedPromotions = await PromotionBookingService.getSavedPromotions()

        // Clear existing saved promotions first
        dispatch(clearAllSavedPromotions())

        // Convert API response to Redux format and dispatch
        if (Array.isArray(savedPromotions) && savedPromotions.length > 0) {
          savedPromotions.forEach((promo) => {

            // Validate promotion data
            if (!promo.code || !promo.description) {
              console.warn('Invalid promotion data:', promo)
              return
            }

            const promotionData = {
              id: String(promo.code), // Use code as id for consistency with API
              code: promo.code,
              title: promo.description,
              description: promo.description,
              type: 'percentage' as const, // Default type, could be enhanced
              value: promo.discountAmount || 0,
              validFrom: new Date().toISOString(),
              validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
              isActive: true,
              usageLimit: 1,
              usedCount: 0
            }
            dispatch(savePromotion(promotionData))
          })
        }
      } catch (error) {
        console.error('Error loading saved promotions:', error)
        // Clear saved promotions on error
        dispatch(clearAllSavedPromotions())
      }
    }

    loadSavedPromotions()
  }, [customerId, dispatch])

  // Update filter based on URL params
  useEffect(() => {
    if (categoryParam && typeParam) {
      // Set filter based on category to show relevant promotions
      setActiveFilter('all') // For now, show all but we could create specific filters
    }
  }, [categoryParam, typeParam])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Không xác định'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Không xác định'
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSavePromotion = async (promotion: any) => {

    if (!auth.user?.id) {
      toast.error('Vui lòng đăng nhập để lưu khuyến mãi')
      return
    }

    if (isPromotionSaved(promotion.code)) {
      toast.error('Khuyến mãi này đã được lưu')
      return
    }

    // Validate promotion before saving
    const validationError = validatePromotionForSaving(promotion)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSavingPromotion(promotion.code)

    try {
      // Get customerId if not available
      let currentCustomerId = customerId
      if (!currentCustomerId) {
        const response = await CustomerService.getCurrentCustomer()
        if (response.success && response.data) {
          currentCustomerId = response.data.customerId
          setCustomerId(currentCustomerId)
        } else {
          toast.error('Không thể xác định thông tin khách hàng')
          setSavingPromotion(null)
          return
        }
      }

      if (!currentCustomerId) {
        toast.error('Không thể xác định thông tin khách hàng')
        setSavingPromotion(null)
        return
      }

      // Call API to save promotion
      await PromotionBookingService.saveCustomerPromotion(promotion.code)

      // Convert promotion to Redux format
      const promotionData = {
        id: String(promotion.code), // Use code as id for consistency with API
        code: promotion.code,
        title: promotion.description,
        description: promotion.description,
        type: promotion.discountType === 'PERCENT' ? 'percentage' as const :
              promotion.discountType === 'FIXED' ? 'fixed' as const : 'shipping' as const,
        value: promotion.discountValue || promotion.discountAmount || 0,
        minOrder: promotion.minOrderAmount,
        validFrom: promotion.startDate || new Date().toISOString(),
        validTo: promotion.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: promotion.isActive !== false,
        usageLimit: promotion.usageLimit,
        usedCount: promotion.usageCount || 0
      }

      // Update Redux store
      dispatch(savePromotion(promotionData))

      toast.success('Đã lưu khuyến mãi thành công!')
    } catch (error: any) {
      console.error('Error saving promotion:', error)
      toast.error(error.message || 'Lỗi khi lưu khuyến mãi')
    } finally {
      setSavingPromotion(null)
    }
  }

  // Validate promotion before saving
  const validatePromotionForSaving = (promotion: any): string | null => {
    const today = new Date()

    // Check if promotion is active
    if (promotion.isActive === false) {
      return 'Khuyến mãi này không còn hoạt động'
    }

    // Check if promotion has started
    if (promotion.startDate) {
      const startDate = new Date(promotion.startDate)
      if (startDate > today) {
        return 'Khuyến mãi chưa có hiệu lực'
      }
    }

    // Check if promotion has expired
    if (promotion.endDate) {
      const endDate = new Date(promotion.endDate)
      if (endDate < today) {
        return 'Khuyến mãi đã hết hạn'
      }
    }

    // Check if usage limit exceeded
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return 'Khuyến mãi đã hết lượt sử dụng'
    }

    return null // No validation errors
  }

  // Check if promotion can be saved
  const canPromotionBeSaved = (promotion: any): boolean => {
    const validationError = validatePromotionForSaving(promotion)
    return validationError === null
  }

  const isPromotionSaved = (promotionId: string) => {
    // Since we now use code as id consistently, check by code
    const isSaved = promo?.savedPromotions?.some(p => p.code === promotionId) || false
    return isSaved
  }

  // Filter categories based on actual data
  const filterCategories = [
    { id: 'all', label: 'Tất cả', count: Array.isArray(promotions) ? promotions.length : 0 },
    { id: 'percentage', label: 'Giảm %', count: Array.isArray(promotions) ? promotions.filter(p => p.discountType === 'PERCENT').length : 0 },
    { id: 'fixed', label: 'Giảm tiền', count: Array.isArray(promotions) ? promotions.filter(p => p.discountType === 'FIXED').length : 0 },
    { id: 'shipping', label: 'Free ship', count: 0 },
    { id: 'saved', label: 'Đã lưu', count: promo?.savedPromotions?.length || 0 }
  ]

  // Filter promotions based on active filter
  const filteredPromotions = () => {
    if (!Array.isArray(promotions)) return []

    switch (activeFilter) {
      case 'percentage':
        return promotions.filter(p => p.discountType === 'PERCENT')
      case 'fixed':
        return promotions.filter(p => p.discountType === 'FIXED')
      case 'shipping':
        return promotions.filter(p => p.discountType === 'FIXED') // Fallback since SHIPPING doesn't exist
      case 'saved':
        return promotions.filter(p => isPromotionSaved(p.code))
      default:
        return promotions
    }
  }

  const getPromotionBadge = (promotion: any) => {
    switch (promotion.type) {
      case 'percentage':
        return {
          text: `${promotion.value}%`,
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          icon: <Percent size={16} />
        }
      case 'fixed':
        return {
          text: `${(promotion.value / 1000)}K`,
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          icon: <DollarSign size={16} />
        }
      case 'shipping':
        return {
          text: 'FREE',
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          icon: <Truck size={16} />
        }
      default:
        return {
          text: 'NEW',
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          icon: <Sparkles size={16} />
        }
    }
  }

  // Get page title based on URL params
  const getPageTitle = () => {
    if (categoryParam && typeParam) {
      const categoryNames: Record<string, string> = {
        'service': 'Khuyến mãi dịch vụ',
        'products': 'Khuyến mãi sản phẩm',
        'special': 'Chương trình đặc biệt'
      }

      const typeNames: Record<string, string> = {
        'monthly': 'Ưu đãi tháng',
        'seasonal': 'Ưu đãi mùa',
        'vip': 'Thành viên VIP',
        'loyalty': 'Khách hàng thân thiết',
        'combo': 'Combo tiết kiệm',
        'clearance': 'Thanh lý',
        'new': 'Sản phẩm mới',
        'bestseller': 'Bán chạy nhất',
        'flash': 'Flash Sale',
        'holiday': 'Lễ hội',
        'anniversary': 'Kỷ niệm',
        'referral': 'Giới thiệu bạn bè'
      }

      return {
        category: categoryNames[categoryParam] || 'Ưu đãi',
        type: typeNames[typeParam] || '',
        showBreadcrumb: true
      }
    }

    return {
      category: 'Ưu đãi & Khuyến mãi',
      type: '',
      showBreadcrumb: false
    }
  }

  const pageInfo = getPageTitle()


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

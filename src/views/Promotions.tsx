import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PromotionService, type Promotion } from '@/services/promotionService'
import { handleApiError } from '@/utils/errorHandler'
import { 
  Gift, 
  Percent, 
  DollarSign, 
  Truck, 
  Sparkles,
  Clock,
  Tag,
  Star,
  Calendar
} from 'lucide-react'
import './promotions.scss'

export default function Promotions() {
  const [searchParams] = useSearchParams()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Get URL parameters
  const categoryParam = searchParams.get('category')
  const typeParam = searchParams.get('type')

  // Hàm kiểm tra promotion còn có thể sử dụng
  const isPromotionUsable = (promotion: Promotion): boolean => {
    // Kiểm tra trạng thái active
    if (!promotion.isActive) return false
    
    // Kiểm tra đã hết hạn chưa
    if (promotion.isExpired) return false
    
    // Kiểm tra đã đạt giới hạn sử dụng chưa
    if (promotion.isUsageLimitReached) return false
    
    // Kiểm tra còn lượt sử dụng không (nếu có usageLimit)
    if (promotion.usageLimit && promotion.remainingUsage <= 0) return false
    
    // Kiểm tra endDate (nếu có)
    if (promotion.endDate) {
      const endDate = new Date(promotion.endDate)
      const now = new Date()
      if (endDate < now) return false
    }
    
    // Kiểm tra startDate đã đến chưa
    if (promotion.startDate) {
      const startDate = new Date(promotion.startDate)
      const now = new Date()
      if (startDate > now) return false
    }
    
    // Kiểm tra status
    if (promotion.status !== 'ACTIVE') return false
    
    return true
  }

  // Load promotions from API
  useEffect(() => {
    const loadPromotions = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await PromotionService.getActivePromotions()
        
        if (result.data && result.data.length > 0) {
          // Lọc chỉ lấy những promotion còn có thể sử dụng
          const usablePromotions = result.data.filter(isPromotionUsable)
          
          if (usablePromotions.length > 0) {
            setPromotions(usablePromotions)
          } else {
            setPromotions([])
            setError('Không có khuyến mãi nào còn khả dụng')
          }
        } else {
          setPromotions([])
          setError('Không có khuyến mãi nào')
        }
      } catch (error) {
        const errorMessage = 'Không thể tải danh sách khuyến mãi'
        setError(errorMessage)
        handleApiError(error)
        setPromotions([])
      } finally {
        setLoading(false)
      }
    }

    loadPromotions()
  }, [])


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


  // Filter categories based on actual data
  const filterCategories = [
    { id: 'all', label: 'Tất cả', count: Array.isArray(promotions) ? promotions.length : 0 },
    { id: 'percentage', label: 'Giảm %', count: Array.isArray(promotions) ? promotions.filter(p => p.discountType === 'PERCENT').length : 0 },        
    { id: 'fixed', label: 'Giảm tiền', count: Array.isArray(promotions) ? promotions.filter(p => p.discountType === 'FIXED').length : 0 },
    { id: 'shipping', label: 'Free ship', count: 0 }
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
      default:
        return promotions
    }
  }

  const getPromotionBadge = (promotion: Promotion) => {
    // Xử lý dựa trên discountType thay vì type
    if (promotion.discountType === 'PERCENT') {
      return { 
        text: `${promotion.discountValue}%`, 
        color: '#059669',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: <Percent size={16} />
      }
    } else if (promotion.discountType === 'FIXED') {
      return { 
        text: `${Math.round(promotion.discountValue / 1000)}K`, 
        color: '#2563eb',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        icon: <DollarSign size={16} />
      }
    } else if (promotion.discountType === 'SHIPPING') {
      return { 
        text: 'FREE', 
        color: '#7c3aed',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        icon: <Truck size={16} />
      }
    } else {
      return { 
        text: 'NEW', 
        color: '#8B6914', // primary-700 từ color scheme
        bgColor: 'rgba(255, 216, 117, 0.15)',
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
    <div className="promotions-page">
      <div className="promotions-page__container">
        {/* Breadcrumb */}
        {pageInfo.showBreadcrumb && (
          <div className="promotions-page__breadcrumb">
            <a 
              href="/promotions" 
              onClick={(e) => {
                e.preventDefault()
                window.location.href = '/promotions'
              }}
            >
              Tất cả khuyến mãi
            </a>
            <span>/</span>
            <span className="active">
              {pageInfo.category}
            </span>
            {pageInfo.type && (
              <>
                <span>/</span>
                <span className="active">
                  {pageInfo.type}
                </span>
              </>
            )}
          </div>
        )}

        <div className="promotions-page__header">
          <div className="promotions-page__header-icon">
            <Gift size={28} />
          </div>
          <h1>
            {pageInfo.showBreadcrumb ? pageInfo.type || pageInfo.category : pageInfo.category}
          </h1>
          <p>
            {pageInfo.showBreadcrumb 
              ? `Khám phá các ${pageInfo.type?.toLowerCase() || pageInfo.category.toLowerCase()} đặc biệt dành cho bạn`
              : 'Lưu khuyến mãi yêu thích để sử dụng khi thanh toán'
            }
          </p>
        </div>

        {/* Category Info Banner */}
        {pageInfo.showBreadcrumb && (
          <div className="promotions-page__category-banner">
            <div className="promotions-page__category-banner-icon">
              ✓
            </div>
            <h3>
              Bạn đang xem: {pageInfo.type || pageInfo.category}
            </h3>
            <p>
              Tất cả khuyến mãi đều có sẵn để bạn lưu và sử dụng khi thanh toán
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="promotions-page__loading">
            Đang tải khuyến mãi...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="promotions-page__error">
            {error}
          </div>
        )}

        {/* Filter Tabs - Only show when not loading and no error */}
        {!loading && !error && (
          <div className="promotions-page__filters">
            <div className="promotions-page__filters-container">
              {filterCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(category.id)}
                  className={`promotions-page__filters-button ${activeFilter === category.id ? 'active' : ''}`}
                >
                  {category.label}
                  <span className="promotions-page__filters-button-badge">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Promotions Grid - Only show when not loading and no error */}
        {!loading && !error && (
          <div className="promotions-page__grid">
            {filteredPromotions().map(promotion => {
              const badge = getPromotionBadge(promotion)
              // Xác định loại badge để dùng class phù hợp
              const badgeClass = promotion.discountType === 'PERCENT' ? 'promotions-page__card-badge--percent' :
                               promotion.discountType === 'FIXED' ? 'promotions-page__card-badge--fixed' :
                               promotion.discountType === 'SHIPPING' ? 'promotions-page__card-badge--shipping' : ''
              
              return (
                <div key={promotion.promotionId} className="promotions-page__card">
                  <div className="promotions-page__card-header">
                    <div>
                      {promotion.discountType === 'PERCENT' ? <Percent size={40} /> :
                       promotion.discountType === 'FIXED' ? <DollarSign size={40} /> :
                       promotion.discountType === 'SHIPPING' ? <Truck size={40} /> : <Sparkles size={40} />}
                    </div>
                    
                    {/* Promotion Badge */}
                    <div className={`promotions-page__card-badge ${badgeClass}`}>
                      {badge.icon}
                      {badge.text}
                    </div>
                  </div>
                  
                  <div className="promotions-page__card-body">
                    <h3 className="promotions-page__card-title">
                      {promotion.description}
                    </h3>
                    
                    <div className="promotions-page__card-code">
                      <Tag size={14} />
                      Mã: {promotion.code}
                    </div>

                    <p className="promotions-page__card-description">
                      {promotion.description}
                    </p>

                    <div className="promotions-page__card-info-row">
                      <div className="promotions-page__card-info-box">
                        <Clock size={14} />
                        <span>
                          {promotion.minOrderAmount ? `Tối thiểu ${formatPrice(promotion.minOrderAmount)}` : 'Không giới hạn'}
                        </span>
                      </div>
                      <div className="promotions-page__card-info-box promotions-page__card-info-box--highlight">
                        <Star size={14} />
                        <span>
                          Còn {promotion.usageLimit ? promotion.usageLimit - promotion.usageCount : '∞'} lượt
                        </span>
                      </div>
                    </div>

                    {/* Date Range Display */}
                    <div className="promotions-page__card-date-box">
                      <div className="promotions-page__card-date-box-header">
                        <Calendar size={14} />
                        <span>Thời gian áp dụng</span>
                      </div>
                      <div className="promotions-page__card-date-box-dates">
                        <div className="promotions-page__card-date-box-date-item">
                          <span>Bắt đầu:</span>
                          <span>{formatDate(promotion.startDate)}</span>
                        </div>
                        <div className="promotions-page__card-date-box-date-item">
                          <span>Kết thúc:</span>
                          <span>{formatDate(promotion.endDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { savePromotion, unsavePromotion } from '@/store/promoSlice'
import { PromotionService, type Promotion } from '@/services/promotionService'
import { handleApiError } from '@/utils/errorHandler'
import toast from 'react-hot-toast'
import { 
  Gift, 
  Percent, 
  DollarSign, 
  Truck, 
  Bookmark, 
  BookmarkCheck,
  Sparkles,
  CheckCircle,
  Clock,
  Tag,
  ShoppingCart,
  Heart,
  Star
} from 'lucide-react'

export default function Promotions() {
  const dispatch = useAppDispatch()
  const promo = useAppSelector((state) => state.promo)
  const [searchParams] = useSearchParams()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Get URL parameters
  const categoryParam = searchParams.get('category')
  const typeParam = searchParams.get('type')

  // Load promotions from API
  useEffect(() => {
    const loadPromotions = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await PromotionService.getActivePromotions()
        
        if (result.success) {
          setPromotions(result.data)
        } else {
          setError(result.message)
          handleApiError({ message: result.message })
        }
      } catch (error) {
        const errorMessage = 'Không thể tải danh sách khuyến mãi'
        setError(errorMessage)
        handleApiError(error)
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

  const handleSavePromotion = (promotion: any) => {
    dispatch(savePromotion(promotion))
  }

  const handleUnsavePromotion = (promotionId: string) => {
    dispatch(unsavePromotion(promotionId))
  }

  const isPromotionSaved = (promotionId: string) => {
    return promo?.savedPromotions?.some(p => p.id === promotionId) || false
  }

  // Filter categories based on actual data
  const filterCategories = [
    { id: 'all', label: 'Tất cả', count: Array.isArray(promotions) ? promotions.length : 0 },
    { id: 'percentage', label: 'Giảm %', count: Array.isArray(promotions) ? promotions.filter(p => p.type === 'percentage').length : 0 },
    { id: 'fixed', label: 'Giảm tiền', count: Array.isArray(promotions) ? promotions.filter(p => p.type === 'fixed').length : 0 },
    { id: 'shipping', label: 'Free ship', count: Array.isArray(promotions) ? promotions.filter(p => p.type === 'shipping').length : 0 },
    { id: 'saved', label: 'Đã lưu', count: promo?.savedPromotions?.length || 0 }
  ]

  // Filter promotions based on active filter
  const filteredPromotions = () => {
    if (!Array.isArray(promotions)) return []
    
    switch (activeFilter) {
      case 'percentage':
        return promotions.filter(p => p.type === 'percentage')
      case 'fixed':
        return promotions.filter(p => p.type === 'fixed')
      case 'shipping':
        return promotions.filter(p => p.type === 'shipping')
      case 'saved':
        return promotions.filter(p => isPromotionSaved(p.id))
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
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: 'calc(100vh - 64px)',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      marginTop: '64px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px 64px'
      }}>
        {/* Breadcrumb */}
        {pageInfo.showBreadcrumb && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#757575'
          }}>
            <a 
              href="/promotions" 
              style={{ 
                color: '#757575', 
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.preventDefault()
                window.location.href = '/promotions'
              }}
            >
              Tất cả khuyến mãi
            </a>
            <span>/</span>
            <span style={{ color: '#111111', fontWeight: '500' }}>
              {pageInfo.category}
            </span>
            {pageInfo.type && (
              <>
                <span>/</span>
                <span style={{ color: '#111111', fontWeight: '500' }}>
                  {pageInfo.type}
                </span>
              </>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <Gift size={24} />
            </div>
            <h1 style={{
              fontSize: '40px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {pageInfo.showBreadcrumb ? pageInfo.type || pageInfo.category : pageInfo.category}
            </h1>
          </div>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            margin: '0',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6'
          }}>
            {pageInfo.showBreadcrumb 
              ? `Khám phá các ${pageInfo.type?.toLowerCase() || pageInfo.category.toLowerCase()} đặc biệt dành cho bạn`
              : 'Lưu khuyến mãi yêu thích để sử dụng khi thanh toán'
            }
          </p>
        </div>

        {/* Category Info Banner */}
        {pageInfo.showBreadcrumb && (
          <div style={{
            background: '#ffffff',
            border: '2px solid #000000',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              background: '#000000',
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '20px',
              color: '#ffffff',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#000000',
              margin: '0 0 8px 0'
            }}>
              Bạn đang xem: {pageInfo.type || pageInfo.category}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#666666',
              margin: '0'
            }}>
              Tất cả khuyến mãi đều có sẵn để bạn lưu và sử dụng khi thanh toán
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            fontSize: '18px',
            color: '#666666'
          }}>
            Đang tải khuyến mãi...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            fontSize: '18px',
            color: '#ef4444',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Filter Tabs - Only show when not loading and no error */}
        {!loading && !error && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
            marginBottom: '48px'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            {filterCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: activeFilter === category.id ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: activeFilter === category.id ? '#ffffff' : '#64748b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: activeFilter === category.id ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                {category.label}
                <span style={{
                  background: activeFilter === category.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  color: activeFilter === category.id ? '#ffffff' : '#10b981',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Promotions Grid - Only show when not loading and no error */}
        {!loading && !error && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {filteredPromotions().map(promotion => {
            const badge = getPromotionBadge(promotion)
            return (
            <div key={promotion.id} style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '100%',
                height: '120px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                borderBottom: '1px solid #e2e8f0'
              }}>
                {/* Large promotion icon */}
                <div style={{
                  color: '#10b981',
                  opacity: 0.8
                }}>
                  {promotion.type === 'percentage' ? <Percent size={48} /> : 
                   promotion.type === 'fixed' ? <DollarSign size={48} /> : 
                   promotion.type === 'shipping' ? <Truck size={48} /> : <Sparkles size={48} />}
                </div>
                
                {/* Promotion Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: badge.bgColor,
                  color: badge.color,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: `1px solid ${badge.color}20`
                }}>
                  {badge.icon}
                  {badge.text}
                </div>
                
                {/* Saved Badge */}
                {isPromotionSaved(promotion.id) && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}>
                    <BookmarkCheck size={12} />
                    LƯU
                  </div>
                )}
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 8px 0',
                      lineHeight: '1.4'
                    }}>
                      {promotion.title}
                    </h3>
                    <div style={{
                      fontSize: '14px',
                      color: '#10b981',
                      fontFamily: 'monospace',
                      marginBottom: '8px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Tag size={14} />
                      Mã: {promotion.code}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => isPromotionSaved(promotion.id) 
                      ? handleUnsavePromotion(promotion.id)
                      : handleSavePromotion(promotion)
                    }
                    style={{
                      background: isPromotionSaved(promotion.id) 
                        ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : 'transparent',
                      border: `2px solid ${isPromotionSaved(promotion.id) ? '#10b981' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      color: isPromotionSaved(promotion.id) ? '#ffffff' : '#10b981',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isPromotionSaved(promotion.id) ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                  >
                    {isPromotionSaved(promotion.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </div>

                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: '1.6',
                  marginBottom: '20px'
                }}>
                  {promotion.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: 1
                  }}>
                    <Clock size={14} color="#10b981" />
                    <span style={{
                  fontSize: '12px',
                      color: '#10b981',
                  fontWeight: '600'
                  }}>
                    {promotion.minOrder ? `Tối thiểu ${formatPrice(promotion.minOrder)}` : 'Không giới hạn'}
                  </span>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}>
                    <Star size={14} />
                  <span style={{
                      fontSize: '12px',
                      fontWeight: '600'
                  }}>
                    Còn {promotion.usageLimit ? promotion.usageLimit - promotion.usedCount : '∞'} lượt
                  </span>
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

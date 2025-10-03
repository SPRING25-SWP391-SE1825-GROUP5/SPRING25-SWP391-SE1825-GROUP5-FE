import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { savePromotion, unsavePromotion } from '@/store/promoSlice'

export default function Promotions() {
  const dispatch = useAppDispatch()
  const promo = useAppSelector((state) => state.promo)
  const [searchParams] = useSearchParams()
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Get URL parameters
  const categoryParam = searchParams.get('category')
  const typeParam = searchParams.get('type')

  // Update filter based on URL params
  useEffect(() => {
    if (categoryParam && typeParam) {
      console.log('URL params:', { categoryParam, typeParam })
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

  // All available promotions (including more options)
  const availablePromotions = [
    {
      id: 'promo1',
      code: 'NEWUSER20',
      title: 'Giảm 20% cho khách hàng mới',
      description: 'Dành cho đơn hàng đầu tiên từ 1 triệu VNĐ',
      type: 'percentage' as const,
      value: 20,
      minOrder: 1000000,
      maxDiscount: 500000,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      isActive: true,
      usageLimit: 1,
      usedCount: 0,
      category: ['parts', 'accessories'],
      image: 'https://via.placeholder.com/300x150/22c55e/ffffff?text=20%25+OFF'
    },
    {
      id: 'promo2',
      code: 'FREESHIP',
      title: 'Miễn phí vận chuyển',
      description: 'Áp dụng cho tất cả đơn hàng từ 500K',
      type: 'shipping' as const,
      value: 200000,
      minOrder: 500000,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      isActive: true,
      usageLimit: 999,
      usedCount: 45,
      image: 'https://via.placeholder.com/300x150/3b82f6/ffffff?text=FREE+SHIP'
    },
    {
      id: 'promo3',
      code: 'SAVE500K',
      title: 'Giảm 500K',
      description: 'Cho đơn hàng từ 5 triệu VNĐ',
      type: 'fixed' as const,
      value: 500000,
      minOrder: 5000000,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      isActive: true,
      usageLimit: 100,
      usedCount: 23,
      category: ['equipment'],
      image: 'https://via.placeholder.com/300x150/ef4444/ffffff?text=500K+OFF'
    },
    {
      id: 'promo4',
      code: 'BIRTHDAY15',
      title: 'Sinh nhật 15%',
      description: 'Khuyến mãi sinh nhật tháng này',
      type: 'percentage' as const,
      value: 15,
      minOrder: 2000000,
      maxDiscount: 1000000,
      validFrom: '2024-01-01',
      validTo: '2024-01-31',
      isActive: true,
      usageLimit: 1,
      usedCount: 0,
      image: 'https://via.placeholder.com/300x150/f59e0b/ffffff?text=15%25+BIRTHDAY'
    },
    {
      id: 'promo5',
      code: 'MEMBER10',
      title: 'Thành viên VIP 10%',
      description: 'Dành cho thành viên VIP',
      type: 'percentage' as const,
      value: 10,
      minOrder: 1500000,
      maxDiscount: 300000,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      isActive: true,
      usageLimit: 5,
      usedCount: 2,
      image: 'https://via.placeholder.com/300x150/8b5cf6/ffffff?text=VIP+10%25'
    },
    {
      id: 'promo6',
      code: 'WEEKEND30',
      title: 'Cuối tuần giảm 30%',
      description: 'Khuyến mãi đặc biệt cuối tuần',
      type: 'percentage' as const,
      value: 30,
      minOrder: 3000000,
      maxDiscount: 1000000,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      isActive: true,
      usageLimit: 50,
      usedCount: 12,
      category: ['parts'],
      image: 'https://via.placeholder.com/300x150/ec4899/ffffff?text=30%25+WEEKEND'
    },
    {
      id: 'promo7',
      code: 'BULK1M',
      title: 'Mua sỉ giảm 1 triệu',
      description: 'Cho đơn hàng từ 10 triệu VNĐ',
      type: 'fixed' as const,
      value: 1000000,
      minOrder: 10000000,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      isActive: true,
      usageLimit: 20,
      usedCount: 5,
      category: ['equipment'],
      image: 'https://via.placeholder.com/300x150/6366f1/ffffff?text=1M+BULK'
    },
    {
      id: 'promo8',
      code: 'STUDENT15',
      title: 'Học sinh - sinh viên 15%',
      description: 'Giảm giá đặc biệt cho học sinh, sinh viên',
      type: 'percentage' as const,
      value: 15,
      minOrder: 800000,
      maxDiscount: 400000,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      isActive: true,
      usageLimit: 200,
      usedCount: 67,
      image: 'https://via.placeholder.com/300x150/14b8a6/ffffff?text=STUDENT+15%25'
    }
  ]

  // Filter categories
  const filterCategories = [
    { id: 'all', label: 'Tất cả', count: availablePromotions.length },
    { id: 'percentage', label: 'Giảm %', count: availablePromotions.filter(p => p.type === 'percentage').length },
    { id: 'fixed', label: 'Giảm tiền', count: availablePromotions.filter(p => p.type === 'fixed').length },
    { id: 'shipping', label: 'Free ship', count: availablePromotions.filter(p => p.type === 'shipping').length },
    { id: 'saved', label: 'Đã lưu', count: promo?.savedPromotions?.length || 0 }
  ]

  // Filter promotions based on active filter
  const filteredPromotions = () => {
    switch (activeFilter) {
      case 'percentage':
        return availablePromotions.filter(p => p.type === 'percentage')
      case 'fixed':
        return availablePromotions.filter(p => p.type === 'fixed')
      case 'shipping':
        return availablePromotions.filter(p => p.type === 'shipping')
      case 'saved':
        return availablePromotions.filter(p => isPromotionSaved(p.id))
      default:
        return availablePromotions
    }
  }

  const getPromotionBadge = (promotion: any) => {
    switch (promotion.type) {
      case 'percentage':
        return { text: `${promotion.value}%`, color: '#000000' }
      case 'fixed':
        return { text: `${(promotion.value / 1000)}K`, color: '#000000' }
      case 'shipping':
        return { text: 'FREE', color: '#000000' }
      default:
        return { text: 'NEW', color: '#000000' }
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
      background: '#ffffff',
      minHeight: 'calc(100vh - 64px)',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 48px 96px'
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
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* Tailwind-style icon */}
            <div style={{
              width: '32px',
              height: '32px',
              background: '#000000',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              %
            </div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '500',
              color: '#000000',
              margin: '0'
            }}>
              {pageInfo.showBreadcrumb ? pageInfo.type || pageInfo.category : pageInfo.category}
            </h1>
          </div>
          <p style={{
            fontSize: '18px',
            color: '#666666',
            margin: '0'
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

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '48px',
          borderBottom: '1px solid #e5e5e5'
        }}>
          <div style={{
            display: 'flex',
            gap: '2px',
            background: '#ffffff',
            border: '2px solid #000000',
            borderRadius: '8px',
            padding: '4px'
          }}>
            {filterCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: activeFilter === category.id ? '#000000' : '#ffffff',
                  color: activeFilter === category.id ? '#ffffff' : '#000000',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {category.label}
                <span style={{
                  background: activeFilter === category.id ? '#ffffff' : '#000000',
                  color: activeFilter === category.id ? '#000000' : '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

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
              border: '2px solid #000000',
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}>
              <div style={{
                width: '100%',
                height: '150px',
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                borderBottom: '2px solid #000000'
              }}>
                {/* Large promotion icon */}
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {promotion.type === 'percentage' ? '%' : 
                   promotion.type === 'fixed' ? '$' : 
                   promotion.type === 'shipping' ? '📦' : '★'}
                </div>
                
                {/* Promotion Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: '#000000',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {badge.text}
                </div>
                
                {/* Saved Badge */}
                {isPromotionSaved(promotion.id) && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#000000',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>
                    ✓ LƯU
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
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#000000',
                      margin: '0 0 8px 0'
                    }}>
                      {promotion.title}
                    </h3>
                    <div style={{
                      fontSize: '14px',
                      color: '#666666',
                      fontFamily: 'monospace',
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      Mã: {promotion.code}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => isPromotionSaved(promotion.id) 
                      ? handleUnsavePromotion(promotion.id)
                      : handleSavePromotion(promotion)
                    }
                    style={{
                      background: isPromotionSaved(promotion.id) ? '#000000' : '#ffffff',
                      border: '2px solid #000000',
                      borderRadius: '4px',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      color: isPromotionSaved(promotion.id) ? '#ffffff' : '#000000',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    {isPromotionSaved(promotion.id) ? '✓' : '+'}
                  </button>
                </div>

                <p style={{
                  fontSize: '14px',
                  color: '#666666',
                  lineHeight: '1.5',
                  marginBottom: '16px'
                }}>
                  {promotion.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#000000',
                  fontWeight: '600'
                }}>
                  <span style={{
                    background: '#f5f5f5',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #000000'
                  }}>
                    {promotion.minOrder ? `Tối thiểu ${formatPrice(promotion.minOrder)}` : 'Không giới hạn'}
                  </span>
                  <span style={{
                    background: '#000000',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    Còn {promotion.usageLimit ? promotion.usageLimit - promotion.usedCount : '∞'} lượt
                  </span>
                </div>
              </div>
            </div>
            )
          })}
        </div>

        {/* Stats Summary */}
        <div style={{
          marginTop: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          <div style={{
            padding: '24px',
            background: '#ffffff',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #000000'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#000000',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
            <h4 style={{ fontSize: '24px', fontWeight: '700', color: '#000000', margin: '0 0 4px 0' }}>
              {promo?.savedPromotions?.length || 0}
            </h4>
            <p style={{ fontSize: '14px', color: '#666666', margin: '0', fontWeight: '600' }}>
              Khuyến mãi đã lưu
            </p>
          </div>
          
          <div style={{
            padding: '24px',
            background: '#ffffff',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #000000'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#000000',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              #
            </div>
            <h4 style={{ fontSize: '24px', fontWeight: '700', color: '#000000', margin: '0 0 4px 0' }}>
              {availablePromotions.length}
            </h4>
            <p style={{ fontSize: '14px', color: '#666666', margin: '0', fontWeight: '600' }}>
              Khuyến mãi khả dụng
            </p>
          </div>
          
          <div style={{
            padding: '24px',
            background: '#ffffff',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #000000'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#000000',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              %
            </div>
            <h4 style={{ fontSize: '24px', fontWeight: '700', color: '#000000', margin: '0 0 4px 0' }}>
              30%
            </h4>
            <p style={{ fontSize: '14px', color: '#666666', margin: '0', fontWeight: '600' }}>
              Giảm tối đa
            </p>
          </div>
        </div>

        {/* How to use */}
        <div style={{
          marginTop: '48px',
          padding: '32px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '2px solid #000000'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#000000',
            margin: '0 0 24px 0',
            textAlign: 'center'
          }}>
            📋 Cách sử dụng khuyến mãi
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#000000',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                1
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#000000', margin: '0 0 8px 0' }}>
                Lưu khuyến mãi
              </h4>
              <p style={{ fontSize: '14px', color: '#666666', margin: '0', lineHeight: '1.5' }}>
                Click vào nút + để lưu khuyến mãi yêu thích
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#000000',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                2
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#000000', margin: '0 0 8px 0' }}>
                Mua sắm
              </h4>
              <p style={{ fontSize: '14px', color: '#666666', margin: '0', lineHeight: '1.5' }}>
                Thêm sản phẩm vào giỏ hàng và tiến hành thanh toán
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#000000',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                3
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#000000', margin: '0 0 8px 0' }}>
                Áp dụng & tiết kiệm
              </h4>
              <p style={{ fontSize: '14px', color: '#666666', margin: '0', lineHeight: '1.5' }}>
                Chọn khuyến mãi phù hợp tại trang thanh toán
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

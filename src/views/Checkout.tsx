import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { clearCart, addToCart } from '@/store/cartSlice'
import { applyPromotion, removePromotion, type Promotion } from '@/store/promoSlice'
import {
  ArrowLeftIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  TruckIcon,
  MapPinIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  TagIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import './checkout.scss'

interface ShippingInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  district: string
  ward: string
  postalCode: string
}

interface PaymentMethod {
  id: string
  name: string
  icon: any
  description: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Tháº» tÃ­n dá»¥ng/ghi ná»£',
    icon: CreditCardIcon,
    description: 'Visa, MasterCard, JCB'
  },
  {
    id: 'bank',
    name: 'Chuyá»ƒn khoáº£n ngÃ¢n hÃ ng',
    icon: BuildingLibraryIcon,
    description: 'Vietcombank, BIDV, VPBank'
  },
  {
    id: 'momo',
    name: 'VÃ­ MoMo',
    icon: DevicePhoneMobileIcon,
    description: 'Thanh toÃ¡n qua vÃ­ Ä‘iá»‡n tá»­'
  },
  {
    id: 'cod',
    name: 'Thanh toÃ¡n khi nháº­n hÃ ng',
    icon: TruckIcon,
    description: 'Tiá»n máº·t hoáº·c tháº»'
  }
]

export default function Checkout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cart = useAppSelector((state) => state.cart)
  const user = useAppSelector((state) => state.auth.user)
  const promo = useAppSelector((state) => state.promo)

  const [selectedPayment, setSelectedPayment] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    postalCode: ''
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  // Calculate promotion discount
  const calculatePromoDiscount = (): number => {
    if (!promo.appliedPromo) return 0
    
    const promotion = promo.appliedPromo
    
    // Check if order meets minimum requirement
    if (promotion.minOrder && cart.total < promotion.minOrder) return 0
    
    switch (promotion.type) {
      case 'percentage': {
        const percentageDiscount = Math.round(cart.total * (promotion.value / 100))
        return promotion.maxDiscount 
          ? Math.min(percentageDiscount, promotion.maxDiscount)
          : percentageDiscount
      }
      
      case 'fixed':
        return Math.min(promotion.value, cart.total)
      
      case 'shipping':
        return Math.min(promotion.value, 200000) // Max shipping cost
      
      default:
        return 0
    }
  }

  const promoDiscount = calculatePromoDiscount()
  const subtotalAfterPromo = cart.total - promoDiscount
  
  // Calculate shipping (free if promo covers shipping or order >= 10M)
  const shipping = (promo.appliedPromo?.type === 'shipping' && promoDiscount > 0) || 
                   cart.total >= 10000000 ? 0 : 200000
  
  const tax = Math.round(subtotalAfterPromo * 0.1) // 10% VAT on discounted amount
  const finalTotal = subtotalAfterPromo + shipping + tax

  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleApplyPromotion = (promotion: Promotion) => {
    // Check if promotion is valid for current cart
    if (promotion.minOrder && cart.total < promotion.minOrder) {
      alert(`ÄÆ¡n hÃ ng tá»‘i thiá»ƒu ${formatPrice(promotion.minOrder)} Ä‘á»ƒ Ã¡p dá»¥ng khuyáº¿n mÃ£i nÃ y`)
      return
    }

    // Check if already applied
    if (promo.appliedPromo?.id === promotion.id) {
      return
    }

    dispatch(applyPromotion(promotion))
  }

  const handleRemovePromotion = () => {
    dispatch(removePromotion())
  }

  const getEligiblePromotions = (): Promotion[] => {
    console.log('All saved promotions:', promo.savedPromotions)
    
    // For debugging - always show some promotions
    if (!promo.savedPromotions || promo.savedPromotions.length === 0) {
      console.log('No saved promotions found, using demo promotions')
      return []
    }
    
    // For demo purposes, show all active promotions regardless of other conditions
    const eligible = promo.savedPromotions.filter(promotion => {
      console.log('Checking promotion:', promotion.code, promotion)
      
      // Only check if active for now
      return promotion.isActive
    })
    
    console.log('Eligible promotions:', eligible)
    return eligible
  }

  const eligiblePromotions = getEligiblePromotions()

  const validateForm = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city']
    return required.every(field => (shippingInfo[field as keyof ShippingInfo] as string).trim() !== '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      alert('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin báº¯t buá»™c')
      return
    }

    if (cart.items.length === 0) {
      alert('Giá» hÃ ng trá»‘ng')
      return
    }

    setIsProcessing(true)

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate random success/failure for demo
      const isSuccess = Math.random() > 0.3 // 70% success rate
      
      if (isSuccess) {
        // Clear cart after successful payment
        dispatch(clearCart())
        
        // Navigate to success page
        navigate('/order-success', {
          state: {
            orderData: {
              items: cart.items,
              shipping: shippingInfo,
              payment: selectedPayment,
              total: finalTotal
            }
          }
        })
      } else {
        // Navigate to failure page
        const failureCodes = ['INSUFFICIENT_FUNDS', 'CARD_DECLINED', 'EXPIRED_CARD', 'NETWORK_ERROR']
        const randomFailure = failureCodes[Math.floor(Math.random() * failureCodes.length)]
        
        navigate('/order-failure', {
          state: {
            failureCode: randomFailure,
            orderData: {
              items: cart.items,
              shipping: shippingInfo,
              payment: selectedPayment,
              total: finalTotal
            }
          }
        })
      }
    } catch (error) {
      // Navigate to failure page on error
      navigate('/order-failure', {
        state: {
          failureCode: 'NETWORK_ERROR',
          orderData: {
            items: cart.items,
            shipping: shippingInfo,
            payment: selectedPayment,
            total: finalTotal
          }
        }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-checkout">
            <h1>Giá» hÃ ng trá»‘ng</h1>
            <p>KhÃ´ng cÃ³ sáº£n pháº©m nÃ o Ä‘á»ƒ thanh toÃ¡n</p>
            <button 
              className="continue-shopping-btn"
              onClick={() => navigate('/products')}
            >
              Tiáº¿p tá»¥c mua sáº¯m
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <button 
            className="back-btn"
            onClick={() => navigate('/cart')}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Quay láº¡i giá» hÃ ng
          </button>
          <h1 className="page-title">Thanh toÃ¡n</h1>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-content">
            {/* Left Column - Forms */}
            <div className="checkout-forms">
              {/* Shipping Information */}
              <div className="form-section">
                <div className="section-header">
                  <MapPinIcon className="w-6 h-6" />
                  <h2>ThÃ´ng tin giao hÃ ng</h2>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="fullName">Há» vÃ  tÃªn *</label>
                    <div className="input-wrapper">
                      <UserIcon className="input-icon" />
                      <input
                        type="text"
                        id="fullName"
                        value={shippingInfo.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <div className="input-wrapper">
                      <EnvelopeIcon className="input-icon" />
                      <input
                        type="email"
                        id="email"
                        value={shippingInfo.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Sá»‘ Ä‘iá»‡n thoáº¡i *</label>
                    <div className="input-wrapper">
                      <PhoneIcon className="input-icon" />
                      <input
                        type="tel"
                        id="phone"
                        value={shippingInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="address">Äá»‹a chá»‰ *</label>
                    <div className="input-wrapper">
                      <MapPinIcon className="input-icon" />
                      <input
                        type="text"
                        id="address"
                        value={shippingInfo.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">Tá»‰nh/ThÃ nh phá»‘ *</label>
                    <select
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    >
                      <option value="">Chá»n tá»‰nh/thÃ nh phá»‘</option>
                      <option value="hanoi">HÃ  Ná»™i</option>
                      <option value="hcm">TP. Há»“ ChÃ­ Minh</option>
                      <option value="danang">ÄÃ  Náºµng</option>
                      <option value="haiphong">Háº£i PhÃ²ng</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="district">Quáº­n/Huyá»‡n</label>
                    <select
                      id="district"
                      value={shippingInfo.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                    >
                      <option value="">Chá»n quáº­n/huyá»‡n</option>
                      <option value="district1">Quáº­n 1</option>
                      <option value="district3">Quáº­n 3</option>
                      <option value="district7">Quáº­n 7</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="ward">PhÆ°á»ng/XÃ£</label>
                    <input
                      type="text"
                      id="ward"
                      value={shippingInfo.ward}
                      onChange={(e) => handleInputChange('ward', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="postalCode">MÃ£ bÆ°u Ä‘iá»‡n</label>
                    <input
                      type="text"
                      id="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-section">
                <div className="section-header">
                  <CreditCardIcon className="w-6 h-6" />
                  <h2>PhÆ°Æ¡ng thá»©c thanh toÃ¡n</h2>
                </div>

                <div className="payment-methods">
                  {paymentMethods.map(method => {
                    const IconComponent = method.icon
                    return (
                      <label key={method.id} className="payment-method">
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selectedPayment === method.id}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                        />
                        <div className="payment-content">
                          <div className="payment-icon">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="payment-info">
                            <div className="payment-name">{method.name}</div>
                            <div className="payment-description">{method.description}</div>
                          </div>
                          <div className="payment-radio"></div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="order-summary">
              <div className="summary-card">
                <h3>ÄÆ¡n hÃ ng cá»§a báº¡n</h3>

                <div className="order-items">
                  {cart.items.map(item => (
                    <div key={item.id} className="order-item">
                      <div className="item-image">
                        <img src={item.image} alt={item.name} />
                        <span className="item-quantity">{item.quantity}</span>
                      </div>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-brand">{item.brand}</div>
                      </div>
                      <div className="item-price">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-totals">
                  <div className="total-row">
                    <span>Táº¡m tÃ­nh</span>
                    <span>{formatPrice(cart.total)}</span>
                  </div>
                  
                  {promoDiscount > 0 && (
                    <div className="total-row discount">
                      <span>
                        Khuyáº¿n mÃ£i ({promo.appliedPromo?.code})
                        <button 
                          className="remove-promo-btn"
                          onClick={handleRemovePromotion}
                          title="Há»§y khuyáº¿n mÃ£i"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                      <span>-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                  
                  <div className="total-row">
                    <span>PhÃ­ váº­n chuyá»ƒn</span>
                    <span className={shipping === 0 ? 'free' : ''}>
                      {shipping === 0 ? 'Miá»…n phÃ­' : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="total-row">
                    <span>VAT (10%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="total-divider"></div>
                  <div className="total-row final">
                    <span>Tá»•ng cá»™ng</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Debug info */}
                <div style={{padding: '10px', background: '#f0f0f0', margin: '10px 0', fontSize: '12px'}}>
                  <div>Cart total: {formatPrice(cart.total)}</div>
                  <div>Cart items: {cart.items?.length || 0}</div>
                  <div>Promo store: {promo ? 'loaded' : 'not loaded'}</div>
                  <div>Saved promotions: {promo.savedPromotions?.length || 0}</div>
                  <div>Eligible promotions: {eligiblePromotions.length}</div>
                  
                  {/* Test button to add item to cart */}
                  {cart.items?.length === 0 && (
                    <button
                      type="button"
                      onClick={() => dispatch(addToCart({
                        id: 'test-product',
                        name: 'Test Product for Promo',
                        price: 2000000,
                        image: 'https://via.placeholder.com/100',
                        brand: 'Test Brand',
                        category: 'test',
                        inStock: true
                      }))}
                      style={{
                        background: '#22c55e',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        marginTop: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      ThÃªm sáº£n pháº©m test (2M) Ä‘á»ƒ xem khuyáº¿n mÃ£i
                    </button>
                  )}
                </div>

                {/* Saved Promotions */}
                {eligiblePromotions.length > 0 ? (
                  <div className="saved-promotions">
                    <h4>
                      <TagIcon className="w-5 h-5" />
                      Khuyáº¿n mÃ£i Ä‘Ã£ lÆ°u ({eligiblePromotions.length})
                    </h4>
                    <div className="promotions-list">
                      {eligiblePromotions.map(promotion => (
                        <div 
                          key={promotion.id}
                          className={`promotion-card ${promo.appliedPromo?.id === promotion.id ? 'applied' : ''}`}
                        >
                          <div className="promotion-image">
                            <img src={promotion.image} alt={promotion.title} />
                          </div>
                          <div className="promotion-info">
                            <div className="promotion-title">{promotion.title}</div>
                            <div className="promotion-code">MÃ£: {promotion.code}</div>
                            <div className="promotion-description">{promotion.description}</div>
                            {promotion.minOrder && cart.total < promotion.minOrder && (
                              <div className="promotion-requirement">
                                Mua thÃªm {formatPrice(promotion.minOrder - cart.total)} Ä‘á»ƒ Ã¡p dá»¥ng
                              </div>
                            )}
                          </div>
                          <div className="promotion-action">
                            {promo.appliedPromo?.id === promotion.id ? (
                              <button 
                                className="applied-btn"
                                onClick={handleRemovePromotion}
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                                ÄÃ£ Ã¡p dá»¥ng
                              </button>
                            ) : (
                              <button 
                                className="apply-btn"
                                onClick={() => handleApplyPromotion(promotion)}
                                disabled={promotion.minOrder ? cart.total < promotion.minOrder : false}
                              >
                                <PlusIcon className="w-4 h-4" />
                                Ãp dá»¥ng
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-promotions" style={{padding: '20px', textAlign: 'center', background: '#f9f9f9', margin: '10px 0'}}>
                    <p>KhÃ´ng cÃ³ khuyáº¿n mÃ£i kháº£ dá»¥ng</p>
                    <small>Debug: Cart={cart.items?.length || 0} items, Total={formatPrice(cart.total || 0)}</small>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="place-order-btn"
                  disabled={isProcessing || !validateForm()}
                >
                  {isProcessing ? (
                    'Äang xá»­ lÃ½...'
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Äáº·t hÃ ng - {formatPrice(finalTotal)}
                    </>
                  )}
                </button>

                <div className="security-notice">
                  <p>ThÃ´ng tin cá»§a báº¡n Ä‘Æ°á»£c báº£o máº­t an toÃ n</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

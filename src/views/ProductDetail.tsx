import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { addToCart } from '@/store/cartSlice'
import { PartService, Part } from '@/services'
import {
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  ShareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import './product-detail.scss'

// Sử dụng Part interface từ API thay vì Product interface
type Product = Part & {
  // Thêm các thuộc tính bổ sung cho UI
  id: string
  name: string
  price: number
  originalPrice?: number
  category: string
  description?: string
  specifications?: {
    [key: string]: string
  }
  images?: string[]
  features?: string[]
  reviewCount?: number
  inStock?: boolean
}

// Function to convert Part to Product with additional UI properties
const convertPartToProduct = (part: Part): Product => {
  return {
    ...part,
    // Map Part properties to Product properties
    id: part.partId.toString(),
    name: part.partName,
    price: part.unitPrice,
    originalPrice: part.unitPrice * 1.2, // Mock original price (20% higher)
    brand: part.brand,
    category: part.brand, // Using brand as category for now
    rating: part.rating,
    inStock: !part.isOutOfStock,
    // Add UI-specific properties
    description: `${part.partName} - ${part.brand}`,
    reviewCount: Math.floor(Math.random() * 200) + 50, // Mock review count
    images: [`https://picsum.photos/seed/${part.partId}/400/400`],
    features: ['Chất lượng cao', 'Bền bỉ', 'Đáng tin cậy'],
    specifications: {
      'Thương hiệu': part.brand,
      'Danh mục': part.brand,
      'Tình trạng': part.isOutOfStock ? 'Hết hàng' : 'Còn hàng',
      'Bảo hành': '12 tháng'
    }
  }
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [allParts, setAllParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Load product details from API
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Load all parts first to get related products
        const allPartsResponse = await PartService.getPartAvailability()
        if (allPartsResponse.success) {
          setAllParts(allPartsResponse.data)
        }
        
        // Load specific product details
        const productId = parseInt(id)
        const response = await PartService.getPartById(productId)
        
        if (response.success && response.data) {
          const productData = convertPartToProduct(response.data)
          setProduct(productData)
        } else {
          setError('Không tìm thấy sản phẩm')
        }
      } catch (err) {
        console.error('Error loading product:', err)
        setError('Có lỗi xảy ra khi tải sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  // Get related products based on same brand
  const getRelatedProducts = (): Product[] => {
    if (!product || allParts.length === 0) return []
    
    return allParts
      .filter(p => p.partId !== product.partId) // Exclude current product
      .filter(p => p.brand === product.brand) // Same brand
      .slice(0, 8) // Limit to 8 products
      .map(convertPartToProduct)
  }

  const handleAddToCart = () => {
    if (!product) return
    
    dispatch(addToCart({
      id: product.partId.toString(),
      name: product.partName,
      price: product.unitPrice,
      image: product.images?.[0] || `https://picsum.photos/seed/${product.partId}/400/400`,
      brand: product.brand,
      category: product.category,
      inStock: product.inStock || true
    }))
  }

  const handleBuyNow = () => {
    if (!product) return
    
    // Add to cart first
    handleAddToCart()
    // Navigate to checkout
    navigate('/checkout')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="relative">
            {star <= Math.floor(rating) ? (
              <StarSolid className="w-4 h-4 text-yellow-400" />
            ) : star === Math.ceil(rating) && rating % 1 !== 0 ? (
              <>
                <StarIcon className="w-4 h-4 text-gray-300 absolute" />
                <StarSolid
                  className="w-4 h-4 text-yellow-400"
                  style={{ clipPath: `inset(0 ${100 - (rating % 1) * 100}% 0 0)` }}
                />
              </>
            ) : (
              <StarIcon className="w-4 h-4 text-gray-300" />
            )}
          </div>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating}</span>
        <StarSolid className="w-3 h-3 text-yellow-400 ml-1" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải sản phẩm...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-error">
        <div className="error-content">
          <h1>Sản phẩm không tồn tại</h1>
          <p>{error || 'Không thể tải thông tin sản phẩm'}</p>
          <button onClick={() => navigate('/products')} className="back-btn">
            Quay lại danh sách sản phẩm
          </button>
        </div>
      </div>
    )
  }

  const relatedProducts = getRelatedProducts()

  return (
    <div className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate('/products')} className="breadcrumb-link">
            Sản phẩm
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.partName}</span>
        </div>

        {/* Main Product Section */}
        <div className="product-main">
          <div className="product-gallery">
            <div className="main-image">
              <img 
                src={product.images?.[selectedImage] || `https://picsum.photos/seed/${product.partId}/600/600`} 
                alt={product.partName}
              />
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-gallery">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`${product.partName} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-info">
            <div className="product-header">
              <h1 className="product-title">{product.partName}</h1>
              <div className="product-meta">
                <div className="product-rating">
                  {renderStars(product.rating)}
                  <span className="review-count">({product.reviewCount} đánh giá)</span>
                </div>
                <div className="product-brand">
                  <span className="brand-label">Thương hiệu:</span>
                  <span className="brand-name">{product.brand}</span>
                </div>
              </div>
            </div>

            <div className="product-pricing">
              <div className="price-current">
                {formatPrice(product.unitPrice)}
              </div>
              {product.originalPrice && product.originalPrice > product.unitPrice && (
                <div className="price-original">
                  {formatPrice(product.originalPrice)}
                </div>
              )}
            </div>

            <div className="product-availability">
              <div className={`stock-status ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                {product.inStock ? 'Còn hàng' : 'Hết hàng'}
              </div>
              <div className="stock-quantity">
                Tồn kho: {product.totalStock} sản phẩm
              </div>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <label>Số lượng:</label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!product.inStock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  Thêm vào giỏ hàng
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                >
                  Mua ngay
                </button>
                
                <button 
                  className="btn btn-outline"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <HeartIcon className={`w-5 h-5 ${isWishlisted ? 'filled' : ''}`} />
                </button>
                
                <button className="btn btn-outline">
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="product-features">
              <div className="feature-item">
                <TruckIcon className="w-5 h-5" />
                <span>Miễn phí vận chuyển</span>
              </div>
              <div className="feature-item">
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Bảo hành 12 tháng</span>
              </div>
              <div className="feature-item">
                <ArrowPathIcon className="w-5 h-5" />
                <span>Đổi trả trong 30 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="product-tabs">
          <div className="tab-headers">
            <button 
              className={`tab-header ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Mô tả sản phẩm
            </button>
            <button 
              className={`tab-header ${activeTab === 'specifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('specifications')}
            >
              Thông số kỹ thuật
            </button>
            <button 
              className={`tab-header ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Tính năng
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="tab-panel">
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="tab-panel">
                <div className="specifications-table">
                  {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="spec-row">
                      <span className="spec-label">{key}:</span>
                      <span className="spec-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="tab-panel">
                <ul className="features-list">
                  {product.features?.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <div className="related-header">
              <h2>Sản phẩm liên quan</h2>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/products')}
              >
                Xem tất cả sản phẩm
              </button>
            </div>
            
            <div className="related-grid">
              {relatedProducts.map(relatedProduct => (
                <div 
                  key={relatedProduct.partId}
                  className="related-product-card"
                  onClick={() => navigate(`/product/${relatedProduct.partId}`)}
                >
                  <div className="product-image">
                    <img 
                      src={relatedProduct.images?.[0] || `https://picsum.photos/seed/${relatedProduct.partId}/300/300`} 
                      alt={relatedProduct.partName}
                    />
                  </div>
                  <div className="product-details">
                    <h3 className="product-name">{relatedProduct.partName}</h3>
                    <div className="product-price">
                      {formatPrice(relatedProduct.unitPrice)}
                    </div>
                    <div className="product-rating">
                      {renderStars(relatedProduct.rating)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
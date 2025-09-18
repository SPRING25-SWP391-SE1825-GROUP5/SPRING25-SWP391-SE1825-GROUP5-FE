import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { addToCart } from '@/store/cartSlice'
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

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  image: string
  category: string
  brand: string
  inStock: boolean
  isNew?: boolean
  isSale?: boolean
  description: string
  specifications?: {
    [key: string]: string
  }
  images?: string[]
  features?: string[]
}

// Import shared products data
import { products } from './Products'

// Function to add detailed data to products
const getProductWithDetails = (productId: string): Product | null => {
  const baseProduct = products.find(p => p.id === productId)
  if (!baseProduct) return null

  // Add detailed specifications, images, and features based on product type
  const detailedProduct: Product = {
    ...baseProduct,
    specifications: {
      'Thương hiệu': baseProduct.brand,
      'Danh mục': baseProduct.category,
      'Tình trạng': baseProduct.inStock ? 'Còn hàng' : 'Hết hàng',
      'Bảo hành': '12 tháng',
    },
    images: [
      baseProduct.image,
      baseProduct.image.replace('?w=400&h=400', '?w=800&h=800'),
      baseProduct.image.replace('photo-1593941707882', 'photo-1558618047-3c8c76ca7d13'),
    ],
    features: [
      'Chất lượng cao',
      'Thiết kế hiện đại',
      'Dễ sử dụng',
      'Tiết kiệm năng lượng',
      'Thân thiện môi trường'
    ]
  }

  // Add specific details based on category
  if (baseProduct.category.includes('battery')) {
    detailedProduct.specifications = {
      ...detailedProduct.specifications,
      'Loại pin': 'Lithium-ion',
      'Tuổi thọ': '2000+ chu kỳ sạc',
      'Thời gian sạc': '4-8 giờ',
      'Trọng lượng': '25-45kg',
      'Kích thước': '500 x 300 x 200mm',
      'Nhiệt độ hoạt động': '-10°C đến 60°C'
    }
    detailedProduct.features = [
      'Công nghệ BMS thông minh',
      'Sạc nhanh an toàn',
      'Chống quá nhiệt',
      'Thiết kế compact',
      'Tương thích đa dạng xe điện'
    ]
  } else if (baseProduct.category.includes('charger')) {
    detailedProduct.specifications = {
      ...detailedProduct.specifications,
      'Công suất': '7-350kW',
      'Điện áp đầu vào': '220-480V',
      'Chuẩn kết nối': 'CCS2, CHAdeMO, Type 2',
      'Hiệu suất': '> 95%',
      'Độ ẩm hoạt động': '< 95%',
      'Cấp bảo vệ': 'IP54'
    }
    detailedProduct.features = [
      'Sạc nhanh intelligent',
      'Nhiều chuẩn kết nối',
      'Giao diện thân thiện',
      'Thanh toán đa dạng',
      'Giám sát từ xa'
    ]
  } else if (baseProduct.category.includes('motor')) {
    detailedProduct.specifications = {
      ...detailedProduct.specifications,
      'Công suất': '50-200kW',
      'Mô-men xoắn': '200-400Nm',
      'Tốc độ tối đa': '12000 RPM',
      'Hiệu suất': '> 92%',
      'Làm mát': 'Nước/Dầu',
      'Cấp bảo vệ': 'IP67'
    }
    detailedProduct.features = [
      'Hiệu suất cao',
      'Vận hành êm ái',
      'Bền bỉ theo thời gian',
      'Bảo trì tối thiểu',
      'Tích hợp dễ dàng'
    ]
  }

  return detailedProduct
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [isWishlisted, setIsWishlisted] = useState(false)

  useEffect(() => {
    if (id) {
      const foundProduct = getProductWithDetails(id)
      setProduct(foundProduct)
    }
  }, [id])

  // Get related products based on same category or brand
  const getRelatedProducts = (): Product[] => {
    if (!product) return []
    
    return products
      .filter(p => p.id !== product.id) // Exclude current product
      .filter(p => 
        p.category.split('/')[0] === product.category.split('/')[0] || // Same main category
        p.brand === product.brand // Same brand
      )
      .slice(0, 8) // Limit to 8 products
  }

  const relatedProducts = getRelatedProducts()

  const handleAddToCart = () => {
    if (product && product.inStock) {
      dispatch(addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        brand: product.brand,
        category: product.category,
        inStock: product.inStock
      }))
      // Success - no popup needed
    }
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
              <StarSolid className="w-5 h-5 text-yellow-400" />
            ) : star === Math.ceil(rating) && rating % 1 !== 0 ? (
              <>
                <StarIcon className="w-5 h-5 text-gray-300 absolute" />
                <StarSolid 
                  className="w-5 h-5 text-yellow-400" 
                  style={{ clipPath: `inset(0 ${100 - (rating % 1) * 100}% 0 0)` }}
                />
              </>
            ) : (
              <StarIcon className="w-5 h-5 text-gray-300" />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="not-found">
            <h1>Sản phẩm không tồn tại</h1>
            <button onClick={() => navigate('/products')} className="back-btn">
              Quay lại danh sách sản phẩm
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate('/products')} className="breadcrumb-link">
            Sản phẩm
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </div>

        <div className="product-detail-content">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img 
                src={product.images?.[selectedImage] || product.image} 
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/800x800/f5f5f5/666?text=Sản phẩm'
                }}
              />
              {product.isNew && <span className="product-badge new">Coming Soon</span>}
              {product.isSale && <span className="product-badge sale">Bestseller</span>}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-images">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <div className="product-brand">{product.brand}</div>
              <h1 className="product-title">{product.name}</h1>
              
              <div className="product-rating">
                {renderStars(product.rating)}
                <span className="review-count">({product.reviewCount} đánh giá)</span>
              </div>

              <div className="product-price">
                <span className="current-price">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="original-price">{formatPrice(product.originalPrice)}</span>
                )}
              </div>
            </div>

            <div className="product-description">
              <p>{product.description}</p>
            </div>

            {/* Features */}
            {product.features && (
              <div className="product-features">
                <h3>Tính năng nổi bật</h3>
                <ul>
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity & Add to Cart */}
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
                  <span>{quantity}</span>
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
                  className={`add-to-cart-btn ${!product.inStock ? 'disabled' : ''}`}
                  disabled={!product.inStock}
                  onClick={handleAddToCart}
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  {product.inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                </button>
                
                <button 
                  className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <HeartIcon className="w-5 h-5" />
                </button>
                
                <button className="share-btn">
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Product Benefits */}
            <div className="product-benefits">
              <div className="benefit-item">
                <TruckIcon className="w-6 h-6" />
                <div>
                  <strong>Miễn phí vận chuyển</strong>
                  <span>Đơn hàng trên 10 triệu</span>
                </div>
              </div>
              <div className="benefit-item">
                <ShieldCheckIcon className="w-6 h-6" />
                <div>
                  <strong>Bảo hành chính hãng</strong>
                  <span>5 năm bảo hành</span>
                </div>
              </div>
              <div className="benefit-item">
                <ArrowPathIcon className="w-6 h-6" />
                <div>
                  <strong>Đổi trả 30 ngày</strong>
                  <span>Hoàn tiền 100%</span>
                </div>
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
              Mô tả chi tiết
            </button>
            <button 
              className={`tab-header ${activeTab === 'specifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('specifications')}
            >
              Thông số kỹ thuật
            </button>
            <button 
              className={`tab-header ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Đánh giá ({product.reviewCount})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="description-content">
                <p>{product.description}</p>
                <p>
                  Sản phẩm được thiết kế với công nghệ tiên tiến nhất, đảm bảo chất lượng 
                  và độ bền cao. Phù hợp cho mọi loại xe điện hiện đại.
                </p>
              </div>
            )}

            {activeTab === 'specifications' && product.specifications && (
              <div className="specifications-content">
                <table>
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <tr key={key}>
                        <td className="spec-label">{key}</td>
                        <td className="spec-value">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <div className="reviews-summary">
                  <div className="rating-overview">
                    <div className="overall-rating">
                      <span className="rating-number">{product.rating}</span>
                      {renderStars(product.rating)}
                      <span className="total-reviews">Dựa trên {product.reviewCount} đánh giá</span>
                    </div>
                  </div>
                </div>
                
                <div className="review-list">
                  <div className="review-item">
                    <div className="reviewer-info">
                      <strong>Nguyễn Văn A</strong>
                      <span className="review-date">15/03/2024</span>
                    </div>
                    {renderStars(5)}
                    <p>Sản phẩm tuyệt vời, chất lượng cao, giao hàng nhanh!</p>
                  </div>
                  
                  <div className="review-item">
                    <div className="reviewer-info">
                      <strong>Trần Thị B</strong>
                      <span className="review-date">10/03/2024</span>
                    </div>
                    {renderStars(4)}
                    <p>Pin rất tốt, sạc nhanh và bền. Recommend!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <div className="related-header">
              <h2>Sản phẩm liên quan</h2>
              <p>Khám phá thêm các sản phẩm tương tự</p>
            </div>
            
            <div className="related-grid">
              {relatedProducts.map(relatedProduct => (
                <div 
                  key={relatedProduct.id}
                  className="related-product-card"
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                >
                  <div className="related-product-image">
                    <img 
                      src={relatedProduct.image} 
                      alt={relatedProduct.name}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x300/f5f5f5/666?text=Sản phẩm'
                      }}
                    />
                    {relatedProduct.isNew && <span className="product-badge new">Coming Soon</span>}
                    {relatedProduct.isSale && <span className="product-badge sale">Bestseller</span>}
                  </div>

                  <div className="related-product-info">
                    <div className="product-brand">{relatedProduct.brand}</div>
                    <h3 className="product-name">{relatedProduct.name}</h3>
                    <div className="product-rating">
                      {renderStars(relatedProduct.rating)}
                    </div>
                    <div className="product-price">
                      <span className="current-price">{formatPrice(relatedProduct.price)}</span>
                      {relatedProduct.originalPrice && (
                        <span className="original-price">{formatPrice(relatedProduct.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="view-all-section">
              <button 
                className="view-all-btn"
                onClick={() => navigate('/products')}
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

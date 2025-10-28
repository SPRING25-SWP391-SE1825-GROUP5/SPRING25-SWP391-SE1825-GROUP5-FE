import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { 
  FunnelIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ShoppingCartIcon,
  HeartIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { PartService, Part, PartFilters } from '@/services'
import toast from 'react-hot-toast'
import './products.scss'

export default function Products() {
  const { category, subcategory } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  
  // State cho API data
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  
  // State cho filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('Tất cả thương hiệu')
  const [priceRange, setPriceRange] = useState([0, 30000000])
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(true)
  const [visibleProducts, setVisibleProducts] = useState(12)

  // Load data từ API
  useEffect(() => {
    loadPartsData()
  }, [])

  // Load parts khi filters thay đổi
  useEffect(() => {
    loadPartsData()
  }, [searchTerm, selectedCategory, selectedBrand, priceRange])

  // Load categories và brands khi parts data thay đổi
  useEffect(() => {
    loadCategoriesAndBrands()
  }, [parts])

  const loadPartsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: PartFilters = {
        searchTerm: searchTerm || undefined,
        brand: selectedBrand !== 'Tất cả thương hiệu' ? selectedBrand : undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 30000000 ? priceRange[1] : undefined,
        inStock: true, // Chỉ hiển thị phụ tùng có sẵn
        pageSize: 100 // Load nhiều để có thể filter local
      }

      const response = await PartService.getPartAvailability(filters)
      
      if (response.success) {
        console.log('Parts data from API:', response.data)
        console.log('First part unitPrice:', response.data[0]?.unitPrice)
        console.log('First part unitPrice type:', typeof response.data[0]?.unitPrice)
        setParts(response.data)
      } else {
        setError(response.message)
        toast.error(response.message)
      }
    } catch (error) {
      const errorMessage = 'Không thể tải danh sách phụ tùng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadCategoriesAndBrands = () => {
    // Extract categories and brands from parts data
    if (parts.length > 0) {
      const uniqueCategories = [...new Set(parts.map(part => part.brand))].sort()
      const uniqueBrands = [...new Set(parts.map(part => part.brand))].sort()
      
      setCategories(uniqueCategories)
      setBrands(uniqueBrands)
    }
  }

  // Xử lý route params để set category filter
  useEffect(() => {
    if (category && subcategory) {
      setSelectedCategory(`${category}/${subcategory}`)
    } else if (category) {
      setSelectedCategory(category)
    } else {
      setSelectedCategory('all')
    }
  }, [category, subcategory])

  // Lấy tên category hiển thị
  const getCurrentCategoryName = (): string => {
    if (category && subcategory) {
      const fullPath = `${category}/${subcategory}`
      return categoryMapping[fullPath] || `${categoryMapping[category] || category} / ${subcategory}`
    } else if (category) {
      return categoryMapping[category] || category
    }
    return 'Tất cả phụ tùng'
  }

  // Lấy breadcrumb
  const getBreadcrumb = (): string[] => {
    const breadcrumb = ['Phụ tùng']
    if (category) {
      breadcrumb.push(categoryMapping[category] || category)
      if (subcategory) {
        const fullPath = `${category}/${subcategory}`
        breadcrumb.push(categoryMapping[fullPath] || subcategory)
      }
    }
    return breadcrumb
  }

  // Category mapping để hiển thị breadcrumb và title
  const categoryMapping: { [key: string]: string } = {
    'parts': 'Phụ tùng EV',
    'parts/battery': 'Pin xe điện',
    'parts/charger': 'Bộ sạc',
    'parts/motor': 'Động cơ điện',
    'parts/controller': 'Bộ điều khiển',
    'accessories': 'Phụ kiện',
    'accessories/cables': 'Cáp sạc',
    'accessories/tools': 'Dụng cụ',
    'accessories/safety': 'Thiết bị an toàn',
    'fluids': 'Dầu nhớt & Hóa chất',
    'fluids/brake': 'Dầu phanh',
    'fluids/coolant': 'Nước làm mát',
    'equipment': 'Trang thiết bị',
    'equipment/diagnostic': 'Thiết bị chẩn đoán',
    'equipment/charging': 'Trạm sạc',
    'equipment/maintenance': 'Thiết bị bảo dưỡng'
  }

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price-low', label: 'Giá thấp đến cao' },
    { value: 'price-high', label: 'Giá cao đến thấp' },
    { value: 'name', label: 'Tên A-Z' },
    { value: 'brand', label: 'Thương hiệu' }
  ]

  const formatPrice = (price: number | undefined | null) => {
    console.log('formatPrice called with:', price, 'type:', typeof price)
    if (!price || isNaN(price) || price <= 0) {
      console.log('Price is invalid, returning "Liên hệ"')
      return 'Liên hệ'
    }
    const formatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
    console.log('Formatted price:', formatted)
    return formatted
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
        <StarSolid 
          className="ml-1" 
          style={{ 
            width: '14px', 
            height: '14px', 
            color: '#FFC107' 
          }} 
        />
      </div>
    )
  }

  // Sort và filter parts
  const sortedParts = [...parts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.unitPrice - b.unitPrice
      case 'price-high':
        return b.unitPrice - a.unitPrice
      case 'name':
        return a.partName.localeCompare(b.partName)
      case 'brand':
        return a.brand.localeCompare(b.brand)
      case 'newest':
      default:
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    }
  })

  const currentProducts = sortedParts.slice(0, visibleProducts)

  return (
    <div className="products-page">
      {/* Page Header - Nike Style */}
      <div className="page-header">
        <div className="container">
          <div className="header-top">
            <h1 className="page-title">
              {getCurrentCategoryName()} ({parts.length})
            </h1>
            
            <div className="header-actions">
              <button 
                className={`filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                Hide Filters
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
              </button>
              
              <div className="sort-wrapper">
                <span className="sort-label">Sort By</span>
                <select 
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <div className="content-wrapper">
            {/* Sidebar Filters - Nike Style */}
            {showFilters && (
              <div className="filters-sidebar">
                <div className="filter-group">
                  <h3 className="filter-title">Phụ tùng EV</h3>
                  <ul className="filter-list">
                    <li><button className="filter-link">Pin xe điện</button></li>
                    <li><button className="filter-link">Bộ sạc</button></li>
                    <li><button className="filter-link">Động cơ điện</button></li>
                    <li><button className="filter-link">Bộ điều khiển</button></li>
                    <li><button className="filter-link">Cáp sạc</button></li>
                  </ul>
                </div>

                <div className="filter-group">
                  <h3 className="filter-title">Phụ kiện</h3>
                  <ul className="filter-list">
                    <li><button className="filter-link">Dụng cụ</button></li>
                    <li><button className="filter-link">Thiết bị an toàn</button></li>
                    <li><button className="filter-link">Nội thất</button></li>
                  </ul>
                </div>

                <div className="filter-group">
                  <h3 className="filter-title">Trang thiết bị</h3>
                  <ul className="filter-list">
                    <li><button className="filter-link">Thiết bị chẩn đoán</button></li>
                    <li><button className="filter-link">Trạm sạc</button></li>
                    <li><button className="filter-link">Thiết bị bảo dưỡng</button></li>
                  </ul>
                </div>

                <div className="filter-divider"></div>

                <div className="filter-group">
                  <h3 className="filter-title">Thương hiệu</h3>
                  <div className="filter-options">
                    {brands.length > 0 ? brands.map(brand => (
                      <label key={brand} className="filter-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedBrand === brand}
                          onChange={(e) => setSelectedBrand(e.target.checked ? brand : 'Tất cả thương hiệu')}
                        />
                        <span className="checkmark"></span>
                        {brand}
                      </label>
                    )) : (
                      <p className="loading-text">Đang tải thương hiệu...</p>
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <h3 className="filter-title">Giá</h3>
                  <div className="filter-options">
                    <label className="filter-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                      Dưới 5 triệu
                    </label>
                    <label className="filter-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                      5 - 10 triệu
                    </label>
                    <label className="filter-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                      10 - 20 triệu
                    </label>
                    <label className="filter-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                      Trên 20 triệu
                    </label>
                  </div>
                </div>

                <div className="filter-group">
                  <h3 className="filter-title">Tình trạng</h3>
                  <div className="filter-options">
                    <label className="filter-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                      Có sẵn
                    </label>
                    <label className="filter-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                      Sản phẩm mới
                    </label>
                    <label className="filter-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                      Giảm giá
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Products Content */}
            <div className="products-content">
              {/* Search Bar */}
              <div className="search-section">
                <div className="search-input">
                  <MagnifyingGlassIcon className="search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="loading-section">
                  <div className="loading-spinner"></div>
                  <p>Đang tải danh sách phụ tùng...</p>
                </div>
              ) : error ? (
                <div className="error-section">
                  <p className="error-message">{error}</p>
                  <button 
                    className="retry-btn"
                    onClick={loadPartsData}
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <div className="products-grid">
                  {currentProducts.map(part => (
                    <div 
                      key={part.partId} 
                      className="product-card"
                      onClick={() => navigate(`/product/${part.partId}`)}
                    >
                      <div className="placeholder-image">
                        <div className="placeholder-icon">🔧</div>
                        <div className="placeholder-text">{part.partName}</div>
                      </div>

                      <div className="product-info">
                        <h3 className="product-name">{part.partName}</h3>
                        <div className="product-price">
                          <span className="current-price">
                            {part.unitPrice && part.unitPrice > 0 ? formatPrice(part.unitPrice) : 'Liên hệ'}
                          </span>
                        </div>
                        <div className="product-rating">
                          {renderStars(part.rating)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {!loading && !error && visibleProducts < sortedParts.length && (
                <div className="load-more-section">
                  <button 
                    className="load-more-btn"
                    onClick={() => setVisibleProducts(prev => prev + 12)}
                  >
                    Load More ({sortedParts.length - visibleProducts} remaining)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
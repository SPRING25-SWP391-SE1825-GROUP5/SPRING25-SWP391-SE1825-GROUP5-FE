import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { 
  FunnelIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ShoppingCartIcon,
  HeartIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { PartService, Part, PartFilters, OrderService, CustomerService } from '@/services'
import toast from 'react-hot-toast'
import './products.scss'
import { addToCart } from '@/store/cartSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export default function Products() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('Tất cả thương hiệu')
  const [priceRange, setPriceRange] = useState([0, 30000000])
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 9
  const [buyingId, setBuyingId] = useState<number | null>(null)

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

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = (part: Part, e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(addToCart({
      id: String(part.partId),
      name: part.partName,
      price: part.unitPrice,
      image: '', // Có thể lấy ảnh từ API nếu có, nếu không để rỗng.
      brand: part.brand,
      category: '', // Nếu part có category, gán vào đây.
      inStock: !part.isOutOfStock
    }))
    toast.success(`Đã thêm ${part.partName} vào giỏ hàng`)
  }

  // Xử lý mua ngay
  const handleBuyNow = async (part: Part, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      if (!user?.id) {
        toast.error('Vui lòng đăng nhập để mua ngay')
        navigate('/auth/login')
        return
      }

      setBuyingId(part.partId)

      // Lấy đúng customerId từ BE (map từ User)
      const me = await CustomerService.getCurrentCustomer()
      const customerId = me?.data?.customerId
      if (!customerId) {
        toast.error('Không tìm thấy hồ sơ khách hàng')
        return
      }

      const resp = await OrderService.createQuickOrder(Number(customerId), {
        items: [
          { partId: part.partId, quantity: 1 },
        ],
      })

      const orderId = (resp?.data as any)?.orderId ?? (resp?.data as any)?.OrderId ?? (resp?.data as any)?.id
      if (resp?.success && orderId) {
        toast.success('Tạo đơn hàng tạm thành công')
        sessionStorage.setItem('currentOrderId', String(orderId))
        navigate(`/confirm-order`, { state: { orderId } })
      } else {
        toast.error(resp?.message || 'Không thể tạo đơn hàng')
      }
    } catch (err: any) {
      toast.error(err?.userMessage || err?.message || 'Có lỗi khi tạo đơn hàng')
    }
    finally {
      setBuyingId(null)
    }
  }

  // Filter và sort parts
  const filteredParts = parts.filter(part => {
    // Tìm kiếm theo tên sản phẩm
    const matchesSearch = debouncedSearchTerm === '' || 
      part.partName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.brand.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    
    // Lọc theo thương hiệu
    const matchesBrand = selectedBrand === 'Tất cả thương hiệu' || part.brand === selectedBrand
    
    // Lọc theo giá
    const matchesPrice = part.unitPrice >= priceRange[0] && part.unitPrice <= priceRange[1]
    
    return matchesSearch && matchesBrand && matchesPrice
  })

  const sortedParts = [...filteredParts].sort((a, b) => {
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

  // Tính toán phân trang
  const totalPages = Math.ceil(sortedParts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = sortedParts.slice(startIndex, endIndex)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset về trang 1 khi filters thay đổi
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedCategory, selectedBrand, priceRange, sortBy])

  return (
    <div className="products-page">

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
          <div className="content-wrapper">

            {/* Products Content */}
            <div className="products-content">
              {/* Page Title */}
              <div className="page-title-section">
                <h2 className="page-title">Cửa hàng phụ tùng</h2>
              </div>

              {/* Search and Filters */}
              <div className="filters-section">
                <div className="filters-container">
                  <div className="search-input">
                    <MagnifyingGlassIcon className="search-icon" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="filters-row">
                    <div className="filter-group">
                      <label className="filter-label">Thương hiệu</label>
                      <select 
                        className="filter-select"
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                      >
                        <option value="Tất cả thương hiệu">Tất cả thương hiệu</option>
                        {brands.map(brand => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label className="filter-label">Giá</label>
                      <select 
                        className="filter-select"
                        value={priceRange[1] === 5000000 ? 'under-5m' : 
                               priceRange[1] === 10000000 ? '5m-10m' : 
                               priceRange[1] === 20000000 ? '10m-20m' : 'over-20m'}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === 'under-5m') setPriceRange([0, 5000000])
                          else if (value === '5m-10m') setPriceRange([5000000, 10000000])
                          else if (value === '10m-20m') setPriceRange([10000000, 20000000])
                          else setPriceRange([20000000, 30000000])
                        }}
                      >
                        <option value="under-5m">Dưới 5 triệu</option>
                        <option value="5m-10m">5 - 10 triệu</option>
                        <option value="10m-20m">10 - 20 triệu</option>
                        <option value="over-20m">Trên 20 triệu</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label className="filter-label">Sắp xếp</label>
                      <select 
                        className="filter-select"
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
              ) : filteredParts.length === 0 ? (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>Không tìm thấy sản phẩm</h3>
                  <p>
                    {debouncedSearchTerm 
                      ? `Không có sản phẩm nào phù hợp với "${debouncedSearchTerm}"`
                      : 'Không có sản phẩm nào phù hợp với bộ lọc hiện tại'
                    }
                  </p>
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedBrand('Tất cả thương hiệu')
                      setPriceRange([0, 30000000])
                    }}
                  >
                    Xóa bộ lọc
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
                        
                        <div className="product-actions">
                          <button 
                            className="action-btn add-to-cart-btn"
                            onClick={(e) => handleAddToCart(part, e)}
                            title="Thêm vào giỏ hàng"
                          >
                            <PlusIcon className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
                            <span>Thêm vào giỏ</span>
                          </button>
                          
                          <button 
                            className="action-btn buy-now-btn"
                            onClick={(e) => handleBuyNow(part, e)}
                            disabled={buyingId === part.partId}
                            title="Mua ngay"
                          >
                            <BoltIcon className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
                            <span>{buyingId === part.partId ? 'Đang tạo...' : 'Mua ngay'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && !error && totalPages > 1 && (
                <div className="pagination-section">
                  <div className="pagination-info">
                    Hiển thị {startIndex + 1}-{Math.min(endIndex, sortedParts.length)} trong {sortedParts.length} sản phẩm
                  </div>
                  
                  <div className="pagination">
                    <button 
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Trước
                    </button>
                    
                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
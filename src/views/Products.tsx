import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  StarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { PartService, Part, PartFilters, CenterService, InventoryService } from '@/services'
import type { Center } from '@/services/centerService'
import type { InventoryPart } from '@/services/inventoryService'
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('Tất cả thương hiệu')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [showMoreBrands, setShowMoreBrands] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 9

  // State cho inventory
  const [centers, setCenters] = useState<Center[]>([])
  const [inventoryByCenter, setInventoryByCenter] = useState<Map<number, Map<number, InventoryPart | null>>>(new Map())
  const [partMaxStock, setPartMaxStock] = useState<Map<number, number>>(new Map()) // partId -> max stock
  const [loadingInventory, setLoadingInventory] = useState(false)

  // Load data từ API
  useEffect(() => {
    loadPartsData()
  }, [])

  // Load parts khi filters thay đổi
  useEffect(() => {
    loadPartsData()
  }, [searchTerm, selectedCategory, selectedBrand])

  // Load categories và brands khi parts data thay đổi
  useEffect(() => {
    loadCategoriesAndBrands()
  }, [parts])

  // Load centers
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const centersResponse = await CenterService.getActiveCenters({ pageSize: 100 })
        const centersList = centersResponse.centers || []
        setCenters(centersList)
      } catch (error) {
        console.error('[Products] Error loading centers:', error)
        setCenters([])
      }
    }

    loadCenters()
  }, [])

  // Load inventory for all centers and calculate max stock for each part
  useEffect(() => {
    const loadAllInventories = async () => {
      if (parts.length === 0 || centers.length === 0) {
        return
      }

      try {
        setLoadingInventory(true)
        console.log(`[Products] Loading inventory for ${centers.length} centers and ${parts.length} parts...`)

        // Load inventory for all centers in parallel
        const inventoryMap = new Map<number, Map<number, InventoryPart | null>>()

        await Promise.allSettled(
          centers.map(async (center) => {
            try {
              const inventoryId = center.centerId
              const partsResponse = await InventoryService.getInventoryParts(inventoryId)

              if (partsResponse.success && partsResponse.data) {
                let partsArray: InventoryPart[] = []

                if (Array.isArray(partsResponse.data)) {
                  partsArray = partsResponse.data
                } else if (partsResponse.data && typeof partsResponse.data === 'object') {
                  const dataObj = partsResponse.data as any
                  for (const key in dataObj) {
                    if (Array.isArray(dataObj[key])) {
                      partsArray = dataObj[key]
                      break
                    }
                  }
                }

                // Tạo map cho center này: partId -> InventoryPart
                const centerPartsMap = new Map<number, InventoryPart | null>()

                // Tìm tất cả parts trong danh sách
                parts.forEach(part => {
                  const partId = part.partId
                  const partInInventory = partsArray.find(
                    (p: InventoryPart) => p.partId === partId
                  ) || null
                  centerPartsMap.set(partId, partInInventory)
                })

                inventoryMap.set(center.centerId, centerPartsMap)
              } else {
                inventoryMap.set(center.centerId, new Map())
              }
            } catch (error: any) {
              console.error(`[Products] Error loading inventory for center ${center.centerId}:`, error)
              inventoryMap.set(center.centerId, new Map())
            }
          })
        )

        setInventoryByCenter(inventoryMap)

        // Tính toán stock cao nhất cho mỗi part
        const maxStockMap = new Map<number, number>()

        parts.forEach(part => {
          let maxStock = 0

          inventoryMap.forEach((centerPartsMap) => {
            const inventoryPart = centerPartsMap.get(part.partId)
            const stock = inventoryPart?.currentStock ?? 0
            if (stock > maxStock) {
              maxStock = stock
            }
          })

          maxStockMap.set(part.partId, maxStock)
        })

        setPartMaxStock(maxStockMap)
        console.log(`[Products] Calculated max stock for ${maxStockMap.size} parts`)
      } catch (error: any) {
        console.error('[Products] Error loading all inventories:', error)
      } finally {
        setLoadingInventory(false)
      }
    }

    if (parts.length > 0 && centers.length > 0) {
      loadAllInventories()
    }
  }, [parts.length, centers.length])

  const loadPartsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: PartFilters = {
        searchTerm: searchTerm || undefined,
        // khi chọn nhiều brand sẽ lọc client-side, không gửi brand lên API
        brand: selectedBrands.length === 1 ? selectedBrands[0] : (selectedBrand !== 'Tất cả thương hiệu' && selectedBrands.length === 0 ? selectedBrand : undefined),
        inStock: true, // Chỉ hiển thị phụ tùng có sẵn
        pageSize: 100 // Load nhiều để có thể filter local
      }

      const response = await PartService.getPartAvailability(filters)

      if (response.success) {
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
    if (!price || isNaN(price) || price <= 0) {
      return 'Liên hệ'
    }
    const formatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
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

  // Filter và sort parts
  const filteredParts = parts.filter(part => {
    // Tìm kiếm theo tên sản phẩm
    const matchesSearch = debouncedSearchTerm === '' ||
      part.partName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.brand.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

    // Lọc theo thương hiệu
    const matchesBrand =
      (selectedBrands.length === 0 && (selectedBrand === 'Tất cả thương hiệu' || part.brand === selectedBrand)) ||
      (selectedBrands.length > 0 && selectedBrands.includes(part.brand))

    return matchesSearch && matchesBrand
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
  }, [debouncedSearchTerm, selectedCategory, selectedBrand, sortBy])

  return (
    <div className="products-page">
      <div className="container products-scroll">
        <div className="products-container">
        {/* Sidebar */}
        <aside className="products-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Thương hiệu</div>
            <div className="brand-list">
              <label className={`brand-item ${selectedBrands.length === 0 && selectedBrand === 'Tất cả thương hiệu' ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedBrands.length === 0 && selectedBrand === 'Tất cả thương hiệu'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBrands([])
                      setSelectedBrand('Tất cả thương hiệu')
                    }
                  }}
                />
                <span>Tất cả</span>
              </label>
              {(showMoreBrands ? brands : brands.slice(0, 8)).map((b) => (
                <label key={b} className={`brand-item ${selectedBrands.includes(b) ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBrand('Tất cả thương hiệu')
                        setSelectedBrands([...selectedBrands, b])
                      } else {
                        setSelectedBrands(selectedBrands.filter((x) => x !== b))
                      }
                    }}
                  />
                  <span>{b}</span>
                </label>
              ))}
              {brands.length > 8 && (
                <button className="btn-show-more" onClick={() => setShowMoreBrands(!showMoreBrands)}>
                  {showMoreBrands ? 'Ẩn bớt' : 'Hiển thị thêm'}
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="products-main">
          <div className="content-wrapper">
            <div className="products-content">

              {/* Search and Sort Bar */}
              <div className="toolbar">
                <div className="search-input">
                    <MagnifyingGlassIcon className="search-icon" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                <div className="sort-group">
                  <AdjustmentsHorizontalIcon className="sort-icon" />
                  <label className="sort-label">Sắp xếp</label>
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
                      {part.imageUrl ? (
                        <img
                          src={part.imageUrl}
                          alt={part.partName}
                          className="product-image"
                          style={{ width: '100%', height: 180, objectFit: 'cover', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="placeholder-image">
                          <div className="placeholder-icon">🔧</div>
                          <div className="placeholder-text">{part.partName}</div>
                        </div>
                      )}

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
    </div>
  )
}

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
import './products.scss'

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
}

export const products: Product[] = [
  // Pin xe điện
  {
    id: '1',
    name: 'Pin Lithium Ion 72V 50Ah Samsung',
    price: 22500000,
    originalPrice: 25000000,
    rating: 4.9,
    reviewCount: 156,
    image: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=400&h=400&fit=crop',
    category: 'parts/battery',
    brand: 'Samsung SDI',
    inStock: true,
    isSale: true,
    description: 'Pin lithium cao cấp cho xe điện, tuổi thọ 8-10 năm'
  },
  {
    id: '2',
    name: 'Pin LiFePO4 48V 100Ah BYD Blade',
    price: 18500000,
    rating: 4.8,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop',
    category: 'parts/battery',
    brand: 'BYD',
    inStock: true,
    isNew: true,
    description: 'Công nghệ pin Blade an toàn, sạc nhanh 0.5C'
  },
  {
    id: '3',
    name: 'Pin Tesla Model S 85kWh (Refurbished)',
    price: 450000000,
    rating: 4.6,
    reviewCount: 23,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=400&fit=crop',
    category: 'parts/battery',
    brand: 'Tesla',
    inStock: true,
    description: 'Pin Tesla tái chế, kiểm tra chất lượng 95%'
  },

  // Bộ sạc
  {
    id: '4',
    name: 'DC Fast Charger ABB Terra 360kW',
    price: 850000000,
    rating: 4.9,
    reviewCount: 67,
    image: 'https://images.unsplash.com/photo-1593941707445-24ad0b6463f2?w=400&h=400&fit=crop',
    category: 'parts/charger',
    brand: 'ABB',
    inStock: true,
    isNew: true,
    description: 'Trạm sạc siêu nhanh công suất 360kW, sạc 80% trong 15 phút'
  },
  {
    id: '5',
    name: 'Wallbox Home Charger 22kW',
    price: 35000000,
    originalPrice: 42000000,
    rating: 4.7,
    reviewCount: 234,
    image: 'https://images.unsplash.com/photo-1593941707902-4b4d4e5b7b64?w=400&h=400&fit=crop',
    category: 'parts/charger',
    brand: 'Wallbox',
    inStock: true,
    isSale: true,
    description: 'Bộ sạc gia đình thông minh, WiFi, ứng dụng di động'
  },
  {
    id: '6',
    name: 'Tesla Mobile Connector Gen 2',
    price: 12500000,
    rating: 4.5,
    reviewCount: 145,
    image: 'https://images.unsplash.com/photo-1593941707471-ef1eeaff3994?w=400&h=400&fit=crop',
    category: 'parts/charger',
    brand: 'Tesla',
    inStock: true,
    description: 'Bộ sạc di động Tesla, nhiều đầu cắm phổ biến'
  },

  // Động cơ điện
  {
    id: '7',
    name: 'Motor Bosch eAxle 150kW Performance',
    price: 125000000,
    rating: 4.8,
    reviewCount: 78,
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop',
    category: 'parts/motor',
    brand: 'Bosch',
    inStock: true,
    description: 'Động cơ điện tích hợp hộp số, hiệu suất 95%'
  },
  {
    id: '8',
    name: 'Siemens Motor 1FU8 180kW',
    price: 185000000,
    rating: 4.9,
    reviewCount: 45,
    image: 'https://images.unsplash.com/photo-1581833971403-61c727efcc76?w=400&h=400&fit=crop',
    category: 'parts/motor',
    brand: 'Siemens',
    inStock: false,
    description: 'Động cơ điện công nghiệp, làm mát bằng nước'
  },

  // Bộ điều khiển
  {
    id: '9',
    name: 'Tesla Model 3 MCU (Media Control Unit)',
    price: 85000000,
    rating: 4.6,
    reviewCount: 92,
    image: 'https://images.unsplash.com/photo-1558618047-bd8752c57446?w=400&h=400&fit=crop',
    category: 'parts/controller',
    brand: 'Tesla',
    inStock: true,
    description: 'Bộ điều khiển trung tâm Tesla Model 3 mới 100%'
  },
  {
    id: '10',
    name: 'VCU Continental 48V System',
    price: 45000000,
    rating: 4.7,
    reviewCount: 67,
    image: 'https://images.unsplash.com/photo-1558618047-4439892c83f4?w=400&h=400&fit=crop',
    category: 'parts/controller',
    brand: 'Continental',
    inStock: true,
    isNew: true,
    description: 'Bộ điều khiển xe VCU hệ thống 48V hybrid'
  },

  // Cáp sạc
  {
    id: '11',
    name: 'Type 2 to Type 2 Cable 32A 7m',
    price: 4500000,
    rating: 4.4,
    reviewCount: 189,
    image: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=400&h=400&fit=crop',
    category: 'accessories/cables',
    brand: 'Phoenix Contact',
    inStock: true,
    description: 'Cáp sạc AC Type 2, chống nước IP55, dài 7m'
  },
  {
    id: '12',
    name: 'CCS Combo 2 DC Cable 150A',
    price: 8900000,
    originalPrice: 11000000,
    rating: 4.6,
    reviewCount: 76,
    image: 'https://images.unsplash.com/photo-1593941707961-b4e5ccd83b6f?w=400&h=400&fit=crop',
    category: 'accessories/cables',
    brand: 'TE Connectivity',
    inStock: true,
    isSale: true,
    description: 'Cáp DC CCS Combo 2, sạc nhanh đến 150A'
  },

  // Dụng cụ
  {
    id: '13',
    name: 'EV Diagnostic Scanner OBD Pro',
    price: 15500000,
    rating: 4.5,
    reviewCount: 134,
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop',
    category: 'accessories/tools',
    brand: 'Launch',
    inStock: true,
    description: 'Máy chẩn đoán xe điện chuyên nghiệp, hỗ trợ tất cả hãng'
  },
  {
    id: '14',
    name: 'High Voltage Safety Kit',
    price: 8500000,
    rating: 4.8,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1581833971403-61c727efcc76?w=400&h=400&fit=crop',
    category: 'accessories/tools',
    brand: 'Fluke',
    inStock: true,
    isNew: true,
    description: 'Bộ dụng cụ an toàn điện áp cao cho kỹ thuật viên'
  },

  // Thiết bị an toàn
  {
    id: '15',
    name: 'Fire Extinguisher Lithium Class D',
    price: 2800000,
    rating: 4.7,
    reviewCount: 145,
    image: 'https://images.unsplash.com/photo-1558618047-bd8752c57446?w=400&h=400&fit=crop',
    category: 'accessories/safety',
    brand: 'Amerex',
    inStock: true,
    description: 'Bình chữa cháy chuyên dụng cho pin lithium'
  },
  {
    id: '16',
    name: 'EV Warning Triangle Set',
    price: 650000,
    rating: 4.3,
    reviewCount: 234,
    image: 'https://images.unsplash.com/photo-1593941707471-ef1eeaff3994?w=400&h=400&fit=crop',
    category: 'accessories/safety',
    brand: 'Reflective Pro',
    inStock: true,
    description: 'Bộ tam giác cảnh báo phản quang cho xe điện'
  },

  // Thiết bị chẩn đoán
  {
    id: '17',
    name: 'Tesla Service Diagnostic Kit',
    price: 125000000,
    rating: 4.9,
    reviewCount: 23,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=400&fit=crop',
    category: 'equipment/diagnostic',
    brand: 'Tesla',
    inStock: false,
    description: 'Bộ kit chẩn đoán chính hãng Tesla cho service center'
  },
  {
    id: '18',
    name: 'BMW ISTA+ Software Package',
    price: 45000000,
    rating: 4.6,
    reviewCount: 67,
    image: 'https://images.unsplash.com/photo-1593941707445-24ad0b6463f2?w=400&h=400&fit=crop',
    category: 'equipment/diagnostic',
    brand: 'BMW',
    inStock: true,
    description: 'Phần mềm chẩn đoán BMW ISTA+ cho xe điện i-series'
  },

  // Trạm sạc
  {
    id: '19',
    name: 'ChargePoint Express Plus',
    price: 285000000,
    rating: 4.7,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1593941707902-4b4d4e5b7b64?w=400&h=400&fit=crop',
    category: 'equipment/charging',
    brand: 'ChargePoint',
    inStock: true,
    isNew: true,
    description: 'Trạm sạc công cộng 2 đầu, 125kW mỗi cổng'
  },
  {
    id: '20',
    name: 'EVBox Troniq Modular 350kW',
    price: 450000000,
    rating: 4.8,
    reviewCount: 34,
    image: 'https://images.unsplash.com/photo-1558618047-4439892c83f4?w=400&h=400&fit=crop',
    category: 'equipment/charging',
    brand: 'EVBox',
    inStock: true,
    description: 'Trạm sạc siêu nhanh modular, mở rộng được'
  },

  // Dầu nhớt & hóa chất
  {
    id: '21',
    name: 'Coolant EV Specific G48',
    price: 850000,
    rating: 4.5,
    reviewCount: 267,
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop',
    category: 'fluids/coolant',
    brand: 'Castrol',
    inStock: true,
    description: 'Nước làm mát chuyên dụng cho hệ thống pin xe điện'
  },
  {
    id: '22',
    name: 'Brake Fluid DOT 4 ESC',
    price: 420000,
    originalPrice: 520000,
    rating: 4.6,
    reviewCount: 198,
    image: 'https://images.unsplash.com/photo-1593941707961-b4e5ccd83b6f?w=400&h=400&fit=crop',
    category: 'fluids/brake',
    brand: 'Mobil 1',
    inStock: true,
    isSale: true,
    description: 'Dầu phanh cao cấp cho hệ thống ESC xe điện'
  },

  // Thiết bị bảo dưỡng
  {
    id: '23',
    name: 'Battery Thermal Management Tester',
    price: 95000000,
    rating: 4.8,
    reviewCount: 45,
    image: 'https://images.unsplash.com/photo-1558618047-bd8752c57446?w=400&h=400&fit=crop',
    category: 'equipment/maintenance',
    brand: 'Hioki',
    inStock: true,
    description: 'Thiết bị kiểm tra hệ thống quản lý nhiệt pin'
  },
  {
    id: '24',
    name: 'EV Lift Adapter Kit',
    price: 12500000,
    rating: 4.4,
    reviewCount: 156,
    image: 'https://images.unsplash.com/photo-1581833971403-61c727efcc76?w=400&h=400&fit=crop',
    category: 'equipment/maintenance',
    brand: 'Rotary',
    inStock: true,
    isNew: true,
    description: 'Bộ adapter nâng xe cho xe điện, bảo vệ pin'
  }
]

const categories = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'parts', label: 'Phụ tùng EV' },
  { value: 'parts/battery', label: 'Pin xe điện' },
  { value: 'parts/charger', label: 'Bộ sạc' },
  { value: 'parts/motor', label: 'Động cơ điện' },
  { value: 'parts/controller', label: 'Bộ điều khiển' },
  { value: 'accessories', label: 'Phụ kiện' },
  { value: 'accessories/cables', label: 'Cáp sạc' },
  { value: 'accessories/tools', label: 'Dụng cụ' },
  { value: 'accessories/safety', label: 'Thiết bị an toàn' },
  { value: 'fluids', label: 'Dầu nhớt & Hóa chất' },
  { value: 'fluids/brake', label: 'Dầu phanh' },
  { value: 'fluids/coolant', label: 'Nước làm mát' },
  { value: 'equipment', label: 'Trang thiết bị' },
  { value: 'equipment/diagnostic', label: 'Thiết bị chẩn đoán' },
  { value: 'equipment/charging', label: 'Trạm sạc' },
  { value: 'equipment/maintenance', label: 'Thiết bị bảo dưỡng' }
]

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

const brands = [
  'Tất cả thương hiệu', 
  'Samsung SDI', 
  'BYD', 
  'Tesla', 
  'ABB', 
  'Wallbox', 
  'Bosch', 
  'Siemens', 
  'Continental', 
  'Phoenix Contact', 
  'TE Connectivity', 
  'Launch', 
  'Fluke', 
  'Amerex', 
  'ChargePoint', 
  'EVBox', 
  'Castrol', 
  'Mobil 1', 
  'Hioki', 
  'Rotary'
]

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-low', label: 'Giá thấp đến cao' },
  { value: 'price-high', label: 'Giá cao đến thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'popular', label: 'Phổ biến nhất' }
]

export default function Products() {
  const { category, subcategory } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('Tất cả thương hiệu')
  const [priceRange, setPriceRange] = useState([0, 30000000])
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(true)
  const [visibleProducts, setVisibleProducts] = useState(12)

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
    return 'Tất cả sản phẩm'
  }

  // Lấy breadcrumb
  const getBreadcrumb = (): string[] => {
    const breadcrumb = ['Sản phẩm']
    if (category) {
      breadcrumb.push(categoryMapping[category] || category)
      if (subcategory) {
        const fullPath = `${category}/${subcategory}`
        breadcrumb.push(categoryMapping[fullPath] || subcategory)
      }
    }
    return breadcrumb
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
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Logic filter category phức tạp hơn để support nested categories
    let matchesCategory = false
    if (selectedCategory === 'all') {
      matchesCategory = true
    } else if (selectedCategory.includes('/')) {
      // Exact match cho subcategory
      matchesCategory = product.category === selectedCategory
    } else {
      // Match category cha (parts, accessories, fluids, equipment)
      matchesCategory = product.category.startsWith(selectedCategory)
    }
    
    const matchesBrand = selectedBrand === 'Tất cả thương hiệu' || product.brand === selectedBrand
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
    
    return matchesSearch && matchesCategory && matchesBrand && matchesPrice
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return b.rating - a.rating
      case 'popular':
        return b.reviewCount - a.reviewCount
      case 'newest':
      default:
        return a.isNew ? -1 : b.isNew ? 1 : 0
    }
  })

  const currentProducts = filteredProducts.slice(0, visibleProducts)

  return (
    <div className="products-page">
      {/* Page Header - Nike Style */}
      <div className="page-header">
        <div className="container">
          <div className="header-top">
            <h1 className="page-title">
              {getCurrentCategoryName()} ({filteredProducts.length})
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
                    {['VinFast', 'ABB', 'Tesla', 'Bosch', 'Continental', 'Samsung SDI'].map(brand => (
                      <label key={brand} className="filter-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedBrand === brand}
                          onChange={(e) => setSelectedBrand(e.target.checked ? brand : 'Tất cả thương hiệu')}
                        />
                        <span className="checkmark"></span>
                        {brand}
                      </label>
                    ))}
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
              <div className="products-grid">
                {currentProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="product-card"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="product-image">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x400/f5f5f5/666?text=Sản phẩm'
                        }}
                      />
                      {product.isNew && <span className="product-badge new">Coming Soon</span>}
                      {product.isSale && <span className="product-badge sale">Bestseller</span>}
                    </div>

                    <div className="product-info">
                      <div className="product-brand">{product.brand}</div>
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-category">1 Colour</div>
                      <div className="product-price">
                        <span className="current-price">{formatPrice(product.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {visibleProducts < filteredProducts.length && (
                <div className="load-more-section">
                  <button 
                    className="load-more-btn"
                    onClick={() => setVisibleProducts(prev => prev + 12)}
                  >
                    Load More ({filteredProducts.length - visibleProducts} remaining)
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
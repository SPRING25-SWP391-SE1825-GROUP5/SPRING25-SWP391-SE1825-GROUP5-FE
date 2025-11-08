import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addToCart, updateQuantity, removeFromCart } from '@/store/cartSlice'
import { PartService, Part, CartService, InventoryService, CenterService } from '@/services'
import type { InventoryData, InventoryPart } from '@/services/inventoryService'
import type { Center } from '@/services/centerService'
import toast from 'react-hot-toast'
import {
  ShoppingCartIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  BuildingStorefrontIcon
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
const convertPartToProduct = (part: any): Product => {
  // Xử lý giá linh hoạt - có thể là unitPrice, UnitPrice, price, hoặc Price
  const unitPrice = part.unitPrice ?? part.UnitPrice ?? part.price ?? part.Price ?? 0
  const totalStock = part.totalStock ?? part.TotalStock ?? part.stock ?? part.Stock ?? 0
  
  console.log('[ProductDetail] Converting part - unitPrice:', unitPrice, 'from:', {
    unitPrice: part.unitPrice,
    UnitPrice: part.UnitPrice,
    price: part.price,
    Price: part.Price
  })
  
  return {
    ...part,
    // Map Part properties to Product properties
    id: (part.partId ?? part.PartId ?? part.id ?? '').toString(),
    name: part.partName ?? part.PartName ?? part.name ?? '',
    price: unitPrice,
    unitPrice: unitPrice, // Đảm bảo có unitPrice
    originalPrice: unitPrice > 0 ? unitPrice * 1.2 : undefined, // Chỉ hiển thị nếu có giá
    brand: part.brand ?? part.Brand ?? '',
    category: part.brand ?? part.Brand ?? '', // Using brand as category for now
    rating: part.rating ?? part.Rating ?? 0,
    inStock: !(part.isOutOfStock ?? part.IsOutOfStock ?? false),
    totalStock: totalStock,
    // Add UI-specific properties
    description: `${part.partName ?? part.PartName ?? ''} - ${part.brand ?? part.Brand ?? ''}`,
    reviewCount: Math.floor(Math.random() * 200) + 50, // Mock review count
    images: [part.imageUrl ?? part.ImageUrl ?? `https://picsum.photos/seed/${part.partId ?? part.PartId ?? 0}/400/400`],
    features: ['Chất lượng cao', 'Bền bỉ', 'Đáng tin cậy'],
    specifications: {
      'Thương hiệu': part.brand ?? part.Brand ?? '',
      'Danh mục': part.brand ?? part.Brand ?? '',
      'Tình trạng': (part.isOutOfStock ?? part.IsOutOfStock) ? 'Hết hàng' : 'Còn hàng'
    }
  }
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const cart = useAppSelector((s) => s.cart)
  
  const [product, setProduct] = useState<Product | null>(null)
  const [allParts, setAllParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [centers, setCenters] = useState<Center[]>([])
  const [inventoryByCenter, setInventoryByCenter] = useState<Map<number, InventoryPart | null>>(new Map())
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null)

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
        
        console.log('[ProductDetail] API Response:', response)
        console.log('[ProductDetail] Response data:', response.data)
        
        if (response.success && response.data) {
          const partData = response.data
          console.log('[ProductDetail] Part data unitPrice:', partData.unitPrice)
          console.log('[ProductDetail] Part data keys:', Object.keys(partData))
          
          const productData = convertPartToProduct(partData)
          console.log('[ProductDetail] Converted product data:', productData)
          console.log('[ProductDetail] Product unitPrice:', productData.unitPrice)
          setProduct(productData)
        } else {
          setError('Không tìm thấy sản phẩm')
        }
      } catch (err) {

        setError('Có lỗi xảy ra khi tải sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  // Load active centers (separate from inventory to enable dropdown immediately)
  useEffect(() => {
    const loadCenters = async () => {
      try {
        setLoadingCenters(true)
        console.log('[ProductDetail] Loading active centers...')
        // Sử dụng API /api/Center/active để chỉ lấy các chi nhánh đang hoạt động
        const centersResponse = await CenterService.getActiveCenters({ pageSize: 100 })
        const centersList = centersResponse.centers || []
        console.log('[ProductDetail] Active centers loaded:', centersList.length, centersList)
        setCenters(centersList)
      } catch (error) {
        console.error('[ProductDetail] Error loading active centers:', error)
        setCenters([])
      } finally {
        setLoadingCenters(false)
      }
    }

    loadCenters()
  }, [])

  // Load inventory for all centers and set default to center with highest stock
  useEffect(() => {
    const loadAllInventories = async () => {
      if (!product?.partId || centers.length === 0) {
        return
      }

      try {
        setLoadingInventory(true)
        console.log(`[ProductDetail] Loading inventory for all ${centers.length} centers...`)
        
        // Load inventory for all centers in parallel
        const inventoryMap = new Map<number, InventoryPart | null>()
        
        await Promise.allSettled(
          centers.map(async (center) => {
            try {
              const inventoryId = center.centerId
              console.log(`[ProductDetail] Loading inventory for center ${inventoryId}...`)
              
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
                
                // Tìm part trong inventory
                let partInInventory: InventoryPart | null = null
                if (partsArray.length > 0) {
                  partInInventory = partsArray.find(
                    (p: InventoryPart) => p.partId === product.partId
                  ) || null
                }
                
                inventoryMap.set(center.centerId, partInInventory)
                console.log(`[ProductDetail] Center ${inventoryId}: stock = ${partInInventory?.currentStock ?? 0}`)
              } else {
                inventoryMap.set(center.centerId, null)
              }
            } catch (error: any) {
              console.error(`[ProductDetail] Error loading inventory for center ${center.centerId}:`, error)
              inventoryMap.set(center.centerId, null)
            }
          })
        )

        setInventoryByCenter(inventoryMap)
        
        // Tìm center có stock cao nhất và set làm mặc định
        let maxStock = -1
        let bestCenterId: number | null = null
        
        inventoryMap.forEach((part, centerId) => {
          const stock = part?.currentStock ?? 0
          if (stock > maxStock) {
            maxStock = stock
            bestCenterId = centerId
          }
        })
        
        // Nếu không có center nào có stock, chọn center đầu tiên
        if (bestCenterId === null && centers.length > 0) {
          bestCenterId = centers[0].centerId
        }
        
        if (bestCenterId !== null && !selectedCenterId) {
          console.log(`[ProductDetail] Setting default center to ${bestCenterId} (stock: ${maxStock})`)
          setSelectedCenterId(bestCenterId)
        }
      } catch (error: any) {
        console.error(`[ProductDetail] Error loading all inventories:`, error)
      } finally {
        setLoadingInventory(false)
      }
    }

    if (product?.partId && centers.length > 0) {
      loadAllInventories()
    }
  }, [product?.partId, centers.length])

  // Load inventory data when user manually selects a center (if not already loaded)
  useEffect(() => {
    const loadInventoryForSelectedCenter = async () => {
      if (!product?.partId || !selectedCenterId) {
        return
      }

      // Kiểm tra xem đã load chưa
      if (inventoryByCenter.has(selectedCenterId)) {
        console.log(`[ProductDetail] Inventory for center ${selectedCenterId} already loaded`)
        return
      }

      try {
        setLoadingInventory(true)
        console.log(`[ProductDetail] Loading inventory for center ${selectedCenterId}...`)
        
        // inventoryId chính là centerId (1-1 mapping)
        const inventoryId = selectedCenterId
        
        // Gọi API GET /api/Inventory/{inventoryId}/parts
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
          
          // Tìm part trong inventory
          let partInInventory: InventoryPart | null = null
          if (partsArray.length > 0) {
            partInInventory = partsArray.find(
              (p: InventoryPart) => p.partId === product.partId
            ) || null
          }
          
          // Cập nhật map
          setInventoryByCenter(prev => {
            const newMap = new Map(prev)
            newMap.set(selectedCenterId, partInInventory)
            return newMap
          })
        } else {
          setInventoryByCenter(prev => {
            const newMap = new Map(prev)
            newMap.set(selectedCenterId, null)
            return newMap
          })
        }
      } catch (error: any) {
        console.error(`[ProductDetail] Error loading parts for inventory ${selectedCenterId}:`, error)
        setInventoryByCenter(prev => {
          const newMap = new Map(prev)
          newMap.set(selectedCenterId, null)
          return newMap
        })
      } finally {
        setLoadingInventory(false)
      }
    }

    if (product?.partId && selectedCenterId && centers.length > 0) {
      // Chỉ load nếu chưa có trong map
      const hasData = inventoryByCenter.has(selectedCenterId)
      if (!hasData) {
        loadInventoryForSelectedCenter()
      }
    }
  }, [product?.partId, selectedCenterId, centers.length])

  // Get related products based on same brand
  const getRelatedProducts = (): Product[] => {
    if (!product || allParts.length === 0) return []
    
    return allParts
      .filter(p => p.partId !== product.partId) // Exclude current product
      .filter(p => p.brand === product.brand) // Same brand
      .slice(0, 8) // Limit to 8 products
      .map(convertPartToProduct)
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    // Không yêu cầu chọn center khi add to cart - sẽ chọn sau ở confirm order
    // Chỉ validate stock nếu đã chọn center (optional)
    if (selectedCenterId) {
      const inventoryPart = inventoryByCenter.get(selectedCenterId)
      const stock = inventoryPart?.currentStock ?? 0
      const isOutOfStock = inventoryPart?.isOutOfStock === true || stock === 0
      
      if (isOutOfStock) {
        toast.error('Sản phẩm đã hết hàng tại chi nhánh này')
        return
      }
      
      // Validate stock đủ cho quantity
      if (stock < quantity) {
        toast.error(`Không đủ hàng tại chi nhánh đã chọn. Hiện có: ${stock}, bạn cần: ${quantity}`)
        return
      }
    }
    
    // Add to cart with quantity (không bắt buộc fulfillmentCenterId)
    const itemId = product.partId.toString()
    const productPrice = product.unitPrice ?? product.price ?? 0
    const cartItem = {
      id: itemId,
      name: product.partName,
      price: productPrice,
      image: product.images?.[0] || `https://picsum.photos/seed/${product.partId}/400/400`,
      brand: product.brand,
      category: product.category,
      inStock: product.inStock || true,
      fulfillmentCenterId: selectedCenterId ?? undefined  // Optional - có thể không có
    }
    
    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.id === itemId)
    
    if (existingItem) {
      // Update quantity if item exists (không cần kiểm tra center vì sẽ chọn sau)
      dispatch(updateQuantity({
        id: itemId,
        quantity: existingItem.quantity + quantity,
        userId: user?.id ?? null
      }))
    } else {
      // Add new item, then update quantity
      dispatch(addToCart({
        item: cartItem,
        userId: user?.id ?? null
      }))
      if (quantity > 1) {
        dispatch(updateQuantity({
          id: itemId,
          quantity: quantity,
          userId: user?.id ?? null
        }))
      }
    }

    toast.success(`Đã thêm ${quantity} "${product.partName}" vào giỏ hàng!`)

    // Best-effort sync to backend cart
    try {
      const userId = user?.id
      const cartIdKey = userId ? `cartId_${userId}` : 'cartId_guest'
      const storedCartId = (typeof localStorage !== 'undefined' && localStorage.getItem(cartIdKey)) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(cartIdKey))
      let cartId = storedCartId ? Number(storedCartId) : null
      if (!cartId) return
      await CartService.addItem(cartId, { partId: product.partId, quantity: quantity })
    } catch (_) { /* ignore */ }
  }

  const handleBuyNow = () => {
    if (!product) return
    
    // Add to cart first
    handleAddToCart()
    // Navigate to cart
    setTimeout(() => {
      navigate('/cart')
    }, 100)
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price) || price < 0) {
      return '0 ₫'
    }
    
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price)
    } catch (error) {
      console.error('[ProductDetail] Error formatting price:', price, error)
      return `${Number(price).toLocaleString('vi-VN')} ₫`
    }
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
                {formatPrice(product.unitPrice ?? product.price ?? 0)}
              </div>
              {product.originalPrice && product.originalPrice > (product.unitPrice ?? product.price ?? 0) && (
                <div className="price-original">
                  {formatPrice(product.originalPrice)}
                </div>
              )}
            </div>

            <div className="product-availability">
              <div className="availability-header">
                <label htmlFor="center-select" className="availability-label">
                  Xem chi nhánh còn hàng:
                </label>
                <select
                  id="center-select"
                  className="center-select"
                  value={selectedCenterId || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log('[ProductDetail] Center selected:', value)
                    setSelectedCenterId(value ? Number(value) : null)
                  }}
                  disabled={loadingCenters}
                >
                  {centers.map((center) => (
                    <option key={center.centerId} value={center.centerId}>
                      {center.centerName}
                    </option>
                  ))}
                </select>
                {loadingCenters && (
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                    Đang tải danh sách chi nhánh...
                  </span>
                )}
              </div>
              
              {selectedCenterId ? (
                <div className="center-stock-info">
                  {loadingInventory ? (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      padding: '24px',
                      color: '#666'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 12px', width: '24px', height: '24px' }}></div>
                        <p style={{ margin: 0, fontSize: '14px' }}>Đang tải thông tin tồn kho...</p>
                      </div>
                    </div>
                  ) : (() => {
                    const inventoryPart = inventoryByCenter.get(selectedCenterId)
                    console.log('[ProductDetail] Rendering stock info for center', selectedCenterId, 'inventoryPart:', inventoryPart)
                    
                    // Kiểm tra xem có part trong inventory không
                    // Nếu inventoryPart là undefined, có nghĩa là chưa load hoặc không có
                    // Nếu là null, có nghĩa là đã load nhưng không tìm thấy
                    const hasLoaded = inventoryByCenter.has(selectedCenterId)
                    const hasPart = inventoryPart !== null && inventoryPart !== undefined
                    const stock = inventoryPart?.currentStock ?? 0
                    const isLowStock = inventoryPart?.isLowStock ?? false
                    // Chỉ coi là hết hàng nếu isOutOfStock = true HOẶC stock = 0
                    const isOutOfStock = inventoryPart?.isOutOfStock === true || (hasPart && stock === 0)
                    const selectedCenter = centers.find(c => c.centerId === selectedCenterId)

                    console.log('[ProductDetail] Stock info:', {
                      hasLoaded,
                      hasPart,
                      stock,
                      isLowStock,
                      isOutOfStock,
                      inventoryPart
                    })

                    return (
                      <>
                        <div className="center-stock-header">
                          <div className="center-stock-name">
                            <BuildingStorefrontIcon className="w-4 h-4" />
                            <span>{selectedCenter?.centerName || 'Chi nhánh'}</span>
                          </div>
                          {hasPart && (
                            <div className={`stock-status-badge ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}>
                              {isOutOfStock ? 'Hết hàng' : isLowStock ? 'Sắp hết' : 'Còn hàng'}
                            </div>
                          )}
                        </div>
                        {hasPart ? (
                          <div className="center-stock-details">
                            <div className="stock-detail-row">
                              <span className="stock-detail-label">Tồn kho:</span>
                              <span className={`stock-detail-value ${isOutOfStock ? 'zero' : ''}`}>
                                {stock.toLocaleString('vi-VN')} sản phẩm
                              </span>
                            </div>
                            {selectedCenter?.address && (
                              <div className="stock-detail-row">
                                <span className="stock-detail-label">Địa chỉ:</span>
                                <span className="stock-detail-value">
                                  <MapPinIcon className="w-3 h-3" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                  {selectedCenter.address}
                                  {selectedCenter.city && `, ${selectedCenter.city}`}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : hasLoaded ? (
                          <div className="no-stock-message">
                            <p>Sản phẩm không có trong kho của chi nhánh này</p>
                          </div>
                        ) : (
                          <div className="no-stock-message">
                            <p>Không thể tải thông tin tồn kho. Vui lòng thử lại sau.</p>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="stock-placeholder">
                  <p>Vui lòng chọn chi nhánh để xem tồn kho</p>
                </div>
              )}
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <label>Số lượng:</label>
                <div className="quantity-controls">
                  {(() => {
                    // Kiểm tra stock của chi nhánh đã chọn
                    let isDisabled = false
                    if (selectedCenterId) {
                      const inventoryPart = inventoryByCenter.get(selectedCenterId)
                      const stock = inventoryPart?.currentStock ?? 0
                      const isOutOfStock = inventoryPart?.isOutOfStock === true || stock === 0
                      isDisabled = isOutOfStock
                    } else {
                      isDisabled = !product.inStock
                    }
                    
                    return (
                      <>
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1 || isDisabled}
                        >
                          -
                        </button>
                        <span className="quantity-value">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(quantity + 1)}
                          disabled={isDisabled}
                        >
                          +
                        </button>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="action-buttons">
                {(() => {
                  // Kiểm tra stock của chi nhánh đã chọn
                  let isDisabled = false
                  if (selectedCenterId) {
                    const inventoryPart = inventoryByCenter.get(selectedCenterId)
                    const stock = inventoryPart?.currentStock ?? 0
                    const isOutOfStock = inventoryPart?.isOutOfStock === true || stock === 0
                    isDisabled = isOutOfStock
                  } else {
                    isDisabled = !product.inStock
                  }
                  
                  return (
                    <>
                      <button 
                        className="btn btn-primary"
                        onClick={handleAddToCart}
                        disabled={isDisabled}
                      >
                        <ShoppingCartIcon className="w-5 h-5" />
                        Thêm vào giỏ hàng
                      </button>
                      
                      <button 
                        className="btn btn-secondary"
                        onClick={handleBuyNow}
                        disabled={isDisabled}
                      >
                        Mua ngay
                      </button>
                    </>
                  )
                })()}
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
                      {formatPrice(relatedProduct.unitPrice ?? relatedProduct.price ?? 0)}
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
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addToCart, updateQuantity } from '@/store/cartSlice'
import { PartService, Part, CartService, InventoryService, CenterService, OrderService, CustomerService } from '@/services'
import type { InventoryPart } from '@/services/inventoryService'
import type { Center } from '@/services/centerService'
import toast from 'react-hot-toast'
import {
  ShoppingCartIcon,
  StarIcon,
  MapPinIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import './product-detail.scss'

type Product = Part & {
  id: string
  name: string
  price: number
  category: string
  description?: string
  specifications?: {
    [key: string]: string
  }
  images?: string[]
  inStock?: boolean
}

const convertPartToProduct = (part: Part): Product => {
    const unitPrice = part.unitPrice ?? 0
    const totalStock = part.totalStock ?? 0

    return {
      ...part,
      partId: part.partId,
      id: String(part.partId),
      name: part.partName,
      price: unitPrice,
      unitPrice,
      brand: part.brand ?? '',
      category: part.brand ?? '',
      rating: part.rating ?? 0,
      inStock: !(part.isOutOfStock ?? false),
      totalStock,
      description: `${part.partName ?? ''} - ${part.brand ?? ''}`,
      images: part.imageUrl ? [part.imageUrl] : [],
      specifications: {
        'Thương hiệu': part.brand ?? '',
        'Danh mục': part.brand ?? '',
        'Tình trạng': (part.isOutOfStock ?? false) ? 'Hết hàng' : 'Còn hàng'
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
  const [availableCenters, setAvailableCenters] = useState<Center[]>([])

  const recalcAvailableCenters = (inventoryMap: Map<number, InventoryPart | null>, centersList: Center[]) => {
    const available = centersList.filter(center => {
      const part = inventoryMap.get(center.centerId)
      if (!part) return false
      const stock = part.currentStock ?? 0
      const isOutOfStock = part.isOutOfStock === true || stock <= 0
      return !isOutOfStock
    })

    setAvailableCenters(available)

    setSelectedCenterId((prevSelected) => {
      if (available.length === 0) {
        return null
      }

      if (prevSelected && available.some(center => center.centerId === prevSelected)) {
        return prevSelected
      }

      let bestCenterId: number | null = null
      let bestStock = -1

      available.forEach(center => {
        const stock = inventoryMap.get(center.centerId)?.currentStock ?? 0
        if (stock > bestStock) {
          bestStock = stock
          bestCenterId = center.centerId
        }
      })

      return bestCenterId ?? available[0].centerId
    })
  }

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)

        const allPartsResponse = await PartService.getPartAvailability()
        if (allPartsResponse.success) {
          setAllParts(allPartsResponse.data)
        }

        const productId = parseInt(id)
        const response = await PartService.getPartById(productId)

        if (response.success && response.data) {
          const partData = response.data
          const productData = convertPartToProduct(partData)
          setProduct(productData)
        } else {
          setError('Không tìm thấy sản phẩm')
        }
      } catch {
        setError('Có lỗi xảy ra khi tải sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  useEffect(() => {
    const loadCenters = async () => {
      try {
        setLoadingCenters(true)
        const centersResponse = await CenterService.getActiveCenters({ pageSize: 100 })
        const centersList = centersResponse.centers || []
        setCenters(centersList)
      } catch {
        setCenters([])
      } finally {
        setLoadingCenters(false)
      }
    }

    loadCenters()
  }, [])

  useEffect(() => {
    const loadAllInventories = async () => {
      if (!product?.partId || centers.length === 0) {
        return
      }

      try {
        setLoadingInventory(true)
        const inventoryMap = new Map<number, InventoryPart | null>()

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
                  const dataObj = partsResponse.data as Record<string, unknown>
                  for (const key in dataObj) {
                    const value = dataObj[key]
                    if (Array.isArray(value)) {
                      partsArray = value as InventoryPart[]
                      break
                    }
                  }
                }

                let partInInventory: InventoryPart | null = null
                if (partsArray.length > 0) {
                  partInInventory = partsArray.find(
                    (p: InventoryPart) => p.partId === product.partId
                  ) || null
                }

                inventoryMap.set(center.centerId, partInInventory)
              } else {
                inventoryMap.set(center.centerId, null)
              }
            } catch (error) {
              console.error('[ProductDetail] Không thể tải tồn kho cho chi nhánh', center.centerId, error)
              inventoryMap.set(center.centerId, null)
            }
          })
        )

        setInventoryByCenter(inventoryMap)
        recalcAvailableCenters(inventoryMap, centers)
      } catch (error) {
        console.error('[ProductDetail] Không thể tải tồn kho cho tất cả chi nhánh:', error)
      } finally {
        setLoadingInventory(false)
      }
    }

    if (product?.partId && centers.length > 0) {
      loadAllInventories()
    }
  }, [product?.partId, centers])

  useEffect(() => {
    const loadInventoryForSelectedCenter = async () => {
      if (!product?.partId || !selectedCenterId) {
        return
      }

      if (inventoryByCenter.has(selectedCenterId)) {
        return
      }

      try {
        setLoadingInventory(true)
        const inventoryId = selectedCenterId
        const partsResponse = await InventoryService.getInventoryParts(inventoryId)

        if (partsResponse.success && partsResponse.data) {
          let partsArray: InventoryPart[] = []

          if (Array.isArray(partsResponse.data)) {
            partsArray = partsResponse.data
          } else if (partsResponse.data && typeof partsResponse.data === 'object') {
            const dataObj = partsResponse.data as Record<string, unknown>
            for (const key in dataObj) {
              const value = dataObj[key]
              if (Array.isArray(value)) {
                partsArray = value as InventoryPart[]
                break
              }
            }
          }

          let partInInventory: InventoryPart | null = null
          if (partsArray.length > 0) {
            partInInventory = partsArray.find(
              (p: InventoryPart) => p.partId === product.partId
            ) || null
          }

          setInventoryByCenter(prev => {
            const newMap = new Map(prev)
            newMap.set(selectedCenterId, partInInventory)
            recalcAvailableCenters(newMap, centers)
            return newMap
          })
        } else {
          setInventoryByCenter(prev => {
            const newMap = new Map(prev)
            newMap.set(selectedCenterId, null)
            recalcAvailableCenters(newMap, centers)
            return newMap
          })
        }
      } catch (error) {
        console.error('[ProductDetail] Không thể tải tồn kho cho chi nhánh', selectedCenterId, error)
        setInventoryByCenter(prev => {
          const newMap = new Map(prev)
          newMap.set(selectedCenterId, null)
          recalcAvailableCenters(newMap, centers)
          return newMap
        })
      } finally {
        setLoadingInventory(false)
      }
    }

    if (product?.partId && selectedCenterId && centers.length > 0) {
      const hasData = inventoryByCenter.has(selectedCenterId)
      if (!hasData) {
        loadInventoryForSelectedCenter()
      }
    }
  }, [product?.partId, selectedCenterId, centers, inventoryByCenter])

  const getRelatedProducts = (): Product[] => {
    if (!product || allParts.length === 0) return []

    return allParts
      .filter(p => p.partId !== product.partId)
      .filter(p => p.brand === product.brand)
      .slice(0, 8)
      .map(convertPartToProduct)
  }

  const handleAddToCart = async (silent: boolean = false) => {
    if (!product) return

    if (availableCenters.length === 0) {
      toast.error('Sản phẩm đã hết hàng tại tất cả chi nhánh')
      return
    }

    if (selectedCenterId) {
      const inventoryPart = inventoryByCenter.get(selectedCenterId)
      const stock = inventoryPart?.currentStock ?? 0
      const isOutOfStock = inventoryPart?.isOutOfStock === true || stock === 0

      if (isOutOfStock) {
        toast.error('Sản phẩm đã hết hàng tại chi nhánh này')
        return
      }

      if (stock < quantity) {
        toast.error(`Không đủ hàng tại chi nhánh đã chọn. Hiện có: ${stock}, bạn cần: ${quantity}`)
        return
      }
    }

    const itemId = product.partId.toString()
    const productPrice = product.unitPrice ?? product.price ?? 0
    const cartItem = {
      id: itemId,
      name: product.partName,
      price: productPrice,
      image: product.images?.[0] || '',
      brand: product.brand,
      category: product.category,
      inStock: product.inStock || true,
      fulfillmentCenterId: selectedCenterId ?? undefined
    }

    const existingItem = cart.items.find(item => item.id === itemId)

    if (existingItem) {
      dispatch(updateQuantity({
        id: itemId,
        quantity: existingItem.quantity + quantity,
        userId: user?.id ?? null
      }))
    } else {
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

    if (!silent) {
      toast.success(`Đã thêm ${quantity} "${product.partName}" vào giỏ hàng!`)
    }

    try {
      if (!user?.customerId) return
      await CartService.addItem(Number(user.customerId), { partId: product.partId, quantity })
    } catch (error) {
      console.error('[ProductDetail] Không thể đồng bộ giỏ hàng với máy chủ:', error)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return

    if (availableCenters.length === 0) {
      toast.error('Sản phẩm đã hết hàng tại tất cả chi nhánh')
      return
    }

    if (!user) {
      toast.error('Vui lòng đăng nhập để tiếp tục')
      navigate('/auth/login', { state: { redirect: `/product/${product.partId}` } })
      return
    }

    if (selectedCenterId) {
      const inventoryPart = inventoryByCenter.get(selectedCenterId)
      const stock = inventoryPart?.currentStock ?? 0
      const isOutOfStock = inventoryPart?.isOutOfStock === true || stock === 0

      if (isOutOfStock) {
        toast.error('Sản phẩm đã hết hàng tại chi nhánh này')
        return
      }

      if (stock < quantity) {
        toast.error(`Không đủ hàng tại chi nhánh đã chọn. Hiện có: ${stock}, bạn cần: ${quantity}`)
        return
      }
    }

    try {
      await handleAddToCart(true)

      let customerId = user.customerId
      if (!customerId) {
        try {
          const me = await CustomerService.getCurrentCustomer()
          if (me?.success && me?.data?.customerId) {
            customerId = me.data.customerId
          } else {
            toast.error('Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.')
            navigate('/auth/login', { state: { redirect: `/product/${product.partId}` } })
            return
          }
        } catch (customerError: unknown) {
          const responseStatus =
            typeof customerError === 'object' && customerError !== null && 'response' in customerError
              ? (customerError as { response?: { status?: number }; isAuthError?: boolean }).response?.status
              : undefined
          const isAuthError =
            typeof customerError === 'object' && customerError !== null && 'isAuthError' in customerError
              ? Boolean((customerError as { isAuthError?: boolean }).isAuthError)
              : false

          if (responseStatus === 401 || isAuthError) {
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
            navigate('/auth/login', { state: { redirect: `/product/${product.partId}` } })
            return
          }
          toast.error('Không thể lấy thông tin khách hàng. Vui lòng thử lại.')
          return
        }
      }

      const response = await OrderService.createOrder(Number(customerId), {
        items: [{
          partId: product.partId,
          quantity: quantity
        }],
        fulfillmentCenterId: selectedCenterId ?? undefined
      })

      if (response.success) {
        const orderId = response.data?.orderId ?? response.data?.OrderId ?? response.data?.id
        if (orderId) {
          navigate('/confirm-order', { state: { orderId: Number(orderId) }, replace: true })
        } else {
          toast.error('Không thể lấy mã đơn hàng từ phản hồi')
        }
      } else {
        toast.error(response.message || 'Không thể tạo đơn hàng')
      }
    } catch (error: unknown) {
      const responseStatus =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { status?: number }; isAuthError?: boolean }).response?.status
          : undefined
      const isAuthError =
        typeof error === 'object' && error !== null && 'isAuthError' in error
          ? Boolean((error as { isAuthError?: boolean }).isAuthError)
          : false

      if (responseStatus === 401 || isAuthError) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        navigate('/auth/login', { state: { redirect: `/product/${product.partId}` } })
        return
      }

      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error && (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : typeof error === 'object' && error !== null && 'userMessage' in error
            ? String((error as { userMessage?: string }).userMessage)
            : error instanceof Error
              ? error.message
              : 'Có lỗi khi tạo đơn hàng'

      if (errorMessage.includes('Không đủ hàng') ||
          errorMessage.includes('không đủ stock') ||
          errorMessage.includes('hết hàng')) {
        toast.error('Sản phẩm đã hết hàng. Vui lòng chọn chi nhánh khác hoặc thử lại sau.')
        return
      }

      toast.error(errorMessage)
    }
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
    } catch {
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
        <div className="breadcrumb">
          <button onClick={() => navigate('/products')} className="breadcrumb-link">
            Sản phẩm
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.partName}</span>
        </div>

        <div className="product-main">
          <div className="product-gallery">
            <div className="main-image">
              <img
                src={product.images?.[selectedImage] || ''}
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
            </div>

            <div className="product-availability">
              <div className="availability-header">
                <label htmlFor="center-select" className="availability-label">
                  Xem chi nhánh còn hàng:
                </label>
                <select
                  id="center-select"
                  className="center-select"
                  value={selectedCenterId ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedCenterId(value ? Number(value) : null)
                  }}
                  disabled={loadingCenters || availableCenters.length === 0}
                >
                  {availableCenters.length === 0 ? (
                    <option value="">Không có chi nhánh còn hàng</option>
                  ) : (
                    availableCenters.map((center) => (
                      <option key={center.centerId} value={center.centerId}>
                        {center.centerName}
                      </option>
                    ))
                  )}
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
                    const hasLoaded = inventoryByCenter.has(selectedCenterId)
                    const hasPart = inventoryPart !== null && inventoryPart !== undefined
                    const stock = inventoryPart?.currentStock ?? 0
                    const isLowStock = inventoryPart?.isLowStock ?? false
                    const isOutOfStock = inventoryPart?.isOutOfStock === true || (hasPart && stock === 0)
                    const selectedCenter = centers.find(c => c.centerId === selectedCenterId)

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
                  <p>
                    {availableCenters.length === 0
                      ? 'Sản phẩm hiện không còn hàng tại bất kỳ chi nhánh nào.'
                      : 'Vui lòng chọn chi nhánh để xem tồn kho'}
                  </p>
                </div>
              )}
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <label>Số lượng:</label>
                <div className="quantity-controls">
                  {(() => {
                    let isDisabled = availableCenters.length === 0
                    if (!isDisabled) {
                      if (selectedCenterId) {
                        const inventoryPart = inventoryByCenter.get(selectedCenterId)
                        const stock = inventoryPart?.currentStock ?? 0
                        const isOutOfStock = inventoryPart?.isOutOfStock === true || stock === 0
                        isDisabled = isOutOfStock
                      } else {
                        isDisabled = true
                      }
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
                  let isDisabled = availableCenters.length === 0
                  if (!isDisabled) {
                    if (selectedCenterId) {
                      const inventoryPart = inventoryByCenter.get(selectedCenterId)
                      const stock = inventoryPart?.currentStock ?? 0
                      const isOutOfStock = inventoryPart?.isOutOfStock === true || stock === 0
                      isDisabled = isOutOfStock
                    } else {
                      isDisabled = true
                    }
                  }

                  return (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleAddToCart()}
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
                      src={relatedProduct.images?.[0] || ''}
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

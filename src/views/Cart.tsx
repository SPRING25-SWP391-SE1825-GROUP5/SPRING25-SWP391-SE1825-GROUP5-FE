import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { removeFromCart, updateQuantity, clearCart, setCartItems, setCartId } from '@/store/cartSlice'
import { CartService, CustomerService, OrderService } from '@/services'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  TagIcon,
  TruckIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import './cart.scss'

export default function Cart() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cart = useAppSelector((state) => state.cart)
  const auth = useAppSelector((state) => state.auth)

  // Selection state: which cart item ids are selected for checkout
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    try {
      if (typeof localStorage !== 'undefined' && auth.user?.id) {
        const key = `cartSelectedIds_${auth.user.id}`
        const raw = localStorage.getItem(key)
        if (raw) {
          const arr: string[] = JSON.parse(raw)
          if (Array.isArray(arr)) return new Set(arr)
        }
      }
    } catch {}
    return new Set<string>()
  })

  // Ensure selection remains valid when cart items change
  useEffect(() => {
    const currentIds = new Set(cart.items.map(it => String(it.id)))
    const intersect = new Set<string>()
    selectedIds.forEach(id => { if (currentIds.has(id)) intersect.add(id) })
    // If nothing selected, default to select all for good UX
    const next = intersect.size === 0 && cart.items.length > 0 ? new Set(cart.items.map(it => String(it.id))) : intersect
    setSelectedIds(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items.length])

  // Persist selection (user-specific)
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined' && auth.user?.id) {
        const key = `cartSelectedIds_${auth.user.id}`
        localStorage.setItem(key, JSON.stringify(Array.from(selectedIds)))
      } else if (typeof localStorage !== 'undefined') {
        // Guest user - use generic key
        localStorage.setItem('cartSelectedIds_guest', JSON.stringify(Array.from(selectedIds)))
      }
    } catch {}
  }, [selectedIds, auth.user?.id])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart({ id, userId: auth.user?.id ?? null }))
    } else {
      dispatch(updateQuantity({ id, quantity: newQuantity, userId: auth.user?.id ?? null }))
    }
  }

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart({ id, userId: auth.user?.id ?? null }))
  }

  const handleClearCart = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      dispatch(clearCart({ userId: auth.user?.id ?? null }))
    }
  }

  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

  const handleConfirm = async () => {
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm để thanh toán')
      return
    }

    // Kiểm tra user đã đăng nhập chưa
    if (!auth.user || !auth.token) {
      toast.error('Vui lòng đăng nhập để tiếp tục')
      navigate('/auth/login', { state: { redirect: '/cart' } })
      return
    }

    try {
      setIsCreatingOrder(true)

      // Get customerId from user or fetch from API
      let customerId = auth.user.customerId
      if (!customerId) {
        try {
          const me = await CustomerService.getCurrentCustomer()
          if (me?.success && me?.data?.customerId) {
            customerId = me.data.customerId
          } else {
            toast.error('Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.')
            navigate('/auth/login', { state: { redirect: '/cart' } })
            return
          }
        } catch (customerError: any) {
          console.error('Error fetching customer:', customerError)
          // Nếu lỗi 401, user đã bị logout bởi interceptor
          if (customerError?.response?.status === 401 || customerError?.isAuthError) {
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
            navigate('/auth/login', { state: { redirect: '/cart' } })
            return
          }
          toast.error('Không thể lấy thông tin khách hàng. Vui lòng thử lại.')
          return
        }
      }

      // Map selected items to API format
      const orderItems = selectedItems.map(item => ({
        partId: Number(item.id),
        quantity: item.quantity
      }))

      // Call API to create order
      const response = await OrderService.createOrder(Number(customerId), {
        items: orderItems
      })

      if (response.success) {
        const orderId = response.data?.orderId ?? response.data?.OrderId ?? response.data?.id
        if (orderId) {
          // Lưu selectedIds vào sessionStorage để xóa khỏi cart sau khi thanh toán thành công
          const orderIdStr = String(orderId)
          sessionStorage.setItem(`orderSelectedIds_${orderIdStr}`, JSON.stringify(Array.from(selectedIds)))
          
          toast.success('Tạo đơn hàng thành công')
          // Navigate to order confirmation page
          navigate(`/confirm-order/${orderId}`, { state: { orderId: Number(orderId) } })
        } else {
          toast.error('Không thể lấy mã đơn hàng từ phản hồi')
        }
      } else {
        toast.error(response.message || 'Không thể tạo đơn hàng')
      }
    } catch (error: any) {
      console.error('Error creating order:', error)
      
      // Xử lý lỗi authentication
      if (error?.response?.status === 401 || error?.isAuthError) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        navigate('/auth/login', { state: { redirect: '/cart' } })
        return
      }
      
      // Xử lý các lỗi khác
      const errorMessage = error?.response?.data?.message || error?.userMessage || error?.message || 'Có lỗi khi tạo đơn hàng'
      toast.error(errorMessage)
    } finally {
      setIsCreatingOrder(false)
    }
  }

  // Items selected for checkout
  const selectedItems = useMemo(() => cart.items.filter(it => selectedIds.has(String(it.id))), [cart.items, selectedIds])
  const selectedCount = useMemo(() => selectedItems.reduce((sum, it) => sum + it.quantity, 0), [selectedItems])
  const selectedTotal = useMemo(() => selectedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0), [selectedItems])
  const finalTotal = selectedTotal

  // Load cart from backend for current customer
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const user = auth.user
        const userId = user?.id
        const cartIdKey = userId ? `cartId_${userId}` : 'cartId_guest'
        const storedId = (typeof localStorage !== 'undefined' && localStorage.getItem(cartIdKey)) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(cartIdKey))
        let cartId = storedId ? Number(storedId) : undefined

        if (!cartId && user?.customerId) {
          const resp = await CartService.getCartByCustomer(Number(user.customerId))
          const id = (resp?.data as any)?.cartId
          if (id) {
            cartId = Number(id)
            dispatch(setCartId({ cartId, userId: user?.id ?? null }))
          }
        }

        if (cartId) {
          const itemsResp = await CartService.getCartItems(cartId)
          const mapped = (itemsResp?.data || []).map((it: any) => ({
            id: String(it.partId ?? it.id ?? it.part?.partId),
            name: it.partName ?? it.name ?? it.part?.partName ?? 'Sản phẩm',
            price: it.unitPrice ?? it.price ?? it.part?.unitPrice ?? 0,
            image: it.imageUrl ?? it.image ?? it.part?.imageUrl ?? '',
            brand: it.brand ?? it.part?.brand ?? '',
            quantity: it.quantity ?? 1,
            category: it.category ?? '',
            inStock: true,
          }))
          if (Array.isArray(mapped) && mapped.length > 0) {
            dispatch(setCartItems({ items: mapped, userId: user?.id ?? null }))
          }
        }
      } catch (_) {
        // ignore silently
      }
    }
    fetchCart()
  }, [auth.user?.customerId, dispatch])

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingBagIcon className="w-24 h-24" />
            </div>
            <h1>Giỏ hàng của bạn hiện đang trống</h1>
            <button 
              className="continue-shopping-btn"
              onClick={() => navigate('/products')}
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        {/* Page Header (removed back and title as requested) */}
        <div className="page-header" />

        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items">
            <div className="cart-header">
              <h2>Giỏ hàng của bạn</h2>
              <button 
                className="clear-cart-btn"
                onClick={handleClearCart}
              >
                Xóa tất cả
              </button>
            </div>

            {/* Select-all row: first line in the items section, below header divider */}
            <div className="select-all-row">
              <input
                type="checkbox"
                className="select-all-checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === cart.items.length}
                onChange={(e) => {
                  if (e.currentTarget.checked) {
                    setSelectedIds(new Set(cart.items.map(it => String(it.id))))
                  } else {
                    setSelectedIds(new Set())
                  }
                }}
                aria-label="Chọn tất cả"
              />
              <span className="select-all-summary">Đã chọn {selectedItems.length} • {formatPrice(finalTotal)}</span>
            </div>

            <div className="items-list">
              {cart.items.map(item => (
                <div key={item.id} className="cart-card">
                  <div className="item-image">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/120x120/f5f5f5/666?text=Product'
                      }}
                    />
                  </div>

                  <div className="item-content">
                    <div className="item-info">
                      <h3 className="item-name">{item.name}</h3>
                      <div className="item-brand">{item.brand}</div>
                      <div className="item-category">{item.category}</div>
                    </div>

                    <div className="item-price">
                      <span className="current-price">{formatPrice(item.price)}</span>
                      {item.originalPrice && (
                        <span className="original-price">{formatPrice(item.originalPrice)}</span>
                      )}
                    </div>

                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(String(item.id), item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(String(item.id), item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      {formatPrice(item.price * item.quantity)}
                    </div>

                    <div className="item-actions-right">
                      <input
                        type="checkbox"
                        className="item-select-checkbox"
                        checked={selectedIds.has(String(item.id))}
                        onChange={(e) => {
                          const next = new Set(selectedIds)
                          const key = String(item.id)
                          if (e.currentTarget.checked) next.add(key)
                          else next.delete(key)
                          setSelectedIds(next)
                        }}
                        aria-label={`Chọn ${item.name}`}
                      />
                      <button 
                        className="remove-btn"
                        onClick={() => handleRemoveItem(String(item.id))}
                        title="Xóa sản phẩm"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline select at far right with trash icon */}
                  
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <div className="summary-card">
              <h3>Tóm tắt đơn hàng</h3>
              
              <div className="summary-row">
                <span>Tạm tính (đã chọn {selectedCount} sản phẩm)</span>
                <span>{formatPrice(selectedTotal)}</span>
              </div>
              
              {/* Bỏ mục phí vận chuyển theo yêu cầu */}

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span>Tổng cộng</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>

              <div className="promo-section">
                <div className="promo-input">
                  <TagIcon className="w-5 h-5 promo-icon" />
                  <input 
                    type="text" 
                    placeholder="Mã giảm giá"
                    className="promo-code"
                  />
                  <button className="apply-promo-btn">Áp dụng</button>
                </div>
              </div>

              <div className="checkout-actions">
                <button 
                  className="checkout-btn"
                  onClick={handleConfirm}
                  disabled={selectedItems.length === 0 || isCreatingOrder}
                >
                  {isCreatingOrder ? 'Đang tạo đơn hàng...' : 'Xác nhận'}
                </button>
                <button 
                  className="continue-shopping-btn"
                  onClick={() => navigate('/products')}
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

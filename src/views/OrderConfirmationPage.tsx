import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { OrderService, CenterService, InventoryService } from '@/services'
import type { Center } from '@/services/centerService'
import type { InventoryPart } from '@/services/inventoryService'
import { BuildingStorefrontIcon, MapPinIcon } from '@heroicons/react/24/outline'
import './order-confirmation.scss'
import toast from 'react-hot-toast'

type OrderDetail = {
  orderId: number
  items: Array<{
    productId?: number
    partId?: number
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  discount?: number
  total: number
  couponCode?: string | null
}

export default function OrderConfirmationPage() {
  const location = useLocation() as { state?: { orderId?: number } }
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [discount, setDiscount] = useState<number>(0)
  const [centers, setCenters] = useState<Center[]>([])
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null)
  const [orderFulfillmentCenterId, setOrderFulfillmentCenterId] = useState<number | null>(null)
  const [inventoryByCenter, setInventoryByCenter] = useState<Map<number, Map<number, InventoryPart | null>>>(new Map())
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [loadingInventory, setLoadingInventory] = useState(false)

  useEffect(() => {
    const load = async () => {
      const idFromState = location?.state?.orderId
      const idFromSession = sessionStorage.getItem('currentOrderId')
      const resolvedId = Number(idFromState ?? idFromSession)
      if (!resolvedId || Number.isNaN(resolvedId)) {
        toast.error('Không xác định được đơn hàng')
        navigate('/')
        return
      }
      sessionStorage.setItem('currentOrderId', String(resolvedId))
      try {
        setLoading(true)
        const [detailResp, itemsResp] = await Promise.all([
          OrderService.getOrderById(resolvedId),
          OrderService.getOrderItems(resolvedId),
        ])


        if (!detailResp?.success) {
          toast.error(detailResp?.message || 'Không thể tải chi tiết đơn hàng')
          setLoading(false)
          return
        }

        const o = detailResp.data as any

        // Lấy FulfillmentCenterId từ order nếu có
        const fulfillmentCenterId = o.FulfillmentCenterId ?? o.fulfillmentCenterId ?? o.FulfillmentCenterID ?? o.fulfillmentCenterID
        if (fulfillmentCenterId) {
          setOrderFulfillmentCenterId(Number(fulfillmentCenterId))
          setSelectedCenterId(Number(fulfillmentCenterId))
        }

        // Xử lý items: kiểm tra cả success và data structure
        let itemsRaw: any[] = []
        if (itemsResp?.success && Array.isArray(itemsResp?.data)) {
          itemsRaw = itemsResp.data
        } else if (Array.isArray(itemsResp)) {
          // Nếu response là array trực tiếp (không wrap trong {success, data})
          itemsRaw = itemsResp
        } else if (itemsResp?.data && Array.isArray(itemsResp.data)) {
          itemsRaw = itemsResp.data
        } else if (!itemsResp?.success) {
          // Nếu items API fail, thử dùng OrderItems từ detail response

          if (Array.isArray(o?.OrderItems)) {
            itemsRaw = o.OrderItems
          } else if (Array.isArray(o?.orderItems)) {
            itemsRaw = o.orderItems
          }
        }

        const items = itemsRaw.map((it: any) => ({
          productId: it.PartId ?? it.partId,
          partId: it.PartId ?? it.partId,
          name: it.PartName ?? it.partName ?? it.name ?? 'Sản phẩm không xác định',
          quantity: it.Quantity ?? it.quantity ?? 1,
          unitPrice: Number(it.UnitPrice ?? it.unitPrice ?? 0),
          totalPrice: Number(it.Subtotal ?? it.subtotal ?? it.LineTotal ?? it.lineTotal ?? 0),
        }))

        const subtotal = items.reduce((s, it) => s + (it.totalPrice || 0), 0)
        const mapped: OrderDetail = {
          orderId: o.OrderId ?? o.orderId ?? o.Id ?? resolvedId,
          items,
          subtotal,
          discount: 0,
          total: Number(o.TotalAmount ?? o.totalAmount ?? subtotal),
          couponCode: o.CouponCode ?? o.couponCode ?? null,
        }

        setOrder(mapped)
        setDiscount(Number(o.DiscountAmount ?? o.discountAmount ?? 0))
      } catch (e: any) {
        toast.error(e?.userMessage || e?.message || 'Lỗi tải chi tiết đơn hàng')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [location?.state?.orderId, navigate])

  // Load centers
  useEffect(() => {
    const loadCenters = async () => {
      try {
        setLoadingCenters(true)
        const centersResponse = await CenterService.getActiveCenters({ pageSize: 100 })
        const centersList = centersResponse.centers || []
        setCenters(centersList)
      } catch (error) {
        console.error('OrderConfirmationPage - Error loading centers:', error)
        setCenters([])
      } finally {
        setLoadingCenters(false)
      }
    }

    loadCenters()
  }, [])

  // Load inventory for all centers and all parts in order
  useEffect(() => {
    const loadAllInventories = async () => {
      if (!order || order.items.length === 0 || centers.length === 0) {
        return
      }

      try {
        setLoadingInventory(true)
        console.log(`[OrderConfirmation] Loading inventory for ${centers.length} centers and ${order.items.length} parts...`)

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

                // Tìm tất cả parts trong order
                order.items.forEach(item => {
                  const partId = item.partId
                  if (partId) {
                    const partInInventory = partsArray.find(
                      (p: InventoryPart) => p.partId === partId
                    ) || null
                    centerPartsMap.set(partId, partInInventory)
                  }
                })

                inventoryMap.set(center.centerId, centerPartsMap)
              } else {
                // Nếu không load được, set empty map
                inventoryMap.set(center.centerId, new Map())
              }
            } catch (error: any) {
              console.error(`[OrderConfirmation] Error loading inventory for center ${center.centerId}:`, error)
              inventoryMap.set(center.centerId, new Map())
            }
          })
        )

        setInventoryByCenter(inventoryMap)

        // Tính toán center có stock cao nhất và đủ hàng cho tất cả parts
        let bestCenterId: number | null = null
        let maxTotalStock = -1

        inventoryMap.forEach((centerPartsMap, centerId) => {
          // Kiểm tra xem center có đủ stock cho TẤT CẢ parts không
          let hasAllParts = true
          let totalStock = 0

          for (const item of order.items) {
            const partId = item.partId
            if (!partId) continue

            const inventoryPart = centerPartsMap.get(partId)
            const stock = inventoryPart?.currentStock ?? 0
            const isOutOfStock = inventoryPart?.isOutOfStock === true || stock === 0

            // Kiểm tra xem có đủ stock cho quantity yêu cầu không
            if (isOutOfStock || stock < item.quantity) {
              hasAllParts = false
              break
            }

            totalStock += stock
          }

          // Chỉ xét center có đủ hàng cho tất cả parts
          if (hasAllParts && totalStock > maxTotalStock) {
            maxTotalStock = totalStock
            bestCenterId = centerId
          }
        })

        // Chỉ set mặc định nếu có center đủ hàng
        if (bestCenterId !== null && !selectedCenterId) {
          console.log(`[OrderConfirmation] Setting default center to ${bestCenterId} (total stock: ${maxTotalStock})`)
          setSelectedCenterId(bestCenterId)
        } else if (bestCenterId === null) {
          console.log(`[OrderConfirmation] No center has enough stock for all parts`)
          // Không set selectedCenterId nếu không có center nào đủ hàng
        }
      } catch (error: any) {
        console.error('[OrderConfirmation] Error loading all inventories:', error)
      } finally {
        setLoadingInventory(false)
      }
    }

    if (order && order.items.length > 0 && centers.length > 0) {
      loadAllInventories()
    }
  }, [order, centers.length])

  // Helper function: Kiểm tra center có đủ hàng cho tất cả parts không
  const isCenterAvailable = (centerId: number): boolean => {
    if (!order || order.items.length === 0) return false

    const centerPartsMap = inventoryByCenter.get(centerId)
    if (!centerPartsMap) return false

    for (const item of order.items) {
      const partId = item.partId
      if (!partId) continue

      const inventoryPart = centerPartsMap.get(partId)
      const stock = inventoryPart?.currentStock ?? 0
      const isOutOfStock = inventoryPart?.isOutOfStock === true || stock === 0

      // Kiểm tra xem có đủ stock cho quantity yêu cầu không
      if (isOutOfStock || stock < item.quantity) {
        return false
      }
    }

    return true
  }

  // Helper function: Lấy tồn kho của part tại center
  const getPartStockAtCenter = (centerId: number, partId: number): number => {
    const centerPartsMap = inventoryByCenter.get(centerId)
    if (!centerPartsMap) return 0

    const inventoryPart = centerPartsMap.get(partId)
    return inventoryPart?.currentStock ?? 0
  }

  // Kiểm tra xem có center nào còn hàng không
  const hasAvailableCenter = (): boolean => {
    return centers.some(center => isCenterAvailable(center.centerId))
  }

  const goToPayment = async () => {
    const id = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
    if (!id) {
      toast.error('Không xác định được đơn hàng')
      return
    }

    // Validate: Phải chọn center trước khi thanh toán
    if (!selectedCenterId) {
      toast.error('Vui lòng chọn chi nhánh để tiếp tục thanh toán')
      return
    }

    // Kiểm tra xem chi nhánh đã chọn có đủ hàng không
    if (!isCenterAvailable(selectedCenterId)) {
      toast.error('Chi nhánh đã chọn không còn đủ hàng. Vui lòng chọn chi nhánh khác.')
      return
    }

    try {
      // Cập nhật order với fulfillmentCenterId trước khi thanh toán
      console.log(`[OrderConfirmation] Updating order ${id} with fulfillmentCenterId ${selectedCenterId}`)
      const updateResp = await OrderService.updateFulfillmentCenter(Number(id), selectedCenterId)

      if (!updateResp?.success) {
        const errorMsg = updateResp?.message || 'Không thể cập nhật chi nhánh cho đơn hàng'
        console.error('OrderConfirmationPage - Failed to update fulfillment center:', { id, selectedCenterId, updateResp })
        toast.error(errorMsg)
        return
      }

      console.log('OrderConfirmationPage - Fulfillment center updated successfully')

      // Ưu tiên dùng checkoutUrl đã cache trong session để đi nhanh
      const cached = sessionStorage.getItem(`checkoutUrl_${id}`)
      if (cached) {
        window.location.href = cached
        return
      }

      // Gọi tạo link thanh toán PayOS
      const createResp = await OrderService.checkoutOnline(Number(id))
      console.log('OrderConfirmationPage - checkoutOnline response:', createResp)

      let checkoutUrl = createResp?.checkoutUrl

      // Nếu BE trả báo đã tồn tại/không có link, thử lấy link hiện có
      if (!checkoutUrl) {
        const linkResp = await OrderService.getPaymentLink(Number(id))
        console.log('OrderConfirmationPage - getPaymentLink response:', linkResp)
        checkoutUrl = linkResp?.checkoutUrl
      }

      if (checkoutUrl) {
        sessionStorage.setItem(`checkoutUrl_${id}`, checkoutUrl)
        window.location.href = checkoutUrl
        return
      }

      const errorMsg = createResp?.message || 'Không lấy được link thanh toán'
      console.error('OrderConfirmationPage - Failed to get checkout URL:', { id, createResp })
      toast.error(errorMsg)
    } catch (e: any) {
      console.error('OrderConfirmationPage - Error in goToPayment:', e)
      const errorMsg = e?.response?.data?.message || e?.userMessage || e?.message || 'Lỗi chuyển hướng thanh toán'
      toast.error(errorMsg)
    }
  }

  // Luôn render layout cố định để tránh layout shift khi reload
  return (
    <div className="container confirm-order-page">
      <div className="page-title">Xác nhận đơn hàng</div>

      {loading ? (
        <div className="section section--spaced">
          <div className="section-title section-title--main">Chi tiết đơn hàng</div>
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p>Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      ) : !order ? (
        <div className="section section--spaced">
          <div className="section-title section-title--main">Chi tiết đơn hàng</div>
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p>Không tìm thấy đơn hàng.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="section section--spaced">
            <div className="section-title section-title--main">Chi tiết đơn hàng</div>
        {order.items && order.items.length > 0 ? (
          <div className="items-list">
            {order.items.map((it, idx) => (
              <div key={idx} className="item-row">
                <div>
                  <div className="item-name">{it.name}</div>
                  <div className="item-meta">Số lượng: {it.quantity}</div>
                </div>
              <div className="text-right">
                  <div className="item-meta">Đơn giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(it.unitPrice)}</div>
                  <div className="price-text">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(it.totalPrice)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="item-meta" style={{ padding: '8px 0' }}>Chưa có sản phẩm trong đơn hàng</div>
        )}

          </div>

          {/* Center Selection */}
          {order.items && order.items.length > 0 && (
            <div className="section section--spaced">
              <div className="section-title">
                {orderFulfillmentCenterId ? 'Chi nhánh mua hàng' : 'Chọn chi nhánh mua hàng'}
              </div>
              {orderFulfillmentCenterId && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#0369a1'
                }}>
                  Chi nhánh đã được chọn ở trang chi tiết sản phẩm và không thể thay đổi.
                </div>
              )}
              {loadingCenters || loadingInventory ? (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <p>Đang tải thông tin chi nhánh...</p>
                </div>
              ) : centers.length > 0 ? (
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="center-select-confirm" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    Chi nhánh:
                  </label>
                  <select
                    id="center-select-confirm"
                    value={selectedCenterId || ''}
                    onChange={(e) => {
                      if (orderFulfillmentCenterId) return
                      const value = e.target.value
                      if (value) {
                        const centerId = Number(value)
                        // Chỉ cho phép chọn center có đủ hàng
                        if (isCenterAvailable(centerId)) {
                          setSelectedCenterId(centerId)
                        } else {
                          toast.error('Chi nhánh này không còn đủ hàng')
                        }
                      } else {
                        setSelectedCenterId(null)
                      }
                    }}
                    disabled={!!orderFulfillmentCenterId}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: orderFulfillmentCenterId ? '#f5f5f5' : '#fff',
                      cursor: orderFulfillmentCenterId ? 'not-allowed' : 'pointer',
                      opacity: orderFulfillmentCenterId ? 0.7 : 1
                    }}
                  >
                    {!selectedCenterId && (
                      <option value="">-- Chọn chi nhánh --</option>
                    )}
                    {centers.map((center) => {
                      const isAvailable = isCenterAvailable(center.centerId)
                      return (
                        <option
                          key={center.centerId}
                          value={center.centerId}
                          disabled={!isAvailable}
                          style={{
                            color: isAvailable ? '#000' : '#999',
                            backgroundColor: isAvailable ? '#fff' : '#f5f5f5'
                          }}
                        >
                          {center.centerName}
                          {!isAvailable ? ' (Hết hàng)' : ''}
                        </option>
                      )
                    })}
                  </select>

                  {/* Hiển thị tồn kho cho từng part */}
                  {selectedCenterId && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 600, marginBottom: '8px' }}>Tồn kho tại chi nhánh:</div>
                      {order.items.map((item, idx) => {
                        const partId = item.partId
                        if (!partId) return null

                        const stock = getPartStockAtCenter(selectedCenterId, partId)
                        const isOutOfStock = stock === 0
                        const hasEnoughStock = stock >= item.quantity

                        return (
                          <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            borderBottom: idx < order.items.length - 1 ? '1px solid #eee' : 'none'
                          }}>
                            <span style={{ fontSize: '14px' }}>{item.name}:</span>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: hasEnoughStock ? '#155724' : isOutOfStock ? '#721c24' : '#856404'
                            }}>
                              {stock.toLocaleString('vi-VN')} sản phẩm
                              {!hasEnoughStock && (
                                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#721c24' }}>
                                  (Cần: {item.quantity})
                                </span>
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <p>Không có chi nhánh nào</p>
                </div>
              )}
            </div>
          )}

          <div className="section section--spaced">
            <div className="section-title">Tổng kết</div>
            <div className="summary-row">
              <span>Tạm tính</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}</span>
            </div>
            <div className="summary-row" style={{ minHeight: '28px' }}>
              <span>Giảm giá</span>
              <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discount ?? discount ?? 0)}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Thành tiền</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}</span>
            </div>
          </div>

          <div className="actions">
            <button
              className="btn-primary"
              onClick={goToPayment}
              disabled={loading || !hasAvailableCenter() || !selectedCenterId || !isCenterAvailable(selectedCenterId)}
            >
              {!hasAvailableCenter()
                ? 'Không có chi nhánh nào còn hàng'
                : !selectedCenterId
                  ? 'Vui lòng chọn chi nhánh'
                  : !isCenterAvailable(selectedCenterId)
                    ? 'Chi nhánh đã chọn không còn đủ hàng'
                    : 'Xác nhận và tiếp tục thanh toán'
              }
            </button>
          </div>
        </>
      )}
    </div>
  )
}



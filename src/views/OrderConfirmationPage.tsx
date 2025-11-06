import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { OrderService, PromotionService, CustomerService } from '@/services'
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
  const { orderId: orderIdParam } = useParams()
  const location = useLocation() as { state?: { orderId?: number } }
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState<number>(0)
  const [savedPromos, setSavedPromos] = useState<Array<{ code?: string; description?: string; discountAmount?: number; status?: string }>>([])
  const [couponError, setCouponError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const idFromState = location?.state?.orderId
      const idFromSession = sessionStorage.getItem('currentOrderId')
      const resolvedId = Number(idFromState ?? orderIdParam ?? idFromSession)
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
  }, [orderIdParam, location?.state?.orderId])

  // Load saved promotions of current customer - Hiển thị các mã chưa sử dụng (SAVED và APPLIED)
  // Không hiển thị USED (đã sử dụng = đã thanh toán thành công)
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const me = await CustomerService.getCurrentCustomer()
        const cid = me?.data?.customerId
        if (!cid) return
        const promos = await PromotionService.getSavedPromotionsByCustomer(Number(cid))
        if (promos?.success && Array.isArray(promos?.data)) {
          // Hiển thị promotions có status = "SAVED" hoặc "APPLIED" (có thể sử dụng)
          // Không hiển thị "USED" (đã sử dụng)
          const availablePromos = promos.data.filter((p: any) => {
            const status = String(p.status || '').toUpperCase()
            return status === 'SAVED' || status === 'APPLIED' // Hiển thị các mã chưa sử dụng
          })
          setSavedPromos(availablePromos)
        }
      } catch {
        // ignore silently
      }
    }
    loadSaved()
  }, [])

  // Load applied coupon code từ sessionStorage khi reload
  useEffect(() => {
    const orderId = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
    if (orderId) {
      const savedCoupon = sessionStorage.getItem(`appliedCoupon_${orderId}`)
      if (savedCoupon) {
        setCouponCode(savedCoupon)
      }
    }
  }, [order])

  const applyCoupon = async () => {
    const id = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
    if (!id) return
    if (!couponCode.trim()) {
      const msg = 'Vui lòng nhập mã khuyến mãi'
      setCouponError(msg)
      toast.error(msg)
      return
    }
    try {
      setApplying(true)
      // Chỉ validate để không đánh dấu sử dụng trước thanh toán
      const resp = await PromotionService.validatePublic(couponCode.trim(), order?.subtotal ?? 0, 'ORDER')
      if (resp?.success && (resp?.data?.isValid ?? true)) {
        const discountAmount = Number(resp?.data?.discountAmount ?? 0)
        setDiscount(discountAmount)
        if (order) {
          const newTotal = Math.max(0, order.subtotal - discountAmount)
          setOrder({ ...order, discount: discountAmount, total: newTotal, couponCode: couponCode.trim() })
        }
        setCouponError(null)
        // Lưu mã vào sessionStorage để giữ khi reload trang
        const orderId = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
        if (orderId) {
          sessionStorage.setItem(`appliedCoupon_${orderId}`, couponCode.trim())
          sessionStorage.setItem('pendingCouponCode', couponCode.trim())
        }
        toast.success('Mã hợp lệ. Sẽ áp dụng khi thanh toán thành công')
      } else {
        const msg = resp?.message || 'Không thể áp dụng mã khuyến mãi'
        setCouponError(msg)
        toast.error(msg)
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.userMessage || e?.message || 'Lỗi áp dụng mã khuyến mãi'
      setCouponError(msg)
      toast.error(msg)
    } finally {
      setApplying(false)
    }
  }

  const goToPayment = async () => {
    const id = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
    if (!id) return

    try {
      // Ưu tiên dùng checkoutUrl đã cache trong session để đi nhanh
      const cached = sessionStorage.getItem(`checkoutUrl_${id}`)
      if (cached) {
        window.location.href = cached
        return
      }

      // Gọi tạo link thanh toán PayOS
      const createResp = await OrderService.checkoutOnline(Number(id))
      let checkoutUrl = (createResp as any)?.checkoutUrl

      // Nếu BE trả báo đã tồn tại/không có link, thử lấy link hiện có
      if (!checkoutUrl) {
        const linkResp = await OrderService.getPaymentLink(Number(id))
        checkoutUrl = (linkResp as any)?.checkoutUrl
      }

      if (checkoutUrl) {
        sessionStorage.setItem(`checkoutUrl_${id}`, checkoutUrl)
        window.location.href = checkoutUrl
        return
      }

      toast.error(createResp?.message || 'Không lấy được link thanh toán')
    } catch (e: any) {
      toast.error(e?.userMessage || e?.message || 'Lỗi chuyển hướng thanh toán')
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

            <div style={{ marginTop: 24 }}>
              <div className="section-title">Mã khuyến mãi</div>
              <div className="coupon-row">
                <input
                  className={`input${couponError ? ' input--error' : ''}`}
                  placeholder="Nhập mã khuyến mãi"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); if (couponError) setCouponError(null) }}
                />
                <button className="btn-primary" disabled={applying || loading} onClick={applyCoupon}>
                  {applying ? 'Đang áp dụng...' : 'Áp dụng'}
                </button>
              </div>
              {couponError && (
                <div className="item-meta" style={{ color: 'var(--error-600)', marginTop: 8, minHeight: '20px' }}>
                  {couponError}
                </div>
              )}
              {!couponError && <div style={{ minHeight: '20px', marginTop: 8 }}></div>}
              <div style={{ marginTop: 16 }}>
                <div className="item-meta" style={{ marginBottom: 8 }}>Mã đã lưu:</div>
                {savedPromos && savedPromos.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: '36px' }}>
                    {savedPromos.map((p, i) => (
                      <button
                        key={`${p.code}-${i}`}
                        className="btn-primary"
                        style={{ padding: '6px 12px', borderRadius: 9999, backgroundColor: 'var(--secondary-500)', borderColor: 'var(--secondary-500)', fontSize: '13px' }}
                        onClick={() => { setCouponCode(String(p.code || '')); setCouponError(null) }}
                        title={p.description || ''}
                      >
                        {p.code}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center' }}>
                    <span className="item-meta" style={{ color: 'var(--text-secondary)' }}>Chưa có mã khuyến mãi đã lưu</span>
                  </div>
                )}
              </div>
            </div>
          </div>

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
            <button className="btn-primary" onClick={goToPayment} disabled={loading}>
              Xác nhận và tiếp tục thanh toán
            </button>
          </div>
        </>
      )}
    </div>
  )
}



import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { OrderService } from '@/services'
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
      } catch (e: any) {
        toast.error(e?.userMessage || e?.message || 'Lỗi tải chi tiết đơn hàng')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [location?.state?.orderId, navigate])

  const goToPayment = async () => {
    const id = order?.orderId || Number(sessionStorage.getItem('currentOrderId'))
    if (!id) {
      toast.error('Không xác định được đơn hàng')
      return
    }

    try {

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


          <div className="section section--spaced">
            <div className="section-title">Tổng kết</div>
            <div className="summary-row">
              <span>Tạm tính</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}</span>
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
              disabled={loading}
            >
              Xác nhận và tiếp tục thanh toán
            </button>
          </div>
        </>
      )}
    </div>
  )
}



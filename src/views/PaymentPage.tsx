import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { OrderService, PromotionService, api } from '@/services'
import { PayOSService } from '@/services/payOSService'
import toast from 'react-hot-toast'
import './order-confirmation.scss'

type OrderDetail = {
  orderId: number
  orderNumber?: string
  customerName?: string
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
}

export default function PaymentPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    const load = async () => {
      const resolvedId = Number(orderId) || Number(sessionStorage.getItem('currentOrderId'))
      if (!resolvedId || Number.isNaN(resolvedId)) {
        toast.error('Không xác định được đơn hàng')
        navigate('/')
        return
      }

      try {
        setLoading(true)
        
        // KHÔNG apply coupon ở đây - chỉ hiển thị discount từ coupon đã validate
        // Coupon sẽ chỉ được apply khi thanh toán thành công (ở PaymentSuccess)
        // Điều này đảm bảo mã vẫn giữ nguyên trạng thái SAVED nếu chưa thanh toán
        
        // Load order (chưa apply coupon vào backend, chỉ validate ở frontend)
        const [detailResp, itemsResp] = await Promise.all([
          OrderService.getOrderById(resolvedId),
          OrderService.getOrderItems(resolvedId),
        ])
        
        if (!detailResp?.success) {
          toast.error(detailResp?.message || 'Không thể tải chi tiết đơn hàng')
          navigate('/confirm-order', { replace: true })
          return
        }
        
        const o = detailResp.data as any
        let itemsRaw: any[] = []
        if (itemsResp?.success && Array.isArray(itemsResp?.data)) {
          itemsRaw = itemsResp.data
        } else if (Array.isArray(o?.OrderItems)) {
          itemsRaw = o.OrderItems
        } else if (Array.isArray(o?.orderItems)) {
          itemsRaw = o.orderItems
        }
        
        const items = itemsRaw.map((it: any) => ({
          productId: it.PartId ?? it.partId,
          partId: it.PartId ?? it.partId,
          name: it.PartName ?? it.partName ?? it.name ?? 'Sản phẩm không xác định',
          quantity: it.Quantity ?? it.quantity ?? 1,
          unitPrice: Number(it.UnitPrice ?? it.unitPrice ?? 0),
          totalPrice: Number(it.Subtotal ?? it.subtotal ?? it.LineTotal ?? it.lineTotal ?? 0),
        }))
        
        // Tính subtotal từ items (tổng giá các sản phẩm)
        const subtotal = items.reduce((s, it) => s + (it.totalPrice || 0), 0)
        
        // Tính discount từ coupon đã validate ở OrderConfirmationPage (từ sessionStorage)
        // Nếu chưa có coupon apply trong backend, tính từ pendingCouponCode
        let appliedDiscount = 0
        const pendingCouponCode = sessionStorage.getItem('pendingCouponCode')
        
        // Thử lấy discount từ promotions đã apply trong backend (nếu có)
        try {
          const promoResp = await api.get(`/promotion/orders/${resolvedId}`)
          if (promoResp?.data?.success && Array.isArray(promoResp?.data?.data) && promoResp.data.data.length > 0) {
            appliedDiscount = promoResp.data.data.reduce((sum: number, p: any) => {
              return sum + (Number(p.discountAmount ?? p.DiscountAmount ?? 0))
            }, 0)

          }
        } catch (e) {
          ')
        }
        
        // Nếu không có discount từ backend và có pendingCouponCode, validate lại để tính discount
        if (appliedDiscount === 0 && pendingCouponCode) {
          try {
            // Validate coupon để lấy discount amount (không apply vào backend)
            const validateResp = await PromotionService.validatePublic(pendingCouponCode, subtotal, 'ORDER')
            if (validateResp?.success && validateResp?.data?.isValid) {
              appliedDiscount = Number(validateResp?.data?.discountAmount ?? 0)

            }
          } catch (e) {

          }
        }
        
        // Tính discount: dùng appliedDiscount đã tính ở trên (từ backend hoặc validate)
        // Nếu không có, lấy từ order (fallback)
        let discount = appliedDiscount > 0 ? appliedDiscount : Number(o.DiscountAmount ?? o.discountAmount ?? 0)

        // LUÔN tính total = subtotal - discount (không dùng TotalAmount từ API vì có thể không chính xác)
        const total = Math.max(0, subtotal - discount)

        const finalOrder = {
          orderId: o.OrderId ?? o.orderId ?? o.Id ?? resolvedId,
          orderNumber: o.OrderNumber ?? o.orderNumber,
          customerName: o.CustomerName ?? o.customerName,
          items,
          subtotal,
          discount,
          total,
        }

        setOrder(finalOrder)
        
        // Tự động tạo payment link/QR code với giá cuối cùng đã áp mã giảm giá
        await createPaymentLink(finalOrder.orderId, finalOrder.total)
      } catch (e: any) {
        toast.error(e?.userMessage || e?.message || 'Lỗi tải chi tiết đơn hàng')
        navigate('/confirm-order', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    
    const createPaymentLink = async (id: number, finalAmount: number) => {
      try {
        setProcessing(true)
        
        // Tạo checkout link với giá đã áp mã giảm giá
        const resp = await OrderService.checkoutOnline(id)
        if (resp?.success && resp?.checkoutUrl) {
          setCheckoutUrl(resp.checkoutUrl)
          
          // Thử lấy QR code từ PayOS
          try {
            const qrResp = await PayOSService.getPaymentQRCode(id)
            if (qrResp?.success && qrResp?.data?.qrCode) {
              setQrCode(qrResp.data.qrCode)
              setShowQR(true)
            } else {
              // Nếu không có QR code, vẫn hiển thị link
              setShowQR(true)
            }
          } catch (qrError) {

            // Vẫn có checkoutUrl, hiển thị link
            setShowQR(true)
          }
        } else {
          const msg = resp?.message || 'Không thể tạo link thanh toán'
          toast.error(msg)
        }
      } catch (e: any) {
        const errorMsg = e?.response?.data?.message || e?.message || ''
        if (errorMsg.includes('Đơn thanh toán đã tồn tại') || errorMsg.includes('231')) {
          // Thử lấy link hiện có
          try {
            const existingResp = await PayOSService.getExistingPaymentLink(id)
            if (existingResp?.success && existingResp?.data?.checkoutUrl) {
              setCheckoutUrl(existingResp.data.checkoutUrl)
              setShowQR(true)
              
              // Thử lấy QR code
              try {
                const qrResp = await PayOSService.getPaymentQRCode(id)
                if (qrResp?.success && qrResp?.data?.qrCode) {
                  setQrCode(qrResp.data.qrCode)
                }
              } catch {}
            }
          } catch {}
        } else {

        }
      } finally {
        setProcessing(false)
      }
    }
    
    load()
  }, [orderId, navigate])

  const handleRefreshPayment = async () => {
    if (!order) return
    
    try {
      setProcessing(true)
      setShowQR(false)
      setCheckoutUrl(null)
      setQrCode(null)
      
      // Tạo lại checkout link
      const resp = await OrderService.checkoutOnline(order.orderId)
      if (resp?.success && resp?.checkoutUrl) {
        setCheckoutUrl(resp.checkoutUrl)
        
        // Thử lấy QR code
        try {
          const qrResp = await PayOSService.getPaymentQRCode(order.orderId)
          if (qrResp?.success && qrResp?.data?.qrCode) {
            setQrCode(qrResp.data.qrCode)
          }
        } catch (qrError) {

        }
        setShowQR(true)
      } else {
        const msg = resp?.message || 'Không thể tạo link thanh toán'
        toast.error(msg)
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || ''
      toast.error(errorMsg || 'Lỗi tạo lại link thanh toán')
    } finally {
      setProcessing(false)
    }
  }

  const handleOpenLink = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    }
  }

  if (loading) {
    return (
      <div className="container confirm-order-page">
        <div className="page-title">Thanh toán đơn hàng</div>
        <div className="section">
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container confirm-order-page">
        <div className="page-title">Thanh toán đơn hàng</div>
        <div className="section">
          <p>Không tìm thấy đơn hàng.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container confirm-order-page">
      <div className="page-title">Thanh toán đơn hàng</div>

      <div className="section section--spaced">
        <div className="section-title section-title--main">Thông tin đơn hàng</div>
        {order.orderNumber && (
          <div className="item-meta" style={{ marginBottom: 12 }}>
            Mã đơn hàng: <strong>{order.orderNumber}</strong>
          </div>
        )}
        {order.customerName && (
          <div className="item-meta" style={{ marginBottom: 12 }}>
            Khách hàng: <strong>{order.customerName}</strong>
          </div>
        )}
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
        <div className="section-title">Tổng kết thanh toán</div>
        <div className="summary-row">
          <span>Tạm tính</span>
          <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}</span>
        </div>
        {order.discount && order.discount > 0 && (
          <div className="summary-row">
            <span>Giảm giá</span>
            <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discount)}</span>
          </div>
        )}
        <div className="summary-row summary-total">
          <span>Thành tiền</span>
          <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(0, order.subtotal - (order.discount ?? 0)))}</span>
        </div>
      </div>

      <div className="section section--spaced">
        <div className="section-title">Thanh toán</div>
        {processing ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="loading-spinner" style={{ margin: '20px auto', width: '48px', height: '48px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Đang tạo link thanh toán...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : showQR && (qrCode || checkoutUrl) ? (
          <>
            {qrCode && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '14px' }}>Quét mã QR để thanh toán</p>
                <div style={{ display: 'inline-block', padding: '16px', backgroundColor: 'white', border: '1px solid var(--border-primary)', borderRadius: 12 }}>
                  <img 
                    src={qrCode} 
                    alt="QR Code thanh toán" 
                    style={{ maxWidth: '250px', width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>
            )}
            {checkoutUrl && (
              <div className="actions" style={{ justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button 
                  className="btn-primary" 
                  onClick={handleOpenLink}
                  style={{ minWidth: '160px' }}
                >
                  Mở link thanh toán
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={handleRefreshPayment}
                  disabled={processing}
                  style={{ minWidth: '160px', backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                >
                  Tạo lại link
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Chưa có thông tin thanh toán</p>
            <button 
              className="btn-primary" 
              onClick={handleRefreshPayment}
              disabled={processing}
            >
              {processing ? 'Đang xử lý...' : 'Tạo link thanh toán'}
            </button>
          </div>
        )}
      </div>

      <div className="actions" style={{ marginTop: 16 }}>
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/confirm-order')}
          disabled={processing}
          style={{ backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
        >
          Quay lại
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { CustomerService } from '@/services/customerService'
import { OrderService } from '@/services/orderService'

interface OrderItem {
  orderId: number
  orderNumber?: string
  totalAmount?: number
  status?: string
  createdAt?: string
}

export default function OrderHistory() {
  const user = useAppSelector((s) => s.auth.user)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 5
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const [orderItemsById, setOrderItemsById] = useState<Record<number, any[]>>({})
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!user?.id) {
          setOrders([])
          setLoading(false)
          return
        }

        // Lấy customerId hiện tại
        let customerId = user.customerId
        if (!customerId) {
          const res = await CustomerService.getCurrentCustomer()
          if (res.success && res.data?.customerId) {
            customerId = res.data.customerId
          }
        }
        if (!customerId) {
          setOrders([])
          setLoading(false)
          return
        }

        const resp = await OrderService.getByCustomerId(customerId)
        const arr: OrderItem[] = Array.isArray(resp?.data) ? resp.data : []
        // Sắp xếp mới nhất trước (theo createdAt nếu có, fallback orderId)
        arr.sort((a, b) => {
          const ad = new Date(a.createdAt || 0).getTime()
          const bd = new Date(b.createdAt || 0).getTime()
          if (ad === bd) return (b.orderId || 0) - (a.orderId || 0)
          return bd - ad
        })
        setOrders(arr)
      } catch (e: any) {
        setError(e?.message || 'Không thể tải lịch sử mua hàng')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  if (loading) {
    return (
      <div className="profile-v2__empty">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>Đang tải...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-v2__empty">
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#DC2626' }}>{error}</div>
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className="profile-v2__empty">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>Bạn chưa có lịch sử mua hàng.</div>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize))
  const start = (page - 1) * pageSize
  const items = orders.slice(start, start + pageSize)

  const toggleExpand = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
      return
    }
    setExpandedOrderId(orderId)
    if (!orderItemsById[orderId]) {
      try {
        setLoadingDetailsId(orderId)
        const resp = await OrderService.getOrderItems(orderId)
        const arr = Array.isArray(resp?.data) ? resp.data : []
        setOrderItemsById(prev => ({ ...prev, [orderId]: arr }))
      } finally {
        setLoadingDetailsId(null)
      }
    }
  }

  const getStatusInfo = (status?: string) => {
    const key = String(status || '').toUpperCase()
    switch (key) {
      case 'PENDING':
        return { label: 'Chờ xử lý', bg: '#FEF3C7', text: '#92400E' }
      case 'PROCESSING':
      case 'CONFIRMED':
        return { label: 'Đang xử lý', bg: '#DBEAFE', text: '#1E3A8A' }
      case 'PAID':
      case 'COMPLETED':
        return { label: 'Đã thanh toán', bg: '#DCFCE7', text: '#166534' }
      case 'CANCELLED':
      case 'CANCELED':
        return { label: 'Đã hủy', bg: '#FEE2E2', text: '#991B1B' }
      case 'FAILED':
        return { label: 'Thất bại', bg: '#FEE2E2', text: '#991B1B' }
      case 'REFUNDED':
        return { label: 'Đã hoàn tiền', bg: '#E0E7FF', text: '#3730A3' }
      default:
        return { label: 'Không xác định', bg: '#F3F4F6', text: '#374151' }
    }
  }

  return (
    <div>
      <div className="card-header" style={{ padding: '0 0 8px' }}>
        <h3 className="card-title" style={{ color: '#111827', fontWeight: 400 }}>Lịch sử mua hàng</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((o) => {
          const isOpen = expandedOrderId === o.orderId
          const detailItems = orderItemsById[o.orderId] || []
          return (
            <div key={o.orderId} style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <button
                type="button"
                onClick={() => toggleExpand(o.orderId)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 16,
                  background: isOpen ? '#FFFBEB' : '#fff',
                  border: 'none',
                  borderBottom: isOpen ? '1px solid #f1f5f9' : 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontWeight: 400 }}>Đơn hàng #{o.orderNumber || o.orderId}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {(() => { const s = getStatusInfo(o.status); return (
                      <span style={{ background: s.bg, color: s.text, padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>{s.label}</span>
                    )})()}
                    <div style={{ color: '#111827' }}>Tổng: <span style={{ fontWeight: 500 }}>{(o.totalAmount || 0).toLocaleString('vi-VN')} VNĐ</span></div>
                    <span style={{ fontSize: 18, color: '#6B7280' }}>{isOpen ? '▾' : '▸'}</span>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: 16, background: '#fff' }}>
                  {loadingDetailsId === o.orderId ? (
                    <div style={{ textAlign: 'center', color: '#6B7280' }}>Đang tải chi tiết...</div>
                  ) : detailItems.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6B7280' }}>Không có chi tiết đơn hàng</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} id={`order-details-${o.orderId}`}>
                      {detailItems.map((it: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eef2f7', padding: '8px 0' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 400 }}>{it.partName || it.serviceName || `Sản phẩm #${it.partId || ''}`}</span>
                            {it.quantity != null && (
                              <span style={{ fontSize: 12, color: '#6B7280' }}>Số lượng: {it.quantity}</span>
                            )}
                          </div>
                          <div style={{ fontWeight: 500 }}>{(it.totalPrice || it.unitPrice || 0).toLocaleString('vi-VN')} VNĐ</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={{ padding: '6px 10px', border: '1px solid #f1f5f9', borderRadius: 6 }}>‹</button>
          {(() => {
            const pages: (number | '...')[] = []
            const add = (p: number | '...') => pages.push(p)
            const window = 1
            const start = Math.max(1, page - window)
            const end = Math.min(totalPages, page + window)
            if (start > 1) { add(1); if (start > 2) add('...') }
            for (let p = start; p <= end; p++) add(p)
            if (end < totalPages) { if (end < totalPages - 1) add('...'); add(totalPages) }
            return (
              <div style={{ display: 'flex', gap: 4 }}>
                {pages.map((p, idx) => (
                  p === '...'
                    ? <span key={`e-${idx}`} style={{ padding: '0 6px', color: '#9ca3af' }}>…</span>
                    : (
                      <button key={p} onClick={() => setPage(p as number)} style={{ minWidth: 32, height: 32, border: '1px solid', borderColor: p === page ? '#FFE9A8' : '#f1f5f9', background: p === page ? '#FFD875' : '#fff', borderRadius: 6, fontWeight: 400 }}>{p}</button>
                    )
                ))}
              </div>
            )
          })()}
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{ padding: '6px 10px', border: '1px solid #f1f5f9', borderRadius: 6 }}>›</button>
        </div>
      )}
    </div>
  )
}

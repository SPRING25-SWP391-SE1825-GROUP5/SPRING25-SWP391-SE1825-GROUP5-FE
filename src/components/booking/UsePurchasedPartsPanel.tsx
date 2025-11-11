import React, { useEffect, useMemo, useState } from 'react'
import { OrderService } from '@/services/orderService'
import WorkOrderPartService from '@/services/workOrderPartService'
import { useAppSelector } from '@/store/hooks'
import toast from 'react-hot-toast'

type Props = {
  bookingId: number
  centerId?: number
  onClose?: () => void
  onSuccess?: () => void
}

type AvailablePartItem = {
  orderItemId: number
  partId: number
  partName: string
  availableQty: number
  unitPrice?: number
  warning?: string | null
  canUse?: boolean
}

type OrderWithParts = {
  orderId: number
  orderNumber?: string
  totalAmount?: number
  createdAt?: string
  fulfillmentCenterId?: number
  fulfillmentCenterName?: string
  availableParts?: AvailablePartItem[]
}

const UsePurchasedPartsPanel: React.FC<Props> = ({ bookingId, centerId, onClose, onSuccess }) => {
  const user = useAppSelector((state) => state.auth.user)
  const [orderIdInput, setOrderIdInput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orders, setOrders] = useState<OrderWithParts[]>([])
  const [items, setItems] = useState<AvailablePartItem[]>([])
  const [selected, setSelected] = useState<Record<number, number>>({})

  const totalSelected = useMemo(
    () => Object.values(selected).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [selected]
  )

  // Load danh sách đơn hàng có phụ tùng có thể dùng (API tối ưu - 1 call)
  const loadOrders = async () => {
    const customerId = user?.customerId || user?.id
    if (!customerId) {
      toast.error('Không xác định được thông tin khách hàng')
      return
    }
    if (!centerId) {
      toast.error('Không xác định được chi nhánh của booking')
      return
    }
    try {
      setLoadingOrders(true)
      const resp = await OrderService.getAvailableOrdersForBooking(Number(customerId), centerId)
      const ordersData = Array.isArray(resp?.data) ? resp.data : []
      const mapped: OrderWithParts[] = ordersData.map((o: any) => ({
        orderId: o.orderId,
        orderNumber: o.orderNumber || `#${o.orderId}`,
        totalAmount: o.totalAmount || 0,
        createdAt: o.createdAt,
        fulfillmentCenterId: o.fulfillmentCenterId,
        fulfillmentCenterName: o.fulfillmentCenterName,
        availableParts: (o.availableParts || []).map((p: any) => ({
          orderItemId: p.orderItemId,
          partId: p.partId,
          partName: p.partName,
          availableQty: Number(p.availableQty ?? 0),
          unitPrice: Number(p.unitPrice ?? 0),
          warning: p.warning,
          canUse: p.canUse === true
        }))
      }))
      setOrders(mapped)
      if (mapped.length === 0) {
        toast('Không có đơn hàng nào có phụ tùng có thể dùng tại chi nhánh này')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể tải danh sách đơn hàng')
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleValidateAndAttach = async () => {
    const usages = Object.entries(selected)
      .map(([orderItemIdStr, qty]) => ({
        orderItemId: Number(orderItemIdStr),
        quantity: Number(qty)
      }))
      .filter(u => u.quantity > 0)

    if (usages.length === 0) {
      toast.error('Vui lòng chọn ít nhất một phụ tùng')
      return
    }
    if (!centerId) {
      toast.error('Không xác định được chi nhánh của booking')
      return
    }

    try {
      setLoading(true)
      // Validate
      const validateResp = await WorkOrderPartService.validateOrderParts({
        centerId,
        orderItemUsages: usages
      })
      const valid = validateResp?.success === true
      const results: any[] = Array.isArray(validateResp?.data) ? validateResp.data : []
      const invalids = results.filter((r: any) => r.isValid === false)
      if (!valid) {
        const firstError = invalids[0]?.errors?.[0] || 'Phụ tùng không hợp lệ'
        toast.error(firstError)
        return
      }

      // Attach batch to booking (customer parts)
      const updateResp = await WorkOrderPartService.updateBookingCustomerParts(bookingId, {
        orderItemUsages: usages
      })
      if (updateResp?.success) {
        toast.success('Đã cập nhật phụ tùng đã mua cho booking')
        onSuccess?.()
        onClose?.()
      } else {
        toast.error(updateResp?.message || 'Không thể cập nhật phụ tùng')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Có lỗi khi cập nhật phụ tùng')
    } finally {
      setLoading(false)
    }
  }

  // Load danh sách đơn hàng khi component mount hoặc centerId thay đổi
  useEffect(() => {
    if ((user?.customerId || user?.id) && centerId) {
      loadOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.customerId, user?.id, centerId])

  useEffect(() => {
    setItems([])
    setSelected({})
    setOrderIdInput('')
  }, [bookingId, centerId])

  // Tự động hiển thị phụ tùng khi chọn đơn hàng (từ response đã có sẵn)
  useEffect(() => {
    if (orderIdInput && orderIdInput.trim()) {
      const selectedOrder = orders.find(o => String(o.orderId) === orderIdInput)
      if (selectedOrder?.availableParts) {
        setItems(selectedOrder.availableParts)
      } else {
        setItems([])
        setSelected({})
      }
    } else {
      setItems([])
      setSelected({})
    }
  }, [orderIdInput, orders])

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 16 }}>Sử dụng phụ tùng đã mua</div>
        {onClose && (
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>
            Đóng
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <select
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          disabled={loadingOrders}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
        >
          <option value="">-- Chọn đơn hàng đã thanh toán --</option>
          {orders.map((order) => (
            <option key={order.orderId} value={String(order.orderId)}>
              {order.orderNumber} - {order.totalAmount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount) : ''}
            </option>
          ))}
        </select>
        {loadingOrders && (
          <div style={{ padding: '8px 12px', color: '#6b7280', fontSize: 14 }}>
            Đang tải đơn hàng...
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
          {items.map((it) => {
            const current = selected[it.orderItemId] || 0
            const max = Number(it.availableQty || 0)
            const disabled = it.canUse === false || max <= 0
            return (
              <div key={it.orderItemId} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, padding: '6px 0', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14 }}>{it.partName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Có thể dùng: {max.toLocaleString('vi-VN')}
                    {it.warning ? <span style={{ marginLeft: 8, color: '#b91c1c' }}>({it.warning})</span> : null}
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={max}
                  value={current}
                  disabled={disabled}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(Number(e.target.value || 0), max))
                    setSelected(prev => ({ ...prev, [it.orderItemId]: v }))
                  }}
                  style={{ width: 80, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6 }}
                />
                <div style={{ fontSize: 12, color: disabled ? '#b91c1c' : '#059669' }}>
                  {disabled ? 'Không dùng được' : 'OK'}
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Đã chọn: {totalSelected}</div>
            <button
              onClick={handleValidateAndAttach}
              disabled={loading || totalSelected === 0}
              style={{ padding: '10px 12px', borderRadius: 6, border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer' }}
            >
              {loading ? 'Đang cập nhật...' : 'Xác nhận sử dụng'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsePurchasedPartsPanel



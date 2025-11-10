import React, { useEffect, useMemo, useState } from 'react'
import { OrderService } from '@/services/orderService'
import WorkOrderPartService from '@/services/workOrderPartService'
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

const UsePurchasedPartsPanel: React.FC<Props> = ({ bookingId, centerId, onClose, onSuccess }) => {
  const [orderIdInput, setOrderIdInput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AvailablePartItem[]>([])
  const [selected, setSelected] = useState<Record<number, number>>({})

  const totalSelected = useMemo(
    () => Object.values(selected).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [selected]
  )

  const loadAvailable = async () => {
    const orderId = Number(orderIdInput.trim())
    if (!orderId || Number.isNaN(orderId)) {
      toast.error('Vui lòng nhập mã đơn hàng hợp lệ')
      return
    }
    try {
      setLoading(true)
      const resp = await OrderService.getAvailableParts(orderId, centerId)
      const raw = (resp?.data || []) as any[]
      const mapped: AvailablePartItem[] = raw.map((r: any) => ({
        orderItemId: r.orderItemId,
        partId: r.partId,
        partName: r.partName,
        availableQty: Number(r.availableQty ?? 0),
        unitPrice: Number(r.unitPrice ?? 0),
        warning: r.warning,
        canUse: r.canUse
      }))
      setItems(mapped)
      if (mapped.length === 0) {
        toast('Không có phụ tùng có thể dùng tại chi nhánh này')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể tải phụ tùng đã mua')
    } finally {
      setLoading(false)
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

  useEffect(() => {
    setItems([])
    setSelected({})
  }, [bookingId, centerId])

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
        <input
          type="number"
          placeholder="Nhập mã đơn hàng (OrderId)"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}
        />
        <button
          onClick={loadAvailable}
          disabled={loading || !orderIdInput.trim()}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#FFD875', color: '#111827', cursor: 'pointer' }}
        >
          {loading ? 'Đang tải...' : 'Tải phụ tùng'}
        </button>
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



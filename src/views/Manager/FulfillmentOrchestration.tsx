import { useEffect, useMemo, useState } from 'react'
import { OrderService, CenterService } from '@/services'
import type { Center } from '@/services/centerService'
import toast from 'react-hot-toast'
import '../fulfillment-orchestration.scss'

interface OrderRow {
  orderId: number
  customerName?: string
  customerId?: number
  totalAmount?: number
  status?: string
  fulfillmentCenterId?: number | null
  fulfillmentCenterName?: string | null
  createdAt?: string
  updatedAt?: string
}

interface AvailablePartSummary {
  orderItemId: number
  partName: string
  availableQty: number
  warning?: string | null
  canUse?: boolean
}

export default function FulfillmentOrchestration() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [selectedCenter, setSelectedCenter] = useState<Record<number, number>>({})
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({})
  const [availableParts, setAvailableParts] = useState<Record<number, AvailablePartSummary[]>>({})

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [orderResp, centersResp] = await Promise.all([
          OrderService.getAllOrders({ status: 'PAID', pageSize: 100 }),
          CenterService.getActiveCenters({ pageSize: 100 })
        ])

        const rows = Array.isArray((orderResp as any)?.data?.items)
          ? (orderResp as any).data.items
          : Array.isArray((orderResp as any)?.data)
          ? (orderResp as any).data
          : []

        const mappedOrders: OrderRow[] = rows.map((o: any) => ({
          orderId: o.orderId ?? o.OrderId ?? o.id,
          customerName: o.customerName ?? o.CustomerName ?? '',
          customerId: o.customerId ?? o.CustomerId ?? undefined,
          totalAmount: Number(o.totalAmount ?? o.TotalAmount ?? 0),
          status: o.status ?? o.Status ?? '',
          fulfillmentCenterId: o.fulfillmentCenterId ?? o.FulfillmentCenterId ?? null,
          fulfillmentCenterName: o.fulfillmentCenterName ?? o.FulfillmentCenterName ?? null,
          createdAt: o.createdAt ?? o.CreatedAt ?? null,
          updatedAt: o.updatedAt ?? o.UpdatedAt ?? null
        }))

        setOrders(mappedOrders)
        setCenters(centersResp?.centers || [])
      } catch (error: any) {
        toast.error(error?.message || 'Không thể tải dữ liệu điều phối')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const loadAvailableParts = async (orderId: number, centerId?: number) => {
    try {
      setLoadingMap(prev => ({ ...prev, [orderId]: true }))
      const resp = await OrderService.getAvailableParts(orderId, centerId)
      const data = ((resp as any)?.data || []) as any[]
      const mapped: AvailablePartSummary[] = data.map((item: any) => ({
        orderItemId: item.orderItemId,
        partName: item.partName,
        availableQty: Number(item.availableQty ?? 0),
        warning: item.warning,
        canUse: item.canUse
      }))
      setAvailableParts(prev => ({ ...prev, [orderId]: mapped }))
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể tải phụ tùng khả dụng')
    } finally {
      setLoadingMap(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleUpdateCenter = async (orderId: number, centerId: number) => {
    try {
      setLoadingMap(prev => ({ ...prev, [orderId]: true }))
      const resp = await OrderService.updateFulfillmentCenter(orderId, centerId)
      if ((resp as any)?.success) {
        toast.success('Đã cập nhật chi nhánh cho đơn hàng')
        setOrders(prev =>
          prev.map(o =>
            o.orderId === orderId
              ? { ...o, fulfillmentCenterId: centerId, fulfillmentCenterName: centers.find(c => c.centerId === centerId)?.centerName ?? null }
              : o
          )
        )
        await loadAvailableParts(orderId, centerId)
      } else {
        toast.error((resp as any)?.message || 'Không thể cập nhật chi nhánh')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Lỗi cập nhật chi nhánh')
    } finally {
      setLoadingMap(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const tableRows = useMemo(() => orders.filter(o => (o.status ?? '').toUpperCase() === 'PAID'), [orders])

  useEffect(() => {
    tableRows.forEach(row => {
      if (row.fulfillmentCenterId) {
        loadAvailableParts(row.orderId, row.fulfillmentCenterId)
      }
    })
  }, [tableRows.length])

  return (
    <div className="manager-fulfillment-page">
      <div className="page-header">
        <h1>Điều phối kho</h1>
        <p>Theo dõi đơn hàng phụ tùng đã thanh toán và đảm bảo chi nhánh có đủ hàng để phục vụ booking.</p>
      </div>

      {loading ? (
        <div className="card loading-card">Đang tải dữ liệu...</div>
      ) : (
        <div className="card">
          <table className="fulfillment-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Khách hàng</th>
                <th>Chi nhánh hiện tại</th>
                <th>Chọn chi nhánh khác</th>
                <th>Phụ tùng sẵn sàng</th>
                <th>Tổng tiền</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280' }}>
                    Không có đơn hàng nào cần điều phối
                  </td>
                </tr>
              ) : (
                tableRows.map(row => {
                  const centerOptions = centers.map(center => ({
                    value: center.centerId,
                    label: center.centerName
                  }))

                  const available = availableParts[row.orderId] || []
                  const hasIssue = available.some(item => item.warning || item.canUse === false || item.availableQty <= 0)

                  return (
                    <tr key={row.orderId} className={hasIssue ? 'row-warning' : ''}>
                      <td>
                        <div className="cell-title">#{row.orderId}</div>
                        <div className="cell-sub">{row.status}</div>
                      </td>
                      <td>
                        <div className="cell-title">{row.customerName || '-'}</div>
                        <div className="cell-sub">ID: {row.customerId ?? '-'}</div>
                      </td>
                      <td>
                        <div className="cell-title">
                          {row.fulfillmentCenterName || 'Chưa chọn'}
                        </div>
                        <div className="cell-sub">
                          ID: {row.fulfillmentCenterId ?? '—'}
                        </div>
                      </td>
                      <td>
                        <select
                          value={selectedCenter[row.orderId] ?? ''}
                          onChange={(e) => setSelectedCenter(prev => ({ ...prev, [row.orderId]: Number(e.target.value) }))}
                          className="center-select"
                        >
                          <option value="">-- chọn chi nhánh --</option>
                          {centerOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="actions">
                          <button
                            disabled={!selectedCenter[row.orderId] || loadingMap[row.orderId]}
                            onClick={() => {
                              const centerId = selectedCenter[row.orderId]
                              if (centerId) {
                                handleUpdateCenter(row.orderId, centerId)
                              }
                            }}
                          >
                            {loadingMap[row.orderId] ? 'Đang cập nhật...' : 'Cập nhật'}
                          </button>
                          <button
                            className="secondary"
                            onClick={() => loadAvailableParts(row.orderId, row.fulfillmentCenterId ?? undefined)}
                          >
                            Kiểm tra tồn kho
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="parts-list">
                          {loadingMap[row.orderId] ? (
                            <div className="loading-inline">Đang kiểm tra…</div>
                          ) : available.length === 0 ? (
                            <div className="muted">Chưa có dữ liệu</div>
                          ) : (
                            available.map(item => (
                              <div key={item.orderItemId} className={`part-row ${item.canUse === false || item.availableQty <= 0 ? 'part-warning' : ''}`}>
                                <div className="part-name">{item.partName}</div>
                                <div className="part-qty">Còn: {item.availableQty}</div>
                                {item.warning ? <div className="part-warning-text">{item.warning}</div> : null}
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="cell-title">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.totalAmount ?? 0)}
                        </div>
                      </td>
                      <td>
                        <div className="cell-sub">Tạo: {row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '-'}</div>
                        <div className="cell-sub">Cập nhật: {row.updatedAt ? new Date(row.updatedAt).toLocaleString('vi-VN') : '-'}</div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}



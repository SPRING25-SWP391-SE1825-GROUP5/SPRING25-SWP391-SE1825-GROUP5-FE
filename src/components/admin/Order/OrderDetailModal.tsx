import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ShoppingCart, DollarSign, Calendar, MapPin, Package, FileText } from 'lucide-react'
import { OrderService } from '@/services/orderService'
import toast from 'react-hot-toast'
import '../Booking/_booking-modal.scss' // Reuse booking modal styles

interface OrderDetailModalProps {
  isOpen: boolean
  orderId: number
  onClose: () => void
}

type TabType = 'overview' | 'items'

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  orderId,
  onClose
}) => {
  const [orderDetail, setOrderDetail] = useState<any>(null)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetail()
      setActiveTab('overview') // Reset tab khi mở modal mới
    }
  }, [isOpen, orderId])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch order detail
      const orderResponse = await OrderService.getOrderById(orderId)
      
      if (orderResponse.success && orderResponse.data) {
        setOrderDetail(orderResponse.data)
        
        // Fetch order items
        try {
          const itemsResponse = await OrderService.getOrderItems(orderId)
          if (itemsResponse.success && itemsResponse.data) {
            setOrderItems(itemsResponse.data)
          }
        } catch (err) {
          console.error('Failed to fetch order items:', err)
          // Không hiển thị error nếu không lấy được items
        }
      } else {
        setError(orderResponse.message || 'Không thể tải chi tiết đơn hàng')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải chi tiết đơn hàng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadgeClass = (status: string) => {
    const statusUpper = (status || '').toUpperCase()
    switch (statusUpper) {
      case 'PENDING':
        return 'status-badge status-badge--pending'
      case 'CONFIRMED':
        return 'status-badge status-badge--confirmed'
      case 'PROCESSING':
        return 'status-badge status-badge--in-progress'
      case 'SHIPPED':
        return 'status-badge status-badge--in-progress'
      case 'COMPLETED':
        return 'status-badge status-badge--completed'
      case 'PAID':
        return 'status-badge status-badge--paid'
      case 'CANCELLED':
      case 'CANCELED':
        return 'status-badge status-badge--cancelled'
      default:
        return 'status-badge status-badge--default'
    }
  }

  const getStatusLabel = (status: string) => {
    const statusUpper = (status || '').toUpperCase()
    switch (statusUpper) {
      case 'PENDING':
        return 'Chờ xử lý'
      case 'CONFIRMED':
        return 'Đã xác nhận'
      case 'PROCESSING':
        return 'Đang xử lý'
      case 'SHIPPED':
        return 'Đã giao hàng'
      case 'COMPLETED':
        return 'Hoàn thành'
      case 'PAID':
        return 'Đã thanh toán'
      case 'CANCELLED':
      case 'CANCELED':
        return 'Đã hủy'
      default:
        return status || 'N/A'
    }
  }

  if (!isOpen || !orderId) return null

  const order = orderDetail
  const orderIdValue = order?.orderId || order?.id || order?.OrderId || orderId

  const tabs = [
    { id: 'overview' as TabType, label: 'Tổng quan', icon: FileText },
    { id: 'items' as TabType, label: 'Sản phẩm', icon: Package }
  ]

  return createPortal(
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="booking-modal__header">
          <div>
            <h2 className="booking-modal__title">
              Chi tiết Đơn hàng #{orderIdValue}
            </h2>
            {order?.createdAt && (
              <p className="booking-modal__subtitle">
                Ngày tạo: {formatDateTime(order.createdAt || order.CreatedAt || order.createdDate || order.CreatedDate)}
              </p>
            )}
          </div>
          <button className="booking-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="booking-modal__loading">
            <div className="booking-modal__spinner" />
            <p>Đang tải chi tiết...</p>
          </div>
        ) : error ? (
          <div className="booking-modal__error">
            <p>{error}</p>
            <button onClick={fetchOrderDetail}>Thử lại</button>
          </div>
        ) : order ? (
          <>
            {/* Status Badge */}
            <div className="booking-modal__status">
              <span className={getStatusBadgeClass(order.status || order.Status)}>
                <span className="dot" />
                {getStatusLabel(order.status || order.Status)}
              </span>
            </div>

            {/* Tabs */}
            <div className="booking-modal__tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`booking-modal__tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <div className="booking-modal__content">
              {/* Tab: Tổng quan */}
              {activeTab === 'overview' && (
                <div className="booking-modal__tab-content">
                  {/* Order Info */}
                  <div className="booking-modal__section">
                    <h3 className="booking-modal__section-title">
                      <ShoppingCart size={18} /> Thông tin đơn hàng
                    </h3>
                    <div className="booking-modal__info-grid">
                      <div className="info-item">
                        <label>Mã đơn hàng:</label>
                        <span>#{orderIdValue}</span>
                      </div>
                      <div className="info-item">
                        <label>Trạng thái:</label>
                        <span className={getStatusBadgeClass(order.status || order.Status)}>
                          <span className="dot" />
                          {getStatusLabel(order.status || order.Status)}
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Ngày tạo:</label>
                        <span>{formatDateTime(order.createdAt || order.CreatedAt || order.createdDate || order.CreatedDate)}</span>
                      </div>
                      {order.updatedAt && (
                        <div className="info-item">
                          <label>Ngày cập nhật:</label>
                          <span>{formatDateTime(order.updatedAt || order.UpdatedAt || order.updatedDate || order.UpdatedDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="booking-modal__section">
                    <h3 className="booking-modal__section-title">
                      <DollarSign size={18} /> Thanh toán
                    </h3>
                    <div className="booking-modal__info-grid">
                      <div className="info-item">
                        <label>Tổng tiền:</label>
                        <span className="text-primary-bold" style={{ fontSize: '18px', fontWeight: '700' }}>
                          {formatCurrency(order.totalAmount || order.total || order.TotalAmount || order.Total || 0)}
                        </span>
                      </div>
                      {order.paymentMethod && (
                        <div className="info-item">
                          <label>Phương thức thanh toán:</label>
                          <span>{order.paymentMethod || order.PaymentMethod || 'N/A'}</span>
                        </div>
                      )}
                      {order.paymentStatus && (
                        <div className="info-item">
                          <label>Trạng thái thanh toán:</label>
                          <span>{order.paymentStatus || order.PaymentStatus || 'N/A'}</span>
                        </div>
                      )}
                      {order.paidAt && (
                        <div className="info-item">
                          <label>Ngày thanh toán:</label>
                          <span>{formatDateTime(order.paidAt || order.PaidAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  {(order.shippingAddress || order.ShippingAddress) && (
                    <div className="booking-modal__section">
                      <h3 className="booking-modal__section-title">
                        <MapPin size={18} /> Địa chỉ giao hàng
                      </h3>
                      <div className="booking-modal__info-grid">
                        <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                          <label>Địa chỉ:</label>
                          <span>{order.shippingAddress || order.ShippingAddress}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {(order.notes || order.Notes) && (
                    <div className="booking-modal__section">
                      <h3 className="booking-modal__section-title">
                        Ghi chú
                      </h3>
                      <div className="booking-modal__special-requests">
                        {order.notes || order.Notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Sản phẩm */}
              {activeTab === 'items' && (
                <div className="booking-modal__tab-content">
                  {orderItems.length > 0 ? (
                    <div className="booking-modal__section">
                      <h3 className="booking-modal__section-title">
                        <Package size={18} /> Danh sách sản phẩm ({orderItems.length})
                      </h3>
                      <div className="booking-modal__parts-list">
                        {orderItems.map((item: any, index: number) => {
                          const itemName = item.partName || item.name || item.PartName || item.Name || `Sản phẩm ${index + 1}`
                          const quantity = item.quantity || item.Quantity || 1
                          const price = item.price || item.Price || item.unitPrice || item.UnitPrice || 0
                          const total = item.total || item.Total || (price * quantity)

                          return (
                            <div key={index} className="booking-modal__part-item">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                <span className="part-name">{itemName}</span>
                                {item.partCode && (
                                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Mã: {item.partCode || item.PartCode}</span>
                                )}
                              </div>
                              <span className="part-quantity">SL: {quantity}</span>
                              <span className="part-price">{formatCurrency(price)}</span>
                              <span className="part-price" style={{ fontWeight: '700' }}>{formatCurrency(total)}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600' }}>Tổng cộng:</span>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-500)' }}>
                          {formatCurrency(order.totalAmount || order.total || order.TotalAmount || order.Total || 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="booking-modal__empty">
                      <p>Chưa có sản phẩm trong đơn hàng</p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Actions */}
            <div className="booking-modal__actions">
              <button className="btn-secondary" onClick={onClose}>
                Đóng
              </button>
            </div>
          </>
        ) : (
          <div className="booking-modal__empty">
            <p>Không tìm thấy thông tin đơn hàng</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default OrderDetailModal


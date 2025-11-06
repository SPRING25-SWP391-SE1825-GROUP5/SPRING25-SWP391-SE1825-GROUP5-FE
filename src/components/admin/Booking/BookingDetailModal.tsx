import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Settings, User, Car, MapPin, Wrench, Clock, Calendar, Phone, Mail, DollarSign, FileText, History } from 'lucide-react'
import { BookingService, AdminBookingSummary, BookingDetail } from '@/services/bookingService'
import toast from 'react-hot-toast'
import './_booking-modal.scss'

interface BookingDetailModalProps {
  isOpen: boolean
  booking: AdminBookingSummary
  onClose: () => void
  onChangeStatus: () => void
}

type TabType = 'overview' | 'service' | 'center' | 'history'

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  booking,
  onClose,
  onChangeStatus
}) => {
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    if (isOpen && booking) {
      fetchBookingDetail()
      setActiveTab('overview') // Reset tab khi mở modal mới
    }
  }, [isOpen, booking])

  const fetchBookingDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await BookingService.getBookingDetail(booking.bookingId)
      if (response.success && response.data) {
        setBookingDetail(response.data)
      } else {
        setError(response.message || 'Không thể tải chi tiết đặt lịch')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải chi tiết đặt lịch'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadgeClass = (status: string) => {
    const statusUpper = status.toUpperCase()
    switch (statusUpper) {
      case 'PENDING':
        return 'status-badge status-badge--pending'
      case 'CONFIRMED':
        return 'status-badge status-badge--confirmed'
      case 'IN_PROGRESS':
        return 'status-badge status-badge--in-progress'
      case 'COMPLETED':
        return 'status-badge status-badge--completed'
      case 'PAID':
        return 'status-badge status-badge--paid'
      case 'CANCELLED':
        return 'status-badge status-badge--cancelled'
      default:
        return 'status-badge status-badge--default'
    }
  }

  const getStatusLabel = (status: string) => {
    const statusUpper = status.toUpperCase()
    switch (statusUpper) {
      case 'PENDING':
        return 'Chờ xác nhận'
      case 'CONFIRMED':
        return 'Đã xác nhận'
      case 'IN_PROGRESS':
        return 'Đang xử lý'
      case 'COMPLETED':
        return 'Hoàn thành'
      case 'PAID':
        return 'Đã thanh toán'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status
    }
  }

  if (!isOpen || !booking) return null

  const detail = bookingDetail || booking

  const tabs = [
    { id: 'overview' as TabType, label: 'Tổng quan', icon: FileText },
    { id: 'service' as TabType, label: 'Chi tiết dịch vụ', icon: Wrench },
    { id: 'center' as TabType, label: 'Trung tâm & Kỹ thuật viên', icon: MapPin },
    { id: 'history' as TabType, label: 'Lịch sử & Ghi chú', icon: History }
  ]

  return createPortal(
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="booking-modal__header">
          <div>
            <h2 className="booking-modal__title">
              Chi tiết Đặt lịch #{booking.bookingId}
            </h2>
            <p className="booking-modal__subtitle">
              Ngày đặt: {formatDateTime(booking.createdAt)}
            </p>
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
            <button onClick={fetchBookingDetail}>Thử lại</button>
          </div>
        ) : (
          <>
            {/* Status Badge */}
            <div className="booking-modal__status">
              <span className={getStatusBadgeClass(booking.status)}>
                <span className="dot" />
                {getStatusLabel(booking.status)}
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
                  {/* Time Slot Info */}
                  <div className="booking-modal__section">
                    <h3 className="booking-modal__section-title">
                      <Clock size={18} /> Thời gian
                    </h3>
                    <div className="booking-modal__info-grid">
                      <div className="info-item">
                        <label>Ngày:</label>
                        <span>{formatDate(booking.timeSlotInfo.workDate)}</span>
                      </div>
                      <div className="info-item">
                        <label>Giờ:</label>
                        <span>{booking.timeSlotInfo.startTime} - {booking.timeSlotInfo.endTime}</span>
                      </div>
                      <div className="info-item">
                        <label>Kỹ thuật viên:</label>
                        <span>{booking.technicianInfo.technicianName || 'Chưa gán'}</span>
                      </div>
                    </div>
            </div>

            {/* Customer Info */}
            <div className="booking-modal__section">
              <h3 className="booking-modal__section-title">
                <User size={18} /> Thông tin khách hàng
              </h3>
              <div className="booking-modal__info-grid">
                <div className="info-item">
                  <label>Họ tên:</label>
                  <span>{booking.customerInfo.fullName}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{booking.customerInfo.email}</span>
                </div>
                <div className="info-item">
                  <label>Số điện thoại:</label>
                  <span>{booking.customerInfo.phoneNumber}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="booking-modal__section">
              <h3 className="booking-modal__section-title">
                <Car size={18} /> Thông tin xe
              </h3>
              <div className="booking-modal__info-grid">
                <div className="info-item">
                  <label>Biển số:</label>
                  <span>{booking.vehicleInfo.licensePlate}</span>
                </div>
                <div className="info-item">
                  <label>Mẫu xe:</label>
                  <span>{booking.vehicleInfo.modelName} {booking.vehicleInfo.version}</span>
                </div>
                <div className="info-item">
                  <label>Số km:</label>
                  <span>{booking.vehicleInfo.currentMileage.toLocaleString('vi-VN')} km</span>
                </div>
                <div className="info-item">
                  <label>VIN:</label>
                  <span>{booking.vehicleInfo.vin}</span>
                </div>
              </div>
            </div>
                </div>
              )}

              {/* Tab: Chi tiết dịch vụ */}
              {activeTab === 'service' && (
                <div className="booking-modal__tab-content">
                  {/* Service Info */}
                  <div className="booking-modal__section">
                    <h3 className="booking-modal__section-title">
                      <Wrench size={18} /> Dịch vụ
                    </h3>
                    <div className="booking-modal__info-grid">
                      <div className="info-item">
                        <label>Tên dịch vụ:</label>
                        <span>{booking.serviceInfo.serviceName}</span>
                      </div>
                      <div className="info-item">
                        <label>Mô tả:</label>
                        <span>{booking.serviceInfo.description || 'Không có'}</span>
                      </div>
                      <div className="info-item">
                        <label>Giá cơ bản:</label>
                        <span>{formatCurrency(booking.serviceInfo.basePrice)}</span>
                      </div>
                      {bookingDetail && bookingDetail.totalAmount && (
                        <div className="info-item">
                          <label>Tổng tiền:</label>
                          <span className="text-primary-bold">{formatCurrency(bookingDetail.totalAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Parts - Nếu có trong bookingDetail (tùy theo BE trả về) */}
                  {Array.isArray((bookingDetail as any)?.parts) && (bookingDetail as any).parts.length > 0 && (
                    <div className="booking-modal__section">
                      <h3 className="booking-modal__section-title">
                        Phụ tùng
                      </h3>
                      <div className="booking-modal__parts-list">
                        {(bookingDetail as any).parts.map((part: any, index: number) => (
                          <div key={index} className="booking-modal__part-item">
                            <span className="part-name">{part.partName || part.name}</span>
                            <span className="part-quantity">SL: {part.quantity || 1}</span>
                            {part.price && (
                              <span className="part-price">{formatCurrency(part.price)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Checklist - Nếu có (tùy theo BE trả về) */}
                  {Array.isArray((bookingDetail as any)?.checklist) && (bookingDetail as any).checklist.length > 0 && (
                    <div className="booking-modal__section">
                      <h3 className="booking-modal__section-title">
                        Checklist
                      </h3>
                      <div className="booking-modal__checklist">
                        {(bookingDetail as any).checklist.map((item: any, index: number) => (
                          <div key={index} className="booking-modal__checklist-item">
                            <input
                              type="checkbox"
                              checked={item.completed || false}
                              readOnly
                              className="checklist-checkbox"
                            />
                            <span>{item.taskName || item.name || `Hạng mục ${index + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Trung tâm & Kỹ thuật viên */}
              {activeTab === 'center' && (
                <div className="booking-modal__tab-content">
            {/* Center Info */}
            <div className="booking-modal__section">
              <h3 className="booking-modal__section-title">
                <MapPin size={18} /> Trung tâm
              </h3>
              <div className="booking-modal__info-grid">
                <div className="info-item">
                  <label>Tên trung tâm:</label>
                  <span>{booking.centerInfo.centerName}</span>
                </div>
                <div className="info-item">
                  <label>Địa chỉ:</label>
                  <span>{booking.centerInfo.centerAddress}</span>
                </div>
                <div className="info-item">
                  <label>Số điện thoại:</label>
                  <span>{booking.centerInfo.phoneNumber}</span>
                </div>
              </div>
            </div>

                  {/* Technician Info */}
            <div className="booking-modal__section">
              <h3 className="booking-modal__section-title">
                      <User size={18} /> Kỹ thuật viên
              </h3>
              <div className="booking-modal__info-grid">
                <div className="info-item">
                        <label>Tên:</label>
                        <span>{booking.technicianInfo.technicianName || 'Chưa gán'}</span>
                </div>
                      {booking.technicianInfo.phoneNumber && (
                <div className="info-item">
                          <label>Số điện thoại:</label>
                          <span>{booking.technicianInfo.phoneNumber}</span>
                </div>
                      )}
                      {(booking as any).technicianInfo?.technicianEmail && (
                <div className="info-item">
                          <label>Email:</label>
                          <span>{(booking as any).technicianInfo.technicianEmail}</span>
                  </div>
                )}
              </div>
            </div>
                </div>
              )}

              {/* Tab: Lịch sử & Ghi chú */}
              {activeTab === 'history' && (
                <div className="booking-modal__tab-content">
            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="booking-modal__section">
                <h3 className="booking-modal__section-title">
                  Yêu cầu đặc biệt
                </h3>
                <div className="booking-modal__special-requests">
                  {booking.specialRequests}
                </div>
              </div>
            )}

                  {/* Booking History - Nếu có (tùy theo BE trả về) */}
                  {Array.isArray((bookingDetail as any)?.history) && (bookingDetail as any).history.length > 0 && (
                    <div className="booking-modal__section">
                      <h3 className="booking-modal__section-title">
                        Lịch sử thay đổi
                      </h3>
                      <div className="booking-modal__history">
                        {(bookingDetail as any).history.map((historyItem: any, index: number) => (
                          <div key={index} className="booking-modal__history-item">
                            <div className="history-time">
                              {historyItem.timestamp && formatDateTime(historyItem.timestamp)}
                            </div>
                            <div className="history-content">
                              <span className="history-action">{historyItem.action || historyItem.status}</span>
                              {historyItem.note && (
                                <span className="history-note"> - {historyItem.note}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes - Nếu không có gì */}
                  {!booking.specialRequests && (!Array.isArray((bookingDetail as any)?.history) || (bookingDetail as any).history.length === 0) && (
                    <div className="booking-modal__empty">
                      <p>Không có thông tin lịch sử hoặc ghi chú</p>
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
              {booking.status !== 'CANCELLED' && (
                <button className="btn-primary" onClick={onChangeStatus}>
                  <Settings size={16} /> Thay đổi trạng thái
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

export default BookingDetailModal


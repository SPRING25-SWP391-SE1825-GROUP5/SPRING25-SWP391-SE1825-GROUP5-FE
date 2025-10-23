import React, { useEffect, useState } from 'react'
import { ServiceManagementService } from '@/services/serviceManagementService'

interface ConfirmationBookingData {
  customerInfo: {
    fullName: string
    phone: string
    email: string
  }
  vehicleInfo: {
    carModel: string
    mileage: string
    licensePlate: string
    year?: string
    color?: string
    brand?: string
  }
  serviceInfo: {
    services: string[]
    notes: string
  }
  locationTimeInfo: {
    centerId: string
    technicianId: string
    address?: string
    date: string
    time: string
  }
  accountInfo?: {
    username: string
    password: string
    confirmPassword: string
  }
  images: File[]
}

interface ConfirmationStepProps {
  data: ConfirmationBookingData
  isGuest: boolean
  onSubmit: () => void
  onPrev: () => void
}

interface ServiceInfo {
  id: number
  name: string
  price: number
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ data, isGuest, onSubmit, onPrev }) => {
  const [services, setServices] = useState<ServiceInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const response = await ServiceManagementService.getActiveServices({ pageSize: 100 })
        setServices(response.services || [])
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  // Calculate total price
  const totalPrice = data.serviceInfo.services.reduce((sum, serviceId) => {
    const service = services.find(s => s.id === Number(serviceId))
    console.log('Service ID:', serviceId, 'Found service:', service)
    return sum + (service?.price || 0)
  }, 0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="confirmation-step">
      <h2>Xác nhận đặt lịch</h2>
      
      <div className="confirmation-grid">
        {/* Left column - Customer & Vehicle Info */}
        <div className="confirmation-left">
          <div className="info-card">
            <h3>Thông tin khách hàng</h3>
            <div className="info-row">
              <span className="label">Họ tên:</span>
              <span className="value">{data.customerInfo.fullName}</span>
            </div>
            <div className="info-row">
              <span className="label">Số điện thoại:</span>
              <span className="value">{data.customerInfo.phone}</span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{data.customerInfo.email}</span>
            </div>
          </div>

          <div className="info-card">
            <h3>Thông tin xe</h3>
            <div className="info-row">
              <span className="label">Biển số:</span>
              <span className="value">{data.vehicleInfo.licensePlate}</span>
            </div>
            <div className="info-row">
              <span className="label">Dòng xe:</span>
              <span className="value">{data.vehicleInfo.carModel}</span>
            </div>
            {data.vehicleInfo.brand && (
              <div className="info-row">
                <span className="label">Hãng xe:</span>
                <span className="value">{data.vehicleInfo.brand}</span>
              </div>
            )}
            {data.vehicleInfo.year && (
              <div className="info-row">
                <span className="label">Năm sản xuất:</span>
                <span className="value">{data.vehicleInfo.year}</span>
              </div>
            )}
            {data.vehicleInfo.color && (
              <div className="info-row">
                <span className="label">Màu sắc:</span>
                <span className="value">{data.vehicleInfo.color}</span>
              </div>
            )}
            {data.vehicleInfo.mileage && (
              <div className="info-row">
                <span className="label">Số km:</span>
                <span className="value">{data.vehicleInfo.mileage} km</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Service & Schedule */}
        <div className="confirmation-right">
          <div className="info-card">
            <h3>Dịch vụ đã chọn</h3>
            <div className="service-table">
              <div className="service-header">
                <span>Tên dịch vụ</span>
                <span>Giá</span>
              </div>
              {loading ? (
                <div className="service-row">
                  <span className="service-name">Đang tải...</span>
                  <span className="service-price">—</span>
                </div>
              ) : (
                data.serviceInfo.services.map(serviceId => {
                  const service = services.find(s => s.id === Number(serviceId))
                  return (
                    <div key={serviceId} className="service-row">
                      <span className="service-name">{service?.name || `Dịch vụ ${serviceId}`}</span>
                      <span className="service-price">{formatPrice(service?.price || 0)}</span>
                    </div>
                  )
                })
              )}
              <div className="service-total">
                <span className="total-label">Tổng cộng:</span>
                <span className="total-price">{formatPrice(totalPrice)}</span>
              </div>
            </div>
            {data.serviceInfo.notes && (
              <div className="notes-section">
                <span className="label">Ghi chú:</span>
                <p className="notes-text">{data.serviceInfo.notes}</p>
              </div>
            )}
          </div>

          <div className="info-card">
            <h3>Lịch hẹn</h3>
            <div className="info-row">
              <span className="label">Ngày:</span>
              <span className="value">{formatDate(data.locationTimeInfo.date)}</span>
            </div>
            <div className="info-row">
              <span className="label">Giờ:</span>
              <span className="value">{data.locationTimeInfo.time}</span>
            </div>
            {data.locationTimeInfo.address && (
              <div className="info-row">
                <span className="label">Địa chỉ:</span>
                <span className="value">{data.locationTimeInfo.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button type="submit" className="btn-primary">
            Xác nhận và thanh toán
          </button>
        </div>
      </form>
      <style>{`
        .confirmation-step h2 { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 1rem 0; }
        .confirmation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .info-card { background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
        .info-card h3 { margin: 0 0 .75rem 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
        .info-row { display: flex; align-items: center; gap: .5rem; padding: .35rem 0; border-bottom: 1px dashed var(--border-primary); }
        .info-row:last-child { border-bottom: none; }
        .label { width: 120px; color: var(--text-secondary); font-weight: 600; }
        .value { color: var(--text-primary); }
        .service-table { display: flex; flex-direction: column; gap: .35rem; }
        .service-header, .service-row, .service-total { display: grid; grid-template-columns: 1fr auto; gap: .75rem; padding: .5rem 0; border-bottom: 1px solid var(--border-primary); }
        .service-header { font-weight: 700; color: var(--text-primary); }
        .service-row { color: var(--text-primary); }
        .service-total { font-weight: 700; }
        .notes-section { margin-top: .75rem; }
        .notes-section .label { width: auto; }
        .notes-text { margin: .25rem 0 0 0; color: var(--text-primary); }
        .form-actions { display: flex; justify-content: flex-start; margin-top: 1rem; }
        .btn-primary { background: var(--progress-current); color: #fff; border: 1px solid var(--progress-current); border-radius: 8px; padding: .6rem 1rem; cursor: pointer; }
        @media (max-width: 1024px) { .confirmation-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}

export default ConfirmationStep
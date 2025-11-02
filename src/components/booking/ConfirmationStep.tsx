import React, { useEffect, useState } from 'react'
import { ServiceManagementService } from '@/services/serviceManagementService'
import { PayOSService } from '@/services/payOSService'
import { CenterService } from '@/services/centerService'
import { TechnicianService } from '@/services/technicianService'
import PromotionSelector from './PromotionSelector'
import type { Promotion } from '@/types/promotion'
import { PAGINATION } from '@/constants/appConstants'

interface ConfirmationBookingData {
  bookingId?: string
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
    centerName?: string
    technicianName?: string
  }
  accountInfo?: {
    username: string
    password: string
    confirmPassword: string
  }
  images: File[]
  promotionInfo?: {
    promotionCode?: string
    discountAmount?: number
  }
}

interface ConfirmationStepProps {
  data: ConfirmationBookingData
  isGuest: boolean
  onSubmit: () => void
  onPrev: () => void
  isSubmitting?: boolean
  onPromotionChange?: (info: { promotionCode?: string; discountAmount: number } | null) => void
}

interface ServiceInfo {
  id: number
  name: string
  price: number
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ data, isGuest, onSubmit, onPrev, isSubmitting = false, onPromotionChange }) => {
  const [services, setServices] = useState<ServiceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [displayCenterName, setDisplayCenterName] = useState<string | null>(data.locationTimeInfo.centerName || null)
  const [displayTechnicianName, setDisplayTechnicianName] = useState<string | null>(data.locationTimeInfo.technicianName || null)
  
  // Data validation

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const response = await ServiceManagementService.getActiveServices({ pageSize: PAGINATION.MAX_PAGE_SIZE })
        if (response && response.services) {
          setServices(response.services || [])
        }
      } catch (error) {
        // Error handled by state
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  // Resolve center and technician names if missing
  useEffect(() => {
    const resolveCenterAndTechnician = async () => {
      try {
        if (!displayCenterName && data.locationTimeInfo.centerId) {
          try {
            const center = await CenterService.getCenterById(Number(data.locationTimeInfo.centerId))
            setDisplayCenterName(center.centerName)
          } catch {}
        }
        if (!displayTechnicianName && data.locationTimeInfo.technicianId && data.locationTimeInfo.centerId) {
          try {
            const res = await TechnicianService.list({ centerId: Number(data.locationTimeInfo.centerId), pageSize: 1000 })
            const tech = (res.technicians || []).find((t: any) => Number(t.technicianId) === Number(data.locationTimeInfo.technicianId))
            if (tech) setDisplayTechnicianName(tech.userFullName)
          } catch {}
        }
      } catch {}
    }
    resolveCenterAndTechnician()
  }, [data.locationTimeInfo.centerId, data.locationTimeInfo.centerName, data.locationTimeInfo.technicianId, data.locationTimeInfo.technicianName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const handlePromotionApplied = (promotion: Promotion | null, discount: number) => {
    setAppliedPromotion(promotion)
    setDiscountAmount(discount)
    // notify parent to persist promotion info for payment amount
    if (onPromotionChange) {
      onPromotionChange({ promotionCode: promotion?.code, discountAmount: discount })
    }
  }

  const handlePromotionRemoved = () => {
    setAppliedPromotion(null)
    setDiscountAmount(0)
    if (onPromotionChange) {
      onPromotionChange(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const selectedServices = services.filter(service => 
    data.serviceInfo.services.includes(service.id.toString())
  )

  const subtotal = selectedServices.reduce((sum, service) => sum + service.price, 0)
  const finalAmount = subtotal - discountAmount

  if (loading) {
    return (
      <div className="confirmation-step">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin dịch vụ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="confirmation-step">
      <div className="step-header">
        <h2>Xác nhận đặt lịch</h2>
        <p>Vui lòng kiểm tra lại thông tin trước khi xác nhận</p>
      </div>

      <div className="confirmation-layout">
        <div className="confirmation-left">
          {/* Customer Information */}
          <div className="info-section compact">
            <h3>👤 Thông tin khách hàng</h3>
            <div className="info-grid two-col">
              <div className="info-item"><span className="label">Họ tên</span><span className="value">{data.customerInfo.fullName}</span></div>
              <div className="info-item"><span className="label">Số điện thoại</span><span className="value">{data.customerInfo.phone?.trim() || 'Chưa có'}</span></div>
              <div className="info-item"><span className="label">Email</span><span className="value">{data.customerInfo.email}</span></div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="info-section compact">
            <h3>🚗 Thông tin xe</h3>
            <div className="info-grid two-col">
              <div className="info-item"><span className="label">Dòng xe</span><span className="value">{data.vehicleInfo.carModel}</span></div>
              <div className="info-item"><span className="label">Biển số</span><span className="value">{data.vehicleInfo.licensePlate}</span></div>
              <div className="info-item"><span className="label">Số km</span><span className="value">{data.vehicleInfo.mileage} km</span></div>
              {data.vehicleInfo.color && (<div className="info-item"><span className="label">Màu</span><span className="value">{data.vehicleInfo.color}</span></div>)}
              {data.vehicleInfo.year && (<div className="info-item"><span className="label">Năm SX</span><span className="value">{data.vehicleInfo.year}</span></div>)}
            </div>
          </div>

          {/* Service Information */}
          <div className="info-section compact">
            <h3>🔧 Dịch vụ đã chọn</h3>
            <div className="services-list compact-list">
              {selectedServices.map(service => (
                <div key={service.id} className="service-item compact-item">
                  <div className="service-info">
                    <span className="service-name">{service.name}</span>
                    <span className="service-price">{formatPrice(service.price)}</span>
                  </div>
                </div>
              ))}
            </div>
            {data.serviceInfo.notes && (
              <div className="notes-section compact-notes">
                <h4>Ghi chú</h4>
                <p>{data.serviceInfo.notes}</p>
              </div>
            )}
          </div>

          {/* Location & Time Information */}
          <div className="info-section compact">
            <h3>📍 Địa điểm & thời gian</h3>
            <div className="info-grid two-col">
              <div className="info-item"><span className="label">Ngày</span><span className="value">{data.locationTimeInfo.date}</span></div>
              <div className="info-item"><span className="label">Giờ</span><span className="value">{data.locationTimeInfo.time}</span></div>
              <div className="info-item"><span className="label">Chi nhánh</span><span className="value">{displayCenterName || data.locationTimeInfo.centerName || `ID: ${data.locationTimeInfo.centerId}`}</span></div>
              <div className="info-item"><span className="label">KTV</span><span className="value">{displayTechnicianName || data.locationTimeInfo.technicianName || `ID: ${data.locationTimeInfo.technicianId}`}</span></div>
            </div>
          </div>

          {/* Account Information (for guests only) */}
          {isGuest && data.accountInfo && (
            <div className="info-section compact">
              <h3>🔐 Tài khoản</h3>
              <div className="info-grid two-col">
                <div className="info-item"><span className="label">Tên đăng nhập</span><span className="value">{data.accountInfo.username}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="confirmation-right">
          <div className="sticky-card">
            <PromotionSelector
              onPromotionApplied={handlePromotionApplied}
              onPromotionRemoved={handlePromotionRemoved}
              orderAmount={subtotal}
              appliedPromotion={appliedPromotion}
              discountAmount={discountAmount}
            />

            <div className="price-summary compact-summary">
              <div className="price-item"><span className="label">Tạm tính</span><span className="value">{formatPrice(subtotal)}</span></div>
              {discountAmount > 0 && (
                <div className="price-item discount"><span className="label">Giảm giá</span><span className="value">-{formatPrice(discountAmount)}</span></div>
              )}
              <div className="price-item total"><span className="label">Tổng cộng</span><span className="value">{formatPrice(finalAmount)}</span></div>
              <form onSubmit={handleSubmit}>
                <div className="form-actions column">
                  <button type="button" onClick={onPrev} className="btn-secondary">Quay lại</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận và thanh toán'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .confirmation-step { max-width: 1100px; margin: 0 auto; padding: 1rem 1.25rem; }

        .step-header { text-align: center; margin-bottom: 1rem; }

        .step-header h2 { color: #1e293b; margin-bottom: 0.25rem; font-size: 1.35rem; }

        .step-header p { color: #64748b; font-size: 0.85rem; }

        .confirmation-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; align-items: start; }
        .confirmation-left { display: flex; flex-direction: column; gap: 0.75rem; }
        .confirmation-right { position: relative; }
        .sticky-card { position: sticky; top: 12px; display: flex; flex-direction: column; gap: 0.75rem; }

        .info-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.9rem 1rem; }
        .info-section.compact h3 { margin: 0 0 0.6rem 0; font-size: 1rem; }

        .info-section h3 { color: #1e293b; font-weight: 600; }

        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem 0.75rem; }
        .info-grid.two-col { grid-template-columns: repeat(2, minmax(0, 1fr)); }

        .info-item { display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; }

        .info-item .label { color: #64748b; font-weight: 500; font-size: 0.9rem; }
        .info-item .value { color: #1e293b; font-weight: 600; font-size: 0.95rem; }

        .services-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .services-list.compact-list .service-item { padding: 0.6rem 0.75rem; }

        .service-item { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }

        .service-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .service-name { color: #1e293b; font-weight: 600; font-size: 0.95rem; }

        .service-price { color: #059669; font-weight: 700; }

        .notes-section { margin-top: 0.5rem; }
        .compact-notes h4 { margin: 0 0 0.25rem 0; font-size: 0.85rem; }
        .compact-notes p { margin: 0; font-size: 0.85rem; color: #475569; }

        .price-summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem; border-radius: 12px; }
        .compact-summary .price-item { padding: 0.4rem 0; }

        .price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .price-item.discount {
          color: #fbbf24;
        }

        .price-item.total {
          border-top: 1px solid rgba(255,255,255,0.2);
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          font-weight: 700;
          font-size: 1.125rem;
        }

        .form-actions { display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.75rem; }
        .form-actions.column { flex-direction: column; }

        .btn-secondary, .btn-primary {
          padding: 0.65rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) { .confirmation-layout { grid-template-columns: 1fr; } .sticky-card { position: static; } }
        @media (max-width: 768px) { .confirmation-step { padding: 0.75rem; } .info-grid { grid-template-columns: 1fr; } .btn-secondary, .btn-primary { width: 100%; } }
      `}</style>
    </div>
  )
}

export default ConfirmationStep
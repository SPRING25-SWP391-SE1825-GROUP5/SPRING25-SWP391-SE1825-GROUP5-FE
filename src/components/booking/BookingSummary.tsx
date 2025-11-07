import React, { useEffect, useState } from 'react'
import { User, Car, Wrench, MapPin, Calendar, Clock, Tag } from 'lucide-react'
import { ServiceManagementService } from '@/services/serviceManagementService'
import { CenterService } from '@/services/centerService'
import { TechnicianService } from '@/services/technicianService'

interface BookingSummaryProps {
  customerInfo?: {
    fullName: string
    phone: string
    email: string
  }
  vehicleInfo?: {
    carModel: string
    mileage: string
    licensePlate: string
    modelId?: number
  }
  serviceInfo?: {
    services: string[]
    notes: string
    packageId?: number
  }
  locationTimeInfo?: {
    centerId: string
    technicianId: string
    date: string
    time: string
    centerName?: string
    technicianName?: string
  }
  promotionInfo?: {
    promotionCode?: string
    discountAmount?: number
  }
  isGuest: boolean
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  customerInfo,
  vehicleInfo,
  serviceInfo,
  locationTimeInfo,
  promotionInfo,
  isGuest
}) => {
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({})
  const [centerName, setCenterName] = useState<string>('')
  const [technicianName, setTechnicianName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load service names
        if (serviceInfo?.services && serviceInfo.services.length > 0) {
          const services = await ServiceManagementService.getActiveServices({ pageSize: 100 })
          const names: Record<string, string> = {}
          serviceInfo.services.forEach(serviceId => {
            const service = services.services.find(s => s.id === Number(serviceId))
            if (service) {
              names[serviceId] = service.name
            }
          })
          setServiceNames(names)
        }

        // Load center name
        if (locationTimeInfo?.centerId && !locationTimeInfo.centerName) {
          try {
            const center = await CenterService.getCenterById(Number(locationTimeInfo.centerId))
            setCenterName(center.centerName || '')
          } catch (error) {
            setCenterName('')
          }
        } else if (locationTimeInfo?.centerName) {
          setCenterName(locationTimeInfo.centerName)
        }

        // Load technician name
        if (locationTimeInfo?.technicianId && !locationTimeInfo.technicianName) {
          try {
            // Lấy danh sách kỹ thuật viên theo center rồi tìm theo technicianId
            if (locationTimeInfo.centerId) {
              const res = await TechnicianService.list({ centerId: Number(locationTimeInfo.centerId), pageSize: 1000 })
              const tech = (res.technicians || []).find((t: any) => Number(t.technicianId) === Number(locationTimeInfo.technicianId))
              setTechnicianName(tech?.userFullName || tech?.name || '')
            } else {
              const res = await TechnicianService.list({ pageSize: 1000 })
              const tech = (res.technicians || []).find((t: any) => Number(t.technicianId) === Number(locationTimeInfo.technicianId))
              setTechnicianName(tech?.userFullName || tech?.name || '')
            }
          } catch (error) {
            setTechnicianName('')
          }
        } else if (locationTimeInfo?.technicianName) {
          setTechnicianName(locationTimeInfo.technicianName)
        }
      } catch (error) {
        // Silently handle errors
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [serviceInfo, locationTimeInfo])

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="booking-summary">
      <div className="summary-header">
        <h3 className="summary-title">Xem trước thông tin</h3>
      </div>

      <div className="summary-content">
        {/* Customer Info - chỉ hiển thị cho guest */}
        {isGuest && customerInfo && (
          <div className="summary-section">
            <div className="summary-section-header">
              <User size={18} />
              <h4 className="summary-section-title">Thông tin liên hệ</h4>
            </div>
            <div className="summary-section-body">
              {customerInfo.fullName && (
                <div className="summary-item">
                  <span className="summary-label">Họ tên:</span>
                  <span className="summary-value">{customerInfo.fullName}</span>
                </div>
              )}
              {customerInfo.phone && (
                <div className="summary-item">
                  <span className="summary-label">SĐT:</span>
                  <span className="summary-value">{customerInfo.phone}</span>
                </div>
              )}
              {customerInfo.email && (
                <div className="summary-item">
                  <span className="summary-label">Email:</span>
                  <span className="summary-value">{customerInfo.email}</span>
                </div>
              )}
              {!customerInfo.fullName && !customerInfo.phone && !customerInfo.email && (
                <div className="summary-empty">Chưa có thông tin</div>
              )}
            </div>
          </div>
        )}

        {/* Service Info */}
        <div className="summary-section">
          <div className="summary-section-header">
            <Wrench size={18} />
            <h4 className="summary-section-title">Dịch vụ</h4>
          </div>
          <div className="summary-section-body">
            {serviceInfo?.services && serviceInfo.services.length > 0 ? (
              <div className="summary-services">
                {serviceInfo.services.map((serviceId, index) => (
                  <div key={index} className="summary-service-item">
                    {loading ? (
                      <span className="summary-loading">Đang tải...</span>
                    ) : (
                      <span className="summary-service-name">
                        {serviceNames[serviceId] || `Dịch vụ #${serviceId}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="summary-empty">Chưa chọn dịch vụ</div>
            )}
            {serviceInfo?.packageId && (
              <div className="summary-package">
                <span className="summary-badge">Gói dịch vụ</span>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="summary-section">
          <div className="summary-section-header">
            <Car size={18} />
            <h4 className="summary-section-title">Thông tin xe</h4>
          </div>
          <div className="summary-section-body">
            {vehicleInfo?.licensePlate ? (
              <>
                <div className="summary-item">
                  <span className="summary-label">Biển số:</span>
                  <span className="summary-value">{vehicleInfo.licensePlate}</span>
                </div>
                {vehicleInfo.carModel && (
                  <div className="summary-item">
                    <span className="summary-label">Model/VIN:</span>
                    <span className="summary-value">{vehicleInfo.carModel}</span>
                  </div>
                )}
                {vehicleInfo.mileage && (
                  <div className="summary-item">
                    <span className="summary-label">Số km:</span>
                    <span className="summary-value">{Number(vehicleInfo.mileage).toLocaleString('vi-VN')} km</span>
                  </div>
                )}
              </>
            ) : (
              <div className="summary-empty">Chưa có thông tin xe</div>
            )}
          </div>
        </div>

        {/* Location & Time Info */}
        <div className="summary-section">
          <div className="summary-section-header">
            <MapPin size={18} />
            <h4 className="summary-section-title">Địa điểm & Thời gian</h4>
          </div>
          <div className="summary-section-body">
            {locationTimeInfo?.centerId ? (
              <>
                {centerName && (
                  <div className="summary-item">
                    <span className="summary-label">Trung tâm:</span>
                    <span className="summary-value">{centerName}</span>
                  </div>
                )}
                {technicianName && (
                  <div className="summary-item">
                    <span className="summary-label">Kỹ thuật viên:</span>
                    <span className="summary-value">{technicianName}</span>
                  </div>
                )}
                {locationTimeInfo.date && (
                  <div className="summary-item">
                    <Calendar size={14} />
                    <span className="summary-value">{formatDate(locationTimeInfo.date)}</span>
                  </div>
                )}
                {locationTimeInfo.time && (
                  <div className="summary-item">
                    <Clock size={14} />
                    <span className="summary-value">{locationTimeInfo.time}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="summary-empty">Chưa chọn địa điểm và thời gian</div>
            )}
          </div>
        </div>

        {/* Promotion Info */}
        {promotionInfo?.promotionCode && promotionInfo.discountAmount && promotionInfo.discountAmount > 0 && (
          <div className="summary-section promotion-section">
            <div className="summary-section-header">
              <Tag size={18} />
              <h4 className="summary-section-title">Mã khuyến mãi</h4>
            </div>
            <div className="summary-section-body">
              <div className="summary-item">
                <span className="summary-label">Mã:</span>
                <span className="summary-value promotion-code">{promotionInfo.promotionCode}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Giảm giá:</span>
                <span className="summary-value promotion-discount">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(promotionInfo.discountAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .booking-summary {
          position: sticky;
          top: 20px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 18px;
          margin-top: 18.2rem;
          padding: 1.5rem;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.28);
          backdrop-filter: blur(14px) saturate(160%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
        }

        .summary-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .summary-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.025em;
        }

        .summary-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .summary-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .summary-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid #e5e7eb;
        }

        .summary-section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .summary-section-header svg {
          color: var(--progress-current, #1ec774);
        }

        .summary-section-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .summary-section-body {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .summary-item svg {
          color: #64748b;
          flex-shrink: 0;
        }

        .summary-label {
          color: #64748b;
          font-weight: 500;
          min-width: 80px;
        }

        .summary-value {
          color: #0f172a;
          font-weight: 600;
          flex: 1;
        }

        .summary-services {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .summary-service-item {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
        }

        .summary-service-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
        }

        .summary-package {
          margin-top: 0.5rem;
        }

        .summary-badge {
          display: inline-block;
          background: var(--progress-current, #1ec774);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .summary-empty {
          color: #94a3b8;
          font-size: 0.875rem;
          font-style: italic;
          text-align: center;
          padding: 0.5rem;
        }

        .summary-loading {
          color: #64748b;
          font-size: 0.875rem;
        }

        .promotion-section {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #86efac;
        }

        .promotion-code {
          color: var(--progress-current, #1ec774);
          font-weight: 700;
          font-size: 0.9375rem;
        }

        .promotion-discount {
          color: #16a34a;
          font-weight: 700;
          font-size: 0.9375rem;
        }

        /* Scrollbar styling */
        .booking-summary::-webkit-scrollbar {
          width: 6px;
        }

        .booking-summary::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .booking-summary::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .booking-summary::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (max-width: 1024px) {
          .booking-summary {
            position: relative;
            top: 0;
            max-height: none;
          }
        }
      `}</style>
    </div>
  )
}

export default BookingSummary


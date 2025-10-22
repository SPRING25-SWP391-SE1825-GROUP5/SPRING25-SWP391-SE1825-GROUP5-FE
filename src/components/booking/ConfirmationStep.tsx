import React, { useEffect, useState } from 'react'
import { ServiceManagementService } from '@/services/serviceManagementService'
import { PayOSService } from '@/services/payOSService'

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
  isSubmitting?: boolean
  paymentUrl?: string
  showQRCode?: boolean
}

interface ServiceInfo {
  id: number
  name: string
  price: number
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ data, isGuest, onSubmit, onPrev, isSubmitting = false, paymentUrl, showQRCode }) => {
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
      
      {/* Enhanced PayOS QR Code Section */}
      {showQRCode && paymentUrl && (
        <div className="qr-payment-section">
          <div className="qr-payment-header">
            <div className="qr-title-wrapper">
              <h3>💳 Thanh toán qua QR Code</h3>
              <div className="payos-branding">
                <span className="brand-badge">PayOS</span>
                <span className="brand-text">Thanh toán an toàn & nhanh chóng</span>
              </div>
            </div>
          </div>
          
          <div className="qr-code-wrapper">
            <div className="qr-code-container">
              <div className="qr-code-frame">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`}
                  alt="VietQR Code thanh toán" 
                  className="qr-code-image"
                />
                <div className="qr-scan-indicator">
                  <div className="scan-line"></div>
                </div>
              </div>
              <div className="qr-code-info">
                <small className="qr-type">VietQR - Quét bằng app ngân hàng</small>
                <div className="qr-status">
                  <span className="status-dot"></span>
                  <span>Sẵn sàng thanh toán</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="qr-instructions">
            <h4>📱 Hướng dẫn thanh toán:</h4>
            <div className="instruction-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>Mở app ngân hàng</strong>
                  <span>MB Bank, Techcombank, Vietcombank...</span>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>Quét mã QR</strong>
                  <span>Chọn tính năng quét QR trong app</span>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>Xác nhận thanh toán</strong>
                  <span>Kiểm tra thông tin và hoàn tất</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="qr-actions">
            <button 
              type="button" 
              onClick={() => {
                navigator.clipboard.writeText(paymentUrl)
                // Add success feedback
              }}
              className="btn-secondary action-btn"
            >
              <span className="btn-icon">📋</span>
              Sao chép link
            </button>
            <button 
              type="button" 
              onClick={() => window.open(paymentUrl, '_blank')}
              className="btn-primary action-btn"
            >
              <span className="btn-icon">🚀</span>
              Mở PayOS
            </button>
          </div>
          
          <div className="payment-info">
            <h4>💰 Thông tin thanh toán</h4>
            <div className="payment-details">
              <div className="payment-row">
                <span className="payment-label">Booking ID:</span>
                <span className="payment-value">#{data.bookingId || 'N/A'}</span>
              </div>
              <div className="payment-row highlight">
                <span className="payment-label">Số tiền:</span>
                <span className="payment-value amount">{formatPrice(totalPrice)}</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Phương thức:</span>
                <span className="payment-value method">VietQR</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Trạng thái:</span>
                <span className="payment-value status-pending">
                  <span className="status-indicator"></span>
                  Chờ thanh toán
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận và thanh toán'}
          </button>
        </div>
      </form>
      
      <style>{`
        .qr-payment-section {
          margin: 2rem 0;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .qr-payment-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          pointer-events: none;
        }
        
        .qr-payment-header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }
        
        .qr-title-wrapper h3 {
          margin: 0 0 1rem 0;
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .payos-branding {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .brand-badge {
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }
        
        .brand-text {
          color: rgba(255,255,255,0.9);
          font-size: 0.875rem;
        }
        
        .qr-code-wrapper {
          display: flex;
          justify-content: center;
          margin: 2rem 0;
          position: relative;
          z-index: 1;
        }
        
        .qr-code-container {
          text-align: center;
          position: relative;
        }
        
        .qr-code-frame {
          position: relative;
          display: inline-block;
          padding: 1rem;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        .qr-code-image {
          width: 200px;
          height: 200px;
          border-radius: 12px;
          display: block;
        }
        
        .qr-scan-indicator {
          position: absolute;
          top: 1rem;
          left: 1rem;
          right: 1rem;
          height: 2px;
          background: linear-gradient(90deg, transparent, #667eea, transparent);
          animation: scan 2s infinite;
        }
        
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(200px); opacity: 0; }
        }
        
        .qr-code-info {
          margin-top: 1rem;
          color: white;
        }
        
        .qr-type {
          display: block;
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
        }
        
        .qr-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: blink 1.5s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        
        .qr-instructions {
          margin: 2rem 0;
          position: relative;
          z-index: 1;
        }
        
        .qr-instructions h4 {
          margin: 0 0 1.5rem 0;
          color: white;
          font-size: 1.125rem;
          text-align: center;
        }
        
        .instruction-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .step {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255,255,255,0.1);
          padding: 1rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease;
        }
        
        .step:hover {
          transform: translateX(5px);
          background: rgba(255,255,255,0.15);
        }
        
        .step-number {
          width: 32px;
          height: 32px;
          background: white;
          color: #667eea;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        
        .step-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .step-content strong {
          color: white;
          font-size: 0.875rem;
        }
        
        .step-content span {
          color: rgba(255,255,255,0.8);
          font-size: 0.75rem;
        }
        
        .qr-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin: 2rem 0;
          position: relative;
          z-index: 1;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        
        .btn-secondary {
          background: rgba(255,255,255,0.2);
          color: white;
          backdrop-filter: blur(10px);
        }
        
        .btn-secondary:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }
        
        .btn-primary {
          background: white;
          color: #667eea;
        }
        
        .btn-primary:hover {
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .btn-icon {
          font-size: 1rem;
        }
        
        .payment-info {
          background: rgba(255,255,255,0.1);
          padding: 1.5rem;
          border-radius: 16px;
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 1;
        }
        
        .payment-info h4 {
          margin: 0 0 1.5rem 0;
          color: white;
          font-size: 1.125rem;
          text-align: center;
        }
        
        .payment-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        
        .payment-row:hover {
          background: rgba(255,255,255,0.15);
        }
        
        .payment-row.highlight {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
        }
        
        .payment-label {
          color: rgba(255,255,255,0.9);
          font-size: 0.875rem;
        }
        
        .payment-value {
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .payment-value.amount {
          font-size: 1rem;
          color: #fbbf24;
        }
        
        .payment-value.method {
          color: #10b981;
        }
        
        .status-pending {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fbbf24;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          background: #fbbf24;
          border-radius: 50%;
          animation: blink 1.5s infinite;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .qr-payment-section {
            margin: 1rem 0;
            padding: 1.5rem;
            border-radius: 16px;
          }
          
          .qr-code-image {
            width: 180px;
            height: 180px;
          }
          
          .instruction-steps {
            gap: 0.75rem;
          }
          
          .step {
            padding: 0.75rem;
          }
          
          .qr-actions {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default ConfirmationStep
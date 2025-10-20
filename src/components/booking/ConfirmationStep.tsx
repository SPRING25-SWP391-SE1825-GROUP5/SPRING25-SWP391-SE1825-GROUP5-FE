import React from 'react'

interface BookingData {
  customerInfo: {
    fullName: string
    phone: string
    email: string
  }
  vehicleInfo: {
    carModel: string
    mileage: string
    licensePlate: string
  }
  serviceInfo: {
    services: string[]
    notes: string
  }
  locationTimeInfo: {
    province: string
    ward: string
    serviceType: 'workshop' | 'mobile'
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
  data: BookingData
  isGuest: boolean
  onSubmit: () => void
  onPrev: () => void
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ data, isGuest, onSubmit, onPrev }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="confirmation-step">
      <h2>Xác nhận đặt lịch</h2>
      <div className="booking-summary">
        <div className="summary-section">
          <h3>Thông tin khách hàng</h3>
          <p><strong>Họ tên:</strong> {data.customerInfo.fullName}</p>
          <p><strong>SĐT:</strong> {data.customerInfo.phone}</p>
          <p><strong>Email:</strong> {data.customerInfo.email}</p>
        </div>
        
        <div className="summary-section">
          <h3>Thông tin xe</h3>
          <p><strong>Dòng xe:</strong> {data.vehicleInfo.carModel}</p>
          <p><strong>Biển số:</strong> {data.vehicleInfo.licensePlate}</p>
          {data.vehicleInfo.mileage && <p><strong>Số km:</strong> {data.vehicleInfo.mileage}</p>}
        </div>
        
        <div className="summary-section">
          <h3>Dịch vụ</h3>
          <ul>
            {data.serviceInfo.services.map(service => (
              <li key={service}>{service}</li>
            ))}
          </ul>
          {data.serviceInfo.notes && <p><strong>Ghi chú:</strong> {data.serviceInfo.notes}</p>}
        </div>
        
        <div className="summary-section">
          <h3>Thời gian & Địa điểm</h3>
          <p><strong>Ngày:</strong> {data.locationTimeInfo.date}</p>
          <p><strong>Giờ:</strong> {data.locationTimeInfo.time}</p>
          <p><strong>Loại:</strong> {data.locationTimeInfo.serviceType === 'workshop' ? 'Tại xưởng' : 'Tại nhà'}</p>
          <p><strong>Địa điểm:</strong> {data.locationTimeInfo.ward}, {data.locationTimeInfo.province}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button type="submit" className="btn-primary">
            Xác nhận đặt lịch
          </button>
        </div>
      </form>
    </div>
  )
}

export default ConfirmationStep
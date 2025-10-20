import React from 'react'

interface CustomerInfo {
  fullName: string
  phone: string
  email: string
}

interface CustomerInfoStepProps {
  data: CustomerInfo
  onUpdate: (data: Partial<CustomerInfo>) => void
  onNext: () => void
}

const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({ data, onUpdate, onNext }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.fullName && data.phone && data.email) {
      onNext()
    }
  }

  return (
    <div className="customer-info-step">
      <h2>Thông tin khách hàng</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Họ và tên *</label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => onUpdate({ fullName: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Số điện thoại *</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          Tiếp theo
        </button>
      </form>
    </div>
  )
}

export default CustomerInfoStep
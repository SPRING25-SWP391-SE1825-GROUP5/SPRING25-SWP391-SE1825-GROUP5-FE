import React from 'react'

interface ServiceInfo {
  services: string[]
  notes: string
}

interface ServiceSelectionStepProps {
  data: ServiceInfo
  onUpdate: (data: Partial<ServiceInfo>) => void
  onNext: () => void
  onPrev: () => void
}

const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ data, onUpdate, onNext, onPrev }) => {
  const availableServices = [
    { id: 'battery-check', name: 'Kiểm tra pin' },
    { id: 'motor-check', name: 'Kiểm tra động cơ' },
    { id: 'brake-check', name: 'Kiểm tra phanh' },
    { id: 'tire-check', name: 'Kiểm tra lốp' },
    { id: 'charging-check', name: 'Kiểm tra hệ thống sạc' }
  ]

  const handleServiceToggle = (serviceId: string) => {
    const newServices = data.services.includes(serviceId)
      ? data.services.filter(id => id !== serviceId)
      : [...data.services, serviceId]
    onUpdate({ services: newServices })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.services.length > 0) {
      onNext()
    }
  }

  return (
    <div className="service-selection-step">
      <h2>Chọn dịch vụ</h2>
      <form onSubmit={handleSubmit}>
        <div className="service-list">
          {availableServices.map(service => (
            <label key={service.id} className="service-item">
              <input
                type="checkbox"
                checked={data.services.includes(service.id)}
                onChange={() => handleServiceToggle(service.id)}
              />
              <span>{service.name}</span>
            </label>
          ))}
        </div>
        <div className="form-group">
          <label>Ghi chú thêm</label>
          <textarea
            value={data.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            rows={3}
          />
        </div>
        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button type="submit" className="btn-primary">
            Tiếp theo
          </button>
        </div>
      </form>
    </div>
  )
}

export default ServiceSelectionStep
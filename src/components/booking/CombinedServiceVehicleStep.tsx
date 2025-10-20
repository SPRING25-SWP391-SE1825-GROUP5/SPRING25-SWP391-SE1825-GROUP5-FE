import React from 'react'

interface VehicleInfo {
  carModel: string
  mileage: string
  licensePlate: string
}

interface ServiceInfo {
  services: string[]
  notes: string
}

interface CombinedServiceVehicleStepProps {
  vehicleData: VehicleInfo
  serviceData: ServiceInfo
  onUpdateVehicle: (data: Partial<VehicleInfo>) => void
  onUpdateService: (data: Partial<ServiceInfo>) => void
  onNext: () => void
  onPrev: () => void
}

const CombinedServiceVehicleStep: React.FC<CombinedServiceVehicleStepProps> = ({
  vehicleData,
  serviceData,
  onUpdateVehicle,
  onUpdateService,
  onNext,
  onPrev
}) => {
  const availableServices = [
    { id: 'battery-check', name: 'Kiểm tra pin' },
    { id: 'motor-check', name: 'Kiểm tra động cơ' },
    { id: 'brake-check', name: 'Kiểm tra phanh' },
    { id: 'tire-check', name: 'Kiểm tra lốp' },
    { id: 'charging-check', name: 'Kiểm tra hệ thống sạc' }
  ]

  const handleServiceToggle = (serviceId: string) => {
    // Single-select behavior (radio-like): keep at most one service
    const isSelected = serviceData.services[0] === serviceId
    const newServices = isSelected ? [] : [serviceId]
    onUpdateService({ services: newServices })
  }

  const canProceed = () => {
    return (
      serviceData.services.length > 0 &&
      !!vehicleData.carModel &&
      !!vehicleData.licensePlate
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed()) onNext()
  }

  return (
    <div className="combined-service-vehicle-step">
      <h2 className="csv-title">Dịch vụ & Thông tin xe</h2>
      <form onSubmit={handleSubmit} className="csv-grid">
        <div className="csv-section card">
          <h3 className="csv-section-title">Chọn dịch vụ</h3>
          <div className="service-list">
            {availableServices.map(service => (
              <label key={service.id} className="service-item">
                <input
                  type="checkbox"
                  checked={serviceData.services[0] === service.id}
                  onChange={() => handleServiceToggle(service.id)}
                />
                <span>{service.name}</span>
              </label>
            ))}
          </div>
          <div className="form-group">
            <label>Ghi chú thêm</label>
            <textarea
              value={serviceData.notes}
              onChange={(e) => onUpdateService({ notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="csv-section card">
          <h3 className="csv-section-title">Thông tin xe</h3>
          <div className="form-group">
            <label>Dòng xe *</label>
            <select
              value={vehicleData.carModel}
              onChange={(e) => onUpdateVehicle({ carModel: e.target.value })}
              required
            >
              <option value="">Chọn dòng xe</option>
              <option value="autoev-s1">AutoEV S1</option>
              <option value="autoev-s2">AutoEV S2</option>
              <option value="autoev-x">AutoEV X</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div className="form-group">
            <label>Số km đã đi</label>
            <input
              type="text"
              value={vehicleData.mileage}
              onChange={(e) => onUpdateVehicle({ mileage: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Biển số xe *</label>
            <input
              type="text"
              value={vehicleData.licensePlate}
              onChange={(e) => onUpdateVehicle({ licensePlate: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button type="submit" className="btn-primary" disabled={!canProceed()}>
            Tiếp theo
          </button>
        </div>
      </form>

      <style>{`
        .csv-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 1.25rem 0; }
        .csv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .card { background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
        .csv-section-title { margin: 0 0 .75rem 0; font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
        .service-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem 1rem; margin-bottom: 1rem; }
        .service-item { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
        .service-item input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
        .service-item span { display: inline-block; padding: .5rem .75rem; border: 1px solid var(--border-primary); border-radius: 999px; background: #fff; color: var(--text-primary); transition: all .2s ease; user-select: none; }
        .service-item:hover span { box-shadow: 0 2px 6px rgba(0,0,0,.06); }
        .service-item input:checked + span { background: var(--progress-current); color: #fff; border-color: var(--progress-current); }
        .service-item input:focus-visible + span { outline: 2px solid var(--progress-current); outline-offset: 2px; }
        .form-group { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }
        .form-group input[type="text"], .form-group select, .form-group textarea { width: 100%; background: #fff; border: 1px solid var(--border-primary); color: var(--text-primary); border-radius: 8px; padding: .6rem .75rem; }
        .form-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
        @media (max-width: 768px) { .csv-grid { grid-template-columns: 1fr; } .form-actions { justify-content: stretch; } }
      `}</style>
    </div>
  )
}

export default CombinedServiceVehicleStep



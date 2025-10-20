import React from 'react'

interface VehicleInfo {
  carModel: string
  mileage: string
  licensePlate: string
}

interface VehicleInfoStepProps {
  data: VehicleInfo
  onUpdate: (data: Partial<VehicleInfo>) => void
  onNext: () => void
  onPrev: () => void
}

const VehicleInfoStep: React.FC<VehicleInfoStepProps> = ({ data, onUpdate, onNext, onPrev }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.carModel && data.licensePlate) {
      onNext()
    }
  }

  return (
    <div className="vehicle-info-step">
      <h2>Thông tin xe</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Dòng xe *</label>
          {/* Dropdown - sẽ gắn API master data sau */}
          <select
            value={data.carModel}
            onChange={(e) => onUpdate({ carModel: e.target.value })}
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
            value={data.mileage}
            onChange={(e) => onUpdate({ mileage: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Biển số xe *</label>
          <input
            type="text"
            value={data.licensePlate}
            onChange={(e) => onUpdate({ licensePlate: e.target.value })}
            required
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

export default VehicleInfoStep
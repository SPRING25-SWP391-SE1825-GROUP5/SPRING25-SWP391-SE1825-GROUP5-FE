import React from 'react'

interface LocationTimeInfo {
  province: string
  ward: string
  serviceType: 'workshop' | 'mobile'
  date: string
  time: string
}

interface LocationTimeStepProps {
  data: LocationTimeInfo
  onUpdate: (data: Partial<LocationTimeInfo>) => void
  onNext: () => void
  onPrev: () => void
}

const LocationTimeStep: React.FC<LocationTimeStepProps> = ({ data, onUpdate, onNext, onPrev }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.province && data.ward && data.date && data.time) {
      onNext()
    }
  }

  return (
    <div className="location-time-step">
      <h2>Địa điểm và thời gian</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Tỉnh/Thành phố *</label>
          <select
            value={data.province}
            onChange={(e) => onUpdate({ province: e.target.value })}
            required
          >
            <option value="">Chọn tỉnh/thành phố</option>
            <option value="hcm">TP. Hồ Chí Minh</option>
            <option value="hn">Hà Nội</option>
            <option value="dn">Đà Nẵng</option>
          </select>
        </div>
        <div className="form-group">
          <label>Quận/Huyện *</label>
          <input
            type="text"
            value={data.ward}
            onChange={(e) => onUpdate({ ward: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Loại dịch vụ *</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="workshop"
                checked={data.serviceType === 'workshop'}
                onChange={(e) => onUpdate({ serviceType: e.target.value as 'workshop' | 'mobile' })}
              />
              Tại xưởng
            </label>
            <label>
              <input
                type="radio"
                value="mobile"
                checked={data.serviceType === 'mobile'}
                onChange={(e) => onUpdate({ serviceType: e.target.value as 'workshop' | 'mobile' })}
              />
              Tại nhà
            </label>
          </div>
        </div>
        <div className="form-group">
          <label>Ngày *</label>
          <input
            type="date"
            value={data.date}
            onChange={(e) => onUpdate({ date: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Giờ *</label>
          <input
            type="time"
            value={data.time}
            onChange={(e) => onUpdate({ time: e.target.value })}
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

export default LocationTimeStep
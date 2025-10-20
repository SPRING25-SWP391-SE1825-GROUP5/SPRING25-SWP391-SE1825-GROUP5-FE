import React, { useMemo, useState } from 'react'

interface LocationTimeInfo {
  centerId: string
  technicianId: string
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
  const today = new Date()
  const [month, setMonth] = useState<number>(today.getMonth())
  const [year, setYear] = useState<number>(today.getFullYear())
  
  // Demo danh sách trung tâm với toạ độ (sau sẽ lấy từ API)
  const centers = [
    { id: 'ct-1', name: 'AutoEV Center Quận 1', lat: 10.7756587, lng: 106.7004238, query: 'AutoEV Center Quận 1' },
    { id: 'ct-2', name: 'AutoEV Center Quận 7', lat: 10.737, lng: 106.721, query: 'AutoEV Center Quận 7' },
    { id: 'ct-3', name: 'AutoEV Center Thủ Đức', lat: 10.849, lng: 106.768, query: 'AutoEV Center Thủ Đức' }
  ]

  // Demo technicians
  const technicians = [
    { id: 't-1', name: 'Nguyễn Văn A', specialty: 'Pin & Điện', avatar: 'https://i.pravatar.cc/80?img=12' },
    { id: 't-2', name: 'Trần Văn B', specialty: 'Động cơ & Truyền động', avatar: 'https://i.pravatar.cc/80?img=14' },
    { id: 't-3', name: 'Lê Văn C', specialty: 'Hệ thống phanh', avatar: 'https://i.pravatar.cc/80?img=16' }
  ]

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      // Tìm trung tâm gần nhất
      let best = centers[0]
      let bestKm = haversineKm(latitude, longitude, centers[0].lat, centers[0].lng)
      for (let i = 1; i < centers.length; i++) {
        const km = haversineKm(latitude, longitude, centers[i].lat, centers[i].lng)
        if (km < bestKm) { bestKm = km; best = centers[i] }
      }
      onUpdate({ centerId: best.id, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` })
    })
  }

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const leading = (firstDay.getDay() + 6) % 7 // convert Sunday=0 to Monday=0
    const total = leading + lastDay.getDate()
    const rows = Math.ceil(total / 7)
    const grid: Array<{ date: Date | null, disabled: boolean }[]> = []
    let day = 1
    for (let r = 0; r < rows; r++) {
      const row: { date: Date | null, disabled: boolean }[] = []
      for (let c = 0; c < 7; c++) {
        const index = r * 7 + c
        if (index < leading || day > lastDay.getDate()) {
          row.push({ date: null, disabled: true })
        } else {
          const d = new Date(year, month, day)
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          row.push({ date: d, disabled: isPast })
          day++
        }
      }
      grid.push(row)
    }
    return grid
  }, [month, year])

  const formatISO = (d: Date) => {
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.centerId && data.technicianId && data.date && data.time) {
      onNext()
    }
  }

  return (
    <div className="location-time-step">
      <h2>Địa điểm và thời gian</h2>
      <form onSubmit={handleSubmit} className="lt-grid">
        <div className="form-group lt-center">
          <label>Trung tâm gần bạn *</label>
          <select
            value={data.centerId}
            onChange={(e) => onUpdate({ centerId: e.target.value })}
            required
          >
            <option value="">Chọn trung tâm</option>
            {centers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="button" className="btn-secondary small" onClick={useMyLocation} disabled={(data.address || '').trim().length > 0}>
            Dùng vị trí của tôi
          </button>
        </div>
        <div className="form-group form-group--map lt-address-map">
          <label>Địa chỉ của bạn</label>
          <input
            type="text"
            value={data.address || ''}
            onChange={(e) => onUpdate({ address: e.target.value })}
            placeholder="Nhập số nhà, đường, phường/xã..."
          />
          <div className="map-container">
            {/* Google Maps embed không cần API key (output=embed). Có thể thay bằng Leaflet/OSM sau */}
            <iframe
              title="map"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent((centers.find(c=>c.id===data.centerId)?.query) || data.address || 'AutoEV Center')}&output=embed`}
            />
          </div>
        </div>
        <div className="form-group lt-tech">
          <label>Kỹ thuật viên *</label>
          <div className="tech-list">
            {technicians.map(t => (
              <button
                key={t.id}
                type="button"
                className={`tech-item ${data.technicianId === t.id ? 'selected' : ''}`}
                onClick={() => onUpdate({ technicianId: t.id })}
              >
                <img src={t.avatar} alt={t.name} className="tech-avatar" />
                <div className="tech-meta">
                  <div className="tech-name">{t.name}</div>
                  <div className="tech-specialty">{t.specialty}</div>
                </div>
              </button>
            ))}
          </div>
          <input type="hidden" value={data.technicianId} required readOnly />
        </div>
        <div className="form-group lt-calendar">
          <label>Ngày *</label>
          <div className="calendar">
            <div className="calendar-header">
              <button type="button" className="cal-nav" onClick={() => setMonth(m => m === 0 ? (setYear(y => y - 1), 11) : m - 1)}>&lt;</button>
              <div className="cal-title">{new Date(year, month).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}</div>
              <button type="button" className="cal-nav" onClick={() => setMonth(m => m === 11 ? (setYear(y => y + 1), 0) : m + 1)}>&gt;</button>
            </div>
            <div className="calendar-grid">
              {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
                <div key={d} className="cal-weekday">{d}</div>
              ))}
              {days.flat().map((cell, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`cal-cell ${cell.date ? '' : 'empty'} ${cell.disabled ? 'disabled' : ''} ${cell.date && data.date === formatISO(cell.date) ? 'selected' : ''}`}
                  onClick={() => cell.date && !cell.disabled && onUpdate({ date: formatISO(cell.date) })}
                  disabled={!cell.date || cell.disabled}
                >
                  {cell.date ? cell.date.getDate() : ''}
                </button>
              ))}
            </div>
          </div>
          <input type="hidden" value={data.date} required readOnly />
        </div>
        <div className="form-group lt-times">
          <label>Khung giờ *</label>
          {/* Time slots - demo, sẽ bind API */}
          <div className="time-slots">
            {['08:00','09:00','10:00','13:00','14:00','15:00','16:00'].map(slot => (
              <button
                key={slot}
                type="button"
                className={`time-slot ${data.time === slot ? 'selected' : ''}`}
                onClick={() => onUpdate({ time: slot })}
              >
                {slot}
              </button>
            ))}
          </div>
          <input type="hidden" value={data.time} required readOnly />
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
import { useEffect, useMemo, useState } from 'react'
import { BaseButton } from '@/components/common'
import './booking.scss'

export default function Booking() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null)
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [selectedCenter, setSelectedCenter] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('')

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearestSuggestion, setNearestSuggestion] = useState<{ centerId: number; distanceKm: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)


  const userVehicles = [
    { id: 1, model: 'Tesla Model 3', year: 2023, licensePlate: '30A-123.45', vin: 'WVWZZZ1JZ3W386752', mileage: 15000, lastService: '2024-01-15' },
    { id: 2, model: 'VinFast VF8', year: 2024, licensePlate: '29A-678.90', vin: 'WVWZZZ1JZ3W386753', mileage: 8500, lastService: '2024-02-20' },
  ]

  const serviceCategories = [
    { id: 1, name: 'Bảo dưỡng định kỳ', services: [
      { id: 1, name: 'Bảo dưỡng 10,000km', description: 'Kiểm tra hệ thống điện, phanh, lốp xe', estimatedDuration: '2 giờ', price: 1500000 },
      { id: 2, name: 'Bảo dưỡng 20,000km', description: 'Bảo dưỡng toàn diện, thay dầu phanh', estimatedDuration: '3 giờ', price: 2500000 },
    ]},
    { id: 2, name: 'Sửa chữa', services: [
      { id: 3, name: 'Kiểm tra pin', description: 'Chẩn đoán và kiểm tra hệ thống pin', estimatedDuration: '1 giờ', price: 800000 },
      { id: 4, name: 'Sửa chữa hệ thống điện', description: 'Khắc phục sự cố hệ thống điện', estimatedDuration: '4 giờ', price: 3000000 },
    ]},
  ]

  const serviceCenters = [
    { id: 1, name: 'EV Service Hà Nội', address: '123 Đường ABC, Cầu Giấy, Hà Nội', lat: 21.028511, lng: 105.804817 },
    { id: 2, name: 'EV Service TP.HCM', address: '456 Đường XYZ, Quận 1, TP.HCM', lat: 10.776889, lng: 106.700806 },
  ]

  const centerStaff: Record<string, { id: string; name: string }[]> = {
    '1': [
      { id: '1', name: 'Nguyễn Văn A' },
      { id: '2', name: 'Trần Thị B' },
      { id: '3', name: 'Phạm Văn C' },
    ],
    '2': [
      { id: '4', name: 'Lê Thị D' },
      { id: '5', name: 'Hoàng Văn E' },
    ],
  }


  function getCenterById(id: string) {
    return serviceCenters.find((c) => String(c.id) === String(id)) || null
  }

  // Haversine utilities (km)
  function toRad(d: number) { return d * Math.PI / 180 }
  function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const s1 = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(s1))
  }

  const availableSlots = [
    { time: '08:00', available: true },
    { time: '09:00', available: false },
    { time: '10:00', available: true },
    { time: '11:00', available: true },
    { time: '13:00', available: true },
    { time: '14:00', available: false },
    { time: '15:00', available: true },
    { time: '16:00', available: true },
  ]

  const minDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
  }, [])

  const totalPrice = useMemo(() => selectedServices.reduce((t: number, id: number) => t + getServicePrice(id), 0), [selectedServices])

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN')
  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return ''
    const dateObj = new Date(date)
    return `${dateObj.toLocaleDateString('vi-VN')} lúc ${time}`
  }

  // Locate user and suggest nearest center
  useEffect(() => {
    setIsLocating(true)
    if (!navigator.geolocation) {
      setIsLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        // compute nearest
        let best: { centerId: number; distanceKm: number } | null = null

        for (const c of serviceCenters) {
          if (typeof c.lat !== 'number' || typeof c.lng !== 'number') continue
          const d = haversineKm(loc, { lat: c.lat, lng: c.lng })
          if (!best || d < best.distanceKm) best = { centerId: Number(c.id), distanceKm: d }
        }
        setNearestSuggestion(best)
        // Auto select if user chưa chọn
        if (best && !selectedCenter) setSelectedCenter(String(best.centerId))
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatKm = (km: number) => `${km.toFixed(1)} km`

  // Reset dependent selections
  useEffect(() => {
    // When center changes, reset staff and slot
    setSelectedStaff('')
    setSelectedSlot('')
  }, [selectedCenter])

  useEffect(() => {
    // When date changes, reset slot
    setSelectedSlot('')
  }, [selectedDate])

  function getStaffName(id: string) {
    const list = centerStaff[selectedCenter] || []
    const found = list.find((s) => String(s.id) === String(id))
    return found ? found.name : ''
  }


  function toggleService(id: number) {
    setSelectedServices((prev: number[]) => prev.includes(id) ? prev.filter((x: number) => x !== id) : [...prev, id])
  }
  function nextStep() { if (currentStep < 4) setCurrentStep(currentStep + 1) }
  function prevStep() { if (currentStep > 1) setCurrentStep(currentStep - 1) }
  function getServiceName(id: number) { for (const c of serviceCategories) { const s = c.services.find(s => s.id === id); if (s) return s.name } return '' }
  function getServicePrice(id: number) { for (const c of serviceCategories) { const s = c.services.find(s => s.id === id); if (s) return s.price } return 0 }
  function getCenterName(id: string) { const c = serviceCenters.find(c => String(c.id) === String(id)); return c ? c.name : '' }

  async function confirmBooking() {
    setIsSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 1500))
      alert('Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.')
      // TODO: navigate to maintenance-history if needed
    } catch (e) {
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="booking-page" style={{ minHeight: '100vh', padding: '2rem 0', background: 'linear-gradient(135deg, #FFF9E5 0%, #F8F9FA 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#004030', marginBottom: '0.5rem' }}>Đặt Lịch Bảo Dưỡng</h1>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>Chọn dịch vụ và thời gian phù hợp cho xe điện của bạn</p>
        </div>

        <div className="booking-content">
          {/* Steps indicator */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            {[1,2,3,4].map((n) => (
              <div key={n} className={`step ${currentStep >= n ? 'active' : ''} ${currentStep > n ? 'completed' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-card)' }}>
                <div className="step-number" style={{ width: 28, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-500)', color: 'var(--text-inverse)', fontWeight: 700 }}>{n}</div>
                <div className="step-label" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {n === 1 ? 'Chọn xe' : n === 2 ? 'Chọn dịch vụ' : n === 3 ? 'Chọn thời gian' : 'Xác nhận'}
                </div>
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="booking-step">
              <h2>Chọn xe cần bảo dưỡng</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {userVehicles.map((vehicle) => (
                  <div key={vehicle.id} className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`} style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-primary)', cursor: 'pointer' }} onClick={() => setSelectedVehicle(vehicle)}>
                    <div className="vehicle-info">
                      <h3>{vehicle.model}</h3>
                      <p className="vehicle-details">{vehicle.year} • {vehicle.licensePlate}</p>
                      <p className="vehicle-vin">VIN: {vehicle.vin}</p>
                      <div className="vehicle-status">
                        <span className="mileage">{vehicle.mileage.toLocaleString()} km</span>
                        <span className="last-service">Bảo dưỡng cuối: {formatDate(vehicle.lastService)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <BaseButton onClick={nextStep} disabled={!selectedVehicle} size="lg">Tiếp theo</BaseButton>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="booking-step">
              <h2>Chọn dịch vụ</h2>
              <div className="service-toolbar">
                <label>
                  Loại hình dịch vụ
                  <select
                    value={selectedServiceCategory}
                    onChange={(e) => setSelectedServiceCategory(e.target.value)}
                    className="select-control"
                  >
                    <option value="">Tất cả</option>
                    {serviceCategories.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="service-categories">
                {(selectedServiceCategory
                  ? serviceCategories.filter((c) => String(c.id) === String(selectedServiceCategory))
                  : serviceCategories
                ).map((category) => (
                  <div key={category.id} className="service-category">
                    <h3>{category.name}</h3>
                    <div className="service-list">
                      {category.services.map((service) => (
                        <label key={service.id} className={`service-item ${selectedServices.includes(service.id) ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                          />
                          <div className="service-info">
                            <h4>{service.name}</h4>
                            <p>{service.description}</p>
                            <div className="service-details">
                              <span className="chip">⏱️ {service.estimatedDuration}</span>
                              <span className="price">{formatPrice(service.price)}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1rem' }}>
                <BaseButton onClick={prevStep} variant="secondary">Quay lại</BaseButton>
                <BaseButton onClick={nextStep} disabled={selectedServices.length === 0} size="lg">Tiếp theo</BaseButton>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="booking-step">
              <h2>Chọn thời gian và trung tâm</h2>
              <div className="time-selection" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="center-selection">
                  <h3>Chi nhánh / Trung tâm dịch vụ</h3>
                  <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} className="select-control">
                    <option value="">Chọn chi nhánh</option>
                    {serviceCenters.map((center) => (
                      <option key={center.id} value={center.id}>{center.name} - {center.address}</option>
                    ))}
                  </select>
                  <div className="nearest-hint">
                    {isLocating && <span>Đang xác định vị trí của bạn…</span>}
                    {!isLocating && nearestSuggestion && (
                      <span>
                        Gợi ý gần nhất: <strong>{getCenterName(String(nearestSuggestion.centerId))}</strong>
                        {` • ${formatKm(nearestSuggestion.distanceKm)}`}
                      </span>
                    )}
                  </div>
                  {selectedCenter && (
                    <div className="staff-selection">
                      <label>Nhân viên kỹ thuật</label>
                      <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="select-control">
                        <option value="">Không chỉ định</option>
                        {(centerStaff[selectedCenter] || []).map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="date-selection">
                  <h3>Chọn ngày</h3>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={minDate} className="input-control" />
                </div>
                {selectedDate && selectedCenter && (
                  <div style={{ marginTop: '1rem' }}>
                    <h3>Khung giờ trống</h3>
                    <div className="slots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          className={`time-slot ${selectedSlot === slot.time ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.time)}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1rem' }}>
                <BaseButton onClick={prevStep} variant="secondary">Quay lại</BaseButton>
                <BaseButton onClick={nextStep} disabled={!selectedSlot} size="lg">Tiếp theo</BaseButton>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="booking-step confirm-step">
              <h2>Xác nhận đặt lịch</h2>
              <div className="confirm-grid">
                {/* Left column: Ticket + Map */}
                <div className="ticket">
                  <div className="ticket-header">
                    <div className="ticket-brand">EV Service</div>
                    <div className="ticket-status">Đặt lịch</div>
                  </div>
                  <div className="ticket-body">
                    <div className="row">
                      <div className="label">Khách/xe</div>
                      <div className="value">
                        <div className="bold">{selectedVehicle?.model}</div>
                        <div className="muted">{selectedVehicle?.licensePlate} • VIN: {selectedVehicle?.vin}</div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="label">Thời gian</div>
                      <div className="value">{formatDateTime(selectedDate, selectedSlot)}</div>
                    </div>
                    <div className="row">
                      <div className="label">Chi nhánh</div>
                      <div className="value">{getCenterName(selectedCenter)}</div>
                    </div>
                    {selectedStaff && (
                      <div className="row">
                        <div className="label">Nhân viên</div>
                        <div className="value">{getStaffName(selectedStaff)}</div>
                      </div>
                    )}
                  </div>
                  {/* Interactive Map (Leaflet) */}
                  <div className="map-embed">
                    {(() => {
                      const center = getCenterById(selectedCenter) as any
                      if (!center || typeof center.lat !== 'number') return null
                      const branchPos: [number, number] = [center.lat, center.lng]
                      const userPos: [number, number] | null = userLocation ? [userLocation.lat, userLocation.lng] : null
                      const lat = branchPos[0]
                      const lng = branchPos[1]
                      const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`
                      return (
                        <>
                          <iframe
                            title="branch-map"
                            src={mapUrl}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                            style={{ width: '100%', height: 260, border: 0 }}
                          />
                          <div className="map-actions">
                            {(() => {
                              const dest = `${lat},${lng}`
                              const origin = userPos ? `${userPos[0]},${userPos[1]}` : undefined
                              const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`
                              return (
                                <>
                                  {userPos && (
                                    <span className="distance">Khoảng cách ~ {formatKm(haversineKm({ lat: userPos[0], lng: userPos[1] }, { lat, lng }))}</span>
                                  )}
                                  <a className="btn-open-map" href={gmaps} target="_blank" rel="noreferrer">Chỉ đường (Google Maps)</a>
                                </>
                              )
                            })()}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Right column: Services table + Notes + Total */}
                <div className="summary-panel">
                  <h3>Dịch vụ đã chọn</h3>
                  <div className="service-table-wrapper">
                    <table className="service-table">
                      <thead>
                        <tr>
                          <th style={{ width: '55%' }}>Dịch vụ</th>
                          <th style={{ width: '20%' }}>Thời lượng</th>
                          <th style={{ width: '25%', textAlign: 'right' }}>Giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedServices.map((id) => {
                          const name = getServiceName(id)
                          const price = getServicePrice(id)
                          const cat = serviceCategories.find(c => c.services.some(s => s.id === id))
                          const svc = cat?.services.find(s => s.id === id)
                          return (
                            <tr key={id}>
                              <td>{name}</td>
                              <td>{svc?.estimatedDuration || '-'}</td>
                              <td style={{ textAlign: 'right' }}>{formatPrice(price)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} style={{ textAlign: 'right', fontWeight: 700 }}>Tổng cộng</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatPrice(totalPrice)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="notes-block">
                    <label>Ghi chú</label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Mô tả tình trạng xe hoặc yêu cầu đặc biệt..."
                      className="notes-input"
                    />
                  </div>
                </div>
              </div>

              <div className="confirm-actions">
                <BaseButton onClick={prevStep} variant="secondary">Quay lại</BaseButton>
                <BaseButton onClick={confirmBooking} loading={isSubmitting} size="lg">{isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}</BaseButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


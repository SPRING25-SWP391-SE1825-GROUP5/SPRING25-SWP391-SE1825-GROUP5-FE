import React, { useEffect, useMemo, useState } from 'react'
import { Center, CenterService } from '@/services/centerService'
import { getCenterAvailability } from '@/services/bookingFlowService'
import { TechnicianService, TechnicianListItem } from '@/services/technicianService'

interface LocationTimeInfo {
  centerId: string
  technicianId: string
  address?: string
  date: string
  time: string
  technicianSlotId?: number
  serviceId?: number
}

interface LocationTimeStepProps {
  data: LocationTimeInfo
  onUpdate: (data: Partial<LocationTimeInfo>) => void
  onNext: () => void
  onPrev: () => void
  serviceId?: number
}

const LocationTimeStep: React.FC<LocationTimeStepProps> = ({ data, onUpdate, onNext, onPrev, serviceId }) => {
  const today = new Date()
  const [month, setMonth] = useState<number>(today.getMonth())
  const [year, setYear] = useState<number>(today.getFullYear())
  
  const [centers, setCenters] = useState<Array<{ id: string; name: string; lat?: number; lng?: number; query: string }>>([])
  const [slots, setSlots] = useState<Array<{ technicianSlotId: number; slotTime: string; isAvailable: boolean; technicianId?: number }>>([])
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [technicians, setTechnicians] = useState<TechnicianListItem[]>([])
  const [loadingTechs, setLoadingTechs] = useState(false)

  // Load centers from API
  useEffect(() => {
    const loadCenters = async () => {
      setLoadingCenters(true)
      try {
        const res = await CenterService.getActiveCenters()
        const mapped = (res.centers || []).map((c: Center) => ({ id: String(c.centerId), name: c.centerName, query: c.address }))
        setCenters(mapped)
      } catch (e) {
        setCenters([])
      } finally {
        setLoadingCenters(false)
      }
    }
    loadCenters()
  }, [])

  // Demo technicians removed — now load by center via API

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
      if (centers.length > 0) {
        const best = centers[0]
        onUpdate({ centerId: best.id, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` })
      }
    })
  }

  // Load availability when center/date/technician changes
  useEffect(() => {
    const load = async () => {
      if (!data.centerId || !data.date) { setSlots([]); return }
      setLoadingSlots(true)
      try {
        let slotsData: any[] = []
        
        // First try new BE endpoint if present
        try {
          const centerAvail = await TechnicianService.getCenterTechniciansAvailability(
            Number(data.centerId), 
            data.date, 
            serviceId ? { serviceId: serviceId } : undefined
          )
          console.log('Center availability response:', centerAvail)
          if (Array.isArray(centerAvail?.technicianSlots)) {
            slotsData = centerAvail.technicianSlots
            console.log('Using center availability slots:', slotsData)
          }
        } catch (e) { 
          console.log('Center availability failed:', e)
        }

        // If no data from first endpoint and technician selected: fetch their timeslots
        if (slotsData.length === 0 && data.technicianId) {
          try {
            const response = await TechnicianService.getTechnicianTimeSlots(Number(data.technicianId), data.date)
            // API mới trả về TechnicianDailyScheduleResponse[], cần extract TimeSlots
            if (response?.success && Array.isArray(response.data)) {
              // Lấy timeslots từ ngày đầu tiên (vì chỉ query 1 ngày)
              const firstDaySchedule = response.data[0]
              if (firstDaySchedule?.timeSlots) {
                slotsData = firstDaySchedule.timeSlots.map((slot: any) => ({
                  slotId: slot.slotId,
                  slotTime: slot.slotTime,
                  slotLabel: slot.slotLabel,
                  isAvailable: slot.isAvailable,
                  technicianSlotId: slot.technicianSlotId
                }))
              }
            } else if (Array.isArray(response)) {
              // Fallback cho format cũ
              slotsData = response
            }
          } catch (_e) { /* fallback below */ }
        }

        // Final fallback to schedule mapping
        if (slotsData.length === 0) {
          console.log('Using fallback getCenterAvailability API')
          const resp = await getCenterAvailability(Number(data.centerId), data.date, serviceId)
          console.log('Fallback API response:', resp)
          slotsData = resp.technicianSlots || []
          console.log('Fallback slots data:', slotsData)
        }

        // Map và deduplicate slots
        const mappedSlots = slotsData.map((s: any) => {
          const technicianSlotId = s.technicianSlotId || s.id
          console.log('Mapping slot:', {
            original: s,
            technicianSlotId,
            slotId: s.slotId,
            date: data.date
          })
          
          return {
            technicianSlotId, // Không fallback sang s.slotId
            slotTime: s.slotLabel || s.slotTime,
            isAvailable: s.isAvailable !== false,
            technicianId: s.technicianId || Number(data.technicianId)
          }
        })

        // Remove duplicates based on technicianSlotId
        const uniqueSlots = mappedSlots.filter((slot, index, self) => 
          index === self.findIndex(s => s.technicianSlotId === slot.technicianSlotId)
        )

        setSlots(uniqueSlots)
      } catch (e) {
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
    load()
  }, [data.centerId, data.date, data.technicianId, serviceId])

  // Load technicians by center
  useEffect(() => {
    const loadTechs = async () => {
      if (!data.centerId) { setTechnicians([]); return }
      setLoadingTechs(true)
      try {
        const res = await TechnicianService.list({ centerId: Number(data.centerId), pageSize: 100 })
        setTechnicians(res.technicians || [])
      } catch (_e) {
        setTechnicians([])
      } finally {
        setLoadingTechs(false)
      }
    }
    loadTechs()
  }, [data.centerId])

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
    // Ensure we use UTC to avoid timezone issues
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
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
            {loadingTechs && <div>Đang tải kỹ thuật viên...</div>}
            {!loadingTechs && technicians.length === 0 && (
              <div style={{ color: '#9ca3af', padding: '8px 0' }}>Hiện trung tâm chưa có kỹ thuật viên khả dụng</div>
            )}
            {!loadingTechs && technicians.map(t => (
              <button
                key={t.technicianId}
                type="button"
                className={`tech-item ${data.technicianId === String(t.technicianId) ? 'selected' : ''}`}
                onClick={() => onUpdate({ technicianId: String(t.technicianId) })}
              >
                <div className="tech-meta">
                  <div className="tech-name">{t.userFullName}</div>
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
          <div className="time-slots">
            {loadingSlots && <div>Đang tải khung giờ...</div>}
            {!loadingSlots && slots.map((s, index) => (
              <button
                key={`${s.technicianSlotId}-${s.technicianId || index}`}
                type="button"
                className={`time-slot ${data.technicianSlotId === s.technicianSlotId ? 'selected' : ''}`}
                onClick={() => s.isAvailable && onUpdate({ time: s.slotTime, technicianSlotId: s.technicianSlotId, technicianId: s.technicianId ? String(s.technicianId) : data.technicianId })}
                disabled={!s.isAvailable}
              >
                {s.slotTime}
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
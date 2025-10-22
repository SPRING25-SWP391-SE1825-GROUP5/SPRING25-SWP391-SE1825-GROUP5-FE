import React, { useEffect, useMemo, useState } from 'react'
import { Center, CenterService } from '@/services/centerService'
import { TechnicianService, TechnicianListItem } from '@/services/technicianService'
import { LocationService, AddressSuggestion, LocationSearchResult } from '@/services/locationService'
import api from '@/services/api'

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
  
  const [centers, setCenters] = useState<Array<{ id: string; name: string; lat?: number; lng?: number; query: string; distance?: number }>>([])
  const [slots, setSlots] = useState<Array<{ technicianSlotId: number; slotTime: string; isAvailable: boolean; technicianId?: number }>>([])
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [technicians, setTechnicians] = useState<TechnicianListItem[]>([])
  const [loadingTechs, setLoadingTechs] = useState(false)
  
  // States for location features
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<LocationSearchResult | null>(null)
  
  // States for timeslot validation
  const [allTechnicianSlots, setAllTechnicianSlots] = useState<any[]>([])
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())

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

  // Sử dụng vị trí hiện tại và tìm chi nhánh gần nhất
  const useMyLocation = async () => {
    setLoadingLocation(true)
    setLocationError(null)
    
    try {
      const result = await LocationService.getCurrentLocationWithNearbyCenters()
      
      if (result) {
        // Cập nhật địa chỉ
        onUpdate({ address: result.address })
        
        // Cập nhật danh sách chi nhánh với khoảng cách
        const centersWithDistance = result.nearbyCenters.map(center => ({
          id: String(center.centerId),
          name: center.centerName,
          query: center.address,
          distance: center.distance
        }))
        
        setCenters(centersWithDistance)
        
        // Tự động chọn chi nhánh gần nhất
        if (result.selectedCenter) {
          onUpdate({ centerId: String(result.selectedCenter.centerId) })
        }
        
        setSearchResult(result)
      } else {
        setLocationError('Không thể lấy vị trí hiện tại')
      }
    } catch (error: any) {
      console.error('Location error:', error)
      setLocationError(error.message || 'Không thể lấy vị trí hiện tại')
    } finally {
      setLoadingLocation(false)
    }
  }

  // Tìm kiếm địa chỉ và chi nhánh gần nhất
  const searchAddressAndCenters = async (address: string) => {
    if (!address.trim()) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const suggestions = await LocationService.searchAddress(address)
      setAddressSuggestions(suggestions)
      setShowSuggestions(true)
    } catch (error) {
      console.warn('Address search failed:', error)
      setAddressSuggestions([])
    }
  }

  // Chọn địa chỉ từ gợi ý
  const selectAddress = async (suggestion: AddressSuggestion) => {
    setShowSuggestions(false)
    onUpdate({ address: suggestion.formattedAddress })
    
    try {
      const result = await LocationService.findNearbyCentersByAddress(suggestion.formattedAddress)
      
      if (result) {
        const centersWithDistance = result.nearbyCenters.map(center => ({
          id: String(center.centerId),
          name: center.centerName,
          query: center.address,
          distance: center.distance
        }))
        
        setCenters(centersWithDistance)
        setSearchResult(result)
        
        // Tự động chọn chi nhánh gần nhất
        if (result.selectedCenter) {
          onUpdate({ centerId: String(result.selectedCenter.centerId) })
        }
      }
    } catch (error) {
      console.warn('Failed to find nearby centers:', error)
    }
  }

  // Load all timeslots when center and date are selected
  useEffect(() => {
    const loadAllTimeslots = async () => {
      if (!data.centerId || !data.date) { 
        setAllTechnicianSlots([])
        setAvailableDates(new Set())
        setSlots([])
        return 
      }
      
      setLoadingSlots(true)
      try {
        // Load tất cả timeslots của center trong ngày đã chọn
        const response = await api.get(`/api/Booking/available-times`, {
          params: {
            centerId: data.centerId,
            date: data.date
          }
        })
        
        console.log('Available times API response:', response.data)
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          const allSlots = response.data.data
          setAllTechnicianSlots(allSlots)
          
          // Tính toán các ngày có timeslots available
          const dates = new Set<string>()
          allSlots.forEach((slot: any) => {
            if (slot.isAvailable && !slot.bookingId) {
              let slotDate: string
              if (typeof slot.workDate === 'string') {
                slotDate = slot.workDate.split('T')[0]
              } else {
                slotDate = new Date(slot.workDate).toISOString().split('T')[0]
              }
              dates.add(slotDate)
            }
          })
          
          setAvailableDates(dates)
          console.log('Available dates:', Array.from(dates))
          
          // Filter timeslots cho ngày đã chọn
          const slotsForDate = allSlots
            .filter((slot: any) => {
              let slotDate: string
              if (typeof slot.workDate === 'string') {
                slotDate = slot.workDate.split('T')[0]
              } else {
                slotDate = new Date(slot.workDate).toISOString().split('T')[0]
              }
              return slotDate === data.date && slot.isAvailable && !slot.bookingId
            })
            .map((slot: any) => {
              // Check if timeslot is in the past for today
              const isToday = data.date === today.toISOString().split('T')[0]
              let isPastSlot = false
              
              if (isToday && slot.slotTime) {
                const now = new Date()
                const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight
                
                // Parse slot time (assuming format like "08:00" or "08:00:00")
                const timeMatch = slot.slotTime.match(/(\d{1,2}):(\d{2})/)
                if (timeMatch) {
                  const slotHour = parseInt(timeMatch[1])
                  const slotMinute = parseInt(timeMatch[2])
                  const slotTime = slotHour * 60 + slotMinute
                  
                  isPastSlot = slotTime <= currentTime
                }
              }
        
        return {
                technicianSlotId: slot.technicianSlotId,
                slotId: slot.slotId,
                slotTime: slot.slotTime,
                slotLabel: slot.slotLabel,
                isAvailable: !isPastSlot, // Disable if past slot
                technicianId: slot.technicianId,
                workDate: slot.workDate
              }
            })
          
          console.log('Timeslots for selected date:', data.date, slotsForDate)
          setSlots(slotsForDate)
        } else {
          console.warn('No timeslots data received from API', response.data)
          setAllTechnicianSlots([])
          setAvailableDates(new Set())
          setSlots([])
        }
      } catch (error) {
        console.error('Error loading available timeslots:', error)
        setAllTechnicianSlots([])
        setAvailableDates(new Set())
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
    
    loadAllTimeslots()
  }, [data.centerId, data.date])

  // Filter timeslots when technician changes
  useEffect(() => {
    if (data.date && allTechnicianSlots.length > 0) {
      let filteredSlots = allTechnicianSlots
        .filter((slot: any) => {
          let slotDate: string
          if (typeof slot.workDate === 'string') {
            slotDate = slot.workDate.split('T')[0]
          } else {
            slotDate = new Date(slot.workDate).toISOString().split('T')[0]
          }
          return slotDate === data.date && slot.isAvailable && !slot.bookingId
        })

      // Nếu đã chọn technician cụ thể, filter theo technician
      if (data.technicianId) {
        filteredSlots = filteredSlots.filter((slot: any) => 
          slot.technicianId === Number(data.technicianId)
        )
      }

      const slotsForDate = filteredSlots.map((slot: any) => {
        // Check if timeslot is in the past for today
        const isToday = data.date === today.toISOString().split('T')[0]
        let isPastSlot = false
        
        if (isToday && slot.slotTime) {
          const now = new Date()
          const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight
          
          // Parse slot time (assuming format like "08:00" or "08:00:00")
          const timeMatch = slot.slotTime.match(/(\d{1,2}):(\d{2})/)
          if (timeMatch) {
            const slotHour = parseInt(timeMatch[1])
            const slotMinute = parseInt(timeMatch[2])
            const slotTime = slotHour * 60 + slotMinute
            
            isPastSlot = slotTime <= currentTime
          }
        }
        
        return {
          technicianSlotId: slot.technicianSlotId,
          slotId: slot.slotId,
          slotTime: slot.slotTime,
          slotLabel: slot.slotLabel,
          isAvailable: !isPastSlot, // Disable if past slot
          technicianId: slot.technicianId,
          workDate: slot.workDate
        }
      })
      
      console.log('Timeslots for selected date and technician:', data.date, data.technicianId, slotsForDate)
      setSlots(slotsForDate)
    } else if (!data.date) {
      setSlots([])
    }
  }, [data.date, allTechnicianSlots, data.technicianId])

  // Load technicians by center and date
  useEffect(() => {
    const loadTechs = async () => {
      if (!data.centerId || !data.date) { 
        setTechnicians([])
        // Reset technician selection when center or date changes
        if (data.technicianId) {
          onUpdate({ technicianId: '', time: '', technicianSlotId: undefined })
        }
        return 
      }
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
  }, [data.centerId, data.date])

  // Reset timeslot when technician changes
  useEffect(() => {
    if (data.technicianId && (data.time || data.technicianSlotId)) {
      onUpdate({ time: '', technicianSlotId: undefined })
    }
  }, [data.technicianId])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.address-input-container')) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const formatISO = (d: Date) => {
    // Ensure we use UTC to avoid timezone issues
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
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
          const dateString = formatISO(d)
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const hasAvailableSlots = availableDates.has(dateString)
          const isDisabled = isPast || !hasAvailableSlots
          
          row.push({ date: d, disabled: isDisabled })
          day++
        }
      }
      grid.push(row)
    }
    return grid
  }, [month, year, availableDates])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Cho phép submit khi có center, date, time và technicianSlotId
    // technicianId có thể để trống để hệ thống tự chọn
    if (data.centerId && data.date && data.time && data.technicianSlotId) {
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
              <option key={c.id} value={c.id}>
                {c.name} {c.distance ? `(${c.distance.toFixed(1)} km)` : ''}
              </option>
            ))}
          </select>
          <button 
            type="button" 
            className="btn-location" 
            onClick={useMyLocation} 
            disabled={loadingLocation}
          >
            <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {loadingLocation ? 'Đang lấy vị trí...' : 'Dùng vị trí của tôi'}
          </button>
          {locationError && (
            <div className="location-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {locationError}
            </div>
          )}
        </div>
        <div className="form-group form-group--map lt-address-map">
          <label>Địa chỉ của bạn</label>
          <div className="address-input-container" style={{ position: 'relative' }}>
          <input
            type="text"
            value={data.address || ''}
              onChange={(e) => {
                onUpdate({ address: e.target.value })
                searchAddressAndCenters(e.target.value)
              }}
              onFocus={() => {
                if (addressSuggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
            placeholder="Nhập số nhà, đường, phường/xã..."
              style={{ width: '100%' }}
            />
            {showSuggestions && addressSuggestions.length > 0 && (
              <div 
                className="address-suggestions"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {addressSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectAddress(suggestion)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: index < addressSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white'
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {suggestion.formattedAddress}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        <div className="form-group lt-calendar">
          <label>Ngày *</label>
          {!data.centerId && (
            <div style={{ color: '#9ca3af', padding: '8px 0' }}>Vui lòng chọn trung tâm trước</div>
          )}
          {data.centerId && !data.date && (
            <div style={{ color: '#9ca3af', padding: '8px 0' }}>Vui lòng chọn ngày để xem kỹ thuật viên khả dụng</div>
          )}
          {data.centerId && data.date && (
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
                {days.flat().map((cell, idx) => {
                  const isPast = cell.date ? cell.date < new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false
                  
                  return (
                <button
                  key={idx}
                  type="button"
                  className={`cal-cell ${cell.date ? '' : 'empty'} ${isPast ? 'disabled' : ''} ${cell.date && data.date === formatISO(cell.date) ? 'selected' : ''}`}
                  onClick={() => cell.date && !isPast && onUpdate({ date: formatISO(cell.date) })}
                  disabled={!cell.date || isPast}
                      title={cell.date ? (
                        isPast ? 'Ngày đã qua' : 
                        'Chọn ngày này'
                      ) : ''}
                >
                  {cell.date ? cell.date.getDate() : ''}
                </button>
                  )
                })}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Chọn ngày để xem kỹ thuật viên khả dụng
            </div>
          </div>
          )}
          <input type="hidden" value={data.date} required readOnly />
        </div>
        <div className="form-group lt-tech">
          <label>Kỹ thuật viên *</label>
          <div className="tech-list">
            {!data.centerId && (
              <div style={{ color: '#9ca3af', padding: '8px 0' }}>Vui lòng chọn trung tâm trước</div>
            )}
            {data.centerId && !data.date && (
              <div style={{ color: '#9ca3af', padding: '8px 0' }}>Vui lòng chọn ngày trước</div>
            )}
            {data.centerId && data.date && loadingTechs && <div>Đang tải kỹ thuật viên...</div>}
            {data.centerId && data.date && !loadingTechs && technicians.length === 0 && (
              <div style={{ color: '#9ca3af', padding: '8px 0' }}>Hiện trung tâm chưa có kỹ thuật viên khả dụng</div>
            )}
            {data.centerId && data.date && !loadingTechs && technicians.map(t => (
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
            {data.centerId && data.date && !loadingTechs && technicians.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                <input 
                  type="checkbox" 
                  id="auto-select-tech" 
                  checked={!data.technicianId}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onUpdate({ technicianId: '' })
                    }
                  }}
                />
                <label htmlFor="auto-select-tech" style={{ marginLeft: '8px' }}>
                  Để hệ thống tự chọn kỹ thuật viên phù hợp
                </label>
              </div>
            )}
          </div>
          <input type="hidden" value={data.technicianId} required readOnly />
        </div>
        <div className="form-group lt-times">
          <label>Khung giờ *</label>
          <div className="time-slots">
            {!data.centerId && (
              <div style={{ color: '#9ca3af', padding: '8px 0' }}>Vui lòng chọn trung tâm trước</div>
            )}
            {data.centerId && !data.date && (
              <div style={{ color: '#9ca3af', padding: '8px 0' }}>Vui lòng chọn ngày trước</div>
            )}
            {data.centerId && data.date && loadingSlots && (
              <div>Đang tải khung giờ...</div>
            )}
            {data.centerId && data.date && !loadingSlots && slots.length === 0 && (
              <div style={{ color: '#ef4444', padding: '8px 0' }}>
                Không có khung giờ khả dụng trong ngày đã chọn
              </div>
            )}
            {data.centerId && data.date && !loadingSlots && slots.map((s, index) => (
              <button
                key={`${s.technicianSlotId}-${s.technicianId || index}`}
                type="button"
                className={`time-slot ${data.technicianSlotId === s.technicianSlotId ? 'selected' : ''} ${!s.isAvailable ? 'disabled' : ''}`}
                onClick={() => s.isAvailable && onUpdate({ 
                  time: s.slotTime, 
                  technicianSlotId: s.technicianSlotId, 
                  technicianId: s.technicianId ? String(s.technicianId) : data.technicianId 
                })}
                disabled={!s.isAvailable}
                title={!s.isAvailable ? 'Khung giờ này đã qua hoặc không khả dụng' : ''}
              >
                {s.slotTime}
                {s.technicianId && (
                  <span className="slot-technician" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {technicians.find(t => t.technicianId === s.technicianId)?.userFullName || `KTV ${s.technicianId}`}
                  </span>
                )}
                {!s.isAvailable && <span className="slot-status">Đã đặt</span>}
              </button>
            ))}
          </div>
          <input type="hidden" value={data.time} required readOnly />
        </div>
        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button 
            type="submit" 
            className="btn-primary text-white"
            disabled={!data.centerId || !data.date || !data.time || !data.technicianSlotId}
          >
            Tiếp theo
          </button>
        </div>
      </form>
    </div>
  )
}

export default LocationTimeStep
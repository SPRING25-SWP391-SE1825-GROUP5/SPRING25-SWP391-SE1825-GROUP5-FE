import React, { useEffect, useMemo, useState } from 'react'
import { Center, CenterService } from '@/services/centerService'
import { TechnicianService, TechnicianListItem } from '@/services/technicianService'
import { LocationService, AddressSuggestion, LocationSearchResult } from '@/services/locationService'
import api from '@/services/api'
import { API, PAGINATION } from '@/constants/appConstants'

interface LocationTimeInfo {
  centerId: string
  technicianId: string
  address?: string
  date: string
  time: string
  technicianSlotId?: number
  serviceId?: number
  centerName?: string
  technicianName?: string
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
  const [slots, setSlots] = useState<Array<{
    slotId: number;
    slotTime: string;
    slotLabel: string;
    isAvailable: boolean;
    isRealtimeAvailable: boolean;
    technicianId?: number;
    technicianName?: string;
    status: string;
    technicianSlotId?: number;
    displayTime?: string;
  }>>([])
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [technicians, setTechnicians] = useState<TechnicianListItem[]>([])
  const [loadingTechs, setLoadingTechs] = useState(false)

  // States for location features
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationInfo, setLocationInfo] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<LocationSearchResult | null>(null)

  // States for timeslot validation
  const [allTechnicianSlots, setAllTechnicianSlots] = useState<any[]>([])
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  // Ngày khả dụng toàn tháng (dùng để disable các ngày kín lịch trên calendar)
  const [availableDatesMonth, setAvailableDatesMonth] = useState<Set<string>>(new Set())
  // Khi chưa tải xong availability theo tháng, không disable ngày (tránh khoá nhầm)
  const [monthlyLoaded, setMonthlyLoaded] = useState<boolean>(false)
  // Tick dùng để kích hoạt reload timeslot theo chu kỳ
  const [refreshTick, setRefreshTick] = useState<number>(0)
  // Đề xuất KTV có nhiều slot trống nhất
  const [recommendedTechnician, setRecommendedTechnician] = useState<{ id: number; name?: string } | null>(null)

  // Chuẩn hoá hiển thị giờ: loại bỏ hậu tố SA/CH, chỉ giữ HH:mm
  const formatDisplayTime = (value?: string) => {
    if (!value) return ''
    const match = value.match(/(\d{1,2}:\d{2})/)
    return match ? match[1] : value
  }

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
    setLocationInfo(null)

    try {
      // Lấy vị trí hiện tại từ browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Trình duyệt không hỗ trợ định vị'))
          return
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép để sử dụng tính năng này.'))
                break
              case error.POSITION_UNAVAILABLE:
                reject(new Error('Vị trí hiện tại không khả dụng'))
                break
              case error.TIMEOUT:
                reject(new Error('Hết thời gian chờ lấy vị trí'))
                break
              default:
                reject(new Error('Không thể lấy vị trí hiện tại'))
            }
          },
          {
            enableHighAccuracy: true,
            timeout: API.TIMEOUT,
            maximumAge: 300000 // 5 phút
          }
        )
      })

      const lat = position.coords.latitude
      const lng = position.coords.longitude

      // Gọi API tìm trung tâm gần nhất
      const nearbyCenters = await CenterService.getNearbyCenters({
        lat: lat,
        lng: lng,
        radiusKm: 50, // Tìm trong bán kính 50km
        limit: 10, // Tối đa 10 trung tâm
        serviceId: serviceId // Nếu có serviceId
      })

      // Handle different response formats
      let centersData: any[] = []
      if (Array.isArray(nearbyCenters)) {
        centersData = nearbyCenters
      } else if (nearbyCenters && (nearbyCenters as any).data && Array.isArray((nearbyCenters as any).data)) {
        centersData = (nearbyCenters as any).data
      } else if (nearbyCenters && (nearbyCenters as any).centers && Array.isArray((nearbyCenters as any).centers)) {
        centersData = (nearbyCenters as any).centers
      }

      if (centersData && centersData.length > 0) {
        // Cập nhật danh sách trung tâm với khoảng cách
        const centersWithDistance = centersData.map((center: any) => ({
          id: String(center.centerId),
          name: center.centerName,
          query: center.address,
          distance: center.distance || 0
        }))

        setCenters(centersWithDistance)

        // Tự động chọn trung tâm gần nhất
        if (centersWithDistance.length > 0) {
          const nearestCenter = centersWithDistance[0]
          onUpdate({ centerId: nearestCenter.id, centerName: nearestCenter.name })
        }

        // Lấy địa chỉ từ tọa độ (reverse geocoding)
        try {
          const geocodingResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`
          )
          const geocodingData = await geocodingResponse.json()

          if (geocodingData && geocodingData.display_name) {
            const address = geocodingData.display_name
            onUpdate({ address: address })
          }
        } catch (geocodingError) {
          // Fallback: sử dụng tọa độ làm địa chỉ
          onUpdate({ address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` })
        }

      } else {
        // Fallback: Load all centers if no nearby centers found
        try {
          const allCentersResponse = await CenterService.getActiveCenters()

          if (allCentersResponse.centers && allCentersResponse.centers.length > 0) {
            // Calculate distance for each center (approximate)
            const fallbackCenters = allCentersResponse.centers.map((center: any) => {
              // Simple distance calculation (not accurate but gives relative distance)
              const distance = Math.random() * 20 + 5 // Random distance 5-25km for demo
              return {
                id: String(center.centerId),
                name: center.centerName,
                query: center.address,
                distance: distance
              }
            })

            // Sort by distance (closest first)
            fallbackCenters.sort((a, b) => a.distance - b.distance)

            setCenters(fallbackCenters)

            // Auto-select the first (closest) center
            if (fallbackCenters.length > 0) {
              onUpdate({
                centerId: fallbackCenters[0].id,
                centerName: fallbackCenters[0].name
              })
            }

            setLocationError(null) // Clear error since we have centers to show
            setLocationInfo('Hiển thị tất cả trung tâm (khoảng cách ước tính)')
          } else {
            setLocationError('Không tìm thấy trung tâm nào trong hệ thống')
          }
        } catch (fallbackError) {
          setLocationError('Không thể tải danh sách trung tâm')
        }
      }

    } catch (error: unknown) {
      const err = error as { message?: string }
      setLocationError(err.message || 'Không thể lấy vị trí hiện tại')
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
              onUpdate({
                centerId: String(result.selectedCenter.centerId),
                centerName: result.selectedCenter.centerName
              })
        }
      }
    } catch (error) {
      // Silently handle error
    }
  }

  // Load all timeslots when center, date, or technician are selected
  useEffect(() => {
    const loadAllTimeslots = () => {
      if (!data.centerId || !data.date) {
        setAllTechnicianSlots([])
        setAvailableDates(new Set())
        setSlots([])
        return () => {}
      }
      const controller = new AbortController()
      const debounceId = setTimeout(async () => {
        setLoadingSlots(true)
        try {
        // Load tất cả timeslots của center trong ngày đã chọn
        // Sử dụng API Booking/available-times để lấy timeslots theo center và date
        const params: any = {
          centerId: data.centerId,
          date: data.date
        }

        // Nếu đã chọn kỹ thuật viên cụ thể, truyền technicianId
        if (data.technicianId && data.technicianId !== '') {
          params.technicianId = data.technicianId
        }

        let response

        // Nếu đã chọn kỹ thuật viên cụ thể, sử dụng API TechnicianTimeSlot
        if (data.technicianId && data.technicianId !== '') {
          response = await api.get(`/TechnicianTimeSlot/technician/${data.technicianId}/center/${data.centerId}`)
        } else {
          response = await api.get(`/Booking/availability`, {
            params: params,
            signal: controller.signal as any
          })
        }

        if (response.data && response.data.success) {
          let responseData

          // Xử lý response từ API TechnicianTimeSlot (cấu trúc khác)
          if (data.technicianId && data.technicianId !== '') {
            // API TechnicianTimeSlot trả về trực tiếp array of TechnicianTimeSlot
            responseData = {
              centerId: data.centerId,
              date: data.date,
              technicianId: parseInt(data.technicianId),
              technicianName: technicians.find(t => t.technicianId === parseInt(data.technicianId))?.userFullName || 'N/A',
              availableTimeSlots: response.data.data || [],
              availableServices: [] // Sẽ lấy từ API khác nếu cần
            }
          } else {
            // API Booking available-times
            responseData = response.data.data
          }

          // Tìm timeslots trong response data
          let allSlots = []

          if (data.technicianId && data.technicianId !== '') {
            // API TechnicianTimeSlot trả về array trực tiếp
            allSlots = responseData.availableTimeSlots || []
          } else {
            // API Booking available-times
            if (responseData.timeslots && Array.isArray(responseData.timeslots)) {
              allSlots = responseData.timeslots
            } else if (responseData.slots && Array.isArray(responseData.slots)) {
              allSlots = responseData.slots
            } else if (responseData.availableTimeSlots && Array.isArray(responseData.availableTimeSlots)) {
              allSlots = responseData.availableTimeSlots
            } else if (responseData.availableSlots && Array.isArray(responseData.availableSlots)) {
              allSlots = responseData.availableSlots
            } else if (responseData.technicianSlots && Array.isArray(responseData.technicianSlots)) {
              allSlots = responseData.technicianSlots
            } else if (Array.isArray(responseData)) {
              allSlots = responseData
            }
          }
          setAllTechnicianSlots(allSlots)

          // Tính toán các ngày có timeslots available
          const dates = new Set<string>()
          allSlots.forEach((slot: any) => {
            if (slot.isAvailable && !slot.bookingId) {
              let slotDate: string
              const fallbackDate = (responseData.date || data.date || '').toString()
              if (slot.workDate) {
                if (typeof slot.workDate === 'string') {
                  slotDate = slot.workDate.split('T')[0]
                } else {
                  try {
                    const date = new Date(slot.workDate)
                    if (isNaN(date.getTime())) {
                      slotDate = fallbackDate
                    } else {
                      slotDate = date.toISOString().split('T')[0]
                    }
                  } catch {
                    slotDate = fallbackDate
                  }
                }
              } else {
                slotDate = fallbackDate
              }
              dates.add(slotDate)
            }
          })

          setAvailableDates(dates)

          // Filter timeslots cho ngày đã chọn
          const slotsForDate = allSlots
            .filter((slot: any) => {
              let slotDate: string
              const fallbackDate = (responseData.date || data.date || '').toString()
              if (slot.workDate) {
                if (typeof slot.workDate === 'string') {
                  slotDate = slot.workDate.split('T')[0]
                } else {
                  try {
                    const date = new Date(slot.workDate)
                    if (isNaN(date.getTime())) {
                      slotDate = fallbackDate
                    } else {
                      slotDate = date.toISOString().split('T')[0]
                    }
                  } catch {
                    slotDate = fallbackDate
                  }
                }
              } else {
                slotDate = fallbackDate
              }
              // Không lọc theo availability/bookingId để vẫn hiện các slot đã đặt (sẽ disable ở bước map)
              return slotDate === data.date
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

        // Xử lý khác nhau cho TechnicianTimeSlot vs Booking available-times
        if (data.technicianId && data.technicianId !== '') {
          // TechnicianTimeSlot API - slot có cấu trúc khác
            return {
            slotId: slot.slotId,
            slotTime: slot.slotTime,
            slotLabel: slot.slotLabel,
              isAvailable: (slot.isAvailable ?? true) && !slot.bookingId && (slot.isBooked ? !slot.isBooked : true) && !isPastSlot,
            isRealtimeAvailable: slot.isRealtimeAvailable || false,
            technicianId: slot.technicianId,
            technicianName: slot.technicianName,
            status: slot.status || 'AVAILABLE',
            workDate: slot.workDate || (responseData.date || data.date),
              technicianSlotId: slot.technicianSlotId || slot.slotId, // Ensure technicianSlotId is available
              displayTime: formatDisplayTime(slot.slotTime)
          }
        } else {
          // Booking available-times API
            const slotAvailable = (slot.isAvailable ?? true) && !slot.bookingId && (slot.isBooked ? !slot.isBooked : true) && !isPastSlot
            return {
            slotId: slot.slotId,
            slotTime: slot.slotTime,
            slotLabel: slot.slotLabel,
            isAvailable: slotAvailable,
            isRealtimeAvailable: slot.isRealtimeAvailable || false,
            technicianId: slot.technicianId,
            technicianName: slot.technicianName,
            status: slot.status || 'AVAILABLE',
            workDate: slot.workDate || (responseData.date || data.date),
              technicianSlotId: slot.technicianSlotId || slot.slotId, // Ensure technicianSlotId is available
              displayTime: formatDisplayTime(slot.slotTime)
          }
        }
            })

          setSlots(slotsForDate)
          // Cập nhật nhãn đề xuất theo số slot trống (không auto chọn)
          if (slotsForDate.length > 0) {
            const countByTech = new Map<number, { name?: string; count: number }>()
            for (const s of slotsForDate) {
              if (!s.technicianId || !s.isAvailable) continue
              const entry = countByTech.get(s.technicianId) || { name: s.technicianName, count: 0 }
              entry.count += 1
              entry.name = entry.name || s.technicianName
              countByTech.set(s.technicianId, entry)
            }
            let bestId: number | null = null
            let best = -1
            let bestName = ''
            for (const [tid, info] of countByTech.entries()) {
              if (info.count > best) { best = info.count; bestId = tid; bestName = info.name || '' }
            }
            if (bestId && best > 0) setRecommendedTechnician({ id: bestId, name: bestName })
            else setRecommendedTechnician(null)
          }
        } else {
          setAllTechnicianSlots([])
          setAvailableDates(new Set())
          setSlots([])
        }
      } catch (error: any) {
        if (error?.name !== 'CanceledError') {
          setAllTechnicianSlots([])
          setAvailableDates(new Set())
          setSlots([])
        }
      } finally {
        setLoadingSlots(false)
      }
      }, 200)
      return () => { clearTimeout(debounceId); controller.abort() }
    }

    const cleanup = loadAllTimeslots()
    return () => { if (typeof cleanup === 'function') cleanup() }
  }, [data.centerId, data.date, data.technicianId, refreshTick])

  // Tải availability theo trung tâm cho cả tháng hiện tại để disable ngày kín lịch
  useEffect(() => {
    const fetchMonthlyAvailability = () => {
      if (!data.centerId) {
        setAvailableDatesMonth(new Set())
        setMonthlyLoaded(false)
        return () => {}
      }
      const controller = new AbortController()
      const debounceId = setTimeout(async () => {
      try {
        const start = new Date(year, month, 1)
        const end = new Date(year, month + 1, 0)
        const startStr = formatISO(start)
        const endStr = formatISO(end)

        try {
          // Ưu tiên dùng endpoint public tổng hợp theo ngày
          const res = await api.get(`/TechnicianTimeSlot/centers/${data.centerId}/availability`, {
            params: { startDate: startStr, endDate: endStr, page: 1, pageSize: 60 },
            signal: controller.signal as any
          })

          const days: any[] = res?.data?.data || res?.data || []
          const monthSet = new Set<string>()
          days.forEach((d: any) => {
            const available = (d.availableSlots ?? ((d.totalSlots ?? 0) - (d.bookedSlots ?? 0))) > 0
            if (available && typeof d.date === 'string') monthSet.add(d.date)
          })

          setAvailableDatesMonth(monthSet)
          setMonthlyLoaded(true)

          // Gợi ý KTV có nhiều slot trống nhất cho ngày đang chọn (không auto chọn)
          if (data.date) {
            const entry = days.find((x: any) => x.date === data.date)
            if (entry && Array.isArray(entry.technicians)) {
              let bestId: number | null = null
              let bestName = ''
              let bestAvail = -1
              for (const t of entry.technicians) {
                const total = t.totalSlots ?? 0
                const booked = t.bookedSlots ?? 0
                const avail = total - booked
                if (avail > bestAvail) {
                  bestAvail = avail
                  bestId = t.technicianId ?? t.TechnicianId ?? null
                  bestName = t.name ?? t.Name ?? ''
                }
              }
              if (bestId && bestAvail > 0) setRecommendedTechnician({ id: bestId, name: bestName })
              else setRecommendedTechnician(null)
            }
          }
        } catch (_e: any) {
          // Không fallback quét từng ngày để tránh chậm; đánh dấu loaded rỗng
          setAvailableDatesMonth(new Set())
          setMonthlyLoaded(true)
        }
      } catch (_e) {
        setAvailableDatesMonth(new Set())
        setMonthlyLoaded(false)
      }
      }, 200)
      return () => { clearTimeout(debounceId); controller.abort() }
    }

    const cleanup = fetchMonthlyAvailability()
    return () => { if (typeof cleanup === 'function') cleanup() }
  }, [data.centerId, month, year, data.date])

  // Auto-refresh timeslots theo chu kỳ để hạn chế đặt trùng (poll mỗi 15s)
  useEffect(() => {
    if (!data.centerId || !data.date) return

    const intervalId = setInterval(() => {
      // Chỉ refresh khi tab đang hiển thị (nếu trình duyệt hỗ trợ)
      if (typeof document !== 'undefined' && (document as any).hidden) return
      setRefreshTick((t) => t + 1)
    }, 15000)

    return () => clearInterval(intervalId)
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
            try {
              const date = new Date(slot.workDate)
              if (isNaN(date.getTime())) {
                slotDate = data.date || ''
              } else {
                slotDate = date.toISOString().split('T')[0]
              }
            } catch {
              slotDate = data.date || ''
            }
          }
          // Không loại bỏ slot đã đặt; trả về tất cả slot trong ngày
          return slotDate === data.date
        })

      // Không cần filter theo technician nữa vì API đã trả về timeslots của technician cụ thể
      // Nếu chọn "để hệ thống tự chọn", API sẽ trả về tất cả timeslots của center
      // Nếu chọn technician cụ thể, API sẽ trả về timeslots của technician đó

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
          slotId: slot.slotId,
          slotTime: slot.slotTime,
          slotLabel: slot.slotLabel,
          isAvailable: (slot.isAvailable ?? true) && !slot.bookingId && (slot.isBooked ? !slot.isBooked : true) && !isPastSlot,
          isRealtimeAvailable: slot.isRealtimeAvailable || false,
          technicianId: slot.technicianId,
          technicianName: slot.technicianName,
          status: slot.status || 'AVAILABLE',
          workDate: slot.workDate,
        technicianSlotId: slot.technicianSlotId || slot.slotId, // Ensure technicianSlotId is available
        displayTime: formatDisplayTime(slot.slotTime)
        }
      })

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
        const res = await TechnicianService.list({ centerId: Number(data.centerId), pageSize: PAGINATION.MAX_PAGE_SIZE })
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

  // Set default to auto-select when technicians are loaded
  useEffect(() => {
    if (data.centerId && data.date && !loadingTechs && technicians.length > 0 && data.technicianId === undefined) {
      onUpdate({ technicianId: '' }) // Default to auto-select
    }
  }, [data.centerId, data.date, loadingTechs, technicians.length])

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
    // Chỉ tính toán cho 5 ngày trong tuần (T2-T6), bỏ qua T7 và CN
    // firstDay.getDay() trả về: 0=CN, 1=T2, 2=T3, ..., 6=T7
    // Chuyển đổi để T2=0, T3=1, T4=2, T5=3, T6=4
    const firstDayOfWeek = firstDay.getDay() // 0=CN, 1=T2, ..., 6=T7
    let leading = 0
    if (firstDayOfWeek === 0) leading = 0 // CN -> không có leading days
    else if (firstDayOfWeek === 6) leading = 0 // T7 -> không có leading days
    else leading = firstDayOfWeek - 1 // T2=0, T3=1, T4=2, T5=3, T6=4

    const grid: Array<{ date: Date | null, disabled: boolean }> = []
    // Duyệt qua tất cả các ngày trong tháng, chỉ thêm T2-T6 vào grid
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day)
      const dayOfWeek = d.getDay() // 0=CN, 1=T2, ..., 6=T7
      // Chỉ thêm T2-T6 (dayOfWeek từ 1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateString = formatISO(d)
        const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const hasAvailableSlots = monthlyLoaded ? availableDatesMonth.has(dateString) : true
        const isDisabled = isPast || !hasAvailableSlots
        grid.push({ date: d, disabled: isDisabled })
      }
    }
    // Thêm leading empty cells nếu cần
    const leadingCells: Array<{ date: Date | null, disabled: boolean }> = []
    for (let i = 0; i < leading; i++) {
      leadingCells.push({ date: null, disabled: true })
    }
    return [...leadingCells, ...grid]
  }, [month, year, availableDatesMonth, monthlyLoaded])

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
            onChange={(e) => {
              const selectedCenter = centers.find(c => c.id === e.target.value)
              onUpdate({
                centerId: e.target.value,
                centerName: selectedCenter?.name
              })
            }}
            required
          >
            <option value="">Chọn trung tâm</option>
            {centers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.distance ? `(${c.distance.toFixed(1)} km)` : ''}
              </option>
            ))}
          </select>
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
            <button
              type="button"
              className="btn-location-address"
              onClick={useMyLocation}
              disabled={loadingLocation}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.875rem',
                color: '#6b7280',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px' }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {loadingLocation ? 'Đang lấy vị trí...' : 'Dùng vị trí của tôi'}
            </button>
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
          {locationError && (
            <div className="location-error" style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {locationError}
            </div>
          )}
          {locationInfo && (
            <div className="location-info" style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              color: '#0369a1',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              {locationInfo}
            </div>
          )}
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
          <label>Ngày <span className="required-star">*</span></label>
          <div className="calendar">
            <div className="calendar-header">
              <button type="button" className="cal-nav" onClick={() => setMonth(m => m === 0 ? (setYear(y => y - 1), 11) : m - 1)}>&lt;</button>
              <div className="cal-title">{new Date(year, month).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}</div>
              <button type="button" className="cal-nav" onClick={() => setMonth(m => m === 11 ? (setYear(y => y + 1), 0) : m + 1)}>&gt;</button>
            </div>
            <div className="calendar-grid">
              {['T2','T3','T4','T5','T6'].map(d => (
                <div key={d} className="cal-weekday">{d}</div>
              ))}
                {days.map((cell, idx) => {
                  const isPast = cell.date ? cell.date < new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false
                  const disabled = !cell.date || isPast || cell.disabled
                  return (
                <button
                  key={idx}
                  type="button"
                  className={`cal-cell ${cell.date ? '' : 'empty'} ${disabled ? 'disabled' : ''} ${cell.date && data.date === formatISO(cell.date) ? 'selected' : ''}`}
                  onClick={() => cell.date && !disabled && onUpdate({ date: formatISO(cell.date) })}
                  disabled={disabled}
                      title={cell.date ? (
                        disabled ? (isPast ? 'Ngày đã qua' : 'Trung tâm đã kín lịch ngày này') :
                        'Chọn ngày này'
                      ) : ''}
                >
                  {cell.date ? cell.date.getDate() : ''}
                </button>
                  )
                })}
            </div>
          </div>
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
                onClick={() => onUpdate({
                  technicianId: String(t.technicianId),
                  technicianName: t.userFullName
                })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: data.technicianId === String(t.technicianId) ? '1px solid #d1d5db' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: data.technicianId === String(t.technicianId) ? '#f9fafb' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '48px',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (data.technicianId !== String(t.technicianId)) {
                    e.currentTarget.style.borderColor = '#9ca3af'
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (data.technicianId !== String(t.technicianId)) {
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.backgroundColor = 'white'
                  }
                }}
              >
                <div className="tech-meta" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: data.technicianId === String(t.technicianId) ? '#6b7280' : '#d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.75rem'
                  }}>
                    {t.userFullName?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                  <div>
                    <div className="tech-name" style={{
                      fontWeight: '500',
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      {t.userFullName}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      marginTop: '1px'
                    }}>
                      Kỹ thuật viên chuyên nghiệp
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {/* Nút "Để hệ thống tự chọn kỹ thuật viên" đã được gỡ bỏ theo yêu cầu */}
          </div>
          <input type="hidden" value={data.technicianId} required readOnly />
        </div>
        {/* Khung giờ - đặt trong form, tách riêng và span full grid */}
        <div className="lt-times">
          <div className="timeslot-section">
            <label className="timeslot-label">Khung giờ *</label>
            <div className="time-slots" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 'var(--spacing-sm)',
              marginTop: 'var(--spacing-sm)'
            }}>
              {!data.centerId && (
                <div style={{
                  color: 'var(--text-tertiary)',
                  padding: 'var(--spacing-md)',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-sm)',
                  gridColumn: '1 / -1'
                }}>Vui lòng chọn trung tâm trước</div>
              )}
              {data.centerId && !data.date && (
                <div style={{
                  color: 'var(--text-tertiary)',
                  padding: 'var(--spacing-md)',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-sm)',
                  gridColumn: '1 / -1'
                }}>Vui lòng chọn ngày trước</div>
              )}
              {data.centerId && data.date && loadingSlots && (
                <div style={{
                  color: 'var(--text-secondary)',
                  padding: 'var(--spacing-md)',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-sm)',
                  gridColumn: '1 / -1'
                }}>Đang tải khung giờ...</div>
              )}
              {data.centerId && data.date && !loadingSlots && slots.length === 0 && (
                <div style={{
                  color: 'var(--error-500)',
                  padding: 'var(--spacing-md)',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-sm)',
                  gridColumn: '1 / -1'
                }}>
                  Không có khung giờ khả dụng trong ngày đã chọn
                </div>
              )}
              {data.centerId && data.date && !loadingSlots && slots.map((s, index) => {
                const isSelected = data.time === s.slotTime
                return (
                  <button
                    key={`${s.slotId || index}-${s.technicianId || 'auto'}-${index}`}
                    type="button"
                    className={`time-slot ${isSelected ? 'selected' : ''} ${!s.isAvailable ? 'disabled' : ''}`}
                    onClick={() => {
                      if (s.isAvailable) {
                        onUpdate({
                          time: s.slotTime,
                          technicianName: s.technicianName || data.technicianName,
                          technicianSlotId: s.technicianSlotId,
                          technicianId: s.technicianId ? String(s.technicianId) : data.technicianId
                        })
                      }
                    }}
                    disabled={!s.isAvailable}
                    title={!s.isAvailable ? 'Khung giờ này đã qua hoặc không khả dụng' : (isSelected ? 'Đã chọn khung giờ này' : 'Chọn khung giờ này')}
                    style={{
                      padding: 'var(--spacing-md)',
                      border: isSelected ? `2px solid var(--primary-500)` : `1px solid var(--border-secondary)`,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--primary-50)' : (s.isAvailable ? 'var(--bg-card)' : 'var(--bg-secondary)'),
                      color: isSelected ? 'var(--primary-700)' : (s.isAvailable ? 'var(--text-primary)' : 'var(--text-tertiary)'),
                      cursor: s.isAvailable ? 'pointer' : 'not-allowed',
                      fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      transition: 'var(--transition-fast)',
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      outline: 'none',
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (s.isAvailable && !isSelected) {
                        e.currentTarget.style.borderColor = 'var(--primary-400)'
                        e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (s.isAvailable && !isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-secondary)'
                        e.currentTarget.style.backgroundColor = 'var(--bg-card)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {s.displayTime || s.slotTime}
                    {isSelected && (
                      <span style={{
                        position: 'absolute',
                        top: 'var(--spacing-xs)',
                        right: 'var(--spacing-sm)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--primary-600)',
                        fontWeight: 'var(--font-weight-bold)'
                      }}>✓</span>
                    )}
                    {/* Slot đã đặt: không hiển thị chữ để gọn UI; trạng thái disabled + tooltip là đủ */}
                  </button>
                )
              })}
            </div>
            <input type="hidden" value={data.time} required readOnly />
          </div>
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
      <style>{`
        .location-time-step {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .location-time-step h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 1rem 0;
        }
        /* 2-cột: trái là form, phải là map (sticky) */
        .lt-grid {
          display: grid;
          grid-template-columns: 1fr 520px;
          gap: 1.25rem;
          align-items: start;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: .5rem;
        }
        .form-group label {
          color: var(--text-primary);
          font-weight: 600;
          font-size: .95rem;
        }
        .form-group input[type="text"],
        .form-group select {
          width: 100%;
          box-sizing: border-box;
          background: #fff;
          border: 1px solid var(--border-primary);
          color: var(--text-primary);
          border-radius: 8px;
          padding: .6rem .75rem;
        }
        /* Map không dùng cột phải nữa, đặt bên dưới phần chi nhánh/địa chỉ */
        .lt-address-map { display: block; }
        .map-container {
          grid-column: 1 / -1;
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          height: 320px;
          position: static;
          margin-top: .5rem;
        }
        .map-container iframe {
          border: 0;
          width: 100%;
          height: 100%;
        }
        .btn-secondary.small { padding: .5rem .75rem; align-self: flex-start; }
        .tech-list { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: .5rem; }
        .tech-item {
          display: flex;
          align-items: center;
          gap: .5rem;
          padding: .6rem .75rem;
          background: #fff;
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          cursor: pointer;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .tech-item:hover { box-shadow: 0 2px 6px rgba(0,0,0,.06); }
        .tech-item.selected {
          border-color: var(--progress-current);
          background: var(--primary-50);
        }
        .tech-name { font-weight: 600; color: var(--text-primary); }
        .calendar { border: 1px solid var(--border-primary); border-radius: 8px; overflow: hidden; background: #fff; }
        .calendar-header { display: flex; align-items: center; justify-content: space-between; padding: .5rem .75rem; border-bottom: 1px solid var(--border-primary); }
        .cal-title { font-weight: 600; color: var(--text-primary); }
        .cal-nav { background: #fff; border: 1px solid var(--border-primary); border-radius: 6px; padding: .25rem .5rem; cursor: pointer; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
        .cal-weekday { padding: .5rem 0; text-align: center; font-weight: 600; color: var(--text-secondary); background: var(--primary-50); }
        .cal-cell { padding: .6rem 0; text-align: center; border: 1px solid var(--border-primary); background: #fff; cursor: pointer; }
        .cal-cell.empty { background: #f9fafb; cursor: default; }
        .cal-cell.disabled { color: #9ca3af; background: #f3f4f6; cursor: not-allowed; }
        .cal-cell.selected { background: var(--progress-current); color: #fff; border-color: var(--progress-current); }
        /* Phần Khung giờ tách riêng, căn giữa */
        .timeslot-section {
          width: 100%;
          max-width: 900px;
          margin: 1.5rem auto 0;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-primary);
        }
        .lt-times { grid-column: 1 / -1; }
        .timeslot-label {
          display: block;
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .time-slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: .5rem; }
        .time-slot { padding: .6rem .75rem; background: #fff; border: 1px solid var(--border-primary); border-radius: 8px; cursor: pointer; }
        .time-slot.selected { background: var(--progress-current); color: #fff; border-color: var(--progress-current); }
        .time-slot.disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; opacity: .65; }
        /* Thanh hành động ở cuối, căn phải giống ảnh */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: .75rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-primary);
        }
        .btn-primary { background: var(--progress-current); color: #fff; border: 1px solid var(--progress-current); border-radius: 8px; padding: .6rem 1rem; cursor: pointer; }
        .btn-secondary { background: #fff; color: var(--text-primary); border: 1px solid var(--border-primary); border-radius: 8px; padding: .6rem 1rem; cursor: pointer; }
        @media (max-width: 1180px) { .lt-grid { grid-template-columns: 1fr 440px; } .map-container { height: 300px; } }
        @media (max-width: 1024px) {
          .lt-grid { grid-template-columns: 1fr; }
          .lt-address-map { display: block; }
          .map-container { position: static; height: 260px; grid-column: 1 / -1; grid-row: auto; margin-top: .5rem; }
          .tech-list { grid-template-columns: 1fr; }
          .time-slots { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

export default LocationTimeStep

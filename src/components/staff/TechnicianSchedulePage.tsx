import { useEffect, useMemo, useState } from 'react'
import { TechnicianTimeSlotService } from '@/services/technicianTimeSlotService'
import { TechnicianService, TimeSlotService } from '@/services/technicianService'
import { CenterService } from '@/services/centerService'
import { StaffService } from '@/services/staffService'

type FormState = {
  mode: 'ngay' | 'tuan'
  technicianId: string
  centerId: string
  slotId: string
  workDate: string
  startDate: string
  endDate: string
  isAvailable: boolean
  notes: string
}

type ErrorState = Partial<Record<keyof FormState, string>> & { _global?: string }

export default function TechnicianSchedulePage() {
  const [form, setForm] = useState<FormState>({
    mode: 'ngay',
    technicianId: '',
    centerId: '',
    slotId: '',
    workDate: '',
    startDate: '',
    endDate: '',
    isAvailable: true,
    notes: '',
  })
  const [errors, setErrors] = useState<ErrorState>({})
  const [successMsg, setSuccessMsg] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [centers, setCenters] = useState<any[]>([])
  const [currentStaffCenterId, setCurrentStaffCenterId] = useState<number | null>(null)

  // Viewing options (efficient querying)
  const [viewMode, setViewMode] = useState<'technician' | 'center'>('technician')
  const [viewRange, setViewRange] = useState<'day' | 'week'>('day')
  const [viewDate, setViewDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [viewStart, setViewStart] = useState<string>('')
  const [viewEnd, setViewEnd] = useState<string>('')
  const [centerSchedule, setCenterSchedule] = useState<any[]>([])
  const [viewLoading, setViewLoading] = useState<boolean>(false)

  // Toggle for local debugging; keep false for production
  const DEBUG = false
  // Simple toggle between create/read views
  const [viewTab, setViewTab] = useState<'create' | 'read'>('create')

  const canSubmit = useMemo(() => {
    if (loading) return false
    if (!form.technicianId) return false
    if (form.mode === 'ngay') return Boolean(form.workDate)
    // tuần không cần slotId/isAvailable ở UI; BE sẽ tạo full tuần
    return Boolean(form.startDate && form.endDate)
  }, [form, loading])

  const setField = (k: keyof FormState, v: any) => setForm((s) => ({ ...s, [k]: v }))

  const validate = (): boolean => {
    const e: ErrorState = {}
    if (!form.technicianId) e.technicianId = 'Vui lòng chọn kỹ thuật viên'
    // full-time cả ngày/tuần: không cần slot
    if (form.mode === 'ngay' && !form.workDate) e.workDate = 'Vui lòng chọn ngày làm việc'
    if (form.mode === 'tuan') {
      if (!form.startDate) e.startDate = 'Vui lòng chọn ngày bắt đầu'
      if (!form.endDate) e.endDate = 'Vui lòng chọn ngày kết thúc'
      if (form.startDate && form.endDate && form.startDate > form.endDate) e.endDate = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu'
      // Kiểm tra khoảng thời gian và ngày trong tuần
      if (form.startDate && form.endDate) {
        const s = new Date(form.startDate)
        const ed = new Date(form.endDate)
        const diff = Math.round((ed.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))

        // Kiểm tra ngày bắt đầu phải là thứ 2 (dayOfWeek = 1)
        const startDayOfWeek = s.getDay() // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
        if (startDayOfWeek !== 1) {
          e.startDate = 'Ngày bắt đầu phải là thứ 2'
        }

        // Kiểm tra ngày kết thúc phải là thứ 6 (dayOfWeek = 5)
        const endDayOfWeek = ed.getDay()
        if (endDayOfWeek !== 5) {
          e.endDate = 'Ngày kết thúc phải là thứ 6'
        }

        // Kiểm tra khoảng thời gian phải là 4 ngày (từ thứ 2 đến thứ 6 = 5 ngày làm việc)
        if (diff !== 4) {
          e.endDate = 'Khoảng thời gian phải là 5 ngày làm việc (từ thứ 2 đến thứ 6)'
        }

        // Kiểm tra không có ngày nào trong khoảng là thứ 7 hoặc chủ nhật
        for (let d = new Date(s); d <= ed; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay()
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            e.endDate = 'Khoảng thời gian không được bao gồm thứ 7 hoặc chủ nhật. Hệ thống chỉ hoạt động từ thứ 2 đến thứ 6.'
            break
          }
        }
      }
    }
    // Không cho phép chọn ngày trong quá khứ
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (form.mode === 'ngay' && form.workDate) {
      const wd = new Date(form.workDate)
      if (wd < today) e.workDate = 'Ngày làm việc không được ở quá khứ'
      // Kiểm tra không được chọn thứ 7 hoặc chủ nhật
      const dayOfWeek = wd.getDay()
      if (dayOfWeek === 0) {
        e.workDate = 'Không thể tạo lịch vào Chủ nhật. Hệ thống chỉ hoạt động từ thứ 2 đến thứ 6.'
      } else if (dayOfWeek === 6) {
        e.workDate = 'Không thể tạo lịch vào thứ 7. Hệ thống chỉ hoạt động từ thứ 2 đến thứ 6.'
      }
    }
    if (form.mode === 'tuan' && form.startDate) {
      const sd = new Date(form.startDate)
      if (sd < today) e.startDate = 'Ngày bắt đầu không được ở quá khứ'
    }
    if (form.notes && form.notes.length > 255) e.notes = 'Ghi chú tối đa 255 ký tự'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    setSuccessMsg('')
    try {
      // client-side duplicate guard: if schedule already includes same (date, slot)
      const dupDate = form.mode === 'ngay' ? form.workDate : form.startDate
      const dupEnd = form.mode === 'ngay' ? form.workDate : form.endDate
      // Kiểm tra trùng lịch trước khi tạo
      if (dupDate && dupEnd) {
        const existingDates = schedule
          .filter((s) => {
            const d = new Date(s.workDate).toISOString().slice(0, 10)
            return d >= dupDate && d <= dupEnd
          })
          .map((s) => new Date(s.workDate).toLocaleDateString('vi-VN'))

        if (existingDates.length > 0) {
          if (form.mode === 'ngay') {
            setErrors({ _global: `Kỹ thuật viên đã có lịch vào ngày ${existingDates[0]}. Vui lòng chọn ngày khác.` })
            setLoading(false)
            return
          } else {
            // Tuần: hiển thị cảnh báo nhưng vẫn cho phép tạo (skip ngày trùng)
            const confirmMsg = `Kỹ thuật viên đã có lịch vào các ngày: ${existingDates.join(', ')}. Hệ thống sẽ bỏ qua những ngày này và chỉ tạo lịch cho các ngày còn lại. Bạn có muốn tiếp tục?`
            if (!window.confirm(confirmMsg)) {
              setLoading(false)
              return
            }
          }
        }
      }

      const techId = Number(form.technicianId)
      if (!Number.isFinite(techId) || techId <= 0) {
        throw new Error('Kỹ thuật viên không hợp lệ.')
      }

      if (form.mode === 'tuan') {
        // Sử dụng API mới cho tạo lịch full tuần
        const payload = {
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          isAvailable: true,
          notes: form.notes || null,
        }

        const result = await TechnicianTimeSlotService.createFullWeekAllSlots(techId, payload as any)

        // Hiển thị thông báo chi tiết về kết quả tạo lịch
        let successMessage = result?.message || 'Tạo lịch tuần thành công'

        // Thêm thông tin về slot bị skip nếu có
        if (result?.totalSlotsSkipped && result.totalSlotsSkipped > 0) {
          const duplicateInfo = result.duplicateSlotsInfo || []
          if (duplicateInfo.length > 0) {
            // Hiển thị tối đa 10 slot đầu tiên để tránh message quá dài
            const displayInfo = duplicateInfo.slice(0, 10)
            const moreCount = duplicateInfo.length > 10 ? ` và ${duplicateInfo.length - 10} slot khác` : ''
            successMessage += `. Đã bỏ qua ${result.totalSlotsSkipped} lịch trình đã tồn tại: ${displayInfo.join(', ')}${moreCount}`
          } else {
            successMessage += `. Đã bỏ qua ${result.totalSlotsSkipped} lịch trình đã tồn tại`
          }
        }

        setSuccessMsg(successMessage)
      } else {
        // Chế độ ngày: sử dụng logic cũ với tất cả slots
        let activeSlots = slots
        if (!activeSlots || activeSlots.length === 0) {
          try {
            activeSlots = await TimeSlotService.list(true)
            setSlots(activeSlots || [])
          } catch {
            activeSlots = []
          }
        }

        const slotIds: number[] = Array.isArray(activeSlots)
          ? activeSlots.map((s: any) => Number(s.slotId)).filter((n) => Number.isFinite(n))
          : []

        if (slotIds.length === 0) {
          throw new Error('Không có danh sách khung giờ khả dụng để tạo lịch.')
        }

        // Xây dựng khoảng thời gian cho ngày
        const range = { start: new Date(form.workDate).toISOString(), end: new Date(form.workDate).toISOString() }

        // Gọi song song tạo lịch cho tất cả slot trong ngày
        const tasks = slotIds.map((slotId) => {
          const payload = {
            technicianId: techId,
            slotId,
            startDate: range.start,
            endDate: range.end,
            isAvailable: true,
            notes: form.notes || null,
          }
          return TechnicianTimeSlotService.createWeekly(payload as any)
        })

        const results = await Promise.allSettled(tasks)
        const failures = results.filter((r) => r.status === 'rejected')
        const successes = results.length - failures.length
        if (failures.length === results.length) {
          throw new Error('Không thể tạo lịch cho bất kỳ khung giờ nào. Vui lòng kiểm tra lại kỹ thuật viên/khung ngày hoặc quyền truy cập.')
        }

        const firstFailureMsg = (() => {
          const f = failures[0] as PromiseRejectedResult | undefined
          const m = (f as any)?.reason?.response?.data?.message || (f as any)?.reason?.message
          return m ? `; ${String(m)}` : ''
        })()
        setSuccessMsg(`Tạo lịch thành công ${successes}/${results.length} khung giờ${firstFailureMsg}`)
      }
      await loadSchedule()
    } catch (err: any) {
      const status = err?.response?.status
      const serverMsg: string = err?.response?.data?.message || ''
      const serverErrors: string[] = Array.isArray(err?.response?.data?.errors) ? err.response.data.errors : []
      let friendly = 'Có lỗi xảy ra. Vui lòng thử lại.'

      // Check for duplicate schedule messages first (regardless of status)
      const combinedMsg = [serverMsg, ...serverErrors].join(' ').toLowerCase()
      if (combinedMsg.includes('đã tồn tại') || combinedMsg.includes('duplicate') || combinedMsg.includes('unique') || combinedMsg.includes('trùng')) {
        friendly = serverMsg || 'Lịch cho kỹ thuật viên đã tồn tại. Vui lòng chọn ngày khác hoặc khung giờ khác.'
      } else if (status === 409) {
        const m = serverMsg.toLowerCase()
        if (m.includes('booking') || m.includes('đặt')) {
          friendly = 'Khung giờ đã có đặt chỗ. Vui lòng chọn khung giờ khác hoặc hủy đặt trước.'
        } else if (m.includes('conflict') || m.includes('slot')) {
          friendly = 'Khung giờ bị trùng cho kỹ thuật viên trong ngày đã chọn.'
        } else {
          friendly = 'Xung đột khung giờ. Vui lòng kiểm tra lại.'
        }
      } else if (status === 422) {
        friendly = 'Trạng thái đặt lịch không hợp lệ. Vui lòng kiểm tra lại quy trình hủy/đổi lịch.'
      } else if (status === 400) {
        const combined = [serverMsg, ...serverErrors].filter(Boolean).join(' | ')
        friendly = combined || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra và thử lại.'
      } else if (status === 404) {
        friendly = 'Không tìm thấy tài nguyên (Kỹ thuật viên/Khung giờ).'
      }
      setErrors({ _global: friendly })
    } finally {
      setLoading(false)
    }
  }

  const flattenDaily = (data: any[]): any[] => {
    // data: array of { workDate, timeSlots: [...] }
    const list: any[] = []
    for (const d of data || []) {
      const day = d.workDate || d.WorkDate
      const slots = d.timeSlots || d.TimeSlots || []
      for (const ts of slots) {
        list.push({
          workDate: day,
          slotId: ts.slotId ?? ts.SlotId,
          slotLabel: ts.slotLabel ?? ts.SlotLabel,
          isAvailable: ts.isAvailable ?? ts.IsAvailable,
          notes: ts.notes ?? ts.Notes,
          technicianSlotId: ts.technicianSlotId ?? ts.TechnicianSlotId,
        })
      }
    }
    return list
  }

  // Chuẩn hóa ngày theo local timezone về dạng yyyy-MM-dd để so sánh an toàn
  const toLocalDateOnly = (d: string | Date): string => {
    try {
      const dt = new Date(d)
      // en-CA cho định dạng yyyy-MM-dd theo local time
      return dt.toLocaleDateString('en-CA')
    } catch {
      return ''
    }
  }

  // Tạo mảng 7 ngày (yyyy-MM-dd) từ start đến end (bao gồm)
  const buildWeekDays = (start: string, end: string): string[] => {
    const days: string[] = []
    try {
      const s = new Date(start)
      const e = new Date(end)
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        days.push(d.toLocaleDateString('en-CA'))
      }
    } catch {
      // ignore
    }
    return days
  }

  // Tạo map tra cứu nhanh theo (date, slotId)
  const makeScheduleIndex = (items: any[]) => {
    const idx = new Map<string, any>()
    for (const it of items) {
      const key = `${toLocalDateOnly(it.workDate)}#${it.slotId}`
      if (!idx.has(key)) idx.set(key, it)
    }
    return idx
  }

  const loadSchedule = async () => {
    // Efficient fetch: only for selected technician and date range (from form submit)
    if (!form.technicianId) return
    const sd = form.mode === 'ngay' ? form.workDate || form.startDate : form.startDate
    const ed = form.mode === 'ngay' ? form.workDate || form.endDate || form.workDate : form.endDate
    if (!sd || !ed) return
    try {
      const data = await TechnicianTimeSlotService.getScheduleByTechnician(
        Number(form.technicianId),
        sd,
        ed
      )
      const raw = Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray(data)
          ? (data as any)
          : []
      const items = (raw.length && (raw[0]?.timeSlots || raw[0]?.TimeSlots)) ? flattenDaily(raw) : raw
      setSchedule(items)
    } catch {
      setSchedule([])
    }
  }

  const loadTechnicianViewSchedule = async () => {
    if (!form.technicianId) {
      return
    }

    const sd = viewRange === 'day' ? (viewDate || viewStart) : viewStart
    const ed = viewRange === 'day' ? (viewDate || viewEnd || viewDate) : viewEnd

    if (!sd || !ed) {
      return
    }

    try {
      setViewLoading(true)

      const data = await TechnicianTimeSlotService.getScheduleByTechnician(
        Number(form.technicianId),
        sd,
        ed
      )

      const raw = Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray(data)
          ? (data as any)
          : []

      const items = (raw.length && (raw[0]?.timeSlots || raw[0]?.TimeSlots)) ? flattenDaily(raw) : raw

      // Với chế độ nhiều ngày, không chỉ kiểm tra phần tử đầu tiên
      const hasAnySlots = Array.isArray(raw)
        ? raw.some((d: any) => {
            const ts = d?.timeSlots || d?.TimeSlots
            return Array.isArray(ts) && ts.length > 0
          })
        : false

      if (!hasAnySlots) {
        // Không có slot nào trong toàn bộ dải ngày → hiển thị thẻ hướng dẫn
        if (raw.length > 0 && raw[0]?.technicianId) {
          const technicianInfo = {
            technicianId: raw[0].technicianId,
            technicianName: raw[0].technicianName,
            workDate: raw[0].workDate,
            dayOfWeek: raw[0].dayOfWeek,
            hasSchedule: false
          }
          setSchedule([technicianInfo])
        } else {
          setSchedule([])
        }
      } else {
        // Có ít nhất một ngày có slot → dùng danh sách items đã flatten
        setSchedule(items)
      }
    } catch (error) {
      setSchedule([])
    } finally {
      setViewLoading(false)
    }
  }

  const loadCenterSchedule = async () => {
    if (!form.centerId) return
    const sd = viewRange === 'day' ? (viewDate || viewStart) : viewStart
    const ed = viewRange === 'day' ? (viewDate || viewEnd || viewDate) : viewEnd
    if (!sd || !ed) return
    try {
      setViewLoading(true)
      const data = await TechnicianTimeSlotService.getCenterSchedule(
        Number(form.centerId),
        sd,
        ed
      )
      const items = Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray(data)
          ? (data as any)
          : []
      setCenterSchedule(items)
    } catch {
      setCenterSchedule([])
    } finally {
      setViewLoading(false)
    }
  }

  useEffect(() => {
    // load dropdowns
    ;(async () => {
      try {
        // Lấy thông tin staff hiện tại để lấy centerId
        let centerId: number | undefined = undefined
        try {

          const currentStaff = await StaffService.getCurrentStaff()

          if (currentStaff?.data?.centerId) {
            centerId = currentStaff.data.centerId
            setCurrentStaffCenterId(centerId)

          } else {

            // Fallback: Thử lấy từ localStorage hoặc hardcode để test
            const fallbackCenterId = localStorage.getItem('currentStaffCenterId')
            if (fallbackCenterId) {
              centerId = parseInt(fallbackCenterId)
              setCurrentStaffCenterId(centerId)

            } else {

            }
          }
        } catch (error) {

          // Fallback: Thử lấy từ localStorage
          const fallbackCenterId = localStorage.getItem('currentStaffCenterId')
          if (fallbackCenterId) {
            centerId = parseInt(fallbackCenterId)
            setCurrentStaffCenterId(centerId)
          }
        }

        // Tải kỹ thuật viên và slot (filter theo centerId của staff hiện tại)

        const [techs, ts] = await Promise.all([
          TechnicianService.list({ pageNumber: 1, pageSize: 100, centerId }),
          TimeSlotService.list(true),
        ])

        setTechnicians(techs.technicians || [])
        setSlots(ts || [])
      } catch {
        setTechnicians([])
        setSlots([])
      }
    })()
    loadSchedule()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.technicianId, form.mode, form.workDate, form.startDate, form.endDate])

  // Auto-load viewing schedule with debounce to keep UX smooth
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewMode === 'technician') {
        if (!form.technicianId) return
        if (viewRange === 'day') {
          if (viewDate) loadTechnicianViewSchedule()
        } else {
          if (viewStart && viewEnd) loadTechnicianViewSchedule()
        }
      } else {
        // Lazy fetch centers when switching to center mode
        if (centers.length === 0) {
          ;(async () => {
            try {
              const cs = await CenterService.getCenters({ pageNumber: 1, pageSize: 100 })
              const cdata = (cs as any)?.centers || (Array.isArray(cs) ? cs : [])
              setCenters(cdata || [])
            } catch (err: any) {
              const status = err?.response?.status
              if (status === 403) {
                setCenters([])
                setViewMode('technician')
                setErrors((prev) => ({ ...prev, _global: 'Bạn không có quyền xem lịch theo Trung tâm. Vui lòng chọn chế độ xem theo Kỹ thuật viên.' }))
                return
              }
              setCenters([])
            }
          })()
        }
        if (!form.centerId) return
        if (viewRange === 'day') {
          if (viewDate) loadCenterSchedule()
        } else {
          if (viewStart && viewEnd) loadCenterSchedule()
        }
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, viewRange, form.technicianId, form.centerId, viewDate, viewStart, viewEnd])

  // Reset range-specific fields when switching range
  useEffect(() => {
    if (viewRange === 'day') {
      setViewStart('')
      setViewEnd('')
    } else {
      // default a 7-day window from today
      const s = new Date()
      const e = new Date(s)
      e.setDate(s.getDate() + 6)
      setViewStart(s.toISOString().slice(0,10))
      setViewEnd(e.toISOString().slice(0,10))
    }
  }, [viewRange])

  // Auto-fill 5 ngày làm việc cho chế độ tuần: endDate = startDate + 4 (từ thứ 2 đến thứ 6)
  useEffect(() => {
    if (form.mode === 'tuan' && form.startDate) {
      try {
        const d = new Date(form.startDate)
        const dayOfWeek = d.getDay()
        // Chỉ auto-fill nếu ngày bắt đầu là thứ 2
        if (dayOfWeek === 1) {
          const end = new Date(d)
          end.setDate(d.getDate() + 4) // Thứ 2 + 4 ngày = Thứ 6
          const iso = end.toISOString().slice(0, 10)
          if (iso !== form.endDate) setForm((s) => ({ ...s, endDate: iso }))
        }
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.mode, form.startDate])

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontSize: '16px',
          fontWeight: 300,
          margin: 0,
          color: 'var(--text-primary)'
        }}>Lịch làm việc kỹ thuật viên</h1>
        <p style={{
          margin: '8px 0 0 0',
          color: 'var(--text-secondary)',
          fontSize: '12px'
        }}>Tạo lịch theo ngày hoặc theo tuần. Tất cả nhãn và lỗi hiển thị bằng tiếng Việt.</p>
      </div>

      {errors._global && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'var(--error-50)',
          color: 'var(--error-700)',
          border: '1px solid var(--error-200)',
          fontSize: '14px'
        }}>{errors._global}</div>
      )}
      {successMsg && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'var(--success-50)',
          color: 'var(--success-700)',
          border: '1px solid var(--success-200)',
          fontSize: '14px'
        }}>{successMsg}</div>
      )}

      <div style={{
        background: 'transparent',
        padding: '24px',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        {/* Toggle buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button type="button" onClick={() => setViewTab('create')} style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: viewTab === 'create' ? '2px solid var(--primary-500)' : 'none',
            background: viewTab === 'create' ? 'var(--primary-50)' : 'transparent',
            color: 'var(--text-primary)',
            fontWeight: 300,
            fontSize: '12px',
            cursor: 'pointer'
          }}>Tạo lịch</button>
          <button type="button" onClick={() => setViewTab('read')} style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: viewTab === 'read' ? '2px solid var(--primary-500)' : '1px solid var(--border-primary)',
            background: viewTab === 'read' ? 'var(--primary-50)' : 'transparent',
            color: 'var(--text-primary)',
            fontWeight: 300,
            fontSize: '12px',
            cursor: 'pointer'
          }}>Xem lịch</button>
        </div>

        {/* Create View */}
        <div id="createView" style={{ display: viewTab === 'create' ? 'block' : 'none' }}>
        <form onSubmit={handleSubmit} style={{
          display: 'table',
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0 12px'
        }}>
          <div style={{ display: 'table-row' }}>
            <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle', width: '150px' }}>
              <label style={{ display: 'block', fontWeight: 300, fontSize: '12px', marginBottom: '0', color: 'var(--text-primary)' }}>Chế độ</label>
            </div>
            <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle' }}>
              <select
                value={form.mode}
                onChange={(e) => setField('mode', e.target.value as any)}
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  boxSizing: 'border-box',
                  fontSize: '12px',
                  fontWeight: 300,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  outline: 'none'
                }}
              >
                <option value="ngay">Theo ngày</option>
                <option value="tuan">Theo tuần (dải ngày)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'table-row' }}>
            <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle', width: '150px' }}>
              <label style={{ display: 'block', fontWeight: 300, fontSize: '12px', marginBottom: '0', color: 'var(--text-primary)' }}>Kỹ thuật viên</label>
            </div>
            <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle' }}>
              <select
                value={form.technicianId}
                onChange={(e) => setField('technicianId', e.target.value)}
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  boxSizing: 'border-box',
                  fontSize: '12px',
                  fontWeight: 300,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  outline: 'none'
                }}
              >
              <option value="">-- Chọn kỹ thuật viên --</option>
              {technicians.length === 0 ? (
                <option value="" disabled>Không có kỹ thuật viên nào trong chi nhánh</option>
              ) : (
                technicians.map((t: any) => (
                  <option key={t.technicianId} value={t.technicianId}>{t.userFullName || `KTV #${t.technicianId}`}</option>
                ))
              )}
            </select>
            {errors.technicianId && <div style={{ color: 'var(--error-600)', fontSize: '11px', marginTop: '4px' }}>{errors.technicianId}</div>}
            {technicians.length === 0 && currentStaffCenterId && (
              <div style={{ color: 'var(--warning-600)', fontSize: '11px', marginTop: '4px' }}>
                ⚠️ Không có kỹ thuật viên nào trong chi nhánh của bạn. Chỉ hiển thị kỹ thuật viên thuộc cùng chi nhánh.
              </div>
            )}
            </div>
          </div>

          {/* Khung giờ bị ẩn cho chế độ full-time theo ngày/tuần */}

          {form.mode === 'ngay' ? (
            <div style={{ display: 'table-row' }}>
              <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle', width: '150px' }}>
                <label style={{ display: 'block', fontWeight: 300, fontSize: '12px', marginBottom: '0', color: 'var(--text-primary)' }}>Ngày làm việc</label>
              </div>
              <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle' }}>
                <input
                  type="date"
                  value={form.workDate}
                  min={new Date().toISOString().slice(0,10)}
                  onChange={(e) => setField('workDate', e.target.value)}
                  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                  onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                  onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    boxSizing: 'border-box',
                    fontSize: '12px',
                    fontWeight: 300,
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    outline: 'none'
                  }}
                />
                {errors.workDate && <div style={{ color: 'var(--error-600)', fontSize: '11px', marginTop: '4px' }}>{errors.workDate}</div>}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'table-row' }}>
                <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle', width: '150px' }}>
                  <label style={{ display: 'block', fontWeight: 300, fontSize: '12px', marginBottom: '0', color: 'var(--text-primary)' }}>Ngày bắt đầu</label>
                </div>
                <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle' }}>
                  <input
                    type="date"
                    value={form.startDate}
                    min={new Date().toISOString().slice(0,10)}
                    onChange={(e) => setField('startDate', e.target.value)}
                    onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                    onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                    onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      boxSizing: 'border-box',
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      outline: 'none'
                    }}
                  />
                  {errors.startDate && <div style={{ color: 'var(--error-600)', fontSize: '11px', marginTop: '4px' }}>{errors.startDate}</div>}
                </div>
              </div>
              <div style={{ display: 'table-row' }}>
                <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle', width: '150px' }}>
                  <label style={{ display: 'block', fontWeight: 300, fontSize: '12px', marginBottom: '0', color: 'var(--text-primary)' }}>Ngày kết thúc</label>
                </div>
                <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle' }}>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(e) => setField('endDate', e.target.value)}
                    onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                    onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                    onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      boxSizing: 'border-box',
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      outline: 'none'
                    }}
                  />
                  {errors.endDate && <div style={{ color: 'var(--error-600)', fontSize: '11px', marginTop: '4px' }}>{errors.endDate}</div>}
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'table-row' }}>
            <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle', width: '150px' }}>
              <label style={{ display: 'block', fontWeight: 300, fontSize: '12px', marginBottom: '0', color: 'var(--text-primary)' }}>Ghi chú</label>
            </div>
            <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle' }}>
              <input
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Tối đa 255 ký tự"
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  boxSizing: 'border-box',
                  fontSize: '12px',
                  fontWeight: 300,
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  outline: 'none'
                }}
              />
              {errors.notes && <div style={{ color: 'var(--error-600)', fontSize: '11px', marginTop: '4px' }}>{errors.notes}</div>}
            </div>
          </div>

          <div style={{ display: 'table-row' }}>
            <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle', width: '150px' }}></div>
            <div style={{ display: 'table-cell', paddingRight: '16px', verticalAlign: 'middle', paddingTop: '8px' }}>
              <button type="submit" disabled={!canSubmit} style={{
                padding: '12px 20px', border: 'none', borderRadius: '10px', color: 'white',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                opacity: canSubmit ? 1 : 0.6, cursor: canSubmit ? 'pointer' : 'not-allowed', fontWeight: 300, fontSize: '12px'
              }}>
                {loading ? 'Đang lưu...' : form.mode === 'ngay' ? 'Tạo lịch (1 ngày)' : 'Tạo lịch (dải ngày)'}
              </button>
            </div>
          </div>
        </form>
        <div style={{ marginTop: '12px', paddingLeft: '166px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
          {form.mode === 'tuan' && 'Lưu ý: Tạo lịch tuần sẽ tự động tạo tất cả khung giờ cho 5 ngày làm việc (từ thứ 2 đến thứ 6) sử dụng API tối ưu. Hệ thống chỉ hoạt động từ thứ 2 đến thứ 6.'}
        </div>
        </div>
      </div>

      {/* Read View */}
      <div id="readView" style={{
        display: viewTab === 'read' ? 'block' : 'none',
        background: 'transparent',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Lịch đã tạo</h2>
        {/* Viewing controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
          {centers.length > 0 && (
            <div>
              <label style={{ display: 'block', fontWeight: 300, fontSize: '11px', marginBottom: '6px', color: 'var(--text-primary)' }}>Xem theo</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  fontSize: '12px',
                  fontWeight: 300,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  outline: 'none'
                }}
              >
                <option value="technician">Kỹ thuật viên</option>
                <option value="center">Trung tâm</option>
              </select>
            </div>
          )}

          {viewMode === 'center'
            ? (
              <div>
                <label style={{ display: 'block', fontWeight: 300, fontSize: '11px', marginBottom: '6px', color: 'var(--text-primary)' }}>Trung tâm</label>
                <select
                  value={form.centerId}
                  onChange={(e) => setForm((s) => ({ ...s, centerId: e.target.value }))}
                  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                  onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                  onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                  style={{
                    minWidth: '260px',
                    padding: '10px 14px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    fontSize: '12px',
                    fontWeight: 300,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn trung tâm --</option>
                  {centers.map((c: any) => (
                    <option key={c.centerId} value={c.centerId}>{c.centerName}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontWeight: 300, fontSize: '11px', marginBottom: '6px', color: 'var(--text-primary)' }}>Kỹ thuật viên</label>
                <select
                  value={form.technicianId}
                  onChange={(e) => setField('technicianId', e.target.value)}
                  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                  onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                  onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                  style={{
                    minWidth: '260px',
                    padding: '10px 14px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    fontSize: '12px',
                    fontWeight: 300,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {technicians.length === 0 ? (
                    <option value="" disabled>Không có kỹ thuật viên nào trong chi nhánh</option>
                  ) : (
                    technicians.map((t: any) => (
                      <option key={t.technicianId} value={t.technicianId}>{t.userFullName || `KTV #${t.technicianId}`}</option>
                    ))
                  )}
                </select>
              </div>
            )}

          <div>
            <label style={{ display: 'block', fontWeight: 300, fontSize: '11px', marginBottom: '6px', color: 'var(--text-primary)' }}>Khoảng xem</label>
            <select
              value={viewRange}
              onChange={(e) => setViewRange(e.target.value as any)}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
              onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
              onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
              style={{
                minWidth: '160px',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                fontSize: '12px',
                fontWeight: 300,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                outline: 'none'
              }}
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
            </select>
          </div>

          {viewRange === 'day' ? (
            <div>
              <label style={{ display: 'block', fontWeight: 300, fontSize: '11px', marginBottom: '6px', color: 'var(--text-primary)' }}>Ngày</label>
              <input
                type="date"
                value={viewDate}
                min={new Date().toISOString().slice(0,10)}
                onChange={(e) => setViewDate(e.target.value)}
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                style={{
                  minWidth: '180px',
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  fontSize: '12px',
                  fontWeight: 300,
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  outline: 'none'
                }}
              />
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 300, fontSize: '11px', marginBottom: '6px', color: 'var(--text-primary)' }}>Từ ngày</label>
                <input
                  type="date"
                  value={viewStart}
                  min={new Date().toISOString().slice(0,10)}
                  onChange={(e) => setViewStart(e.target.value)}
                  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                  onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                  onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                  style={{
                    minWidth: '180px',
                    padding: '10px 14px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    fontSize: '12px',
                    fontWeight: 300,
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 300, fontSize: '11px', marginBottom: '6px', color: 'var(--text-primary)' }}>Đến ngày</label>
                <input
                  type="date"
                  value={viewEnd}
                  min={viewStart || undefined}
                  onChange={(e) => setViewEnd(e.target.value)}
                  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-secondary)'; }}
                  onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = '#f8f9fa'; }}
                  onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                  style={{
                    minWidth: '180px',
                    padding: '10px 14px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    fontSize: '12px',
                    fontWeight: 300,
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    outline: 'none'
                  }}
                />
              </div>
            </>
          )}

          <div style={{ alignSelf: 'end' }}>
            <button type="button" onClick={() => (viewMode === 'center' ? loadCenterSchedule() : loadTechnicianViewSchedule())} style={{ padding: '10px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', color: '#fff', fontWeight: 300, fontSize: '12px', border: 'none', opacity: viewLoading ? 0.7 : 1, cursor: viewLoading ? 'wait' : 'pointer' }}>{viewLoading ? 'Đang tải...' : 'Tải lịch'}</button>
          </div>
        </div>

        {/* Debug info (hidden by default) */}
        {DEBUG && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f0f0', borderRadius: '8px', fontSize: '12px' }}>
            <strong>Debug Info:</strong><br/>
            View Mode: {viewMode}<br/>
            Schedule Length: {schedule.length}<br/>
            Center Schedule Length: {centerSchedule.length}<br/>
            View Range: {viewRange}<br/>
            View Date: {viewDate}<br/>
            View Start: {viewStart}<br/>
            View End: {viewEnd}<br/>
            Technician ID: {form.technicianId}<br/>
            Loading: {viewLoading ? 'Yes' : 'No'}<br/>
            <strong>Schedule Data:</strong> {JSON.stringify(schedule, null, 2)}
          </div>
        )}

        {viewMode === 'center' ? (
          centerSchedule.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '12px', fontWeight: 300 }}>Chưa có dữ liệu.</p>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>KTV</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Ngày</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Slot</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Nhãn</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {centerSchedule.map((s, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '12px 16px' }}>{s.technicianId}</td>
                      <td style={{ padding: '12px 16px' }}>{new Date(s.workDate).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '12px 16px' }}>{s.slotId}</td>
                      <td style={{ padding: '12px 16px' }}>{s.slotLabel || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>{s.isAvailable ? 'Có thể nhận' : 'Khóa'}</td>
                      <td style={{ padding: '12px 16px' }}>{s.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : schedule.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '300' }}>📅 Chưa có lịch làm việc</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
              Technician này chưa có lịch làm việc cho ngày được chọn.<br/>
              Hãy tạo lịch mới ở form phía trên.
            </p>
          </div>
        ) : schedule.length === 1 && schedule[0]?.hasSchedule === false ? (
          // Hiển thị thông tin technician khi chưa có lịch
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#000000', fontSize: '13px', fontWeight: 300 }}>
                👨‍🔧 {schedule[0].technicianName}
              </h3>
              <p style={{ margin: '8px 0', fontSize: '12px', color: '#000000', fontWeight: 300 }}>
                <span style={{ fontWeight: 300 }}>Ngày:</span> {new Date(schedule[0].workDate).toLocaleDateString('vi-VN')} ({schedule[0].dayOfWeek})
              </p>
              <p style={{ margin: '8px 0', fontSize: '12px', color: '#000000', fontWeight: 300 }}>
                <span style={{ fontWeight: 300 }}>Trạng thái:</span> Chưa có lịch làm việc
              </p>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--warning-50)',
                borderRadius: '8px'
              }}>
                <p style={{ margin: '0', fontSize: '12px', fontWeight: 300, color: 'var(--warning-800)' }}>
                  💡 Để tạo lịch cho technician này, hãy sử dụng form "Tạo lịch mới" phía trên.
                </p>
              </div>
            </div>
          </div>
        ) : viewRange === 'day' && (viewDate || viewStart) ? (
          // Lịch ngày: 1 cột ngày, hàng là slot
          (() => {
            const dayKey = toLocalDateOnly(viewDate || viewStart)
            const headerLabel = new Date(dayKey).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })
            const slotDefs = (slots && slots.length ? slots : schedule)
              .map((s: any) => ({ id: Number(s.slotId), label: s.slotLabel || `Slot #${s.slotId}` }))
              .filter((x: any) => Number.isFinite(x.id))
            const seen = new Set<number>()
            const uniqueSlots = slotDefs.filter((x: any) => (seen.has(x.id) ? false : (seen.add(x.id), true)))
              .sort((a: any, b: any) => a.id - b.id)

            const idx = makeScheduleIndex(schedule)

            return (
              <div style={{ overflow: 'auto', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300, textAlign: 'left', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>Khung giờ</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300, textAlign: 'left' }}>{headerLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueSlots.map((slot) => {
                      const key = `${dayKey}#${slot.id}`
                      const it = idx.get(key)
                      const booked = Boolean(it?.hasBooking)
                      const available = !booked && Boolean(it?.isAvailable)
                      const note = it?.notes || ''
                      return (
                        <tr key={slot.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 300, fontSize: '12px', position: 'sticky', left: 0, background: 'var(--bg-card)' }}>{slot.label}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px' }} title={note}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                backgroundColor: booked ? '#FF0000' : (available ? '#009900' : 'var(--border-primary)'),
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 300,
                                whiteSpace: 'nowrap'
                              }}>
                                {booked ? 'Đã được đặt' : (available ? 'Khả dụng' : 'Không khả dụng')}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })()
        ) : (
          viewRange === 'week' && viewStart && viewEnd ? (
            // Lịch tuần: 7 cột theo ngày, hàng là slot
            (() => {
              const days = buildWeekDays(viewStart, viewEnd)
              // Danh sách slot unique và sắp xếp tăng dần theo slotId
              const slotDefs = (slots && slots.length ? slots : schedule)
                .map((s: any) => ({ id: Number(s.slotId), label: s.slotLabel || `Slot #${s.slotId}` }))
                .filter((x: any) => Number.isFinite(x.id))
              const seen = new Set<number>()
              const uniqueSlots = slotDefs.filter((x: any) => (seen.has(x.id) ? false : (seen.add(x.id), true)))
                .sort((a: any, b: any) => a.id - b.id)

              const idx = makeScheduleIndex(schedule)

              // Lọc chỉ giữ các ngày có ít nhất một timeslot trong dữ liệu schedule
              const visibleDays = days.filter((d) =>
                schedule.some((it: any) => toLocalDateOnly(it.workDate) === d)
              )

              if (visibleDays.length === 0) {
                return (
                  <div style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                    Chưa có lịch làm việc nào trong tuần đã chọn.
                  </div>
                )
              }

              return (
                <div style={{ overflow: 'auto', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300, textAlign: 'left', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>Khung giờ</th>
                        {visibleDays.map((d) => (
                          <th key={d} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300, textAlign: 'left' }}>{new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueSlots.map((slot) => (
                        <tr key={slot.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 300, fontSize: '12px', position: 'sticky', left: 0, background: 'var(--bg-card)' }}>{slot.label}</td>
                          {visibleDays.map((d) => {
                            const key = `${d}#${slot.id}`
                            const it = idx.get(key)
                            const booked = Boolean(it?.hasBooking)
                            const available = !booked && Boolean(it?.isAvailable)
                            const note = it?.notes || ''
                            return (
                              <td key={key} title={note} style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px' }}>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: booked ? '#FF0000' : (available ? '#009900' : 'var(--border-primary)'),
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 300,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {booked ? 'Đã được đặt' : (available ? 'Khả dụng' : 'Không khả dụng')}
                                  </span>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()
          ) : (
            // Fallback: bảng danh sách (trường hợp không đủ dữ liệu tuần)
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>ID</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Ngày</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Slot</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Nhãn</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 300 }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((s, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '12px 16px' }}>{s.technicianSlotId ?? s.id}</td>
                      <td style={{ padding: '12px 16px' }}>{new Date(s.workDate).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '12px 16px' }}>{s.slotId}</td>
                      <td style={{ padding: '12px 16px' }}>{s.slotLabel || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>{s.isAvailable ? 'Có thể nhận' : 'Khóa'}</td>
                      <td style={{ padding: '12px 16px' }}>{s.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}



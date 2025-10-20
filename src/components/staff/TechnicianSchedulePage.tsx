import { useEffect, useMemo, useState } from 'react'
import { TechnicianTimeSlotService } from '@/services/technicianTimeSlotService'
import { TechnicianService, TimeSlotService } from '@/services/technicianService'
import { CenterService } from '@/services/centerService'

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

  // Viewing options (efficient querying)
  const [viewMode, setViewMode] = useState<'technician' | 'center'>('technician')
  const [viewRange, setViewRange] = useState<'day' | 'week'>('day')
  const [viewDate, setViewDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [viewStart, setViewStart] = useState<string>('')
  const [viewEnd, setViewEnd] = useState<string>('')
  const [centerSchedule, setCenterSchedule] = useState<any[]>([])
  const [viewLoading, setViewLoading] = useState<boolean>(false)

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
      // enforce 7 days range
      if (form.startDate && form.endDate) {
        const s = new Date(form.startDate)
        const ed = new Date(form.endDate)
        const diff = Math.round((ed.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
        if (diff !== 6) e.endDate = 'Khoảng tuần phải là 7 ngày (bắt đầu đến kết thúc = 7 ngày)'
      }
    }
    // Không cho phép chọn ngày trong quá khứ
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (form.mode === 'ngay' && form.workDate) {
      const wd = new Date(form.workDate)
      if (wd < today) e.workDate = 'Ngày làm việc không được ở quá khứ'
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

      // Lấy danh sách slot hoạt động để tạo full-day
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

      const techId = Number(form.technicianId)
      if (!Number.isFinite(techId) || techId <= 0) {
        throw new Error('Kỹ thuật viên không hợp lệ.')
      }

      // Xây dựng khoảng thời gian theo chế độ
      const range = form.mode === 'ngay'
        ? { start: new Date(form.workDate).toISOString(), end: new Date(form.workDate).toISOString() }
        : { start: new Date(form.startDate).toISOString(), end: new Date(form.endDate).toISOString() }

      // Gọi song song tạo lịch cho tất cả slot trong khoảng thời gian
      const tasks = slotIds.map((slotId) => {
        const payload = {
          technicianId: techId,
          slotId,
          startDate: range.start,
          endDate: range.end,
          isAvailable: true,
          notes: form.notes || null,
        }
        // debug payload in dev
        if (import.meta.env.DEV) console.debug('CreateWeekly payload', payload)
        return TechnicianTimeSlotService.createWeekly(payload as any)
      })

      const results = await Promise.allSettled(tasks)
      const failures = results.filter((r) => r.status === 'rejected')
      const successes = results.length - failures.length
      if (failures.length === results.length) {
        // Nếu tất cả thất bại, ném lỗi tổng quát để hiển thị
        throw new Error('Không thể tạo lịch cho bất kỳ khung giờ nào. Vui lòng kiểm tra lại kỹ thuật viên/khung ngày hoặc quyền truy cập.')
      }
      // Có ít nhất một yêu cầu thành công
      const firstFailureMsg = (() => {
        const f = failures[0] as PromiseRejectedResult | undefined
        const m = (f as any)?.reason?.response?.data?.message || (f as any)?.reason?.message
        return m ? `; ${String(m)}` : ''
      })()
      setSuccessMsg(`Tạo lịch thành công ${successes}/${results.length} khung giờ${firstFailureMsg}`)
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
    if (!form.technicianId) return
    const sd = viewRange === 'day' ? (viewDate || viewStart) : viewStart
    const ed = viewRange === 'day' ? (viewDate || viewEnd || viewDate) : viewEnd
    if (!sd || !ed) return
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
      setSchedule(items)
    } catch {
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
        // Tải kỹ thuật viên và slot (always allowed for Staff)
        const [techs, ts] = await Promise.all([
          TechnicianService.list({ pageNumber: 1, pageSize: 100 }),
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

  // Auto-fill 7 ngày cho chế độ tuần: endDate = startDate + 6
  useEffect(() => {
    if (form.mode === 'tuan' && form.startDate) {
      try {
        const d = new Date(form.startDate)
        const end = new Date(d)
        end.setDate(d.getDate() + 6)
        const iso = end.toISOString().slice(0, 10)
        if (iso !== form.endDate) setForm((s) => ({ ...s, endDate: iso }))
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
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
          color: 'var(--text-primary)'
        }}>Lịch làm việc kỹ thuật viên</h1>
        <p style={{
          margin: '8px 0 0 0',
          color: 'var(--text-secondary)',
          fontSize: '14px'
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
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        padding: '24px',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          alignItems: 'start'
        }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Chế độ</label>
            <select value={form.mode} onChange={(e) => setField('mode', e.target.value as any)} style={{
              width: '100%', padding: '12px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)', boxSizing: 'border-box'
            }}>
              <option value="ngay">Theo ngày</option>
              <option value="tuan">Theo tuần (dải ngày)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Kỹ thuật viên</label>
            <select value={form.technicianId} onChange={(e) => setField('technicianId', e.target.value)} style={{
              width: '100%', padding: '12px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)', boxSizing: 'border-box'
            }}>
              <option value="">-- Chọn kỹ thuật viên --</option>
              {technicians.map((t: any) => (
                <option key={t.technicianId} value={t.technicianId}>{t.userFullName || `KTV #${t.technicianId}`}</option>
              ))}
            </select>
            {errors.technicianId && <div style={{ color: 'var(--error-600)', fontSize: '12px', marginTop: '6px' }}>{errors.technicianId}</div>}
          </div>

          {/* Khung giờ bị ẩn cho chế độ full-time theo ngày/tuần */}

          {form.mode === 'ngay' ? (
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Ngày làm việc</label>
              <input type="date" value={form.workDate} min={new Date().toISOString().slice(0,10)} onChange={(e) => setField('workDate', e.target.value)} style={{
                width: '100%', padding: '12px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)', boxSizing: 'border-box'
              }} />
              {errors.workDate && <div style={{ color: 'var(--error-600)', fontSize: '12px', marginTop: '6px' }}>{errors.workDate}</div>}
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Ngày bắt đầu</label>
                <input type="date" value={form.startDate} min={new Date().toISOString().slice(0,10)} onChange={(e) => setField('startDate', e.target.value)} style={{
                  width: '100%', padding: '12px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)', boxSizing: 'border-box'
                }} />
                {errors.startDate && <div style={{ color: 'var(--error-600)', fontSize: '12px', marginTop: '6px' }}>{errors.startDate}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Ngày kết thúc</label>
                <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => setField('endDate', e.target.value)} style={{
                  width: '100%', padding: '12px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)', boxSizing: 'border-box'
                }} />
                {errors.endDate && <div style={{ color: 'var(--error-600)', fontSize: '12px', marginTop: '6px' }}>{errors.endDate}</div>}
              </div>
            </>
          )}

          {/* Trạng thái khả dụng bị ẩn cho chế độ full-time theo ngày/tuần */}

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Ghi chú</label>
            <input value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Tối đa 255 ký tự" style={{
              width: '100%', padding: '12px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)', boxSizing: 'border-box'
            }} />
            {errors.notes && <div style={{ color: 'var(--error-600)', fontSize: '12px', marginTop: '6px' }}>{errors.notes}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit" disabled={!canSubmit} style={{
              padding: '12px 20px', border: 'none', borderRadius: '10px', color: 'white',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              opacity: canSubmit ? 1 : 0.6, cursor: canSubmit ? 'pointer' : 'not-allowed', fontWeight: 600
            }}>
              {loading ? 'Đang lưu...' : form.mode === 'ngay' ? 'Tạo lịch (1 ngày)' : 'Tạo lịch (dải ngày)'}
            </button>
          </div>
        </form>
        <div style={{ gridColumn: '1 / -1', color: 'var(--text-tertiary)', fontSize: '14px', marginTop: '5px' }}>
          {form.mode === 'tuan' && 'Lưu ý: Tạo lịch tuần sẽ tự động tạo tất cả khung giờ 30 phút từ 08:00 đến 17:00 cho mỗi ngày trong 7 ngày.'}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Lịch đã tạo</h2>
        {/* Viewing controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
          {centers.length > 0 && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary)' }}>Xem theo</label>
              <select value={viewMode} onChange={(e) => setViewMode(e.target.value as any)} style={{ width: '100%', padding: '10px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                <option value="technician">Kỹ thuật viên</option>
                <option value="center">Trung tâm</option>
              </select>
            </div>
          )}

          {viewMode === 'center'
            ? (
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary)' }}>Trung tâm</label>
                <select value={form.centerId} onChange={(e) => setForm((s) => ({ ...s, centerId: e.target.value }))} style={{ minWidth: '260px', padding: '10px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                  <option value="">-- Chọn trung tâm --</option>
                  {centers.map((c: any) => (
                    <option key={c.centerId} value={c.centerId}>{c.centerName}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary)' }}>Kỹ thuật viên</label>
                <select value={form.technicianId} onChange={(e) => setField('technicianId', e.target.value)} style={{ minWidth: '260px', padding: '10px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {technicians.map((t: any) => (
                    <option key={t.technicianId} value={t.technicianId}>{t.userFullName || `KTV #${t.technicianId}`}</option>
                  ))}
                </select>
              </div>
            )}

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary)' }}>Khoảng xem</label>
            <select value={viewRange} onChange={(e) => setViewRange(e.target.value as any)} style={{ minWidth: '160px', padding: '10px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
            </select>
          </div>

          {viewRange === 'day' ? (
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary)' }}>Ngày</label>
              <input type="date" value={viewDate} min={new Date().toISOString().slice(0,10)} onChange={(e) => setViewDate(e.target.value)} style={{ minWidth: '180px', padding: '10px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)' }} />
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary)' }}>Từ ngày</label>
                <input type="date" value={viewStart} min={new Date().toISOString().slice(0,10)} onChange={(e) => setViewStart(e.target.value)} style={{ minWidth: '180px', padding: '10px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary)' }}>Đến ngày</label>
                <input type="date" value={viewEnd} min={viewStart || undefined} onChange={(e) => setViewEnd(e.target.value)} style={{ minWidth: '180px', padding: '10px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)' }} />
              </div>
            </>
          )}

          <div style={{ alignSelf: 'end' }}>
            <button type="button" onClick={() => (viewMode === 'center' ? loadCenterSchedule() : loadTechnicianViewSchedule())} style={{ padding: '10px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', color: '#fff', fontWeight: 700, border: 'none', opacity: viewLoading ? 0.7 : 1, cursor: viewLoading ? 'wait' : 'pointer' }}>{viewLoading ? 'Đang tải...' : 'Tải lịch'}</button>
          </div>
        </div>

        {viewMode === 'center' ? (
          centerSchedule.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>Chưa có dữ liệu.</p>
          ) : (
            <div style={{ overflow: 'auto', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>KTV</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Ngày</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Slot</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Nhãn</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {centerSchedule.map((s, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-primary)' }}>
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
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>Chưa có dữ liệu.</p>
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
                      <th style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'left', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>Khung giờ</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'left' }}>{headerLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueSlots.map((slot) => {
                      const key = `${dayKey}#${slot.id}`
                      const it = idx.get(key)
                      const available = Boolean(it?.isAvailable)
                      const note = it?.notes || ''
                      return (
                        <tr key={slot.id} style={{ borderTop: '1px solid var(--border-primary)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, position: 'sticky', left: 0, background: 'var(--bg-card)' }}>{slot.label}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: `1px solid ${available ? 'var(--success-200)' : 'var(--error-200)'}`,
                              background: available ? 'var(--success-50)' : 'var(--error-50)',
                              color: available ? 'var(--success-800)' : 'var(--error-800)',
                              fontSize: '12px',
                              minWidth: '160px'
                            }} title={note}>
                              {available ? 'Có thể nhận' : 'Khóa'}{note ? ` - ${note}` : ''}
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

              return (
                <div style={{ overflow: 'auto', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'left', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>Khung giờ</th>
                        {days.map((d) => (
                          <th key={d} style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'left' }}>{new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueSlots.map((slot) => (
                        <tr key={slot.id} style={{ borderTop: '1px solid var(--border-primary)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, position: 'sticky', left: 0, background: 'var(--bg-card)' }}>{slot.label}</td>
                          {days.map((d) => {
                            const key = `${d}#${slot.id}`
                            const it = idx.get(key)
                            const available = Boolean(it?.isAvailable)
                            const note = it?.notes || ''
                            return (
                              <td key={key} title={note} style={{ padding: '8px 10px' }}>
                                <div style={{
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: `1px solid ${available ? 'var(--success-200)' : 'var(--error-200)'}`,
                                  background: available ? 'var(--success-50)' : 'var(--error-50)',
                                  color: available ? 'var(--success-800)' : 'var(--error-800)',
                                  fontSize: '12px',
                                  minWidth: '110px'
                                }}>
                                  {available ? 'Có thể nhận' : 'Khóa'}{note ? ` - ${note}` : ''}
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
            <div style={{ overflow: 'auto', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>ID</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Ngày</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Slot</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Nhãn</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px' }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((s, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-primary)' }}>
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



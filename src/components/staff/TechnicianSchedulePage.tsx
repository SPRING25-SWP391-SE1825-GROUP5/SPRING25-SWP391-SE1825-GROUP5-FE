import { useEffect, useMemo, useState } from 'react'
import { TechnicianTimeSlotService } from '@/services/technicianTimeSlotService'
import { TechnicianService, TimeSlotService } from '@/services/technicianService'

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
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])

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
    if (form.notes && form.notes.length > 255) e.notes = 'Ghi chú tối đa 255 ký tự'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
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

      if (form.mode === 'ngay') {
        // tạo full-time 1 ngày bằng endpoint weekly với start=end
        await TechnicianTimeSlotService.createWeekly({
          technicianId: Number(form.technicianId),
          startDate: new Date(form.workDate).toISOString(),
          endDate: new Date(form.workDate).toISOString(),
          notes: form.notes || null,
        })
      } else {
        await TechnicianTimeSlotService.createWeekly({
          technicianId: Number(form.technicianId),
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          notes: form.notes || null,
        })
      }
      await loadSchedule()
    } catch (err: any) {
      const status = err?.response?.status
      const serverMsg: string = err?.response?.data?.message || ''
      let friendly = 'Có lỗi xảy ra. Vui lòng thử lại.'
      if (status === 409) {
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
        friendly = serverMsg || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra và thử lại.'
      } else if (status === 404) {
        friendly = 'Không tìm thấy tài nguyên (Kỹ thuật viên/Khung giờ).' 
      }
      setErrors({ _global: friendly })
    } finally {
      setLoading(false)
    }
  }

  const loadSchedule = async () => {
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
      setSchedule(Array.isArray(data) ? data : [])
    } catch {
      setSchedule([])
    }
  }

  useEffect(() => {
    // load dropdowns
    ;(async () => {
      try {
        const [techs, ts] = await Promise.all([
          TechnicianService.list({ pageNumber: 1, pageSize: 100 }),
          TimeSlotService.list(true),
        ])
        setTechnicians(techs || [])
        setSlots(ts || [])
      } catch {
        setTechnicians([])
        setSlots([])
      }
    })()
    loadSchedule()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.technicianId, form.mode, form.workDate, form.startDate, form.endDate])

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
              <input type="date" value={form.workDate} onChange={(e) => setField('workDate', e.target.value)} style={{
                width: '100%', padding: '12px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)', boxSizing: 'border-box'
              }} />
              {errors.workDate && <div style={{ color: 'var(--error-600)', fontSize: '12px', marginTop: '6px' }}>{errors.workDate}</div>}
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Ngày bắt đầu</label>
                <input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} style={{
                  width: '100%', padding: '12px', border: '2px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-secondary)', boxSizing: 'border-box'
                }} />
                {errors.startDate && <div style={{ color: 'var(--error-600)', fontSize: '12px', marginTop: '6px' }}>{errors.startDate}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Ngày kết thúc</label>
                <input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} style={{
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
            <button type="button" onClick={loadSchedule} style={{
              padding: '12px 20px', borderRadius: '10px', border: '2px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600
            }}>Xem lịch</button>
          </div>
        </form>
        <div style={{ gridColumn: '1 / -1', color: 'var(--text-tertiary)', fontSize: '12px' }}>
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
        {schedule.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>Chưa có dữ liệu.</p>
        ) : (
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
        )}
      </div>
    </div>
  )
}



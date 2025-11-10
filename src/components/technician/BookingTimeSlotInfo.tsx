import React from 'react'
import { BookingService } from '@/services/bookingService'

interface Props { bookingId: number; slotLabel?: string; workDate?: string }

export default function BookingTimeSlotInfo({ bookingId, slotLabel: slotLabelProp, workDate: workDateProp }: Props) {
  const [loading, setLoading] = React.useState(!slotLabelProp && !workDateProp)
  const [workDate, setWorkDate] = React.useState<string>(workDateProp || '')
  const [slotLabel, setSlotLabel] = React.useState<string>(slotLabelProp || '')

  React.useEffect(() => {
    if (slotLabelProp || workDateProp) return
    ;(async () => {
      setLoading(true)
      try {
        const detail = await BookingService.getBookingDetail(bookingId)
        const info = (detail as any)?.data?.timeSlotInfo || {}
        setWorkDate(info.workDate || '')
        setSlotLabel(info.slotLabel || info.slotTime || '')
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [bookingId, slotLabelProp, workDateProp])

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 0, padding: 12, background: '#fff' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Khung giờ</div>
      {loading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>Đang tải...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
          <div><span style={{ color: '#6B7280' }}>Ngày:</span> {workDate ? new Date(workDate).toLocaleDateString('vi-VN') : '-'}</div>
          <div><span style={{ color: '#6B7280' }}>Giờ:</span> {slotLabel || '-'}</div>
        </div>
      )}
    </div>
  )
}

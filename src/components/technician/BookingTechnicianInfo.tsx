import React from 'react'
import { BookingService } from '@/services/bookingService'

interface Props { bookingId: number; technicianName?: string; technicianPhone?: string }

export default function BookingTechnicianInfo({ bookingId, technicianName, technicianPhone }: Props) {
  const [loading, setLoading] = React.useState(!technicianName && !technicianPhone)
  const [name, setName] = React.useState<string>(technicianName || '')
  const [phone, setPhone] = React.useState<string>(technicianPhone || '')

  React.useEffect(() => {
    if (technicianName || technicianPhone) return
    (async () => {
      setLoading(true)
      try {
        const detail = await BookingService.getBookingDetail(bookingId)
        const t = (detail as any)?.data?.technicianInfo?.technicianName || ''
        const p = (detail as any)?.data?.technicianInfo?.technicianPhone || (detail as any)?.data?.technicianInfo?.phoneNumber || ''
        setName(t || '-')
        setPhone(p || '-')
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [bookingId, technicianName, technicianPhone])

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 0, padding: 12, background: '#fff' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Kỹ thuật viên</div>
      {loading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>Đang tải...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
          <div><span style={{ color: '#6B7280' }}>Họ tên: </span>{name || '-'}</div>
          <div><span style={{ color: '#6B7280' }}>SĐT: </span>{phone || '-'}</div>
        </div>
      )}
    </div>
  )
}

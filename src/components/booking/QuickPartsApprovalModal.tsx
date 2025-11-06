import { useEffect, useState } from 'react'
import PartsApproval from '@/components/booking/PartsApproval'
import { WorkOrderPartService } from '@/services/workOrderPartService'

interface QuickPartsApprovalModalProps {
  bookingId: number | null
  open: boolean
  onClose: () => void
}

export default function QuickPartsApprovalModal({ bookingId, open, onClose }: QuickPartsApprovalModalProps) {
  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState<Array<{ id: number; partId: number; partName?: string }>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      if (!open || !bookingId) return
      setLoading(true)
      setError(null)
      try {
        const items = await WorkOrderPartService.list(Number(bookingId))
        if (!ignore) {
          setParts(items.map(it => ({ id: it.id, partId: it.partId, partName: it.partName })))
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Không thể tải phụ tùng')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [open, bookingId])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: 'min(900px, 92vw)',
          maxHeight: '86vh',
          overflow: 'auto',
          margin: '6vh auto 0',
          background: '#fff',
          borderRadius: 12,
          border: '1px solid var(--border-primary)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          padding: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Phê duyệt phụ tùng • Booking #{bookingId}</h3>
          <button
            onClick={onClose}
            style={{ border: '1px solid var(--border-primary)', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
          >
            Đóng
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 16, color: 'var(--text-secondary)' }}>Đang tải phụ tùng...</div>
        ) : error ? (
          <div style={{ padding: 16, color: 'var(--error-600)' }}>{error}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {parts.map(p => (
              <PartsApproval key={p.id} bookingId={Number(bookingId)} partId={p.partId} partName={p.partName} />
            ))}
            {bookingId && parts.length === 0 && (
              <div style={{ color: 'var(--text-secondary)' }}>Không có phụ tùng cần phê duyệt.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}



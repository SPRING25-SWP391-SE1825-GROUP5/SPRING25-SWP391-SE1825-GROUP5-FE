import React, { useState } from 'react'
import { WorkOrderPartService } from '@/services/workOrderPartService'
import toast from 'react-hot-toast'

interface PartsApprovalProps {
  bookingId: number
  partId: number
  partName?: string
  defaultNote?: string
  onApproved?: (approved: boolean) => void
}

const PartsApproval: React.FC<PartsApprovalProps> = ({ bookingId, partId, partName, defaultNote, onApproved }) => {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState(defaultNote || '')

  const doApprove = async (approve: boolean) => {
    try {
      setLoading(true)
      const idempotencyKey = `${bookingId}-${partId}-${approve ? 'approve' : 'reject'}`
      const res = await WorkOrderPartService.customerApprove(bookingId, partId, approve, note?.trim() || undefined, idempotencyKey)
      if (res?.success) {
        toast.success(approve ? 'Đã chấp thuận thay thế' : 'Đã từ chối thay thế')
        onApproved?.(approve)
      } else {
        toast.error(res?.message || 'Thao tác thất bại')
      }
    } catch (e: any) {
      toast.error(e?.userMessage || e?.message || 'Không thể gửi phê duyệt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ border: '1px solid var(--border-primary)', borderRadius: 12, padding: 16, background: '#fff' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Phê duyệt thay thế phụ tùng</div>
      {partName && (
        <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Phụ tùng: <strong style={{ color: 'var(--text-primary)' }}>{partName}</strong></div>
      )}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ghi chú cho kỹ thuật viên (tuỳ chọn)"
        style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 8, border: '1px solid var(--border-primary)', marginBottom: 12 }}
        disabled={loading}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => doApprove(true)}
          disabled={loading}
          style={{ padding: '10px 16px', borderRadius: 8, border: '2px solid #10B981', background: '#10B981', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          Chấp thuận
        </button>
        <button
          onClick={() => doApprove(false)}
          disabled={loading}
          style={{ padding: '10px 16px', borderRadius: 8, border: '2px solid #EF4444', background: '#fff', color: '#EF4444', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          Từ chối
        </button>
      </div>
    </div>
  )
}

export default PartsApproval






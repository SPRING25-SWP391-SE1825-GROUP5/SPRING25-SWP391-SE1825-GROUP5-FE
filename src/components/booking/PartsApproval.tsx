import React, { useState } from 'react'
import { WorkOrderPartService } from '@/services/workOrderPartService'
import toast from 'react-hot-toast'

interface PartsApprovalProps {
  bookingId: number
  workOrderPartId: number // ID của work order part (bắt buộc)
  partId?: number // ID của part (optional, chỉ để hiển thị)
  partName?: string
  unitPrice?: number
  quantity?: number
  defaultNote?: string
  onApproved?: (approved: boolean) => void
  mode?: 'customer' | 'staff' // Mode: customer hoặc staff
  status?: string // Status của work order part: DRAFT, CONSUMED, REJECTED, etc.
}

const PartsApproval: React.FC<PartsApprovalProps> = ({
  bookingId,
  workOrderPartId,
  partId, // Giữ lại để backward compatible
  partName,
  unitPrice,
  quantity,
  defaultNote,
  onApproved,
  mode = 'customer', // Mặc định là customer mode
  status // Status của work order part
}) => {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState(defaultNote || '')

  // Kiểm tra xem đã được tiêu thụ hoặc từ chối chưa
  const statusUpper = (status || '').toUpperCase()
  const isConsumed = statusUpper === 'CONSUMED'
  const isRejected = statusUpper === 'REJECTED'
  const isPendingApproval = statusUpper === 'PENDING_CUSTOMER_APPROVAL'
  const isDraft = statusUpper === 'DRAFT' || !statusUpper
  const canApprove = !isConsumed && !isRejected

  const doApprove = async (approve: boolean) => {
    try {
      setLoading(true)

      if (mode === 'staff') {
        // Staff mode: dùng PUT /approve-and-consume hoặc PUT /reject
        if (approve) {
          const res = await WorkOrderPartService.staffApproveAndConsume(bookingId, workOrderPartId)
          if (res?.success) {
            toast.success('Đã chấp thuận và tiêu thụ phụ tùng')
            onApproved?.(true)
          } else {
            toast.error(res?.message || 'Thao tác thất bại')
          }
        } else {
          const res = await WorkOrderPartService.staffReject(bookingId, workOrderPartId)
          if (res?.success) {
            toast.success('Đã từ chối phụ tùng')
            onApproved?.(false)
          } else {
            toast.error(res?.message || 'Thao tác thất bại')
          }
        }
      } else {
        // Customer mode: dùng PUT /customer-approve hoặc PUT /customer-reject (theo API mới)
        const res = approve
          ? await WorkOrderPartService.customerApprove(bookingId, workOrderPartId)
          : await WorkOrderPartService.customerReject(bookingId, workOrderPartId)
        if (res?.success) {
          toast.success(approve ? 'Đã chấp thuận thay thế' : 'Đã từ chối thay thế')
          onApproved?.(approve)
        } else {
          toast.error(res?.message || 'Thao tác thất bại')
        }
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
      {(unitPrice !== undefined || quantity !== undefined) && (
        <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {unitPrice !== undefined && (
              <span>Đơn giá: <strong style={{ color: 'var(--text-primary)' }}>{(unitPrice || 0).toLocaleString('vi-VN')} VNĐ</strong></span>
            )}
            {quantity !== undefined && (
              <span>Số lượng: <strong style={{ color: 'var(--text-primary)' }}>{quantity}</strong></span>
            )}
            {unitPrice !== undefined && quantity !== undefined && (
              <span>Thành tiền: <strong style={{ color: 'var(--text-primary)' }}>{((unitPrice || 0) * (quantity || 0)).toLocaleString('vi-VN')} VNĐ</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Hiển thị trạng thái */}
      {isConsumed && (
        <div style={{
          padding: '12px',
          borderRadius: 8,
          background: '#D1FAE5',
          color: '#065F46',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontWeight: 600 }}>✓ Đã được tiêu thụ</span>
        </div>
      )}
      {isRejected && (
        <div style={{
          padding: '12px',
          borderRadius: 8,
          background: '#FEE2E2',
          color: '#991B1B',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontWeight: 600 }}>✗ Đã bị từ chối</span>
        </div>
      )}
      {isPendingApproval && (
        <div style={{
          padding: '12px',
          borderRadius: 8,
          background: '#FEF3C7',
          color: '#92400E',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontWeight: 600 }}>⏳ Chờ khách hàng xác nhận</span>
        </div>
      )}
      {isDraft && !isPendingApproval && !isConsumed && !isRejected && (
        <div style={{
          padding: '12px',
          borderRadius: 8,
          background: '#F3F4F6',
          color: '#374151',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontWeight: 600 }}>📝 Nháp</span>
        </div>
      )}

      {/* Chỉ hiển thị textarea cho customer mode và khi chưa được xử lý */}
      {mode === 'customer' && canApprove && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú cho kỹ thuật viên (tuỳ chọn)"
          style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 8, border: '1px solid var(--border-primary)', marginBottom: 12 }}
          disabled={loading}
        />
      )}

      {/* Chỉ hiển thị buttons khi chưa được xử lý */}
      {canApprove && (
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
      )}
    </div>
  )
}

export default PartsApproval






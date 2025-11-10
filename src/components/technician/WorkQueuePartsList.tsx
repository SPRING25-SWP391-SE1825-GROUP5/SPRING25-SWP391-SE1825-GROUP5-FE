import React from 'react'
import { WorkOrderPartItem } from '@/services/workOrderPartService'

interface Props {
  parts: WorkOrderPartItem[]
  centerId?: number
  isInProgress: boolean
  onDelete?: (partId: number) => void
  deletingPartId?: number | null
  availabilityByPartId?: Record<number, { available: boolean; availableQuantity: number }>
  canApproveCustomerParts?: boolean
  onApproveCustomerPart?: (partId: number) => Promise<void> | void
}

export default function WorkQueuePartsList({ parts, centerId, isInProgress, onDelete, deletingPartId, availabilityByPartId = {}, canApproveCustomerParts, onApproveCustomerPart }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Mã</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Tên phụ tùng</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Thương hiệu</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Đơn giá</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Số lượng</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Trạng thái</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((p) => {
            const isReplacementPart = p.id < 0
            const approvalStatus = (p.status || '').toUpperCase()
            const isApproved = approvalStatus === 'CONSUMED'
            const isDraft = approvalStatus === 'DRAFT'
            const canEdit = isInProgress && !isApproved && !isReplacementPart

            let statusText = 'Nháp'
            let statusColor = '#6B7280'
            const statusUpper = approvalStatus

            if (statusUpper === 'CONSUMED') { statusText = 'Đã xác nhận'; statusColor = '#10B981' }
            else if (statusUpper === 'PENDING_CUSTOMER_APPROVAL') { statusText = 'Chờ xác nhận'; statusColor = '#F59E0B' }
            else if (statusUpper === 'REJECTED') { statusText = 'Đã từ chối'; statusColor = '#EF4444' }

            return (
              <tr key={p.id}>
                <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>{p.partNumber || p.partId}</td>
                <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13, color: '#111827' }}>{p.partName || '-'}</td>
                <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>{p.brand || '-'}</td>
                <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13 }}>{(p.unitPrice || 0).toLocaleString('vi-VN')}</td>
                <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13 }}>{p.quantity}</td>
                <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-block', padding: '4px 8px', border: `1px solid ${statusColor}`, color: statusColor, borderRadius: 0, background: `${statusColor}15`, fontSize: 12, fontWeight: 500 }}>{statusText}</span>
                    <span title={p.isCustomerSupplied ? 'Phụ tùng do khách mang đến' : 'Phụ tùng từ kho'} style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 6, fontSize: 11, border: '1px solid', borderColor: p.isCustomerSupplied ? '#F59E0B' : '#10B981', color: p.isCustomerSupplied ? '#92400E' : '#065F46', background: p.isCustomerSupplied ? '#FEF3C7' : '#ECFDF5' }}>{p.isCustomerSupplied ? 'KH' : 'Kho'}</span>
                    {centerId ? (() => {
                      const info = availabilityByPartId[p.partId]
                      const availQty = info?.availableQuantity ?? 0
                      const need = p.quantity || 1
                      const ok = (info?.available ?? false) && availQty >= need
                      const low = (info?.available ?? false) && availQty > 0 && availQty < need
                      const color = ok ? '#065F46' : low ? '#92400E' : '#991B1B'
                      const bg = ok ? '#ECFDF5' : low ? '#FEF3C7' : '#FEF2F2'
                      const bd = ok ? '#10B981' : low ? '#F59E0B' : '#EF4444'
                      const label = ok ? 'Đủ' : low ? `Thiếu (${availQty}/${need})` : 'Hết'
                      return (
                        <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 0, fontSize: 11, border: `1px solid ${bd}`, color, background: bg }}>
                          Kho: {label}
                        </span>
                      )
                    })() : null}
                  </div>
                </td>
                <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', gap: 8 }}>
                    {canEdit && onDelete && (
                      <button onClick={() => onDelete(p.id)} disabled={deletingPartId === p.id} style={{ padding: '6px 12px', border: '1px solid #EF4444', borderRadius: 6, background: deletingPartId === p.id ? '#f3f4f6' : '#FFFFFF', color: deletingPartId === p.id ? '#9ca3af' : '#EF4444', cursor: deletingPartId === p.id ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease' }}> {deletingPartId === p.id ? 'Đang xóa...' : 'Xóa'} </button>
                    )}
                    {canApproveCustomerParts && (approvalStatus === 'PENDING_CUSTOMER_APPROVAL') && onApproveCustomerPart && (
                      <button onClick={() => onApproveCustomerPart(p.id)} style={{ padding: '6px 12px', border: '1px solid #10B981', borderRadius: 6, background: '#ECFDF5', color: '#065F46', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Duyệt</button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
          {parts.length === 0 && (
            <tr>
              <td colSpan={6} style={{ border: '1px solid #FFD875', padding: '16px', textAlign: 'center', fontSize: 13, color: '#6B7280' }}>Chưa có phụ tùng phát sinh</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

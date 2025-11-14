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
  onApprovePart?: (partId: number) => Promise<void> | void
  onRejectPart?: (partId: number) => Promise<void> | void
  approvingPartId?: number | null
}

export default function WorkQueuePartsList({ parts, centerId, isInProgress, onDelete, deletingPartId, availabilityByPartId = {}, canApproveCustomerParts, onApproveCustomerPart, onApprovePart, onRejectPart, approvingPartId }: Props) {
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
                  </div>
                </td>
                <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', gap: 8 }}>
                    {canEdit && onDelete && (
                      <button onClick={() => onDelete(p.id)} disabled={deletingPartId === p.id} style={{ padding: '6px 12px', border: '1px solid #EF4444', borderRadius: 6, background: deletingPartId === p.id ? '#f3f4f6' : '#FFFFFF', color: deletingPartId === p.id ? '#9ca3af' : '#EF4444', cursor: deletingPartId === p.id ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease' }}> {deletingPartId === p.id ? 'Đang xóa...' : 'Xóa'} </button>
                    )}
                    {/* Nút Duyệt cho phụ tùng phát sinh (status DRAFT) - gọi API approve-and-consume */}
                    {isInProgress && !isApproved && !isReplacementPart && (approvalStatus === 'DRAFT' || !approvalStatus) && onApprovePart && (
                      <button
                        onClick={() => onApprovePart(p.id)}
                        disabled={approvingPartId === p.id}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #10B981',
                          borderRadius: 6,
                          background: approvingPartId === p.id ? '#f3f4f6' : '#ECFDF5',
                          color: approvingPartId === p.id ? '#9ca3af' : '#065F46',
                          cursor: approvingPartId === p.id ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {approvingPartId === p.id ? 'Đang duyệt...' : 'Duyệt'}
                      </button>
                    )}
                    {/* Nút Từ chối cho phụ tùng phát sinh (status DRAFT) */}
                    {isInProgress && !isApproved && !isReplacementPart && (approvalStatus === 'DRAFT' || !approvalStatus) && onRejectPart && (
                      <button
                        onClick={() => onRejectPart(p.id)}
                        disabled={approvingPartId === p.id}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #EF4444',
                          borderRadius: 6,
                          background: approvingPartId === p.id ? '#f3f4f6' : '#FEF2F2',
                          color: approvingPartId === p.id ? '#9ca3af' : '#991B1B',
                          cursor: approvingPartId === p.id ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {approvingPartId === p.id ? 'Đang xử lý...' : 'Từ chối'}
                      </button>
                    )}
                    {/* Nút Duyệt cho phụ tùng cần customer approval (status PENDING_CUSTOMER_APPROVAL) */}
                    {canApproveCustomerParts && (approvalStatus === 'PENDING_CUSTOMER_APPROVAL') && onApproveCustomerPart && (
                      <button
                        onClick={() => onApproveCustomerPart(p.id)}
                        disabled={approvingPartId === p.id}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #10B981',
                          borderRadius: 6,
                          background: approvingPartId === p.id ? '#f3f4f6' : '#ECFDF5',
                          color: approvingPartId === p.id ? '#9ca3af' : '#065F46',
                          cursor: approvingPartId === p.id ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 600
                        }}
                      >
                        {approvingPartId === p.id ? 'Đang duyệt...' : 'Duyệt'}
                      </button>
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

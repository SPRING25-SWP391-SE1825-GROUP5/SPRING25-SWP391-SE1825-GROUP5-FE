import React from 'react'

export type ChecklistRow = { resultId: number; partId?: number; partName?: string; categoryId?: number; categoryName?: string; description?: string; result?: string | null; notes?: string; status?: string }

interface Props {
  rows: ChecklistRow[]
  isEditable: boolean
  onSet: (row: ChecklistRow, val: 'PASS' | 'FAIL') => void
  updatingId?: number | null
}

export default function WorkQueueChecklist({ rows, isEditable, onSet, updatingId }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>#</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Phụ tùng</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Mô tả</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Trạng thái</th>
            <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Đánh giá</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isFail = (row.result === 'FAIL' || row.result === 'fail')
            const isPass = (row.result === 'PASS' || row.result === 'pass')
            const statusColor = isPass ? '#10B981' : isFail ? '#EF4444' : '#6B7280'
            const statusText = isPass ? 'Đạt' : isFail ? 'Không đạt' : 'Chưa đánh giá'

            return (
              <tr key={`${row.resultId || idx}`}>
                <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13 }}>{idx + 1}</td>
                <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13, color: '#111827' }}>{row.partName || row.categoryName || '-'}</td>
                <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>{row.description || '-'}</td>
                <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13 }}>
                  <span style={{ display: 'inline-block', padding: '4px 8px', border: `1px solid ${statusColor}`, color: statusColor, borderRadius: 0, background: '#FFFFFF' }}>{statusText}</span>
                </td>
                <td style={{ border: '1px solid #E5E7EB', padding: '10px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => onSet(row, 'PASS')} disabled={!isEditable || updatingId === row.resultId} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${(row.result === 'PASS' || row.result === 'pass') ? '#FFD875' : '#D1D5DB'}`, background: (row.result === 'PASS' || row.result === 'pass') ? '#FFF6D1' : (isEditable ? '#FFFFFF' : '#F9FAFB'), color: '#374151', fontSize: 13, fontWeight: 400, cursor: (!isEditable || updatingId === row.resultId) ? 'not-allowed' : 'pointer' }}>Đạt</button>
                    <button onClick={() => onSet(row, 'FAIL')} disabled={!isEditable || updatingId === row.resultId} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${(row.result === 'FAIL' || row.result === 'fail') ? '#FFD875' : '#D1D5DB'}`, background: (row.result === 'FAIL' || row.result === 'fail') ? '#FFF6D1' : (isEditable ? '#FFFFFF' : '#F9FAFB'), color: '#374151', fontSize: 13, fontWeight: 400, cursor: (!isEditable || updatingId === row.resultId) ? 'not-allowed' : 'pointer' }}>Không đạt</button>
                  </div>
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ border: '1px solid #E5E7EB', padding: '16px', textAlign: 'center', fontSize: 13, color: '#6B7280' }}>Không có hạng mục kiểm tra</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

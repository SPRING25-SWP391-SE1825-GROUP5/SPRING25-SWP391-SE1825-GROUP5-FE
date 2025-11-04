import React, { useMemo, useState } from 'react'
import { PartService, Part } from '@/services/partService'
import { WorkOrderPartService, WorkOrderPartItem } from '@/services/workOrderPartService'
import bookingRealtimeService from '@/services/bookingRealtimeService'
import { BookingService } from '@/services/bookingService'

type ChecklistRow = { resultId: number; partId: number; partName?: string; description?: string; result?: string; notes?: string }

interface WorkQueueRowExpansionProps {
  workId: number
  bookingId: number
  centerId?: number
  status?: string
  items: ChecklistRow[]
  onSetItemResult: (resultId: number, partId: number, result: 'PASS' | 'FAIL', notes?: string) => Promise<void> | void
  onConfirmChecklist: () => Promise<void> | void
  onConfirmParts: () => Promise<void> | void
}

export default function WorkQueueRowExpansion({
  workId,
  bookingId,
  centerId,
  status,
  items,
  onSetItemResult,
  onConfirmChecklist,
  onConfirmParts
}: WorkQueueRowExpansionProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [showSelectPart, setShowSelectPart] = useState(false)
  const [parts, setParts] = useState<WorkOrderPartItem[]>([])
  const [summary, setSummary] = useState<{ total: number; pass: number; fail: number; na: number } | null>(null)
  const totalCost = useMemo(() => parts.reduce((sum, p) => sum + (p.unitPrice || 0) * p.quantity, 0), [parts])
  // inline notes editing; no modal
  const normalized = (status || '').toLowerCase()
  const isInProgress = normalized === 'in_progress'
  const isReadOnly = normalized === 'completed' || normalized === 'paid'
  const isChecklistEditable = isInProgress

  // Load parts from API
  React.useEffect(() => {
    (async () => {
      try {
        const list = await WorkOrderPartService.list(bookingId)
        setParts(list)
      } catch {
        setParts([])
      }
    })()
  }, [bookingId])

  // Load checklist summary for mini-stats
  React.useEffect(() => {
    (async () => {
      try {
        const res = await BookingService.getMaintenanceChecklistSummary(bookingId)
        if (res?.success) setSummary({ total: res.total, pass: res.pass, fail: res.fail, na: res.na })
      } catch {}
    })()
  }, [bookingId])

  // Subscribe parts realtime for this booking
  React.useEffect(() => {
    bookingRealtimeService.setOnPartsUpdated((ev) => {
      if (ev.bookingId !== bookingId) return
      // Refetch parts when any change occurs
      (async () => {
        try { setParts(await WorkOrderPartService.list(bookingId)) } catch { /* ignore */ }
      })()
    })
    return () => { /* noop */ }
  }, [bookingId])

  const handleSet = async (row: ChecklistRow, val: 'PASS' | 'FAIL') => {
    if (!row?.resultId || !row?.partId) return
    try {
      setUpdatingId(row.resultId)
      await onSetItemResult(row.resultId, row.partId, val, row.notes)
    } finally {
      setUpdatingId(null)
    }
  }

  const checklistOk = useMemo(() => {
    return (items || []).every((r) => {
      if (!r.result) return false
      if (r.result === 'FAIL') return !!(r.notes && r.notes.trim().length > 0)
      return true
    })
  }, [items])

  return (
    <tr style={{ background: '#FAFAFA' }}>
      <td colSpan={7} style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#374151', fontWeight: 400 }}>Danh sách kiểm tra</h4>
          {summary && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span style={{ border: '1px solid #FFD875', background: '#FFF6D1', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>Tổng: {summary.total}</span>
              <span style={{ border: '1px solid #10B98133', background: '#ECFDF5', color: '#065F46', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>Đạt: {summary.pass}</span>
              <span style={{ border: '1px solid #EF444433', background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>Không đạt: {summary.fail}</span>
              <span style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>N/A: {summary.na}</span>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}
              onDragOver={(e) => { if (isInProgress) e.preventDefault() }}
              onDrop={async (e) => {
                if (!isInProgress) return
                const raw = e.dataTransfer.getData('application/part')
                if (!raw) return
                try {
                  const part = JSON.parse(raw) as Part
                  const quantity = 1
                  const check = await PartService.checkPartAvailability(part.partId, quantity)
                  if (!check.success || !check.available) return
                  const created = await WorkOrderPartService.add(bookingId, { partId: part.partId, quantity })
                  setParts(prev => prev.concat(created))
                } catch {}
              }}
            >
              {isInProgress && (
                <caption style={{ captionSide: 'bottom', textAlign: 'left', padding: '6px 0', fontSize: 12, color: '#6B7280' }}>
                  Gợi ý: Kéo phụ tùng từ danh sách bên trên và thả vào bảng để thêm nhanh x1.
                </caption>
              )}
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
                {items.map((row, idx) => {
                  const statusColor = row.result === 'PASS' ? '#10B981' : row.result === 'FAIL' ? '#EF4444' : '#6B7280'
                  const statusText = row.result === 'PASS' ? 'Đạt' : row.result === 'FAIL' ? 'Không đạt' : 'Chưa đánh giá'
                  return (
                    <tr key={`${workId}-${row.resultId || idx}`}>
                      <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13 }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13, color: '#111827' }}>{row.partName || '-'}</td>
                      <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: 'var(--text-secondary)' }}>{row.description || '-'}</td>
                      <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13 }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          border: `1px solid ${statusColor}`,
                          color: statusColor,
                          borderRadius: 6,
                          background: '#FFFFFF'
                        }}>{statusText}</span>
                      </td>
                      <td style={{ border: '1px solid #E5E7EB', padding: '10px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            onClick={() => handleSet(row, 'PASS')}
                            disabled={!isChecklistEditable || updatingId === row.resultId}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: `1px solid ${row.result === 'PASS' ? '#FFD875' : '#D1D5DB'}`,
                              background: row.result === 'PASS' ? '#FFF6D1' : (isChecklistEditable ? '#FFFFFF' : '#F9FAFB'),
                              color: '#374151',
                              fontSize: 13,
                              fontWeight: 400,
                              cursor: (!isChecklistEditable || updatingId === row.resultId) ? 'not-allowed' : 'pointer'
                            }}
                          >Đạt</button>
                          <button
                            onClick={() => handleSet(row, 'FAIL')}
                            disabled={!isChecklistEditable || updatingId === row.resultId}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: `1px solid ${row.result === 'FAIL' ? '#FFD875' : '#D1D5DB'}`,
                              background: row.result === 'FAIL' ? '#FFF6D1' : (isChecklistEditable ? '#FFFFFF' : '#F9FAFB'),
                              color: '#374151',
                              fontSize: 13,
                              fontWeight: 400,
                              cursor: (!isChecklistEditable || updatingId === row.resultId) ? 'not-allowed' : 'pointer'
                            }}
                          >Không đạt</button>
                          {row.result === 'FAIL' && (
                            <input
                              placeholder="Ghi chú (bắt buộc)"
                              defaultValue={row.notes || ''}
                              onBlur={async (e) => {
                                if (!isChecklistEditable) return
                                const val = (e.target.value || '').trim()
                                if (!val) {
                                  e.currentTarget.style.borderColor = '#EF4444'
                                  return
                                }
                                e.currentTarget.style.borderColor = '#D1D5DB'
                                await onSetItemResult(row.resultId!, row.partId!, 'FAIL', val)
                              }}
                              disabled={!isChecklistEditable}
                              style={{ maxWidth: 240, width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, background: !isChecklistEditable ? '#F9FAFB' : '#FFFFFF' }}
                            />
                          )}
                          {!!row.notes && row.result === 'FAIL' && (
                            <span style={{ fontSize: 12, color: '#6B7280' }} title={row.notes}>Có ghi chú</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ border: '1px solid #E5E7EB', padding: '16px', textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
                      Không có hạng mục kiểm tra
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            {isChecklistEditable ? (
              <button
                type="button"
                disabled={!checklistOk}
                onClick={() => onConfirmChecklist()}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #FFD875', background: checklistOk ? '#FFF6D1' : '#FFFFFF', color: '#111827', fontSize: 13, fontWeight: 400, cursor: checklistOk ? 'pointer' : 'not-allowed' }}
              >Xác nhận checklist</button>
            ) : null}
          </div>
        </div>

        {/* Work order parts (phụ tùng phát sinh) - hiển thị khi đang làm việc hoặc xem lại sau khi hoàn tất (read-only) */}
        {(isInProgress || isReadOnly) && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: '#374151', fontWeight: 400 }}>Phụ tùng phát sinh {isReadOnly ? '(chế độ xem)' : ''}</h4>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setShowSelectPart(true)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #FFD875',
                  background: '#FFF6D1',
                  color: '#111827',
                  fontSize: 13,
                  fontWeight: 400,
                  cursor: 'pointer'
                }}
              >Thêm phụ tùng</button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Mã</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Tên phụ tùng</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Thương hiệu</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Đơn giá</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Tồn kho</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Số lượng</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Ghi chú</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>{p.partNumber || p.partId}</td>
                    <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13, color: '#111827' }}>{p.partName || '-'}</td>
                    <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>{p.brand || '-'}</td>
                    <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13 }}>{(p.unitPrice || 0).toLocaleString('vi-VN')}</td>
                    <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13 }}>{p.totalStock ?? '-'}</td>
                    <td style={{ border: '1px solid #FFD875', padding: '8px', textAlign: 'right', fontSize: 13 }}>
                      <input
                        type="number"
                        min={1}
                        value={p.quantity}
                        onChange={async (e) => {
                          if (!isInProgress) return
                          const val = Math.max(1, Number(e.target.value || 1))
                          // Check availability before commit
                          try {
                            const check = await PartService.checkPartAvailability(p.partId, val)
                            if (!check.success || !check.available) {
                              e.currentTarget.style.borderColor = '#EF4444'
                              return
                            }
                            e.currentTarget.style.borderColor = '#D1D5DB'
                            await WorkOrderPartService.update(bookingId, p.id, { quantity: val })
                            setParts(prev => prev.map(x => x.id === p.id ? { ...x, quantity: val } : x))
                          } catch {
                            e.currentTarget.style.borderColor = '#EF4444'
                          }
                        }}
                        disabled={!isInProgress}
                        style={{ width: 80, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, textAlign: 'right', background: !isInProgress ? '#F9FAFB' : '#FFFFFF' }}
                      />
                    </td>
                    <td style={{ border: '1px solid #FFD875', padding: '8px', fontSize: 13 }}>
                      <input
                        placeholder="Ghi chú"
                        value={p.notes || ''}
                        onChange={async (e) => {
                          if (!isInProgress) return
                          const val = e.target.value
                          await WorkOrderPartService.update(bookingId, p.id, { notes: val })
                          setParts(prev => prev.map(x => x.id === p.id ? { ...x, notes: val } : x))
                        }}
                        disabled={!isInProgress}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, background: !isInProgress ? '#F9FAFB' : '#FFFFFF' }}
                      />
                    </td>
                    <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'center' }}>
                      {isInProgress ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await WorkOrderPartService.remove(bookingId, p.id)
                            setParts(prev => prev.filter(x => x.id !== p.id))
                          }}
                          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #FFD875', background: '#FFF6D1', color: '#374151', fontSize: 13, cursor: 'pointer' }}
                        >Xóa</button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#6B7280' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {parts.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ border: '1px solid #FFD875', padding: '16px', textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
                      Chưa có phụ tùng phát sinh
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
            {isInProgress ? (
              <button
                type="button"
                onClick={() => onConfirmParts()}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #FFD875', background: '#FFF6D1', color: '#111827', fontSize: 13, fontWeight: 400, cursor: 'pointer' }}
              >Xác nhận phụ tùng phát sinh</button>
            ) : (
              <span />
            )}
            <div style={{ fontSize: 13, color: '#111827', fontWeight: 400 }}>
              Tổng tạm tính: {totalCost.toLocaleString('vi-VN')} VNĐ
            </div>
          </div>
        </div>
        )}

        {showSelectPart && isInProgress && (
          <SelectPartModal
            onClose={() => setShowSelectPart(false)}
            centerId={centerId}
            onSelect={async (part, quantity) => {
              try {
                const check = await PartService.checkPartAvailability(part.partId, quantity)
                if (!check.success || !check.available) return
                const created = await WorkOrderPartService.add(bookingId, { partId: part.partId, quantity })
                setParts(prev => prev.concat(created))
                setShowSelectPart(false)
              } catch {}
            }}
          />
        )}

        {/* no note editor modal (inline notes editing only) */}
      </td>
    </tr>
  )
}

interface SelectPartModalProps {
  onClose: () => void
  onSelect: (part: Part, quantity: number) => void | Promise<void>
}

function SelectPartModal({ onClose, onSelect, centerId }: SelectPartModalProps & { centerId?: number }) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Part[]>([])
  const [selected, setSelected] = useState<Part | null>(null)
  const [qty, setQty] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const res = await PartService.getPartAvailability({ centerId, searchTerm: search, inStock: true, pageSize: 10, pageNumber: 1 })
      setData(res?.data || [])
    } finally {
      setLoading(false)
    }
  }

  // initial load
  React.useEffect(() => {
    load()
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '800px', maxWidth: '95vw', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 400, color: '#111827' }}>Chọn phụ tùng</h3>
          <button onClick={onClose} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#FFFFFF', cursor: 'pointer' }}>Đóng</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              placeholder="Tìm kiếm phụ tùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }}
            />
            <button onClick={load} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer' }}>Tìm</button>
          </div>

          <div style={{ overflow: 'auto', maxHeight: '50vh', border: '1px solid #E5E7EB', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '16%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Mã</th>
                  <th style={{ width: '32%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Tên</th>
                  <th style={{ width: '16%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Thương hiệu</th>
                  <th style={{ width: '16%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Giá</th>
                  <th style={{ width: '12%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Tồn kho</th>
                  <th style={{ width: '8%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Chọn</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>Đang tải...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>Không có phụ tùng phù hợp</td></tr>
                ) : (
                  data.map((p) => (
                    <tr
                      key={p.partId}
                      style={{ borderBottom: '1px solid #F1F5F9' }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/part', JSON.stringify(p))
                      }}
                    >
                      <td style={{ padding: '10px', fontSize: 13 }}>{p.partNumber}</td>
                      <td style={{ padding: '10px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.partName}</td>
                      <td style={{ padding: '10px', fontSize: 13 }}>{p.brand}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>{p.unitPrice.toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>{p.totalStock}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelected(p)}
                          style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, background: selected?.partId === p.partId ? '#111827' : '#FFFFFF', color: selected?.partId === p.partId ? '#FFFFFF' : '#374151', cursor: 'pointer', fontSize: 13 }}
                        >{selected?.partId === p.partId ? 'Đã chọn' : 'Chọn'}</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, color: '#374151' }}>Số lượng</label>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))} style={{ width: 100, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6 }} />
            </div>
            <button
              disabled={!selected}
              onClick={() => selected && onSelect(selected, qty)}
              style={{ padding: '8px 14px', border: '1px solid #D1D5DB', borderRadius: 8, background: selected ? '#111827' : '#FFFFFF', color: selected ? '#FFFFFF' : '#9CA3AF', cursor: selected ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700 }}
            >Thêm</button>
          </div>
        </div>
      </div>
    </div>
  )
}



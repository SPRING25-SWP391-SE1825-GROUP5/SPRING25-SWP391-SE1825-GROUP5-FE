import React, { useMemo, useState } from 'react'
import { PartService, Part } from '@/services/partService'
import { TechnicianService } from '@/services/technicianService'
import { WorkOrderPartService, WorkOrderPartItem } from '@/services/workOrderPartService'
import bookingRealtimeService from '@/services/bookingRealtimeService'
import { BookingService } from '@/services/bookingService'
import toast from 'react-hot-toast'
// removed BookingService summary call; compute locally from items

type ChecklistRow = { resultId: number; partId?: number; partName?: string; categoryId?: number; categoryName?: string; description?: string; result?: string | null; notes?: string; status?: string }

interface WorkQueueRowExpansionProps {
  workId: number
  bookingId: number
  centerId?: number
  status?: string
  items: ChecklistRow[]
  onSetItemResult: (
    resultId: number, 
    partId: number | undefined, 
    result: 'PASS' | 'FAIL', 
    notes?: string,
    replacementInfo?: {
      requireReplacement?: boolean
      replacementPartId?: number
      replacementQuantity?: number
    }
  ) => Promise<void> | void
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
  // Edit part modal state
  const [editingPartId, setEditingPartId] = useState<number | null>(null)
  // Editable descriptions per resultId
  const [descById, setDescById] = useState<Record<number, string>>({})
  // Modal chọn phụ tùng khi đánh FAIL theo category
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [modalCategoryId, setModalCategoryId] = useState<number | null>(null)
  const [modalResultId, setModalResultId] = useState<number | null>(null)
  const [checklistConfirmed, setChecklistConfirmed] = useState(false)
  const [confirmingChecklist, setConfirmingChecklist] = useState(false)
  const totalCost = useMemo(() => parts.reduce((sum, p) => sum + (p.unitPrice || 0) * p.quantity, 0), [parts])
  // inline notes editing; no modal
  const normalized = (status || '').toLowerCase()
  const isInProgress = normalized === 'in_progress'
  const isReadOnly = normalized === 'completed' || normalized === 'paid'
  const isChecklistEditable = isInProgress

  // Load parts from API (cả phụ tùng phát sinh thông thường và phụ tùng thay thế từ checklist)
  React.useEffect(() => {
    (async () => {
      try {
        // 1. Load phụ tùng phát sinh thông thường từ API /Booking/{bookingId}/parts
        let list = await WorkOrderPartService.list(bookingId)
        
        // 1b. Load chi tiết từ API /api/Part/{id} để lấy đơn giá và thông tin đầy đủ
        list = await Promise.all(list.map(async (p) => {
          try {
            // Luôn gọi API /api/Part/{id} để lấy unitPrice chính xác
            console.log(`[DEBUG] Loading part detail for partId: ${p.partId}`)
            const partDetail = await PartService.getPartById(p.partId)
            console.log(`[DEBUG] Part ${p.partId} response:`, partDetail)
            
            if (partDetail.success && partDetail.data) {
              const raw = partDetail.data as any
              // Map từ nhiều field name có thể: unitPrice, price, Price, UnitPrice
              const unitPrice = raw.unitPrice ?? raw.UnitPrice ?? raw.price ?? raw.Price ?? p.unitPrice ?? 0
              
              console.log(`[DEBUG] Part ${p.partId} - Raw data:`, raw, 'Mapped unitPrice:', unitPrice)
              
              return {
                ...p,
                partNumber: partDetail.data.partNumber || p.partNumber,
                partName: partDetail.data.partName || p.partName,
                brand: partDetail.data.brand || p.brand,
                unitPrice: unitPrice, // Lấy đơn giá từ API Part/{id}
                totalStock: partDetail.data.totalStock ?? p.totalStock
              }
            } else {
              console.warn(`[DEBUG] Part ${p.partId} - API không thành công:`, partDetail)
            }
          } catch (err) {
            console.error(`[DEBUG] Lỗi khi load chi tiết phụ tùng ${p.partId}:`, err)
          }
          
          return p
        }))
        
        // 2. Load checklist từ API để lấy thông tin replacement parts (chỉ với quyền KTV)
        let replacementParts: WorkOrderPartItem[] = []
        try {
          const checklistRes = await TechnicianService.getMaintenanceChecklist(bookingId)
          const checklistItems = checklistRes?.items || checklistRes?.data?.items || checklistRes?.data?.results || []
          
          // 3. Lấy các phụ tùng thay thế từ checklist (các items có result = FAIL và có replacementPartId)
          for (const item of checklistItems) {
            const result = (item as any).result || ''
            const replacementPartId = (item as any).replacementPartId
            const replacementQuantity = (item as any).replacementQuantity
            
            if ((result === 'FAIL' || result === 'fail') && replacementPartId) {
              try {
                const partDetail = await PartService.getPartById(replacementPartId)
                if (partDetail.success && partDetail.data) {
                  const raw = partDetail.data as any
                  // Map từ nhiều field name có thể: unitPrice, price, Price, UnitPrice
                  const unitPrice = raw.unitPrice ?? raw.UnitPrice ?? raw.price ?? raw.Price ?? 0
                  const replacementQty = replacementQuantity || 1
                  replacementParts.push({
                    id: -((item as any).resultId || 0), // Dùng số âm để phân biệt với parts thông thường
                    partId: partDetail.data.partId,
                    partNumber: partDetail.data.partNumber,
                    partName: partDetail.data.partName,
                    brand: partDetail.data.brand,
                    unitPrice: unitPrice, // Lấy đơn giá từ API Part/{id}
                    totalStock: partDetail.data.totalStock,
                    quantity: replacementQty,
                    notes: `Thay thế cho ${(item as any).partName || (item as any).categoryName || 'phụ tùng'} (từ checklist)`,
                    status: (item as any).status || 'DRAFT' // Lấy status từ checklist item
                  })
                }
              } catch (err) {
                console.error('Lỗi khi load replacement part:', err)
              }
            }
          }
        } catch (err) {
          console.error('Lỗi khi load checklist để lấy replacement parts:', err)
        }
        
        // 4. Merge 2 danh sách
        setParts([...list, ...replacementParts])
      } catch {
        setParts([])
      }
    })()
  }, [bookingId])

// Tính summary từ items (không gọi API summary)
 React.useEffect(() => {
    const total = (items || []).length
    const pass = (items || []).filter(i => i.result === 'PASS' || i.result === 'pass').length
    const fail = (items || []).filter(i => i.result === 'FAIL' || i.result === 'fail').length
    const na = total - pass - fail
    setSummary({ total, pass, fail, na })
  }, [items])

  // Load checklist status để kiểm tra xem đã được confirm chưa
  React.useEffect(() => {
    if (!bookingId || !isInProgress) return
    ;(async () => {
      try {
        const statusData = await BookingService.getMaintenanceChecklistStatus(bookingId)
        // Checklist đã được confirm khi status === "COMPLETED"
        setChecklistConfirmed(statusData?.status === 'COMPLETED' || statusData?.status === 'Completed')
      } catch (err) {
        console.error('Lỗi khi load checklist status:', err)
        // Nếu không load được, mặc định là chưa confirm
        setChecklistConfirmed(false)
      }
    })()
  }, [bookingId, isInProgress])

  // Xử lý xác nhận checklist
  const handleConfirmChecklist = async () => {
    if (!isInProgress || checklistConfirmed) return
    setConfirmingChecklist(true)
    try {
      await onConfirmChecklist()
      // Reload lại status sau khi confirm
      try {
        const statusData = await BookingService.getMaintenanceChecklistStatus(bookingId)
        setChecklistConfirmed(statusData?.status === 'COMPLETED' || statusData?.status === 'Completed')
      } catch {
        // Nếu không load được, set là đã confirm
        setChecklistConfirmed(true)
      }
      toast.success('Đã xác nhận checklist thành công')
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xác nhận checklist')
    } finally {
      setConfirmingChecklist(false)
    }
  }

  // Initialize editable descriptions from props
  React.useEffect(() => {
    const map: Record<number, string> = {}
    ;(items || []).forEach(i => { if (i.resultId) map[i.resultId] = i.description || '' })
    setDescById(map)
  }, [items])

  // Subscribe parts realtime for this booking
  React.useEffect(() => {
    bookingRealtimeService.setOnPartsUpdated((ev) => {
      if (ev.bookingId !== bookingId) return
      // Refetch parts when any change occurs (bao gồm cả replacement parts)
      ;(async () => {
        try {
          let list = await WorkOrderPartService.list(bookingId)
          
          // Load chi tiết từ API /api/Part/{id} để lấy đơn giá và thông tin đầy đủ
          list = await Promise.all(list.map(async (p) => {
            try {
              // Luôn gọi API /api/Part/{id} để lấy unitPrice chính xác
              const partDetail = await PartService.getPartById(p.partId)
              if (partDetail.success && partDetail.data) {
                const raw = partDetail.data as any
                // Map từ nhiều field name có thể: unitPrice, price, Price, UnitPrice
                const unitPrice = raw.unitPrice ?? raw.UnitPrice ?? raw.price ?? raw.Price ?? p.unitPrice ?? 0
                
                return {
                  ...p,
                  partNumber: partDetail.data.partNumber || p.partNumber,
                  partName: partDetail.data.partName || p.partName,
                  brand: partDetail.data.brand || p.brand,
                  unitPrice: unitPrice, // Lấy đơn giá từ API Part/{id}
                  totalStock: partDetail.data.totalStock ?? p.totalStock
                }
              }
            } catch (err) {
              console.error('Lỗi khi load chi tiết phụ tùng:', err)
            }
            return p
          }))
          
          // Load replacement parts từ checklist
          let replacementParts: WorkOrderPartItem[] = []
          try {
            const checklistRes = await TechnicianService.getMaintenanceChecklist(bookingId)
            const checklistItems = checklistRes?.items || checklistRes?.data?.items || checklistRes?.data?.results || []
            
            for (const item of checklistItems) {
              const result = (item as any).result || ''
              const replacementPartId = (item as any).replacementPartId
              const replacementQuantity = (item as any).replacementQuantity
              
              if ((result === 'FAIL' || result === 'fail') && replacementPartId) {
                try {
                  const partDetail = await PartService.getPartById(replacementPartId)
                  if (partDetail.success && partDetail.data) {
                    const raw = partDetail.data as any
                    // Map từ nhiều field name có thể: unitPrice, price, Price, UnitPrice
                    const unitPrice = raw.unitPrice ?? raw.UnitPrice ?? raw.price ?? raw.Price ?? 0
                    const replacementQty = replacementQuantity || 1
                    replacementParts.push({
                      id: -((item as any).resultId || 0),
                      partId: partDetail.data.partId,
                      partNumber: partDetail.data.partNumber,
                      partName: partDetail.data.partName,
                      brand: partDetail.data.brand,
                      unitPrice: unitPrice, // Lấy đơn giá từ API Part/{id}
                      totalStock: partDetail.data.totalStock,
                      quantity: replacementQty,
                      notes: `Thay thế cho ${(item as any).partName || (item as any).categoryName || 'phụ tùng'} (từ checklist)`,
                      status: (item as any).status || 'DRAFT'
                    })
                  }
                } catch (err) {
                  console.error('Lỗi khi load replacement part:', err)
                }
              }
            }
          } catch (err) {
            console.error('Lỗi khi load checklist để lấy replacement parts:', err)
          }
          
          setParts([...list, ...replacementParts])
        } catch { /* ignore */ }
      })()
    })
    return () => { /* noop */ }
  }, [bookingId])

  const handleSet = async (row: ChecklistRow, val: 'PASS' | 'FAIL') => {
    if (!row?.resultId) return
    
    // Nếu là PASS, gửi lên BE ngay
    if (val === 'PASS') {
      try {
        setUpdatingId(row.resultId)
        await onSetItemResult(row.resultId, row.partId, val, undefined)
      } finally {
        setUpdatingId(null)
      }
      return
    }

    // Nếu là FAIL, chỉ mở modal (không gửi BE ngay)
    if (val === 'FAIL' && row.categoryId) {
      setModalCategoryId(row.categoryId)
      setModalResultId(row.resultId)
      setShowCategoryModal(true)
    } else if (val === 'FAIL') {
      // Nếu không có categoryId, vẫn cho phép ghi mô tả và gửi lên BE
      setModalCategoryId(null)
      setModalResultId(row.resultId)
      setShowCategoryModal(true)
    }
  }

  const checklistOk = useMemo(() => {
    return (items || []).every((r) => !!(r.result && r.result !== null))
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
                  const check = await PartService.checkPartAvailability(part.partId, quantity, centerId)
                  if (!check.success || !check.available) return
                  const created = await WorkOrderPartService.add(bookingId, { partId: part.partId, quantity })
                  setParts(prev => prev.concat(created))
                } catch {}
              }}
            >
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
                  const isFail = (row.result === 'FAIL' || row.result === 'fail')
                  const isPass = (row.result === 'PASS' || row.result === 'pass')
                  const statusColor = isPass ? '#10B981' : isFail ? '#EF4444' : '#6B7280'
                  const statusText = isPass ? 'Đạt' : isFail ? 'Không đạt' : 'Chưa đánh giá'
                  
                  return (
                    <tr key={`${workId}-${row.resultId || idx}`}>
                      <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13 }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13, color: '#111827' }}>{row.partName || row.categoryName || '-'}</td>
                      <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>{row.description || '-'}</td>
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
                              border: `1px solid ${(row.result === 'PASS' || row.result === 'pass') ? '#FFD875' : '#D1D5DB'}`,
                              background: (row.result === 'PASS' || row.result === 'pass') ? '#FFF6D1' : (isChecklistEditable ? '#FFFFFF' : '#F9FAFB'),
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
                              border: `1px solid ${(row.result === 'FAIL' || row.result === 'fail') ? '#FFD875' : '#D1D5DB'}`,
                              background: (row.result === 'FAIL' || row.result === 'fail') ? '#FFF6D1' : (isChecklistEditable ? '#FFFFFF' : '#F9FAFB'),
                              color: '#374151',
                              fontSize: 13,
                              fontWeight: 400,
                              cursor: (!isChecklistEditable || updatingId === row.resultId) ? 'not-allowed' : 'pointer'
                            }}
                          >Không đạt</button>
                          {/* Bỏ input ghi chú và gợi ý inline theo yêu cầu */}
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
        </div>

        {/* Work order parts (phụ tùng phát sinh) - hiển thị khi đang làm việc hoặc xem lại sau khi hoàn tất (read-only) */}
        {(isInProgress || isReadOnly) && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: '#374151', fontWeight: 400 }}>Phụ tùng phát sinh</h4>
          </div>
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
                  // Phân biệt replacement parts (từ checklist) và parts thông thường
                  const isReplacementPart = p.id < 0 // Replacement parts có id âm
                  const approvalStatus = (p.status || '').toUpperCase()
                  const isApproved = approvalStatus === 'CONSUMED'
                  const isDraft = approvalStatus === 'DRAFT'
                  const isRejected = approvalStatus === 'REJECTED'
                  
                  // Replacement parts chỉ đọc (read-only), không cho chỉnh sửa
                  const canEdit = isInProgress && !isApproved && !isReplacementPart
                  
                  // Trạng thái duyệt - chỉ hiển thị DRAFT, CONSUMED, hoặc REJECTED
                  let statusText = ''
                  let statusColor = '#6B7280'
                  if (isApproved) {
                    statusText = 'CONSUMED'
                    statusColor = '#10B981'
                  } else if (isDraft) {
                    statusText = 'DRAFT'
                    statusColor = '#F59E0B'
                  } else if (isRejected) {
                    statusText = 'REJECTED'
                    statusColor = '#EF4444'
                  } else {
                    statusText = 'DRAFT'
                    statusColor = '#F59E0B'
                  }
                  
                  return (
                    <tr key={p.id}>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>{p.partNumber || p.partId}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13, color: '#111827' }}>{p.partName || '-'}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>{p.brand || '-'}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13 }}>{(p.unitPrice || 0).toLocaleString('vi-VN')}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13 }}>{p.quantity}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          border: `1px solid ${statusColor}`,
                          color: statusColor,
                          borderRadius: 6,
                          background: `${statusColor}15`,
                          fontSize: 12,
                          fontWeight: 500
                        }}>{statusText}</span>
                      </td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'center' }}>
                        {canEdit && isDraft && (
                          <button
                            onClick={() => setEditingPartId(p.id)}
                            style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#FFFFFF', cursor: 'pointer', fontSize: 13 }}
                          >Đổi phụ tùng</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {parts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ border: '1px solid #FFD875', padding: '16px', textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
                      Chưa có phụ tùng phát sinh
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: 8, gap: 12 }}>
            <div style={{ fontSize: 13, color: '#111827', fontWeight: 400 }}>
              Tổng tạm tính: {totalCost.toLocaleString('vi-VN')} VNĐ
            </div>
            {/* Nút xác nhận checklist - chỉ hiển thị khi đang IN_PROGRESS */}
            {isInProgress && (
              <button
                onClick={handleConfirmChecklist}
                disabled={checklistConfirmed || confirmingChecklist}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: checklistConfirmed ? '1px solid #10B981' : '1px solid #3B82F6',
                  background: checklistConfirmed ? '#D1FAE5' : '#3B82F6',
                  color: checklistConfirmed ? '#065F46' : '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: checklistConfirmed || confirmingChecklist ? 'not-allowed' : 'pointer',
                  opacity: checklistConfirmed || confirmingChecklist ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {confirmingChecklist ? 'Đang xác nhận...' : checklistConfirmed ? '✓ Đã xác nhận checklist' : 'Xác nhận checklist'}
              </button>
            )}
          </div>
        </div>
        )}

        {showSelectPart && isInProgress && (
          <SelectPartModal
            onClose={() => setShowSelectPart(false)}
            centerId={centerId}
            onSelect={async (part, quantity) => {
              try {
                const check = await PartService.checkPartAvailability(part.partId, quantity, centerId)
                if (!check.success || !check.available) return
                const created = await WorkOrderPartService.add(bookingId, { partId: part.partId, quantity })
                setParts(prev => prev.concat(created))
                setShowSelectPart(false)
              } catch {}
            }}
          />
        )}

        {editingPartId && isInProgress && (
          <SelectPartModal
            onClose={() => setEditingPartId(null)}
            centerId={centerId}
            initialQuantity={parts.find(x => x.id === editingPartId)?.quantity}
            onSelect={async (part, quantity) => {
              const target = parts.find(x => x.id === editingPartId)
              if (!target) { setEditingPartId(null); return }
              try {
                // update partId và quantity do người dùng chọn
                const newQty = Math.max(1, Number(quantity || target.quantity))
                await WorkOrderPartService.update(bookingId, editingPartId, { partId: part.partId, quantity: newQty })
                // lấy chi tiết phụ tùng mới để cập nhật hiển thị
                const detail = await PartService.getPartById(part.partId)
                const raw = (detail?.data || {}) as any
                const unitPrice = raw.unitPrice ?? raw.UnitPrice ?? raw.price ?? raw.Price ?? target.unitPrice ?? 0
                setParts(prev => prev.map(x => x.id === editingPartId ? {
                  ...x,
                  partId: part.partId,
                  partNumber: (detail?.data?.partNumber ?? x.partNumber) as any,
                  partName: (detail?.data?.partName ?? x.partName) as any,
                  brand: (detail?.data?.brand ?? x.brand) as any,
                  unitPrice,
                  quantity: newQty
                } : x))
                setEditingPartId(null)
                toast.success('Đã đổi phụ tùng')
              } catch (e: any) {
                toast.error(e?.message || 'Không thể đổi phụ tùng')
              }
            }}
          />
        )}

        {showCategoryModal && isInProgress && modalResultId && (
          <CategoryPartsModal
            categoryId={modalCategoryId}
            resultId={modalResultId}
            centerId={centerId}
            onClose={() => { setShowCategoryModal(false); setModalCategoryId(null); setModalResultId(null) }}
            onConfirm={async (notes, selectedParts) => {
              try {
                setUpdatingId(modalResultId)
                // Gửi result FAIL + description + thông tin phụ tùng thay thế lên BE trong một request
                // API: PUT /api/maintenance-checklist/{bookingId}/results/{resultId}
                // Request body: { description, result, requireReplacement, replacementPartId, replacementQuantity }
                
                // Lấy phụ tùng đầu tiên từ danh sách đã chọn (lấy từ API GET /api/parts/by-category/{categoryId})
                const firstPart = selectedParts.length > 0 ? selectedParts[0] : null
                const replacementInfo = firstPart ? {
                  requireReplacement: true,
                  replacementPartId: firstPart.part.partId, // partId từ API GET /api/parts/by-category/{categoryId}
                  replacementQuantity: firstPart.quantity    // số lượng user nhập vào
                } : undefined // Không gửi replacementInfo nếu không có phụ tùng
                
                const resultResponse = await onSetItemResult(
                  modalResultId, 
                  undefined, 
                  'FAIL', 
                  notes,
                  replacementInfo
                )
                
                // Kiểm tra nếu API update tình trạng thành công
                if (resultResponse === undefined || (resultResponse as any)?.success !== false) {
                  // Nếu có nhiều phụ tùng, thêm các phụ tùng còn lại (bỏ qua phụ tùng đầu tiên đã gửi trong request body)
                  for (let i = 1; i < selectedParts.length; i++) {
                    const { part, quantity } = selectedParts[i]
                    try {
                      const created = await WorkOrderPartService.add(bookingId, { partId: part.partId, quantity })
                      setParts(prev => prev.concat(created))
                    } catch (err) {
                      console.error('Lỗi khi thêm phụ tùng:', err)
                    }
                  }
                  // Đóng modal sau khi thành công
                  setShowCategoryModal(false)
                  setModalCategoryId(null)
                  setModalResultId(null)
                } else {
                  // Nếu API update tình trạng thất bại, không đóng modal và giữ nguyên form
                  throw new Error((resultResponse as any)?.message || 'Cập nhật tình trạng thất bại')
                }
              } catch (error: any) {
                // Hiển thị lỗi và giữ modal mở để người dùng có thể thử lại
                console.error('Lỗi khi xác nhận:', error)
                throw error // Re-throw để modal có thể xử lý lỗi
              } finally {
                setUpdatingId(null)
              }
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
  initialQuantity?: number
}

function SelectPartModal({ onClose, onSelect, centerId, initialQuantity }: SelectPartModalProps & { centerId?: number }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Part[]>([])
  const [rowQtyByPartId, setRowQtyByPartId] = useState<Record<number, number>>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await PartService.getPartAvailability({ centerId, searchTerm: search, category: category || undefined, inStock: true, pageSize: 10, pageNumber: 1 })
      const parts = res?.data || []
      // Map đúng từ database: Price -> unitPrice, ImageUrl -> imageUrl, tồn kho -> totalStock
      setData(parts.map(p => {
        const raw = p as any
        return {
          ...p,
          unitPrice: p.unitPrice ?? raw.Price ?? raw.price ?? 0,
          imageUrl: p.imageUrl ?? raw.ImageUrl ?? raw.imageUrl,
          totalStock: p.totalStock ?? raw.totalStock ?? raw.stock ?? raw.availableQuantity ?? raw.inventoryQuantity ?? 0
        }
      }))
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px auto', gap: 8, marginBottom: 12 }}>
            <input
              placeholder="Tìm kiếm phụ tùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }}
            />
            <input
              placeholder="Category (ví dụ: oil, brake, tire...)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8 }}
            />
            <button onClick={load} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer' }}>Lọc</button>
          </div>

          <div style={{ overflow: 'auto', maxHeight: '50vh', border: '1px solid #E5E7EB', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '8%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Ảnh</th>
                  <th style={{ width: '12%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Mã</th>
                  <th style={{ width: '28%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Tên</th>
                  <th style={{ width: '12%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Thương hiệu</th>
                  <th style={{ width: '12%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Giá</th>
                  <th style={{ width: '10%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Tồn kho</th>
                  <th style={{ width: '10%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Số lượng</th>
                  <th style={{ width: '8%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Thêm</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>Đang tải...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>Không có phụ tùng phù hợp</td></tr>
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
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {p.imageUrl && p.imageUrl !== 'NULL' ? (
                          <img 
                            src={p.imageUrl} 
                            alt={p.partName}
                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #E5E7EB' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div style={{ width: 50, height: 50, background: '#F3F4F6', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9CA3AF' }}>N/A</div>
                        )}
                      </td>
                      <td style={{ padding: '10px', fontSize: 13 }}>{p.partNumber}</td>
                      <td style={{ padding: '10px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.partName}</td>
                      <td style={{ padding: '10px', fontSize: 13 }}>{p.brand}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>{(p.unitPrice || 0).toLocaleString('vi-VN')} VNĐ</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>{p.totalStock}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min={1}
                          value={rowQtyByPartId[p.partId] ?? (initialQuantity ?? 1)}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 1 : Math.max(1, Number(e.target.value || 1))
                            setRowQtyByPartId(prev => ({ ...prev, [p.partId]: val }))
                          }}
                          onBlur={(e) => {
                            if (!e.target.value || Number(e.target.value) < 1) {
                              setRowQtyByPartId(prev => ({ ...prev, [p.partId]: 1 }))
                            }
                          }}
                          style={{ width: 80, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, textAlign: 'right', fontSize: 13 }}
                        />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => onSelect(p, rowQtyByPartId[p.partId] ?? (initialQuantity ?? 1))}
                          style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#111827', color: '#FFFFFF', cursor: 'pointer', fontSize: 13 }}
                        >Thêm</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


interface CategoryPartsModalProps {
  categoryId: number | null
  resultId: number
  centerId?: number
  onClose: () => void
  onConfirm: (notes: string, selectedParts: Array<{ part: Part; quantity: number }>) => void | Promise<void>
}

function CategoryPartsModal({ categoryId, resultId, centerId, onClose, onConfirm }: CategoryPartsModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Part[]>([])
  const [rowQtyByPartId, setRowQtyByPartId] = useState<Record<number, number>>({})
  const [notes, setNotes] = useState('')
  const [selectedParts, setSelectedParts] = useState<Array<{ part: Part; quantity: number }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      if (categoryId) {
        const res = await PartService.getPartsByCategory(categoryId)
        const parts = res?.data || []
        // Map đúng từ database: Price -> unitPrice, ImageUrl -> imageUrl, tồn kho -> totalStock
        setData(parts.map(p => {
          const raw = p as any
          return {
            ...p,
            unitPrice: p.unitPrice ?? raw.Price ?? raw.price ?? 0,
            imageUrl: p.imageUrl ?? raw.ImageUrl ?? raw.imageUrl,
            totalStock: p.totalStock ?? raw.totalStock ?? raw.stock ?? raw.availableQuantity ?? raw.inventoryQuantity ?? 0
          }
        }))
      } else {
        // Nếu không có categoryId, lấy tất cả phụ tùng có sẵn
        const res = await PartService.getPartAvailability({ centerId, inStock: true, pageSize: 100, pageNumber: 1 })
        const parts = res?.data || []
        // Map đúng từ database: Price -> unitPrice, ImageUrl -> imageUrl, tồn kho -> totalStock
        setData(parts.map(p => {
          const raw = p as any
          return {
            ...p,
            unitPrice: p.unitPrice ?? raw.Price ?? raw.price ?? 0,
            imageUrl: p.imageUrl ?? raw.ImageUrl ?? raw.imageUrl,
            totalStock: p.totalStock ?? raw.totalStock ?? raw.stock ?? raw.availableQuantity ?? raw.inventoryQuantity ?? 0
          }
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [categoryId, centerId])

  const handleRemovePart = (index: number) => {
    setSelectedParts(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    setSelectedParts(prev => prev.map((sp, i) => 
      i === index ? { ...sp, quantity: newQuantity } : sp
    ))
  }

  const handleConfirm = async () => {
    if (!notes.trim()) {
      setError('Vui lòng nhập mô tả lý do không đạt')
      return
    }
    
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(notes, selectedParts)
      // Nếu thành công, onConfirm sẽ đóng modal
    } catch (error: any) {
      // Hiển thị lỗi và giữ modal mở
      setError(error?.message || 'Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, paddingTop: '60px', paddingLeft: '250px' }}>
      <div style={{ width: '1200px', maxWidth: '95vw', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 400, color: '#111827' }}>Đánh giá không đạt</h3>
          <button onClick={onClose} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#FFFFFF', cursor: 'pointer' }}>Đóng</button>
        </div>
        <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
          {/* Hiển thị lỗi nếu có */}
          {error && (
            <div style={{ marginBottom: 16, padding: '12px', background: '#FEF2F2', border: '1px solid #EF4444', borderRadius: 8, color: '#991B1B', fontSize: 13 }}>
              {error}
            </div>
          )}
          
          {/* Phần mô tả */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#374151', fontWeight: 500 }}>Mô tả *</label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setError(null) // Xóa lỗi khi người dùng nhập lại
              }}
              placeholder="Nhập mô tả về lý do không đạt..."
              rows={4}
              style={{ 
                width: '100%', 
                padding: '8px 10px', 
                border: '1px solid #D1D5DB', 
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Danh sách phụ tùng đã chọn */}
          {selectedParts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#374151', fontWeight: 500 }}>Phụ tùng đã chọn</label>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Tên phụ tùng</th>
                      <th style={{ borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Đơn giá</th>
                      <th style={{ borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Số lượng</th>
                      <th style={{ borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Thành tiền</th>
                      <th style={{ borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParts.map((sp, index) => (
                      <tr key={`${sp.part.partId}-${index}`}>
                        <td style={{ padding: '10px', fontSize: 13 }}>{sp.part.partName}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>{(sp.part.unitPrice || 0).toLocaleString('vi-VN')} VNĐ</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <input
                            type="number"
                            min={1}
                            value={sp.quantity}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 1 : Math.max(1, Number(e.target.value || 1))
                              handleUpdateQuantity(index, val)
                            }}
                            onBlur={(e) => {
                              if (!e.target.value || Number(e.target.value) < 1) {
                                handleUpdateQuantity(index, 1)
                              }
                            }}
                            style={{ width: 80, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, textAlign: 'right', fontSize: 13 }}
                          />
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>{((sp.part.unitPrice || 0) * sp.quantity).toLocaleString('vi-VN')} VNĐ</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemovePart(index)}
                            style={{ padding: '6px 10px', border: '1px solid #EF4444', borderRadius: 6, background: '#FFFFFF', color: '#EF4444', cursor: 'pointer', fontSize: 13 }}
                          >Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chọn phụ tùng */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#374151', fontWeight: 500 }}>Chọn phụ tùng {categoryId ? 'theo danh mục' : ''}</label>
            <div style={{ overflow: 'auto', maxHeight: '300px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: '8%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Ảnh</th>
                    <th style={{ width: '12%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Mã</th>
                    <th style={{ width: '28%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Tên</th>
                    <th style={{ width: '14%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Thương hiệu</th>
                    <th style={{ width: '14%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Giá</th>
                    <th style={{ width: '10%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Tồn kho</th>
                    <th style={{ width: '10%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Số lượng</th>
                    <th style={{ width: '8%', borderBottom: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, background: '#FFF8E6', fontWeight: 400 }}>Thêm</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>Đang tải...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>Không có phụ tùng</td></tr>
                  ) : (
                    data.map((p) => (
                      <tr key={p.partId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {p.imageUrl && p.imageUrl !== 'NULL' ? (
                            <img 
                              src={p.imageUrl} 
                              alt={p.partName}
                              style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #E5E7EB' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <div style={{ width: 50, height: 50, background: '#F3F4F6', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9CA3AF' }}>N/A</div>
                          )}
                        </td>
                        <td style={{ padding: '10px', fontSize: 13 }}>{p.partNumber}</td>
                        <td style={{ padding: '10px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.partName}</td>
                        <td style={{ padding: '10px', fontSize: 13 }}>{p.brand}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>{(p.unitPrice || 0).toLocaleString('vi-VN')} VNĐ</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: 13 }}>{p.totalStock}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <input
                            type="number"
                            min={1}
                            value={rowQtyByPartId[p.partId] ?? 1}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 1 : Math.max(1, Number(e.target.value || 1))
                              setRowQtyByPartId(prev => ({ ...prev, [p.partId]: val }))
                            }}
                            onBlur={(e) => {
                              if (!e.target.value || Number(e.target.value) < 1) {
                                setRowQtyByPartId(prev => ({ ...prev, [p.partId]: 1 }))
                              }
                            }}
                            style={{ width: 80, padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 6, textAlign: 'right', fontSize: 13 }}
                          />
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              const quantity = rowQtyByPartId[p.partId] ?? 1
                              // Nếu đã tồn tại thì cộng dồn
                              setSelectedParts(prev => {
                                const exists = prev.find(sp => sp.part.partId === p.partId)
                                if (exists) {
                                  return prev.map(sp => sp.part.partId === p.partId ? { ...sp, quantity: sp.quantity + quantity } : sp)
                                }
                                return [...prev, { part: p, quantity }]
                              })
                            }}
                            style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#111827', color: '#FFFFFF', cursor: 'pointer', fontSize: 13 }}
                          >Thêm</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Footer với nút xác nhận */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: 8, background: '#FFFFFF', color: '#374151', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13 }}
          >Hủy</button>
          <button
            onClick={handleConfirm}
            disabled={submitting || !notes.trim()}
            style={{ padding: '8px 16px', border: '1px solid #FFD875', borderRadius: 8, background: (!notes.trim() || submitting) ? '#F9FAFB' : '#FFF6D1', color: (!notes.trim() || submitting) ? '#9CA3AF' : '#111827', cursor: (!notes.trim() || submitting) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}
          >{submitting ? 'Đang xử lý...' : 'Xác nhận'}</button>
        </div>
      </div>
    </div>
  )
}


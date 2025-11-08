import { useEffect, useState, useMemo } from 'react'
import { BookingService, type MaintenanceChecklistItem } from '@/services/bookingService'
import { WorkOrderPartService, type WorkOrderPartItem } from '@/services/workOrderPartService'
import { PartService, PartCategoryService, type Part } from '@/services/partService'

interface MaintenanceDetailsTabProps {
  bookingId: number
  serviceName?: string
}

export default function MaintenanceDetailsTab({ bookingId, serviceName }: MaintenanceDetailsTabProps) {
  const [checklist, setChecklist] = useState<MaintenanceChecklistItem[]>([])
  const [parts, setParts] = useState<WorkOrderPartItem[]>([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [loadingParts, setLoadingParts] = useState(false)

  // Load checklist - dùng API giống Technician
  useEffect(() => {
    const loadChecklist = async () => {
      setLoadingChecklist(true)
      try {
        // Dùng API GET /api/maintenance-checklist/{bookingId} giống Technician
        const checklistResponse: any = await BookingService.getMaintenanceChecklist(bookingId)
        
        // API có thể trả về nhiều format khác nhau:
        // - { success: true, items: [...] }
        // - { success: true, data: { items: [...] } }
        // - { success: true, data: { results: [...] } }
        // - { items: [...] } (direct array)
        let rawItems: any[] = []
        
        if (checklistResponse?.items && Array.isArray(checklistResponse.items)) {
          rawItems = checklistResponse.items
        } else if (checklistResponse?.data?.items && Array.isArray(checklistResponse.data.items)) {
          rawItems = checklistResponse.data.items
        } else if (checklistResponse?.data?.results && Array.isArray(checklistResponse.data.results)) {
          rawItems = checklistResponse.data.results
        } else if (Array.isArray(checklistResponse)) {
          rawItems = checklistResponse
        }
        
        // Map items giống Technician để đảm bảo có đầy đủ các field (bao gồm categoryName, description, notes)
        const items: any[] = rawItems.map((r: any) => ({
          resultId: r.resultId,
          partId: r.partId,
          partName: r.partName,
          categoryId: r.categoryId,
          categoryName: r.categoryName, // Map categoryName
          description: r.description, // Map description
          result: r.result,
          notes: r.notes, // Map notes nếu có
          status: r.status
        }))
        
        setChecklist(items)
      } catch (error) {
        console.error(`Error loading checklist for booking ${bookingId}:`, error)
        setChecklist([])
      } finally {
        setLoadingChecklist(false)
      }
    }
    loadChecklist()
  }, [bookingId])

  // Load parts with full details (like technician does)
  useEffect(() => {
    const loadParts = async () => {
      setLoadingParts(true)
      try {
        // 1. Load phụ tùng phát sinh từ API /Booking/{bookingId}/parts
        let partsList = await WorkOrderPartService.list(bookingId)
        
        // 2. Load chi tiết từ API /api/Part/{id} để lấy đơn giá và thông tin đầy đủ
        partsList = await Promise.all(partsList.map(async (p) => {
          try {
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
            return p
          } catch (error) {
            console.error(`Error loading part detail ${p.partId}:`, error)
            return p
          }
        }))
        
        setParts(partsList)
      } catch (error) {
        console.error(`Error loading parts for booking ${bookingId}:`, error)
        setParts([])
      } finally {
        setLoadingParts(false)
      }
    }
    loadParts()
  }, [bookingId])

  // Calculate checklist summary - giống Technician (tính từ items local)
  const summary = useMemo(() => {
    if (!checklist || checklist.length === 0) return null
    
    const total = checklist.length
    const pass = checklist.filter(item => {
      const result = (item.result || '').toUpperCase()
      return result === 'PASS' || result === 'pass'
    }).length
    const fail = checklist.filter(item => {
      const result = (item.result || '').toUpperCase()
      return result === 'FAIL' || result === 'fail'
    }).length
    const na = total - pass - fail // N/A = tổng - pass - fail (giống Technician)
    
    return { total, pass, fail, na }
  }, [checklist])

  // Calculate total cost - chỉ tính những phụ tùng đã được approve (status = CONSUMED)
  const totalCost = useMemo(() => {
    return parts
      .filter(p => p.status === 'CONSUMED') // Chỉ tính những phụ tùng đã được approve
      .reduce((sum, p) => sum + (p.unitPrice || 0) * (p.quantity || 0), 0)
  }, [parts])

  return (
    <div>
      {/* Danh sách kiểm tra - giống technician */}
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
        {loadingChecklist ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            Đang tải...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}
            >
              <thead>
                <tr>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>#</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Phụ tùng</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Lý do thay thế</th>
                  <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {checklist.map((row, idx) => {
                  const isFail = (row.result === 'FAIL' || row.result === 'fail')
                  const isPass = (row.result === 'PASS' || row.result === 'pass')
                  const statusColor = isPass ? '#10B981' : isFail ? '#EF4444' : '#6B7280'
                  const statusText = isPass ? 'Đạt' : isFail ? 'Không đạt' : 'Chưa đánh giá'
                  
                  // Get part name - giống Technician: ưu tiên partName, sau đó categoryName
                  const partName = row.partName || (row as any).categoryName || '-'
                  
                  // Mô tả/Lý do thay thế - giống Technician: hiển thị description trực tiếp
                  const description = row.description || (row as any).notes || '-'
                  
                  return (
                    <tr key={`${bookingId}-${row.resultId || idx}`}>
                      <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13 }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13, color: '#111827' }}>{partName}</td>
                      <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>{description}</td>
                      <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>
                        {statusText}
                      </td>
                    </tr>
                  )
                })}
                {checklist.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ border: '1px solid #E5E7EB', padding: '16px', textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
                      Không có hạng mục kiểm tra
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Phụ tùng phát sinh - giống technician */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ margin: 0, fontSize: 14, color: '#374151', fontWeight: 400 }}>Phụ tùng phát sinh</h4>
        </div>
        {loadingParts ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            Đang tải...
          </div>
        ) : (
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
                  // Trạng thái duyệt - xử lý đầy đủ các status
                  let statusText = 'Nháp'
                  let statusColor = '#6B7280'
                  const statusUpper = (p.status || '').toUpperCase()
                  
                  if (statusUpper === 'CONSUMED') {
                    statusText = 'Đã xác nhận'
                    statusColor = '#10B981'
                  } else if (statusUpper === 'PENDING_CUSTOMER_APPROVAL') {
                    statusText = 'Chờ xác nhận'
                    statusColor = '#F59E0B'
                  } else if (statusUpper === 'REJECTED') {
                    statusText = 'Đã từ chối'
                    statusColor = '#EF4444'
                  } else if (statusUpper === 'DRAFT') {
                    statusText = 'Nháp'
                    statusColor = '#6B7280'
                  } else {
                    // Fallback cho các status khác
                    statusText = statusUpper || 'Nháp'
                    statusColor = '#6B7280'
                  }
                  
                  return (
                    <tr key={p.id}>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>{p.partNumber || p.partId}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13, color: '#111827' }}>{p.partName || '-'}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', fontSize: 13 }}>{p.brand || '-'}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13 }}>{(p.unitPrice || 0).toLocaleString('vi-VN')}</td>
                      <td style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13 }}>{p.quantity || 0}</td>
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
                        {/* Read-only - không có hành động */}
                      </td>
                    </tr>
                  )
                })}
                {parts.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ border: '1px solid #FFD875', padding: '16px', textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
                      Chưa có phụ tùng phát sinh
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {parts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: 8, gap: 12 }}>
            <div style={{ fontSize: 13, color: '#111827', fontWeight: 400 }}>
              Tổng tạm tính: {totalCost.toLocaleString('vi-VN')} VNĐ
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

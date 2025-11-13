import React, { useState, useEffect, useCallback } from 'react'
import {
  Play,
  RefreshCw,
  Flag,
  Loader2,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  Wrench,
  CheckCircle,
  Package,
  XCircle,
  CreditCard
} from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { TechnicianService } from '@/services/technicianService'
import toast from 'react-hot-toast'
import WorkQueueRowExpansion from './WorkQueueRowExpansion'
import './WorkQueue.scss'
import './DatePicker.scss'
import WorkQueueSlotHeader from './WorkQueueSlotHeader'
import WorkQueueStats from '@/components/technician/WorkQueueStats'
import WorkQueueToolbar from '@/components/technician/WorkQueueToolbar'
import WorkQueuePagination from '@/components/technician/WorkQueuePagination'
import WorkQueueHeader from '@/components/technician/WorkQueueHeader'
import type { ChecklistRow as ChecklistRowType } from '@/components/technician/WorkQueueChecklist'
import type { WorkQueueProps } from './workQueueTypes'
import { useWorkQueueData } from './useWorkQueueData'
import {
  getCurrentDateString,
  getStatusText,
  getStatusColor
} from './workQueueHelpers'
import { useWorkQueueIds } from './useWorkQueueIds'
import { useWorkQueueActions } from './useWorkQueueActions'
import { useWorkQueueFilters } from './useWorkQueueFilters'
import { useWorkQueueDataFetch } from './useWorkQueueDataFetch'
import { useWorkQueueStats } from './useWorkQueueStats'
import { useWorkQueueRealtime } from './useWorkQueueRealtime'
import { useWorkQueuePagination } from './useWorkQueuePagination'
import PaymentModal from '@/components/payment/PaymentModal'
import { BookingService } from '@/services/bookingService'

export default function WorkQueue({ mode = 'technician' }: WorkQueueProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString())
  const [dateFilterType, setDateFilterType] = useState<'custom' | 'today' | 'thisWeek' | 'all'>('today')

  // Search state
  const [searchTerm, setSearchTerm] = useState('')

  // Additional filters
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all')
  const [timeSlotFilter, setTimeSlotFilter] = useState('all')
  const { selectedIds, sortBy, setSortBy, sortOrder, setSortOrder, toggleRowSelected, toggleAllSelected } = useWorkQueueData()

  // Show only key statuses by default
  const [showAllStatusesToggle, setShowAllStatusesToggle] = useState(false)

  // Lấy thông tin user từ store và resolve đúng technicianId
  const user = useAppSelector((state) => state.auth.user)
  const { technicianId, centerId, idsResolved } = useWorkQueueIds(user, mode)

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null)
  const [workIdToChecklist, setWorkIdToChecklist] = useState<Record<number, ChecklistRowType[]>>({})

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentBookingId, setPaymentBookingId] = useState<number | null>(null)
  const [paymentTotalAmount, setPaymentTotalAmount] = useState<number>(0)
  const [loadingPayment, setLoadingPayment] = useState(false)

  const itemsPerPage = 10

  // Use data fetch hook
  const {
    loading,
    workQueue,
    apiPagination,
    fetchTechnicianBookings
  } = useWorkQueueDataFetch({
    mode,
    technicianId,
              centerId,
    itemsPerPage,
    dateFilterType,
    statusFilter,
    sortBy,
    sortOrder
  })


  // Use filter hook
  const filteredWork = useWorkQueueFilters(
    workQueue,
    searchTerm,
    statusFilter,
    serviceTypeFilter,
    timeSlotFilter,
    dateFilterType,
    selectedDate,
    showAllStatusesToggle,
    sortBy,
    sortOrder
  )

  // Use pagination hook
  const paginationResult = useWorkQueuePagination({
    mode,
    filteredWork,
    itemsPerPage,
    apiPagination,
    dateFilterType,
    selectedDate,
    statusFilter,
    serviceTypeFilter,
    fetchTechnicianBookings
  })

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedWork,
    groupedSlots,
    totalRows,
    displayRows,
    useGrouping,
    useVirtualization,
    virtStart,
    virtEnd,
    virtContainerRef,
    handleVirtScroll,
    handlePageChange,
    ROW_HEIGHT
  } = paginationResult

  // Load data khi component mount và khi date filter thay đổi
  useEffect(() => {
    // Reset về trang 1 khi filter thay đổi
    setCurrentPage(1)
    // Khi dateFilterType là 'today', 'custom' thì fetch data theo ngày cụ thể
    // Còn 'thisWeek', 'all' thì chỉ filter ở client-side (data đã có)
    if (dateFilterType === 'today') {
      const today = getCurrentDateString()
      fetchTechnicianBookings(today, 1)
    } else if (dateFilterType === 'custom') {
      fetchTechnicianBookings(selectedDate, 1)
    } else if (dateFilterType === 'all') {
      // Với 'all', vẫn fetch với page 1
      fetchTechnicianBookings(undefined, 1)
    }
    // 'thisWeek' không fetch, chỉ filter client-side với data đã có
  }, [fetchTechnicianBookings, dateFilterType, selectedDate, statusFilter, sortBy, sortOrder, setCurrentPage])

  // Initial load: when technicianId/centerId is resolved, fetch today's data
  useEffect(() => {
    if (!idsResolved) return // Wait for IDs to be resolved

    // Always fetch today's data on initial load
    const today = getCurrentDateString()
    setSelectedDate(today)
    setDateFilterType('today')
    setCurrentPage(1)

    // For technician mode: only fetch when technicianId is available
    if (mode === 'technician') {
      if (technicianId) {
        fetchTechnicianBookings(today, 1)
      }
    } else {
      // For staff mode: only fetch when centerId is available
      if (centerId) {
      fetchTechnicianBookings(today, 1)
      } else {
        // Error is handled by useWorkQueueDataFetch hook
      }
    }
  }, [idsResolved, technicianId, centerId, mode, fetchTechnicianBookings, setCurrentPage])

  // Use realtime hook
  useWorkQueueRealtime({
    mode,
    technicianId,
    centerId,
    workQueue,
    dateFilterType,
    selectedDate,
    currentPage,
    fetchTechnicianBookings
  })

  // Sort handlers
  const handleSort = (field: 'bookingId' | 'customer' | 'serviceName' | 'status' | 'createdAt' | 'scheduledDate') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc') // Default to descending
    }
  }

  const getSortIcon = (field: 'bookingId' | 'customer' | 'serviceName' | 'status' | 'createdAt' | 'scheduledDate') => {
    if (sortBy !== field) {
      return <ChevronUp size={14} style={{ opacity: 0.3 }} />
    }
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  // Làm mới: reset tất cả filter về mặc định và refetch theo hôm nay
  const handleRefreshFilters = useCallback(() => {
    const today = getCurrentDateString()
    setSearchTerm('')
    setStatusFilter('all')
    setServiceTypeFilter('all')
    setTimeSlotFilter('all')
    setDateFilterType('today') // Reset về ngày hiện tại
    setSelectedDate(today)
    setSortBy('bookingId')
    setSortOrder('desc')
    setShowAllStatusesToggle(false) // Reset về hiển thị "Quan trọng"
    setCurrentPage(1)
    // Refetch data cho ngày hiện tại
    fetchTechnicianBookings(today, 1)
  }, [fetchTechnicianBookings])

  // Ensure selectedDate is always current date on mount
  useEffect(() => {
    const currentDateString = getCurrentDateString()
    if (selectedDate !== currentDateString) {
      setSelectedDate(currentDateString)
    }
  }, [])


  // Use stats hook
  const stats = useWorkQueueStats(workQueue)

  // Use actions hook
  const actionsResult = useWorkQueueActions(
    workQueue,
    dateFilterType,
    selectedDate,
    currentPage,
    fetchTechnicianBookings
  )
  const { updatingStatus, handleStatusUpdate, handleCancelBooking, canTransitionTo } = actionsResult

  // Handler để mở payment modal
  const handleOpenPayment = async (bookingId: number) => {
    setLoadingPayment(true)
    try {
      const detail = await BookingService.getBookingDetail(bookingId)
      if (detail?.success && detail?.data) {
        setPaymentTotalAmount(detail.data.totalAmount || 0)
        setPaymentBookingId(bookingId)
        setShowPaymentModal(true)
        } else {
        toast.error('Không thể lấy thông tin booking')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải thông tin thanh toán'
      toast.error(message)
    } finally {
      setLoadingPayment(false)
    }
  }


  return (
    <div className="work-queue" style={{
      padding: '0px 16px 16px 16px',
      background: '#fff',
      minHeight: '100vh',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <WorkQueueHeader />

      {/* Stats Cards */}
      <WorkQueueStats stats={stats as any} />

      {/* Toolbar giống Admin Users */}
      <WorkQueueToolbar
        searchTerm={searchTerm}
        onSearchChange={(v) => setSearchTerm(v)}
        serviceTypeFilter={serviceTypeFilter}
        onServiceTypeChange={(v) => setServiceTypeFilter(v)}
        statusFilter={statusFilter}
        onStatusChange={(v) => setStatusFilter(v)}
        timeSlotFilter={timeSlotFilter}
        onTimeSlotChange={(v) => setTimeSlotFilter(v)}
        availableTimeSlots={Array.from(new Set(workQueue.map(w => w.slotLabel || w.scheduledTime || '').filter(Boolean))).sort()}
        showAllStatusesToggle={showAllStatusesToggle}
        onToggleShowAll={() => setShowAllStatusesToggle(v => !v)}
        onResetFilters={handleRefreshFilters}
      />

      {/* Work Table */}
      <div style={{
        background: 'var(--bg-card)',
        padding: 0,
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none'
      }}>
              {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: 'var(--text-secondary)'
          }}>
            <RefreshCw size={48} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Đang tải dữ liệu...</p>
                    </div>
        ) : paginatedWork.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: 'var(--text-secondary)'
          }}>
            <Clock size={64} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
              {searchTerm || statusFilter !== 'all' ? 'Không tìm thấy công việc nào' : 'Chưa có công việc nào'}
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {searchTerm || statusFilter !== 'all' ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Hiện tại chưa có công việc nào trong hàng đợi'}
            </p>
                            </div>
                          ) : (
          <>
             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin: '8px 0 6px', color:'var(--text-secondary)', fontSize: 13 }}>
               <div>
                 Tổng số công việc: <strong style={{ marginLeft: 6, color:'var(--text-primary)' }}>
                   {apiPagination ? apiPagination.totalItems : filteredWork.length}
                 </strong>
                 {totalPages > 1 && (
                   <span style={{ marginLeft: 12 }}>
                     (Trang {currentPage}/{totalPages})
                   </span>
                 )}
                 {apiPagination && (
                   <span style={{ marginLeft: 12, color: 'var(--text-tertiary)' }}>
                     Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, apiPagination.totalItems)} / {apiPagination.totalItems}
                   </span>
                 )}
               </div>
             </div>
      <div
        ref={virtContainerRef}
        onScroll={useVirtualization ? handleVirtScroll : undefined}
        style={{ overflow: 'auto', maxHeight: useVirtualization ? `520px` : undefined }}
      >
              <table className="work-queue-table" style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                background: 'var(--bg-card)',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                border: 'none'
              }}>
                <thead>
                  <tr className="table-header-yellow" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                    <th className="tq-id-col"
                                  style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'default',
                        userSelect: 'none',
                        transition: 'all 0.2s ease',
                        width: '165px',
                        minWidth: '165px',
                        maxWidth: '165px',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <div className="tq-id-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(() => {
                          const allSel = paginatedWork.length > 0 && selectedIds.size === paginatedWork.length
                          return (
                            <span className="tq-id-checkbox" style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <input
                                type="checkbox"
                                className="tq-id-checkbox-input"
                                checked={allSel}
                                onChange={(e) => toggleAllSelected(paginatedWork.map(w => w.id), e.target.checked)}
                                style={{ width: 16, height: 16, appearance: 'auto', accentColor: '#9CA3AF', margin: 0 }}
                              />
                            </span>
                          )
                        })()}
                        <span>ID</span>
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('customer')}
                      style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span className="th-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Khách hàng
                        <div style={{ display: 'flex', alignItems: 'center', opacity: sortBy === 'customer' ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
                          {getSortIcon('customer')}
                        </div>
                                  </span>
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>
                      <span className="th-inner">Xe</span>
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>
                      <span className="th-inner">Dịch vụ</span>
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>
                      <span className="th-inner">Trạng thái</span>
                    </th>
                    <th
                                  style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'default',
                        userSelect: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span className="th-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Thời gian tạo
                        {/* sort removed */}
                      </span>
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>
                      <span className="th-inner" style={{ justifyContent:'flex-start' }}>Hành động</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {useVirtualization && (
                    <tr>
                      <td colSpan={7} style={{ height: Math.max(virtStart * ROW_HEIGHT, 0), padding: 0, border: 'none' }} />
                    </tr>
                  )}
                  {/* Group by scheduled time (slot) */}
                  {useGrouping && (
                    <>
                      {groupedSlots.map(({ slotKey, items }) => (
                        <React.Fragment key={`slot-${slotKey}`}>
                          <WorkQueueSlotHeader slotKey={slotKey} count={items.length} />
                          {items.map((work, i) => (
                            <React.Fragment key={work.id}>
                              <tr
                                onClick={() => {
                                  setExpandedRowId(prev => (prev === work.id ? null : work.id))
                                  ;(async () => {
                                    if (expandedRowId === work.id) return
                                    if (!work.bookingId) return
                                    try {
                                      // Gọi đúng API theo spec: GET /api/maintenance-checklist/{bookingId}
                                      const checklistRes = await TechnicianService.getMaintenanceChecklist(work.bookingId)
                                      // API có thể trả về: { success, checklistId, status, items: [...] } hoặc { success, data: { items: [...] } }
                                      const items = checklistRes?.items || checklistRes?.data?.items || checklistRes?.data?.results || []
                                      if (items.length > 0 || checklistRes?.success) {
                                        const mapped = items.map((r: any) => ({
                                          resultId: r.resultId,
                                          partId: r.partId, // optional
                                          partName: r.partName, // optional
                                          categoryId: r.categoryId,
                                          categoryName: r.categoryName,
                                          description: r.description,
                                          result: r.result,
                                          notes: r.notes,
                                          status: r.status
                                        }))
                                        setWorkIdToChecklist(prev => ({ ...prev, [work.id]: mapped }))
                                      } else {
                                        setWorkIdToChecklist(prev => ({ ...prev, [work.id]: [] }))
                                      }
                                    } catch (e) {
                                      setWorkIdToChecklist(prev => ({ ...prev, [work.id]: [] }))
                                    }
                                  })()
                                }}
                                style={{
                                  borderBottom: '1px solid var(--border-primary)',
                                  transition: 'background-color 0.2s ease',
                                  background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 216, 117, 0.12)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                                }}
                              >
                                <td className="tq-id-col" style={{ padding: '8px 12px', fontSize: '14px', color: '#FFD875', fontWeight: '600', width: '165px', minWidth: '165px', maxWidth: '165px', boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
                                  <div className="tq-id-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="tq-id-checkbox" style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <input
                                        type="checkbox"
                                        className="tq-id-checkbox-input"
                                        checked={selectedIds.has(work.id)}
                                        onChange={(e) => toggleRowSelected(work.id, e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: 16, height: 16, appearance: 'auto', accentColor: '#9CA3AF', margin: 0 }}
                                      />
                                    </span>
                                    <span>#{work.bookingId}</span>
                                  </div>
                                </td>
                                <td onClick={(e) => e.stopPropagation()} style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                  <div style={{ fontWeight: '500' }}>{work.customer}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{work.customerPhone}</div>
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                  <div style={{ fontWeight: '500' }}>{work.licensePlate}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{work.bikeBrand} {work.bikeModel}</div>
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                  <div style={{ fontWeight: '500' }}>{work.title}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  {work.serviceType === 'repair' ? 'Sửa chữa' :
                                   work.serviceType === 'maintenance' ? 'Bảo dưỡng' : 'Kiểm tra'}
                                    </div>
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <span className="status-badge" style={{
                                    backgroundColor: getStatusColor(work.status) + '15',
                                    color: getStatusColor(work.status),
                                    borderColor: getStatusColor(work.status),
                                    padding: '4px 8px',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    width: 'fit-content'
                                  }}>
                                    {work.status === 'pending' && <Clock size={12} />}
                                    {work.status === 'confirmed' && <CheckCircle2 size={12} />}
                                    {work.status === 'in_progress' && <Wrench size={12} />}
                                    {work.status === 'completed' && <CheckCircle size={12} />}
                                    {work.status === 'paid' && <Package size={12} />}
                                    {work.status === 'cancelled' && <XCircle size={12} />}
                                    {getStatusText(work.status)}
                                  </span>
                                </div>
                                </td>
                                <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                  {work.createdAt ? (
                                    <>
                                      <div style={{ fontWeight: '500' }}>
                                        {new Date(work.createdAt).toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })}
                                      </div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {new Date(work.createdAt).toLocaleDateString('vi-VN', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>N/A</div>
                                  )}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                                  <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center'
                                  }}>
                                    {/* Xác nhận (chỉ dành cho staff, từ pending -> confirmed) */}
                                    {mode === 'staff' && (() => {
                                      const isDisabled = updatingStatus.has(work.id) || !canTransitionTo(work.status, 'confirmed');
                                      console.log('Duyệt button render:', {
                                        workId: work.id,
                                        status: work.status,
                                        canTransition: canTransitionTo(work.status, 'confirmed'),
                                        isUpdating: updatingStatus.has(work.id),
                                        isDisabled,
                                        mode
                                      });
                                      return (
                                      <button type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          console.log('Duyệt button clicked:', { workId: work.id, status: work.status, canTransition: canTransitionTo(work.status, 'confirmed') });
                                          if (!isDisabled) {
                                            handleStatusUpdate(e, work.id, 'confirmed');
                                          } else {
                                            console.warn('Duyệt button is disabled, cannot proceed');
                                          }
                                        }}
                                        onMouseDown={() => {
                                          console.log('Duyệt button mouseDown:', { workId: work.id, isDisabled });
                                        }}
                                        disabled={isDisabled}
                                        style={{
                                          padding: '8px',
                                          border: '2px solid var(--border-primary)',
                                          borderRadius: '10px',
                                          background: '#F97316',
                                          color: '#ffffff',
                                          cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'confirmed')) ? 'not-allowed' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'all 0.2s ease',
                                          width: '36px',
                                          height: '36px',
                                          opacity: !canTransitionTo(work.status, 'confirmed') ? 0.5 : 1
                                        }}
                                        title={canTransitionTo(work.status, 'confirmed') ? 'Xác nhận booking' : 'Không khả dụng'}
                                      >
                                        {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                      </button>
                                      );
                                    })()}
                                    {/* Bắt đầu */}
                                  <button type="button"
                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(e, work.id, 'in_progress'); }}
                                    disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'in_progress')}
                                    style={{
                                      padding: '8px',
                                      border: '2px solid var(--border-primary)',
                                      borderRadius: '10px',
                                      background: '#6D28D9',
                                      color: '#ffffff',
                                      cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'in_progress')) ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease',
                                      width: '36px',
                                      height: '36px',
                                      opacity: !canTransitionTo(work.status, 'in_progress') ? 0.5 : 1
                                    }}
                                    title={canTransitionTo(work.status, 'in_progress') ? 'Bắt đầu làm việc' : 'Không khả dụng'}
                                  >
                                    {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                  </button>
                                  {/* Hoàn thành */}
                                  <button type="button"
                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(e, work.id, 'completed'); }}
                                    disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'completed')}
                                    style={{
                                      padding: '8px',
                                      border: '2px solid var(--border-primary)',
                                      borderRadius: '10px',
                                      background: '#059669',
                                      color: '#ffffff',
                                      cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'completed')) ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease',
                                      width: '36px',
                                      height: '36px',
                                      opacity: !canTransitionTo(work.status, 'completed') ? 0.5 : 1
                                    }}
                                    title={canTransitionTo(work.status, 'completed') ? 'Hoàn thành công việc' : 'Không khả dụng'}
                                  >
                                    {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                                  </button>
                                  {/* Thanh toán */}
                                  {mode === 'staff' && work.bookingId && (
                                    <button type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleOpenPayment(work.bookingId || work.id)
                                      }}
                                      disabled={loadingPayment}
                                      style={{
                                        padding: '8px',
                                        border: '2px solid var(--border-primary)',
                                        borderRadius: '10px',
                                        background: '#3B82F6',
                                        color: '#ffffff',
                                        cursor: loadingPayment ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        width: '36px',
                                        height: '36px',
                                        opacity: loadingPayment ? 0.5 : 1
                                      }}
                                      title="Thanh toán"
                                    >
                                      {loadingPayment ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                    </button>
                                  )}
                                  {/* Hủy */}
                                  <button type="button"
                                    onClick={(e) => { e.stopPropagation(); handleCancelBooking(e, work.id); }}
                                    disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'cancelled')}
                                    style={{
                                      padding: '8px',
                                      border: '2px solid var(--border-primary)',
                                      borderRadius: '10px',
                                      background: '#DC2626',
                                      color: '#ffffff',
                                      cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'cancelled')) ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease',
                                      width: '36px',
                                      height: '36px',
                                      opacity: !canTransitionTo(work.status, 'cancelled') ? 0.5 : 1
                                    }}
                                    title={canTransitionTo(work.status, 'cancelled') ? 'Hủy booking' : 'Không khả dụng'}
                                  >
                                    {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                  </button>
                                  </div>
                                </td>
                              </tr>
                              {expandedRowId === work.id && (
                                <WorkQueueRowExpansion
                                  workId={work.id}
                                  bookingId={work.bookingId || work.id}
                                  centerId={work.centerId}
                                  status={work.status}
                                  items={workIdToChecklist[work.id] || []}
                                  technicianName={work.technicianName}
                                  technicianPhone={work.technicianPhone}
                                  slotLabel={work.slotLabel || work.scheduledTime}
                                  workDate={work.workDate || work.scheduledDate}
                                  mode={mode}
                                  onSetItemResult={async (resultId, partId, newResult, notes, replacementInfo) => {
                                    try {
                                      const response = await TechnicianService.updateMaintenanceChecklistItem(
                                        work.bookingId || work.id,
                                        resultId,
                                        newResult,
                                        notes,
                                        replacementInfo
                                      )
                                      if (response?.success) {
                                        setWorkIdToChecklist(prev => {
                                          const arr = (prev[work.id] || []).map((it) => it.resultId === resultId ? { ...it, result: newResult, notes: notes ?? it.notes } : it)
                                          return { ...prev, [work.id]: arr }
                                        })
                                        toast.success('Cập nhật đánh giá thành công')
                                      } else {
                                        toast.error(response?.message || 'Cập nhật đánh giá thất bại')
                                      }
                                    } catch (err: any) {
                                      toast.error('Lỗi khi cập nhật đánh giá')
                                    }
                                  }}
                                  onConfirmChecklist={async () => {
                                    try {
                                      const res = await TechnicianService.confirmMaintenanceChecklist(work.bookingId || work.id)
                                      if (res?.success) toast.success('Đã xác nhận checklist')
                                      else toast.error(res?.message || 'Xác nhận checklist thất bại')
                                    } catch { toast.error('Lỗi khi xác nhận checklist') }
                                  }}
                                  onConfirmParts={async () => {
                                    toast.success('Đã lưu phụ tùng phát sinh')
                                  }}
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                  {!useGrouping && (
                    <>
                      {displayRows.map((work, idx) => (
                        <React.Fragment key={work.id}>
                          <tr
                            onClick={() => {
                              setExpandedRowId(prev => (prev === work.id ? null : work.id))
                              // Load checklist from booking detail API when expanding the row (lazy)
                              ;(async () => {
                                if (expandedRowId === work.id) return
                                if (!work.bookingId) return
                                try {
                                  // Gọi đúng API theo spec: GET /api/maintenance-checklist/{bookingId}
                                  const checklistRes = await TechnicianService.getMaintenanceChecklist(work.bookingId)
                                  // API có thể trả về: { success, checklistId, status, items: [...] } hoặc { success, data: { items: [...] } }
                                  const items = checklistRes?.items || checklistRes?.data?.items || checklistRes?.data?.results || []
                                  if (items.length > 0 || checklistRes?.success) {
                                    const mapped = items.map((r: any) => ({
                                      resultId: r.resultId,
                                      partId: r.partId, // optional
                                      partName: r.partName, // optional
                                      categoryId: r.categoryId,
                                      categoryName: r.categoryName,
                                      description: r.description,
                                      result: r.result,
                                      notes: r.notes,
                                      status: r.status
                                    }))
                                    setWorkIdToChecklist(prev => ({ ...prev, [work.id]: mapped }))
                                  } else {
                                    // No checklist -> empty
                                    setWorkIdToChecklist(prev => ({ ...prev, [work.id]: [] }))
                                  }
                                } catch (e) {
                                  setWorkIdToChecklist(prev => ({ ...prev, [work.id]: [] }))
                                }
                              })()
                            }}
                                    style={{
                              borderBottom: '1px solid var(--border-primary)',
                              transition: 'background-color 0.2s ease',
                              background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 216, 117, 0.12)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                            }}
                          >
                            <td className="tq-id-col" style={{ padding: '8px 12px', fontSize: '14px', color: '#FFD875', fontWeight: '600', width: '165px', minWidth: '165px', maxWidth: '165px', boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
                              <div className="tq-id-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="tq-id-checkbox" style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <input
                                    type="checkbox"
                                    className="tq-id-checkbox-input"
                                    checked={selectedIds.has(work.id)}
                                    onChange={(e) => toggleRowSelected(work.id, e.target.checked)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ width: 16, height: 16, appearance: 'auto', accentColor: '#9CA3AF', margin: 0 }}
                                  />
                                </span>
                                <span>#{work.bookingId}</span>
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()} style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                              <div style={{ fontWeight: '500' }}>{work.customer}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{work.customerPhone}</div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                              <div style={{ fontWeight: '500' }}>{work.licensePlate}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{work.bikeBrand} {work.bikeModel}</div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                              <div style={{ fontWeight: '500' }}>{work.title}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {work.serviceType === 'repair' ? 'Sửa chữa' :
                               work.serviceType === 'maintenance' ? 'Bảo dưỡng' : 'Kiểm tra'}
                                </div>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span className="status-badge" style={{
                                backgroundColor: getStatusColor(work.status) + '15',
                                color: getStatusColor(work.status),
                                borderColor: getStatusColor(work.status),
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: 'fit-content'
                              }}>
                                {work.status === 'pending' && <Clock size={12} />}
                                {work.status === 'confirmed' && <CheckCircle2 size={12} />}
                                {work.status === 'in_progress' && <Wrench size={12} />}
                                {work.status === 'completed' && <CheckCircle size={12} />}
                                {work.status === 'paid' && <Package size={12} />}
                                {work.status === 'cancelled' && <XCircle size={12} />}
                                {getStatusText(work.status)}
                              </span>
                              {/* action buttons removed from status column */}
                            </div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                              {work.createdAt ? (
                                <>
                                  <div style={{ fontWeight: '500' }}>
                                    {new Date(work.createdAt).toLocaleTimeString('vi-VN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {new Date(work.createdAt).toLocaleDateString('vi-VN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>N/A</div>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                justifyContent: 'flex-start',
                                alignItems: 'center'
                              }}>
                                {/* Xác nhận (chỉ dành cho staff, từ pending -> confirmed) */}
                                {mode === 'staff' && (() => {
                                  const isDisabled = updatingStatus.has(work.id) || !canTransitionTo(work.status, 'confirmed');
                                  console.log('Duyệt button render (non-grouping):', {
                                    workId: work.id,
                                    status: work.status,
                                    canTransition: canTransitionTo(work.status, 'confirmed'),
                                    isUpdating: updatingStatus.has(work.id),
                                    isDisabled,
                                    mode
                                  });
                                  return (
                                  <button type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      console.log('Duyệt button clicked (non-grouping):', { workId: work.id, status: work.status, canTransition: canTransitionTo(work.status, 'confirmed') });
                                      if (!isDisabled) {
                                        handleStatusUpdate(e, work.id, 'confirmed');
                                      } else {
                                        console.warn('Duyệt button is disabled (non-grouping), cannot proceed');
                                      }
                                    }}
                                    onMouseDown={() => {
                                      console.log('Duyệt button mouseDown (non-grouping):', { workId: work.id, isDisabled });
                                    }}
                                    disabled={isDisabled}
                                    style={{
                                      padding: '8px',
                                      border: '2px solid var(--border-primary)',
                                      borderRadius: '10px',
                                      background: '#F97316',
                                      color: '#ffffff',
                                      cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'confirmed')) ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease',
                                      width: '36px',
                                      height: '36px',
                                      opacity: !canTransitionTo(work.status, 'confirmed') ? 0.5 : 1
                                    }}
                                    title={canTransitionTo(work.status, 'confirmed') ? 'Xác nhận booking' : 'Không khả dụng'}
                                  >
                                    {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                  </button>
                                  );
                                })()}
                                {/* Bắt đầu */}
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(e, work.id, 'in_progress'); }}
                                  disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'in_progress')}
                                  style={{
                                    padding: '8px',
                                    border: '2px solid var(--border-primary)',
                                    borderRadius: '10px',
                                    background: '#6D28D9',
                                    color: '#ffffff',
                                    cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'in_progress')) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    width: '36px',
                                    height: '36px',
                                    opacity: !canTransitionTo(work.status, 'in_progress') ? 0.5 : 1
                                  }}
                                  title={canTransitionTo(work.status, 'in_progress') ? 'Bắt đầu làm việc' : 'Không khả dụng'}
                                >
                                  {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                </button>
                                {/* Hoàn thành */}
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(e, work.id, 'completed'); }}
                                  disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'completed')}
                                  style={{
                                    padding: '8px',
                                    border: '2px solid var(--border-primary)',
                                    borderRadius: '10px',
                                    background: '#059669',
                                    color: '#ffffff',
                                    cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'completed')) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    width: '36px',
                                    height: '36px',
                                    opacity: !canTransitionTo(work.status, 'completed') ? 0.5 : 1
                                  }}
                                  title={canTransitionTo(work.status, 'completed') ? 'Hoàn thành công việc' : 'Không khả dụng'}
                                >
                                  {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                                </button>
                                {/* Hủy */}
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); handleCancelBooking(e, work.id); }}
                                  disabled={updatingStatus.has(work.id) || !canTransitionTo(work.status, 'cancelled')}
                                  style={{
                                    padding: '8px',
                                    border: '2px solid var(--border-primary)',
                                    borderRadius: '10px',
                                    background: '#DC2626',
                                    color: '#ffffff',
                                    cursor: (updatingStatus.has(work.id) || !canTransitionTo(work.status, 'cancelled')) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    width: '36px',
                                    height: '36px',
                                    opacity: !canTransitionTo(work.status, 'cancelled') ? 0.5 : 1
                                  }}
                                  title={canTransitionTo(work.status, 'cancelled') ? 'Hủy booking' : 'Không khả dụng'}
                                >
                                  {updatingStatus.has(work.id) ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                </button>
                            </div>
                            </td>
                          </tr>
                          {expandedRowId === work.id && (
                            <WorkQueueRowExpansion
                              workId={work.id}
                              bookingId={work.bookingId || work.id}
                              centerId={work.centerId}
                              status={work.status}
                              items={workIdToChecklist[work.id] || []}
                              technicianName={work.technicianName}
                              technicianPhone={work.technicianPhone}
                              slotLabel={work.slotLabel || work.scheduledTime}
                              workDate={work.workDate || work.scheduledDate}
                              mode={mode}
                              onSetItemResult={async (resultId, partId, newResult, notes, replacementInfo) => {
                                try {
                                  const response = await TechnicianService.updateMaintenanceChecklistItem(
                                    work.bookingId || work.id,
                                    resultId,
                                    newResult,
                                    notes,
                                    replacementInfo
                                  )
                                  if (response?.success) {
                                    setWorkIdToChecklist(prev => {
                                      const arr = (prev[work.id] || []).map((it) => it.resultId === resultId ? { ...it, result: newResult, notes: notes ?? it.notes } : it)
                                      return { ...prev, [work.id]: arr }
                                    })
                                    toast.success('Cập nhật đánh giá thành công')
                                  } else {
                                    toast.error(response?.message || 'Cập nhật đánh giá thất bại')
                                  }
                                } catch (err: any) {
                                  toast.error('Lỗi khi cập nhật đánh giá')
                                }
                              }}
                              onConfirmChecklist={async () => {
                                try {
                                  const res = await TechnicianService.confirmMaintenanceChecklist(work.bookingId || work.id)
                                  if (res?.success) toast.success('Đã xác nhận checklist')
                                  else toast.error(res?.message || 'Xác nhận checklist thất bại')
                                } catch { toast.error('Lỗi khi xác nhận checklist') }
                              }}
                              onConfirmParts={async () => { toast.success('Đã lưu phụ tùng phát sinh') }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                  {useVirtualization && (
                    <tr>
                      <td colSpan={7} style={{ height: Math.max((totalRows - (virtEnd)) * ROW_HEIGHT, 0), padding: 0, border: 'none' }} />
                    </tr>
                  )}
                </tbody>
              </table>
            {/* footer removed as requested */}
                    </div>
          </>
        )}
          </div>

      {/* Pagination (ẩn khi dùng virtualization) */}
      {!loading && (filteredWork.length > 0 || (apiPagination && apiPagination.totalItems > 0)) && !useVirtualization && totalPages > 1 && (
        <div style={{ marginTop: '24px', padding: '16px 0' }}>
          <WorkQueuePagination currentPage={currentPage} totalPages={totalPages} onChange={handlePageChange} />
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentBookingId && (
        <PaymentModal
          bookingId={paymentBookingId}
          totalAmount={paymentTotalAmount}
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setPaymentBookingId(null)
          }}
          onPaymentSuccess={() => {
            fetchTechnicianBookings(selectedDate, currentPage)
          }}
        />
      )}
    </div>
  )
}

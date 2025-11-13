import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { getCurrentDateString } from './workQueueHelpers'
import type { WorkOrder } from './workQueueTypes'

interface UseWorkQueuePaginationParams {
  mode: 'technician' | 'staff'
  filteredWork: WorkOrder[]
  itemsPerPage: number
  apiPagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  } | null
  dateFilterType: 'custom' | 'today' | 'thisWeek' | 'all'
  selectedDate: string
  statusFilter: string
  serviceTypeFilter: string
  fetchTechnicianBookings: (date?: string, page: number) => Promise<void>
}

const ROW_HEIGHT = 64
const VIEWPORT_HEIGHT = 520
const BUFFER_ROWS = 6

export const useWorkQueuePagination = (params: UseWorkQueuePaginationParams) => {
  const {
    mode,
    filteredWork,
    itemsPerPage,
    apiPagination,
    dateFilterType,
    selectedDate,
    statusFilter,
    serviceTypeFilter,
    fetchTechnicianBookings
  } = params

  const [currentPage, setCurrentPage] = useState(1)
  const [virtStart, setVirtStart] = useState(0)
  const [virtEnd, setVirtEnd] = useState(20)
  const virtContainerRef = useRef<HTMLDivElement | null>(null)

  const useGrouping = true
  const useVirtualization = !useGrouping && filteredWork.length > 50
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + BUFFER_ROWS

  // Pagination logic - sử dụng từ API nếu có, fallback về client-side
  const totalPages = apiPagination?.totalPages || Math.ceil(filteredWork.length / itemsPerPage)

  // Khi dùng API pagination, không cần slice vì API đã trả về đúng page
  // Khi không dùng API pagination (technician mode), vẫn slice client-side
  const paginatedWork = mode === 'technician'
    ? filteredWork.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredWork

  // Group by slot key for UI grouping - group the paginated items when grouping is enabled
  const groupedSlots = useMemo(() => {
    const sourceData = useGrouping ? paginatedWork : filteredWork
    const groups = new Map<string, WorkOrder[]>()
    sourceData.forEach(w => {
      const key = (w.scheduledTime || '').trim()
      const k = key || '—'
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(w)
    })
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([slotKey, items]) => ({ slotKey, items }))
  }, [useGrouping, paginatedWork, filteredWork])

  const totalRows = useVirtualization ? filteredWork.length : paginatedWork.length
  const displayRows = useVirtualization
    ? filteredWork.slice(virtStart, Math.min(virtEnd, filteredWork.length))
    : paginatedWork

  // Handle scroll to compute virtual window
  const handleVirtScroll = useCallback(() => {
    if (!virtContainerRef.current) return
    const scrollTop = virtContainerRef.current.scrollTop
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - Math.floor(BUFFER_ROWS / 2))
    const end = start + visibleCount
    setVirtStart(start)
    setVirtEnd(end)
  }, [visibleCount])

  // Initialize virtual window when data changes
  useEffect(() => {
    if (useVirtualization) {
      setVirtStart(0)
      setVirtEnd(visibleCount)
    }
  }, [useVirtualization, filteredWork.length, visibleCount])

  // Handle page change - fetch new data from API
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
    const today = getCurrentDateString()
    if (dateFilterType === 'today') {
      fetchTechnicianBookings(today, newPage)
    } else if (dateFilterType === 'custom') {
      fetchTechnicianBookings(selectedDate, newPage)
    } else {
      fetchTechnicianBookings(undefined, newPage)
    }
  }, [dateFilterType, selectedDate, fetchTechnicianBookings])

  // Reset to first page and refetch when filters change (chỉ cho staff mode với API pagination)
  useEffect(() => {
    if (mode === 'staff' && (statusFilter !== 'all' || serviceTypeFilter !== 'all')) {
      setCurrentPage(1)
      const today = getCurrentDateString()
      if (dateFilterType === 'today') {
        fetchTechnicianBookings(today, 1)
      } else if (dateFilterType === 'custom') {
        fetchTechnicianBookings(selectedDate, 1)
      } else {
        fetchTechnicianBookings(undefined, 1)
      }
    }
  }, [statusFilter, serviceTypeFilter, mode, dateFilterType, selectedDate, fetchTechnicianBookings])

  return {
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
  }
}


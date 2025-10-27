import { useState, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { BookingService, Booking } from '@/services/bookingService'
import BookingStats from './BookingStats'
import BookingFilters from './BookingFilters'
import BookingTable from './BookingTable'
import BookingPagination from './BookingPagination'

export default function BookingManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  
  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const centerId = user?.centerId || 2
      const response = await BookingService.getBookingsByCenter(centerId)
      
      if (response.success) {
        setBookings(response.data.bookings)
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải dữ liệu')
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customerInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerInfo.phoneNumber.includes(searchTerm) ||
      booking.vehicleInfo.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex)

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return { bg: '#FFF8E5', color: '#FFD875', text: 'Chờ xác nhận' }
      case 'CONFIRMED':
        return { bg: '#E0F2FE', color: '#0EA5E9', text: 'Đã xác nhận' }
      case 'IN_PROGRESS':
        return { bg: '#FEF3C7', color: '#F59E0B', text: 'Đang xử lý' }
      case 'COMPLETED':
        return { bg: '#F0FDF4', color: '#22C55E', text: 'Hoàn thành' }
      case 'CANCELLED':
        return { bg: '#FEF2F2', color: '#EF4444', text: 'Đã hủy' }
      default:
        return { bg: '#F3F4F6', color: '#6B7280', text: status }
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Quản lý Đặt lịch
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Quản lý và theo dõi tất cả đặt lịch của chi nhánh
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <BookingStats bookings={bookings} />

      {/* Search and Filter */}
      <BookingFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Bookings Table */}
      <BookingTable
        bookings={paginatedBookings}
        loading={loading}
        error={error}
        onRetry={loadBookings}
        getStatusColor={getStatusColor}
      />

      {/* Pagination */}
      {!loading && !error && filteredBookings.length > pageSize && (
        <BookingPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBookings.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
import { useEffect, useMemo, useState } from 'react'
import { BookingService, type Booking } from '@/services/bookingService'
import { StaffService } from '@/services/staffService'
import { RefreshCw, Calendar, Search, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export default function AppointmentManagement() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [centerId, setCenterId] = useState<number | null>(null)
  const [centerName, setCenterName] = useState<string>('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
 
      let cid: number | null = centerId
      let cname: string = centerName

      // Nếu chưa có centerId, cố gắng lấy từ staff assignment
      if (!cid) {
        try {
          console.log('[AppointmentManagement] Getting current staff assignment...')
          const assignment = await StaffService.getCurrentStaffAssignment()
          cid = assignment.centerId
          cname = assignment.centerName
          setCenterId(cid)
          setCenterName(cname)
          console.log('[AppointmentManagement] Staff assignment:', assignment)
        } catch (err: any) {
          console.warn('[AppointmentManagement] Failed to get staff assignment:', err.message)
          // Không throw error, để user có thể chọn manual
        }
      }

      if (!cid) {
        setBookings([])
        setError('Không thể xác định trung tâm của bạn. Vui lòng liên hệ quản trị để được gán trung tâm.')
        return
      }

      // Load bookings by center
      console.log('[AppointmentManagement] Fetch bookings by center:', { centerId: cid, centerName: cname })
      const bookingsResp = await BookingService.getBookingsByCenter(cid)
      console.log('[AppointmentManagement] Bookings response:', bookingsResp)
      
      const list: Booking[] = bookingsResp?.data?.bookings || []
      setBookings(list)
    } catch (err: any) {
      setError(err.message || 'Không thể tải lịch hẹn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return (bookings || []).filter(b => {
      const matchStatus = statusFilter === 'all' || (b.status || '').toLowerCase() === statusFilter
      const matchTerm = !term ||
        (b.customerInfo?.fullName || '').toLowerCase().includes(term) ||
        (b.vehicleInfo?.licensePlate || '').toLowerCase().includes(term) ||
        (b.serviceInfo?.serviceName || '').toLowerCase().includes(term) ||
        (b.centerInfo?.centerName || '').toLowerCase().includes(term)
      return matchStatus && matchTerm
    })
  }, [bookings, searchTerm, statusFilter])

  const paginatedBookings = useMemo(() => {
    const total = filteredBookings.length
    const pages = Math.max(1, Math.ceil(total / pageSize))
    setTotalPages(pages)
    const start = (pageNumber - 1) * pageSize
    return filteredBookings.slice(start, start + pageSize)
  }, [filteredBookings, pageNumber, pageSize])

  return (
    <div style={{ 
      padding: '24px', 
      background: 'var(--bg-secondary)', 
      minHeight: '100%',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Quản lý Lịch hẹn
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>
            {centerId ? `Trung tâm hiện tại: ${centerName || `#${centerId}`}` : 'Đang xác định trung tâm...'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={loadData} disabled={loading} style={{
            padding: '12px 20px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '2px solid var(--border-primary)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.borderColor = 'var(--primary-500)'
            e.currentTarget.style.background = 'var(--primary-50)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            e.currentTarget.style.borderColor = 'var(--border-primary)'
            e.currentTarget.style.background = 'var(--bg-card)'
          }}>
            <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' as any : 'none' }} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px',
            }}>
              Tìm kiếm
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-tertiary)' 
              }} />
              <input
                placeholder="Tìm theo khách hàng, biển số, dịch vụ, trung tâm..."
                value={searchTerm}
                onChange={(e) => { setPageNumber(1); setSearchTerm(e.target.value) }}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '2px solid var(--border-primary)',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-500)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px' 
            }}>
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => { setPageNumber(1); setStatusFilter(e.target.value) }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-primary)',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="inprogress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div>
            <button 
              onClick={() => {
                setPageNumber(1)
                setSearchTerm('')
                setStatusFilter('all')
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: '2px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-500)'
                e.currentTarget.style.background = 'var(--primary-50)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)'
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
            >
              <RefreshCw size={16} />
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '32px',
        borderRadius: '20px',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            Danh sách Lịch hẹn
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber((p) => p - 1)}
              style={{ 
                padding: '6px 10px', 
                borderRadius: '6px',
                border: '1px solid var(--border-primary)',
                background: pageNumber === 1 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                color: pageNumber === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                cursor: pageNumber === 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (pageNumber !== 1) {
                  e.currentTarget.style.background = 'var(--primary-50)'
                  e.currentTarget.style.borderColor = 'var(--primary-500)'
                }
              }}
              onMouseLeave={(e) => {
                if (pageNumber !== 1) {
                  e.currentTarget.style.background = 'var(--bg-card)'
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                }
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{
              padding: '6px 10px',
              background: 'var(--primary-50)',
              borderRadius: '6px',
              color: 'var(--primary-700)',
              fontSize: '12px',
              fontWeight: '600',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {pageNumber} / {totalPages}
            </span>
            <button
              disabled={pageNumber === totalPages}
              onClick={() => setPageNumber((p) => p + 1)}
              style={{ 
                padding: '6px 10px', 
                borderRadius: '6px',
                border: '1px solid var(--border-primary)',
                background: pageNumber === totalPages ? 'var(--bg-secondary)' : 'var(--bg-card)',
                color: pageNumber === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                cursor: pageNumber === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (pageNumber !== totalPages) {
                  e.currentTarget.style.background = 'var(--primary-50)'
                  e.currentTarget.style.borderColor = 'var(--primary-500)'
                }
              }}
              onMouseLeave={(e) => {
                if (pageNumber !== totalPages) {
                  e.currentTarget.style.background = 'var(--bg-card)'
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                }
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-primary)',
              borderTop: '3px solid var(--primary-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ margin: 0, fontSize: '16px' }}>Đang tải lịch hẹn...</p>
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: 'var(--error-500)' 
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'var(--error-50)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertCircle size={20} />
            </div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{error}</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--bg-secondary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--text-tertiary)'
            }}>
              <Calendar size={32} />
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
              Không có lịch hẹn nào
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Thử thay đổi bộ lọc hoặc làm mới dữ liệu
            </p>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  color: 'white'
                }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: 600, border: 'none' }}>Khách hàng</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: 600, border: 'none' }}>Biển số</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: 600, border: 'none' }}>Dịch vụ</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: 600, border: 'none' }}>Kỹ thuật viên</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '14px', fontWeight: 600, border: 'none' }}>Thời gian</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '14px', fontWeight: 600, border: 'none' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((b, idx) => (
                  <tr 
                    key={b.bookingId}
                    style={{
                      borderBottom: '1px solid var(--border-primary)',
                      transition: 'all 0.2s ease',
                      background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-50)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}
                  >
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-primary)' }}>{b.customerInfo?.fullName}</td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>{b.vehicleInfo?.licensePlate}</td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>{b.serviceInfo?.serviceName}</td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>{b.technicianInfo?.technicianName || '—'}</td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>{b.timeSlotInfo?.workDate ? `${new Date(b.timeSlotInfo.workDate).toLocaleDateString('vi-VN')} • ${b.timeSlotInfo?.slotLabel || ''}` : b.bookingDate}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 999,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                        fontSize: 12, fontWeight: 700
                      }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-card)',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            disabled={pageNumber === 1}
            onClick={() => setPageNumber(1)}
            style={{ 
              padding: '8px 12px', borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              background: pageNumber === 1 ? 'var(--bg-secondary)' : 'var(--bg-card)',
              color: pageNumber === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
              cursor: pageNumber === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '4px'
            }}
            onMouseEnter={(e) => { if (pageNumber !== 1) { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary-500)' } }}
            onMouseLeave={(e) => { if (pageNumber !== 1) { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-primary)' } }}
          >
            <ChevronsLeft size={16} />
            <span style={{ marginLeft: '4px' }}>Đầu</span>
          </button>

          <button
            disabled={pageNumber === 1}
            onClick={() => setPageNumber((p) => p - 1)}
            style={{ 
              padding: '8px 12px', borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              background: pageNumber === 1 ? 'var(--bg-secondary)' : 'var(--bg-card)',
              color: pageNumber === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
              cursor: pageNumber === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '4px'
            }}
            onMouseEnter={(e) => { if (pageNumber !== 1) { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary-500)' } }}
            onMouseLeave={(e) => { if (pageNumber !== 1) { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-primary)' } }}
          >
            <ChevronLeft size={16} />
            <span style={{ marginLeft: '4px' }}>Trước</span>
          </button>

          <span style={{ padding: '6px 10px', background: 'var(--primary-50)', borderRadius: '6px', color: 'var(--primary-700)', fontSize: '12px', fontWeight: 600, minWidth: 60, textAlign: 'center' }}>
            {pageNumber} / {totalPages}
          </span>

          <button
            disabled={pageNumber === totalPages}
            onClick={() => setPageNumber((p) => p + 1)}
            style={{ 
              padding: '8px 12px', borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              background: pageNumber === totalPages ? 'var(--bg-secondary)' : 'var(--bg-card)',
              color: pageNumber === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
              cursor: pageNumber === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '4px'
            }}
            onMouseEnter={(e) => { if (pageNumber !== totalPages) { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary-500)' } }}
            onMouseLeave={(e) => { if (pageNumber !== totalPages) { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-primary)' } }}
          >
            <span style={{ marginRight: '4px' }}>Sau</span>
            <ChevronRight size={16} />
          </button>

          <button
            disabled={pageNumber === totalPages}
            onClick={() => setPageNumber(totalPages)}
            style={{ 
              padding: '8px 12px', borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              background: pageNumber === totalPages ? 'var(--bg-secondary)' : 'var(--bg-card)',
              color: pageNumber === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
              cursor: pageNumber === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '4px'
            }}
            onMouseEnter={(e) => { if (pageNumber !== totalPages) { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary-500)' } }}
            onMouseLeave={(e) => { if (pageNumber !== totalPages) { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-primary)' } }}
          >
            <span style={{ marginRight: '4px' }}>Cuối</span>
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}



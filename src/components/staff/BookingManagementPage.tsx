import { useState } from 'react'
import {
  Plus,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { BookingService } from '../../services/bookingService'
import QuickPartsApprovalModal from '@/components/booking/QuickPartsApprovalModal'
import BookingStatusModal from '@/components/booking/BookingStatusModal'
import './BookingManagementPage.scss'

// Mock data for booking management
const mockBookingData = [
  {
    id: 'BK001',
    serviceName: 'Bảo dưỡng định kỳ',
    customerName: 'Nguyễn Văn An',
    vehicleModel: 'VinFast VF8',
    licensePlate: '30A-12345',
    createdAt: '2024-01-15T09:30:00Z',
    technicianName: 'Trần Minh Tuấn',
    status: 'confirmed',
    estimatedCost: 1500000,
    scheduledDate: '2024-01-20T10:00:00Z'
  },
  {
    id: 'BK002',
    serviceName: 'Sửa chữa phanh',
    customerName: 'Lê Thị Bình',
    vehicleModel: 'VinFast VF9',
    licensePlate: '29B-67890',
    createdAt: '2024-01-14T14:20:00Z',
    technicianName: 'Phạm Văn Đức',
    status: 'in_progress',
    estimatedCost: 2500000,
    scheduledDate: '2024-01-18T14:00:00Z'
  },
  {
    id: 'BK003',
    serviceName: 'Thay dầu động cơ',
    customerName: 'Hoàng Văn Cường',
    vehicleModel: 'VinFast VF5',
    licensePlate: '43C-11111',
    createdAt: '2024-01-13T11:15:00Z',
    technicianName: 'Nguyễn Thị Hoa',
    status: 'completed',
    estimatedCost: 800000,
    scheduledDate: '2024-01-16T09:00:00Z'
  },
  {
    id: 'BK004',
    serviceName: 'Kiểm tra hệ thống điện',
    customerName: 'Vũ Thị Dung',
    vehicleModel: 'VinFast VF6',
    licensePlate: '51D-22222',
    createdAt: '2024-01-12T16:45:00Z',
    technicianName: 'Đỗ Văn Nam',
    status: 'pending',
    estimatedCost: 1200000,
    scheduledDate: '2024-01-19T15:30:00Z'
  },
  {
    id: 'BK005',
    serviceName: 'Bảo dưỡng điều hòa',
    customerName: 'Bùi Văn Em',
    vehicleModel: 'VinFast VF7',
    licensePlate: '33E-33333',
    createdAt: '2024-01-11T08:30:00Z',
    technicianName: 'Lý Thị Phương',
    status: 'cancelled',
    estimatedCost: 1800000,
    scheduledDate: '2024-01-17T11:00:00Z'
  }
]

// Chart data
const bookingTrendData = [
  { name: 'T2', bookings: 12, completed: 8 },
  { name: 'T3', bookings: 19, completed: 15 },
  { name: 'T4', bookings: 15, completed: 12 },
  { name: 'T5', bookings: 22, completed: 18 },
  { name: 'T6', bookings: 18, completed: 14 },
  { name: 'T7', bookings: 25, completed: 20 },
  { name: 'CN', bookings: 20, completed: 16 }
]

const statusDistributionData = [
  { name: 'Đã xác nhận', value: 35, color: '#10B981' },
  { name: 'Đang xử lý', value: 25, color: '#F59E0B' },
  { name: 'Hoàn thành', value: 30, color: '#3B82F6' },
  { name: 'Đã hủy', value: 10, color: '#EF4444' }
]

const serviceStatsData = [
  { name: 'Bảo dưỡng', count: 45, revenue: 67500000 },
  { name: 'Sửa chữa', count: 32, revenue: 80000000 },
  { name: 'Thay thế', count: 18, revenue: 36000000 },
  { name: 'Kiểm tra', count: 25, revenue: 30000000 }
]

// Status configuration
const statusConfig = {
  confirmed: { label: 'Đã xác nhận', color: 'var(--success-500)', bgColor: 'var(--success-50)' },
  checked_in: { label: 'Đã check-in', color: '#10B981', bgColor: '#D1FAE5' },
  in_progress: { label: 'Đang xử lý', color: 'var(--warning-500)', bgColor: 'var(--warning-50)' },
  completed: { label: 'Hoàn thành', color: 'var(--primary-500)', bgColor: 'var(--primary-50)' },
  pending: { label: 'Chờ xử lý', color: 'var(--text-tertiary)', bgColor: 'var(--bg-tertiary)' },
  cancelled: { label: 'Đã hủy', color: 'var(--error-500)', bgColor: 'var(--error-50)' }
}

export default function BookingManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPartsModal, setShowPartsModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  // Calculate stats
  const totalBookings = mockBookingData.length
  const todayBookings = mockBookingData.filter(booking =>
    new Date(booking.createdAt).toDateString() === new Date().toDateString()
  ).length
  const pendingBookings = mockBookingData.filter(booking => booking.status === 'pending').length
  const completedBookings = mockBookingData.filter(booking => booking.status === 'completed').length

  // Filter bookings
  const filteredBookings = mockBookingData.filter(booking => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getNumericBookingId = (id: string): number | null => {
    const n = parseInt(id.replace(/\D/g, ''), 10)
    return Number.isFinite(n) ? n : null
  }

  const openRowPartsModal = (mockId: string) => {
    const numericId = getNumericBookingId(mockId)
    if (!numericId) return
    setSelectedBookingId(numericId)
    setShowPartsModal(true)
  }

  const openStatusModal = (mockId: string, currentStatus: string) => {
    const numericId = getNumericBookingId(mockId)
    if (!numericId) return
    setSelectedBookingId(numericId)
    setSelectedStatus((currentStatus || '').toUpperCase())
    setShowStatusModal(true)
  }

  return (
    <div className="booking-management-page">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 8px 0'
          }}>
            Quản lý Booking
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý và theo dõi các đơn đặt lịch dịch vụ
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="create-booking-btn"
        >
          <Plus size={20} />
          Tạo Booking Mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Tổng Booking</p>
              <p className="stat-value">{totalBookings}</p>
            </div>
            <div className="stat-icon primary">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Hôm nay</p>
              <p className="stat-value">{todayBookings}</p>
            </div>
            <div className="stat-icon success">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Chờ xử lý</p>
              <p className="stat-value" style={{ color: 'var(--warning-500)' }}>{pendingBookings}</p>
            </div>
            <div className="stat-icon warning">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Hoàn thành</p>
              <p className="stat-value" style={{ color: 'var(--success-500)' }}>{completedBookings}</p>
            </div>
            <div className="stat-icon success">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Booking Trend Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Xu hướng Booking</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="var(--primary-500)"
                strokeWidth={3}
                name="Tổng Booking"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="var(--success-500)"
                strokeWidth={3}
                name="Hoàn thành"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Phân bố trạng thái</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Stats Chart */}
      <div className="service-stats-chart">
        <h3 className="chart-title">Thống kê dịch vụ</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={serviceStatsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis dataKey="name" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="count" fill="var(--primary-500)" name="Số lượng" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên khách hàng, dịch vụ, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="checked_in">Đã check-in</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Booking Table */}
      <div className="booking-table-container">
        <div className="table-header">
          <h3 className="table-title">Danh sách Booking</h3>
          <p className="table-subtitle">
            {filteredBookings.length} booking được tìm thấy
          </p>
        </div>

        <div className="table-wrapper">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Mã Booking</th>
                <th>Dịch vụ</th>
                <th>Khách hàng</th>
                <th>Xe</th>
                <th>Biển số</th>
                <th>Ngày tạo</th>
                <th>Kỹ thuật viên</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} onClick={() => openRowPartsModal(booking.id)}>
                  <td>
                    <span className="booking-id">{booking.id}</span>
                  </td>
                  <td>{booking.serviceName}</td>
                  <td>
                    <div className="customer-name">{booking.customerName}</div>
                  </td>
                  <td>{booking.vehicleModel}</td>
                  <td>
                    <span className="license-plate">{booking.licensePlate}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(booking.createdAt)}
                  </td>
                  <td>{booking.technicianName}</td>
                  <td>
                    <span className={`status-badge ${booking.status}`}>
                      {statusConfig[booking.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
                      <button
                        onClick={() => openStatusModal(booking.id, booking.status)}
                        title="Đổi trạng thái"
                        style={{
                          padding: '6px 10px',
                          border: '1px solid var(--border-primary)',
                          background: 'var(--bg-card)',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 12,
                          color: 'var(--text-primary)'
                        }}
                      >
                        Trạng thái
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal: Quick Parts Approval */}
      <QuickPartsApprovalModal
        bookingId={selectedBookingId}
        open={showPartsModal}
        onClose={() => setShowPartsModal(false)}
      />

      {/* Modal: Booking Status */}
      <BookingStatusModal
        open={showStatusModal}
        bookingId={selectedBookingId}
        currentStatus={selectedStatus}
        onClose={() => setShowStatusModal(false)}
        onUpdated={async () => { /* Khi có dữ liệu thật, có thể reload ở đây */ }}
      />
    </div>
  )
}

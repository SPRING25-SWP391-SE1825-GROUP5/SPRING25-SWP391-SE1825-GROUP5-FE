import { Calendar as CalendarIcon, Car, Phone, Mail } from 'lucide-react'
import { Booking } from '@/services/bookingService'

interface BookingTableProps {
  bookings: Booking[]
  loading: boolean
  error: string | null
  onRetry: () => void
  getStatusColor: (status: string) => { bg: string; color: string; text: string }
}

export default function BookingTable({
  bookings,
  loading,
  error,
  onRetry,
  getStatusColor
}: BookingTableProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '0.5px solid #F1F5F9',
      overflow: 'hidden',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }}>
      {loading ? (
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#6B7280' }}>Đang tải...</div>
        </div>
      ) : error ? (
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#EF4444' }}>{error}</div>
          <button 
            onClick={onRetry}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#FFD875',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      ) : bookings.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                  Khách hàng
                </th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Xe</th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Dịch vụ</th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Kỹ thuật viên</th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Thời gian</th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Trạng thái</th>
                <th style={{ textAlign: 'center', padding: '16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => {
                const statusStyle = getStatusColor(booking.status)
                return (
                  <tr 
                    key={booking.bookingId}
                    style={{ 
                      borderBottom: index < bookings.length - 1 ? '1px solid #F3F4F6' : 'none',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F9FAFB'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: '#FFD875',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontWeight: '600',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {booking.customerInfo.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#111827',
                            margin: '0 0 4px 0'
                          }}>
                            {booking.customerInfo.fullName}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B7280' }}>
                            <Mail size={12} />
                            {booking.customerInfo.email}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B7280' }}>
                            <Phone size={12} />
                            {booking.customerInfo.phoneNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <Car size={16} style={{ color: '#6B7280' }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {booking.vehicleInfo.licensePlate}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            {booking.vehicleInfo.modelName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {booking.serviceInfo.serviceName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {booking.serviceInfo.basePrice.toLocaleString()} VNĐ
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {booking.technicianInfo.technicianName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {booking.technicianInfo.position}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {booking.timeSlotInfo.slotLabel}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {booking.bookingDate}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {statusStyle.text}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: '#6B7280' }}>
                        {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '80px 40px', textAlign: 'center' }}>
          <CalendarIcon size={64} style={{ color: '#6B7280', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Không tìm thấy đặt lịch nào
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      )}
    </div>
  )
}

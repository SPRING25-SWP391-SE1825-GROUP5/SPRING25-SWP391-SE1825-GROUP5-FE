import React from 'react'
import ServiceBookingForm from '@/components/booking/ServiceBookingForm'

/**
 * StaffBookingForm - Wrapper component cho staff tạo booking
 * 
 * Component này wrap ServiceBookingForm và force nó hoạt động ở guest mode
 * để staff có thể tạo booking cho khách hàng khác mà không bị ảnh hưởng
 * bởi trạng thái đăng nhập của staff.
 */
const StaffBookingForm: React.FC = () => {
  return (
    <div className="service-booking-form" style={{ paddingTop: 0 }}>
      {/* Header */}
      <div className="booking-header">
        <h1 className="booking-title">TẠO BOOKING CHO KHÁCH HÀNG</h1>
        <p className="booking-subtitle">Điền thông tin để tạo booking dịch vụ cho khách hàng</p>
      </div>

      {/* ServiceBookingForm với guest mode */}
      <div className="booking-content" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
        <ServiceBookingForm forceGuestMode={true} />
      </div>

      {/* CSS Styles - Giống với ServiceBookingForm */}
      <style>{`
        .service-booking-form {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: var(--bg-card);
          min-height: 100vh;
        }

        .booking-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .booking-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }

        .booking-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .booking-content {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-primary);
        }

        /* Override ServiceBookingForm để tránh double styling */
        .booking-content .service-booking-form {
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          min-height: auto !important;
        }

        .booking-content .booking-header {
          display: none !important;
        }

        .booking-content .booking-content {
          background: transparent !important;
          border-radius: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }

        @media (max-width: 768px) {
          .service-booking-form {
            padding: 1rem;
          }
          
          .booking-title {
            font-size: 1.5rem;
          }
          
          .booking-content {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default StaffBookingForm

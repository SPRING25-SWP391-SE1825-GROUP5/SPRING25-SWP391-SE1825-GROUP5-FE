import './services.scss'

export default function Services() {
  return (
    <section className="container py-4 services-page">
      <header className="services-header">
        <h1>Dịch vụ</h1>
        <p className="services-subtitle">Danh sách dịch vụ đang được chuyển dần từ Vue sang React.</p>
      </header>

      <div className="services-grid">
        <div className="service-card">
          <div className="service-title">Bảo dưỡng định kỳ</div>
          <div className="service-desc">Kiểm tra tổng quát, vệ sinh, căn chỉnh và thay thế vật tư hao mòn.</div>
          <div className="service-cta">
            <a className="btn-secondary" href="/booking">Đặt lịch</a>
          </div>
        </div>
        <div className="service-card">
          <div className="service-title">Kiểm tra pin & hệ thống điện</div>
          <div className="service-desc">Chẩn đoán pin, BMS, sạc và hệ thống dây dẫn để đảm bảo an toàn.</div>
          <div className="service-cta">
            <a className="btn-secondary" href="/booking">Đặt lịch</a>
          </div>
        </div>
        <div className="service-card">
          <div className="service-title">Thay thế phụ tùng</div>
          <div className="service-desc">Phụ tùng chính hãng, bảo hành theo tiêu chuẩn.</div>
          <div className="service-cta">
            <a className="btn-secondary" href="/booking">Đặt lịch</a>
          </div>
        </div>
      </div>
    </section>
  )
}

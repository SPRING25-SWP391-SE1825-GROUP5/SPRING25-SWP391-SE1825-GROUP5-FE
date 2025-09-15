export default function About() {
  const branches = [
    { id: 1, name: 'EV Service Hà Nội', address: '123 Đường ABC, Cầu Giấy, Hà Nội', lat: 21.028511, lng: 105.804817, phone: '024-1234-5678', hours: '08:00 - 17:00' },
    { id: 2, name: 'EV Service TP.HCM', address: '456 Đường XYZ, Quận 1, TP.HCM', lat: 10.776889, lng: 106.700806, phone: '028-1234-5678', hours: '08:00 - 17:00' },
    { id: 3, name: 'EV Service Đà Nẵng', address: '789 Đường DEF, Hải Châu, Đà Nẵng', lat: 16.047079, lng: 108.206230, phone: '0236-123-456', hours: '08:00 - 17:00' },
  ]

  return (
    <section className="about-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px', paddingTop: 96 }}>
      {/* Intro */}
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0B6B50', margin: 0 }}>Về EV Service</h1>
        <p style={{ color: '#555', margin: '8px 0 0' }}>
          EV Service là hệ thống trung tâm dịch vụ chuyên nghiệp dành cho xe điện tại Việt Nam. Chúng tôi cung cấp các gói bảo dưỡng định kỳ,
          sửa chữa, chẩn đoán chuyên sâu với tiêu chuẩn minh bạch, nhanh chóng và thân thiện với môi trường.
        </p>
      </header>

      {/* Highlights */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ border: '1px solid var(--border-primary)', borderRadius: 12, padding: 12, background: '#fff' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Tầm nhìn</div>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>Trở thành hệ thống dịch vụ xe điện đáng tin cậy nhất Việt Nam.</p>
        </div>
        <div style={{ border: '1px solid var(--border-primary)', borderRadius: 12, padding: 12, background: '#fff' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Sứ mệnh</div>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>Mang đến trải nghiệm bảo dưỡng minh bạch, an toàn và tối ưu chi phí.</p>
        </div>
        <div style={{ border: '1px solid var(--border-primary)', borderRadius: 12, padding: 12, background: '#fff' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Giá trị cốt lõi</div>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--text-secondary)' }}>
            <li>Chất lượng • Tận tâm • Minh bạch</li>
          </ul>
        </div>
      </section>

      {/* Branches */}
      <h3 style={{ fontSize: 22, fontWeight: 700, margin: '24px 0 12px' }}>Hệ thống chi nhánh</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {branches.map(b => (
          <div key={b.id} style={{ border: '1px solid var(--border-primary)', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>{b.name}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{b.address}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>☎ {b.phone}</span>
                <span>•</span>
                <span>🕘 {b.hours}</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-primary)' }}>
              <iframe
                title={`map-${b.id}`}
                src={`https://www.google.com/maps?q=${b.lat},${b.lng}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ width: '100%', height: 220, border: 0 }}
                allowFullScreen
              />
            </div>
            <div style={{ borderTop: '1px solid var(--border-primary)', padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Xem đường đi trên Google Maps</span>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${b.lat},${b.lng}`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--primary-300)', color: 'var(--primary-700)', background: 'var(--primary-50)', fontWeight: 700, textDecoration: 'none' }}
              >Chỉ đường</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


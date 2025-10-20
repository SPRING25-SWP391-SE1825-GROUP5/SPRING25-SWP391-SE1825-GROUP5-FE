import { useNavigate } from 'react-router-dom'
import { Calendar, Handshake, Wrench, Car, Shield, Check } from 'lucide-react'
import banner from '@/assets/images/banner-dich-vu-sua-chua_1755497298.webp'
import serviceCommon from '@/assets/images/dich-vu-sua-chua-chung-vinfast_0.webp'
import policyImage from '@/assets/images/chinh-sach-cam-ket-thoi-gian-sua-chua_0.webp'

export default function Services() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#fff', minHeight: 'calc(100vh - 64px)', fontFamily: 'Mulish, serif' }}>
      {/* Top header area white background */}
      <div style={{ paddingTop: '64px', paddingBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '56px', fontWeight: 700, margin: '0 0 24px 0', color: '#3C3C3C', lineHeight: 1.15 }}>
          Dịch vụ sửa chữa
        </h1>
        <button
          onClick={() => navigate('/booking')}
          style={{
            background: '#1464F4', color: '#FFFFFF', border: '2px solid #1464F4', padding: '14px 40px', borderRadius: '8px',
            fontFamily: 'Mulish, serif', fontSize: '16px', fontWeight: 700, letterSpacing: 1, cursor: 'pointer', boxShadow: '0 12px 30px rgba(20,100,244,0.25)'
          }}
        >
          ĐẶT LỊCH DỊCH VỤ
        </button>
      </div>

      {/* Banner image */}
      <img src={banner} alt="Dịch vụ sửa chữa" style={{ display: 'block', width: '100%', height: 'auto' }} />

      {/* Process Section - full width */}
      <section style={{ width: '100%', padding: '64px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', color: '#3C3C3C', margin: 0 }}>Quy trình dịch vụ</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: 8, marginBottom: 40 }}>Chuyên nghiệp và chu đáo với 5 bước</p>
        {/* Steps grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 32 }}>
          {/* ...existing steps... */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: 12, background: '#1464F4', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={36} color="#fff" />
            </div>
            <div style={{ color: '#0f172a', fontWeight: 800, marginBottom: 6 }}>BƯỚC 1</div>
            <div style={{ color: '#334155' }}>Nhắc bảo dưỡng & Đặt hẹn</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: 12, background: '#e2e8f0', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Handshake size={36} color="#64748b" />
            </div>
            <div style={{ color: '#0f172a', fontWeight: 800, marginBottom: 6 }}>BƯỚC 2</div>
            <div style={{ color: '#334155' }}>Tiếp nhận và tư vấn</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: 12, background: '#e2e8f0', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={36} color="#64748b" />
            </div>
            <div style={{ color: '#0f172a', fontWeight: 800, marginBottom: 6 }}>BƯỚC 3</div>
            <div style={{ color: '#334155' }}>Sửa chữa</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: 12, background: '#e2e8f0', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={36} color="#64748b" />
            </div>
            <div style={{ color: '#0f172a', fontWeight: 800, marginBottom: 6 }}>BƯỚC 4</div>
            <div style={{ color: '#334155' }}>Bàn giao xe</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: 12, background: '#e2e8f0', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={36} color="#64748b" />
            </div>
            <div style={{ color: '#0f172a', fontWeight: 800, marginBottom: 6 }}>BƯỚC 5</div>
            <div style={{ color: '#334155' }}>Chăm sóc sau sửa chữa</div>
          </div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24, marginTop: 40 }}>
          <div style={{ color: '#334155', lineHeight: 1.6 }}>
            <div>Khách hàng mua xe mới và làm dịch vụ tại xưởng sẽ được nhắc bảo dưỡng trước 10 ngày so với ngày dự kiến đến kỳ bảo dưỡng.</div>
            <div>Các cuộc hẹn trước ít nhất 4 tiếng được tiếp nhận và xác nhận hẹn.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/booking')} style={{ background: '#1464F4', color: '#fff', border: 'none', padding: '16px 28px', borderRadius: 8, fontWeight: 800, minWidth: 280 }}>ĐẶT LỊCH BẢO DƯỠNG</button>
          <button onClick={() => navigate('/contact')} style={{ background: '#fff', color: '#1464F4', border: '2px solid #1464F4', padding: '16px 28px', borderRadius: 8, fontWeight: 800, minWidth: 280 }}>LIÊN HỆ</button>
        </div>
      </section>

      {/* Common repair section - full width with top padding 100px */}
      <section style={{ width: '100%', padding: '100px 0px 0px', display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 48, alignItems: 'center' }}>
        <div style={{ paddingRight: 24 }}>
          <h3 style={{ fontSize: '40px', color: '#3C3C3C', margin: '0 0 30px' }}>Dịch vụ Sửa chữa chung VinFast</h3>
          <div style={{ color: '#334155', lineHeight: 1.8, marginBottom: 16 }}>
            VinFast cung cấp dịch vụ sửa chữa chuyên nghiệp với thiết bị hiện đại và đội ngũ kỹ thuật viên được đào tạo bài bản:
          </div>
          {[
            'Chẩn đoán chính xác, sửa chữa hiệu quả, đảm bảo xe luôn vận hành an toàn và ổn định.',
            'Phụ tùng chính hãng, sẵn có, chất lượng cao.',
            'Trang thiết bị nhập khẩu từ Ý, Đức, Nhật,... đáp ứng tiêu chuẩn kỹ thuật khắt khe.',
            'Quản lý lịch sử xe toàn quốc, chăm sóc Khách hàng đồng bộ tại mọi đại lý.',
            'Kỹ thuật viên VinFast được đào tạo trực tiếp tại nhà máy, đảm bảo tay nghề và chuyên môn cao.'
          ].map((text, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: '#0f172a', marginBottom: 12 }}>
              <Check size={18} color="#1464F4" style={{ marginTop: 4 }} />
              <span style={{ color: '#334155' }}>{text}</span>
            </div>
          ))}
        </div>
        <img src={serviceCommon} alt="Dịch vụ sửa chữa chung" style={{ width: 760, height: 'auto', borderRadius: 8, justifySelf: 'end' }} />
      </section>

      {/* Policy commitment section - full width with top padding 100px */}
      <section style={{ width: '100%', padding: '100px 24px 48px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', columnGap: 48, alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '44px', color: '#3C3C3C', margin: '0 0 20px' }}>Chính sách cam kết thời gian sửa chữa</h3>
          <p style={{ color: '#334155' }}>VinFast cam kết minh bạch và đúng hẹn trong thời gian sửa chữa, nhằm nâng cao trải nghiệm và sự hài lòng của Khách hàng.</p>
          <div style={{ marginTop: 16 }}>
            {[
              'Hỗ trợ 500.000 VNĐ/ngày (đã gồm VAT) nếu thời gian sửa chữa vượt quá cam kết.',
              'Với lỗi liên quan đến pin hoặc động cơ, Khách hàng sẽ được hỗ trợ mượn pin hoặc xe trong thời gian chờ sửa chữa.',
              'Áp dụng cho: Tất cả Khách hàng sở hữu ô tô điện và ô tô xăng VinFast.',
              'Không áp dụng: Vào các ngày nghỉ lễ, Tết theo quy định Nhà nước.'
            ].map((text, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: '#0f172a', marginBottom: 12 }}>
                <Check size={18} color="#1464F4" style={{ marginTop: 4 }} />
                <span style={{ color: '#334155' }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: 16, borderRadius: 8, color: '#92400E', marginTop: 20 }}>Lưu ý: Nếu được cung cấp xe mượn, Khách hàng tự chi trả chi phí cầu đường, phạt vi phạm… (nếu có).</div>
        </div>
        <img src={policyImage} alt="Express Service" style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
      </section>
    </div>
  )
}

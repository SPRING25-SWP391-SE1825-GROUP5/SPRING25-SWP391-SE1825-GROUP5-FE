import { useEffect, useMemo, useState } from 'react'
import bannerImage from '@/assets/images/it-s-official-maeving-s-electric-motorcycles-are-now-in-the-us.jpg'
import logoImage from '@/assets/images/photo-1-1638274363739461323011-1638276946612-1638276947297252976460.webp'
import './SavartHomepage.scss'
import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

export default function SavartHomepage() {
  const [, setCurrentSlide] = useState(0)
  const navigate = useNavigate()
  const { user } = useAppSelector((s) => s.auth)

  const bannerBgImage = useMemo(
    () => `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${bannerImage})`,
    []
  )

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide(v => (v + 1) % 2), 5000)

    const handleScroll = () => {
      const header = document.getElementById('header')
      if (!header) return
      if (window.scrollY > 100) header.classList.add('stuck')
      else header.classList.remove('stuck')
    }

    // simple intersection observer for reveal animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))

    window.addEventListener('scroll', handleScroll)
    return () => {
      clearInterval(interval)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="savart-homepage" style={{ fontFamily: 'Montserrat, sans-serif', margin: 0, padding: 0, background: '#ffffff' }}>
      <main id="main" style={{ width: '100%', overflowX: 'hidden' }}>
        <div id="content" role="main" style={{ position: 'relative' }}>
          {/* Hero Banner Desktop */}
          <div className="hide-for-small" id="banner-desktop" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#ffffff' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 as number }}>
                <div className="hero-bg-image" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.1, backgroundImage: bannerBgImage }} />
              </div>

              <div style={{ position: 'relative', zIndex: 2 as number, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', minHeight: '100vh', padding: '2rem 0', maxWidth: 1200, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
                {/* Text */}
                <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--primary-color)', lineHeight: 1.1, margin: 0 }}>
                    Trung Tâm Bảo Dưỡng Xe Điện
                    <span style={{ display: 'block', background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginTop: '0.5rem' }}>
                      <strong>Chuyên Nghiệp & Tin Cậy</strong>
                    </span>
                  </h1>

                  <p style={{ fontSize: '1.25rem', color: 'var(--quaternary-color)', lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
                    Đặt lịch nhanh, theo dõi minh bạch, công nghệ AI tối ưu quy trình bảo dưỡng xe điện của bạn.
                  </p>

                  <div className="hero-cta">
                    <Link to="/booking" className="btn-primary-new hero-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', color: 'var(--tertiary-color)', padding: '1.1rem 2rem', border: 'none', borderRadius: 12, fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 8px 25px rgba(0, 64, 48, 0.3)' }}>
                      <span>Đặt Lịch Ngay</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                    <Link to="/services" className="btn-secondary" style={{ padding: '1rem 1.5rem', borderRadius: 12, fontWeight: 600 }}>
                      Xem Dịch Vụ
                    </Link>
                    <Link to="/about" className="about-link" style={{ alignSelf: 'center', fontWeight: 600, padding: '0.5rem 0.75rem' }}>
                      Tìm hiểu về chúng tôi →
                    </Link>
                  </div>
                </div>

                {/* Visual */}
                <div className="reveal reveal-delay-1" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ position: 'relative', maxWidth: 500, width: '100%' }}>
                    <div style={{ position: 'absolute', top: -20, left: -20, right: -20, bottom: -20, background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))', borderRadius: 24, opacity: 0.1, zIndex: 1 }} />
                    <img src={logoImage} alt="Electric Vehicle Service" style={{ position: 'relative', width: '100%', height: 'auto', borderRadius: 20, boxShadow: '0 25px 50px rgba(0, 64, 48, 0.2)', zIndex: 2, transition: 'transform 0.3s ease' }} />

                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3 }}>
                      <div className="floating-card card-1" style={{ position: 'absolute', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(74,151,130,0.2)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 8px 25px rgba(0,64,48,0.15)', animation: 'float 6s ease-in-out infinite', top: '10%', right: '-10%', animationDelay: '0s' as any }}>
                        <div className="card-text">Bảo Dưỡng Chuyên Nghiệp</div>
                      </div>
                      <div className="floating-card card-2" style={{ position: 'absolute', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(74,151,130,0.2)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 8px 25px rgba(0,64,48,0.15)', animation: 'float 6s ease-in-out infinite', bottom: '30%', left: '-15%', animationDelay: '2s' as any }}>
                        <div className="card-text">Đặt Lịch Online</div>
                      </div>
                      <div className="floating-card card-3" style={{ position: 'absolute', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(74,151,130,0.2)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 8px 25px rgba(0,64,48,0.15)', animation: 'float 6s ease-in-out infinite', top: '60%', right: '-5%', animationDelay: '4s' as any }}>
                        <div className="card-text">Công Nghệ AI</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Banner Mobile */}
          <div className="hero-banner-mobile show-for-small" id="banner-mobile">
            <div className="hero-container-mobile">
              <div className="hero-background">
                <div className="hero-bg-image" style={{ backgroundImage: bannerBgImage }} />
                <div className="hero-gradient-overlay" />
                <div className="hero-pattern-overlay" />
              </div>

              <div className="hero-content-mobile container">
                <div className="hero-text-content-mobile">
                  <div className="hero-badge">
                    <span className="badge-icon">⚡</span>
                    <span>Trung Tâm Bảo Dưỡng Xe Điện</span>
                  </div>

                  <h1 className="hero-main-title-mobile">
                    Trung Tâm Bảo Dưỡng Xe Điện
                    <span className="title-highlight">Chuyên Nghiệp & Tin Cậy</span>
                  </h1>

                  <p className="hero-description-mobile">
                    Hệ thống quản lý bảo dưỡng xe điện toàn diện với công nghệ AI
                  </p>

                  <div className="hero-cta-section" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link to="/booking" className="btn-primary-new hero-cta-btn">
                      <span>Đặt Lịch Ngay</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                    <Link to="/services" className="btn-secondary" style={{ borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)', padding: '0.9rem 1.25rem', borderRadius: 12, fontWeight: 600 }}>
                      Xem Dịch Vụ
                    </Link>
                    <Link to="/about" style={{ alignSelf: 'center', color: 'var(--text-link)', fontWeight: 600, padding: '0.5rem 0.75rem' }}>
                      Về chúng tôi →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <section className="features-section" style={{ padding: '6rem 0', background: 'linear-gradient(135deg, #FFF9E5 0%, #F8F9FA 100%)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
              <h2 className="reveal" style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', color: 'var(--text-primary)', marginBottom: '4rem', position: 'relative' }}>
                Tại Sao Chọn Hệ Thống Quản Lý EV Service?
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                <div
                  className="feature-card reveal"
                  onClick={() => navigate('/booking')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/booking')}
                  aria-label="Đăng ký lịch bảo dưỡng"
                  style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: 20, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', transition: 'all 0.4s ease', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <div className="feature-icon" style={{ width: 80, height: 80, margin: '0 auto 2rem', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s ease', color: '#fff' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M3 8H21" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M8 15L10.5 17.5L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Đăng Ký Lịch Bảo Dưỡng</h3>
                  <p>Đặt lịch bảo dưỡng xe điện online 24/7, chọn thời gian phù hợp với lịch trình của bạn</p>
                </div>

                <div
                  className="feature-card reveal reveal-delay-1"
                  onClick={() => navigate('/services')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/services')}
                  aria-label="Mua phụ tùng chính hãng"
                  style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: 20, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', transition: 'all 0.4s ease', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <div className="feature-icon" style={{ width: 80, height: 80, margin: '0 auto 2rem', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s ease', color: '#fff' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 8L12 3L3 8L12 13L21 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M3 8V16L12 21L21 16V8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Mua Phụ Tùng Chính Hãng</h3>
                  <p>Đặt mua phụ tùng xe điện chính hãng với giá tốt nhất, giao hàng tận nơi</p>
                </div>

                <div
                  className="feature-card reveal reveal-delay-2"
                  onClick={() => navigate(user ? '/maintenance-history' : `/login?redirect=${encodeURIComponent('/maintenance-history')}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(user ? '/maintenance-history' : `/login?redirect=${encodeURIComponent('/maintenance-history')}`)}
                  aria-label="Xem lịch sử bảo dưỡng"
                  style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: 20, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', transition: 'all 0.4s ease', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <div className="feature-icon" style={{ width: 80, height: 80, margin: '0 auto 2rem', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s ease', color: '#fff' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="7" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 2H15V6H9V2Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M9 14H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3>Danh Sách Chi Tiết Bảo Dưỡng</h3>
                  <p>Xem lịch sử bảo dưỡng chi tiết, theo dõi tình trạng xe và lịch bảo dưỡng tiếp theo</p>
                </div>
              </div>
            </div>
          </section>

          {/* Video Section */}
          <section className="video-section" style={{ padding: '6rem 0', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--quaternary-color) 100%)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                <div className="video-text reveal">
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>Quy Trình Dịch Vụ Chuyên Nghiệp</h2>
                  <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Từ đặt lịch online, tiếp nhận xe, phân công kỹ thuật viên đến theo dõi tiến độ và thanh toán - tất cả được quản lý minh bạch và hiệu quả.
                  </p>
                  <button className="btn-secondary video-cta">Tìm Hiểu Thêm</button>
                </div>
                <div className="video-player reveal reveal-delay-1" style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                  <video controls poster={logoImage}>
                    <source src="https://savart-ev.com/wp-content/uploads/2024/12/Savart-EV-Video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section" style={{ padding: '6rem 0', background: 'linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%)', textAlign: 'center' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
              <div className="cta-content reveal">
                <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>
                  Sẵn Sàng Trải Nghiệm Dịch Vụ EV Chuyên Nghiệp?
                </h2>
                <p style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,0.9)', marginBottom: '3rem', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
                  Hệ thống quản lý bảo dưỡng xe điện toàn diện với công nghệ AI và theo dõi thời gian thực
                </p>
                <div className="cta-buttons" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/booking" className="btn-primary" style={{ background: 'var(--tertiary-color)', color: 'var(--primary-color)', boxShadow: '0 6px 20px rgba(255,249,229,0.3)', padding: '1.2rem 3rem', border: 'none', borderRadius: 50, fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.4s ease', textTransform: 'uppercase', letterSpacing: '1px', position: 'relative', overflow: 'hidden' }}>
                    Đặt Lịch Bảo Dưỡng
                  </Link>
                  <button className="btn-secondary" style={{ background: 'transparent', color: 'var(--tertiary-color)', border: '2px solid var(--tertiary-color)', padding: '1rem 2.5rem', borderRadius: 50, fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Xem Demo
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}


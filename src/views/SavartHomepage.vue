<template>
  <div class="savart-homepage">
    <!-- Main Content -->
    <main id="main" class="main-container">
      <div id="content" role="main" class="content-wrapper">

        <!-- Hero Banner Desktop -->
        <div class="hero-banner hide-for-small" id="banner-desktop">
          <div class="hero-container">
            <div class="hero-background">
              <div class="hero-bg-image" :style="{ backgroundImage: bannerBgImage }"></div>
              <div class="hero-gradient-overlay"></div>
              <div class="hero-pattern-overlay"></div>
            </div>

            <div class="hero-content container">
              <!-- Hero Text Content -->
              <div class="hero-text-content">

                <h1 class="hero-main-title">
                  Trung Tâm Bảo Dưỡng Xe Điện
                  <span class="title-highlight"><strong>Chuyên Nghiệp & Tin Cậy</strong></span>
                </h1>

                <p class="hero-description">
                  Hệ thống quản lý bảo dưỡng xe điện toàn diện - Từ đặt lịch online đến theo dõi tiến độ thời gian thực
                </p>

                <div class="hero-cta-section">
                  <button class="btn-primary-new hero-cta-btn">
                    <span>Đặt Lịch Ngay</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Hero Visual Section -->
              <div class="hero-visual-content">
                <div class="hero-image-container">
                  <div class="image-decoration"></div>
                  <img :src="logoImage" alt="Electric Vehicle Service" class="hero-main-image" />
                  <div class="floating-elements">
                    <div class="floating-card card-1">
                      <div class="card-text">Bảo Dưỡng Chuyên Nghiệp</div>
                    </div>
                    <div class="floating-card card-2">
                      <div class="card-text">Đặt Lịch Online</div>
                    </div>
                    <div class="floating-card card-3">
                      <div class="card-text">Công Nghệ AI</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hero Banner Mobile -->
        <div class="hero-banner-mobile show-for-small" id="banner-mobile">
          <div class="hero-container-mobile">
            <div class="hero-background">
              <div class="hero-bg-image" :style="{ backgroundImage: bannerBgImage }"></div>
              <div class="hero-gradient-overlay"></div>
              <div class="hero-pattern-overlay"></div>
            </div>

            <div class="hero-content-mobile container">
              <div class="hero-text-content-mobile">
                <div class="hero-badge">
                  <span class="badge-icon">⚡</span>
                  <span>Trung Tâm Bảo Dưỡng Xe Điện</span>
                </div>

                <h1 class="hero-main-title-mobile">
                  Trung Tâm Bảo Dưỡng Xe Điện
                  <span class="title-highlight">Chuyên Nghiệp & Tin Cậy</span>
                </h1>

                <p class="hero-description-mobile">
                  Hệ thống quản lý bảo dưỡng xe điện toàn diện với công nghệ AI
                </p>

                <div class="hero-cta-section">
                  <button class="btn-primary-new hero-cta-btn">
                    <span>Đặt Lịch Ngay</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Features Section -->
        <section class="features-section">
          <div class="container">
            <h2 class="section-title">Tại Sao Chọn Hệ Thống Quản Lý EV Service?</h2>
            <div class="features-grid">
              <div class="feature-card" data-aos="fade-up" data-aos-delay="100" @click="goTo('/booking')">
                <div class="feature-icon">
                  <i class="fas fa-calendar-check"></i>
                </div>
                <h3>Đăng Ký Lịch Bảo Dưỡng</h3>
                <p>Đặt lịch bảo dưỡng xe điện online 24/7, chọn thời gian phù hợp với lịch trình của bạn</p>
              </div>

              <div class="feature-card" data-aos="fade-up" data-aos-delay="200" @click="goTo('/services')">
                <div class="feature-icon">
                  <i class="fas fa-box-open"></i>
                </div>
                <h3>Mua Phụ Tùng Chính Hãng</h3>
                <p>Đặt mua phụ tùng xe điện chính hãng với giá tốt nhất, giao hàng tận nơi</p>
              </div>

              <div class="feature-card" data-aos="fade-up" data-aos-delay="300" @click="goTo('/maintenance-history')">
                <div class="feature-icon">
                  <i class="fas fa-clipboard-list"></i>
                </div>
                <h3>Danh Sách Chi Tiết Bảo Dưỡng</h3>
                <p>Xem lịch sử bảo dưỡng chi tiết, theo dõi tình trạng xe và lịch bảo dưỡng tiếp theo</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Video Section -->
        <section class="video-section">
          <div class="container">
            <div class="video-content">
              <div class="video-text">
                <h2>Quy Trình Dịch Vụ Chuyên Nghiệp</h2>
                <p>Từ đặt lịch online, tiếp nhận xe, phân công kỹ thuật viên đến theo dõi tiến độ và thanh toán - tất cả được quản lý minh bạch và hiệu quả.</p>
                <button class="btn-secondary">Tìm Hiểu Thêm</button>
              </div>
              <div class="video-player">
                <video controls :poster="logoImage">
                  <source src="https://savart-ev.com/wp-content/uploads/2024/12/Savart-EV-Video.mp4" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
          <div class="container">
            <div class="cta-content">
              <h2>Sẵn Sàng Trải Nghiệm Dịch Vụ EV Chuyên Nghiệp?</h2>
              <p>Hệ thống quản lý bảo dưỡng xe điện toàn diện với công nghệ AI và theo dõi thời gian thực</p>
              <div class="cta-buttons">
                <button class="btn-primary">Đặt Lịch Bảo Dưỡng</button>
                <button class="btn-secondary">Xem Demo</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <AppFooter />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

// Import images
import bannerImage from '@/assets/images/it-s-official-maeving-s-electric-motorcycles-are-now-in-the-us.jpg'
import logoImage from '@/assets/images/photo-1-1638274363739461323011-1638276946612-1638276947297252976460.webp'

const router = useRouter()

// Navigation helper
const goTo = (path: string) => {
  router.push(path)
}

// Reactive data
const currentSlide = ref(0)

// Computed background image with gradient overlay
const bannerBgImage = computed(() =>
  `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${bannerImage})`
)

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % 2
}

// Lifecycle
onMounted(() => {
  // Auto-advance slides
  const slideInterval = setInterval(nextSlide, 5000)

  // Header scroll effect
  const handleScroll = () => {
    const header = document.getElementById('header')
    if (header) {
      if (window.scrollY > 100) {
        header.classList.add('stuck')
      } else {
        header.classList.remove('stuck')
      }
    }
  }

  window.addEventListener('scroll', handleScroll)

  onUnmounted(() => {
    clearInterval(slideInterval)
    window.removeEventListener('scroll', handleScroll)
  })
})
</script>

<style scoped>
/* CSS Variables for Color Scheme */
:root {
  --primary-color: #004030;
  --secondary-color: #4A9782;
  --tertiary-color: #DCD0A8;
  --quaternary-color: #FFF9E5;
  --text-primary: #44444E;
  --text-secondary: #666;
  --bg-card: #ffffff;
}

/* Base Styles */
.savart-homepage {
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  padding: 0;
  background: var(--tertiary-color);
}

.main-container {
  width: 100%;
  overflow-x: hidden;
}

.content-wrapper {
  position: relative;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Modern Hero Banner Styles */
.hero-banner {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: var(--tertiary-color);
}

.hero-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.hero-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.1;
}

.hero-gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  opacity: 0.05;
}

.hero-pattern-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 25% 25%, var(--secondary-color) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, var(--primary-color) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.03;
}

.hero-content {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 0;
}

/* Hero Text Content */
.hero-text-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(74, 151, 130, 0.1);
  border: 1px solid rgba(74, 151, 130, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--secondary-color);
  width: fit-content;
  backdrop-filter: blur(10px);
}

.badge-icon {
  font-size: 1.2rem;
}

.hero-main-title {
  font-size: 4rem;
  font-weight: 900;
  color: var(--primary-color);
  line-height: 1.1;
  margin: 0;
}

.title-highlight {
  display: block;
  background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-top: 0.5rem;
}

.hero-description {
  font-size: 1.3rem;
  color: var(--quaternary-color);
  line-height: 1.6;
  max-width: 500px;
  margin: 0;
}

.text-box {
  position: absolute;
}

.text-box.x5 { left: 5%; }
.text-box.y90 { bottom: 10%; }
.text-box.y50 { top: 50%; transform: translateY(-50%); }
.text-box.y20 { top: 20%; }
.text-box.y15 { top: 15%; }

.text-box-content.text.dark {
  color: white;
}

.hero-content-animated {
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 4.2rem;
  font-weight: 900;
  color: var(--tertiary-color);
  margin-bottom: 1.5rem;
  text-shadow: 3px 3px 8px rgba(0,64,48,0.7);
  background: linear-gradient(135deg, var(--tertiary-color), #ffffff, var(--tertiary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: slideInLeft 1s ease-out 0.2s both, titleGlow 3s ease-in-out infinite alternate;
  line-height: 1.1;
}

@keyframes titleGlow {
  0% { filter: drop-shadow(0 0 10px rgba(255,255,255,0.3)); }
  100% { filter: drop-shadow(0 0 20px rgba(255,255,255,0.6)); }
}

.hero-subtitle {
  font-size: 1.6rem;
  color: var(--tertiary-color);
  margin-bottom: 2.5rem;
  animation: slideInLeft 1s ease-out 0.4s both;
  text-shadow: 2px 2px 6px rgba(0,64,48,0.6);
  font-weight: 400;
  max-width: 600px;
}

/* Hero Features List */
.hero-features-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(74, 151, 130, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateX(10px);
  box-shadow: 0 8px 25px rgba(0, 64, 48, 0.1);
}

.feature-icon-wrapper {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon {
  filter: brightness(1) invert(0);
}

.feature-item span {
  color: var(--quaternary-color);
  font-size: 1rem;
  font-weight: 600;
}

/* Hero CTA Section */
.hero-cta-section {
  margin-top: 1rem;
}

.btn-primary-new {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: var(--tertiary-color);
  padding: 1.25rem 2.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 8px 25px rgba(0, 64, 48, 0.3);
}

.btn-primary-new:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(0, 64, 48, 0.4);
}

.btn-primary-new svg {
  transition: transform 0.3s ease;
}

.btn-primary-new:hover svg {
  transform: translateX(5px);
}

/* Hero Visual Content */
.hero-visual-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-image-container {
  position: relative;
  max-width: 500px;
  width: 100%;
}

.image-decoration {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
  border-radius: 24px;
  opacity: 0.1;
  z-index: 1;
}

.hero-main-image {
  position: relative;
  width: 100%;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 64, 48, 0.2);
  z-index: 2;
  transition: transform 0.3s ease;
}

.hero-main-image:hover {
  transform: scale(1.02);
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
}

.floating-card {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 151, 130, 0.2);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 8px 25px rgba(0, 64, 48, 0.15);
  animation: float 6s ease-in-out infinite;
}

.card-1 {
  top: 10%;
  right: -10%;
  animation-delay: 0s;
}

.card-2 {
  bottom: 30%;
  left: -15%;
  animation-delay: 2s;
}

.card-3 {
  top: 60%;
  right: -5%;
  animation-delay: 4s;
}

.card-icon {
  font-size: 1.5rem;
}

.card-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--quaternary-color);
  white-space: nowrap;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%, var(--primary-color) 200%);
  background-size: 200% 200%;
  color: var(--tertiary-color);
  padding: 1.2rem 3rem;
  border: none;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s ease;
  box-shadow: 0 6px 20px rgba(0, 64, 48, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  animation: buttonGlow 3s ease-in-out infinite alternate;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 35px rgba(0, 64, 48, 0.7);
  background-position: 100% 0;
}

@keyframes buttonGlow {
  0% { box-shadow: 0 6px 20px rgba(0, 64, 48, 0.5); }
  100% { box-shadow: 0 6px 25px rgba(0, 64, 48, 0.8); }
}

.btn-secondary {
  background: transparent;
  color: var(--secondary-color);
  border: 2px solid var(--secondary-color);
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-secondary:hover {
  background: var(--secondary-color);
  color: var(--tertiary-color);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(74, 151, 130, 0.4);
}

/* Enhanced Features Section */
.features-section {
  padding: 6rem 0;
  background: linear-gradient(135deg, #FFF9E5 0%, #F8F9FA 100%);
}

.section-title {
  font-size: 3rem;
  font-weight: 800;
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 4rem;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 2px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.5rem;
}

.feature-card {
  background: white;
  padding: 2.5rem 2rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(74, 151, 130, 0.18),  /* secondary */
    rgba(220, 208, 168, 0.35), /* thirdly */
    transparent
  );
  transition: left 0.6s ease;
}

.feature-card:hover::before {
  left: 100%;
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;

	.feature-icon svg {
	  width: 40px;
	  height: 40px;
	  color: #ffffff;
	}

}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
  background: linear-gradient(135deg, var(--tertiary-color), var(--quaternary-color));
}

.feature-icon i {
  font-size: 40px;
  color: white;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1rem;
}

/* Video Section */
.video-section {
  padding: 6rem 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--quaternary-color) 100%);
}

.video-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.video-text h2 {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1.5rem;
}

.video-text p {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.8);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.video-player {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.video-player video {
  width: 100%;
  height: auto;
  display: block;
}

/* CTA Section */
.cta-section {
  padding: 6rem 0;
  background: linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%);
  text-align: center;
}

.cta-content h2 {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1.5rem;
}

.cta-content p {
  font-size: 1.3rem;
  color: rgba(255,255,255,0.9);
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-buttons {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-section .btn-primary {
  background: var(--tertiary-color);
  color: var(--primary-color);
  box-shadow: 0 6px 20px rgba(255,249,229,0.3);
}

.cta-section .btn-primary:hover {
  background: var(--bg-card);
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 35px rgba(255,249,229,0.4);
}

.cta-section .btn-secondary {
  border-color: var(--tertiary-color);
  color: var(--tertiary-color);
}

.cta-section .btn-secondary:hover {
  background: var(--tertiary-color);
  color: var(--primary-color);
}

/* Animations */
@keyframes slideInLeft {
  0% { transform: translateX(-50px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes slideInUp {
  0% { transform: translateY(30px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

/* Mobile Hero Banner Styles */
.hero-banner-mobile {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: var(--tertiary-color);
}

.hero-container-mobile {
  position: relative;
  width: 100%;
  height: 100%;
}

.hero-content-mobile {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 0;
  text-align: center;
}

.hero-text-content-mobile {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.hero-main-title-mobile {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--primary-color);
  line-height: 1.1;
  margin: 0;
}

.hero-description-mobile {
  font-size: 1.1rem;
  color: var(--quaternary-color);
  line-height: 1.6;
  max-width: 400px;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
  }

  .hero-main-title {
    font-size: 3.5rem;
  }

  .floating-card {
    display: none;
  }
}
@media (max-width: 1024px) {
  .video-content {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
  }

  .hero-title {
    font-size: 3.5rem;
  }
}

@media (max-width: 768px) {
  .hero-banner {
    min-height: 80vh;
  }

  .hero-main-title-mobile {
    font-size: 2rem;
  }

  .hero-description-mobile {
    font-size: 1rem;
  }

  .section-title {
    font-size: 2.2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .hero-features-list {
    gap: 0.75rem;
  }

  .feature-item {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .hero-main-title-mobile {
    font-size: 1.75rem;
  }

  .hero-description-mobile {
    font-size: 0.9rem;
  }

  .btn-primary-new, .btn-primary, .btn-secondary {
    padding: 1rem 2rem;
    font-size: 1rem;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .hero-features-list {
    gap: 0.5rem;
  }

  .feature-item {
    padding: 0.5rem;
    gap: 0.75rem;
  }

  .feature-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .feature-icon {
    width: 20px;
    height: 20px;
  }
}

/* Hide/Show for different screen sizes */
.hide-for-small {
  display: block;
}

.show-for-small {
  display: none;
}

@media (max-width: 768px) {
  .hide-for-small {
    display: none;
  }

  .show-for-small {
    display: block;
  }
}
</style>

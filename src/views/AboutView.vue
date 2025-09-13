<template>
  <div class="about-page">
    <PublicHeader />
    <div class="container">
      <div class="about-header">
        <h1>Về Chúng Tôi</h1>
        <p>Trung tâm bảo dưỡng xe điện hàng đầu với công nghệ tiên tiến</p>
      </div>
      
      <div class="about-content">
        <div class="about-section">
          <h2>Tầm Nhìn</h2>
          <p>Trở thành trung tâm bảo dưỡng xe điện hàng đầu Việt Nam với hệ thống quản lý thông minh và dịch vụ chuyên nghiệp.</p>
        </div>
        
        <div class="about-section">
          <h2>Sứ Mệnh</h2>
          <p>Cung cấp dịch vụ bảo dưỡng xe điện chất lượng cao, minh bạch và tiện lợi thông qua công nghệ AI và hệ thống quản lý hiện đại.</p>
        </div>
        
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">
              <img src="@/assets/images/ev-charging.svg" alt="Smart Technology" />
            </div>
            <h3>Công Nghệ Thông Minh</h3>
            <p>Hệ thống AI hỗ trợ quản lý và dự báo nhu cầu bảo dưỡng</p>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <img src="@/assets/images/maintenance.svg" alt="Professional Service" />
            </div>
            <h3>Dịch Vụ Chuyên Nghiệp</h3>
            <p>Đội ngũ kỹ thuật viên được đào tạo chuyên sâu về xe điện</p>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <img src="@/assets/images/warranty.svg" alt="Quality Guarantee" />
            </div>
            <h3>Bảo Hành Chất Lượng</h3>
            <p>Cam kết chất lượng dịch vụ với chế độ bảo hành toàn diện</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PublicHeader from '@/components/layout/PublicHeader.vue'
// This is a public page - no authentication required
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  padding: 2rem 0;
  background: linear-gradient(135deg, #FFF9E5 0%, #F8F9FA 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.about-header {
  text-align: center;
  margin-bottom: 4rem;
}

.about-header h1 {
  font-size: 3rem;
  font-weight: 800;
  color: #004030;
  margin-bottom: 1rem;
}

.about-header p {
  font-size: 1.2rem;
  color: #666;
}

.about-content {
  display: grid;
  gap: 3rem;
}

.about-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.about-section h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #004030;
  margin-bottom: 1rem;
}

.about-section p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #666;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-item {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #004030, #4A9782);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon img {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
}

.feature-item h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #004030;
  margin-bottom: 1rem;
}

.feature-item p {
  color: #666;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .about-header h1 {
    font-size: 2.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .about-section {
    padding: 1.5rem;
  }
}
</style>

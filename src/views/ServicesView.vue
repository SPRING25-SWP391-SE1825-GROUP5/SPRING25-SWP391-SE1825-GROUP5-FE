<template>
  <div class="services-page">
    <div class="container">
      <div class="services-header">
        <h1>Dịch Vụ Của Chúng Tôi</h1>
        <p>Các dịch vụ bảo dưỡng xe điện chuyên nghiệp và toàn diện</p>
      </div>
      
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon">
            <img src="@/assets/images/ev-charging.svg" alt="Battery Service" />
          </div>
          <h3>Bảo Dưỡng Pin</h3>
          <p>Kiểm tra, bảo dưỡng và thay thế pin xe điện với công nghệ tiên tiến</p>
          <ul>
            <li>Kiểm tra dung lượng pin</li>
            <li>Cân bằng cell pin</li>
            <li>Thay thế pin khi cần</li>
          </ul>
        </div>
        
        <div class="service-card">
          <div class="service-icon">
            <img src="@/assets/images/maintenance.svg" alt="Motor Service" />
          </div>
          <h3>Bảo Dưỡng Động Cơ</h3>
          <p>Kiểm tra và bảo dưỡng hệ thống động cơ điện</p>
          <ul>
            <li>Kiểm tra hiệu suất động cơ</li>
            <li>Bảo dưỡng hệ thống làm mát</li>
            <li>Kiểm tra hệ thống điều khiển</li>
          </ul>
        </div>
        
        <div class="service-card">
          <div class="service-icon">
            <img src="@/assets/images/warranty.svg" alt="Electronics Service" />
          </div>
          <h3>Hệ Thống Điện Tử</h3>
          <p>Kiểm tra và sửa chữa các hệ thống điện tử trên xe</p>
          <ul>
            <li>Cập nhật phần mềm</li>
            <li>Kiểm tra cảm biến</li>
            <li>Sửa chữa bảng điều khiển</li>
          </ul>
        </div>
      </div>
      
      <div class="booking-cta">
        <h2>Sẵn sàng đặt lịch bảo dưỡng?</h2>
        <p>Liên hệ với chúng tôi để được tư vấn và đặt lịch bảo dưỡng</p>
        <div class="cta-buttons">
          <router-link to="/login" class="btn-primary">Đặt Lịch Ngay</router-link>
          <router-link to="/contact" class="btn-secondary">Liên Hệ Tư Vấn</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Services page - public access
</script>

<style scoped>
.services-page {
  min-height: 100vh;
  padding: 2rem 0;
  background: linear-gradient(135deg, #FFF9E5 0%, #F8F9FA 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.services-header {
  text-align: center;
  margin-bottom: 4rem;
}

.services-header h1 {
  font-size: 3rem;
  font-weight: 800;
  color: #004030;
  margin-bottom: 1rem;
}

.services-header p {
  font-size: 1.2rem;
  color: #666;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.service-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.service-card:hover {
  transform: translateY(-5px);
}

.service-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #004030, #4A9782);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-icon img {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
}

.service-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #004030;
  margin-bottom: 1rem;
  text-align: center;
}

.service-card p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  text-align: center;
}

.service-card ul {
  list-style: none;
  padding: 0;
}

.service-card li {
  color: #666;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  position: relative;
  padding-left: 1.5rem;
}

.service-card li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #4A9782;
  font-weight: bold;
}

.booking-cta {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.booking-cta h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #004030;
  margin-bottom: 1rem;
}

.booking-cta p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 1rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #004030, #4A9782);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,64,48,0.3);
}

.btn-secondary {
  background: transparent;
  color: #4A9782;
  border: 2px solid #4A9782;
}

.btn-secondary:hover {
  background: #4A9782;
  color: white;
}

@media (max-width: 768px) {
  .services-header h1 {
    font-size: 2.5rem;
  }
  
  .services-grid {
    grid-template-columns: 1fr;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>

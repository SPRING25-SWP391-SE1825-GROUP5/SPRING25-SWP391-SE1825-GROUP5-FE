<template>
  <div class="contact-page">
    <div class="container">
      <div class="contact-header">
        <h1>Liên Hệ Với Chúng Tôi</h1>
        <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
      </div>
      
      <div class="contact-content">
        <div class="contact-info">
          <div class="info-card">
            <div class="info-icon">📍</div>
            <h3>Địa Chỉ</h3>
            <p>123 Đường ABC, Quận 1<br>TP. Hồ Chí Minh, Việt Nam</p>
          </div>
          
          <div class="info-card">
            <div class="info-icon">📞</div>
            <h3>Điện Thoại</h3>
            <p>Hotline: 1900-1234<br>Mobile: 0901-234-567</p>
          </div>
          
          <div class="info-card">
            <div class="info-icon">✉️</div>
            <h3>Email</h3>
            <p>info@evservice.com<br>support@evservice.com</p>
          </div>
          
          <div class="info-card">
            <div class="info-icon">🕒</div>
            <h3>Giờ Làm Việc</h3>
            <p>Thứ 2 - Thứ 6: 8:00 - 18:00<br>Thứ 7 - CN: 8:00 - 17:00</p>
          </div>
        </div>
        
        <div class="contact-form">
          <h2>Gửi Tin Nhắn Cho Chúng Tôi</h2>
          <form @submit.prevent="submitForm">
            <div class="form-group">
              <label for="name">Họ và Tên *</label>
              <input type="text" id="name" v-model="form.name" required>
            </div>
            
            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" v-model="form.email" required>
            </div>
            
            <div class="form-group">
              <label for="phone">Số Điện Thoại</label>
              <input type="tel" id="phone" v-model="form.phone">
            </div>
            
            <div class="form-group">
              <label for="subject">Chủ Đề *</label>
              <select id="subject" v-model="form.subject" required>
                <option value="">Chọn chủ đề</option>
                <option value="booking">Đặt lịch bảo dưỡng</option>
                <option value="support">Hỗ trợ kỹ thuật</option>
                <option value="complaint">Khiếu nại</option>
                <option value="other">Khác</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="message">Tin Nhắn *</label>
              <textarea id="message" v-model="form.message" rows="5" required></textarea>
            </div>
            
            <button type="submit" class="btn-submit">Gửi Tin Nhắn</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
})

const submitForm = () => {
  // Handle form submission
  alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.')
  // Reset form
  form.value = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  }
}
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
  padding: 2rem 0;
  background: linear-gradient(135deg, #FFF9E5 0%, #F8F9FA 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.contact-header {
  text-align: center;
  margin-bottom: 4rem;
}

.contact-header h1 {
  font-size: 3rem;
  font-weight: 800;
  color: #004030;
  margin-bottom: 1rem;
}

.contact-header p {
  font-size: 1.2rem;
  color: #666;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}

.contact-info {
  display: grid;
  gap: 1.5rem;
}

.info-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  text-align: center;
}

.info-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.info-card h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #004030;
  margin-bottom: 0.5rem;
}

.info-card p {
  color: #666;
  line-height: 1.6;
}

.contact-form {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.contact-form h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #004030;
  margin-bottom: 2rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #004030;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4A9782;
}

.btn-submit {
  width: 100%;
  background: linear-gradient(135deg, #004030, #4A9782);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,64,48,0.3);
}

@media (max-width: 768px) {
  .contact-header h1 {
    font-size: 2.5rem;
  }
  
  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .contact-form {
    padding: 2rem;
  }
}
</style>

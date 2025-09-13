<template>
  <header class="public-header">
    <div class="container">
      <div class="header-content">
        <div class="logo">
          <router-link to="/" class="logo-link">
            <img src="@/assets/images/photo-1-1638274363739461323011-1638276946612-1638276947297252976460.webp" alt="EV Service" class="logo-image" />
            <span class="logo-text">EV Service</span>
          </router-link>
        </div>
        
        <nav class="nav-menu">
          <router-link to="/" class="nav-link">Trang Chủ</router-link>
          <router-link to="/about" class="nav-link">Về Chúng Tôi</router-link>
          <router-link to="/services" class="nav-link">Dịch Vụ</router-link>
          <router-link to="/contact" class="nav-link">Liên Hệ</router-link>
        </nav>
        
        <div class="auth-buttons">
          <router-link to="/login" class="btn-login">Đăng Nhập</router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// Public header component
</script>

<style scoped>
.public-header {
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.logo-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: #004030;
}

.nav-menu {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 600;
  transition: color 0.3s ease;
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #004030;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #004030, #4A9782);
  border-radius: 1px;
}

.btn-login {
  background: linear-gradient(135deg, #004030, #4A9782);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,64,48,0.3);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-menu {
    gap: 1rem;
  }
  
  .nav-link {
    font-size: 0.9rem;
  }
}
</style>

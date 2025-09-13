<template>
  <footer class="app-footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">SWP391 Project</h3>
          <p class="footer-description">
            Hệ thống quản lý dự án Spring 2024
          </p>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">Liên kết</h4>
          <ul class="footer-links">
            <li><router-link to="/" class="footer-link">Trang chủ</router-link></li>
            <li><router-link to="/dashboard" class="footer-link">Dashboard</router-link></li>
            <li><router-link to="/users" class="footer-link">Người dùng</router-link></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">Hỗ trợ</h4>
          <ul class="footer-links">
            <li><a href="#" class="footer-link">Trợ giúp</a></li>
            <li><a href="#" class="footer-link">Liên hệ</a></li>
            <li><a href="#" class="footer-link">Báo lỗi</a></li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p class="footer-copyright">
          © {{ currentYear }} SWP391 Project. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  }
}
</script>

<style scoped>
.app-footer {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-top: 1px solid var(--border-dark);
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 3rem 0 2rem;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-light);
  margin: 0;
}

.footer-subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.footer-description {
  color: var(--tertiary-color);
  line-height: 1.6;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-link {
  color: var(--tertiary-color);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--text-light);
}

.footer-bottom {
  border-top: 1px solid var(--border-dark);
  padding: 1.5rem 0;
  text-align: center;
}

.footer-copyright {
  color: var(--tertiary-color);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 2rem 0 1.5rem;
  }
}
</style>

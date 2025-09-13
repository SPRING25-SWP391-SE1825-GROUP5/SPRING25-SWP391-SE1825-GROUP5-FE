<template>
  <div class="login-page">
    <!-- Background with EV theme -->
    <div class="background-overlay">
      <div class="electric-patterns">
        <div class="pattern pattern-1"></div>
        <div class="pattern pattern-2"></div>
        <div class="pattern pattern-3"></div>
      </div>
    </div>

    <div class="login-container">
      <!-- Left side - Branding -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="logo-section">
            <img src="https://savart-ev.com/wp-content/uploads/2023/06/logo-white.webp" alt="Savart EV" class="brand-logo">
            <h1 class="brand-title">Savart EV Service Hub</h1>
            <p class="brand-subtitle">Nền tảng quản lý dịch vụ xe điện toàn diện</p>
          </div>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">⚡</div>
              <span>Quản lý bảo dưỡng thông minh</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🔧</div>
              <span>Đặt lịch dịch vụ nhanh chóng</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <span>Theo dõi trạng thái real-time</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🚗</div>
              <span>Chuyên biệt cho xe điện</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side - Login form -->
      <div class="login-form-section">
        <div class="form-container">
          <div class="form-header">
            <h2 class="form-title">Đăng nhập</h2>
            <p class="form-subtitle">Chào mừng bạn quay trở lại</p>
          </div>

          <div v-if="authStore.error" class="error-alert">
            <div class="error-icon">⚠️</div>
            <span class="error-text">{{ authStore.error }}</span>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <div class="input-group">
              <label class="input-label">Email *</label>
              <input
                v-model="form.email"
                type="email"
                class="form-input"
                placeholder="Nhập email của bạn"
                required
                :disabled="authStore.loading"
              />
            </div>

            <div class="input-group">
              <label class="input-label">Mật khẩu *</label>
              <input
                v-model="form.password"
                type="password"
                class="form-input"
                placeholder="Nhập mật khẩu"
                required
                :disabled="authStore.loading"
              />
            </div>

            <button
              type="submit"
              class="login-btn"
              :disabled="!isFormValid || authStore.loading"
            >
              <span v-if="authStore.loading" class="loading-spinner"></span>
              {{ authStore.loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
            </button>

            <button type="button" class="google-btn" @click="handleGoogleLogin" :disabled="authStore.loading">
              <img class="google-icon" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Đăng nhập với Google
            </button>
          </form>

          <div class="form-footer">
            <p class="footer-text">
              Chưa có tài khoản?
              <a href="#" class="link-primary" @click.prevent="handleRegister">Đăng ký tại đây</a>
            </p>
            <p class="footer-text">
              <a href="#" class="link-secondary">Quên mật khẩu?</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: ''
})

const isFormValid = computed(() => {
  return form.email.length > 0 && form.password.length > 0
})

const handleLogin = async () => {
  const success = await authStore.login({
    email: form.email,
    password: form.password
  })

  if (success) {
    const redirectPath = route.query.redirect as string || '/dashboard'
    router.push(redirectPath)
  }
}

const handleRegister = () => {
  router.push('/register')
}
</script>

const handleGoogleLogin = () => {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  const googlePath = import.meta.env.VITE_GOOGLE_OAUTH_PATH || '/auth/google'
  window.location.href = `${base}${googlePath}`
}


<style scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--quaternary-color) 50%, var(--secondary-color) 100%);
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.electric-patterns {
  position: absolute;
  width: 100%;
  height: 100%;
}

.pattern {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 151, 130, 0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

.pattern-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.pattern-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.pattern-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 60%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.login-container {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 100vh;
}

.login-brand {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: rgba(0, 64, 48, 0.8);
  backdrop-filter: blur(10px);
}

.brand-content {
  max-width: 500px;
  text-align: center;
}

.logo-section {
  margin-bottom: 3rem;
}

.brand-logo {
  width: 80px;
  height: auto;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 8px rgba(74, 151, 130, 0.3));
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--secondary-color) 0%, var(--tertiary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 1.2rem;
  color: var(--tertiary-color);
  line-height: 1.6;
}

.features-list {
  display: grid;
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(74, 151, 130, 0.1);
  border: 1px solid rgba(74, 151, 130, 0.2);
  border-radius: 12px;
  color: var(--text-light);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(74, 151, 130, 0.2);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--secondary-color), var(--tertiary-color));
  border-radius: 8px;
}

.login-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.form-container {
  width: 100%;
  max-width: 400px;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 1.25rem;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-input {
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: var(--bg-input);
}

.form-input:focus {
  outline: none;
  border-color: var(--secondary-color);
  box-shadow: 0 0 0 3px rgba(74, 151, 130, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-light);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 151, 130, 0.4);
}

.login-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-footer {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-text {
  font-size: 0.875rem;
  color: #64748b;
}

.link-primary {
  color: var(--secondary-color);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.link-primary:hover {
  color: var(--primary-color);
  text-decoration: underline;
}

.link-secondary {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.link-secondary:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-brand {
    padding: 2rem 1rem;
    min-height: 40vh;
  }

  .brand-title {
    font-size: 2rem;
  }

  .features-list {
    display: none;
  }

  .login-form-section {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .login-brand {
    padding: 1.5rem 1rem;
    min-height: 30vh;
  }

  .brand-title {
    font-size: 1.75rem;
  }

  .form-title {
    font-size: 1.75rem;
  }
}

/* Body Section Styles */
.body-section {
  padding: 4rem 0;
  background: linear-gradient(135deg, var(--tertiary-color) 0%, var(--bg-secondary) 100%);
  position: relative;
  overflow: hidden;
}

.body-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
}

.body-content {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.content-item {
  display: flex;
}

.content-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid rgba(226, 232, 240, 0.8);
  width: 100%;
  text-align: center;
}

.content-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: rgba(59, 130, 246, 0.3);
}

.card-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.service-icon {
  width: 32px;
  height: 32px;
  filter: brightness(0) invert(1);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.card-description {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.95rem;
}

.cta-section {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.cta-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cta-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-button {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-light);
  border: none;
  border-radius: 12px;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(74, 151, 130, 0.4);
}

.cta-button:hover {
  background: linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(74, 151, 130, 0.4);
}

@media (max-width: 768px) {
  .body-section {
    padding: 2rem 0;
  }

  .container {
    padding: 0 1rem;
  }

  .content-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .content-card {
    padding: 1.5rem;
  }

  .cta-section {
    padding: 2rem 1rem;
  }

  .cta-title {
    font-size: 1.75rem;
  }

  .cta-subtitle {
    font-size: 1rem;
  }
}
</style>

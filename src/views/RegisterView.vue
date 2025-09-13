<template>
  <div class="login-page">
    <div class="background-overlay">
      <div class="electric-patterns">
        <div class="pattern pattern-1"></div>
        <div class="pattern pattern-2"></div>
        <div class="pattern pattern-3"></div>
      </div>
    </div>

    <div class="login-container">
      <div class="login-brand">
        <div class="brand-content">
          <div class="logo-section">
            <img src="https://savart-ev.com/wp-content/uploads/2023/06/logo-white.webp" alt="Savart EV" class="brand-logo">
            <h1 class="brand-title">Tạo tài khoản Savart EV</h1>
            <p class="brand-subtitle">Bắt đầu hành trình dịch vụ xe điện của bạn</p>
          </div>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">📝</div>
              <span>Đăng ký nhanh chóng</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🔒</div>
              <span>Bảo mật thông tin</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">⚡</div>
              <span>Trải nghiệm mượt mà</span>
            </div>
          </div>
        </div>
      </div>

      <div class="login-form-section">
        <div class="form-container">
          <div class="form-header">
            <h2 class="form-title">Đăng ký</h2>
            <p class="form-subtitle">Tạo tài khoản mới để sử dụng các dịch vụ</p>
          </div>

          <div v-if="error" class="error-alert">
            <div class="error-icon">⚠️</div>
            <span class="error-text">{{ error }}</span>
          </div>

          <form @submit.prevent="handleRegister" class="login-form">
            <div class="input-group">
              <label class="input-label">Họ *</label>
              <input v-model="form.firstName" type="text" class="form-input" placeholder="Nhập họ" required :disabled="loading" />
            </div>
            <div class="input-group">
              <label class="input-label">Tên *</label>
              <input v-model="form.lastName" type="text" class="form-input" placeholder="Nhập tên" required :disabled="loading" />
            </div>
            <div class="input-group">
              <label class="input-label">Email *</label>
              <input v-model="form.email" type="email" class="form-input" placeholder="Nhập email" required :disabled="loading" />
            </div>
            <div class="input-group">
              <label class="input-label">Mật khẩu *</label>
              <input v-model="form.password" type="password" class="form-input" placeholder="Tạo mật khẩu" required :disabled="loading" />
            </div>

            <button type="submit" class="login-btn" :disabled="!isFormValid || loading">
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? 'Đang đăng ký...' : 'Đăng ký' }}
            </button>

            <button type="button" class="google-btn" @click="handleGoogle" :disabled="loading">
              <img class="google-icon" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Đăng ký/Đăng nhập với Google
            </button>
          </form>

          <div class="form-footer">
            <p class="footer-text">
              Đã có tài khoản?
              <a href="#" class="link-primary" @click.prevent="goLogin">Đăng nhập</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { UserService } from '@/services/userService'

const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const isFormValid = computed(() =>
  form.firstName && form.lastName && form.email && form.password
)

const handleRegister = async () => {
  try {
    loading.value = true
    error.value = null
    const res = await UserService.register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password
    })
    if (res.success) {
      router.push('/login')
    } else {
      error.value = res.message || 'Đăng ký thất bại'
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Đăng ký thất bại'
  } finally {
    loading.value = false
  }
}

const goLogin = () => router.push('/login')

const handleGoogle = () => {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  const googlePath = import.meta.env.VITE_GOOGLE_OAUTH_PATH || '/auth/google'
  window.location.href = `${base}${googlePath}`
}
</script>

<style scoped>
/***** Reuse styles from LoginView *****/
.login-page { min-height: 100vh; position: relative; overflow: hidden; background: linear-gradient(135deg, var(--primary-color) 0%, var(--quaternary-color) 50%, var(--secondary-color) 100%); }
.background-overlay { position: absolute; inset: 0; z-index: 1; }
.electric-patterns { position: absolute; width: 100%; height: 100%; }
.pattern { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(74,151,130,.1) 0%, transparent 70%); animation: float 6s ease-in-out infinite; }
.pattern-1 { width: 300px; height: 300px; top: 10%; left: 10%; animation-delay: 0s; }
.pattern-2 { width: 200px; height: 200px; top: 60%; right: 15%; animation-delay: 2s; }
.pattern-3 { width: 150px; height: 150px; bottom: 20%; left: 60%; animation-delay: 4s; }
@keyframes float { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-20px) rotate(180deg)} }
.login-container { position: relative; z-index: 2; display: flex; min-height: 100vh; }
.login-brand { flex: 1; display: flex; align-items: center; justify-content: center; padding: 3rem; background: rgba(0,64,48,.8); backdrop-filter: blur(10px); }
.brand-content { max-width: 500px; text-align: center; }
.logo-section { margin-bottom: 3rem; }
.brand-logo { width: 80px; height: auto; margin-bottom: 1.5rem; filter: drop-shadow(0 4px 8px rgba(74,151,130,.3)); }
.brand-title { font-size: 2.5rem; font-weight: 700; color: var(--text-light); margin-bottom: 1rem; background: linear-gradient(135deg, var(--secondary-color) 0%, var(--tertiary-color) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.brand-subtitle { font-size: 1.2rem; color: var(--tertiary-color); line-height: 1.6; }
.features-list { display: grid; gap: 1.5rem; }
.feature-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(74,151,130,.1); border: 1px solid rgba(74,151,130,.2); border-radius: 12px; color: var(--text-light); transition: all .3s ease; }
.feature-item:hover { background: rgba(74,151,130,.2); transform: translateY(-2px); }
.feature-icon { font-size: 1.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--secondary-color), var(--tertiary-color)); border-radius: 8px; }
.login-form-section { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; background: rgba(255,255,255,.95); backdrop-filter: blur(10px); }
.form-container { width: 100%; max-width: 400px; }
.form-header { text-align: center; margin-bottom: 2rem; }
.form-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: .5rem; }
.form-subtitle { color: var(--text-secondary); font-size: 1rem; }
.error-alert { display: flex; align-items: center; gap: .75rem; padding: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 1.5rem; }
.error-icon { font-size: 1.25rem; }
.error-text { color: #dc2626; font-size: .875rem; }
.login-form { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem; }
.input-group { display: flex; flex-direction: column; gap: .5rem; }
.input-label { font-weight: 600; color: var(--text-primary); font-size: .875rem; }
.form-input { padding: .875rem 1rem; border: 2px solid var(--border-primary); border-radius: 8px; font-size: 1rem; transition: all .2s ease; background: var(--bg-input); }
.form-input:focus { outline: none; border-color: var(--secondary-color); box-shadow: 0 0 0 3px rgba(74,151,130,.1); }
.form-input:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }
.login-btn { width: 100%; padding: 1rem; background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%); color: var(--text-light); border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all .3s ease; display: flex; align-items: center; justify-content: center; gap: .5rem; }
.login-btn:hover:not(:disabled){ background: linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(74,151,130,.4)}
.login-btn:disabled { background: #9ca3af; cursor: not-allowed; }
.loading-spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid #fff; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }
.form-footer { text-align: center; display: flex; flex-direction: column; gap: .75rem; }
.footer-text { font-size: .875rem; color: #64748b; }
.link-primary { color: var(--secondary-color); text-decoration: none; font-weight: 600; }
.link-primary:hover { color: var(--primary-color); text-decoration: underline; }
.google-btn { width: 100%; margin-top: .5rem; padding: .9rem 1rem; background: #fff; color: #111827; border: 2px solid var(--border-primary); border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .5rem; }
.google-btn:hover { background: #f9fafb }
.google-icon { width: 18px; height: 18px }
@media (max-width: 768px) {
  .login-container { flex-direction: column; }
  .login-brand { padding: 2rem 1rem; min-height: 40vh; }
  .brand-title { font-size: 2rem; }
  .features-list { display: none; }
  .login-form-section { padding: 1rem; }
}
@media (max-width: 480px) {
  .login-brand { padding: 1.5rem 1rem; min-height: 30vh; }
  .brand-title, .form-title { font-size: 1.75rem; }
}
</style>


<template>
  <!-- Header từ Savart Homepage -->
  <header id="header" class="header transparent has-transparent has-sticky sticky-jump">
    <div class="header-wrapper">
      <div id="masthead" class="header-main nav-dark toggle-nav-dark">
        <div class="header-inner flex-row container logo-left medium-logo-left" role="navigation">

          <!-- Logo -->
          <div id="logo" class="flex-col logo">
            <router-link to="/" title="Savart EV" rel="home" class="logo-link">
              <img width="100" height="100" :src="logoImage" class="header_logo header-logo" alt="savart"/>
              <img width="100" height="100" :src="logoImageDark" class="header-logo-dark" alt="savart"/>
            </router-link>
          </div>

          <!-- Mobile Left Elements -->
          <div class="flex-col show-for-medium flex-left">
            <ul class="mobile-nav nav nav-left"></ul>
          </div>

          <!-- Left Elements - Empty space for logo centering -->
          <div class="flex-col hide-for-medium flex-left flex-grow">
          </div>

          <!-- Right Elements -->
          <div class="flex-col hide-for-medium flex-right">
            <ul class="header-nav header-nav-main nav nav-right nav-pills nav-uppercase">
              <li class="account-item" v-if="!isAuthenticated">
                <router-link to="/login" class="nav-top-link login-btn">
                  Đăng nhập
                </router-link>
              </li>
              <li class="account-item" v-if="!isAuthenticated">
                <button @click="handleRegister" class="nav-top-link register-btn">
                  Đăng ký
                </button>
              </li>
              <li class="account-item has-icon" v-if="isAuthenticated">
                <div class="user-menu">
                  <button @click="toggleUserMenu" class="nav-top-link is-small user-button">
                    <i class="icon-user"></i>
                    <span class="user-name">{{ userName }}</span>
                  </button>
                  <div v-if="showUserMenu" class="user-dropdown">
                    <router-link to="/profile" class="dropdown-item">Hồ sơ</router-link>
                    <router-link to="/original-home" class="dropdown-item">EV Service Hub</router-link>
                    <button @click="logout" class="dropdown-item logout-btn">Đăng xuất</button>
                  </div>
                </div>
              </li>
              <li class="html custom html_topbar_left">
                <div class="mobile-menu-toggle">
                  <button class="hamburger-btn" @click="toggleMobileMenu" :class="{ active: mobileMenuOpen }">
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Mobile Right Elements -->
          <div class="flex-col show-for-medium flex-right">
            <ul class="mobile-nav nav nav-right">
              <li class="account-item has-icon">
                <router-link to="/login" class="account-link-mobile is-small" title="My account">
                  <i class="icon-user"></i>
                </router-link>
              </li>
              <li class="cart-item has-icon">
                <a href="#cart" class="header-cart-link off-canvas-toggle nav-top-link is-small" title="Cart">
                  <i class="icon-shopping-cart" data-icon-label="0"></i>
                </a>
              </li>
              <li class="nav-icon has-icon">
                <a href="#" class="is-small" aria-label="Menu" @click.prevent="toggleMobileMenu">
                  <i class="icon-menu"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div class="container">
          <div class="top-divider full-width"></div>
        </div>
      </div>

      <!-- Mobile Menu Overlay -->
      <div v-if="mobileMenuOpen" class="mobile-menu-overlay" @click="toggleMobileMenu">
        <div class="mobile-menu" @click.stop>
          <div class="mobile-menu-header">
            <h3>Menu</h3>
            <button @click="toggleMobileMenu" class="close-btn">×</button>
          </div>
          <nav class="mobile-nav-menu">
            <router-link to="/" class="mobile-nav-item" @click="toggleMobileMenu">
              <i class="icon-home"></i> Trang chủ
            </router-link>

            <!-- Customer Features -->
            <div class="mobile-nav-section">
              <div class="mobile-nav-section-title">Dịch vụ khách hàng</div>
              <router-link to="/booking" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-calendar"></i> Đặt lịch bảo dưỡng
              </router-link>
              <router-link to="/my-vehicles" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-car"></i> Xe của tôi
              </router-link>
              <router-link to="/maintenance-history" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-history"></i> Lịch sử bảo dưỡng
              </router-link>
              <router-link to="/dashboard" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-dashboard"></i> Dashboard
              </router-link>
            </div>

            <!-- Staff Features -->
            <div class="mobile-nav-section">
              <div class="mobile-nav-section-title">Quản lý dịch vụ</div>
              <router-link to="/customers" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-users"></i> Quản lý khách hàng
              </router-link>
              <router-link to="/appointments" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-calendar-alt"></i> Lịch hẹn
              </router-link>
              <router-link to="/service-orders" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-tasks"></i> Đơn dịch vụ
              </router-link>
            </div>

            <!-- Technician Features -->
            <div class="mobile-nav-section">
              <div class="mobile-nav-section-title">Kỹ thuật viên</div>
              <router-link to="/work-queue" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-wrench"></i> Hàng đợi công việc
              </router-link>
              <router-link to="/checklists" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-check-square"></i> Checklist EV
              </router-link>
              <router-link to="/parts-request" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-cog"></i> Yêu cầu phụ tùng
              </router-link>
            </div>

            <!-- Admin Features -->
            <div class="mobile-nav-section">
              <div class="mobile-nav-section-title">Quản trị hệ thống</div>
              <router-link to="/users" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-users"></i> Quản lý người dùng
              </router-link>
              <router-link to="/parts-management" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-box"></i> Quản lý phụ tùng
              </router-link>
              <router-link to="/reports" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-chart-bar"></i> Báo cáo
              </router-link>
              <router-link to="/staff-management" class="mobile-nav-item" @click="toggleMobileMenu">
                <i class="icon-user-tie"></i> Quản lý nhân sự
              </router-link>
            </div>



            <!-- Profile -->
            <router-link v-if="isAuthenticated" to="/profile" class="mobile-nav-item" @click="toggleMobileMenu">
              <i class="icon-user"></i> Hồ sơ cá nhân
            </router-link>

            <div v-if="!isAuthenticated" class="mobile-auth-buttons">
              <router-link to="/login" class="mobile-login-btn" @click="toggleMobileMenu">Login</router-link>
              <button @click="handleRegister(); toggleMobileMenu()" class="mobile-register-btn">Register</button>
            </div>

            <div v-if="isAuthenticated" class="mobile-user-section">
              <div class="mobile-user-info">
                <span class="mobile-user-name">{{ userName }}</span>
                <span class="mobile-user-role">{{ userRole }}</span>
              </div>
              <button @click="logout(); toggleMobileMenu()" class="mobile-logout-btn">Đăng xuất</button>
            </div>
          </nav>
        </div>
      </div>

      <div class="header-bg-container fill">
        <div class="header-bg-image fill"></div>
        <div class="header-bg-color fill"></div>
      </div>
    </div>
  </header>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import logoImage from '@/assets/images/EVN-Tragop-0D.jpg'
import logoImageDark from '@/assets/images/photo-1-1638274363739461323011-1638276946612-1638276947297252976460.webp'

export default {
  name: 'AppHeader',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const showUserMenu = ref(false)
    const dropdownOpen = ref(false)
    const mobileMenuOpen = ref(false)

    const isAuthenticated = computed(() => authStore.isAuthenticated)
    const userName = computed(() => authStore.user?.name || 'User')
    const userRole = computed(() => authStore.user?.role || 'Customer')

    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
    }

    const toggleDropdown = () => {
      dropdownOpen.value = !dropdownOpen.value
    }

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }

    const logout = () => {
      authStore.logout()
      showUserMenu.value = false
    }

    const handleRegister = () => {
      // For now, redirect to login page - you can create a separate register page later
      router.push('/login')
    }

    return {
      isAuthenticated,
      userName,
      userRole,
      showUserMenu,
      dropdownOpen,
      mobileMenuOpen,
      toggleUserMenu,
      toggleDropdown,
      toggleMobileMenu,
      logout,
      handleRegister,
      logoImage,
      logoImageDark
    }
  }
}
</script>

<style scoped>
/* Enhanced Header Styles */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-bottom: 1px solid var(--border-dark);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px var(--shadow-medium);
}

.header.stuck {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px var(--shadow-dark);
  border-bottom: 1px solid var(--border-dark);
}

.header-wrapper {
  width: 100%;
}

.header-main {
  padding: 0;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 20px;
  padding-right: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.flex-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.logo {
  margin-right: 2rem;
  transition: all 0.3s ease;
}

.logo-link {
  display: block;
  transition: transform 0.3s ease;
}

.logo-link:hover {
  transform: scale(1.05);
}

.header_logo, .header-logo-dark {
  max-height: 50px;
  width: auto;
  transition: all 0.3s ease;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header_logo {
  display: block;
}

.header-logo-dark {
  display: none;
}

.header.stuck .header_logo {
  display: none;
}

.header.stuck .header-logo-dark {
  display: block;
}

.flex-left {
  margin-right: auto;
}

.flex-right {
  margin-left: auto;
}

.hide-for-medium {
  display: flex;
}

.show-for-medium {
  display: none;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
}

.header-logo .logo-link {
  text-decoration: none;
}

.logo-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-text-wrapper {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-500);
  margin: 0;
  line-height: 1.2;
}

.logo-tagline {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 500;
  margin-top: -2px;
}

.header-nav {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.menu-item {
  position: relative;
}

.nav-top-link {
  color: var(--text-light);
  text-decoration: none;
  font-weight: 500;
  padding: 10px 0;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.nav-top-link:hover {
  color: var(--tertiary-color);
}

.sub-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 20px;
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.sub-menu.active {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.tech-link {
  margin-bottom: 10px;
}

.tech-link a {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.tech-link a:hover {
  color: #007bff;
}

.user-menu {
  position: relative;
}

.user-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 0;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-card);
  box-shadow: 0 5px 20px var(--shadow-light);
  border-radius: 8px;
  padding: 10px 0;
  min-width: 150px;
  z-index: 1001;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 20px;
  color: var(--text-primary);
  text-decoration: none;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.dropdown-item:hover {
  background-color: rgba(74, 151, 130, 0.1);
  color: var(--secondary-color);
}

.logout-btn {
  color: #dc3545;
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: flex;
  align-items: center;
}

.hamburger-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.3s ease;
}

.hamburger-line {
  width: 25px;
  height: 3px;
  background-color: var(--text-light);
  transition: all 0.3s ease;
  border-radius: 2px;
}

.hamburger-btn.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.hamburger-btn.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.hamburger-btn.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

@media (max-width: 768px) {
  .hide-for-medium {
    display: none;
  }

  .show-for-medium {
    display: flex;
  }

  .header-inner {
    padding-left: 15px;
    padding-right: 15px;
  }

  .container {
    padding: 0 15px;
  }
}

/* Login/Register Button Styles */
.login-btn {
  background-color: transparent;
  border: 1px solid var(--tertiary-color);
  color: var(--tertiary-color);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  margin-right: 0.5rem;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background-color: var(--tertiary-color);
  color: var(--primary-color);
}

.register-btn {
  background-color: var(--tertiary-color);
  border: 1px solid var(--tertiary-color);
  color: var(--primary-color);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.register-btn:hover {
  background-color: var(--bg-card);
  border-color: var(--tertiary-color);
  color: #333;
}
/* Mobile Menu Styles */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
}

.mobile-menu {
  background: var(--bg-card);
  width: 300px;
  height: 100vh;
  box-shadow: -2px 0 10px var(--shadow-light);
  overflow-y: auto;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.mobile-menu-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-nav-menu {
  padding: 1rem 0;
}

.mobile-nav-item {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border-bottom: 1px solid var(--border-light);
  transition: background-color 0.3s ease;
}

.mobile-nav-item:hover {
  background-color: rgba(74, 151, 130, 0.1);
  color: var(--secondary-color);
}

.mobile-nav-item.router-link-active {
  background-color: var(--secondary-color);
  color: var(--text-light);
}

.mobile-auth-buttons {
  padding: 1rem;
  border-top: 1px solid #eee;
}

.mobile-login-btn {
  display: block;
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: transparent;
  border: 1px solid var(--secondary-color);
  color: var(--secondary-color);
  text-align: center;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.mobile-login-btn:hover {
  background-color: var(--secondary-color);
  color: var(--text-light);
}

.mobile-register-btn {
  display: block;
  width: 100%;
  padding: 0.75rem;
  background-color: var(--secondary-color);
  border: 1px solid var(--secondary-color);
  color: var(--text-light);
  text-align: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-register-btn:hover {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.mobile-user-section {
  padding: 1rem;
  border-top: 1px solid #eee;
}

.mobile-user-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.mobile-user-name {
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.mobile-user-role {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.mobile-logout-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #dc3545;
  border: 1px solid #dc3545;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-logout-btn:hover {
  background-color: #c82333;
  border-color: #c82333;
}

/* Mobile Navigation Sections */
.mobile-nav-section {
  margin: 1rem 0;
}

.mobile-nav-section-title {
  padding: 0.5rem 1rem;
  font-weight: bold;
  font-size: 0.875rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.mobile-nav-item i {
  width: 20px;
  margin-right: 0.5rem;
  text-align: center;
  color: #666;
}

.mobile-nav-item.router-link-active i {
  color: white;
}

/* Show hamburger menu on all screen sizes */
@media (min-width: 769px) {
  .hide-for-medium {
    display: flex !important;
  }

  /* Hide the left navigation menu on desktop */
  .desktop-nav-hidden {
    display: none !important;
  }
}
</style>

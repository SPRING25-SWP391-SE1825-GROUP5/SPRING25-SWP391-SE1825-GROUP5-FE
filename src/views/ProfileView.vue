<template>
  <div class="profile">
    <div class="profile-header">
      <h1>Profile</h1>
      <p>Manage your account information</p>
    </div>

    <div class="profile-content">
      <div class="profile-card">
        <h2>Personal Information</h2>
        
        <form @submit.prevent="handleUpdateProfile" class="profile-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                v-model="form.firstName"
                type="text"
                required
                :disabled="loading"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                v-model="form.lastName"
                type="text"
                required
                :disabled="loading"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              :disabled="loading"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <input
              id="role"
              :value="authStore.userRole"
              type="text"
              disabled
              class="form-input"
            />
          </div>

          <div class="error-message" v-if="error">
            {{ error }}
          </div>

          <div class="success-message" v-if="success">
            Profile updated successfully!
          </div>

          <div class="form-actions">
            <button
              type="submit"
              :disabled="loading"
              class="btn btn-primary"
            >
              {{ loading ? 'Updating...' : 'Update Profile' }}
            </button>
            
            <button
              type="button"
              @click="resetForm"
              :disabled="loading"
              class="btn btn-secondary"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div class="password-card">
        <h2>Change Password</h2>
        
        <form @submit.prevent="handleChangePassword" class="password-form">
          <div class="form-group">
            <label for="oldPassword">Current Password</label>
            <input
              id="oldPassword"
              v-model="passwordForm.oldPassword"
              type="password"
              required
              :disabled="passwordLoading"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              required
              :disabled="passwordLoading"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              :disabled="passwordLoading"
              class="form-input"
            />
          </div>

          <div class="error-message" v-if="passwordError">
            {{ passwordError }}
          </div>

          <div class="success-message" v-if="passwordSuccess">
            Password changed successfully!
          </div>

          <button
            type="submit"
            :disabled="passwordLoading"
            class="btn btn-primary"
          >
            {{ passwordLoading ? 'Changing...' : 'Change Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { UserService } from '../services/userService'

const authStore = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const passwordLoading = ref(false)
const passwordError = ref<string | null>(null)
const passwordSuccess = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handleUpdateProfile = async () => {
  try {
    loading.value = true
    error.value = null
    success.value = false

    const success = await authStore.updateProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email
    })

    if (success) {
      success.value = true
      setTimeout(() => {
        success.value = false
      }, 3000)
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to update profile'
  } finally {
    loading.value = false
  }
}

const handleChangePassword = async () => {
  try {
    passwordLoading.value = true
    passwordError.value = null
    passwordSuccess.value = false

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      passwordError.value = 'New passwords do not match'
      return
    }

    if (passwordForm.newPassword.length < 6) {
      passwordError.value = 'Password must be at least 6 characters long'
      return
    }

    await UserService.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    
    passwordSuccess.value = true
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    setTimeout(() => {
      passwordSuccess.value = false
    }, 3000)
  } catch (err: any) {
    passwordError.value = err.response?.data?.message || err.message || 'Failed to change password'
  } finally {
    passwordLoading.value = false
  }
}

const resetForm = () => {
  if (authStore.user) {
    form.firstName = authStore.user.firstName
    form.lastName = authStore.user.lastName
    form.email = authStore.user.email
  }
  error.value = null
  success.value = false
}

onMounted(() => {
  resetForm()
})
</script>

<style scoped>
.profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-header {
  margin-bottom: 2rem;
}

.profile-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.profile-header p {
  color: #7f8c8d;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-card, .password-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-card h2, .password-card h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.profile-form, .password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.form-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  padding: 0.5rem;
  background-color: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
}

.success-message {
  color: #27ae60;
  font-size: 0.875rem;
  padding: 0.5rem;
  background-color: #f0f9f0;
  border: 1px solid #c3e6c3;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>

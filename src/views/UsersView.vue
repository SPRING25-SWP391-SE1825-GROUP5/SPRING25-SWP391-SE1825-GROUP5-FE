<template>
  <div class="users">
    <div class="users-header">
      <h1>Quản lý người dùng</h1>
      <p>Quản lý người dùng hệ thống và quyền</p>
    </div>

    <div class="users-actions">
      <button @click="loadUsers" :disabled="loading" class="btn btn-primary">
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <div class="users-content">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="loading" class="loading-spinner">
        Loading users...
      </div>

      <div v-else-if="users.length > 0" class="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.firstName }} {{ user.lastName }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="`role-${user.role.toLowerCase()}`">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="{ 'status-active': user.isActive }">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="editUser(user)" class="btn btn-sm btn-secondary">
                    Edit
                  </button>
                  <button @click="deleteUser(user.id)" class="btn btn-sm btn-danger">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="no-users">
        <p>Không tìm thấy người dùng</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UserService } from '../services/userService'
import type { User } from '../types/api'

const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const loadUsers = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await UserService.getUsers()
    
    if (response.success && response.data) {
      users.value = response.data.data || []
    } else {
      error.value = response.message || 'Failed to load users'
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

const editUser = (user: User) => {
  // TODO: Implement edit user functionality
  console.log('Edit user:', user)
}

const deleteUser = async (userId: string) => {
  if (!confirm('Are you sure you want to delete this user?')) {
    return
  }

  try {
    await UserService.deleteUser(userId)
    await loadUsers() // Reload users after deletion
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to delete user'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.users-header {
  margin-bottom: 2rem;
}

.users-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.users-header p {
  color: #7f8c8d;
}

.users-actions {
  margin-bottom: 2rem;
}

.error-message {
  color: #e74c3c;
  background-color: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.loading-spinner {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.users-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.role-admin {
  background-color: #e74c3c;
  color: white;
}

.role-user {
  background-color: #3498db;
  color: white;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #95a5a6;
  color: white;
}

.status-active {
  background-color: #27ae60;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
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

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-users {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .users-table {
    overflow-x: auto;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>

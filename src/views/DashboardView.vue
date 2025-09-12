<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome back, {{ authStore.userName }}!</p>
    </div>

    <div class="dashboard-content">
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Users</h3>
          <p class="stat-number">{{ stats.totalUsers }}</p>
        </div>
        
        <div class="stat-card">
          <h3>Active Sessions</h3>
          <p class="stat-number">{{ stats.activeSessions }}</p>
        </div>
        
        <div class="stat-card">
          <h3>API Calls Today</h3>
          <p class="stat-number">{{ stats.apiCalls }}</p>
        </div>
        
        <div class="stat-card">
          <h3>System Status</h3>
          <p class="stat-status" :class="{ 'status-online': stats.systemOnline }">
            {{ stats.systemOnline ? 'Online' : 'Offline' }}
          </p>
        </div>
      </div>

      <div class="dashboard-actions">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <router-link to="/users" class="btn btn-primary" v-if="authStore.userRole === 'Admin'">
            Manage Users
          </router-link>
          <router-link to="/profile" class="btn btn-secondary">
            Edit Profile
          </router-link>
          <button @click="refreshData" class="btn btn-outline" :disabled="loading">
            {{ loading ? 'Refreshing...' : 'Refresh Data' }}
          </button>
        </div>
      </div>

      <div class="recent-activity">
        <h2>Recent Activity</h2>
        <div class="activity-list" v-if="activities.length > 0">
          <div v-for="activity in activities" :key="activity.id" class="activity-item">
            <div class="activity-icon">📊</div>
            <div class="activity-content">
              <p class="activity-title">{{ activity.title }}</p>
              <p class="activity-time">{{ formatDate(activity.timestamp) }}</p>
            </div>
          </div>
        </div>
        <p v-else class="no-activity">No recent activity</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const loading = ref(false)

const stats = reactive({
  totalUsers: 0,
  activeSessions: 0,
  apiCalls: 0,
  systemOnline: true
})

const activities = ref([
  {
    id: 1,
    title: 'User logged in',
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Profile updated',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
])

const refreshData = async () => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update stats with mock data
    stats.totalUsers = Math.floor(Math.random() * 1000) + 100
    stats.activeSessions = Math.floor(Math.random() * 50) + 10
    stats.apiCalls = Math.floor(Math.random() * 10000) + 1000
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.stat-status {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
}

.status-online {
  color: #27ae60;
}

.dashboard-actions {
  margin-bottom: 2rem;
}

.dashboard-actions h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  border: none;
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

.btn-outline {
  background-color: transparent;
  color: #3498db;
  border: 1px solid #3498db;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.recent-activity h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.activity-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #ecf0f1;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.activity-content {
  flex: 1;
}

.activity-title {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.activity-time {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.875rem;
}

.no-activity {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>

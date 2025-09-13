<template>
  <div class="my-vehicles">
    <div class="container">
      <div class="page-header">
        <h1>Xe của tôi</h1>
        <p>Quản lý thông tin và theo dõi tình trạng xe điện của bạn</p>
        <BaseButton @click="showAddVehicle = true" class="add-vehicle-btn">
          <i class="icon-plus"></i>
          Thêm xe mới
        </BaseButton>
      </div>

      <div class="vehicles-grid">
        <div v-for="vehicle in vehicles" :key="vehicle.id" class="vehicle-card">
          <div class="vehicle-header">
            <div class="vehicle-image">
              <img :src="vehicle.image || '/default-ev.jpg'" :alt="vehicle.model" />
            </div>
            <div class="vehicle-info">
              <h3>{{ vehicle.model }}</h3>
              <p class="license-plate">{{ vehicle.licensePlate }}</p>
              <p class="vin">VIN: {{ vehicle.vin }}</p>
            </div>
            <div class="vehicle-status">
              <span class="status-badge" :class="`status-${vehicle.maintenanceStatus}`">
                {{ getStatusText(vehicle.maintenanceStatus) }}
              </span>
            </div>
          </div>

          <div class="vehicle-details">
            <div class="detail-row">
              <span class="label">Năm sản xuất:</span>
              <span class="value">{{ vehicle.year }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Km hiện tại:</span>
              <span class="value">{{ formatNumber(vehicle.currentKm) }} km</span>
            </div>
            <div class="detail-row">
              <span class="label">Bảo dưỡng cuối:</span>
              <span class="value">{{ formatDate(vehicle.lastMaintenanceDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Km bảo dưỡng tiếp theo:</span>
              <span class="value">{{ formatNumber(vehicle.nextMaintenanceKm) }} km</span>
            </div>
          </div>

          <div class="vehicle-actions">
            <BaseButton @click="viewHistory(vehicle.id)" variant="outline" size="sm">
              Lịch sử
            </BaseButton>
            <BaseButton @click="bookMaintenance(vehicle.id)" size="sm">
              Đặt lịch
            </BaseButton>
            <BaseButton @click="editVehicle(vehicle)" variant="secondary" size="sm">
              Chỉnh sửa
            </BaseButton>
          </div>

          <!-- Maintenance Alerts -->
          <div v-if="vehicle.alerts && vehicle.alerts.length > 0" class="maintenance-alerts">
            <h4>Thông báo bảo dưỡng</h4>
            <div v-for="alert in vehicle.alerts" :key="alert.id" class="alert-item" :class="`alert-${alert.type}`">
              <i :class="getAlertIcon(alert.type)"></i>
              <span>{{ alert.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Vehicle Modal -->
      <div v-if="showAddVehicle" class="modal-overlay" @click="showAddVehicle = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Thêm xe mới</h2>
            <button @click="showAddVehicle = false" class="close-btn">&times;</button>
          </div>
          <form @submit.prevent="addVehicle" class="vehicle-form">
            <div class="form-group">
              <label>Hãng xe</label>
              <select v-model="newVehicle.brand" required>
                <option value="">Chọn hãng xe</option>
                <option value="Tesla">Tesla</option>
                <option value="VinFast">VinFast</option>
                <option value="BMW">BMW</option>
                <option value="Mercedes">Mercedes</option>
                <option value="Audi">Audi</option>
              </select>
            </div>
            <div class="form-group">
              <label>Model</label>
              <BaseInput v-model="newVehicle.model" placeholder="Ví dụ: Model 3, VF8" required />
            </div>
            <div class="form-group">
              <label>Năm sản xuất</label>
              <BaseInput v-model="newVehicle.year" type="number" :min="2010" :max="2024" required />
            </div>
            <div class="form-group">
              <label>Biển số xe</label>
              <BaseInput v-model="newVehicle.licensePlate" placeholder="30A-123.45" required />
            </div>
            <div class="form-group">
              <label>VIN</label>
              <BaseInput v-model="newVehicle.vin" placeholder="17 ký tự VIN" maxlength="17" required />
            </div>
            <div class="form-group">
              <label>Km hiện tại</label>
              <BaseInput v-model="newVehicle.currentKm" type="number" min="0" required />
            </div>
            <div class="form-actions">
              <BaseButton type="button" @click="showAddVehicle = false" variant="secondary">
                Hủy
              </BaseButton>
              <BaseButton type="submit" :loading="isSubmitting">
                Thêm xe
              </BaseButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, BaseInput } from '@/components/common'

const router = useRouter()

const vehicles = ref([
  {
    id: 1,
    brand: 'Tesla',
    model: 'Model 3',
    year: 2023,
    licensePlate: '30A-123.45',
    vin: 'WVWZZZ1JZ3W386752',
    currentKm: 15000,
    nextMaintenanceKm: 20000,
    lastMaintenanceDate: '2024-01-15',
    maintenanceStatus: 'normal',
    image: '/tesla-model3.jpg',
    alerts: [
      {
        id: 1,
        type: 'info',
        message: 'Bảo dưỡng định kỳ sắp đến hạn (còn 5000km)'
      }
    ]
  },
  {
    id: 2,
    brand: 'VinFast',
    model: 'VF8',
    year: 2024,
    licensePlate: '29A-678.90',
    vin: 'WVWZZZ1JZ3W386753',
    currentKm: 8500,
    nextMaintenanceKm: 10000,
    lastMaintenanceDate: '2024-02-20',
    maintenanceStatus: 'due_soon',
    image: '/vinfast-vf8.jpg',
    alerts: [
      {
        id: 2,
        type: 'warning',
        message: 'Sắp đến hạn bảo dưỡng 10,000km'
      }
    ]
  }
])

const showAddVehicle = ref(false)
const isSubmitting = ref(false)
const newVehicle = ref({
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  licensePlate: '',
  vin: '',
  currentKm: 0
})

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    normal: 'Bình thường',
    due_soon: 'Sắp bảo dưỡng',
    overdue: 'Quá hạn',
    in_service: 'Đang bảo dưỡng'
  }
  return statusMap[status] || status
}

const getAlertIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    info: 'icon-info',
    warning: 'icon-warning',
    error: 'icon-error'
  }
  return iconMap[type] || 'icon-info'
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const viewHistory = (vehicleId: number) => {
  router.push(`/maintenance-history?vehicle=${vehicleId}`)
}

const bookMaintenance = (vehicleId: number) => {
  router.push(`/booking?vehicle=${vehicleId}`)
}

const editVehicle = (vehicle: any) => {
  // Open edit modal or navigate to edit page
  console.log('Edit vehicle:', vehicle)
}

const addVehicle = async () => {
  isSubmitting.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add to vehicles list (in real app, this would come from API response)
    const newId = Math.max(...vehicles.value.map(v => v.id)) + 1
    vehicles.value.push({
      ...newVehicle.value,
      id: newId,
      nextMaintenanceKm: newVehicle.value.currentKm + 10000,
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      maintenanceStatus: 'normal',
      alerts: []
    })
    
    // Reset form
    newVehicle.value = {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      vin: '',
      currentKm: 0
    }
    
    showAddVehicle.value = false
  } catch (error) {
    console.error('Failed to add vehicle:', error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // Load user vehicles from API
})
</script>

<style scoped>
.my-vehicles {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.page-header p {
  color: var(--text-secondary);
  margin: 0;
}

.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
}

.vehicle-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
}

.vehicle-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.vehicle-image {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.vehicle-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vehicle-info h3 {
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
}

.license-plate {
  font-weight: 600;
  color: var(--primary-600);
  margin: 0 0 0.25rem 0;
}

.vin {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-normal {
  background: var(--success-100);
  color: var(--success-700);
}

.status-due_soon {
  background: var(--warning-100);
  color: var(--warning-700);
}

.status-overdue {
  background: var(--error-100);
  color: var(--error-700);
}

.vehicle-details {
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-secondary);
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  color: var(--text-secondary);
}

.value {
  font-weight: 500;
  color: var(--text-primary);
}

.vehicle-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.maintenance-alerts {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.maintenance-alerts h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.alert-info {
  background: var(--info-50);
  color: var(--info-700);
}

.alert-warning {
  background: var(--warning-50);
  color: var(--warning-700);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.vehicle-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  background: var(--bg-card);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .vehicles-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .vehicle-actions {
    justify-content: center;
  }
}
</style>

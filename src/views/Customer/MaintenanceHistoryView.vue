<template>
  <div class="maintenance-history">
    <div class="container">
      <div class="page-header">
        <h1>Lịch sử bảo dưỡng</h1>
        <p>Theo dõi toàn bộ lịch sử dịch vụ và chi phí bảo dưỡng xe điện</p>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Chọn xe:</label>
          <select v-model="selectedVehicle" @change="loadHistory">
            <option value="">Tất cả xe</option>
            <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
              {{ vehicle.model }} - {{ vehicle.licensePlate }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Từ ngày:</label>
          <BaseInput v-model="dateFrom" type="date" @change="loadHistory" />
        </div>
        <div class="filter-group">
          <label>Đến ngày:</label>
          <BaseInput v-model="dateTo" type="date" @change="loadHistory" />
        </div>
        <div class="filter-group">
          <label>Loại dịch vụ:</label>
          <select v-model="selectedServiceType" @change="loadHistory">
            <option value="">Tất cả</option>
            <option value="maintenance">Bảo dưỡng định kỳ</option>
            <option value="repair">Sửa chữa</option>
            <option value="inspection">Kiểm tra</option>
          </select>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-value">{{ maintenanceRecords.length }}</div>
          <div class="stat-label">Lần bảo dưỡng</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatCurrency(totalSpent) }}</div>
          <div class="stat-label">Tổng chi phí</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatCurrency(averageCost) }}</div>
          <div class="stat-label">Chi phí trung bình</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ lastServiceDays }}</div>
          <div class="stat-label">Ngày từ lần cuối</div>
        </div>
      </div>

      <!-- Maintenance Records -->
      <div class="records-section">
        <div class="section-header">
          <h2>Lịch sử dịch vụ</h2>
          <BaseButton @click="exportHistory" variant="outline" size="sm">
            <i class="icon-download"></i>
            Xuất PDF
          </BaseButton>
        </div>

        <div v-if="loading" class="loading-state">
          <p>Đang tải dữ liệu...</p>
        </div>

        <div v-else-if="filteredRecords.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>Chưa có lịch sử bảo dưỡng</h3>
          <p>Bạn chưa có lịch sử dịch vụ nào với bộ lọc hiện tại</p>
          <BaseButton @click="$router.push('/booking')">
            Đặt lịch bảo dưỡng
          </BaseButton>
        </div>

        <div v-else class="records-timeline">
          <div v-for="record in filteredRecords" :key="record.id" class="record-item">
            <div class="record-date">
              <div class="date-circle" :class="`status-${record.status}`">
                <span class="day">{{ getDay(record.serviceDate) }}</span>
                <span class="month">{{ getMonth(record.serviceDate) }}</span>
              </div>
            </div>
            
            <div class="record-content">
              <div class="record-header">
                <div class="record-info">
                  <h3>{{ record.serviceName }}</h3>
                  <div class="record-meta">
                    <span class="vehicle-info">
                      <i class="icon-car"></i>
                      {{ getVehicleInfo(record.vehicleId) }}
                    </span>
                    <span class="service-center">
                      <i class="icon-location"></i>
                      {{ record.serviceCenterName }}
                    </span>
                    <span class="mileage">
                      <i class="icon-gauge"></i>
                      {{ formatNumber(record.mileageAtService) }} km
                    </span>
                  </div>
                </div>
                <div class="record-status">
                  <span class="status-badge" :class="`status-${record.status}`">
                    {{ getStatusText(record.status) }}
                  </span>
                  <div class="record-cost">{{ formatCurrency(record.totalCost) }}</div>
                </div>
              </div>

              <div class="record-details">
                <div class="services-performed">
                  <h4>Dịch vụ đã thực hiện:</h4>
                  <ul>
                    <li v-for="service in record.servicesPerformed" :key="service.id">
                      {{ service.name }} - {{ formatCurrency(service.cost) }}
                    </li>
                  </ul>
                </div>

                <div v-if="record.partsReplaced && record.partsReplaced.length > 0" class="parts-replaced">
                  <h4>Phụ tùng thay thế:</h4>
                  <ul>
                    <li v-for="part in record.partsReplaced" :key="part.id">
                      {{ part.name }} ({{ part.quantity }}x) - {{ formatCurrency(part.cost) }}
                    </li>
                  </ul>
                </div>

                <div v-if="record.technicianNotes" class="technician-notes">
                  <h4>Ghi chú kỹ thuật:</h4>
                  <p>{{ record.technicianNotes }}</p>
                </div>

                <div v-if="record.nextMaintenanceKm" class="next-maintenance">
                  <div class="next-maintenance-info">
                    <i class="icon-calendar"></i>
                    <span>Bảo dưỡng tiếp theo: {{ formatNumber(record.nextMaintenanceKm) }} km</span>
                  </div>
                </div>
              </div>

              <div class="record-actions">
                <BaseButton @click="viewInvoice(record.id)" variant="outline" size="sm">
                  <i class="icon-file"></i>
                  Xem hóa đơn
                </BaseButton>
                <BaseButton v-if="record.status === 'completed'" @click="bookSimilarService(record)" variant="outline" size="sm">
                  <i class="icon-repeat"></i>
                  Đặt lại dịch vụ
                </BaseButton>
                <BaseButton v-if="canRate(record)" @click="rateService(record)" size="sm">
                  <i class="icon-star"></i>
                  Đánh giá
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, BaseInput } from '@/components/common'

const router = useRouter()

// Reactive data
const loading = ref(false)
const selectedVehicle = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const selectedServiceType = ref('')

const vehicles = ref([
  {
    id: 1,
    model: 'Tesla Model 3',
    licensePlate: '30A-123.45'
  },
  {
    id: 2,
    model: 'VinFast VF8',
    licensePlate: '29A-678.90'
  }
])

const maintenanceRecords = ref([
  {
    id: 1,
    vehicleId: 1,
    serviceDate: '2024-01-15',
    serviceName: 'Bảo dưỡng định kỳ 15,000km',
    serviceCenterName: 'EV Service Hà Nội',
    status: 'completed',
    mileageAtService: 15000,
    totalCost: 2500000,
    nextMaintenanceKm: 25000,
    servicesPerformed: [
      { id: 1, name: 'Kiểm tra hệ thống điện', cost: 800000 },
      { id: 2, name: 'Thay dầu phanh', cost: 600000 },
      { id: 3, name: 'Kiểm tra pin', cost: 1100000 }
    ],
    partsReplaced: [
      { id: 1, name: 'Lọc gió cabin', quantity: 1, cost: 350000 }
    ],
    technicianNotes: 'Xe trong tình trạng tốt. Pin hoạt động bình thường.',
    rating: null
  },
  {
    id: 2,
    vehicleId: 2,
    serviceDate: '2024-02-20',
    serviceName: 'Kiểm tra hệ thống sạc',
    serviceCenterName: 'EV Service TP.HCM',
    status: 'completed',
    mileageAtService: 8500,
    totalCost: 1200000,
    servicesPerformed: [
      { id: 4, name: 'Chẩn đoán hệ thống sạc', cost: 500000 },
      { id: 5, name: 'Cập nhật phần mềm', cost: 700000 }
    ],
    technicianNotes: 'Đã khắc phục lỗi sạc chậm.',
    rating: 5
  }
])

// Computed properties
const filteredRecords = computed(() => {
  let filtered = [...maintenanceRecords.value]
  
  if (selectedVehicle.value) {
    filtered = filtered.filter(r => r.vehicleId == selectedVehicle.value)
  }
  
  if (dateFrom.value) {
    filtered = filtered.filter(r => r.serviceDate >= dateFrom.value)
  }
  
  if (dateTo.value) {
    filtered = filtered.filter(r => r.serviceDate <= dateTo.value)
  }
  
  return filtered.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
})

const totalSpent = computed(() => {
  return filteredRecords.value.reduce((sum, record) => sum + record.totalCost, 0)
})

const averageCost = computed(() => {
  return filteredRecords.value.length > 0 ? totalSpent.value / filteredRecords.value.length : 0
})

const lastServiceDays = computed(() => {
  if (filteredRecords.value.length === 0) return 0
  const lastService = filteredRecords.value[0]
  const daysDiff = Math.floor((Date.now() - new Date(lastService.serviceDate).getTime()) / (1000 * 60 * 60 * 24))
  return daysDiff
})

// Methods
const loadHistory = () => {
  loading.value = true
  // Simulate API call
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const getVehicleInfo = (vehicleId: number) => {
  const vehicle = vehicles.value.find(v => v.id === vehicleId)
  return vehicle ? `${vehicle.model} - ${vehicle.licensePlate}` : 'N/A'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    completed: 'Hoàn thành',
    in_progress: 'Đang thực hiện',
    cancelled: 'Đã hủy'
  }
  return statusMap[status] || status
}

const getDay = (dateString: string) => {
  return new Date(dateString).getDate().toString().padStart(2, '0')
}

const getMonth = (dateString: string) => {
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
  return months[new Date(dateString).getMonth()]
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const viewInvoice = (recordId: number) => {
  // Open invoice in new tab or modal
  console.log('View invoice for record:', recordId)
}

const bookSimilarService = (record: any) => {
  router.push(`/booking?template=${record.id}`)
}

const canRate = (record: any) => {
  return record.status === 'completed' && !record.rating
}

const rateService = (record: any) => {
  // Open rating modal
  console.log('Rate service:', record)
}

const exportHistory = () => {
  // Export to PDF
  console.log('Export history to PDF')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.maintenance-history {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.filters-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-primary);
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.filter-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-card);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-card);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--border-primary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-600);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.records-timeline {
  position: relative;
}

.record-item {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
}

.record-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 30px;
  top: 70px;
  bottom: -2rem;
  width: 2px;
  background: var(--border-secondary);
}

.record-date {
  flex-shrink: 0;
}

.date-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 3px solid var(--success-500);
  font-weight: 600;
}

.date-circle.status-completed {
  border-color: var(--success-500);
  background: var(--success-50);
}

.date-circle.status-in_progress {
  border-color: var(--warning-500);
  background: var(--warning-50);
}

.day {
  font-size: 1.125rem;
  line-height: 1;
}

.month {
  font-size: 0.75rem;
  line-height: 1;
}

.record-content {
  flex: 1;
  background: var(--bg-card);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-primary);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.record-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.record-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.record-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.record-status {
  text-align: right;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: inline-block;
}

.status-completed {
  background: var(--success-100);
  color: var(--success-700);
}

.record-cost {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-600);
}

.record-details {
  margin-bottom: 1rem;
}

.record-details h4 {
  margin: 1rem 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.record-details ul {
  margin: 0;
  padding-left: 1rem;
}

.record-details li {
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.technician-notes p {
  margin: 0;
  color: var(--text-primary);
  font-style: italic;
}

.next-maintenance {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--info-50);
  border-radius: 6px;
  border-left: 4px solid var(--info-500);
}

.next-maintenance-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--info-700);
  font-weight: 500;
}

.record-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .filters-section {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .record-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .record-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>

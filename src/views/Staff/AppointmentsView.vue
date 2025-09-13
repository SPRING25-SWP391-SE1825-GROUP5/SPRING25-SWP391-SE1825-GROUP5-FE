<template>
  <div class="appointments-view">
    <div class="container">
      <div class="page-header">
        <h1>Quản lý lịch hẹn</h1>
        <p>Tiếp nhận và xử lý yêu cầu đặt lịch từ khách hàng</p>
        <div class="header-actions">
          <BaseButton @click="showCreateModal = true" variant="primary">
            <i class="icon-plus"></i>
            Tạo lịch hẹn mới
          </BaseButton>
        </div>
      </div>

      <!-- Filters and Stats -->
      <div class="control-panel">
        <div class="filters">
          <select v-model="statusFilter" @change="filterAppointments">
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <BaseInput v-model="dateFilter" type="date" placeholder="Chọn ngày" @change="filterAppointments" />
          <BaseInput v-model="searchQuery" placeholder="Tìm theo tên KH, biển số..." @input="filterAppointments" />
        </div>
        
        <div class="quick-stats">
          <div class="stat-item">
            <span class="stat-number">{{ pendingCount }}</span>
            <span class="stat-label">Chờ xác nhận</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ todayCount }}</span>
            <span class="stat-label">Hôm nay</span>
          </div>
        </div>
      </div>

      <!-- Appointments List -->
      <div class="appointments-grid">
        <div v-for="appointment in filteredAppointments" :key="appointment.id" class="appointment-card">
          <div class="appointment-header">
            <div class="appointment-time">
              <div class="date">{{ formatDate(appointment.appointmentDate) }}</div>
              <div class="time">{{ appointment.appointmentTime }}</div>
            </div>
            <div class="appointment-status">
              <span class="status-badge" :class="`status-${appointment.status}`">
                {{ getStatusText(appointment.status) }}
              </span>
              <div class="priority-indicator" v-if="appointment.priority === 'high'">
                <i class="icon-alert-triangle"></i>
              </div>
            </div>
          </div>

          <div class="appointment-content">
            <div class="customer-info">
              <h3>{{ appointment.customerName }}</h3>
              <div class="customer-details">
                <span><i class="icon-phone"></i> {{ appointment.customerPhone }}</span>
                <span><i class="icon-car"></i> {{ appointment.vehicleModel }} - {{ appointment.licensePlate }}</span>
              </div>
            </div>

            <div class="service-info">
              <h4>Dịch vụ yêu cầu:</h4>
              <ul class="service-list">
                <li v-for="service in appointment.requestedServices" :key="service.id">
                  {{ service.name }}
                  <span class="service-duration">({{ service.estimatedDuration }}p)</span>
                </li>
              </ul>
              <div class="estimated-cost">
                Ước tính: {{ formatCurrency(appointment.estimatedCost) }}
              </div>
            </div>

            <div v-if="appointment.customerNotes" class="customer-notes">
              <h4>Ghi chú từ khách hàng:</h4>
              <p>{{ appointment.customerNotes }}</p>
            </div>

            <div v-if="appointment.assignedTechnician" class="assigned-technician">
              <h4>Kỹ thuật viên được phân công:</h4>
              <div class="technician-info">
                <span class="technician-name">{{ appointment.assignedTechnician.name }}</span>
                <span class="technician-specialty">{{ appointment.assignedTechnician.specialty }}</span>
              </div>
            </div>
          </div>

          <div class="appointment-actions">
            <template v-if="appointment.status === 'pending'">
              <BaseButton @click="confirmAppointment(appointment)" size="sm">
                <i class="icon-check"></i>
                Xác nhận
              </BaseButton>
              <BaseButton @click="rescheduleAppointment(appointment)" variant="outline" size="sm">
                <i class="icon-calendar"></i>
                Đổi lịch
              </BaseButton>
              <BaseButton @click="cancelAppointment(appointment)" variant="danger" size="sm">
                <i class="icon-x"></i>
                Hủy
              </BaseButton>
            </template>
            
            <template v-else-if="appointment.status === 'confirmed'">
              <BaseButton @click="assignTechnician(appointment)" variant="outline" size="sm">
                <i class="icon-user-plus"></i>
                Phân công KTV
              </BaseButton>
              <BaseButton @click="startService(appointment)" size="sm">
                <i class="icon-play"></i>
                Bắt đầu
              </BaseButton>
            </template>

            <template v-else-if="appointment.status === 'in_progress'">
              <BaseButton @click="viewProgress(appointment)" variant="outline" size="sm">
                <i class="icon-eye"></i>
                Xem tiến độ
              </BaseButton>
              <BaseButton @click="completeService(appointment)" variant="success" size="sm">
                <i class="icon-check-circle"></i>
                Hoàn thành
              </BaseButton>
            </template>

            <BaseButton @click="viewDetails(appointment)" variant="outline" size="sm">
              <i class="icon-info"></i>
              Chi tiết
            </BaseButton>
            <BaseButton @click="contactCustomer(appointment)" variant="outline" size="sm">
              <i class="icon-message-circle"></i>
              Liên hệ
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredAppointments.length === 0" class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>Không có lịch hẹn</h3>
        <p>Không tìm thấy lịch hẹn nào với bộ lọc hiện tại</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BaseButton, BaseInput } from '@/components/common'

// Reactive data
const statusFilter = ref('')
const dateFilter = ref('')
const searchQuery = ref('')
const showCreateModal = ref(false)

const appointments = ref([
  {
    id: 1,
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    vehicleModel: 'Tesla Model 3',
    licensePlate: '30A-123.45',
    appointmentDate: '2024-03-15',
    appointmentTime: '09:00',
    status: 'pending',
    priority: 'normal',
    estimatedCost: 2500000,
    requestedServices: [
      { id: 1, name: 'Bảo dưỡng định kỳ 15,000km', estimatedDuration: 120 },
      { id: 2, name: 'Kiểm tra hệ thống phanh', estimatedDuration: 60 }
    ],
    customerNotes: 'Xe có tiếng kêu lạ ở bánh trước bên phải',
    assignedTechnician: null
  },
  {
    id: 2,
    customerName: 'Trần Thị B',
    customerPhone: '0907654321',
    vehicleModel: 'VinFast VF8',
    licensePlate: '29A-678.90',
    appointmentDate: '2024-03-15',
    appointmentTime: '14:00',
    status: 'confirmed',
    priority: 'high',
    estimatedCost: 1800000,
    requestedServices: [
      { id: 3, name: 'Kiểm tra hệ thống sạc', estimatedDuration: 90 }
    ],
    customerNotes: 'Sạc chậm hơn bình thường',
    assignedTechnician: {
      id: 1,
      name: 'Lê Văn C',
      specialty: 'Hệ thống điện'
    }
  },
  {
    id: 3,
    customerName: 'Phạm Văn D',
    customerPhone: '0912345678',
    vehicleModel: 'BMW iX3',
    licensePlate: '30B-456.78',
    appointmentDate: '2024-03-16',
    appointmentTime: '10:30',
    status: 'in_progress',
    priority: 'normal',
    estimatedCost: 3200000,
    requestedServices: [
      { id: 4, name: 'Thay pin 12V', estimatedDuration: 180 }
    ],
    assignedTechnician: {
      id: 2,
      name: 'Hoàng Văn E',
      specialty: 'Pin và sạc'
    }
  }
])

// Computed properties
const filteredAppointments = computed(() => {
  let filtered = [...appointments.value]
  
  if (statusFilter.value) {
    filtered = filtered.filter(apt => apt.status === statusFilter.value)
  }
  
  if (dateFilter.value) {
    filtered = filtered.filter(apt => apt.appointmentDate === dateFilter.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(apt => 
      apt.customerName.toLowerCase().includes(query) ||
      apt.licensePlate.toLowerCase().includes(query) ||
      apt.vehicleModel.toLowerCase().includes(query)
    )
  }
  
  return filtered.sort((a, b) => {
    // Sort by date and time
    const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`)
    const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`)
    return dateA.getTime() - dateB.getTime()
  })
})

const pendingCount = computed(() => {
  return appointments.value.filter(apt => apt.status === 'pending').length
})

const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return appointments.value.filter(apt => apt.appointmentDate === today).length
})

// Methods
const filterAppointments = () => {
  // Filtering is handled by computed property
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    in_progress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  }
  return statusMap[status] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const confirmAppointment = (appointment: any) => {
  appointment.status = 'confirmed'
  // API call to confirm appointment
  console.log('Confirming appointment:', appointment.id)
}

const rescheduleAppointment = (appointment: any) => {
  // Open reschedule modal
  console.log('Reschedule appointment:', appointment.id)
}

const cancelAppointment = (appointment: any) => {
  if (confirm('Bạn có chắc muốn hủy lịch hẹn này?')) {
    appointment.status = 'cancelled'
    // API call to cancel appointment
    console.log('Cancelling appointment:', appointment.id)
  }
}

const assignTechnician = (appointment: any) => {
  // Open technician assignment modal
  console.log('Assign technician to:', appointment.id)
}

const startService = (appointment: any) => {
  appointment.status = 'in_progress'
  // API call to start service
  console.log('Starting service for:', appointment.id)
}

const viewProgress = (appointment: any) => {
  // Navigate to progress view
  console.log('View progress for:', appointment.id)
}

const completeService = (appointment: any) => {
  appointment.status = 'completed'
  // API call to complete service
  console.log('Completing service for:', appointment.id)
}

const viewDetails = (appointment: any) => {
  // Open details modal or navigate to details page
  console.log('View details for:', appointment.id)
}

const contactCustomer = (appointment: any) => {
  // Open chat or call customer
  console.log('Contact customer for:', appointment.id)
}

onMounted(() => {
  // Load appointments from API
})
</script>

<style scoped>
.appointments-view {
  max-width: 1400px;
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

.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-primary);
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filters select {
  padding: 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-card);
}

.quick-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-600);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.appointments-grid {
  display: grid;
  gap: 1.5rem;
}

.appointment-card {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-primary);
  transition: box-shadow 0.2s ease;
}

.appointment-card:hover {
  box-shadow: var(--shadow-md);
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.appointment-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: var(--primary-50);
  border-radius: 8px;
  min-width: 80px;
}

.date {
  font-size: 0.875rem;
  color: var(--primary-600);
  font-weight: 500;
}

.time {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary-700);
}

.appointment-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pending {
  background: var(--warning-100);
  color: var(--warning-700);
}

.status-confirmed {
  background: var(--info-100);
  color: var(--info-700);
}

.status-in_progress {
  background: var(--primary-100);
  color: var(--primary-700);
}

.status-completed {
  background: var(--success-100);
  color: var(--success-700);
}

.priority-indicator {
  color: var(--error-500);
}

.appointment-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.customer-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.customer-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.customer-details span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.service-info h4,
.customer-notes h4,
.assigned-technician h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.service-list {
  margin: 0 0 0.5rem 0;
  padding-left: 1rem;
}

.service-list li {
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.service-duration {
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.estimated-cost {
  font-weight: 600;
  color: var(--primary-600);
}

.customer-notes p {
  margin: 0;
  color: var(--text-primary);
  font-style: italic;
}

.technician-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.technician-name {
  font-weight: 500;
  color: var(--text-primary);
}

.technician-specialty {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.appointment-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 1rem;
  border-top: 1px solid var(--border-secondary);
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

@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .appointment-content {
    grid-template-columns: 1fr;
  }
  
  .appointment-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>

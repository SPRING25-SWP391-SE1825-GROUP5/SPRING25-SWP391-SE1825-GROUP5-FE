<template>
  <div class="booking-view">
    <div class="booking-header">
      <h1>Đặt lịch bảo dưỡng</h1>
      <p>Chọn dịch vụ và thời gian phù hợp cho xe của bạn</p>
    </div>

    <div class="booking-steps">
      <div class="step-indicator">
        <div 
          v-for="(step, index) in steps" 
          :key="step.id"
          class="step-item"
          :class="{ 
            'step-active': currentStep === index + 1,
            'step-completed': currentStep > index + 1 
          }"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-label">{{ step.label }}</div>
        </div>
      </div>

      <!-- Step 1: Chọn xe -->
      <div v-if="currentStep === 1" class="step-content">
        <BaseCard>
          <template #header>
            <h2>Chọn xe cần bảo dưỡng</h2>
          </template>
          <div class="vehicle-selection">
            <div 
              v-for="vehicle in userVehicles" 
              :key="vehicle.id"
              class="vehicle-option"
              :class="{ 'selected': selectedVehicle?.id === vehicle.id }"
              @click="selectVehicle(vehicle)"
            >
              <div class="vehicle-info">
                <h3>{{ vehicle.model }}</h3>
                <p class="license-plate">{{ vehicle.licensePlate }}</p>
                <div class="vehicle-details">
                  <span>Km hiện tại: {{ formatNumber(vehicle.currentKm) }}</span>
                  <span>Năm sản xuất: {{ vehicle.year }}</span>
                </div>
              </div>
              <div class="vehicle-status">
                <span 
                  class="status-badge" 
                  :class="`status-${vehicle.maintenanceStatus}`"
                >
                  {{ getMaintenanceStatusText(vehicle.maintenanceStatus) }}
                </span>
              </div>
            </div>
            
            <div class="add-vehicle-option" @click="$router.push('/my-vehicles/add')">
              <i class="icon-plus"></i>
              <span>Thêm xe mới</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Step 2: Chọn dịch vụ -->
      <div v-if="currentStep === 2" class="step-content">
        <BaseCard>
          <template #header>
            <h2>Chọn loại dịch vụ</h2>
          </template>
          <div class="service-categories">
            <div 
              v-for="category in serviceCategories" 
              :key="category.id"
              class="service-category"
            >
              <h3>{{ category.name }}</h3>
              <div class="services-grid">
                <div 
                  v-for="service in category.services" 
                  :key="service.id"
                  class="service-option"
                  :class="{ 'selected': selectedServices.includes(service.id) }"
                  @click="toggleService(service.id)"
                >
                  <div class="service-header">
                    <h4>{{ service.name }}</h4>
                    <span class="service-price">{{ formatCurrency(service.estimatedPrice) }}</span>
                  </div>
                  <p class="service-description">{{ service.description }}</p>
                  <div class="service-duration">
                    <i class="icon-clock"></i>
                    <span>{{ service.estimatedDuration }} phút</span>
                  </div>
                  <div v-if="service.isRecommended" class="recommended-badge">
                    Khuyến nghị
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Step 3: Chọn trung tâm và thời gian -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="booking-grid">
          <BaseCard class="center-selection">
            <template #header>
              <h2>Chọn trung tâm dịch vụ</h2>
            </template>
            <div class="centers-list">
              <div 
                v-for="center in serviceCenters" 
                :key="center.id"
                class="center-option"
                :class="{ 'selected': selectedCenter?.id === center.id }"
                @click="selectCenter(center)"
              >
                <div class="center-info">
                  <h4>{{ center.name }}</h4>
                  <p class="center-address">{{ center.address }}</p>
                  <div class="center-details">
                    <span class="distance">
                      <i class="icon-map-pin"></i>
                      {{ center.distance }}km
                    </span>
                    <span class="rating">
                      <i class="icon-star"></i>
                      {{ center.rating }}/5
                    </span>
                  </div>
                </div>
                <div class="center-availability">
                  <span class="availability-status" :class="center.availabilityStatus">
                    {{ getAvailabilityText(center.availabilityStatus) }}
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard class="time-selection">
            <template #header>
              <h2>Chọn thời gian</h2>
            </template>
            <div class="calendar-container">
              <div class="calendar-header">
                <button @click="previousMonth" class="nav-btn">
                  <i class="icon-chevron-left"></i>
                </button>
                <h3>{{ formatMonth(currentMonth) }}</h3>
                <button @click="nextMonth" class="nav-btn">
                  <i class="icon-chevron-right"></i>
                </button>
              </div>
              
              <div class="calendar-grid">
                <div class="calendar-weekdays">
                  <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
                </div>
                <div class="calendar-days">
                  <div 
                    v-for="date in calendarDates" 
                    :key="date.date"
                    class="calendar-day"
                    :class="{ 
                      'available': date.available,
                      'selected': selectedDate === date.date,
                      'today': isToday(date.date)
                    }"
                    @click="selectDate(date.date)"
                  >
                    {{ date.day }}
                  </div>
                </div>
              </div>

              <div v-if="selectedDate" class="time-slots">
                <h4>Khung giờ có sẵn</h4>
                <div class="slots-grid">
                  <button 
                    v-for="slot in availableTimeSlots" 
                    :key="slot.time"
                    class="time-slot"
                    :class="{ 'selected': selectedTimeSlot === slot.time }"
                    :disabled="!slot.available"
                    @click="selectTimeSlot(slot.time)"
                  >
                    {{ slot.time }}
                  </button>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- Step 4: Xác nhận -->
      <div v-if="currentStep === 4" class="step-content">
        <BaseCard>
          <template #header>
            <h2>Xác nhận đặt lịch</h2>
          </template>
          <div class="booking-summary">
            <div class="summary-section">
              <h3>Thông tin xe</h3>
              <div class="summary-item">
                <span class="label">Xe:</span>
                <span class="value">{{ selectedVehicle?.model }} - {{ selectedVehicle?.licensePlate }}</span>
              </div>
            </div>

            <div class="summary-section">
              <h3>Dịch vụ đã chọn</h3>
              <div v-for="service in selectedServiceDetails" :key="service.id" class="summary-item">
                <span class="label">{{ service.name }}:</span>
                <span class="value">{{ formatCurrency(service.estimatedPrice) }}</span>
              </div>
              <div class="summary-total">
                <span class="label">Tổng cộng:</span>
                <span class="value total-price">{{ formatCurrency(totalEstimatedPrice) }}</span>
              </div>
            </div>

            <div class="summary-section">
              <h3>Thời gian & địa điểm</h3>
              <div class="summary-item">
                <span class="label">Trung tâm:</span>
                <span class="value">{{ selectedCenter?.name }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Địa chỉ:</span>
                <span class="value">{{ selectedCenter?.address }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Thời gian:</span>
                <span class="value">{{ formatDateTime(selectedDate, selectedTimeSlot) }}</span>
              </div>
            </div>

            <div class="summary-section">
              <h3>Ghi chú</h3>
              <BaseInput
                v-model="bookingNotes"
                type="textarea"
                placeholder="Thêm ghi chú cho trung tâm dịch vụ (tùy chọn)"
                rows="3"
              />
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Navigation buttons -->
      <div class="step-navigation">
        <BaseButton 
          v-if="currentStep > 1" 
          @click="previousStep" 
          variant="outline"
        >
          Quay lại
        </BaseButton>
        
        <BaseButton 
          v-if="currentStep < 4" 
          @click="nextStep" 
          variant="primary"
          :disabled="!canProceedToNextStep"
        >
          Tiếp tục
        </BaseButton>
        
        <BaseButton 
          v-if="currentStep === 4" 
          @click="confirmBooking" 
          variant="primary"
          :loading="isSubmitting"
        >
          Xác nhận đặt lịch
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, BaseCard, BaseInput } from '@/components/common'

const router = useRouter()

const steps = [
  { id: 1, label: 'Chọn xe' },
  { id: 2, label: 'Chọn dịch vụ' },
  { id: 3, label: 'Thời gian & địa điểm' },
  { id: 4, label: 'Xác nhận' }
]

const currentStep = ref(1)
const isSubmitting = ref(false)

// Step 1 data
const userVehicles = ref([
  {
    id: 1,
    model: 'Tesla Model 3',
    licensePlate: '30A-12345',
    currentKm: 25000,
    year: 2022,
    maintenanceStatus: 'normal'
  }
])
const selectedVehicle = ref(null)

// Step 2 data
const serviceCategories = ref([
  {
    id: 1,
    name: 'Bảo dưỡng định kỳ',
    services: [
      {
        id: 1,
        name: 'Bảo dưỡng 10,000km',
        description: 'Kiểm tra tổng thể, thay dầu phanh, kiểm tra pin',
        estimatedPrice: 1500000,
        estimatedDuration: 120,
        isRecommended: true
      }
    ]
  }
])
const selectedServices = ref([])

// Step 3 data
const serviceCenters = ref([
  {
    id: 1,
    name: 'EV Service Hà Nội',
    address: '123 Đường ABC, Cầu Giấy, Hà Nội',
    distance: 5.2,
    rating: 4.8,
    availabilityStatus: 'available'
  }
])
const selectedCenter = ref(null)
const currentMonth = ref(new Date())
const selectedDate = ref(null)
const selectedTimeSlot = ref(null)
const bookingNotes = ref('')

const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 1: return selectedVehicle.value !== null
    case 2: return selectedServices.value.length > 0
    case 3: return selectedCenter.value && selectedDate.value && selectedTimeSlot.value
    case 4: return true
    default: return false
  }
})

const selectedServiceDetails = computed(() => {
  return serviceCategories.value
    .flatMap(cat => cat.services)
    .filter(service => selectedServices.value.includes(service.id))
})

const totalEstimatedPrice = computed(() => {
  return selectedServiceDetails.value.reduce((total, service) => total + service.estimatedPrice, 0)
})

const calendarDates = computed(() => {
  // Generate calendar dates for current month
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const dates = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    dates.push({
      date: date.toISOString().split('T')[0],
      day: day,
      available: day >= new Date().getDate() // Simple availability check
    })
  }
  return dates
})

const availableTimeSlots = computed(() => {
  if (!selectedDate.value) return []
  
  return [
    { time: '08:00', available: true },
    { time: '09:00', available: true },
    { time: '10:00', available: false },
    { time: '11:00', available: true },
    { time: '14:00', available: true },
    { time: '15:00', available: true },
    { time: '16:00', available: true }
  ]
})

const selectVehicle = (vehicle: any) => {
  selectedVehicle.value = vehicle
}

const toggleService = (serviceId: number) => {
  const index = selectedServices.value.indexOf(serviceId)
  if (index > -1) {
    selectedServices.value.splice(index, 1)
  } else {
    selectedServices.value.push(serviceId)
  }
}

const selectCenter = (center: any) => {
  selectedCenter.value = center
}

const selectDate = (date: string) => {
  selectedDate.value = date
  selectedTimeSlot.value = null // Reset time slot when date changes
}

const selectTimeSlot = (time: string) => {
  selectedTimeSlot.value = time
}

const nextStep = () => {
  if (canProceedToNextStep.value && currentStep.value < 4) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const confirmBooking = async () => {
  isSubmitting.value = true
  try {
    // API call to create booking
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
    
    // Redirect to success page
    router.push('/booking/success')
  } catch (error) {
    console.error('Booking failed:', error)
  } finally {
    isSubmitting.value = false
  }
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

const formatMonth = (date: Date) => {
  return new Intl.DateTimeFormat('vi-VN', { 
    month: 'long', 
    year: 'numeric' 
  }).format(date)
}

const formatDateTime = (date: string, time: string) => {
  const dateObj = new Date(date)
  return `${new Intl.DateTimeFormat('vi-VN').format(dateObj)} lúc ${time}`
}

const getMaintenanceStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    normal: 'Bình thường',
    due_soon: 'Sắp bảo dưỡng',
    overdue: 'Quá hạn'
  }
  return statusMap[status] || status
}

const getAvailabilityText = (status: string) => {
  const statusMap: Record<string, string> = {
    available: 'Có sẵn',
    busy: 'Bận',
    closed: 'Đóng cửa'
  }
  return statusMap[status] || status
}

const isToday = (date: string) => {
  return date === new Date().toISOString().split('T')[0]
}

const previousMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1)
}

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1)
}

onMounted(() => {
  // Load user vehicles and service data
})
</script>

<style scoped>
.booking-view {
  max-width: 1200px;
  margin: 0 auto;
}

.booking-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-indicator {
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
  gap: 2rem;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s ease;
}

.step-active .step-number {
  background: var(--primary-500);
  color: white;
}

.step-completed .step-number {
  background: var(--success-500);
  color: white;
}

.vehicle-selection {
  display: grid;
  gap: 1rem;
}

.vehicle-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vehicle-option:hover {
  border-color: var(--primary-300);
}

.vehicle-option.selected {
  border-color: var(--primary-500);
  background: var(--primary-50);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.service-option {
  padding: 1.5rem;
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.service-option.selected {
  border-color: var(--primary-500);
  background: var(--primary-50);
}

.recommended-badge {
  position: absolute;
  top: -8px;
  right: 1rem;
  background: var(--warning-500);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.booking-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.calendar-grid {
  margin-top: 1rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0.5rem;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-day.available:hover {
  background: var(--primary-100);
}

.calendar-day.selected {
  background: var(--primary-500);
  color: white;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.time-slot {
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-slot:hover:not(:disabled) {
  border-color: var(--primary-300);
}

.time-slot.selected {
  background: var(--primary-500);
  color: white;
  border-color: var(--primary-500);
}

.time-slot:disabled {
  background: var(--bg-secondary);
  color: var(--text-disabled);
  cursor: not-allowed;
}

.step-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-primary);
}

.booking-summary {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.summary-section h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-secondary);
}

.summary-total {
  font-weight: 600;
  font-size: 1.125rem;
  border-top: 2px solid var(--border-primary);
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}

.total-price {
  color: var(--primary-600);
}

@media (max-width: 768px) {
  .booking-grid {
    grid-template-columns: 1fr;
  }
  
  .step-indicator {
    gap: 1rem;
  }
  
  .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>

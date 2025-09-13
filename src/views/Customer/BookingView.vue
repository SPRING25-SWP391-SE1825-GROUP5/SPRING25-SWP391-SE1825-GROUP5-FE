<template>
  <div class="booking-view">
    <div class="container">
      <div class="booking-header">
        <h1>Đặt Lịch Bảo Dưỡng</h1>
        <p>Chọn dịch vụ và thời gian phù hợp cho xe điện của bạn</p>
      </div>

      <div class="booking-content">
        <!-- Step Indicator -->
        <div class="step-indicator">
          <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
            <div class="step-number">1</div>
            <div class="step-label">Chọn xe</div>
          </div>
          <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
            <div class="step-number">2</div>
            <div class="step-label">Chọn dịch vụ</div>
          </div>
          <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
            <div class="step-number">3</div>
            <div class="step-label">Chọn thời gian</div>
          </div>
          <div class="step" :class="{ active: currentStep >= 4 }">
            <div class="step-number">4</div>
            <div class="step-label">Xác nhận</div>
          </div>
        </div>

        <!-- Step 1: Vehicle Selection -->
        <div v-if="currentStep === 1" class="booking-step">
          <h2>Chọn xe cần bảo dưỡng</h2>
          <div class="vehicle-grid">
            <div 
              v-for="vehicle in userVehicles" 
              :key="vehicle.id"
              class="vehicle-card"
              :class="{ selected: selectedVehicle?.id === vehicle.id }"
              @click="selectVehicle(vehicle)"
            >
              <div class="vehicle-info">
                <h3>{{ vehicle.model }}</h3>
                <p class="vehicle-details">{{ vehicle.year }} • {{ vehicle.licensePlate }}</p>
                <p class="vehicle-vin">VIN: {{ vehicle.vin }}</p>
                <div class="vehicle-status">
                  <span class="mileage">{{ vehicle.mileage.toLocaleString() }} km</span>
                  <span class="last-service">Bảo dưỡng cuối: {{ formatDate(vehicle.lastService) }}</span>
                </div>
              </div>
              <div class="vehicle-[object Object]div>
            </div>
          </div>
          <div class="step-actions">
            <BaseButton @click="nextStep" :disabled="!selectedVehicle" size="lg">
              Tiếp theo
            </BaseButton>
          </div>
        </div>

        <!-- Step 2: Service Selection -->
        <div v-if="currentStep === 2" class="booking-step">
          <h2>Chọn dịch vụ</h2>
          <div class="service-categories">
            <div v-for="category in serviceCategories" :key="category.id" class="service-category">
              <h3>{{ category.name }}</h3>
              <div class="service-list">
                <div 
                  v-for="service in category.services" 
                  :key="service.id"
                  class="service-item"
                  :class="{ selected: selectedServices.includes(service.id) }"
                  @click="toggleService(service.id)"
                >
                  <div class="service-info">
                    <h4>{{ service.name }}</h4>
                    <p>{{ service.description }}</p>
                    <div class="service-details">
                      <span class="duration">⏱️ {{ service.estimatedDuration }}</span>
                      <span class="price">{{ formatPrice(service.price) }}</span>
                    </div>
                  </div>
                  <div class="service-checkbox">
                    <input 
                      type="checkbox" 
                      :checked="selectedServices.includes(service.id)"
                      @change="toggleService(service.id)"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="step-actions">
            <BaseButton @click="prevStep" variant="secondary">Quay lại</BaseButton>
            <BaseButton @click="nextStep" :disabled="selectedServices.length === 0" size="lg">
              Tiếp theo
            </BaseButton>
          </div>
        </div>

        <!-- Step 3: Time Selection -->
        <div v-if="currentStep === 3" class="booking-step">
          <h2>Chọn thời gian và trung tâm</h2>
          <div class="time-selection">
            <div class="center-selection">
              <h3>Trung tâm dịch vụ</h3>
              <select v-model="selectedCenter" class="center-select">
                <option value="">Chọn trung tâm</option>
                <option v-for="center in serviceCenters" :key="center.id" :value="center.id">
                  {{ center.name }} - {{ center.address }}
                </option>
              </select>
            </div>
            
            <div class="date-selection">
              <h3>Chọn ngày</h3>
              <input 
                type="date" 
                v-model="selectedDate" 
                :min="minDate"
                class="date-input"
              >
            </div>

            <div class="time-slots" v-if="selectedDate && selectedCenter">
              <h3>Khung giờ trống</h3>
              <div class="slots-grid">
                <button 
                  v-for="slot in availableSlots" 
                  :key="slot.time"
                  class="time-slot"
                  :class="{ selected: selectedSlot === slot.time, unavailable: !slot.available }"
                  :disabled="!slot.available"
                  @click="selectSlot(slot.time)"
                >
                  {{ slot.time }}
                </button>
              </div>
            </div>
          </div>
          <div class="step-actions">
            <BaseButton @click="prevStep" variant="secondary">Quay lại</BaseButton>
            <BaseButton @click="nextStep" :disabled="!selectedSlot" size="lg">
              Tiếp theo
            </BaseButton>
          </div>
        </div>

        <!-- Step 4: Confirmation -->
        <div v-if="currentStep === 4" class="booking-step">
          <h2>Xác nhận đặt lịch</h2>
          <div class="booking-summary">
            <div class="summary-section">
              <h3>Thông tin xe</h3>
              <p><strong>{{ selectedVehicle?.model }}</strong></p>
              <p>{{ selectedVehicle?.licensePlate }} • VIN: {{ selectedVehicle?.vin }}</p>
            </div>

            <div class="summary-section">
              <h3>Dịch vụ đã chọn</h3>
              <ul class="selected-services-list">
                <li v-for="serviceId in selectedServices" :key="serviceId">
                  {{ getServiceName(serviceId) }} - {{ formatPrice(getServicePrice(serviceId)) }}
                </li>
              </ul>
              <div class="total-price">
                <strong>Tổng cộng: {{ formatPrice(totalPrice) }}</strong>
              </div>
            </div>

            <div class="summary-section">
              <h3>Thời gian và địa điểm</h3>
              <p><strong>{{ getCenterName(selectedCenter) }}</strong></p>
              <p>{{ formatDateTime(selectedDate, selectedSlot) }}</p>
            </div>

            <div class="summary-section">
              <h3>Ghi chú (tùy chọn)</h3>
              <textarea 
                v-model="bookingNotes" 
                placeholder="Mô tả tình trạng xe hoặc yêu cầu đặc biệt..."
                class="notes-input"
              ></textarea>
            </div>
          </div>
          
          <div class="step-actions">
            <BaseButton @click="prevStep" variant="secondary">Quay lại</BaseButton>
            <BaseButton @click="confirmBooking" :loading="isSubmitting" size="lg">
              {{ isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BaseButton } from '@/components/common'
import { useRouter } from 'vue-router'

const router = useRouter()

// Reactive data
const currentStep = ref(1)
const selectedVehicle = ref(null)
const selectedServices = ref([])
const selectedCenter = ref('')
const selectedDate = ref('')
const selectedSlot = ref('')
const bookingNotes = ref('')
const isSubmitting = ref(false)

// Mock data - would come from API
const userVehicles = ref([
  {
    id: 1,
    model: 'Tesla Model 3',
    year: 2023,
    licensePlate: '30A-123.45',
    vin: 'WVWZZZ1JZ3W386752',
    mileage: 15000,
    lastService: '2024-01-15'
  },
  {
    id: 2,
    model: 'VinFast VF8',
    year: 2024,
    licensePlate: '29A-678.90',
    vin: 'WVWZZZ1JZ3W386753',
    mileage: 8500,
    lastService: '2024-02-20'
  }
])

const serviceCategories = ref([
  {
    id: 1,
    name: 'Bảo dưỡng định kỳ',
    services: [
      {
        id: 1,
        name: 'Bảo dưỡng 10,000km',
        description: 'Kiểm tra hệ thống điện, phanh, lốp xe',
        estimatedDuration: '2 giờ',
        price: 1500000
      },
      {
        id: 2,
        name: 'Bảo dưỡng 20,000km',
        description: 'Bảo dưỡng toàn diện, thay dầu phanh',
        estimatedDuration: '3 giờ',
        price: 2500000
      }
    ]
  },
  {
    id: 2,
    name: 'Sửa chữa',
    services: [
      {
        id: 3,
        name: 'Kiểm tra pin',
        description: 'Chẩn đoán và kiểm tra hệ thống pin',
        estimatedDuration: '1 giờ',
        price: 800000
      },
      {
        id: 4,
        name: 'Sửa chữa hệ thống điện',
        description: 'Khắc phục sự cố hệ thống điện',
        estimatedDuration: '4 giờ',
        price: 3000000
      }
    ]
  }
])

const serviceCenters = ref([
  {
    id: 1,
    name: 'EV Service Hà Nội',
    address: '123 Đường ABC, Cầu Giấy, Hà Nội'
  },
  {
    id: 2,
    name: 'EV Service TP.HCM',
    address: '456 Đường XYZ, Quận 1, TP.HCM'
  }
])

const availableSlots = ref([
  { time: '08:00', available: true },
  { time: '09:00', available: false },
  { time: '10:00', available: true },
  { time: '11:00', available: true },
  { time: '13:00', available: true },
  { time: '14:00', available: false },
  { time: '15:00', available: true },
  { time: '16:00', available: true }
])

// Computed properties
const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const totalPrice = computed(() => {
  return selectedServices.value.reduce((total, serviceId) => {
    return total + getServicePrice(serviceId)
  }, 0)
})

// Methods
const selectVehicle = (vehicle) => {
  selectedVehicle.value = vehicle
}

const toggleService = (serviceId) => {
  const index = selectedServices.value.indexOf(serviceId)
  if (index > -1) {
    selectedServices.value.splice(index, 1)
  } else {
    selectedServices.value.push(serviceId)
  }
}

const selectSlot = (time) => {
  selectedSlot.value = time
}

const nextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const getServiceName = (serviceId) => {
  for (const category of serviceCategories.value) {
    const service = category.services.find(s => s.id === serviceId)
    if (service) return service.name
  }
  return ''
}

const getServicePrice = (serviceId) => {
  for (const category of serviceCategories.value) {
    const service = category.services.find(s => s.id === serviceId)
    if (service) return service.price
  }
  return 0
}

const getCenterName = (centerId) => {
  const center = serviceCenters.value.find(c => c.id == centerId)
  return center ? center.name : ''
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const formatDateTime = (date, time) => {
  const dateObj = new Date(date)
  return `${dateObj.toLocaleDateString('vi-VN')} lúc ${time}`
}

const confirmBooking = async () => {
  isSubmitting.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Show success message and redirect
    alert('Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.')
    router.push('/maintenance-history')
  } catch (error) {
    alert('Có lỗi xảy ra. Vui lòng thử lại.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // Load user vehicles and available services
})
</script>

import React, { useState, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { User, Car, Wrench, MapPin, UserPlus, CheckCircle } from 'lucide-react'
import StepsProgressIndicator from './StepsProgressIndicator'
import CustomerInfoStep from './CustomerInfoStep'
import CombinedServiceVehicleStep from './CombinedServiceVehicleStep'
import LocationTimeStep from './LocationTimeStep'
import AccountStep from './AccountStep'
import ConfirmationStep from './ConfirmationStep'

// Types
interface CustomerInfo {
  fullName: string
  phone: string
  email: string
}

interface VehicleInfo {
  carModel: string
  mileage: string
  licensePlate: string
}

interface ServiceInfo {
  services: string[]
  notes: string
}

interface LocationTimeInfo {
  centerId: string
  technicianId: string
  address?: string
  date: string
  time: string
}

interface AccountInfo {
  username: string
  password: string
  confirmPassword: string
}

interface BookingData {
  customerInfo: CustomerInfo
  vehicleInfo: VehicleInfo
  serviceInfo: ServiceInfo
  locationTimeInfo: LocationTimeInfo
  accountInfo?: AccountInfo
  images: File[]
}

const ServiceBookingForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGuest, setIsGuest] = useState(true) // Mặc định là khách vãng lai
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const auth = useAppSelector((s) => s.auth)
  
  const [bookingData, setBookingData] = useState<BookingData>({
    customerInfo: {
      fullName: '',
      phone: '',
      email: ''
    },
    vehicleInfo: {
      carModel: '',
      mileage: '',
      licensePlate: ''
    },
    serviceInfo: {
      services: [],
      notes: ''
    },
    locationTimeInfo: {
      centerId: '',
      technicianId: '',
      address: '',
      date: '',
      time: ''
    },
    accountInfo: {
      username: '',
      password: '',
      confirmPassword: ''
    },
    images: []
  })

  // Đồng bộ trạng thái đăng nhập và tự điền thông tin khách hàng
  useEffect(() => {
    const loggedIn = !!auth?.token
    setIsGuest(!loggedIn)

    if (loggedIn && auth.user) {
      setBookingData((prev) => ({
        ...prev,
        customerInfo: {
          fullName: auth.user.fullName || prev.customerInfo.fullName,
          phone: auth.user.phoneNumber || prev.customerInfo.phone,
          email: auth.user.email || prev.customerInfo.email
        }
      }))

      // Nếu đang ở bước 1 (thông tin KH) thì tự động qua bước 1 (dịch vụ) cho user đã đăng nhập
      // Không cần thay đổi step vì logic renderCurrentStep đã xử lý
    }
  }, [auth?.token, auth?.user])

  // Kiểm tra xem bước hiện tại đã hoàn thành chưa
  const isStepCompleted = (step: number): boolean => {
    if (isGuest) {
      // Khách vãng lai: 4 bước (Dịch vụ & Xe -> Địa điểm -> Tài khoản -> Xác nhận)
      switch (step) {
        case 1:
          return (
            bookingData.serviceInfo.services.length > 0 &&
            !!bookingData.vehicleInfo.carModel &&
            !!bookingData.vehicleInfo.licensePlate
          )
        case 2:
          return !!(bookingData.locationTimeInfo.centerId && bookingData.locationTimeInfo.technicianId && bookingData.locationTimeInfo.date && bookingData.locationTimeInfo.time)
        case 3:
          return !!(bookingData.accountInfo?.username && bookingData.accountInfo?.password && bookingData.accountInfo?.confirmPassword && bookingData.customerInfo.fullName && bookingData.customerInfo.phone && bookingData.customerInfo.email)
        case 4:
          return true
        default:
          return false
      }
    } else {
      // Đã đăng nhập: 3 bước (Dịch vụ & Xe -> Địa điểm -> Xác nhận)
      switch (step) {
        case 1:
          return (
            bookingData.serviceInfo.services.length > 0 &&
            !!bookingData.vehicleInfo.carModel &&
            !!bookingData.vehicleInfo.licensePlate
          )
        case 2:
          return !!(bookingData.locationTimeInfo.centerId && bookingData.locationTimeInfo.technicianId && bookingData.locationTimeInfo.date && bookingData.locationTimeInfo.time)
        case 3:
          return true // Bước xác nhận luôn có thể hoàn thành
        default:
          return false
      }
    }
  }

  // Cập nhật completed steps khi data thay đổi
  useEffect(() => {
    const newCompletedSteps: number[] = []
    const maxSteps = isGuest ? 4 : 3
    for (let i = 1; i <= maxSteps; i++) {
      if (isStepCompleted(i)) {
        newCompletedSteps.push(i)
      }
    }
    setCompletedSteps(newCompletedSteps)
  }, [bookingData, isGuest])

  const handleNext = () => {
    const maxSteps = isGuest ? 4 : 3
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (step: number) => {
    // Chỉ cho phép click vào các bước đã hoàn thành hoặc bước tiếp theo
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step)
    }
  }

  const updateBookingData = (section: keyof BookingData, data: any) => {
    setBookingData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }))
  }

  const handleSubmit = async () => {
    try {
      // TODO: Gọi API để tạo booking
      console.log('Submitting booking data:', bookingData)
      
      // Hiển thị thông báo thành công
      alert('Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.')
      
      // Reset form hoặc redirect
      // window.location.href = '/booking-success'
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  const renderCurrentStep = () => {
    // Logic điều hướng thông minh dựa trên trạng thái đăng nhập
    if (isGuest) {
      // Khách vãng lai: 4 bước
      switch (currentStep) {
        case 1:
          return (
            <CombinedServiceVehicleStep
              vehicleData={bookingData.vehicleInfo}
              serviceData={bookingData.serviceInfo}
              onUpdateVehicle={(data) => updateBookingData('vehicleInfo', data)}
              onUpdateService={(data) => updateBookingData('serviceInfo', data)}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )
        case 2:
          return (
            <LocationTimeStep
              data={bookingData.locationTimeInfo}
              onUpdate={(data) => updateBookingData('locationTimeInfo', data)}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )
        case 3:
          return (
            <AccountStep
              data={bookingData.accountInfo || { username: '', password: '', confirmPassword: '' }}
              onUpdate={(data) => updateBookingData('accountInfo', data)}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )
        case 4:
          return (
            <ConfirmationStep
              data={bookingData}
              isGuest={isGuest}
              onSubmit={handleSubmit}
              onPrev={handlePrev}
            />
          )
        default:
          return null
      }
    } else {
      // Đã đăng nhập: 3 bước
      switch (currentStep) {
        case 1:
          return (
            <CombinedServiceVehicleStep
              vehicleData={bookingData.vehicleInfo}
              serviceData={bookingData.serviceInfo}
              onUpdateVehicle={(data) => updateBookingData('vehicleInfo', data)}
              onUpdateService={(data) => updateBookingData('serviceInfo', data)}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )
        case 2:
          return (
            <LocationTimeStep
              data={bookingData.locationTimeInfo}
              onUpdate={(data) => updateBookingData('locationTimeInfo', data)}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )
        case 3:
          return (
            <ConfirmationStep
              data={bookingData}
              isGuest={isGuest}
              onSubmit={handleSubmit}
              onPrev={handlePrev}
            />
          )
        default:
          return null
      }
    }
  }

  return (
    <div className="service-booking-form">
      {/* Header */}
      <div className="booking-header">
        <h1 className="booking-title">ĐẶT LỊCH DỊCH VỤ</h1>
        <p className="booking-subtitle">Điền thông tin để đặt lịch dịch vụ xe điện</p>
      </div>

      {/* Steps Progress Indicator */}
      <StepsProgressIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        isGuest={isGuest}
      />

      {/* Current Step Content */}
      <div className="booking-content">
        {renderCurrentStep()}
      </div>

      {/* CSS Styles */}
      <style>{`
        .service-booking-form {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: var(--bg-card);
          min-height: 100vh;
        }

        .booking-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .booking-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }

        .booking-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .booking-content {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-primary);
        }

        @media (max-width: 768px) {
          .service-booking-form {
            padding: 1rem;
          }
          
          .booking-title {
            font-size: 1.5rem;
          }
          
          .booking-content {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default ServiceBookingForm
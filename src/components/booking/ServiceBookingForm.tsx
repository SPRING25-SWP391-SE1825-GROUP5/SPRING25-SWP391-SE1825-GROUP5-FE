import React, { useState, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { User, Car, Wrench, MapPin, UserPlus, CheckCircle } from 'lucide-react'
import StepsProgressIndicator from './StepsProgressIndicator'
import CustomerInfoStep from './CustomerInfoStep'
import CombinedServiceVehicleStep from './CombinedServiceVehicleStep'
import LocationTimeStep from './LocationTimeStep'
import AccountStep from './AccountStep'
import ConfirmationStep from './ConfirmationStep'
import { VehicleService } from '@/services/vehicleService'
import { CustomerService } from '@/services/customerService'
import { ServiceManagementService } from '@/services/serviceManagementService'
import { createBooking, createBookingPaymentLink, holdSlot, releaseHold } from '@/services/bookingFlowService'

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
  year?: string
  color?: string
  brand?: string
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
  technicianSlotId?: number
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
  const [currentServiceId, setCurrentServiceId] = useState<number | undefined>(undefined)
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

  // Update serviceId when serviceInfo changes
  useEffect(() => {
    const updateServiceId = async () => {
      if (bookingData.serviceInfo.services.length > 0) {
        try {
          const svcList = await ServiceManagementService.getActiveServices({ pageSize: 100 })
          const firstServiceId = svcList.services[0]?.id
          setCurrentServiceId(firstServiceId)
        } catch (error) {
          console.error('Error fetching services:', error)
          setCurrentServiceId(undefined)
        }
      } else {
        setCurrentServiceId(undefined)
      }
    }

    updateServiceId()
  }, [bookingData.serviceInfo.services])

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
      // Calculate total price for payment
      const totalPrice = bookingData.serviceInfo.services.reduce(async (sum, serviceId) => {
        try {
          const services = await ServiceManagementService.getActiveServices({ pageSize: 100 })
          const service = services.services?.find(s => s.id === Number(serviceId))
          return (await sum) + (service?.price || 0)
        } catch (error) {
          console.error('Error fetching service price:', error)
          return await sum
        }
      }, Promise.resolve(0))
      
      const finalTotalPrice = await totalPrice
      console.log('Total price calculated:', finalTotalPrice)

      // Resolve current user -> customerId
      console.log('Getting current customer...')
      const me = await CustomerService.getCurrentCustomer()
      console.log('Current customer response:', me)
      const customerId: number | null = me?.data?.customerId || null
      console.log('Customer ID:', customerId)
      if (!customerId) throw new Error('Không xác định được khách hàng')

      // Resolve vehicle: nếu đã có xe theo biển số -> dùng luôn, ngược lại tạo mới
      const license = bookingData.vehicleInfo.licensePlate.trim()
      if (!license) throw new Error('Thiếu biển số xe')
      console.log('License plate:', license)

      // Thử lấy danh sách xe của khách và tìm theo biển số
      let vehicleId: number | null = null
      try {
        console.log('Getting customer vehicles...')
        const list = await VehicleService.getCustomerVehicles(customerId)
        console.log('Customer vehicles response:', list)
        const found = list?.data?.vehicles?.find?.((v: any) => (v.licensePlate || '').toLowerCase() === license.toLowerCase())
        if (found?.vehicleId) {
          vehicleId = Number(found.vehicleId)
          console.log('Found existing vehicle ID:', vehicleId)
        }
      } catch (error) {
        console.error('Error getting customer vehicles:', error)
      }

      // Nếu chưa có, thử API search theo VIN/biển số
      if (!vehicleId) {
        try {
          console.log('Searching vehicle by license...')
          const sr = await VehicleService.searchVehicle(license)
          console.log('Vehicle search response:', sr)
          if (sr?.data?.vehicleId) {
            vehicleId = Number(sr.data.vehicleId)
            console.log('Found vehicle by search ID:', vehicleId)
          }
        } catch (error) {
          console.error('Error searching vehicle:', error)
        }
      }

      // Nếu vẫn chưa có, tạo xe mới
      if (!vehicleId) {
        console.log('Creating new vehicle...')
        const createVeh = await VehicleService.createVehicle({
          customerId,
          vin: bookingData.vehicleInfo.carModel || 'UNKNOWN',
          licensePlate: license,
          color: 'Unknown',
          currentMileage: Number(bookingData.vehicleInfo.mileage || 0),
          lastServiceDate: undefined,
          purchaseDate: undefined
        })
        console.log('Create vehicle response:', createVeh)
        vehicleId = Number(createVeh?.data?.vehicleId)
        console.log('Created vehicle ID:', vehicleId)
      }

      if (!vehicleId) throw new Error('Không thể xác định VehicleID')

      // Choose serviceId or packageCode
      let serviceId: number | undefined = undefined
      if (bookingData.serviceInfo.services.length > 0) {
        // Get the selected service ID from bookingData.serviceInfo.services
        const selectedServiceIdStr = bookingData.serviceInfo.services[0]
        console.log('Selected service ID string:', selectedServiceIdStr)
        
        // Convert string to number
        const selectedServiceIdNum = Number(selectedServiceIdStr)
        if (!isNaN(selectedServiceIdNum) && selectedServiceIdNum > 0) {
          serviceId = selectedServiceIdNum
          console.log('Using selected service ID:', serviceId)
        } else {
          console.error('Invalid service ID:', selectedServiceIdStr)
          throw new Error('Dịch vụ không hợp lệ')
        }
      }

      // Hold slot before creating booking
      if (!bookingData.locationTimeInfo.technicianSlotId || !bookingData.locationTimeInfo.centerId) {
        throw new Error('Thiếu slot hoặc trung tâm')
      }
      
      console.log('Location time info:', bookingData.locationTimeInfo)
      console.log('Holding slot...')
      const hold = await holdSlot({
        centerId: Number(bookingData.locationTimeInfo.centerId),
        technicianSlotId: Number(bookingData.locationTimeInfo.technicianSlotId),
        technicianId: Number(bookingData.locationTimeInfo.technicianId) || 0,
        date: bookingData.locationTimeInfo.date
      })
      console.log('Hold response:', hold)

      // Create booking
      const bookingPayload = {
        customerId,
        vehicleId: Number(vehicleId),
        centerId: Number(bookingData.locationTimeInfo.centerId),
        bookingDate: bookingData.locationTimeInfo.date,
        technicianSlotId: Number(bookingData.locationTimeInfo.technicianSlotId),
        technicianId: Number(bookingData.locationTimeInfo.technicianId),
        specialRequests: bookingData.serviceInfo.notes || "Không có yêu cầu đặc biệt",
        serviceId: serviceId || undefined
      }
       console.log('Creating booking with data:', bookingPayload)
       const resp = await createBooking(bookingPayload)
       console.log('Booking created successfully:', resp)

       // Extract bookingId from response - check different possible structures
       let bookingId: number | null = null
       
       // Log full response to debug
       console.log('Full booking response:', JSON.stringify(resp, null, 2))
       
       // Try different possible response structures
       if (resp && typeof resp === 'object') {
         // Direct properties
         if ('bookingId' in resp && resp.bookingId) {
           bookingId = Number(resp.bookingId)
         } else if ('id' in resp && resp.id) {
           bookingId = Number(resp.id)
         } else if ('data' in resp && resp.data && typeof resp.data === 'object') {
           // Nested data object
           if ('bookingId' in resp.data && resp.data.bookingId) {
             bookingId = Number(resp.data.bookingId)
           } else if ('id' in resp.data && resp.data.id) {
             bookingId = Number(resp.data.id)
           }
         }
       }
       
       console.log('Extracted booking ID:', bookingId)
       
       if (!bookingId || isNaN(bookingId)) {
         console.error('Invalid booking ID:', bookingId, 'from response:', resp)
         // Redirect to booking success page even without valid booking ID
         const fallbackUrl = `/booking-success?bookingId=unknown&amount=${finalTotalPrice}`
         window.location.href = fallbackUrl
         return
       }

       // Payment link - redirect to QR payment page
       try {
         const link = await createBookingPaymentLink(bookingId)
         console.log('Payment link response:', link)
         if (link?.checkoutUrl) {
           // Redirect to QR payment page to show QR code
           const qrUrl = `/payment-qr?bookingId=${bookingId}&paymentUrl=${encodeURIComponent(link.checkoutUrl)}&amount=${finalTotalPrice}`
           console.log('Redirecting to QR payment page:', qrUrl)
           window.location.href = qrUrl
           return
         } else {
           console.warn('No checkoutUrl in payment response:', link)
           // For debugging, redirect to debug page
           const debugUrl = `/qr-debug?bookingId=${bookingId}&paymentUrl=${encodeURIComponent(JSON.stringify(link))}&amount=${finalTotalPrice}`
           console.log('Redirecting to debug page:', debugUrl)
           window.location.href = debugUrl
           return
         }
       } catch (paymentError) {
         console.error('Payment link error:', paymentError)
       }

       // Fallback: redirect to booking success page (no payment required)
       console.log('No payment URL available, redirecting to booking success')
       const fallbackUrl = `/booking-success?bookingId=${bookingId}&amount=${finalTotalPrice}`
       window.location.href = fallbackUrl
    } catch (error: any) {
      console.error('Error submitting booking:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error message:', error.message)
      
      // Show user-friendly error message - redirect to payment cancel page
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo đặt lịch'
      const cancelUrl = `/payment-cancel?reason=BOOKING_FAILED&error=${encodeURIComponent(errorMessage)}`
      window.location.href = cancelUrl
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
              serviceId={currentServiceId}
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
              serviceId={currentServiceId}
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
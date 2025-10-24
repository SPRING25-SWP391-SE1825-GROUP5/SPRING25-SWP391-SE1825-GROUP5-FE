import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { PayOSService } from '@/services/payOSService'

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
  bookingId?: string // Add booking ID
  customerInfo: CustomerInfo
  vehicleInfo: VehicleInfo
  serviceInfo: ServiceInfo
  locationTimeInfo: LocationTimeInfo
  accountInfo?: AccountInfo
  images: File[]
  guestCustomerId?: number // Thêm customerId của khách vãng lai
  promotionInfo?: {
    promotionCode?: string
    discountAmount?: number
  }
}

interface ServiceBookingFormProps {
  forceGuestMode?: boolean
  promotionInfo?: {
    promotionCode?: string
    discountAmount?: number
  }
}

const ServiceBookingForm: React.FC<ServiceBookingFormProps> = ({ forceGuestMode = false }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGuest, setIsGuest] = useState(true) // Mặc định là khách vãng lai
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentServiceId, setCurrentServiceId] = useState<number | undefined>(undefined)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    images: [],
    promotionInfo: {
      promotionCode: undefined,
      discountAmount: 0
    }
  })

  // Đồng bộ trạng thái đăng nhập và tự điền thông tin khách hàng
  useEffect(() => {
    // Nếu forceGuestMode = true, luôn ở guest mode
    if (forceGuestMode) {
      setIsGuest(true)
      return
    }

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
  }, [auth?.token, auth?.user, forceGuestMode])

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
      // Khách vãng lai: 4 bước (1. Thông tin liên hệ -> 2. Dịch vụ & Xe -> 3. Địa điểm & Thời gian -> 4. Xác nhận)
      switch (step) {
        case 1:
          return !!(bookingData.customerInfo.fullName && bookingData.customerInfo.phone && bookingData.customerInfo.email)
        case 2:
          return (
            bookingData.serviceInfo.services.length > 0 &&
            !!bookingData.vehicleInfo.carModel &&
            !!bookingData.vehicleInfo.licensePlate
          )
        case 3:
          return !!(bookingData.locationTimeInfo.centerId && bookingData.locationTimeInfo.technicianId && bookingData.locationTimeInfo.date && bookingData.locationTimeInfo.time)
        case 4:
          return false // Bước xác nhận chỉ hoàn thành khi đã submit thành công
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
          return false // Bước xác nhận chỉ hoàn thành khi đã submit thành công
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

  const updateBookingData = (section: keyof BookingData, data: Record<string, any>) => {
    setBookingData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), ...data }
    }))
  }

  const handleGuestCustomerCreated = (customerId: number) => {
    console.log('Guest customer created with ID:', customerId)
    setBookingData(prev => {
      console.log('Setting guestCustomerId in bookingData:', customerId)
      return {
        ...prev,
        guestCustomerId: customerId
      }
    })
  }

  const handleSubmit = async () => {
    try {
      console.log('=== STARTING BOOKING SUBMISSION ===')
      console.log(' Booking data:', JSON.stringify(bookingData, null, 2))
      console.log('guestCustomerId:', bookingData.guestCustomerId)
      
      // Validate required fields first
      const validationErrors: string[] = []
      
      if (!bookingData.customerInfo.fullName?.trim()) {
        validationErrors.push('Thiếu họ tên khách hàng')
      }
      if (!bookingData.customerInfo.phone?.trim()) {
        validationErrors.push('Thiếu số điện thoại')
      }
      if (!bookingData.customerInfo.email?.trim()) {
        validationErrors.push('Thiếu email')
      }
      if (!bookingData.vehicleInfo.licensePlate?.trim()) {
        validationErrors.push('Thiếu biển số xe')
      }
      if (!bookingData.vehicleInfo.carModel?.trim()) {
        validationErrors.push('Thiếu dòng xe')
      }
      if (!bookingData.serviceInfo.services?.length) {
        validationErrors.push('Chưa chọn dịch vụ')
      }
      if (!bookingData.locationTimeInfo.centerId) {
        validationErrors.push('Chưa chọn trung tâm')
      }
      if (!bookingData.locationTimeInfo.technicianId) {
        validationErrors.push('Chưa chọn kỹ thuật viên')
      }
      if (!bookingData.locationTimeInfo.date) {
        validationErrors.push('Chưa chọn ngày')
      }
      if (!bookingData.locationTimeInfo.time) {
        validationErrors.push('Chưa chọn giờ')
      }
      if (!bookingData.locationTimeInfo.technicianSlotId) {
        validationErrors.push('Chưa chọn slot kỹ thuật viên')
      }
      
      if (validationErrors.length > 0) {
        console.error('Validation errors:', validationErrors)
        alert('Dữ liệu không hợp lệ:\n' + validationErrors.join('\n'))
        return
      }

      // Ensure customer exists for guest/staff flow (Plan A)
      // If in guest mode and guestCustomerId not set, create a quick customer first
      let ensuredGuestCustomerId: number | undefined = bookingData.guestCustomerId
      if (isGuest && !ensuredGuestCustomerId) {
        try {
          console.log('Guest flow detected and no guestCustomerId. Creating quick customer...')
          const { fullName, phone, email } = bookingData.customerInfo
          if (!fullName || !phone || !email) {
            throw new Error('Thiếu thông tin khách hàng để tạo nhanh (họ tên/số điện thoại/email)')
          }
          const quick = await CustomerService.quickCreateCustomer({
            fullName,
            phoneNumber: phone,
            email
          })
          const createdId = quick?.data?.customerId
          if (!createdId) {
            throw new Error('Không lấy được customerId sau khi tạo nhanh')
          }
          ensuredGuestCustomerId = createdId
          // Persist to bookingData for subsequent steps/navigation
          setBookingData(prev => ({ ...prev, guestCustomerId: createdId }))
        } catch (e) {
          console.error('Failed to quick-create guest customer:', e)
          alert('Không thể tạo khách vãng lai. Vui lòng kiểm tra lại thông tin liên hệ hoặc thử lại.')
          return
        }
      }

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
      let me: any = null
      if (!isGuest) {
        me = await CustomerService.getCurrentCustomer()
        console.log('Current customer response:', me)
      } else {
        console.log('Skip getCurrentCustomer for guest flow')
      }
      
      // Sử dụng guestCustomerId nếu có (khi staff tạo booking cho khách vãng lai)
      let customerId: number | null = null
      if (ensuredGuestCustomerId || bookingData.guestCustomerId) {
        customerId = ensuredGuestCustomerId ?? bookingData.guestCustomerId!
        console.log('✅ Using guest customer ID:', customerId)
      } else {
        customerId = me?.data?.customerId || null
        console.log('❌ Using staff customer ID:', customerId, '(guestCustomerId was:', bookingData.guestCustomerId, ')')
      }
      
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
      
      try {
        const hold = await holdSlot({
          centerId: Number(bookingData.locationTimeInfo.centerId),
          technicianSlotId: Number(bookingData.locationTimeInfo.technicianSlotId),
          technicianId: bookingData.locationTimeInfo.technicianId ? Number(bookingData.locationTimeInfo.technicianId) : 0,
          date: bookingData.locationTimeInfo.date
        })
        console.log('Hold response:', hold)
      } catch (holdError: any) {
        console.error('Hold slot error:', holdError)
        // Check if it's a slot conflict error
        if (holdError.response?.data?.message?.includes('Slot đang được giữ bởi người khác') || 
            holdError.message?.includes('Slot đang được giữ bởi người khác')) {
          setSubmitError('Slot này đang được giữ bởi người khác. Vui lòng chọn slot khác hoặc thử lại sau.')
          setIsSubmitting(false)
          return
        }
        // For other hold errors, show generic message
        setSubmitError('Không thể giữ slot này. Vui lòng chọn slot khác hoặc thử lại sau.')
        setIsSubmitting(false)
        return
      }

      // Create booking
      const bookingPayload = {
        customerId,
        vehicleId: Number(vehicleId),
        centerId: Number(bookingData.locationTimeInfo.centerId),
        bookingDate: bookingData.locationTimeInfo.date,
        technicianSlotId: Number(bookingData.locationTimeInfo.technicianSlotId),
        technicianId: bookingData.locationTimeInfo.technicianId ? Number(bookingData.locationTimeInfo.technicianId) : undefined,
        specialRequests: bookingData.serviceInfo.notes || "Không có yêu cầu đặc biệt",
        serviceId: serviceId || undefined,
        // Thêm currentMileage và licensePlate
        currentMileage: Number(bookingData.vehicleInfo.mileage || 0),
        licensePlate: bookingData.vehicleInfo.licensePlate
      }
       console.log('Creating booking with data:', bookingPayload)
       const resp = await createBooking(bookingPayload)
       console.log('Booking created successfully:', resp)

       // Extract bookingId from response - check different possible structures
       let bookingId: string | null = null
       
       // Log full response to debug
       console.log('Full booking response:', JSON.stringify(resp, null, 2))
       
       // Try different possible response structures
       if (resp && typeof resp === 'object') {
         // Direct properties
         if ('bookingId' in resp && resp.bookingId) {
           bookingId = String(resp.bookingId)
         } else if ('id' in resp && resp.id) {
           bookingId = String(resp.id)
         } else if ('data' in resp && resp.data && typeof resp.data === 'object') {
           // Nested data object
           if ('bookingId' in resp.data && resp.data.bookingId) {
             bookingId = String(resp.data.bookingId)
           } else if ('id' in resp.data && resp.data.id) {
             bookingId = String(resp.data.id)
           }
         }
       }
       
       console.log('Extracted booking ID:', bookingId)
       console.log('Full response data:', resp.data)
       
       if (!bookingId) {
         console.error('Invalid booking ID:', bookingId, 'from response:', resp)
         console.log('Response structure:', {
           hasData: !!resp.data,
           dataKeys: resp.data ? Object.keys(resp.data) : 'no data',
           dataValues: resp.data
         })
         // Redirect to booking success page even without valid booking ID
         const fallbackUrl = `/booking-success?bookingId=unknown&amount=${finalTotalPrice}`
         window.location.href = fallbackUrl
         return
       }

      // Update bookingData with bookingId
      setBookingData(prev => ({
        ...prev,
        bookingId: bookingId
      }))

      // Tạo PayOS payment link và redirect trực tiếp đến PayOS checkout
      console.log('Creating PayOS payment link for booking ID:', bookingId)
      const paymentResponse = await PayOSService.createPaymentLink(Number(bookingId))
      
      if (paymentResponse.success && paymentResponse.data?.checkoutUrl) {
        console.log('PayOS payment link created successfully:', paymentResponse.data.checkoutUrl)
        
        // Redirect trực tiếp đến PayOS checkout - đơn giản như ban đầu
        console.log('Redirecting to PayOS checkout...')
        window.location.href = paymentResponse.data.checkoutUrl
        
        // Đánh dấu bước cuối cùng là completed khi booking được tạo thành công
        const finalStep = isGuest ? 4 : 3
        setCompletedSteps(prev => [...prev.filter(step => step !== finalStep), finalStep])
      } else {
        console.error('Failed to create PayOS payment link:', paymentResponse.message)
        setSubmitError('Không thể tạo link thanh toán: ' + (paymentResponse.message || 'Lỗi không xác định'))
      }
      return
    } catch (error: any) {
      console.error('Error submitting booking:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error message:', error.message)
      
      // Show user-friendly error message directly on the page
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo đặt lịch'
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
  // Logic điều hướng thông minh dựa trên trạng thái đăng nhập
  if (isGuest) {
      // Khách vãng lai: 4 bước (1. Thông tin liên hệ -> 2. Dịch vụ & Xe -> 3. Địa điểm & Thời gian -> 4. Xác nhận)
      switch (currentStep) {
        case 1:
          return (
            <CustomerInfoStep
              data={bookingData.customerInfo}
              onUpdate={(data) => updateBookingData('customerInfo', data)}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )
        case 2:
          return (
            <CombinedServiceVehicleStep
              vehicleData={bookingData.vehicleInfo}
              serviceData={bookingData.serviceInfo}
              onUpdateVehicle={(data) => updateBookingData('vehicleInfo', data)}
              onUpdateService={(data) => updateBookingData('serviceInfo', data)}
              onNext={handleNext}
              onPrev={handlePrev}
              customerInfo={isGuest ? bookingData.customerInfo : undefined}
              onGuestCustomerCreated={handleGuestCustomerCreated}
            />
          )
        case 3:
          return (
            <LocationTimeStep
              data={bookingData.locationTimeInfo}
              onUpdate={(data) => updateBookingData('locationTimeInfo', data)}
              onNext={handleNext}
              onPrev={handlePrev}
              serviceId={currentServiceId}
            />
          )
        case 4:
          return (
            <ConfirmationStep
              data={bookingData}
              isGuest={isGuest}
              onSubmit={handleSubmit}
              onPrev={handlePrev}
              isSubmitting={isSubmitting}
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
              customerInfo={undefined} // User đã đăng nhập, không cần guest info
              onGuestCustomerCreated={handleGuestCustomerCreated}
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
              isSubmitting={isSubmitting}
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

      {/* Error Display */}
      {submitError && (
        <div className="error-alert">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-message">
              <h3>Không thể đặt lịch</h3>
              <p>{submitError}</p>
            </div>
            <button 
              className="error-close"
              onClick={() => setSubmitError(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

        .error-alert {
          margin-bottom: 2rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 1rem;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .error-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .error-message {
          flex: 1;
        }

        .error-message h3 {
          color: #dc2626;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        .error-message p {
          color: #991b1b;
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.4;
        }

        .error-close {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .error-close:hover {
          background: #fecaca;
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
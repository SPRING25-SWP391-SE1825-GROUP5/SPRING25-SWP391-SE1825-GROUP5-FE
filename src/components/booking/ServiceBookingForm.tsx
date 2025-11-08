import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { getCurrentUser, type User } from '@/store/authSlice'
import { User as UserIcon, Car, Wrench, MapPin, UserPlus, CheckCircle } from 'lucide-react'
import StepsProgressIndicator from './StepsProgressIndicator'
import CustomerInfoStep from './CustomerInfoStep'
import CombinedServiceVehicleStep from './CombinedServiceVehicleStep'
import LocationTimeStep from './LocationTimeStep'
import AccountStep from './AccountStep'
import ConfirmationStep from './ConfirmationStep'
import BookingSummary from './BookingSummary'
import { VehicleService } from '@/services/vehicleService'
import { CustomerService } from '@/services/customerService'
import { ServiceManagementService } from '@/services/serviceManagementService'
import { createBooking, holdSlot, releaseHold } from '@/services/bookingFlowService'
import { PromotionBookingService } from '@/services/promotionBookingService'

// Types
interface CustomerInfo {
  fullName: string
  phone: string
  email: string
}

interface VehicleInfo {
  carModel: string
  modelId?: number
  mileage: string
  // Km gần đây (người dùng nhập để cập nhật km hiện tại của xe nếu có)
  recentMileage?: string
  licensePlate: string
  year?: string
  color?: string
  brand?: string
  // Bảo dưỡng fields
  lastMaintenanceDate?: string
  purchaseDate?: string // Ngày mua xe (dùng khi chưa bảo dưỡng)
  hasMaintenanceHistory?: boolean // Đã bảo dưỡng chưa?
  // Sửa chữa fields
  vehicleCondition?: string
  repairChecklist?: string[]
  repairImages?: File[]
}

interface ServiceInfo {
  services: string[]
  notes: string
  packageId?: number
  packageCode?: string
  categoryId?: number
}

interface LocationTimeInfo {
  centerId: string
  technicianId: string
  address?: string
  date: string
  time: string
  technicianSlotId?: number
  centerName?: string
  technicianName?: string
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
  showStepper?: boolean
  externalStep?: number
  onStateChange?: (state: { currentStep: number; completedSteps: number[]; isGuest: boolean }) => void
  progressBarProps?: {
    currentStep: number
    completedSteps: number[]
    onStepClick: (step: number) => void
    isGuest: boolean
  }
}

const ServiceBookingForm: React.FC<ServiceBookingFormProps> = ({ forceGuestMode = false, showStepper = true, externalStep, onStateChange, progressBarProps }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGuest, setIsGuest] = useState(true) // Mặc định là khách vãng lai
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentServiceId, setCurrentServiceId] = useState<number | undefined>(undefined)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const auth = useAppSelector((s) => s.auth)
  const dispatch = useAppDispatch()

  const [bookingData, setBookingData] = useState<BookingData>({
    customerInfo: {
      fullName: '',
      phone: '',
      email: ''
    },
    vehicleInfo: {
      carModel: '',
      mileage: '',
      recentMileage: '',
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
  // Nhận điều hướng từ progressbar bên ngoài
  useEffect(() => {
    if (externalStep && externalStep !== currentStep) {
      const maxSteps = isGuest ? 4 : 3
      if (externalStep >= 1 && externalStep <= maxSteps) {
        setCurrentStep(externalStep)
      }
    }
  }, [externalStep, isGuest])

  // Báo trạng thái ra ngoài để progressbar hiển thị đúng
  useEffect(() => {
    onStateChange?.({ currentStep, completedSteps, isGuest })
  }, [currentStep, completedSteps, isGuest, onStateChange])


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
      // Nếu không có phoneNumber, gọi API để lấy profile đầy đủ
      if (!auth.user.phoneNumber) {
        dispatch(getCurrentUser()).then((result) => {
          if (result.payload) {
            const user = result.payload as User
            setBookingData((prev) => ({
              ...prev,
              customerInfo: {
                fullName: user.fullName || prev.customerInfo.fullName,
                phone: user.phoneNumber || prev.customerInfo.phone,
                email: user.email || prev.customerInfo.email
              }
            }))
          }
        })
      } else {
        // Có phoneNumber rồi, dùng luôn
        setBookingData((prev) => ({
          ...prev,
          customerInfo: {
            fullName: auth.user.fullName || prev.customerInfo.fullName,
            phone: auth.user.phoneNumber || prev.customerInfo.phone,
            email: auth.user.email || prev.customerInfo.email
          }
        }))
      }

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
    setBookingData(prev => ({
        ...prev,
        guestCustomerId: customerId
    }))
  }

  const handleSubmit = async () => {
    try {
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
        alert('Dữ liệu không hợp lệ:\n' + validationErrors.join('\n'))
        return
      }

      // Ensure customer exists for guest/staff flow (Plan A)
      // If in guest mode and guestCustomerId not set, create a quick customer first
      let ensuredGuestCustomerId: number | undefined = bookingData.guestCustomerId
      if (isGuest && !ensuredGuestCustomerId) {
        try {
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
          return await sum
        }
      }, Promise.resolve(0))

      const finalTotalPrice = await totalPrice
      // apply promotion if available from ConfirmationStep persisted into bookingData
      const payableAmount = Math.max(0, finalTotalPrice - (bookingData.promotionInfo?.discountAmount || 0))


      // Resolve current user -> customerId
      let me: any = null
      if (!isGuest) {
        me = await CustomerService.getCurrentCustomer()
      }

      // Sử dụng guestCustomerId nếu có (khi staff tạo booking cho khách vãng lai)
      let customerId: number | null = null
      if (ensuredGuestCustomerId || bookingData.guestCustomerId) {
        customerId = ensuredGuestCustomerId ?? bookingData.guestCustomerId!
      } else {
        customerId = me?.data?.customerId || null
      }

      if (!customerId) throw new Error('Không xác định được khách hàng')

      // Resolve vehicle: nếu đã có xe theo biển số -> dùng luôn, ngược lại tạo mới
      const license = bookingData.vehicleInfo.licensePlate.trim()
      if (!license) throw new Error('Thiếu biển số xe')

      // Thử lấy danh sách xe của khách và tìm theo biển số
      let vehicleId: number | null = null
      try {
        const list = await VehicleService.getCustomerVehicles(customerId)
        const found = list?.data?.vehicles?.find?.((v: any) => (v.licensePlate || '').toLowerCase() === license.toLowerCase())
        if (found?.vehicleId) {
          vehicleId = Number(found.vehicleId)
        }
      } catch (error) {
        // Silently fail, will try other methods
      }

      // Nếu chưa có, thử API search theo VIN/biển số
      if (!vehicleId) {
        try {
          const sr = await VehicleService.searchVehicle(license)
          if (sr?.data?.vehicleId) {
            vehicleId = Number(sr.data.vehicleId)
          }
        } catch (error) {
          // Silently fail, will create new vehicle
        }
      }

      // Nếu vẫn chưa có, tạo xe mới
      let createdNewVehicle = false
      if (!vehicleId) {
        const createVeh = await VehicleService.createVehicle({
          customerId,
          vin: bookingData.vehicleInfo.carModel || 'UNKNOWN',
          licensePlate: license,
          color: 'Unknown',
          currentMileage: Number(bookingData.vehicleInfo.mileage || 0),
          lastServiceDate: undefined,
          purchaseDate: undefined,
          modelId: bookingData.vehicleInfo.modelId
        })
        vehicleId = Number(createVeh?.data?.vehicleId)

        createdNewVehicle = true
      }

      if (!vehicleId) throw new Error('Không thể xác định VehicleID')

      // Cập nhật km hiện tại nếu người dùng nhập "Km gần đây" và xe là xe đã tồn tại
      try {
        const recent = bookingData.vehicleInfo.recentMileage
        if (!createdNewVehicle && recent && recent.trim() !== '') {
          const recentNum = Number(recent)
          const baseNum = Number(bookingData.vehicleInfo.mileage || 0)
          if (!isNaN(recentNum) && recentNum >= 0 && recentNum >= baseNum) {

            await VehicleService.updateMileage(Number(vehicleId), { currentMileage: recentNum })
          }
        }
      } catch (updateErr) {
        // Error updating mileage
      }

      // Choose serviceId or packageCode
      let serviceId: number | undefined = undefined
      if (bookingData.serviceInfo.services.length > 0) {
        // Get the selected service ID from bookingData.serviceInfo.services
        const selectedServiceIdStr = bookingData.serviceInfo.services[0]

        // Convert string to number
        const selectedServiceIdNum = Number(selectedServiceIdStr)
        if (!isNaN(selectedServiceIdNum) && selectedServiceIdNum > 0) {
          serviceId = selectedServiceIdNum
        } else {
          throw new Error('Dịch vụ không hợp lệ')
        }
      }

      // Hold slot before creating booking
      if (!bookingData.locationTimeInfo.technicianSlotId || !bookingData.locationTimeInfo.centerId) {
        throw new Error('Thiếu slot hoặc trung tâm')
      }

      try {
        await holdSlot({
          centerId: Number(bookingData.locationTimeInfo.centerId),
          technicianSlotId: Number(bookingData.locationTimeInfo.technicianSlotId),
          technicianId: bookingData.locationTimeInfo.technicianId ? Number(bookingData.locationTimeInfo.technicianId) : 0,
          date: bookingData.locationTimeInfo.date
        })
      } catch (holdError: any) {
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

       const resp = await createBooking(bookingPayload)

       // Extract bookingId from response - check different possible structures
       let bookingId: string | null = null

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

       if (!bookingId) {
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

      // Apply promotion on server BEFORE creating PayOS link so BE has APPLIED record
      try {
        const promoCode = bookingData.promotionInfo?.promotionCode?.trim()
        if (promoCode) {

          const applyRes = await PromotionBookingService.applyPromotionToBooking({ bookingId: Number(bookingId), code: promoCode })

        } else {

        }
      } catch (applyErr) {
        // Error applying promotion
      }

      // Bỏ thanh toán: điều hướng tới trang thành công và thông báo đặt lịch xong (status PENDING)
      try {
        const finalStep = isGuest ? 4 : 3
        setCompletedSteps(prev => [...prev.filter(step => step !== finalStep), finalStep])
      } catch {}

      // Điều hướng trang thành công, truyền bookingId và số tiền để hiển thị nếu cần
      window.location.href = `/booking-success?bookingId=${encodeURIComponent(bookingId)}&amount=${encodeURIComponent(payableAmount)}`
      return
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }

      // Show user-friendly error message directly on the page
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo đặt lịch'
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
              onPromotionChange={(info) => {
                setBookingData(prev => ({
                  ...prev,
                  promotionInfo: info ? { promotionCode: info.promotionCode, discountAmount: info.discountAmount } : { promotionCode: undefined, discountAmount: 0 }
                }))
              }}
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

  // refs để giới hạn chiều cao summary theo vùng nội dung
  const contentRef = useRef<HTMLDivElement | null>(null)
  const summaryFixedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const TOP_OFFSET = 120 // khớp với CSS top của summary fixed
    const updateSummaryMaxHeight = () => {
      const contentEl = contentRef.current
      const summaryEl = summaryFixedRef.current
      if (!contentEl || !summaryEl) return
      const contentRect = contentEl.getBoundingClientRect()
      // Giới hạn tổng: không vượt quá chiều cao nội dung booking và không vượt quá viewport khả dụng
      const viewportCap = Math.max(200, window.innerHeight - (TOP_OFFSET + 20))
      const contentCap = Math.max(200, contentRect.height)
      const maxH = Math.min(viewportCap, contentCap)
      summaryEl.style.setProperty('--summary-max-height', `${Math.floor(maxH)}px`)
    }
    updateSummaryMaxHeight()
    const onResize = () => updateSummaryMaxHeight()
    const onImagesLoad = () => updateSummaryMaxHeight()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    // Khi nội dung form thay đổi (bước khác), chờ next tick rồi đo lại
    const id = setTimeout(updateSummaryMaxHeight, 0)
    // fallback khi hình ảnh/maps load trễ
    window.addEventListener('load', onImagesLoad)
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      window.removeEventListener('load', onImagesLoad)
    }
  }, [currentStep])

  const isConfirmationStep = isGuest ? currentStep === 4 : currentStep === 3

  return (
    <div className="service-booking-form" style={{ paddingRight: isConfirmationStep ? 0 : undefined }}>
      {/* Header */}
      <div className="booking-header">
        <h1 className="booking-title">ĐẶT LỊCH DỊCH VỤ</h1>
      </div>

      {/* Progress Bar dưới tiêu đề */}
      {progressBarProps && (
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0.75rem 1.25rem',
          boxSizing: 'border-box'
        }}>
          <div style={{ maxWidth: '900px', width: '100%' }}>
            <StepsProgressIndicator
              currentStep={progressBarProps.currentStep}
              completedSteps={progressBarProps.completedSteps}
              onStepClick={progressBarProps.onStepClick}
              isGuest={progressBarProps.isGuest}
              orientation="horizontal"
              size="compact"
            />
          </div>
        </div>
      )}

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

      {/* Layout mới: Progress bar ngang ở trên, Form bên trái, Summary bên phải */}
      {showStepper && (
        <StepsProgressIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          isGuest={isGuest}
          orientation="horizontal"
          size="default"
        />
      )}

      <div className="booking-body">
        <div className="booking-content" ref={contentRef}>
          {renderCurrentStep()}
        </div>
        {/* Summary chỉ hiển thị trước bước xác nhận */}
        {!isConfirmationStep && (
          <div className="summary-spacer">
            <div className="booking-summary-inline">
              <BookingSummary
                customerInfo={isGuest ? bookingData.customerInfo : undefined}
                vehicleInfo={bookingData.vehicleInfo}
                serviceInfo={bookingData.serviceInfo}
                locationTimeInfo={bookingData.locationTimeInfo}
                promotionInfo={bookingData.promotionInfo}
                isGuest={isGuest}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bỏ bản fixed; dùng sticky trong cột phải của booking-body */}

      {/* CSS Styles */}
      <style>{`
        .service-booking-form {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 0;
          background: transparent;
          min-height: 100vh;
          box-sizing: border-box;
          position: relative;
          left: 0;
          right: 0;
        }

        .booking-header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1.5rem 1.25rem 0 1.25rem;
        }

        .booking-body {
          display: grid;
          grid-template-columns:6.5fr 2fr;
          gap: 1.5rem;
          align-items: start;
          padding: 1.25rem;
        }

        /* Spacer cột phải để giữ layout 2 cột */
        .summary-spacer { min-height: 1px; }

        /* Inline summary hiển thị cả desktop, sticky xử lý trong BookingSummary */
        .booking-summary-inline { display: block; }

        /* Responsive */
        @media (max-width: 1280px) {
        }

        @media (max-width: 1024px) {
          .booking-body { grid-template-columns: 1fr; }
          .booking-summary-inline { display: block; }
          .service-booking-form { padding-right: 0; }
        }

        .booking-summary-sidebar {
          position: sticky;
          top: 80px; // chừa khoảng cho tiêu đề/progressbar
          align-self: start;
          z-index: 2;
          height: fit-content;
          max-height: calc(100vh - 100px);
          overflow: auto;
        }

        .booking-content {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 18px;
          padding: 2rem;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.28);
          backdrop-filter: blur(14px) saturate(160%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          z-index: 1; // tránh chồng lấn lên sidebar
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

        @media (max-width: 768px) {
          .service-booking-form {
            padding: 0;
          }

          .booking-header {
            padding: 1rem 1rem 0 1rem;
          }

          .booking-body {
            padding: 1rem;
            display: block;
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

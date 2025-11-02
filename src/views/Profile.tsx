import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCurrentUser, syncFromLocalStorage } from '@/store/authSlice'
import { AuthService, VehicleService, BookingService } from '@/services'
import { PromotionBookingService } from '@/services/promotionBookingService'
import { BaseButton, BaseCard, BaseInput } from '@/components/common'
import { 
  validateFullName, 
  validateDOB16,
  validateGender, 
  validateAddress255,
  validateChangePasswordForm
} from '@/utils/validation'
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PencilIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  TruckIcon,
  ClockIcon,
  GiftIcon,
  BellIcon,
  CogIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  TagIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  SparklesIcon,
  BookmarkIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { FeedbackCard } from '@/components/feedback'
import { BookingData } from '@/services/feedbackService'
import { FeedbackData } from '@/components/feedback'
import BookingHistoryCard from '@/components/booking/BookingHistoryCard'
import { feedbackService } from '@/services/feedbackService'
import { CustomerService } from '@/services/customerService'
import api from '@/services/api'

import './profile.scss'

// FontAwesome icons for maintenance stats and messages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHistory, faCheckCircle, faStar, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

interface UserProfile {
  fullName: string
  email: string
  phoneNumber: string
  address: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | ''
  avatarUrl: string
}

interface Vehicle {
  vehicleId: number
  customerId: number
  vin: string
  licensePlate: string
  color: string
  currentMileage: number
  lastServiceDate?: string | null
  purchaseDate?: string | null
  nextServiceDue?: string | null
  createdAt: string
  customerName?: string
  customerPhone?: string
  modelId?: number | null
}

interface CreateVehicleRequest {
  customerId: number
  modelId: number
  vin: string
  licensePlate: string
  color: string
  currentMileage: number
  lastServiceDate?: string
  purchaseDate?: string
}

interface VehicleModel {
  modelId: number
  modelName: string
  brand?: string
}

interface FormErrors {
  fullName?: string
  email?: string
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  gender?: string
}

export default function Profile() {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((s) => s.auth)
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'favorites' | 'list' | 'continue-watching' | 'notifications' | 'profile' | 'vehicles' | 'service-history' | 'promo-codes' | 'settings' | 'maintenance'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Vehicle states
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false)
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // Booking history states
  const [bookingHistory, setBookingHistory] = useState<any[]>([])
  const [isLoadingBookingHistory, setIsLoadingBookingHistory] = useState(false)
  const [bookingHistoryPage, setBookingHistoryPage] = useState(1)
  const [bookingHistoryTotalPages, setBookingHistoryTotalPages] = useState(1)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const HISTORY_PAGE_SIZE = 10

  const [vehicleFormData, setVehicleFormData] = useState<CreateVehicleRequest>({
    customerId: 0,
    modelId: 0,
    vin: '',
    licensePlate: '',
    color: '',
    currentMileage: 0,
    lastServiceDate: '',
    purchaseDate: ''
  })
  const [vehicleFormErrors, setVehicleFormErrors] = useState<Record<string, string>>({})
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [isDeletingVehicle, setIsDeletingVehicle] = useState<number | null>(null)
  // Maintenance History states
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null)
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Promotions states
  const [savedPromotions, setSavedPromotions] = useState<any[]>([])
  const [promotionsLoading, setPromotionsLoading] = useState(false)
  const [promotionsError, setPromotionsError] = useState<string | null>(null)
  
  // Pagination states for promotions
  const [currentPromotionPage, setCurrentPromotionPage] = useState(1)
  const [promotionsPerPage] = useState(10)
  const [totalPromotions, setTotalPromotions] = useState(0)

  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    avatarUrl: ''
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const [successMessage, setSuccessMessage] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    // Sync from localStorage first
    dispatch(syncFromLocalStorage())
    // Then load profile data
    loadProfileData()
  }, [dispatch])

  // Handle tab from URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'booking-history') {
      setActiveTab('service-history')
    }
  }, [searchParams])

  useEffect(() => {
    if (activeTab === 'vehicles') {
      loadVehicles()
    }
  }, [activeTab, auth.user?.id])

  // Load customerId when component mounts or when needed
  useEffect(() => {
    if (auth.user?.id && !customerId) {
      loadCustomerId()
    }
  }, [auth.user?.id, customerId])

  // Load saved promotions when promo-codes tab is active
  useEffect(() => {
    if (activeTab === 'promo-codes' && auth.user?.id) {
      // loadSavedPromotions() will handle loading customerId if needed
      loadSavedPromotions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, auth.user?.id])

  // Load vehicle models when form is opened
  useEffect(() => {
    if (showVehicleForm && vehicleModels.length === 0) {
      loadVehicleModels()
    }
  }, [showVehicleForm])

  useEffect(() => {
    console.log('🔄 useEffect triggered, activeTab:', activeTab, 'auth.user?.id:', auth.user?.id)
    if (activeTab === 'service-history') {
      console.log('📡 Loading booking history from useEffect')
      loadBookingHistory()
    }
  }, [activeTab, auth.user?.id, bookingHistoryPage])

  // Load maintenance history data
  const loadMaintenanceData = async () => {
    setMaintenanceLoading(true)
    setMaintenanceError(null)
    try {
      const data = await feedbackService.getBookingsWithFeedback()
      setBookings(data)
      
      // Set first booking as expanded by default
      if (data.length > 0) {
        setExpandedBookings(new Set([data[0].id]))
      }
    } catch (err: any) {
      setMaintenanceError('Không thể tải dữ liệu lịch sử bảo dưỡng')
      console.error('Error loading maintenance data:', err)
    } finally {
      setMaintenanceLoading(false)
    }
  }

  // Handle toggle expand for booking cards
  const handleToggleExpand = (bookingId: string) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId)
      } else {
        newSet.add(bookingId)
      }
      return newSet
    })
  }


  // Handle feedback submission (legacy for maintenance tab)
  const handleSubmitFeedback = async (bookingId: string, feedback: FeedbackData) => {
    try {
      await feedbackService.submitFeedback(bookingId, 0, feedback)
      // Reload data to show updated feedback
      await loadMaintenanceData()
    } catch (err: any) {
      setMaintenanceError('Không thể gửi đánh giá')
      console.error('Error submitting feedback:', err)
    }
  }

  // Handle feedback update (legacy for maintenance tab)
  const handleEditFeedback = async (bookingId: string, feedback: FeedbackData) => {
    try {
      await feedbackService.updateFeedback(Number(bookingId), feedback)
      // Reload data to show updated feedback
      await loadMaintenanceData()
    } catch (err: any) {
      setMaintenanceError('Không thể cập nhật đánh giá')
      console.error('Error updating feedback:', err)
    }
  }

  const loadProfileData = async () => {
    try {
      const response = await AuthService.getProfile()
      console.log('Profile API response:', response) // Debug log
      if (response.success && response.data) {
        // Update local state
        setProfileData({
          fullName: response.data.fullName || '',
          email: response.data.email || '',
          phoneNumber: response.data.phoneNumber || '',
          address: response.data.address || '',
          dateOfBirth: response.data.dateOfBirth || '',
          gender: (response.data.gender as 'MALE' | 'FEMALE') || '',
          avatarUrl: response.data.avatar || ''
        })
        
        // Update Redux store
        dispatch(getCurrentUser())
        
        console.log('Profile data set:', {
          fullName: response.data.fullName || '',
          email: response.data.email || '',
          phoneNumber: response.data.phoneNumber || '',
          address: response.data.address || '',
          dateOfBirth: response.data.dateOfBirth || '',
          gender: (response.data.gender as 'MALE' | 'FEMALE') || '',
          avatarUrl: response.data.avatar || ''
        }) // Debug log
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadVehicles = async () => {
    if (!auth.user?.id) {
      return
    }

    setIsLoadingVehicles(true)
    try {
      // Get customerId if not available
      let currentCustomerId = customerId
      if (!currentCustomerId) {
        currentCustomerId = await loadCustomerId()
        if (!currentCustomerId) {
          setVehicles([])
          setIsLoadingVehicles(false)
          return
        }
      }

      const response = await VehicleService.getCustomerVehicles(currentCustomerId)
      
      if (response.success && response.data?.vehicles) {
        setVehicles(response.data.vehicles)
      } else {
        setVehicles([])
      }
    } catch (error: unknown) {
      console.error('Error loading vehicles:', error)
      setVehicles([])
      
      // Show user-friendly error message
      const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Không thể tải danh sách phương tiện'
      setSuccessMessage('') // Clear any success message
      setUploadError(errorMessage)
      
      // Auto hide error message after 5 seconds
      setTimeout(() => {
        setUploadError('')
      }, 5000)
    } finally {
      setIsLoadingVehicles(false)
    }
  }

  // Load vehicle models
  const loadVehicleModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await api.get('/VehicleModel/active')
      let models = response.data
      
      // Handle nested response structure
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        models = response.data.data || response.data.models || response.data.items || response.data
      }
      
      setVehicleModels(models || [])
    } catch (error: unknown) {
      console.error('Error loading vehicle models:', error)
      setVehicleModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  // Load saved promotions for customer
  const loadSavedPromotions = async () => {
    if (!auth.user?.id) {
      console.warn('loadSavedPromotions: User not authenticated')
      return
    }

    console.log('🔄 Starting loadSavedPromotions, customerId:', customerId)
    setPromotionsLoading(true)
    setPromotionsError(null)
    
    try {
      // Get customerId if not available
      let currentCustomerId = customerId
      if (!currentCustomerId) {
        console.log('📋 CustomerId not available, loading...')
        currentCustomerId = await loadCustomerId()
        if (!currentCustomerId) {
          console.error('❌ Cannot load promotions: customerId not available')
          setSavedPromotions([])
          setTotalPromotions(0)
          setPromotionsError('Không thể tải thông tin khách hàng')
          setPromotionsLoading(false)
          return
        }
        console.log('✅ CustomerId loaded:', currentCustomerId)
      }

      console.log('📡 Loading saved promotions for customerId:', currentCustomerId)
      const promotions = await PromotionBookingService.getCustomerPromotions(currentCustomerId)
      console.log('📦 Saved promotions response:', promotions)
      console.log('📦 Response type:', Array.isArray(promotions) ? 'array' : typeof promotions)
      console.log('📦 Response length:', Array.isArray(promotions) ? promotions.length : 'not array')
      
      if (!promotions || !Array.isArray(promotions)) {
        console.warn('⚠️ Invalid promotions response format:', promotions)
        setSavedPromotions([])
        setTotalPromotions(0)
        return
      }

      // Hiển thị tất cả promotions (SAVED, APPLIED, USED)
      // Backend trả về: userPromotionStatus (SAVED, APPLIED, USED) và status (ACTIVE, EXPIRED từ Promotion)
      // UI sẽ map thành 2 trạng thái: "Có thể sử dụng" (SAVED/APPLIED) và "Đã sử dụng" (USED)
      const filteredPromotions = promotions.filter((p: any) => {
        // Sử dụng userPromotionStatus thay vì status vì đây mới là trạng thái của user promotion
        const userStatus = String(p.userPromotionStatus || p.status || '').toUpperCase()
        console.log(`🔍 Promotion ${p.code}: userStatus=${userStatus}, status=${p.status}`)
        // Hiển thị tất cả: SAVED, APPLIED và USED
        return userStatus === 'SAVED' || userStatus === 'APPLIED' || userStatus === 'USED'
      })
      
      console.log('✅ Filtered promotions count:', filteredPromotions.length)
      setSavedPromotions(filteredPromotions)
      setTotalPromotions(filteredPromotions.length)
    } catch (error: any) {
      console.error('❌ Error loading saved promotions:', error)
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách mã khuyến mãi'
      setPromotionsError(errorMessage)
      setSavedPromotions([])
      setTotalPromotions(0)
    } finally {
      setPromotionsLoading(false)
    }
  }

  // Calculate pagination for promotions
  const totalPromotionPages = Math.ceil(totalPromotions / promotionsPerPage)
  const startPromotionIndex = (currentPromotionPage - 1) * promotionsPerPage
  const endPromotionIndex = startPromotionIndex + promotionsPerPage
  const currentPromotions = savedPromotions.slice(startPromotionIndex, endPromotionIndex)

  // Handle promotion page change
  const handlePromotionPageChange = (page: number) => {
    setCurrentPromotionPage(page)
  }

  // Load customerId from current user
  const loadCustomerId = async () => {
    if (!auth.user?.id) {
      return null
    }

    try {
      console.log('🔍 Loading customerId for userId:', auth.user.id)
      const response = await CustomerService.getCurrentCustomer()
      console.log('✅ Customer response:', response)
      
      if (response.success && response.data) {
        const customerId = response.data.customerId
        console.log('✅ Found customerId:', customerId)
        setCustomerId(customerId)
        return customerId
      }
      
      return null
    } catch (error) {
      console.error('❌ Error loading customerId:', error)
      return null
    }
  }

  const loadBookingHistory = async () => {
    if (!auth.user?.id) {
      return
    }

    setIsLoadingBookingHistory(true)
    try {
      // First, get customerId from userId
      let currentCustomerId = customerId
      if (!currentCustomerId) {
        currentCustomerId = await loadCustomerId()
        if (!currentCustomerId) {
          throw new Error('Không thể lấy thông tin khách hàng')
        }
      }
      
      console.log('🚀 Loading booking history for customerId:', currentCustomerId)
      // Gọi API khách hàng -> bookings
      const resp = await CustomerService.getCustomerBookings(Number(currentCustomerId), { pageNumber: bookingHistoryPage, pageSize: 10 })

      let bookings, pagination
      if (resp && Array.isArray(resp.data)) {
        bookings = resp.data
        pagination = undefined
      } else if (resp && resp.data && Array.isArray((resp as any).data.bookings)) {
        bookings = (resp as any).data.bookings
        pagination = (resp as any).data.pagination
      } else {
        console.error('❌ Invalid customer bookings response:', resp)
        setBookingHistory([])
        return
      }
      
      console.log('📋 Raw bookings from API:', bookings)
      console.log('📋 Pagination info:', pagination)
      
      // Load feedback for COMPLETED bookings
      console.log('📋 All bookings statuses:', bookings.map(b => ({ id: b.bookingId, status: b.status })))
      
      const bookingsWithFeedback = await Promise.all(
        bookings.map(async (booking: any) => {
          console.log(`🔍 Processing booking ${booking.bookingId} with status: ${booking.status}`)
          
          if (booking.status === 'COMPLETED') {
            try {
              console.log('🔍 Loading feedback for COMPLETED booking:', booking.bookingId)
              const feedback = await feedbackService.getFeedback(booking.bookingId.toString())
              console.log('✅ Feedback loaded for booking', booking.bookingId, ':', feedback)
              
              return {
                ...booking,
                feedback: feedback,
                hasFeedback: !!feedback,
                feedbackId: (feedback as any)?.feedbackId || null
              }
            } catch (error) {
              console.log('⚠️ No feedback found for booking:', booking.bookingId, error)
              return {
                ...booking,
                feedback: null,
                hasFeedback: false,
                feedbackId: null
              }
            }
          } else {
            console.log(`⏭️ Skipping feedback load for booking ${booking.bookingId} with status: ${booking.status}`)
            return {
              ...booking,
              feedback: null,
              hasFeedback: false,
              feedbackId: null
            }
          }
        })
      )
      
      console.log('📊 Final bookings with feedback:', bookingsWithFeedback)
      console.log('📊 Booking history length:', bookingsWithFeedback.length)
      
      // Use real data from API only - no mock/test data
      setBookingHistory(bookingsWithFeedback)
      setBookingHistoryTotalPages(pagination?.totalPages || Math.max(1, Math.ceil(bookingsWithFeedback.length / HISTORY_PAGE_SIZE)))
    } catch (error: unknown) {
      console.error('Error loading booking history:', error)
      setBookingHistory([])
      
      // Show user-friendly error message
      const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Không thể tải lịch sử dịch vụ'
      setSuccessMessage('') // Clear any success message
      setUploadError(errorMessage)
      
      // Auto hide error message after 5 seconds
      setTimeout(() => {
        setUploadError('')
      }, 5000)
    } finally {
      setIsLoadingBookingHistory(false)
    }
  }

  // Xử lý gửi đánh giá
  const handleBookingFeedback = async (bookingId: number, feedback: FeedbackData) => {
    try {
      console.log('📝 Submitting feedback for booking:', bookingId, feedback)
      
      // Get customerId if not available
      let currentCustomerId = customerId
      if (!currentCustomerId) {
        currentCustomerId = await loadCustomerId()
        if (!currentCustomerId) {
          throw new Error('Không thể lấy thông tin khách hàng')
        }
      }
      
      // Prepare feedback data for new API
      const feedbackData = {
        customerId: currentCustomerId,
        rating: feedback.technicianRating, // Use technician rating as main rating
        comment: feedback.comment,
        isAnonymous: false, // User is logged in, so not anonymous
        technicianId: 1, // TODO: Get actual technician ID from booking
        partId: feedback.partsRating > 0 ? 1 : undefined // TODO: Get actual part ID if parts were used
      }
      
      await feedbackService.submitBookingFeedback(bookingId.toString(), feedbackData)
      
      setSuccessMessage('Đánh giá đã được gửi thành công!')
      setUploadError('')
      
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      
      // Reload booking history to show updated feedback
      loadBookingHistory()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setUploadError('Có lỗi xảy ra khi gửi đánh giá')
      setSuccessMessage('')
    }
  }

  // Xử lý sửa đánh giá
  const handleBookingEditFeedback = async (bookingId: number, feedback: FeedbackData) => {
    try {
      console.log('📝 Editing feedback for booking:', bookingId, feedback)
      
      // Get customerId if not available
      let currentCustomerId = customerId
      if (!currentCustomerId) {
        currentCustomerId = await loadCustomerId()
        if (!currentCustomerId) {
          throw new Error('Không thể lấy thông tin khách hàng')
        }
      }
      
      // Prepare feedback data for new API
      const feedbackData = {
        customerId: currentCustomerId,
        rating: feedback.technicianRating, // Use technician rating as main rating
        comment: feedback.comment,
        isAnonymous: false, // User is logged in, so not anonymous
        technicianId: 1, // TODO: Get actual technician ID from booking
        partId: feedback.partsRating > 0 ? 1 : undefined // TODO: Get actual part ID if parts were used
      }
      
      await feedbackService.submitBookingFeedback(bookingId.toString(), feedbackData)
      
      setSuccessMessage('Đánh giá đã được cập nhật thành công!')
      setUploadError('')
      
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      
      // Reload booking history to show updated feedback
      loadBookingHistory()
    } catch (error) {
      console.error('Error editing feedback:', error)
      setUploadError('Có lỗi xảy ra khi cập nhật đánh giá')
      setSuccessMessage('')
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormErrors({})
    // Reset form data to original values
    if (auth.user) {
      setProfileData({
        fullName: auth.user.fullName || '',
        email: auth.user.email || '',
        phoneNumber: auth.user.phoneNumber || '',
        address: auth.user.address || '',
        dateOfBirth: auth.user.dateOfBirth || '',
        gender: (auth.user.gender as 'MALE' | 'FEMALE') || '',
        avatarUrl: auth.user.avatar || ''
      })
    }
  }

  const handleSave = async () => {
    const errors: FormErrors = {}
    
    // Validate required fields
    if (!profileData.fullName.trim()) {
      errors.fullName = 'Họ và tên là bắt buộc'
    } else if (!validateFullName(profileData.fullName)) {
      errors.fullName = 'Họ và tên không hợp lệ'
    }
    
    if (!profileData.email.trim()) {
      errors.email = 'Email là bắt buộc'
    }
    
    if (!profileData.phoneNumber.trim()) {
      errors.phoneNumber = 'Số điện thoại là bắt buộc'
    }
    
    if (!profileData.address.trim()) {
      errors.address = 'Địa chỉ là bắt buộc'
    } else if (!validateAddress255(profileData.address)) {
      errors.address = 'Địa chỉ không được vượt quá 255 ký tự'
    }
    
    if (!profileData.dateOfBirth) {
      errors.dateOfBirth = 'Ngày sinh là bắt buộc'
    } else if (!validateDOB16(profileData.dateOfBirth)) {
      errors.dateOfBirth = 'Bạn phải đủ 16 tuổi'
    }
    
    if (!profileData.gender) {
      errors.gender = 'Giới tính là bắt buộc'
    } else if (!validateGender(profileData.gender)) {
      errors.gender = 'Giới tính không hợp lệ'
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }

    setIsSaving(true)
    try {
      await AuthService.updateProfile({
        fullName: profileData.fullName,
        address: profileData.address,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender as 'MALE' | 'FEMALE',
        email: profileData.email,
        phoneNumber: profileData.phoneNumber
      })
      
      dispatch(getCurrentUser())
      setIsEditing(false)
      setFormErrors({})
      setSuccessMessage('Cập nhật thông tin thành công!')
      
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error: unknown) {
      console.error('API Error:', error)
      
      // Parse API validation errors
      if ((error as any)?.response?.data?.errors) {
        const apiErrors: FormErrors = {}
        const apiErrorData = (error as any).response.data.errors
        
        // Handle array format errors
        if (Array.isArray(apiErrorData)) {
          // If errors is an array, map each error to appropriate field
          apiErrorData.forEach(errorMsg => {
            if (typeof errorMsg === 'string') {
              if (errorMsg.includes('Số điện thoại')) {
                apiErrors.phoneNumber = errorMsg
              } else if (errorMsg.includes('Email')) {
                apiErrors.email = errorMsg
              } else if (errorMsg.includes('Họ tên') || errorMsg.includes('FullName')) {
                apiErrors.fullName = errorMsg
              } else if (errorMsg.includes('Địa chỉ') || errorMsg.includes('Address')) {
                apiErrors.address = errorMsg
              } else if (errorMsg.includes('Ngày sinh') || errorMsg.includes('DateOfBirth')) {
                apiErrors.dateOfBirth = errorMsg
              } else if (errorMsg.includes('Giới tính') || errorMsg.includes('Gender')) {
                apiErrors.gender = errorMsg
              }
            }
          })
        } else {
          // Handle object format errors
          if (apiErrorData.FullName) {
            apiErrors.fullName = Array.isArray(apiErrorData.FullName) ? apiErrorData.FullName[0] : apiErrorData.FullName
          }
          if (apiErrorData.Email) {
            apiErrors.email = Array.isArray(apiErrorData.Email) ? apiErrorData.Email[0] : apiErrorData.Email
          }
          if (apiErrorData.PhoneNumber) {
            apiErrors.phoneNumber = Array.isArray(apiErrorData.PhoneNumber) ? apiErrorData.PhoneNumber[0] : apiErrorData.PhoneNumber
          }
          if (apiErrorData.Address) {
            apiErrors.address = Array.isArray(apiErrorData.Address) ? apiErrorData.Address[0] : apiErrorData.Address
          }
          if (apiErrorData.DateOfBirth) {
            apiErrors.dateOfBirth = Array.isArray(apiErrorData.DateOfBirth) ? apiErrorData.DateOfBirth[0] : apiErrorData.DateOfBirth
          }
          if (apiErrorData.Gender) {
            apiErrors.gender = Array.isArray(apiErrorData.Gender) ? apiErrorData.Gender[0] : apiErrorData.Gender
          }
        }
        
        setFormErrors(apiErrors)
      } else {
        // Fallback error message
      const msg = (error as any)?.response?.data?.message || (error as any)?.message || 'Cập nhật thông tin thất bại'
        console.error(msg)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh')
      return
    }

    try {
      setIsUploadingAvatar(true)
      setUploadError('')
      
      // Upload to server using AuthService
      const response = await AuthService.uploadAvatar(file)
      
      if (response.success) {
        // Update profile data with new avatar URL
        setProfileData(prev => ({ ...prev, avatarUrl: response.data.avatarUrl }))
        
        // Update Redux store
        dispatch(getCurrentUser())
        
        setSuccessMessage('Cập nhật avatar thành công!')
        
        // Auto hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('')
        }, 3000)
      } else {
        throw new Error(response.message || 'Upload thất bại')
      }
    } catch (error: unknown) {
      console.error('Upload avatar error:', error)
      const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Lỗi không xác định'
      setUploadError('Có lỗi xảy ra khi upload avatar: ' + errorMessage)
      
      // Auto hide error message after 5 seconds
      setTimeout(() => {
        setUploadError('')
      }, 5000)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleChangePassword = async () => {
    // Validate form
    const validation = validateChangePasswordForm(passwordData)
    if (!validation.isValid) {
      setPasswordErrors(validation.errors)
      return
    }

    setIsChangingPassword(true)
    setPasswordErrors({})

    try {
      await AuthService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmPassword
      })

      setSuccessMessage('Đổi mật khẩu thành công!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswords({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
      })

      // Auto hide success message
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error: unknown) {
      console.error('Change password error:', error)
      
      // Handle API errors
      if ((error as any)?.response?.data?.errors) {
        const apiErrors = (error as any).response.data.errors
        const nextErrors: Record<string, string> = {}
        
        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((msg: string) => {
            const m = msg.toLowerCase()
            if (m.includes("current") || m.includes("hiện tại")) {
              nextErrors.currentPassword = msg
            }
            if (m.includes("new") || m.includes("mới")) {
              nextErrors.newPassword = msg
            }
            if (m.includes("confirm") || m.includes("xác nhận")) {
              nextErrors.confirmPassword = msg
            }
          })
        } else if (typeof apiErrors === 'object') {
          Object.entries(apiErrors).forEach(([field, messages]) => {
            const fieldName = field.toLowerCase()
            const errorMsg = Array.isArray(messages) ? messages[0] : messages
            
            if (fieldName.includes("current")) {
              nextErrors.currentPassword = errorMsg
            }
            if (fieldName.includes("new")) {
              nextErrors.newPassword = errorMsg
            }
            if (fieldName.includes("confirm")) {
              nextErrors.confirmPassword = errorMsg
            }
          })
        }
        
        setPasswordErrors(nextErrors)
      } else {
        setPasswordErrors({
          currentPassword: (error as any)?.message || 'Có lỗi xảy ra khi đổi mật khẩu'
        })
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')
    
    // Redirect to login page
    window.location.href = '/auth/login'
  }

  // Vehicle functions

  const handleVehicleInputChange = (field: keyof CreateVehicleRequest, value: string | number) => {
    setVehicleFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setVehicleFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleCreateVehicle = async () => {
    if (!auth.user?.id) return

    const errors: Record<string, string> = {}
    
    // Basic validation
    if (!vehicleFormData.modelId || vehicleFormData.modelId <= 0) {
      errors.modelId = 'Model xe là bắt buộc'
    }
    if (!vehicleFormData.vin.trim()) {
      errors.vin = 'VIN không được để trống'
    } else if (vehicleFormData.vin.trim().length !== 17) {
      errors.vin = 'VIN phải có đúng 17 ký tự'
    }
    if (!vehicleFormData.licensePlate.trim()) {
      errors.licensePlate = 'Biển số xe không được để trống'
    }
    if (!vehicleFormData.color.trim()) {
      errors.color = 'Màu sắc không được để trống'
    }
    if (!vehicleFormData.currentMileage || vehicleFormData.currentMileage <= 0) {
      errors.currentMileage = 'Số km hiện tại không được để trống và phải lớn hơn 0'
    }

    if (Object.keys(errors).length > 0) {
      console.log('Vehicle validation errors:', errors) // Debug log
      setVehicleFormErrors(errors)
      return
    }

    setIsCreatingVehicle(true)
    try {
      // Get customerId if not available
      let currentCustomerId = customerId
      if (!currentCustomerId) {
        currentCustomerId = await loadCustomerId()
        if (!currentCustomerId) {
          setVehicleFormErrors({
            general: 'Không thể lấy thông tin khách hàng. Vui lòng thử lại.'
          })
          setIsCreatingVehicle(false)
          return
        }
      }

      // Prepare payload - only include dates if they have values
      const payload: any = {
        customerId: currentCustomerId,
        modelId: vehicleFormData.modelId,
        vin: vehicleFormData.vin.trim(),
        licensePlate: vehicleFormData.licensePlate.trim(),
        color: vehicleFormData.color.trim(),
        currentMileage: vehicleFormData.currentMileage
      }
      
      // Only add optional dates if they have values
      if (vehicleFormData.lastServiceDate && vehicleFormData.lastServiceDate.trim()) {
        payload.lastServiceDate = vehicleFormData.lastServiceDate
      }
      
      console.log('Creating vehicle with payload:', payload) // Debug log
      await VehicleService.createVehicle(payload)
      
      setSuccessMessage('Thêm phương tiện thành công!')
      setShowVehicleForm(false)
      setVehicleFormData({
        customerId: 0,
        modelId: 0,
        vin: '',
        licensePlate: '',
        color: '',
        currentMileage: 0,
        lastServiceDate: '',
        purchaseDate: ''
      })
      setVehicleFormErrors({})
      
      // Reload vehicles
      loadVehicles()
      
      // Auto hide success message
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error: unknown) {
      console.error('Create vehicle error:', error)
      
      // Handle API errors
      if ((error as any)?.response?.data?.errors) {
        const apiErrors = (error as any).response.data.errors
        console.log('Vehicle API errors:', apiErrors) // Debug log
        const nextErrors: Record<string, string> = {}
        
        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((msg: string) => {
            const m = msg.toLowerCase()
            if (m.includes('vin')) nextErrors.vin = msg
            else if (m.includes('biển') || m.includes('license') || m.includes('biển số')) nextErrors.licensePlate = msg
            else if (m.includes('màu') || m.includes('color') || m.includes('màu sắc')) nextErrors.color = msg
            else if (m.includes('km') || m.includes('mileage') || m.includes('số km')) nextErrors.currentMileage = msg
            else if (m.includes('ngày bảo dưỡng') || m.includes('lastservice')) nextErrors.lastServiceDate = msg
            else if (m.includes('ngày mua') || m.includes('purchasedate')) nextErrors.purchaseDate = msg
            else nextErrors.general = msg
          })
        } else if (typeof apiErrors === 'object') {
          Object.entries(apiErrors).forEach(([field, messages]) => {
            const fieldName = field.toLowerCase()
            const errorMsg = Array.isArray(messages) ? messages[0] : messages
            
            // Map backend field names to frontend field names
            if (fieldName === 'vin') nextErrors.vin = errorMsg
            else if (fieldName === 'licenseplate' || fieldName === 'biensoxe') nextErrors.licensePlate = errorMsg
            else if (fieldName === 'color' || fieldName === 'mausac') nextErrors.color = errorMsg
            else if (fieldName === 'currentmileage' || fieldName === 'sokm') nextErrors.currentMileage = errorMsg
            else if (fieldName === 'lastservicedate' || fieldName === 'ngaybaoduong') nextErrors.lastServiceDate = errorMsg
            else if (fieldName === 'purchasedate' || fieldName === 'ngaymua') nextErrors.purchaseDate = errorMsg
            else nextErrors[fieldName] = errorMsg
          })
        }
        
        setVehicleFormErrors(nextErrors)
      } else {
        const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Có lỗi xảy ra khi thêm phương tiện'
        setVehicleFormErrors({
          general: errorMessage
        })
      }
    } finally {
      setIsCreatingVehicle(false)
    }
  }

  // Handle edit vehicle
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setVehicleFormData({
      customerId: vehicle.customerId,
      modelId: vehicle.modelId || 0,
      vin: vehicle.vin,
      licensePlate: vehicle.licensePlate,
      color: vehicle.color,
      currentMileage: vehicle.currentMileage,
      lastServiceDate: vehicle.lastServiceDate || '',
      purchaseDate: vehicle.purchaseDate || ''
    })
    setVehicleFormErrors({})
    setShowVehicleForm(true)
  }

  // Handle update vehicle
  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return

    const errors: Record<string, string> = {}
    
    // Basic validation
    if (!vehicleFormData.vin.trim()) errors.vin = 'VIN không được để trống'
    if (!vehicleFormData.licensePlate.trim()) errors.licensePlate = 'Biển số xe không được để trống'
    if (!vehicleFormData.color.trim()) errors.color = 'Màu sắc không được để trống'
    if (!vehicleFormData.currentMileage || vehicleFormData.currentMileage <= 0) {
      errors.currentMileage = 'Số km hiện tại không được để trống và phải lớn hơn 0'
    }

    if (Object.keys(errors).length > 0) {
      setVehicleFormErrors(errors)
      return
    }

    setIsCreatingVehicle(true)
    try {
      const updateData = {
        color: vehicleFormData.color,
        currentMileage: vehicleFormData.currentMileage,
        lastServiceDate: vehicleFormData.lastServiceDate || undefined,
        purchaseDate: vehicleFormData.purchaseDate || undefined
      }
      
      await VehicleService.updateVehicle(editingVehicle.vehicleId, updateData)
      
      setSuccessMessage('Cập nhật phương tiện thành công!')
      setShowVehicleForm(false)
      setEditingVehicle(null)
      setVehicleFormData({
        customerId: 0,
        modelId: 0,
        vin: '',
        licensePlate: '',
        color: '',
        currentMileage: 0,
        lastServiceDate: '',
        purchaseDate: ''
      })
      setVehicleFormErrors({})
      
      // Reload vehicles
      loadVehicles()
      
      // Auto hide success message
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error: unknown) {
      console.error('Update vehicle error:', error)
      
      // Handle API errors similar to create
      if ((error as any)?.response?.data?.errors) {
        const apiErrors = (error as any).response.data.errors
        const nextErrors: Record<string, string> = {}
        
        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((msg: string) => {
            const m = msg.toLowerCase()
            if (m.includes('vin')) nextErrors.vin = msg
            else if (m.includes('biển') || m.includes('license') || m.includes('biển số')) nextErrors.licensePlate = msg
            else if (m.includes('màu') || m.includes('color') || m.includes('màu sắc')) nextErrors.color = msg
            else if (m.includes('km') || m.includes('mileage') || m.includes('số km')) nextErrors.currentMileage = msg
            else if (m.includes('ngày bảo dưỡng') || m.includes('lastservice')) nextErrors.lastServiceDate = msg
            else if (m.includes('ngày mua') || m.includes('purchasedate')) nextErrors.purchaseDate = msg
            else nextErrors.general = msg
          })
        } else if (typeof apiErrors === 'object') {
          Object.entries(apiErrors).forEach(([field, messages]) => {
            const fieldName = field.toLowerCase()
            const errorMsg = Array.isArray(messages) ? messages[0] : messages
            
            if (fieldName === 'vin') nextErrors.vin = errorMsg
            else if (fieldName === 'licenseplate' || fieldName === 'biensoxe') nextErrors.licensePlate = errorMsg
            else if (fieldName === 'color' || fieldName === 'mausac') nextErrors.color = errorMsg
            else if (fieldName === 'currentmileage' || fieldName === 'sokm') nextErrors.currentMileage = errorMsg
            else if (fieldName === 'lastservicedate' || fieldName === 'ngaybaoduong') nextErrors.lastServiceDate = errorMsg
            else if (fieldName === 'purchasedate' || fieldName === 'ngaymua') nextErrors.purchaseDate = errorMsg
            else nextErrors[fieldName] = errorMsg
          })
        }
        
        setVehicleFormErrors(nextErrors)
      } else {
        const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Có lỗi xảy ra khi cập nhật phương tiện'
        setVehicleFormErrors({
          general: errorMessage
        })
      }
    } finally {
      setIsCreatingVehicle(false)
    }
  }

  // Handle delete vehicle
  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phương tiện này?')) return

    setIsDeletingVehicle(vehicleId)
    try {
      await VehicleService.deleteVehicle(vehicleId)
      
      setSuccessMessage('Xóa phương tiện thành công!')
      
      // Reload vehicles
      loadVehicles()
      
      // Auto hide success message
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error: unknown) {
      console.error('Delete vehicle error:', error)
      setSuccessMessage('') // Clear any success message
      
      const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Có lỗi xảy ra khi xóa phương tiện'
      setUploadError(errorMessage)
      
      // Auto hide error message
      setTimeout(() => {
        setUploadError('')
      }, 5000)
    } finally {
      setIsDeletingVehicle(null)
    }
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-content">
          {/* Modern Sidebar with Gradient */}
          <div className="profile-sidebar">
            <div className="sidebar-header">
              <h1 className="sidebar-title">Quản lý tài khoản</h1>
            </div>

            <div className="user-profile-section">
              <div className="user-avatar-container">
                <div className="user-avatar" onClick={handleAvatarClick}>
                  {profileData.avatarUrl && (/^data:/.test(profileData.avatarUrl) || /^https?:\/\//.test(profileData.avatarUrl)) ? (
                    <img src={profileData.avatarUrl} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <button 
                  className="avatar-edit-btn" 
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                  <PencilIcon className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="user-info">
                <div className="user-name">
                  {profileData.fullName || 'Chưa cập nhật'}
                </div>
              </div>
            </div>

            <div className="sidebar-divider"></div>

            <nav className="sidebar-navigation">
              <button
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <div className="nav-icon">
                  <UserIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Thông tin cá nhân</span>
                  </button>

              <button
                className="nav-item"
                onClick={() => setActiveTab('vehicles')}
              >
                <div className="nav-icon">
                  <TruckIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Phương tiện</span>
              </button>
              <button
                className="nav-item"
                onClick={() => setActiveTab('promo-codes')}
              >
                <div className="nav-icon">
                  <GiftIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Mã khuyến mãi</span>
              </button>
              <button
                className="nav-item"
                onClick={() => setActiveTab('settings')}
              >
                <div className="nav-icon">
                  <CogIcon className="w-5 h-5" />
                </div>
                <span className="nav-label">Cài đặt</span>
              </button>
              
              <button
                className={`nav-item ${activeTab === 'service-history' ? 'active' : ''}`}
                onClick={() => {
                  console.log('🚀 Clicking Lịch sử đặt lịch tab')
                  setActiveTab('service-history')
                  if (bookingHistory.length === 0) {
                    console.log('📡 Loading booking history...')
                    loadBookingHistory()
                  }
                }}
              >
                <div className="nav-icon">
                  <FontAwesomeIcon icon={faHistory} />
                </div>
                <span className="nav-label">Lịch sử đặt lịch</span>
              </button>
            </nav>

            <div className="sidebar-divider"></div>

            <div className="logout-section">
              <button className="logout-btn" onClick={handleLogout}>
                <div className="logout-icon">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </div>
                <span className="logout-label">Đăng xuất</span>
              </button>
          </div>
          </div>

          {/* Main Content Area */}
          <div className="profile-main">
            {activeTab === 'profile' && (
              <div className="profile-form-container">
                <BaseCard className="profile-form-card">
                  <div className="card-header">
                    <h3 className="card-title">Chỉnh sửa thông tin</h3>
                    <div className="card-actions">
                      {!isEditing ? (
                        <BaseButton variant="outline" onClick={handleEdit}>
                          Chỉnh sửa
                        </BaseButton>
                      ) : (
                        <div className="edit-actions">
                          <BaseButton variant="outline" onClick={handleCancel}>
                            Hủy
                          </BaseButton>
                          <BaseButton
                            variant="primary"
                            onClick={handleSave}
                            loading={isSaving}
                          >
                            {isSaving ? 'Đang lưu...' : 'Lưu'}
                          </BaseButton>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-form">
                    {successMessage && (
                      <div className="success-message">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>{successMessage}</span>
                      </div>
                    )}
                    {uploadError && (
                      <div className="error-message">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Họ và tên</label>
                        <BaseInput
                          value={profileData.fullName}
                          onChange={(value) => handleInputChange('fullName', value)}
                          disabled={!isEditing}
                          placeholder="Nhập họ và tên"
                          required
                          error={formErrors.fullName}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Email</label>
                        <BaseInput
                          value={profileData.email}
                          onChange={(value) => handleInputChange('email', value)}
                          disabled={!isEditing}
                          placeholder="Nhập email"
                          required
                          error={formErrors.email}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Số điện thoại</label>
                        <BaseInput
                          value={profileData.phoneNumber}
                          onChange={(value) => handleInputChange('phoneNumber', value)}
                          disabled={!isEditing}
                          placeholder="Nhập số điện thoại"
                          required
                          error={formErrors.phoneNumber}
                        />
                          </div>
                      <div className="form-group">
                        <label className="form-label required">Ngày sinh</label>
                        <BaseInput
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(value) => handleInputChange('dateOfBirth', value)}
                          disabled={!isEditing}
                          required
                          error={formErrors.dateOfBirth}
                        />
                          </div>
                      </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Địa chỉ</label>
                        <BaseInput
                          value={profileData.address}
                          onChange={(value) => handleInputChange('address', value)}
                          disabled={!isEditing}
                          placeholder="Nhập địa chỉ"
                          required
                          error={formErrors.address}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Giới tính</label>
                        <select
                          className={`form-select ${formErrors.gender ? 'error' : ''}`}
                          value={profileData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          disabled={!isEditing}
                          required
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                        </select>
                        {formErrors.gender && (
                          <div className="error-message" style={{ color: 'red', fontSize: '14px', marginTop: '4px' }}>
                            {formErrors.gender}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </BaseCard>
              </div>
            )}

            {/* Vehicles Management Section */}
            {activeTab === 'vehicles' && (
              <div className="vehicles-management-container">
                <BaseCard className="vehicles-main-card">
                <div className="card-header">
                    <div className="header-content">
                      <h3 className="card-title">
                        <TruckIcon className="w-6 h-6" />
                        Phương tiện của tôi
                      </h3>
                      <p className="card-subtitle">Quản lý thông tin phương tiện của bạn</p>
                    </div>
                    <div className="card-actions">
                  <BaseButton
                    variant="primary"
                        onClick={() => setShowVehicleForm(true)}
                        className="add-vehicle-btn"
                  >
                        <PlusIcon className="w-5 h-5" />
                        Thêm phương tiện
                  </BaseButton>
                </div>
                  </div>

                  <div className="card-body">
                  {isLoadingVehicles ? (
                <div className="vehicles-loading-state">
                  <div className="loading-spinner-large"></div>
                        <p>Đang tải danh sách phương tiện...</p>
                    </div>
                  ) : vehicles.length === 0 ? (
                      <div className="vehicles-empty-state">
                        <div className="empty-illustration">
                          <TruckIcon className="w-16 h-16" />
                          <div className="empty-decoration"></div>
                        </div>
                        <h3>Chưa có phương tiện nào</h3>
                        <p>Hãy thêm phương tiện đầu tiên để bắt đầu quản lý xe của bạn</p>
                      <BaseButton
                          variant="primary"
                          onClick={() => setShowVehicleForm(true)}
                          className="empty-state-cta"
                      >
                          <PlusIcon className="w-5 h-5" />
                          Thêm phương tiện đầu tiên
                      </BaseButton>
                    </div>
                  ) : (
                      <div className="vehicles-grid">
                      {vehicles.map((vehicle) => (
                          <div key={vehicle.vehicleId} className="vehicle-card-modern">
                            <div className="vehicle-card-header">
                              <div className="vehicle-license">
                                <h4>{vehicle.licensePlate}</h4>
                                <span className="vehicle-status">Hoạt động</span>
                            </div>
                              <div className="vehicle-color-indicator" style={{ backgroundColor: vehicle.color }}>
                                <div className="color-ring"></div>
                              </div>
                            </div>

                            <div className="vehicle-card-body">
                              <div className="vehicle-info-grid">
                                <div className="info-item">
                                  <span className="info-label">VIN</span>
                                  <span className="info-value">{vehicle.vin}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Màu sắc</span>
                                  <span className="info-value">{vehicle.color}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Số km</span>
                                  <span className="info-value">{vehicle.currentMileage.toLocaleString()} km</span>
                                </div>
                                {vehicle.lastServiceDate && (
                                  <div className="info-item">
                                    <span className="info-label">Bảo dưỡng cuối</span>
                                    <span className="info-value">{new Date(vehicle.lastServiceDate).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                )}
                                {vehicle.purchaseDate && (
                                  <div className="info-item">
                                    <span className="info-label">Ngày mua</span>
                                    <span className="info-value">{new Date(vehicle.purchaseDate).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                )}
                              </div>

                              <div className="vehicle-metrics">
                                <div className="metric-item">
                                  <span className="metric-label">Tổng km</span>
                                  <div className="metric-bar">
                                    <div 
                                      className="metric-fill" 
                                      style={{ width: `${Math.min((vehicle.currentMileage / 100000) * 100, 100)}%` }}
                                    ></div>
                            </div>
                                </div>
                              </div>
                            </div>

                            <div className="vehicle-card-actions">
                              <BaseButton 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditVehicle(vehicle)}
                                className="edit-btn"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                Sửa
                            </BaseButton>
                         <BaseButton 
                           variant="outline" 
                           size="sm" 
                           onClick={() => handleDeleteVehicle(vehicle.vehicleId)}
                           loading={isDeletingVehicle === vehicle.vehicleId}
                           className="delete-btn"
                         >
                                <TrashIcon className="w-4 h-4" />
                           {isDeletingVehicle === vehicle.vehicleId ? 'Đang xóa...' : 'Xóa'}
                              </BaseButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </BaseCard>
              </div>
            )}

            {/* Vehicle Form Modal */}
            {activeTab === 'vehicles' && showVehicleForm && (
              <div 
                className="vehicle-form-modal-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowVehicleForm(false)
                    setEditingVehicle(null)
                    setVehicleFormData({
                      customerId: 0,
                      modelId: 0,
                      vin: '',
                      licensePlate: '',
                      color: '',
                      currentMileage: 0,
                      lastServiceDate: '',
                      purchaseDate: ''
                    })
                    setVehicleFormErrors({})
                  }
                }}
              >
                <div className="vehicle-form-modal">
                  <BaseCard className="vehicle-form-modal-card">
                <div className="card-header">
                    <h3 className="card-title">
                      {editingVehicle ? 'Sửa phương tiện' : 'Thêm phương tiện'}
                    </h3>
                    <div className="card-actions">
                      <BaseButton
                        variant="outline"
                        onClick={() => {
                          setShowVehicleForm(false)
                          setEditingVehicle(null)
                          setVehicleFormData({
                            customerId: 0,
                            modelId: 0,
                            vin: '',
                            licensePlate: '',
                            color: '',
                            currentMileage: 0,
                            lastServiceDate: '',
                            purchaseDate: ''
                          })
                          setVehicleFormErrors({})
                        }}
                        className="modal-close-btn"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        Hủy
                      </BaseButton>
                      <BaseButton
                        variant="primary"
                        onClick={editingVehicle ? handleUpdateVehicle : handleCreateVehicle}
                        loading={isCreatingVehicle}
                      >
                        {isCreatingVehicle 
                          ? (editingVehicle ? 'Đang cập nhật...' : 'Đang thêm...') 
                          : (editingVehicle ? 'Cập nhật phương tiện' : 'Thêm phương tiện')
                        }
                      </BaseButton>
                    </div>
                  </div>

                  <div className="profile-form">
                    {successMessage && (
                      <div className="success-message">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>{successMessage}</span>
                    </div>
                    )}
                    
                    {vehicleFormErrors.general && (
                      <div className="error-message" style={{ 
                        color: '#dc2626', 
                        fontSize: '14px', 
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px'
                      }}>
                        {vehicleFormErrors.general}
                    </div>
                    )}
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Model xe</label>
                        <select
                          className={`form-select ${vehicleFormErrors.modelId ? 'error' : ''}`}
                          value={vehicleFormData.modelId || ''}
                          onChange={(e) => handleVehicleInputChange('modelId', parseInt(e.target.value) || 0)}
                          disabled={isLoadingModels}
                        >
                          <option value="">{isLoadingModels ? 'Đang tải...' : 'Chọn model xe'}</option>
                          {vehicleModels.map((model) => (
                            <option key={model.modelId} value={model.modelId}>
                              {model.brand ? `${model.brand} - ` : ''}{model.modelName}
                            </option>
                          ))}
                        </select>
                        {vehicleFormErrors.modelId && (
                          <div className="error-message" style={{ color: 'red', fontSize: '14px', marginTop: '4px' }}>
                            {vehicleFormErrors.modelId}
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label required">VIN</label>
                        <BaseInput
                          type="text"
                          value={vehicleFormData.vin}
                          onChange={(value) => {
                            // Limit VIN to 17 characters
                            if (value.length <= 17) {
                              handleVehicleInputChange('vin', value)
                            }
                          }}
                          placeholder="Nhập VIN của xe (17 ký tự)"
                          error={vehicleFormErrors.vin}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Biển số xe</label>
                        <BaseInput
                          type="text"
                          value={vehicleFormData.licensePlate}
                          onChange={(value) => handleVehicleInputChange('licensePlate', value)}
                          placeholder="Nhập biển số xe (VD: 29-T8 2843)"
                          error={vehicleFormErrors.licensePlate}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Màu sắc</label>
                        <BaseInput
                          type="text"
                          value={vehicleFormData.color}
                          onChange={(value) => handleVehicleInputChange('color', value)}
                          placeholder="Nhập màu sắc xe"
                          error={vehicleFormErrors.color}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Số km hiện tại</label>
                        <BaseInput
                          type="number"
                          value={vehicleFormData.currentMileage}
                          onChange={(value) => handleVehicleInputChange('currentMileage', parseInt(value) || 0)}
                          placeholder="Nhập số km hiện tại"
                          error={vehicleFormErrors.currentMileage}
                        />
                      </div>
                    </div>


                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Ngày bảo dưỡng cuối</label>
                        <BaseInput
                          type="date"
                          value={vehicleFormData.lastServiceDate || ''}
                          onChange={(value) => handleVehicleInputChange('lastServiceDate', value)}
                          error={vehicleFormErrors.lastServiceDate}
                        />
                    </div>
                      <div className="form-group">
                        <label className="form-label">Ngày mua xe</label>
                        <BaseInput
                          type="date"
                          value={vehicleFormData.purchaseDate || ''}
                          onChange={(value) => handleVehicleInputChange('purchaseDate', value)}
                          error={vehicleFormErrors.purchaseDate}
                        />
                    </div>
                  </div>
                </div>
              </BaseCard>
                </div>
              </div>
            )}

            {/* Other tabs... */}
            {activeTab === 'service-history' && (
              <div className="tab-content">
                <BaseCard>
                <div className="card-header">
                    <h3 className="card-title">Lịch sử dịch vụ</h3>
                </div>
                  <div className="card-body">
                    {isLoadingBookingHistory ? (
                      <div className="loading-state">
                        <div className="loading-spinner-large"></div>
                        <p>Đang tải lịch sử dịch vụ...</p>
                      </div>
                    ) : bookingHistory.length === 0 ? (
                      <div className="empty-state">
                        <p className="empty-title">Chưa có lịch sử dịch vụ</p>
                      </div>
                    ) : (
                      <div className="booking-history-list">
                        {bookingHistory
                          .slice((bookingHistoryPage - 1) * HISTORY_PAGE_SIZE, bookingHistoryPage * HISTORY_PAGE_SIZE)
                          .map((booking: any) => (
                            <BookingHistoryCard
                              key={booking.bookingId}
                              booking={booking}
                              onFeedback={handleBookingFeedback}
                              onEditFeedback={handleBookingEditFeedback}
                            />
                          ))}
                        
                        {(bookingHistoryTotalPages > 1 || bookingHistory.length > HISTORY_PAGE_SIZE) && (
                          <div className="pagination">
                            <button 
                              className="pagination-btn"
                              onClick={() => setBookingHistoryPage(prev => Math.max(1, prev - 1))}
                              disabled={bookingHistoryPage === 1}
                            >
                              Trước
                            </button>
                            <span className="pagination-info">
                              Trang {bookingHistoryPage} / {Math.max(bookingHistoryTotalPages, Math.ceil(bookingHistory.length / HISTORY_PAGE_SIZE))}
                            </span>
                            <button 
                              className="pagination-btn"
                              onClick={() => setBookingHistoryPage(prev => Math.min(Math.max(bookingHistoryTotalPages, Math.ceil(bookingHistory.length / HISTORY_PAGE_SIZE)), prev + 1))}
                              disabled={bookingHistoryPage === Math.max(bookingHistoryTotalPages, Math.ceil(bookingHistory.length / HISTORY_PAGE_SIZE))}
                            >
                              Sau
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
              </BaseCard>
                    </div>
            )}

            {activeTab === 'promo-codes' && (
              <div className="tab-content">
                <BaseCard>
                <div className="card-header">
                    <h3 className="card-title">Mã khuyến mãi đã lưu</h3>
                    </div>
                  <div className="card-body">
                    {promotionsLoading ? (
                      <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Đang tải danh sách mã khuyến mãi...</p>
                      </div>
                    ) : promotionsError ? (
                      <div className="error-state">
                        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                        <p className="text-red-600">{promotionsError}</p>
                        <BaseButton 
                          onClick={loadSavedPromotions}
                          className="mt-4"
                        >
                          Thử lại
                        </BaseButton>
                      </div>
                    ) : savedPromotions.length === 0 ? (
                      <div className="empty-state">
                        <GiftIcon className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-600">Bạn chưa lưu mã khuyến mãi nào</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Hãy truy cập trang "Ưu đãi & Khuyến mãi" để lưu các mã khuyến mãi yêu thích
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="promotions-list">
                          {currentPromotions.map((promotion, index) => (
                          <div key={index} className="promotion-item">
                            <div className="promotion-bookmark-icon">
                              <BookmarkIcon className="w-6 h-6" style={{ color: '#10b981', fill: '#10b981' }} />
                            </div>
                            <div className="promotion-info">
                              <div className="promotion-main">
                                <span className="promotion-code">{promotion.code}</span>
                                <span className={`promotion-status status-${((promotion.userPromotionStatus || promotion.status) === 'USED' ? 'used' : 'available')}`}>
                                  {(promotion.userPromotionStatus || promotion.status) === 'USED' 
                                    ? 'Đã sử dụng' 
                                    : 'Có thể sử dụng'}
                                </span>
                              </div>
                              <div className="promotion-details">
                                <span className="promotion-description">{promotion.description}</span>
                                {promotion.discountAmount && promotion.discountAmount > 0 && (
                                  <span className="promotion-discount">
                                    Giảm {promotion.discountAmount.toLocaleString('vi-VN')} VNĐ
                                  </span>
                                )}
                                {promotion.discountValue && promotion.discountType && (
                                  <span className="promotion-discount">
                                    {promotion.discountType === 'PERCENT' 
                                      ? `Giảm ${promotion.discountValue}%` 
                                      : `Giảm ${promotion.discountValue.toLocaleString('vi-VN')} VNĐ`}
                                    {promotion.maxDiscount && promotion.discountType === 'PERCENT' && (
                                      ` (tối đa ${promotion.maxDiscount.toLocaleString('vi-VN')} VNĐ)`
                                    )}
                                  </span>
                                )}
                                {promotion.endDate && (
                                  <span className="promotion-date">
                                    Hết hạn: {new Date(promotion.endDate).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>
                        
                        {/* Pagination */}
                        {totalPromotionPages > 1 && (
                          <div className="promotion-pagination">
                            <div className="pagination-info">
                              <span>
                                Hiển thị {startPromotionIndex + 1}-{Math.min(endPromotionIndex, totalPromotions)} trong {totalPromotions} mã khuyến mãi
                              </span>
                            </div>
                            <div className="pagination-controls">
                              <button
                                onClick={() => handlePromotionPageChange(currentPromotionPage - 1)}
                                disabled={currentPromotionPage === 1}
                                className="pagination-btn"
                              >
                                Trước
                              </button>
                              
                              <div className="pagination-numbers">
                                {Array.from({ length: totalPromotionPages }, (_, i) => i + 1).map(page => (
                                  <button
                                    key={page}
                                    onClick={() => handlePromotionPageChange(page)}
                                    className={`pagination-number ${currentPromotionPage === page ? 'active' : ''}`}
                                  >
                                    {page}
                                  </button>
                                ))}
                              </div>
                              
                              <button
                                onClick={() => handlePromotionPageChange(currentPromotionPage + 1)}
                                disabled={currentPromotionPage === totalPromotionPages}
                                className="pagination-btn"
                              >
                                Sau
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                </div>
              </BaseCard>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-content">
                <BaseCard>
                <div className="card-header">
                  <h3 className="card-title">Thông báo</h3>
                </div>
                  <div className="card-body">
                    <p>Danh sách thông báo sẽ được hiển thị ở đây.</p>
                </div>
              </BaseCard>
                </div>
            )}

            {activeTab === 'settings' && (
              <div className="tab-content">
                <BaseCard>
                <div className="card-header">
                    <h3 className="card-title">Đổi mật khẩu</h3>
                </div>
                  <div className="card-body">
                    <div className="profile-form">
                      {successMessage && (
                        <div className="success-message">
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>{successMessage}</span>
                    </div>
                      )}
                      
                      <div className="form-row">
                  <div className="form-group">
                          <label className="form-label required">Mật khẩu hiện tại</label>
                    <div className="password-input-wrapper">
                      <BaseInput
                              type={showPasswords.currentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                              onChange={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                        placeholder="Nhập mật khẩu hiện tại"
                              error={passwordErrors.currentPassword}
                      />
                      <button
                        type="button"
                              className="password-toggle-btn"
                              onClick={() => togglePasswordVisibility('currentPassword')}
                            >
                              {showPasswords.currentPassword ? (
                                <EyeSlashIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                      </button>
                          </div>
                    </div>
                  </div>

                      <div className="form-row">
                  <div className="form-group">
                          <label className="form-label required">Mật khẩu mới</label>
                    <div className="password-input-wrapper">
                      <BaseInput
                              type={showPasswords.newPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                              onChange={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                              placeholder="Nhập mật khẩu mới"
                              error={passwordErrors.newPassword}
                      />
                      <button
                        type="button"
                              className="password-toggle-btn"
                              onClick={() => togglePasswordVisibility('newPassword')}
                            >
                              {showPasswords.newPassword ? (
                                <EyeSlashIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                      </button>
                    </div>
                        </div>
                  <div className="form-group">
                          <label className="form-label required">Xác nhận mật khẩu mới</label>
                    <div className="password-input-wrapper">
                      <BaseInput
                              type={showPasswords.confirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                              onChange={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                              placeholder="Nhập lại mật khẩu mới"
                              error={passwordErrors.confirmPassword}
                      />
                      <button
                        type="button"
                              className="password-toggle-btn"
                              onClick={() => togglePasswordVisibility('confirmPassword')}
                            >
                              {showPasswords.confirmPassword ? (
                                <EyeSlashIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                </button>
              </div>
                    </div>
                  </div>

                      <div className="form-actions">
                <BaseButton
                  variant="primary"
                  onClick={handleChangePassword}
                          loading={isChangingPassword}
                        >
                          {isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </BaseButton>
              </div>
            </div>
                  </div>
                </BaseCard>
          </div>
        )}

            {activeTab === 'maintenance' && (
              <div className="maintenance-history-container">
                <BaseCard className="maintenance-history-card">
                  <div className="card-header">
                    <h3 className="card-title">
                      <FontAwesomeIcon icon={faHistory} />
                      Lịch sử đặt lịch
                    </h3>
                    <p className="card-subtitle">Xem lịch sử dịch vụ và đánh giá trải nghiệm của bạn</p>
                  </div>

                  {/* Stats */}
                  <div className="maintenance-stats">
                    <div className="stat-item">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faHistory} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{bookings.length}</div>
                        <div className="stat-label">Tổng dịch vụ</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{bookings.filter(b => b.status === 'completed').length}</div>
                        <div className="stat-label">Đã hoàn thành</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faStar} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{bookings.filter(b => b.feedback).length}</div>
                        <div className="stat-label">Đã đánh giá</div>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="maintenance-filters">
                    <div className="filter-search">
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo dịch vụ, kỹ thuật viên, phụ tùng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Status Filter Chips */}
                    <div className="filter-status-chips">
                      <button
                        className={`status-chip ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                      >
                        Tất cả
                      </button>
                      <button
                        className={`status-chip ${statusFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('completed')}
                      >
                        Hoàn thành
                      </button>
                      <button
                        className={`status-chip ${statusFilter === 'in-progress' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('in-progress')}
                      >
                        Đang tiến hành
                      </button>
                      <button
                        className={`status-chip ${statusFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                      >
                        Chờ xử lý
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {maintenanceError && (
                    <div className="maintenance-error">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <span>{maintenanceError}</span>
                    </div>
                  )}

                  {/* Bookings List */}
                  {maintenanceLoading ? (
                    <div className="maintenance-loading">
                      <div className="loading-spinner"></div>
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  ) : (
                    <div className="maintenance-list">
                      {bookings
                        .filter(booking => {
                          const matchesSearch = booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                               booking.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                               booking.partsUsed.some(part => part.toLowerCase().includes(searchTerm.toLowerCase()))
                          
                          const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
                          
                          return matchesSearch && matchesStatus
                        })
                        .length === 0 ? (
                        <div className="maintenance-empty">
                          <div className="empty-icon">
                            <FontAwesomeIcon icon={faHistory} />
                          </div>
                          <h3>Không có dịch vụ nào</h3>
                          <p>
                            {searchTerm || statusFilter !== 'all'
                              ? 'Không tìm thấy dịch vụ phù hợp với bộ lọc'
                              : 'Bạn chưa có dịch vụ nào trong hệ thống'
                            }
                          </p>
                        </div>
                      ) : (
                        bookings
                          .filter(booking => {
                            const matchesSearch = booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 booking.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 booking.partsUsed.some(part => part.toLowerCase().includes(searchTerm.toLowerCase()))
                            
                            const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
                            
                            return matchesSearch && matchesStatus
                          })
                          .map((booking) => (
                            <FeedbackCard
                              key={booking.id}
                              booking={booking}
                              onSubmitFeedback={handleSubmitFeedback}
                              onEditFeedback={handleEditFeedback}
                              isExpanded={expandedBookings.has(booking.id)}
                              onToggleExpand={handleToggleExpand}
                            />
                          ))
                      )}
                    </div>
                  )}
                </BaseCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
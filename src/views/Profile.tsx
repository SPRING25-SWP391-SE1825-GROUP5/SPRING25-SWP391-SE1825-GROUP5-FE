import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCurrentUser, syncFromLocalStorage } from '@/store/authSlice'
import { AuthService, BookingService } from '@/services'
import { PromotionBookingService } from '@/services/promotionBookingService'
import { BaseButton, BaseCard, BaseInput } from '@/components/common'
import { PhotoIcon, CameraIcon } from '@heroicons/react/24/outline'
import { ProfileNav, ProfileOverview, ProfileInfo, ProfileVehicles, ProfilePromotions, ProfileSettings, ProfileHistory, ProfileReviews, ProfilePackages, ProfileNotifications, ProfileTabKey } from '@/components/profile'
import './profile.scss'
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

// Vehicle interfaces removed - using ProfileVehicles component instead

interface FormErrors {
  fullName?: string
  email?: string
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  gender?: string
}

export default function Profile() {
  // Hooks must be declared first
  const dispatch = useAppDispatch()
  const auth = useAppSelector(state => state.auth)
  const [searchParams] = useSearchParams()

  const [coverUrl, setCoverUrl] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const coverInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('info')

  // Cover and avatar handlers
  const handleSelectCover = () => coverInputRef.current?.click()
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverUrl(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  // Vehicle states removed - using ProfileVehicles component instead

  // Booking history states
  const [bookingHistory, setBookingHistory] = useState<any[]>([])
  const [isLoadingBookingHistory, setIsLoadingBookingHistory] = useState(false)
  const [bookingHistoryPage, setBookingHistoryPage] = useState(1)
  const [bookingHistoryTotalPages, setBookingHistoryTotalPages] = useState(1)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const HISTORY_PAGE_SIZE = 10

  // Vehicle form states removed - using ProfileVehicles component instead
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

  // Vehicle loading useEffect removed - using ProfileVehicles component instead

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

  // Vehicle loading useEffect removed - using ProfileVehicles component instead

  useEffect(() => {
    if (activeTab === 'service-history') {
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
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  // Vehicle loading functions removed - using ProfileVehicles component instead

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

      const promotions = await PromotionBookingService.getSavedPromotions()

      // Hiển thị các mã khuyến mãi chưa sử dụng: SAVED và APPLIED (đã áp dụng nhưng chưa thanh toán)
      // KHÔNG hiển thị USED (đã sử dụng = đã thanh toán thành công)
      // Nếu đơn hàng chưa thanh toán thì mã vẫn còn nguyên (SAVED hoặc APPLIED)
      const filteredPromotions = (promotions || []).filter((p: any) => {
        const status = String(p.status || '').toUpperCase()
        return status === 'SAVED' || status === 'APPLIED' // Hiển thị các mã chưa sử dụng
      })

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
      const response = await CustomerService.getCurrentCustomer()

      if (response.success && response.data) {
        const customerId = response.data.customerId
        setCustomerId(customerId)
        return customerId
      }

      return null
    } catch (error) {
      console.error('Error loading customerId:', error)
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
        console.error('Invalid customer bookings response:', resp)
        setBookingHistory([])
        return
      }

      // Load feedback for COMPLETED bookings
      const bookingsWithFeedback = await Promise.all(
        bookings.map(async (booking: any) => {
          if (booking.status === 'COMPLETED') {
            try {
              const feedback = await feedbackService.getFeedback(booking.bookingId.toString())

              return {
                ...booking,
                feedback: feedback,
                hasFeedback: !!feedback,
                feedbackId: (feedback as any)?.feedbackId || null
              }
            } catch (error) {
              return {
                ...booking,
                feedback: null,
                hasFeedback: false,
                feedbackId: null
              }
            }
          } else {
            return {
              ...booking,
              feedback: null,
              hasFeedback: false,
              feedbackId: null
            }
          }
        })
      )

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

  // Additional state
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverUrl(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleSelectAvatar = () => avatarInputRef.current?.click()
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const res = await AuthService.uploadAvatar(file)
    if (res?.success && res.data?.avatarUrl) {
      setAvatarUrl(res.data.avatarUrl)
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

  // Vehicle handlers removed - using ProfileVehicles component instead

  return (
    <div className="profile-v2">
      <div
        className={`profile-v2__banner ${coverUrl ? 'has-image' : ''}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        <button className="profile-v2__add-cover" onClick={handleSelectCover} title="Thêm ảnh bìa" aria-label="Thêm ảnh bìa">
          <PhotoIcon className="profile-v2__add-cover-icon" />
          <span>Thêm ảnh bìa</span>
                </button>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
              </div>

      <div className="profile-v2__container">
        <div className="profile-v2__header">
          <div className="profile-v2__avatar" onClick={handleSelectAvatar} aria-label="avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" />
            ) : (
              'VT'
            )}
            <span className="profile-v2__avatar-camera" title="Change avatar">
              <CameraIcon />
            </span>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>

          <div className="profile-v2__header-info">
            <h1 className="profile-v2__name">{profileData.fullName || 'Vo Minh Tien'}</h1>
          </div>
        </div>

        {/* Vehicles section removed - using ProfileVehicles component in section-wrapper */}

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
                                <span className={`promotion-status status-${promotion.status?.toLowerCase()}`}>
                                  {promotion.status === 'SAVED' ? 'Có thể sử dụng' :
                                   promotion.status === 'APPLIED' ? 'Có thể sử dụng' :
                                   promotion.status === 'USED' ? 'Đã sử dụng' :
                                   'Không xác định'}
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
                        {totalPromotionPages > 1 && (
                          <div className="pagination">
                            <button
                              className="pagination-btn"
                              onClick={() => handlePromotionPageChange(currentPromotionPage - 1)}
                              disabled={currentPromotionPage === 1}
                            >
                              Trước
                            </button>
                            <span className="pagination-info">
                              Trang {currentPromotionPage} / {totalPromotionPages}
                            </span>
                            <button
                              className="pagination-btn"
                              onClick={() => handlePromotionPageChange(currentPromotionPage + 1)}
                              disabled={currentPromotionPage === totalPromotionPages}
                            >
                              Sau
                            </button>
                          </div>
                        )}
                      </>
                    )}
                </div>
              </BaseCard>
            </div>
        )}

        <ProfileNav active={activeTab} onChange={setActiveTab} />
        <div className="profile-v2__section-wrapper">
          {activeTab === 'overview' && <ProfileOverview />}
          {activeTab === 'info' && <ProfileInfo />}
          {activeTab === 'vehicles' && <ProfileVehicles />}
          {activeTab === 'history' && <ProfileHistory />}
          {activeTab === 'reviews' && <ProfileReviews />}
          {activeTab === 'promotions' && <ProfilePromotions />}
          {activeTab === 'packages' && <ProfilePackages />}
          {activeTab === 'notifications' && <ProfileNotifications />}
        </div>
      </div>
    </div>
  )
}


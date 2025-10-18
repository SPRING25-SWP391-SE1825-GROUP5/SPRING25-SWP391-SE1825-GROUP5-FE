import { useEffect, useMemo, useState } from 'react'
import { BaseButton } from '@/components/common'
import { ServiceManagementService, Service } from '@/services/serviceManagementService'
import { VehicleService, Vehicle } from '@/services/vehicleService'
import { CenterService, Center } from '@/services/centerService'
import { BookingService, AvailabilityResponse, TimeSlotAvailability, TechnicianAvailability } from '@/services/bookingService'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faTimes, faInfoCircle, faCar, faWrench, faClock, faUser, faMapMarkerAlt, faCalendarAlt, faBolt } from '@fortawesome/free-solid-svg-icons'
import './booking.scss'

// Notification component
interface NotificationProps {
  type: 'success' | 'error' | 'info'
  message: string
  onClose: () => void
  show: boolean
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose, show }) => {
  if (!show) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} />
      case 'error':
        return <FontAwesomeIcon icon={faTimes} />
      default:
        return <FontAwesomeIcon icon={faInfoCircle} />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'text-green-500'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-500'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-500'
        }
    }
  }

  const colors = getColors()

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${colors.bg} ${colors.border} border rounded-lg shadow-lg p-4 max-w-sm`}>
        <div className="flex items-start">
          <div className={`${colors.icon} flex-shrink-0 mr-3`}>
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className={`${colors.text} text-sm font-medium`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${colors.text} hover:opacity-70 transition-opacity ml-2`}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Booking() {
  // State management
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('booking-current-step')
    return saved ? parseInt(saved) : 1
  })
  const [selectedServices, setSelectedServices] = useState<number[]>(() => {
    const saved = localStorage.getItem('booking-selected-services')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(() => {
    const saved = localStorage.getItem('booking-selected-vehicle')
    return saved ? JSON.parse(saved) : null
  })
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(() => {
    const saved = localStorage.getItem('booking-selected-center')
    return saved ? JSON.parse(saved) : null
  })
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotAvailability | null>(() => {
    const saved = localStorage.getItem('booking-selected-timeslot')
    return saved ? JSON.parse(saved) : null
  })
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianAvailability | null>(() => {
    const saved = localStorage.getItem('booking-selected-technician')
    return saved ? JSON.parse(saved) : null
  })
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const saved = localStorage.getItem('booking-selected-date')
    return saved || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Reservation state
  const [reservation, setReservation] = useState<{
    reservationId: string | null
    technicianId: number | null
    expiryTime: string | null
    timeRemaining: number | null
  }>({
    reservationId: null,
    technicianId: null,
    expiryTime: null,
    timeRemaining: null
  })

  // API data
  const [services, setServices] = useState<Service[]>([])
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [servicesLoading, setServicesLoading] = useState(false)
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [centersLoading, setCentersLoading] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [servicesError, setServicesError] = useState<string | null>(null)
  const [vehiclesError, setVehiclesError] = useState<string | null>(null)
  const [centersError, setCentersError] = useState<string | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  // Create vehicle form
  const [showCreateVehicleForm, setShowCreateVehicleForm] = useState(false)
  const [createVehicleLoading, setCreateVehicleLoading] = useState(false)
  const [createVehicleError, setCreateVehicleError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [newVehicle, setNewVehicle] = useState({
    vin: '',
    licensePlate: '',
    color: '',
    currentMileage: 0,
    lastServiceDate: ''
  })
  
  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error' | 'info'
    message: string
  }>({
    show: false,
    type: 'info',
    message: ''
  })

  // Helper function to show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({
      show: true,
      type,
      message
    })
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 5000)
  }

  // Helper function to hide notification
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }))
  }

  // Helper function to reserve technician
  const reserveTechnician = async (technician: TechnicianAvailability) => {
    if (!selectedCenter || !selectedDate || !selectedTimeSlot) return

    try {
      const reservationData = await BookingService.reserveTechnician({
        technicianId: technician.technicianId,
        timeSlotId: selectedTimeSlot.slotId,
        centerId: selectedCenter.centerId,
        date: selectedDate
      })

      setReservation({
        reservationId: reservationData.reservationId,
        technicianId: technician.technicianId,
        expiryTime: reservationData.expiryTime,
        timeRemaining: 300 // 5 minutes in seconds
      })

      showNotification('success', 'Đã đặt chỗ kỹ thuật viên thành công! Bạn có 5 phút để xác nhận.')
    } catch (error: any) {
      console.error('Error reserving technician:', error)
      showNotification('error', 'Không thể đặt chỗ kỹ thuật viên. Vui lòng thử lại.')
    }
  }

  // Helper function to release reservation
  const releaseReservation = async () => {
    if (!reservation.reservationId) return

    try {
      await BookingService.releaseTechnician(reservation.reservationId)
      setReservation({
        reservationId: null,
        technicianId: null,
        expiryTime: null,
        timeRemaining: null
      })
      setSelectedTechnician(null)
      showNotification('info', 'Đã hủy đặt chỗ kỹ thuật viên.')
    } catch (error: any) {
      console.error('Error releasing reservation:', error)
    }
  }

  // Helper function to format countdown timer
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Helper function to get week dates
  const getWeekDates = (startDate: string) => {
    const dates = []
    const start = new Date(startDate)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }

  // Helper function to format date for display
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Hôm nay'
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return 'Ngày mai'
    } else {
      return date.toLocaleDateString('vi-VN', { 
        weekday: 'short', 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }



  // Load services from API
  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true)
        setServicesError(null)
        const response = await ServiceManagementService.getActiveServices({ pageSize: 100 })
        setServices(response.services)
      } catch (err) {
        console.error('Error loading services:', err)
        setServicesError('Không thể tải danh sách dịch vụ')
      } finally {
        setServicesLoading(false)
      }
    }
    loadServices()
  }, [])

  // Load user vehicles from API
  const loadVehicles = async () => {
    try {
      setVehiclesLoading(true)
      setVehiclesError(null)
      const response = await VehicleService.getCustomerVehicles()
      setUserVehicles(response.data.vehicles || [])
    } catch (err: any) {
      console.error('Error loading vehicles:', err)
      // Only show error if it's a real API error, not just empty list
      if (err.response?.status >= 400) {
        setVehiclesError(err.response?.data?.message || 'Không thể tải danh sách xe')
      } else {
        // If no vehicles found, just set empty array
        setUserVehicles([])
      }
    } finally {
      setVehiclesLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  // Load centers from API
  useEffect(() => {
    const loadCenters = async () => {
      try {
        setCentersLoading(true)
        setCentersError(null)
        const centersData = await CenterService.getActiveCenters()
        setCenters(centersData.centers)
      } catch (error: any) {
        console.error('Error loading centers:', error)
        setCentersError('Không thể tải danh sách trung tâm')
      } finally {
        setCentersLoading(false)
      }
    }

    loadCenters()
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('booking-current-step', currentStep.toString())
  }, [currentStep])

  useEffect(() => {
    localStorage.setItem('booking-selected-services', JSON.stringify(selectedServices))
  }, [selectedServices])

  useEffect(() => {
    localStorage.setItem('booking-selected-vehicle', JSON.stringify(selectedVehicle))
  }, [selectedVehicle])

  useEffect(() => {
    localStorage.setItem('booking-selected-center', JSON.stringify(selectedCenter))
  }, [selectedCenter])

  useEffect(() => {
    localStorage.setItem('booking-selected-timeslot', JSON.stringify(selectedTimeSlot))
  }, [selectedTimeSlot])

  useEffect(() => {
    localStorage.setItem('booking-selected-technician', JSON.stringify(selectedTechnician))
  }, [selectedTechnician])

  useEffect(() => {
    localStorage.setItem('booking-selected-date', selectedDate)
  }, [selectedDate])

  // Load availability when center and date are selected
  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedCenter || !selectedDate) return

      try {
        setAvailabilityLoading(true)
        setAvailabilityError(null)
        
        const availabilityData = await BookingService.getAvailability({
          centerId: selectedCenter.centerId,
          date: selectedDate,
          serviceIds: selectedServices
        })
        setAvailability(availabilityData)
      } catch (error: any) {
        console.error('Error loading availability:', error)
        setAvailabilityError('Không thể tải thông tin khả dụng')
      } finally {
        setAvailabilityLoading(false)
      }
    }

    loadAvailability()
  }, [selectedCenter, selectedDate, selectedServices])

  // Real-time availability refresh every 5 seconds
  useEffect(() => {
    if (!selectedCenter || !selectedDate) return

    const interval = setInterval(async () => {
      try {
        const availabilityData = await BookingService.getAvailability({
          centerId: selectedCenter.centerId,
          date: selectedDate,
          serviceIds: selectedServices
        })
        setAvailability(availabilityData)
        
        // Check if selected time slot is still available
        if (selectedTimeSlot && availability) {
          const updatedSlot = availability.timeSlots.find(slot => slot.slotId === selectedTimeSlot.slotId)
          if (!updatedSlot || !updatedSlot.isAvailable) {
            setSelectedTimeSlot(null)
            setSelectedTechnician(null)
            showNotification('info', 'Khung giờ đã chọn không còn khả dụng. Vui lòng chọn lại.')
          } else {
            // Update the selected slot with fresh data
            setSelectedTimeSlot(updatedSlot)
          }
        }
      } catch (error) {
        console.error('Error refreshing availability:', error)
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [selectedCenter, selectedDate, selectedServices, selectedTimeSlot, availability])

  // Countdown timer for reservation
  useEffect(() => {
    if (!reservation.timeRemaining || reservation.timeRemaining <= 0) return

    const timer = setInterval(() => {
      setReservation(prev => {
        const newTimeRemaining = prev.timeRemaining! - 1
        if (newTimeRemaining <= 0) {
          // Reservation expired
          releaseReservation()
          showNotification('error', 'Đặt chỗ kỹ thuật viên đã hết hạn. Vui lòng chọn lại.')
          return {
            reservationId: null,
            technicianId: null,
            expiryTime: null,
            timeRemaining: null
          }
        }
        return {
          ...prev,
          timeRemaining: newTimeRemaining
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [reservation.timeRemaining])

  // Create new vehicle
  const handleCreateVehicle = async () => {
    try {
      setCreateVehicleLoading(true)
      setCreateVehicleError(null)
      setFieldErrors({})
      
      const vehicleData = {
        customerId: 1, // TODO: Get from auth context
        vin: newVehicle.vin,
        licensePlate: newVehicle.licensePlate,
        color: newVehicle.color,
        currentMileage: newVehicle.currentMileage,
        lastServiceDate: newVehicle.lastServiceDate || undefined
      }

      await VehicleService.createVehicle(vehicleData)
      
      // Reload vehicles list
      await loadVehicles()
      
      // Close form and reset form
      setShowCreateVehicleForm(false)
      setNewVehicle({
        vin: '',
        licensePlate: '',
        color: '',
        currentMileage: 0,
        lastServiceDate: ''
      })
      setFieldErrors({})
      
      showNotification('success', 'Tạo xe thành công!')
    } catch (err: any) {
      console.error('Error creating vehicle:', err)
      
      // Parse validation errors from API response
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        const fieldErrorMap: {[key: string]: string} = {}
        
        if (errors.Vin) {
          fieldErrorMap.vin = errors.Vin.join(', ')
        }
        if (errors.LicensePlate) {
          fieldErrorMap.licensePlate = errors.LicensePlate.join(', ')
        }
        if (errors.Color) {
          fieldErrorMap.color = errors.Color.join(', ')
        }
        if (errors.CurrentMileage) {
          fieldErrorMap.currentMileage = errors.CurrentMileage.join(', ')
        }
        
        setFieldErrors(fieldErrorMap)
      } else {
        const errorMessage = err.response?.data?.message || 'Không thể tạo xe mới'
        setCreateVehicleError(errorMessage)
        showNotification('error', errorMessage)
      }
    } finally {
      setCreateVehicleLoading(false)
    }
  }

  // TODO: Replace with API calls for service centers, staff, and time slots
  // These will be implemented when backend APIs are ready

  const minDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
  }, [])

  const totalPrice = useMemo(() => selectedServices.reduce((t: number, id: number) => {
    const service = services.find(s => s.id === id)
    return t + (service?.price || 0)
  }, 0), [selectedServices, services])

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN')
  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return ''
    const dateObj = new Date(date)
    return `${dateObj.toLocaleDateString('vi-VN')} lúc ${time}`
  }

  // Utility functions
  const formatKm = (km: number) => `${km.toFixed(1)} km`

  // Helper function to render field with error
  const renderField = (fieldName: string, label: string, isRequired: boolean = false, children: React.ReactNode) => {
    const hasError = fieldErrors[fieldName]
    const isFieldEmpty = !newVehicle[fieldName as keyof typeof newVehicle]
    
    return (
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.75rem', 
          fontWeight: 600, 
          fontSize: '0.95rem',
          color: hasError ? '#dc2626' : '#374151'
        }}>
          {label} {isRequired && <span style={{ color: '#dc2626' }}>*</span>}
        </label>
        {children}
        {hasError && (
          <div style={{
            color: '#dc2626',
            fontSize: '0.8rem',
            marginTop: '0.5rem',
            fontWeight: 500
          }}>
            {hasError}
          </div>
        )}
      </div>
    )
  }


  // Helper functions
  const toggleService = (id: number) => {
    setSelectedServices((prev: number[]) => prev.includes(id) ? prev.filter((x: number) => x !== id) : [...prev, id])
  }

  const nextStep = () => { if (currentStep < 4) setCurrentStep(currentStep + 1) }
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1) }

  const confirmBooking = async () => {
    setIsSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 1500))
      showNotification('success', 'Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.')
      
      // Clear localStorage after successful booking
      localStorage.removeItem('booking-current-step')
      localStorage.removeItem('booking-selected-services')
      localStorage.removeItem('booking-selected-vehicle')
      localStorage.removeItem('booking-selected-center')
      localStorage.removeItem('booking-selected-timeslot')
      localStorage.removeItem('booking-selected-technician')
      localStorage.removeItem('booking-selected-date')
      
      // Reset all state
      setCurrentStep(1)
      setSelectedServices([])
      setSelectedVehicle(null)
      setSelectedCenter(null)
      setSelectedTimeSlot(null)
      setSelectedTechnician(null)
      setSelectedDate('')
    } catch (e) {
      showNotification('error', 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="booking-page" style={{ minHeight: '100vh', padding: '2rem 0', background: 'linear-gradient(135deg, #FFF9E5 0%, #F8F9FA 100%)' }}>
      {/* Notification */}
      <Notification
        type={notification.type}
        message={notification.message}
        show={notification.show}
        onClose={hideNotification}
      />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#004030', marginBottom: '0.5rem' }}>Đặt Lịch Bảo Dưỡng</h1>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>Chọn dịch vụ và xe điện phù hợp cho lịch bảo dưỡng của bạn</p>
        </div>

        <div className="booking-content">
          {/* Steps indicator */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            {[1,2,3,4].map((n) => (
              <div key={n} className={`step ${currentStep >= n ? 'active' : ''} ${currentStep > n ? 'completed' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-card)' }}>
                <div className="step-number" style={{ width: 28, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-500)', color: 'var(--text-inverse)', fontWeight: 700 }}>{n}</div>
                <div className="step-label" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {n === 1 ? 'Chọn dịch vụ' : n === 2 ? 'Chọn xe' : n === 3 ? 'Chọn thời gian' : 'Xác nhận'}
                </div>
              </div>
            ))}
          </div>

          {/* Step 1 - Chọn dịch vụ */}
          {currentStep === 1 && (
            <div className="booking-step">
              <h2>Chọn dịch vụ bảo dưỡng</h2>
              {servicesLoading && <div>Đang tải dịch vụ...</div>}
              {servicesError && <div style={{ color: 'red' }}>{servicesError}</div>}
              {!servicesLoading && !servicesError && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {services.map((service) => (
                    <div key={service.id} className={`service-card ${selectedServices.includes(service.id) ? 'selected' : ''}`} style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-primary)', cursor: 'pointer' }} onClick={() => toggleService(service.id)}>
                      <div className="service-info">
                        <h3>{service.name}</h3>
                        <p className="service-description">{service.description}</p>
                        <div className="service-details">
                          <span className="price">{formatPrice(service.price)}</span>
                          {service.notes && <span className="notes">{service.notes}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <BaseButton onClick={nextStep} disabled={selectedServices.length === 0} size="lg">Tiếp theo</BaseButton>
              </div>
            </div>
          )}

          {/* Step 2 - Chọn xe */}
          {currentStep === 2 && (
            <div className="booking-step">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Chọn xe cần bảo dưỡng</h2>
                <BaseButton 
                  onClick={() => setShowCreateVehicleForm(!showCreateVehicleForm)}
                  variant="secondary"
                  size="sm"
                >
                  {showCreateVehicleForm ? 'Hủy tạo xe' : '+ Tạo xe mới'}
                </BaseButton>
              </div>
              
              {/* Create Vehicle Form */}
              {showCreateVehicleForm && (
                <div style={{
                  background: 'linear-gradient(135deg, #f8fffe 0%, #f0fdf4 100%)',
                  border: '2px solid #004030',
                  borderRadius: 16,
                  padding: '2rem',
                  marginBottom: '2rem',
                  boxShadow: '0 4px 20px rgba(0, 64, 48, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative elements */}
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #004030, #006644)',
                    borderRadius: '50%',
                    opacity: 0.1
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '-20px',
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #004030, #006644)',
                    borderRadius: '50%',
                    opacity: 0.05
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      marginBottom: '1.5rem',
                      paddingBottom: '1rem',
                      borderBottom: '2px solid #e5f7f0'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#004030', 
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <FontAwesomeIcon 
                          icon={faCar} 
                          style={{ color: '#004030', fontSize: '24px' }}
                        />
                        Thông tin xe mới
                      </h3>
                    </div>
                    
                    {createVehicleError && (
                      <div style={{ 
                        color: '#dc2626', 
                        marginBottom: '1.5rem', 
                        padding: '1rem', 
                        backgroundColor: '#fef2f2', 
                        borderRadius: 12,
                        border: '1px solid #fecaca',
                        whiteSpace: 'pre-line',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}>
                        {createVehicleError}
                            </div>
                    )}

                    <div 
                      className="vehicle-form-grid"
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
                        gap: '1.5rem',
                        marginBottom: '2rem',
                        width: '100%',
                        maxWidth: '100%'
                      }}
                    >
                      {/* Biển số xe */}
                      {renderField('licensePlate', 'Biển số xe', true,
                          <input
                          type="text"
                          value={newVehicle.licensePlate}
                          onChange={(e) => setNewVehicle(prev => ({ ...prev, licensePlate: e.target.value }))}
                          placeholder="VD: 30A-123.45"
                          style={{
                            width: '100%',
                            padding: '0.875rem 1rem',
                            border: `2px solid ${fieldErrors.licensePlate ? '#dc2626' : '#e5e7eb'}`,
                            borderRadius: 12,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease',
                            background: '#ffffff',
                            boxShadow: fieldErrors.licensePlate ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                            boxSizing: 'border-box',
                            maxWidth: '100%'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = fieldErrors.licensePlate ? '#dc2626' : '#004030'
                            e.target.style.boxShadow = fieldErrors.licensePlate ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 0 0 3px rgba(0, 64, 48, 0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = fieldErrors.licensePlate ? '#dc2626' : '#e5e7eb'
                            e.target.style.boxShadow = fieldErrors.licensePlate ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      )}

                      {/* VIN */}
                      {renderField('vin', 'VIN', true,
                        <input
                          type="text"
                          value={newVehicle.vin}
                          onChange={(e) => setNewVehicle(prev => ({ ...prev, vin: e.target.value }))}
                          placeholder="Số VIN của xe"
                          style={{
                            width: '100%',
                            padding: '0.875rem 1rem',
                            border: `2px solid ${fieldErrors.vin ? '#dc2626' : '#e5e7eb'}`,
                            borderRadius: 12,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease',
                            background: '#ffffff',
                            boxShadow: fieldErrors.vin ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                            boxSizing: 'border-box',
                            maxWidth: '100%'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = fieldErrors.vin ? '#dc2626' : '#004030'
                            e.target.style.boxShadow = fieldErrors.vin ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 0 0 3px rgba(0, 64, 48, 0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = fieldErrors.vin ? '#dc2626' : '#e5e7eb'
                            e.target.style.boxShadow = fieldErrors.vin ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      )}

                      {/* Màu xe */}
                      {renderField('color', 'Màu xe', true,
                        <input
                          type="text"
                          value={newVehicle.color}
                          onChange={(e) => setNewVehicle(prev => ({ ...prev, color: e.target.value }))}
                          placeholder="VD: Đen, Trắng..."
                          style={{
                            width: '100%',
                            padding: '0.875rem 1rem',
                            border: `2px solid ${fieldErrors.color ? '#dc2626' : '#e5e7eb'}`,
                            borderRadius: 12,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease',
                            background: '#ffffff',
                            boxShadow: fieldErrors.color ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                            boxSizing: 'border-box',
                            maxWidth: '100%'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = fieldErrors.color ? '#dc2626' : '#004030'
                            e.target.style.boxShadow = fieldErrors.color ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 0 0 3px rgba(0, 64, 48, 0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = fieldErrors.color ? '#dc2626' : '#e5e7eb'
                            e.target.style.boxShadow = fieldErrors.color ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      )}

                      {/* Số km hiện tại */}
                      {renderField('currentMileage', 'Số km hiện tại', true,
                        <input
                          type="number"
                          value={newVehicle.currentMileage}
                          onChange={(e) => setNewVehicle(prev => ({ ...prev, currentMileage: parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                          min="0"
                          style={{
                            width: '100%',
                            padding: '0.875rem 1rem',
                            border: `2px solid ${fieldErrors.currentMileage ? '#dc2626' : '#e5e7eb'}`,
                            borderRadius: 12,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease',
                            background: '#ffffff',
                            boxShadow: fieldErrors.currentMileage ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                            boxSizing: 'border-box',
                            maxWidth: '100%'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = fieldErrors.currentMileage ? '#dc2626' : '#004030'
                            e.target.style.boxShadow = fieldErrors.currentMileage ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 0 0 3px rgba(0, 64, 48, 0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = fieldErrors.currentMileage ? '#dc2626' : '#e5e7eb'
                            e.target.style.boxShadow = fieldErrors.currentMileage ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      )}

                      {/* Lần bảo dưỡng cuối - Full width */}
                      <div style={{ gridColumn: 'span 2' }}>
                        {renderField('lastServiceDate', 'Lần bảo dưỡng cuối', false,
                          <input
                            type="date"
                            value={newVehicle.lastServiceDate}
                            onChange={(e) => setNewVehicle(prev => ({ ...prev, lastServiceDate: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.875rem 1rem',
                              border: `2px solid ${fieldErrors.lastServiceDate ? '#dc2626' : '#e5e7eb'}`,
                              borderRadius: 12,
                              fontSize: '0.95rem',
                              transition: 'all 0.2s ease',
                              background: '#ffffff',
                              boxShadow: fieldErrors.lastServiceDate ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                              color: '#374151',
                              boxSizing: 'border-box',
                              maxWidth: '100%'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = fieldErrors.lastServiceDate ? '#dc2626' : '#004030'
                              e.target.style.boxShadow = fieldErrors.lastServiceDate ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 0 0 3px rgba(0, 64, 48, 0.1)'
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = fieldErrors.lastServiceDate ? '#dc2626' : '#e5e7eb'
                              e.target.style.boxShadow = fieldErrors.lastServiceDate ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        )}
                            </div>
                          </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      justifyContent: 'flex-end',
                      paddingTop: '1.5rem',
                      borderTop: '2px solid #e5f7f0'
                    }}>
                      <BaseButton 
                        onClick={() => setShowCreateVehicleForm(false)}
                        variant="secondary"
                        size="md"
                        disabled={createVehicleLoading}
                      >
                        Hủy
                      </BaseButton>
                      <BaseButton 
                        onClick={handleCreateVehicle}
                        loading={createVehicleLoading}
                        size="md"
                        disabled={!newVehicle.licensePlate || !newVehicle.vin || !newVehicle.color}
                      >
                        {createVehicleLoading ? 'Đang tạo...' : 'Tạo xe'}
                      </BaseButton>
                    </div>
                  </div>
                            </div>
              )}

              {vehiclesLoading && <div>Đang tải danh sách xe...</div>}
              {vehiclesError && <div style={{ color: 'red', padding: '1rem', backgroundColor: '#fee', borderRadius: 8, marginBottom: '1rem' }}>{vehiclesError}</div>}
              {!vehiclesLoading && !vehiclesError && userVehicles.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {userVehicles.map((vehicle) => (
                    <div key={vehicle.vehicleId} className={`vehicle-card ${selectedVehicle?.vehicleId === vehicle.vehicleId ? 'selected' : ''}`} style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-primary)', cursor: 'pointer' }} onClick={() => setSelectedVehicle(vehicle)}>
                      <div className="vehicle-info">
                        <h3>{vehicle.licensePlate}</h3>
                        <p className="vehicle-details">VIN: {vehicle.vin}</p>
                        <p className="vehicle-color">Màu: {vehicle.color}</p>
                        <div className="vehicle-status">
                          <span className="mileage">{vehicle.currentMileage.toLocaleString()} km</span>
                          {vehicle.lastServiceDate && (
                            <span className="last-service">Bảo dưỡng cuối: {formatDate(vehicle.lastServiceDate)}</span>
                          )}
                          </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
              {!vehiclesLoading && !vehiclesError && userVehicles.length === 0 && !showCreateVehicleForm && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 12,
                  border: '1px dashed #ddd'
                }}>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>Bạn chưa có xe nào trong hệ thống</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Hãy tạo xe mới để tiếp tục đặt lịch bảo dưỡng</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '1rem' }}>
                <BaseButton onClick={prevStep} variant="secondary">Quay lại</BaseButton>
                <BaseButton onClick={nextStep} disabled={!selectedVehicle} size="lg">Tiếp theo</BaseButton>
              </div>
            </div>
          )}

          {/* Step 3 - Chọn thời gian và trung tâm */}
          {currentStep === 3 && (
            <div className="booking-step">
              <h2>Chọn thời gian và trung tâm</h2>
              
              {/* Center Selection */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: '#004030' }}>
                  Chọn trung tâm bảo dưỡng
                </h3>
                
                {centersLoading && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    Đang tải danh sách trung tâm...
                  </div>
                )}
                
                {centersError && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
                    {centersError}
                  </div>
                )}
                
                {!centersLoading && !centersError && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {centers.map((center) => (
                      <div
                        key={center.centerId}
                        onClick={() => setSelectedCenter(center)}
                        style={{
                          padding: '1rem',
                          border: `2px solid ${selectedCenter?.centerId === center.centerId ? '#004030' : '#e5e7eb'}`,
                          borderRadius: 12,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: selectedCenter?.centerId === center.centerId ? '#f0fdf4' : '#ffffff',
                          boxShadow: selectedCenter?.centerId === center.centerId ? '0 0 0 3px rgba(0, 64, 48, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#004030', fontSize: '1.1rem' }}>
                          {center.centerName}
                        </h4>
                        <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                          📍 {center.address}
                        </p>
                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                          📞 {center.phoneNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                    )}
                  </div>

              {/* Date Selection */}
                  {selectedCenter && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: '#004030' }}>
                    Chọn ngày
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {getWeekDates(new Date().toISOString().split('T')[0]).map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        style={{
                          padding: '0.75rem 1rem',
                          border: `2px solid ${selectedDate === date ? '#004030' : '#e5e7eb'}`,
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: selectedDate === date ? '#004030' : '#ffffff',
                          color: selectedDate === date ? '#ffffff' : '#374151',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          minWidth: '120px'
                        }}
                      >
                        {formatDateDisplay(date)}
                      </button>
                    ))}
                  </div>
                    </div>
                  )}

              {/* Time Slots */}
              {selectedCenter && selectedDate && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: '#004030' }}>
                    Chọn giờ bảo dưỡng
                  </h3>
                  
                  {availabilityLoading && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      Đang tải thông tin khả dụng...
                </div>
                  )}
                  
                  {availabilityError && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
                      {availabilityError}
                </div>
                  )}
                  
                  {!availabilityLoading && !availabilityError && availability && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                      {availability.timeSlots.map((slot) => (
                        <button
                          key={slot.slotId}
                          onClick={() => {
                            if (slot.isAvailable) {
                              setSelectedTimeSlot(slot)
                              setSelectedTechnician(null) // Reset technician selection
                            }
                          }}
                          disabled={!slot.isAvailable}
                          style={{
                            padding: '0.75rem',
                            border: `2px solid ${selectedTimeSlot?.slotId === slot.slotId ? '#004030' : slot.isAvailable ? '#e5e7eb' : '#f3f4f6'}`,
                            borderRadius: 8,
                            cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            backgroundColor: selectedTimeSlot?.slotId === slot.slotId ? '#004030' : slot.isAvailable ? '#ffffff' : '#f9fafb',
                            color: selectedTimeSlot?.slotId === slot.slotId ? '#ffffff' : slot.isAvailable ? '#374151' : '#9ca3af',
                            fontWeight: 500,
                            opacity: slot.isAvailable ? 1 : 0.6
                          }}
                        >
                          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {slot.slotLabel}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  </div>
                )}

              {/* Selected Time Slot Info */}
              {selectedTimeSlot && (
                <div style={{ 
                  marginTop: '2rem', 
                  padding: '1rem', 
                  backgroundColor: '#f0fdf4', 
                  border: '1px solid #10b981', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#004030', fontSize: '1rem' }}>
                      Đã chọn: {selectedTimeSlot.slotLabel}
                    </h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      {selectedTimeSlot.availableTechnicians.filter(t => t.status === 'AVAILABLE').length} kỹ thuật viên có sẵn
                    </p>
              </div>
                  <button
                    onClick={() => {
                      setSelectedTimeSlot(null)
                      setSelectedTechnician(null)
                      releaseReservation()
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #10b981',
                      borderRadius: 6,
                      color: '#10b981',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    Chọn slot khác
                  </button>
              </div>
              )}

              {/* Reservation Countdown Timer */}
              {reservation.timeRemaining && reservation.timeRemaining > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#f59e0b',
                      animation: 'pulse 1s infinite'
                    }}></div>
                    <span style={{ color: '#92400e', fontWeight: 600 }}>
                      Đang đặt chỗ kỹ thuật viên - Còn lại: {formatCountdown(reservation.timeRemaining)}
                    </span>
                  </div>
                  <button
                    onClick={releaseReservation}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #f59e0b',
                      borderRadius: 4,
                      color: '#92400e',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }}
                  >
                    Hủy đặt chỗ
                  </button>
            </div>
          )}

              {/* Technician Selection */}
              {selectedTimeSlot && selectedTimeSlot.availableTechnicians.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: '#004030' }}>
                    Chọn kỹ thuật viên
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {selectedTimeSlot.availableTechnicians.map((technician) => {
                      const getStatusColor = () => {
                        switch (technician.status) {
                          case 'AVAILABLE': return '#10b981'
                          case 'RESERVED': return '#f59e0b'
                          case 'BUSY': return '#ef4444'
                          default: return '#6b7280'
                        }
                      }

                      const getStatusText = () => {
                        switch (technician.status) {
                          case 'AVAILABLE': return '🟢 Có sẵn'
                          case 'RESERVED': return '🟡 Đang được chọn'
                          case 'BUSY': return '🔴 Đã đầy'
                          default: return ''
                        }
                      }

                      const getStatusDescription = () => {
                        switch (technician.status) {
                          case 'AVAILABLE': return 'Có thể chọn'
                          case 'RESERVED': return `Được chọn bởi ${technician.reservedBy}`
                          case 'BUSY': return 'Không khả dụng'
                          default: return ''
                        }
                      }

                      const isClickable = technician.status === 'AVAILABLE' && !reservation.reservationId

                      return (
                        <div
                          key={technician.technicianId}
                          onClick={() => {
                            if (isClickable) {
                              setSelectedTechnician(technician)
                              reserveTechnician(technician)
                            }
                          }}
                          style={{
                            padding: '1rem',
                            border: `2px solid ${selectedTechnician?.technicianId === technician.technicianId ? '#004030' : getStatusColor()}`,
                            borderRadius: 12,
                            cursor: isClickable ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            backgroundColor: selectedTechnician?.technicianId === technician.technicianId ? '#f0fdf4' : '#ffffff',
                            boxShadow: selectedTechnician?.technicianId === technician.technicianId ? '0 0 0 3px rgba(0, 64, 48, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                            opacity: isClickable ? 1 : 0.6
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: getStatusColor(),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontWeight: 'bold',
                              fontSize: '1.2rem'
                            }}>
                              {technician.technicianName.charAt(0).toUpperCase()}
                  </div>
                            <div>
                              <h4 style={{ margin: '0 0 0.25rem 0', color: '#004030', fontSize: '1rem' }}>
                                {technician.technicianName}
                              </h4>
                              {getStatusText() && (
                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                                  {getStatusText()}
                                </p>
                              )}
                              {getStatusDescription() && (
                                <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.8rem' }}>
                                  {getStatusDescription()}
                                </p>
                              )}
                      </div>
                    </div>
                    </div>
                      )
                    })}
                    </div>
                      </div>
                    )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '2rem' }}>
                <BaseButton onClick={prevStep} variant="secondary">Quay lại</BaseButton>
                <BaseButton 
                  onClick={nextStep} 
                  disabled={!selectedCenter || !selectedDate || !selectedTimeSlot || !reservation.reservationId} 
                  size="lg"
                >
                  Tiếp theo
                </BaseButton>
                  </div>
            </div>
          )}

          {/* Step 4 - Xác nhận đặt lịch */}
          {currentStep === 4 && (
            <div className="booking-step">
              <h2>Xác nhận đặt lịch</h2>
              
              {/* Booking Summary */}
              <div style={{ 
                backgroundColor: '#f8f9fa',
                borderRadius: 12,
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: '#004030' }}>
                  Tóm tắt đặt lịch
                </h3>
                
                {/* Selected Services */}
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                    Dịch vụ đã chọn:
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedServices.map(serviceId => {
                      const service = services.find(s => s.id === serviceId)
                      return service ? (
                        <span
                          key={serviceId}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#004030',
                            color: '#ffffff',
                            borderRadius: 20,
                            fontSize: '0.9rem'
                          }}
                        >
                          {service.name}
                        </span>
                      ) : null
                    })}
                          </div>
                  </div>

                {/* Selected Vehicle */}
                {selectedVehicle && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                      Xe đã chọn:
                    </h4>
                    <p style={{ margin: 0, color: '#666' }}>
                      {selectedVehicle.licensePlate} - {selectedVehicle.color} - {selectedVehicle.currentMileage}km
                    </p>
                </div>
                )}

                {/* Selected Center */}
                {selectedCenter && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                      Trung tâm:
                    </h4>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#666' }}>
                      {selectedCenter.centerName}
                    </p>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                      📍 {selectedCenter.address}
                    </p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      📞 {selectedCenter.phoneNumber}
                    </p>
                  </div>
                )}

                {/* Selected Date & Time */}
                {selectedDate && selectedTimeSlot && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                      Thời gian:
                    </h4>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#666' }}>
                      📅 {formatDateDisplay(selectedDate)} - {selectedTimeSlot.slotLabel}
                    </p>
                  </div>
                )}

                {/* Selected Technician */}
                {selectedTechnician && reservation.reservationId && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                      Kỹ thuật viên:
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>
                        {selectedTechnician.technicianName.charAt(0).toUpperCase()}
                </div>
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontWeight: 500 }}>
                          {selectedTechnician.technicianName}
                        </p>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                          🟢 Đã đặt chỗ - ID: {reservation.reservationId}
                        </p>
                        {reservation.timeRemaining && reservation.timeRemaining > 0 && (
                          <p style={{ margin: '0.25rem 0 0 0', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 500 }}>
                            ⏰ Còn lại: {formatCountdown(reservation.timeRemaining)}
                          </p>
                        )}
              </div>
                    </div>
                  </div>
                )}

                {/* Total Price */}
                <div style={{ 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#004030' }}>
                    Tổng cộng:
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#004030' }}>
                    {totalPrice.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
                <BaseButton onClick={prevStep} variant="secondary">Quay lại</BaseButton>
                <BaseButton onClick={confirmBooking} loading={isSubmitting} size="lg">
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                </BaseButton>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}


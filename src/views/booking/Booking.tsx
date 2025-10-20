import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { ServiceManagementService, Service } from '@/services/serviceManagementService'
import { VehicleService, Vehicle } from '@/services/vehicleService'
import { CenterService, Center } from '@/services/centerService'
import { BookingService, AvailabilityResponse, TimeSlotAvailability, TechnicianAvailability } from '@/services/bookingService'
import Notification from '@/components/booking/Notification'
import StepsIndicator from '@/components/booking/StepsIndicator'
import ServiceSelection from '@/components/booking/ServiceSelection'
import VehicleSelection from '@/components/booking/VehicleSelection'
import TimeSelection from '@/components/booking/TimeSelection'
import BookingConfirmation from '@/components/booking/BookingConfirmation'
import BookingSuccess from '@/components/booking/BookingSuccess'
import './booking.scss'

export default function Booking() {
  // Get user from Redux store
  const user = useAppSelector((state) => state.auth.user)
  
  // State management with localStorage persistence
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem('booking-current-step')
    return savedStep ? parseInt(savedStep, 10) : 1
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
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return localStorage.getItem('booking-selected-date') || ''
  })
  
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotAvailability | null>(() => {
    const saved = localStorage.getItem('booking-selected-timeslot')
    return saved ? JSON.parse(saved) : null
  })
  
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianAvailability | null>(() => {
    const saved = localStorage.getItem('booking-selected-technician')
    return saved ? JSON.parse(saved) : null
  })
  
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('booking-notes') || ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservation, setReservation] = useState<any>(null)
  const [showSuccessPage, setShowSuccessPage] = useState(false)

  // API states
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState<string | null>(null)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [vehiclesError, setVehiclesError] = useState<string | null>(null)

  const [centers, setCenters] = useState<Center[]>([])
  const [centersLoading, setCentersLoading] = useState(false)
  const [centersError, setCentersError] = useState<string | null>(null)

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
    show: boolean
  }>({
    type: 'info',
    message: '',
    show: false
  })

  // Load services on mount
  useEffect(() => {
    const loadServices = async () => {
        setServicesLoading(true)
        setServicesError(null)
      try {
        const response = await ServiceManagementService.getServices()
        console.log('Services response:', response)
        setServices(response.services || [])
      } catch (error) {
        setServicesError('Không thể tải danh sách dịch vụ')
        console.error('Error loading services:', error)
      } finally {
        setServicesLoading(false)
      }
    }

    loadServices()
  }, [])

  // Save all booking state to localStorage whenever they change
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
    localStorage.setItem('booking-selected-date', selectedDate)
  }, [selectedDate])

  useEffect(() => {
    localStorage.setItem('booking-selected-timeslot', JSON.stringify(selectedTimeSlot))
  }, [selectedTimeSlot])

  useEffect(() => {
    localStorage.setItem('booking-selected-technician', JSON.stringify(selectedTechnician))
  }, [selectedTechnician])

  useEffect(() => {
    localStorage.setItem('booking-notes', notes)
  }, [notes])

  // Load vehicles when step 2 is reached
  useEffect(() => {
    if (currentStep === 2) {
      const loadUserVehicles = async () => {
      setVehiclesLoading(true)
      setVehiclesError(null)
        try {
          console.log('Loading vehicles...')
          console.log('User:', user)
          console.log('Token:', localStorage.getItem('token'))
          
          if (!user) {
            setVehiclesError('Vui lòng đăng nhập để xem danh sách xe')
            return
          }
          
          // Use getCustomerVehicles API (correct endpoint)
          const response = await VehicleService.getCustomerVehicles(user.id)
          console.log('Vehicles response:', response)
          
          // Extract vehicles from response
          const vehicles = response.data?.vehicles || []
          console.log('Extracted vehicles:', vehicles)
          
          if (vehicles.length === 0) {
            setVehiclesError('Bạn chưa có xe nào trong hệ thống. Vui lòng thêm xe trước khi đặt lịch.')
          } else {
            setVehicles(vehicles)
        }
      } catch (error) {
          console.error('Error loading vehicles:', error)
          setVehiclesError('Không thể tải danh sách xe')
      } finally {
      setVehiclesLoading(false)
      }
    }

      loadUserVehicles()
    }
  }, [currentStep, user])

  // Load centers when step 3 is reached
  useEffect(() => {
    if (currentStep === 3) {
      const loadActiveCenters = async () => {
        setCentersLoading(true)
        setCentersError(null)
        try {
          console.log('Loading active centers...')
          const response = await CenterService.getActiveCenters()
          console.log('Centers response:', response)
          
          // Handle the response format from your API
          if (response.centers) {
            setCenters(response.centers)
            console.log('Centers loaded:', response.centers)
          } else {
            console.log('No centers found in response')
            setCenters([])
        }
      } catch (error) {
          setCentersError('Không thể tải danh sách trung tâm')
          console.error('Error loading centers:', error)
        } finally {
          setCentersLoading(false)
        }
      }

      loadActiveCenters()
    }
  }, [currentStep])

  // Helper functions
  const toggleService = (id: number) => {
    setSelectedServices([id]) // Chỉ cho phép chọn 1 dịch vụ
  }

  const nextStep = () => { 
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      setTimeout(() => {
        const stepsIndicator = document.querySelector('.steps-indicator')
        if (stepsIndicator) {
          stepsIndicator.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }
  
  const prevStep = () => { 
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setTimeout(() => {
        const stepsIndicator = document.querySelector('.steps-indicator')
        if (stepsIndicator) {
          stepsIndicator.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const confirmBooking = async () => {
    if (!user || !user.id) {
      setNotification({
        type: 'error',
        message: 'Vui lòng đăng nhập để đặt lịch.',
        show: true
      })
      return
    }

    if (!selectedVehicle || !selectedCenter || !selectedTimeSlot || selectedServices.length === 0) {
      setNotification({
        type: 'error',
        message: 'Vui lòng chọn đầy đủ thông tin trước khi đặt lịch.',
        show: true
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare booking data
      const bookingData = {
        vehicleId: selectedVehicle.vehicleId,
        centerId: selectedCenter.centerId,
        bookingDate: selectedDate,
        slotId: selectedTimeSlot.slotId,
        serviceId: selectedServices[0], // Take first selected service since API expects single service
        customerId: user.id, // Use user ID from Redux store
        notes: notes || undefined,
        specialRequests: notes || '', // Use notes as special requests
        request: `Đặt lịch bảo dưỡng xe ${selectedVehicle.licensePlate} tại ${selectedCenter.centerName} vào ${selectedDate} ${selectedTimeSlot.slotTime}`
      }

      console.log('Creating booking with data:', bookingData)
      console.log('Selected date from UI:', selectedDate)
      console.log('Selected date type:', typeof selectedDate)
      console.log('Current date:', new Date().toISOString().split('T')[0])

      // Create booking via API
      const createdBooking = await BookingService.createBooking(bookingData)
      
      console.log('Booking created successfully:', createdBooking)

      // Set reservation state for success UI
      const reservationData = {
        reservationId: `BK${createdBooking.bookingId}`,
        bookingId: createdBooking.bookingId,
        timeRemaining: 15 * 60, // 15 minutes
        status: createdBooking.status,
        vehicle: selectedVehicle,
        center: selectedCenter,
        appointmentDate: selectedDate,
        timeSlot: selectedTimeSlot?.slotTime,
        services: selectedServices.map(id => services.find(s => s.id === id)).filter(Boolean),
        totalAmount: totalPrice
      }
      
      setReservation(reservationData)
      setShowSuccessPage(true)

      // Clear form data after successful booking
      setSelectedServices([])
      setSelectedVehicle(null)
      setSelectedCenter(null)
      setSelectedDate('')
      setSelectedTimeSlot(null)
      setSelectedTechnician(null)
      setNotes('')
      
      // Clear localStorage after successful booking
      localStorage.removeItem('booking-current-step')
      localStorage.removeItem('booking-selected-services')
      localStorage.removeItem('booking-selected-vehicle')
      localStorage.removeItem('booking-selected-center')
      localStorage.removeItem('booking-selected-date')
      localStorage.removeItem('booking-selected-timeslot')
      localStorage.removeItem('booking-selected-technician')
      localStorage.removeItem('booking-notes')
      
    } catch (error: any) {
      console.error('Error creating booking:', error)
      
      let errorMessage = 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      setNotification({
        type: 'error',
        message: errorMessage,
        show: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }))
  }

  // Function to clear all booking data and start fresh
  const handlePaymentSuccess = () => {
    console.log('Payment successful!')
    setShowSuccessPage(false)
    setReservation(null)
    // Reset to step 1
    setCurrentStep(1)
  }

  const handleBackToHome = () => {
    setShowSuccessPage(false)
    setReservation(null)
    // Reset to step 1
    setCurrentStep(1)
  }

  const clearBookingData = () => {
    setCurrentStep(1)
    setSelectedServices([])
    setSelectedVehicle(null)
    setSelectedCenter(null)
    setSelectedDate('')
    setSelectedTimeSlot(null)
    setSelectedTechnician(null)
    setNotes('')
    setReservation(null)
    
    // Clear localStorage
    localStorage.removeItem('booking-current-step')
    localStorage.removeItem('booking-selected-services')
    localStorage.removeItem('booking-selected-vehicle')
    localStorage.removeItem('booking-selected-center')
    localStorage.removeItem('booking-selected-date')
    localStorage.removeItem('booking-selected-timeslot')
    localStorage.removeItem('booking-selected-technician')
    localStorage.removeItem('booking-notes')
  }

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId)
      return total + (service?.price || 0)
    }, 0)
  }, [selectedServices, services])

  return (
    <div className="booking-page" style={{ 
      minHeight: '100vh', 
      padding: '2rem 0', 
      background: 'linear-gradient(135deg, #FFF9E5 0%, #F8F9FA 100%)',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    }}>
      {/* Notification */}
      <Notification
        type={notification.type}
        message={notification.message}
        show={notification.show}
        onClose={hideNotification}
      />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        {/* Clear data button */}
        {(selectedServices.length > 0 || selectedVehicle || selectedCenter || selectedDate) && (
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <button
              onClick={clearBookingData}
                      style={{ 
                background: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Bắt đầu lại
            </button>
          </div>
        )}

          {/* Steps indicator */}
        <StepsIndicator 
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        {/* Step 1 - Service Selection */}
          {currentStep === 1 && (
          <ServiceSelection
            services={services}
            selectedServices={selectedServices}
            onToggleService={toggleService}
            onNext={nextStep}
            loading={servicesLoading}
            error={servicesError}
          />
        )}

        {/* Step 2 - Vehicle Selection */}
          {currentStep === 2 && (
          <VehicleSelection
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
            onNext={nextStep}
            onPrev={prevStep}
            loading={vehiclesLoading}
            error={vehiclesError}
            onCreateVehicle={() => {
              // Handle creating new vehicle - could navigate to vehicle creation page
              console.log('Create new vehicle clicked')
                          }}
                        />
                      )}

        {/* Step 3 - Time Selection */}
        {currentStep === 3 && (
          <TimeSelection
            centers={centers}
            selectedCenter={selectedCenter}
            onSelectCenter={setSelectedCenter}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedTimeSlot={selectedTimeSlot}
            onSelectTimeSlot={setSelectedTimeSlot}
            selectedTechnician={selectedTechnician}
            onSelectTechnician={setSelectedTechnician}
            onNext={nextStep}
            onPrev={prevStep}
            loading={centersLoading}
            error={centersError}
          />
        )}

        {/* Step 4 - Confirmation */}
          {currentStep === 4 && (
          <BookingConfirmation
            selectedServices={selectedServices}
            services={services}
            selectedVehicle={selectedVehicle}
            selectedCenter={selectedCenter}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            selectedTechnician={selectedTechnician}
            notes={notes}
            onNotesChange={setNotes}
            totalPrice={totalPrice}
            onConfirm={confirmBooking}
            onPrev={prevStep}
            isSubmitting={isSubmitting}
            reservation={reservation}
          />
        )}

        {/* Success Page */}
        {showSuccessPage && reservation && (
          <BookingSuccess
            bookingId={reservation.bookingId}
            reservationId={reservation.reservationId}
            vehicle={reservation.vehicle}
            center={reservation.center}
            appointmentDate={reservation.appointmentDate}
            timeSlot={reservation.timeSlot}
            services={reservation.services}
            totalAmount={reservation.totalAmount}
            onPaymentSuccess={handlePaymentSuccess}
            onBackToHome={handleBackToHome}
          />
        )}
                  </div>
    </div>
  )
}
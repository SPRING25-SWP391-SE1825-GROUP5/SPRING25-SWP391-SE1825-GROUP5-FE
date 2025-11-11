import React, { useState, useEffect, useCallback } from 'react'
import { Search, User, Car, Wrench, MapPin, Clock, FileText, Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { CustomerService } from '@/services/customerService'
import { VehicleService } from '@/services/vehicleService'
import { ServiceManagementService } from '@/services/serviceManagementService'
import { CenterService } from '@/services/centerService'
import { TechnicianService } from '@/services/technicianService'
import { createBooking, holdSlot } from '@/services/bookingFlowService'
import { TechnicianTimeSlotService } from '@/services/technicianTimeSlotService'
import { TimeSlotService } from '@/services/technicianService'
import toast from 'react-hot-toast'

interface NewAccountInfo {
  fullName: string
  phone: string
  email: string
}

interface VehicleInfo {
  vehicleId?: number
  licensePlate: string
  carModel: string
  modelId?: number
  mileage: string
  recentMileage?: string
}

interface ServiceInfo {
  services: string[]
  notes: string
}

interface LocationTimeInfo {
  centerId: string
  technicianId: string
  date: string
  time: string
  technicianSlotId?: number
  centerName?: string
  technicianName?: string
}

export default function CreateBookingPage() {
  // Customer states
  const [customerOption, setCustomerOption] = useState<'existing' | 'new'>('existing')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [customerFound, setCustomerFound] = useState<any>(null)
  const [newAccountInfo, setNewAccountInfo] = useState<NewAccountInfo>({
    fullName: '',
    phone: '',
    email: ''
  })
  const [creatingAccount, setCreatingAccount] = useState(false)

  // Vehicle states
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    licensePlate: '',
    carModel: '',
    mileage: ''
  })
  const [showCreateVehicle, setShowCreateVehicle] = useState(false)

  // Service states
  const [services, setServices] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo>({
    services: [],
    notes: ''
  })

  // Location & Time states
  const [centers, setCenters] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [locationTimeInfo, setLocationTimeInfo] = useState<LocationTimeInfo>({
    centerId: '',
    technicianId: '',
    date: '',
    time: ''
  })

  // Other states
  const [internalNotes, setInternalNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    customer: true,
    vehicle: true,
    service: true,
    location: true,
    notes: true
  })

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [svcRes, catRes, centerRes] = await Promise.all([
          ServiceManagementService.getActiveServices({ pageSize: 100 }),
          ServiceManagementService.getServiceCategories(),
          CenterService.getActiveCenters()
        ])
        setServices(svcRes.services || [])
        setCategories(Array.isArray(catRes) ? catRes : [])
        setCenters(centerRes.centers || [])
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }
    loadInitialData()
  }, [])

  // Search customer by phone/email
  const handleSearchCustomer = async () => {
    if (!searchQuery.trim()) {
      toast.error('Vui lòng nhập số điện thoại hoặc email')
      return
    }

    setSearching(true)
    try {
      // Determine if search query is email or phone
      const phoneRegex = /^0\d{9}$/
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      let params: { email?: string; phone?: string } = {}
      if (emailRegex.test(searchQuery.trim())) {
        params.email = searchQuery.trim()
      } else if (phoneRegex.test(searchQuery.trim())) {
        params.phone = searchQuery.trim()
      } else {
        toast.error('Vui lòng nhập số điện thoại (10 số, bắt đầu bằng 0) hoặc email hợp lệ')
        setSearching(false)
        return
      }

      const result = await CustomerService.findByEmailOrPhone(params)
      
      if (result.data?.customerId) {
        setCustomerFound({
          customerId: result.data.customerId,
          userFullName: result.data.fullName,
          userEmail: result.data.email,
          userPhoneNumber: result.data.phoneNumber
        })
        toast.success('Tìm thấy khách hàng')
        
        // Load vehicles for this customer
        const vehiclesRes = await VehicleService.getCustomerVehicles(result.data.customerId)
        setVehicles(vehiclesRes.data?.vehicles || [])
      } else {
        toast.error('Không tìm thấy khách hàng. Vui lòng tạo mới.')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không tìm thấy khách hàng'
      toast.error(errorMsg)
    } finally {
      setSearching(false)
    }
  }

  // Create new customer using quick create
  const handleCreateAccount = async () => {
    // Validate
    if (!newAccountInfo.fullName || !newAccountInfo.email || !newAccountInfo.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newAccountInfo.email)) {
      toast.error('Email không hợp lệ')
      return
    }

    // Validate phone format (10 digits starting with 0)
    const phoneRegex = /^0\d{9}$/
    if (!phoneRegex.test(newAccountInfo.phone)) {
      toast.error('Số điện thoại không hợp lệ (phải có 10 số, bắt đầu bằng 0)')
      return
    }

    setCreatingAccount(true)
    try {
      const result = await CustomerService.quickCreateCustomer({
        fullName: newAccountInfo.fullName,
        phoneNumber: newAccountInfo.phone,
        email: newAccountInfo.email
      })

      if (result.data?.customerId) {
        setCustomerFound({
          customerId: result.data.customerId,
          userFullName: result.data.userFullName || newAccountInfo.fullName,
          userEmail: result.data.userEmail || newAccountInfo.email,
          userPhoneNumber: result.data.userPhoneNumber || newAccountInfo.phone
        })
        toast.success('Tạo khách hàng thành công')
        
        // Load vehicles for this customer
        const vehiclesRes = await VehicleService.getCustomerVehicles(result.data.customerId)
        setVehicles(vehiclesRes.data?.vehicles || [])
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Không thể tạo khách hàng'
      toast.error(errorMsg)
    } finally {
      setCreatingAccount(false)
    }
  }

  // Load vehicles when customer is selected
  useEffect(() => {
    if (customerFound?.customerId) {
      const loadVehicles = async () => {
        try {
          const res = await VehicleService.getCustomerVehicles(customerFound.customerId)
          setVehicles(res.data?.vehicles || [])
        } catch (error) {
          console.error('Error loading vehicles:', error)
        }
      }
      loadVehicles()
    }
  }, [customerFound])

  // Load technicians when center is selected
  useEffect(() => {
    if (locationTimeInfo.centerId) {
      const loadTechnicians = async () => {
        try {
          const res = await TechnicianService.list({ 
            pageNumber: 1, 
            pageSize: 100, 
            centerId: Number(locationTimeInfo.centerId) 
          })
          setTechnicians(res.technicians || [])
        } catch (error) {
          console.error('Error loading technicians:', error)
        }
      }
      loadTechnicians()
    }
  }, [locationTimeInfo.centerId])

  // Load slots when technician and date are selected
  useEffect(() => {
    const loadSlots = async () => {
      if (!locationTimeInfo.technicianId || !locationTimeInfo.date || !locationTimeInfo.centerId) {
        setSlots([])
        return
      }

      try {
        // Get all time slots first
        const allSlots = await TimeSlotService.list(true)
        
        // Get technician schedule for the selected date
        const scheduleRes = await TechnicianTimeSlotService.getScheduleByTechnician(
          Number(locationTimeInfo.technicianId),
          locationTimeInfo.date,
          locationTimeInfo.date
        )

        // Map schedule to available slots
        const availableSlots = allSlots.map((slot: any) => {
          const scheduleItem = Array.isArray(scheduleRes) 
            ? scheduleRes.find((s: any) => {
                const scheduleDate = new Date(s.workDate).toISOString().split('T')[0]
                return scheduleDate === locationTimeInfo.date && s.slotId === slot.slotId
              })
            : null

          return {
            slotId: slot.slotId,
            slotTime: slot.slotTime,
            slotLabel: slot.slotLabel || slot.slotTime,
            isAvailable: scheduleItem ? (scheduleItem.isAvailable && !scheduleItem.hasBooking) : false,
            technicianSlotId: scheduleItem?.technicianSlotId,
            technicianId: Number(locationTimeInfo.technicianId)
          }
        })

        setSlots(availableSlots)
      } catch (error) {
        console.error('Error loading slots:', error)
        setSlots([])
      }
    }

    const debounceTimer = setTimeout(loadSlots, 300)
    return () => clearTimeout(debounceTimer)
  }, [locationTimeInfo.technicianId, locationTimeInfo.date, locationTimeInfo.centerId])

  // Select existing vehicle
  const handleSelectVehicle = (vehicle: any) => {
    setSelectedVehicleId(vehicle.vehicleId)
    setVehicleInfo({
      vehicleId: vehicle.vehicleId,
      licensePlate: vehicle.licensePlate || '',
      carModel: vehicle.modelName || vehicle.vin || '',
      modelId: vehicle.modelId,
      mileage: String(vehicle.currentMileage || 0)
    })
  }

  // Create new vehicle
  const handleCreateVehicle = async () => {
    if (!customerFound?.customerId) {
      toast.error('Vui lòng chọn khách hàng trước')
      return
    }

    if (!vehicleInfo.licensePlate || !vehicleInfo.carModel) {
      toast.error('Vui lòng điền biển số và dòng xe')
      return
    }

    try {
      const result = await VehicleService.createVehicle({
        customerId: customerFound.customerId,
        vin: vehicleInfo.carModel,
        licensePlate: vehicleInfo.licensePlate,
        currentMileage: Number(vehicleInfo.mileage || 0),
        modelId: vehicleInfo.modelId,
        color: 'Không xác định' // Default color if not provided
      })

      if (result.data?.vehicleId) {
        toast.success('Tạo xe thành công')
        setSelectedVehicleId(result.data.vehicleId)
        setShowCreateVehicle(false)
        
        // Reload vehicles
        const vehiclesRes = await VehicleService.getCustomerVehicles(customerFound.customerId)
        setVehicles(vehiclesRes.data?.vehicles || [])
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo xe')
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!customerFound?.customerId) {
      newErrors.customer = 'Vui lòng tìm hoặc tạo khách hàng'
    }
    if (!vehicleInfo.licensePlate) {
      newErrors.vehicle = 'Vui lòng chọn hoặc tạo xe'
    }
    if (serviceInfo.services.length === 0) {
      newErrors.service = 'Vui lòng chọn ít nhất một dịch vụ'
    }
    if (!locationTimeInfo.centerId) {
      newErrors.center = 'Vui lòng chọn trung tâm'
    }
    if (!locationTimeInfo.technicianId) {
      newErrors.technician = 'Vui lòng chọn kỹ thuật viên'
    }
    if (!locationTimeInfo.date) {
      newErrors.date = 'Vui lòng chọn ngày'
    }
    if (!locationTimeInfo.time || !locationTimeInfo.technicianSlotId) {
      newErrors.time = 'Vui lòng chọn giờ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit booking
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    setIsSubmitting(true)
    try {
      // Hold slot first
      if (locationTimeInfo.technicianSlotId && locationTimeInfo.centerId) {
        await holdSlot({
          centerId: Number(locationTimeInfo.centerId),
          technicianSlotId: Number(locationTimeInfo.technicianSlotId),
          technicianId: Number(locationTimeInfo.technicianId),
          date: locationTimeInfo.date
        })
      }

      // Create booking
      const bookingPayload = {
        customerId: customerFound.customerId!,
        vehicleId: selectedVehicleId || vehicleInfo.vehicleId!,
        centerId: Number(locationTimeInfo.centerId),
        bookingDate: locationTimeInfo.date,
        technicianSlotId: Number(locationTimeInfo.technicianSlotId!),
        technicianId: Number(locationTimeInfo.technicianId),
        specialRequests: serviceInfo.notes || 'Không có yêu cầu đặc biệt',
        serviceId: Number(serviceInfo.services[0]),
        currentMileage: Number(vehicleInfo.mileage || 0),
        licensePlate: vehicleInfo.licensePlate
      }

      const result = await createBooking(bookingPayload)
      
      toast.success('Tạo booking thành công!')
      
      // Reset form
      setCustomerFound(null)
      setSearchQuery('')
      setNewAccountInfo({
        fullName: '',
        phone: '',
        email: ''
      })
      setVehicleInfo({ licensePlate: '', carModel: '', mileage: '' })
      setServiceInfo({ services: [], notes: '' })
      setLocationTimeInfo({ centerId: '', technicianId: '', date: '', time: '' })
      setInternalNotes('')
      setSelectedVehicleId(null)
      setVehicles([])
      setCustomerOption('existing')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const filteredServices = selectedCategoryId
    ? services.filter(s => s.categoryId === selectedCategoryId)
    : services

  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      background: '#fff'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '16px',
          fontWeight: 300,
          margin: 0,
          color: 'var(--text-primary)',
          letterSpacing: '0.5px'
        }}>Tạo booking</h1>
      </div>

      {/* Customer Search Section */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid rgba(255, 216, 117, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          cursor: 'pointer'
        }} onClick={() => toggleSection('customer')}>
          <User size={18} style={{ color: '#FFD875' }} />
          <h2 style={{
            fontSize: '13px',
            fontWeight: 300,
            margin: 0,
            color: 'var(--text-primary)',
            flex: 1
          }}>Khách hàng</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {expandedSections.customer ? '−' : '+'}
          </span>
        </div>

        {expandedSections.customer && (
          <div>
            {!customerFound ? (
              <>
                {/* Option Selection */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '20px',
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 216, 117, 0.3)'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    background: customerOption === 'existing' ? 'rgba(255, 216, 117, 0.1)' : 'transparent',
                    border: `1px solid ${customerOption === 'existing' ? '#FFD875' : 'transparent'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="radio"
                      name="customerOption"
                      value="existing"
                      checked={customerOption === 'existing'}
                      onChange={(e) => {
                        setCustomerOption('existing')
                        setSearchQuery('')
                      }}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${customerOption === 'existing' ? '#FFD875' : 'var(--text-tertiary)'}`,
                      background: customerOption === 'existing' ? '#FFD875' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {customerOption === 'existing' && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#000'
                        }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'var(--text-primary)'
                    }}>Khách hàng đã có tài khoản</span>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    background: customerOption === 'new' ? 'rgba(255, 216, 117, 0.1)' : 'transparent',
                    border: `1px solid ${customerOption === 'new' ? '#FFD875' : 'transparent'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="radio"
                      name="customerOption"
                      value="new"
                      checked={customerOption === 'new'}
                      onChange={(e) => {
                        setCustomerOption('new')
                        setSearchQuery('')
                      }}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${customerOption === 'new' ? '#FFD875' : 'var(--text-tertiary)'}`,
                      background: customerOption === 'new' ? '#FFD875' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {customerOption === 'new' && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#000'
                        }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'var(--text-primary)'
                    }}>Khách hàng chưa có tài khoản</span>
                  </label>
                </div>

                {/* Existing Customer Search */}
                {customerOption === 'existing' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-tertiary)'
                        }} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearchCustomer()}
                          placeholder="Nhập số điện thoại hoặc email để tìm khách hàng"
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            border: 'none',
                            borderRadius: '8px',
                            background: '#fff',
                            fontSize: '12px',
                            fontWeight: 300,
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.target.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.2)'
                          }}
                          onBlur={(e) => {
                            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        />
                      </div>
                      <button
                        onClick={handleSearchCustomer}
                        disabled={searching}
                        style={{
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '8px',
                          background: '#FFD875',
                          color: '#000',
                          fontSize: '12px',
                          fontWeight: 300,
                          cursor: searching ? 'wait' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: searching ? 0.6 : 1
                        }}
                      >
                        {searching ? 'Đang tìm...' : 'Tìm'}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Account Creation Form */}
                {customerOption === 'new' && (
                  <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    border: '1px solid rgba(255, 216, 117, 0.3)'
                  }}>
                    <h3 style={{
                      fontSize: '12px',
                      fontWeight: 300,
                      margin: '0 0 16px 0',
                      color: 'var(--text-primary)'
                    }}>Tạo khách hàng mới</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 300,
                          color: 'var(--text-secondary)',
                          marginBottom: '6px'
                        }}>Họ tên *</label>
                        <input
                          type="text"
                          value={newAccountInfo.fullName}
                          onChange={(e) => setNewAccountInfo(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Nhập họ tên"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: 'var(--bg-secondary)',
                            fontSize: '12px',
                            fontWeight: 300,
                            color: 'var(--text-primary)',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 300,
                          color: 'var(--text-secondary)',
                          marginBottom: '6px'
                        }}>Số điện thoại *</label>
                        <input
                          type="tel"
                          value={newAccountInfo.phone}
                          onChange={(e) => setNewAccountInfo(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="0xxxxxxxxx (10 số)"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: 'var(--bg-secondary)',
                            fontSize: '12px',
                            fontWeight: 300,
                            color: 'var(--text-primary)',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 300,
                          color: 'var(--text-secondary)',
                          marginBottom: '6px'
                        }}>Email *</label>
                        <input
                          type="email"
                          value={newAccountInfo.email}
                          onChange={(e) => setNewAccountInfo(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="example@email.com"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: 'var(--bg-secondary)',
                            fontSize: '12px',
                            fontWeight: 300,
                            color: 'var(--text-primary)',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleCreateAccount}
                        disabled={creatingAccount}
                        style={{
                          padding: '10px 24px',
                          border: 'none',
                          borderRadius: '6px',
                          background: creatingAccount ? 'var(--bg-secondary)' : '#FFD875',
                          color: creatingAccount ? 'var(--text-secondary)' : '#000',
                          fontSize: '12px',
                          fontWeight: 300,
                          cursor: creatingAccount ? 'wait' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: creatingAccount ? 0.6 : 1
                        }}
                      >
                        {creatingAccount ? 'Đang tạo...' : 'Tạo khách hàng'}
                      </button>
                    </div>
                  </div>
                )}

                {errors.customer && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <AlertCircle size={12} />
                    {errors.customer}
                  </div>
                )}
              </>
            ) : (
              <div style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(255, 216, 117, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 300, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {customerFound.userFullName || customerFound.fullName}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 300, color: 'var(--text-secondary)' }}>
                      {customerFound.userPhoneNumber || customerFound.phone} • {customerFound.userEmail || customerFound.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCustomerFound(null)
                      setSearchQuery('')
                      setVehicles([])
                      setSelectedVehicleId(null)
                    }}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: 300,
                      cursor: 'pointer'
                    }}
                  >
                    Đổi khách hàng
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#10b981',
                  fontWeight: 300
                }}>
                  <CheckCircle size={12} />
                  Đã tìm thấy khách hàng
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vehicle Section */}
      {customerFound && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 216, 117, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            cursor: 'pointer'
          }} onClick={() => toggleSection('vehicle')}>
            <Car size={18} style={{ color: '#FFD875' }} />
            <h2 style={{
              fontSize: '13px',
              fontWeight: 300,
              margin: 0,
              color: 'var(--text-primary)',
              flex: 1
            }}>Xe</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {expandedSections.vehicle ? '−' : '+'}
            </span>
          </div>

          {expandedSections.vehicle && (
            <div>
              {vehicles.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 300,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>Chọn xe có sẵn:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle.vehicleId}
                        onClick={() => handleSelectVehicle(vehicle)}
                        style={{
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: selectedVehicleId === vehicle.vehicleId ? '#FFD875' : '#fff',
                          color: selectedVehicleId === vehicle.vehicleId ? '#000' : 'var(--text-primary)',
                          fontSize: '11px',
                          fontWeight: 300,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {vehicle.licensePlate} - {vehicle.modelName || vehicle.vin}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!selectedVehicleId && (
                <>
                  {!showCreateVehicle ? (
                    <button
                      onClick={() => setShowCreateVehicle(true)}
                      style={{
                        padding: '10px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#FFD875',
                        color: '#000',
                        fontSize: '12px',
                        fontWeight: 300,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={14} />
                      Tạo xe mới
                    </button>
                  ) : (
                    <div style={{
                      background: '#fff',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid rgba(255, 216, 117, 0.3)'
                    }}>
                      <h3 style={{
                        fontSize: '12px',
                        fontWeight: 300,
                        margin: '0 0 12px 0',
                        color: 'var(--text-primary)'
                      }}>Thông tin xe</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 300,
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>Biển số *</label>
                          <input
                            type="text"
                            value={vehicleInfo.licensePlate}
                            onChange={(e) => setVehicleInfo(prev => ({ ...prev, licensePlate: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: 'none',
                              borderRadius: '6px',
                              background: 'var(--bg-secondary)',
                              fontSize: '12px',
                              fontWeight: 300,
                              color: 'var(--text-primary)',
                              outline: 'none',
                              boxSizing: 'border-box',
                              height: '40px'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 300,
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>Dòng xe *</label>
                          <input
                            type="text"
                            value={vehicleInfo.carModel}
                            onChange={(e) => setVehicleInfo(prev => ({ ...prev, carModel: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: 'none',
                              borderRadius: '6px',
                              background: 'var(--bg-secondary)',
                              fontSize: '12px',
                              fontWeight: 300,
                              color: 'var(--text-primary)',
                              outline: 'none',
                              boxSizing: 'border-box',
                              height: '40px'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 300,
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>Số km</label>
                          <input
                            type="number"
                            value={vehicleInfo.mileage}
                            onChange={(e) => setVehicleInfo(prev => ({ ...prev, mileage: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: 'none',
                              borderRadius: '6px',
                              background: 'var(--bg-secondary)',
                              fontSize: '12px',
                              fontWeight: 300,
                              color: 'var(--text-primary)',
                              outline: 'none',
                              boxSizing: 'border-box',
                              height: '40px'
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setShowCreateVehicle(false)
                            setVehicleInfo({ licensePlate: '', carModel: '', mileage: '' })
                          }}
                          style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: 300,
                            cursor: 'pointer'
                          }}
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleCreateVehicle}
                          style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#FFD875',
                            color: '#000',
                            fontSize: '12px',
                            fontWeight: 300,
                            cursor: 'pointer'
                          }}
                        >
                          Tạo xe
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedVehicleId && (
                <div style={{
                  background: '#fff',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid rgba(255, 216, 117, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 300,
                  color: 'var(--text-primary)'
                }}>
                  <CheckCircle size={14} style={{ color: '#10b981' }} />
                  Đã chọn: {vehicleInfo.licensePlate} - {vehicleInfo.carModel}
                </div>
              )}

              {errors.vehicle && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <AlertCircle size={12} />
                  {errors.vehicle}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Service Section */}
      {customerFound && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 216, 117, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            cursor: 'pointer'
          }} onClick={() => toggleSection('service')}>
            <Wrench size={18} style={{ color: '#FFD875' }} />
            <h2 style={{
              fontSize: '13px',
              fontWeight: 300,
              margin: 0,
              color: 'var(--text-primary)',
              flex: 1
            }}>Dịch vụ</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {expandedSections.service ? '−' : '+'}
            </span>
          </div>

          {expandedSections.service && (
            <div>
              {categories.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 300,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>Danh mục</label>
                  <select
                    value={selectedCategoryId || ''}
                    onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#fff',
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 300,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>Chọn dịch vụ *</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '8px'
                }}>
                  {filteredServices.map((service) => (
                    <label
                      key={service.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        padding: '12px 14px',
                        background: serviceInfo.services.includes(String(service.id)) ? '#FFD875' : '#fff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${serviceInfo.services.includes(String(service.id)) ? '#FFD875' : 'transparent'}`
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={serviceInfo.services.includes(String(service.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setServiceInfo(prev => ({
                              ...prev,
                              services: [...prev.services, String(service.id)]
                            }))
                          } else {
                            setServiceInfo(prev => ({
                              ...prev,
                              services: prev.services.filter(s => s !== String(service.id))
                            }))
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 400,
                        color: serviceInfo.services.includes(String(service.id)) ? '#000' : 'var(--text-primary)',
                        lineHeight: '1.5',
                        marginBottom: '4px'
                      }}>
                        {service.name || service.serviceName}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 300,
                        color: serviceInfo.services.includes(String(service.id)) ? '#666' : 'var(--text-tertiary)'
                      }}>
                        {service.price?.toLocaleString('vi-VN')}đ
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 300,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>Ghi chú yêu cầu</label>
                <textarea
                  value={serviceInfo.notes}
                  onChange={(e) => setServiceInfo(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Nhập yêu cầu đặc biệt (nếu có)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#fff',
                    fontSize: '12px',
                    fontWeight: 300,
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {errors.service && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <AlertCircle size={12} />
                  {errors.service}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Location & Time Section */}
      {customerFound && serviceInfo.services.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 216, 117, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            cursor: 'pointer'
          }} onClick={() => toggleSection('location')}>
            <MapPin size={18} style={{ color: '#FFD875' }} />
            <h2 style={{
              fontSize: '13px',
              fontWeight: 300,
              margin: 0,
              color: 'var(--text-primary)',
              flex: 1
            }}>Địa điểm & Thời gian</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {expandedSections.location ? '−' : '+'}
            </span>
          </div>

          {expandedSections.location && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 300,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>Trung tâm *</label>
                  <select
                    value={locationTimeInfo.centerId}
                    onChange={(e) => {
                      setLocationTimeInfo(prev => ({
                        ...prev,
                        centerId: e.target.value,
                        technicianId: '',
                        date: '',
                        time: '',
                        technicianSlotId: undefined
                      }))
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#fff',
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Chọn trung tâm --</option>
                    {centers.map((center) => (
                      <option key={center.centerId} value={center.centerId}>
                        {center.centerName}
                      </option>
                    ))}
                  </select>
                  {errors.center && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertCircle size={12} />
                      {errors.center}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 300,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>Kỹ thuật viên *</label>
                  <select
                    value={locationTimeInfo.technicianId}
                    onChange={(e) => {
                      setLocationTimeInfo(prev => ({
                        ...prev,
                        technicianId: e.target.value,
                        date: '',
                        time: '',
                        technicianSlotId: undefined
                      }))
                    }}
                    disabled={!locationTimeInfo.centerId}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: locationTimeInfo.centerId ? '#fff' : 'var(--bg-secondary)',
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'var(--text-primary)',
                      cursor: locationTimeInfo.centerId ? 'pointer' : 'not-allowed',
                      outline: 'none',
                      opacity: locationTimeInfo.centerId ? 1 : 0.6
                    }}
                  >
                    <option value="">-- Chọn kỹ thuật viên --</option>
                    {technicians.map((tech) => (
                      <option key={tech.technicianId} value={tech.technicianId}>
                        {tech.userFullName || `KTV #${tech.technicianId}`}
                      </option>
                    ))}
                  </select>
                  {errors.technician && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertCircle size={12} />
                      {errors.technician}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 300,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>Ngày *</label>
                  <input
                    type="date"
                    value={locationTimeInfo.date}
                    onChange={(e) => {
                      setLocationTimeInfo(prev => ({
                        ...prev,
                        date: e.target.value,
                        time: '',
                        technicianSlotId: undefined
                      }))
                    }}
                    min={new Date().toISOString().slice(0, 10)}
                    disabled={!locationTimeInfo.technicianId}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: locationTimeInfo.technicianId ? '#fff' : 'var(--bg-secondary)',
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      opacity: locationTimeInfo.technicianId ? 1 : 0.6
                    }}
                  />
                  {errors.date && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertCircle size={12} />
                      {errors.date}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 300,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>Giờ *</label>
                  <select
                    value={locationTimeInfo.time}
                    onChange={(e) => {
                      const selectedSlot = slots.find(s => s.slotTime === e.target.value)
                      setLocationTimeInfo(prev => ({
                        ...prev,
                        time: e.target.value,
                        technicianSlotId: selectedSlot?.technicianSlotId
                      }))
                    }}
                    disabled={!locationTimeInfo.date || !locationTimeInfo.technicianId}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: (locationTimeInfo.date && locationTimeInfo.technicianId) ? '#fff' : 'var(--bg-secondary)',
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'var(--text-primary)',
                      cursor: (locationTimeInfo.date && locationTimeInfo.technicianId) ? 'pointer' : 'not-allowed',
                      outline: 'none',
                      opacity: (locationTimeInfo.date && locationTimeInfo.technicianId) ? 1 : 0.6
                    }}
                  >
                    <option value="">-- Chọn giờ --</option>
                    {slots.map((slot) => (
                      <option key={slot.slotId} value={slot.slotTime} disabled={!slot.isAvailable}>
                        {slot.slotLabel || slot.slotTime} {!slot.isAvailable ? '(Đã đặt)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.time && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertCircle size={12} />
                      {errors.time}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Internal Notes Section */}
      {customerFound && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 216, 117, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            cursor: 'pointer'
          }} onClick={() => toggleSection('notes')}>
            <FileText size={18} style={{ color: '#FFD875' }} />
            <h2 style={{
              fontSize: '13px',
              fontWeight: 300,
              margin: 0,
              color: 'var(--text-primary)',
              flex: 1
            }}>Ghi chú nội bộ (chỉ staff)</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {expandedSections.notes ? '−' : '+'}
            </span>
          </div>

          {expandedSections.notes && (
            <div>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ghi chú nội bộ cho staff (khách hàng không thấy)"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#fff',
                  fontSize: '12px',
                  fontWeight: 300,
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      {customerFound && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '12px 32px',
              border: 'none',
              borderRadius: '8px',
              background: isSubmitting ? 'var(--bg-secondary)' : '#FFD875',
              color: isSubmitting ? 'var(--text-secondary)' : '#000',
              fontSize: '12px',
              fontWeight: 300,
              cursor: isSubmitting ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isSubmitting ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? (
              <>
                <Clock size={14} />
                Đang tạo...
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                Tạo booking
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

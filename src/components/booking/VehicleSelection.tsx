import React, { useEffect, useState } from 'react'
import { Car, MapPin, Phone, Plus, ArrowLeft, ArrowRight } from 'lucide-react'
import { Vehicle } from '@/services/vehicleService'
import { CenterService, Center } from '@/services/centerService'

interface VehicleSelectionProps {
  vehicles: Vehicle[]
  selectedVehicle: Vehicle | null
  onSelectVehicle: (vehicle: Vehicle) => void
  onNext: () => void
  onPrev: () => void
  loading: boolean
  error: string | null
  onCreateVehicle?: () => void
}

const VehicleSelection: React.FC<VehicleSelectionProps> = ({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onNext,
  onPrev,
  loading,
  error,
  onCreateVehicle
}) => {
  const [centers, setCenters] = useState<Center[]>([])
  const [centersLoading, setCentersLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new'>('existing')
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    currentMileage: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Load active centers
  useEffect(() => {
    const loadCenters = async () => {
      setCentersLoading(true)
      try {
        const response = await CenterService.getActiveCenters()
        
        // Handle the response format from your API
        if (response.centers) {
          setCenters(response.centers)
        } else {
          setCenters([])
        }
      } catch (error) {
        setCenters([])
      } finally {
        setCentersLoading(false)
      }
    }

    loadCenters()
  }, [])

  // Validation for new vehicle form
  const validateNewVehicle = () => {
    const errors: Record<string, string> = {}
    
    if (!newVehicle.licensePlate.trim()) {
      errors.licensePlate = 'Biển số xe là bắt buộc'
    }
    if (!newVehicle.brand.trim()) {
      errors.brand = 'Hãng xe là bắt buộc'
    }
    if (!newVehicle.model.trim()) {
      errors.model = 'Dòng xe là bắt buộc'
    }
    if (!newVehicle.color.trim()) {
      errors.color = 'Màu xe là bắt buộc'
    }
    if (!newVehicle.currentMileage.trim()) {
      errors.currentMileage = 'Số km hiện tại là bắt buộc'
    } else if (isNaN(Number(newVehicle.currentMileage)) || Number(newVehicle.currentMileage) < 0) {
      errors.currentMileage = 'Số km phải là số dương'
    }
    if (newVehicle.year < 1900 || newVehicle.year > new Date().getFullYear()) {
      errors.year = 'Năm sản xuất không hợp lệ'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateVehicle = () => {
    if (validateNewVehicle()) {
      // Create a temporary vehicle object for selection
      const tempVehicle: Vehicle = {
        vehicleId: Date.now(),
        licensePlate: newVehicle.licensePlate,
        color: newVehicle.color,
        currentMileage: Number(newVehicle.currentMileage),
        purchaseDate: newVehicle.purchaseDate,
        customerId: 0, // Will be set by parent component
        vin: `${newVehicle.brand}-${newVehicle.model}-${newVehicle.year}`,
        createdAt: new Date().toISOString()
      }
      
      onSelectVehicle(tempVehicle)
      onCreateVehicle?.()
    }
  }

  const isStepValid = selectedVehicle !== null

  return (
    <div className="booking-step">
      <h2 style={{ 
        textAlign: 'center', 
        fontSize: '1.5rem', 
        fontWeight: '700', 
        color: '#1e293b', 
        marginBottom: '2rem' 
      }}>
        Chọn xe điện
      </h2>

      {/* Option Selection */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '2rem',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setSelectedOption('existing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '12px',
            border: selectedOption === 'existing' ? '2px solid #10b981' : '2px solid #e5e7eb',
            background: selectedOption === 'existing' ? '#f0fdf4' : '#ffffff',
            color: selectedOption === 'existing' ? '#10b981' : '#6b7280',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Car size={20} />
          Xe có sẵn
        </button>
        
        <button
          onClick={() => setSelectedOption('new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '12px',
            border: selectedOption === 'new' ? '2px solid #10b981' : '2px solid #e5e7eb',
            background: selectedOption === 'new' ? '#f0fdf4' : '#ffffff',
            color: selectedOption === 'new' ? '#10b981' : '#6b7280',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={20} />
          Tạo xe mới
        </button>
      </div>

      {/* Existing Vehicles Option */}
      {selectedOption === 'existing' && (
        <>
          {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <Car size={24} style={{ marginBottom: '0.5rem' }} />
          <div>Đang tải danh sách xe...</div>
        </div>
      )}
      
      {error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
          {error}
        </div>
      )}
      
      {!loading && !error && Array.isArray(vehicles) && vehicles.length > 0 && (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '2rem',
          maxWidth: '600px',
          margin: '0 auto 2rem auto'
        }}>
          {vehicles.map((vehicle) => (
            <div 
              key={vehicle.vehicleId}
              className={`vehicle-card ${selectedVehicle?.vehicleId === vehicle.vehicleId ? 'selected' : ''}`}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '20px',
                border: `2px solid ${selectedVehicle?.vehicleId === vehicle.vehicleId ? '#10b981' : '#e5e7eb'}`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: selectedVehicle?.vehicleId === vehicle.vehicleId 
                  ? '0 8px 32px rgba(16, 185, 129, 0.2)' 
                  : '0 2px 12px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                transform: selectedVehicle?.vehicleId === vehicle.vehicleId ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onClick={() => onSelectVehicle(vehicle)}
              onMouseEnter={(e) => {
                if (selectedVehicle?.vehicleId !== vehicle.vehicleId) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.12)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedVehicle?.vehicleId !== vehicle.vehicleId) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              {/* Selection indicator */}
              {selectedVehicle?.vehicleId === vehicle.vehicleId && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  ✓
                </div>
              )}
              
              {/* Vehicle header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: selectedVehicle?.vehicleId === vehicle.vehicleId ? '#10b981' : '#f8fafc',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    transition: 'all 0.3s ease'
                  }}>
                    <Car size={24} color={selectedVehicle?.vehicleId === vehicle.vehicleId ? '#fff' : '#10b981'} />
                  </div>
                  <div>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '700', 
                      color: '#1e293b', 
                      margin: '0 0 4px 0',
                      letterSpacing: '-0.025em'
                    }}>
                      {vehicle.licensePlate}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      margin: 0,
                      fontFamily: 'monospace',
                      fontWeight: '500'
                    }}>
                      VIN: {vehicle.vin}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Vehicle details as tags */}
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '16px'
              }}>
                {/* Mileage tag */}
                <div style={{
                  background: '#f0fdf4',
                  color: '#166534',
                  padding: '4px 8px',
                  borderRadius: '16px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  border: '1px solid #bbf7d0'
                }}>
                  {vehicle.currentMileage?.toLocaleString()} km
                </div>

                {/* Year tag */}
                {vehicle.purchaseDate && (
                  <div style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    border: '1px solid #fde68a'
                  }}>
                    {new Date(vehicle.purchaseDate).getFullYear()}
                  </div>
                )}

                {/* Color tag */}
                {vehicle.color && (
                  <div style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: vehicle.color.toLowerCase(),
                      border: '1px solid #9ca3af'
                    }} />
                    {vehicle.color}
                  </div>
                )}

                {/* Status tag - removed per requirement */}

                {/* Center info tags - removed per requirement */}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && (!Array.isArray(vehicles) || vehicles.length === 0) && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#64748b',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <Car size={32} color="#9ca3af" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Không có xe nào
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            Vui lòng thêm xe trước khi đặt lịch
          </div>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '2rem',
        maxWidth: '600px',
        margin: '2rem auto 0 auto'
      }}>
        <button 
          onClick={onPrev}
          style={{
            background: '#f8fafc',
            color: '#475569',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 28px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.875rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9'
            e.currentTarget.style.borderColor = '#cbd5e1'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc'
            e.currentTarget.style.borderColor = '#e2e8f0'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}
        >
          Quay lại
        </button>
        <button 
          onClick={onNext}
          disabled={!selectedVehicle}
          style={{
            background: selectedVehicle ? 'linear-gradient(135deg, #10b981, #059669)' : '#d1d5db',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 28px',
            cursor: selectedVehicle ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            fontSize: '0.875rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: selectedVehicle ? '0 4px 16px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
            opacity: selectedVehicle ? 1 : 0.6
          }}
          onMouseEnter={(e) => {
            if (selectedVehicle) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedVehicle) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)'
            }
          }}
        >
          Tiếp theo
        </button>
      </div>
        </>
      )}

      {/* New Vehicle Form Option */}
      {selectedOption === 'new' && (
        <div className="vehicle-form-container" style={{
          maxWidth: '600px',
          margin: '0 auto 2rem auto',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h3 className="vehicle-form-title" style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              Thông tin xe mới
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>
              Điền thông tin chi tiết về xe điện của bạn
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* License Plate - Full Width */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Biển số xe *
              </label>
              <input
                type="text"
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                placeholder="Nhập biển số xe"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `2px solid ${formErrors.licensePlate ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#ffffff',
                  color: '#111827',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981'
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = formErrors.licensePlate ? '#ef4444' : '#e5e7eb'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {formErrors.licensePlate && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', marginBottom: 0 }}>
                  {formErrors.licensePlate}
                </p>
              )}
            </div>

            {/* Brand and Model - Two Columns */}
            <div className="vehicle-form-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Hãng xe *
                </label>
                <input
                  type="text"
                  value={newVehicle.brand}
                  onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})}
                  placeholder="VinFast, Tesla, ..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${formErrors.brand ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    background: '#ffffff',
                    color: '#111827',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981'
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = formErrors.brand ? '#ef4444' : '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {formErrors.brand && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', marginBottom: 0 }}>
                    {formErrors.brand}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Dòng xe *
                </label>
                <input
                  type="text"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                  placeholder="VF8, Model 3, ..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${formErrors.model ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    background: '#ffffff',
                    color: '#111827',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981'
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = formErrors.model ? '#ef4444' : '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {formErrors.model && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', marginBottom: 0 }}>
                    {formErrors.model}
                  </p>
                )}
              </div>
            </div>

            {/* Year and Color - Two Columns */}
            <div className="vehicle-form-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Năm sản xuất *
                </label>
                <input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value) || new Date().getFullYear()})}
                  min="1900"
                  max={new Date().getFullYear()}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${formErrors.year ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    background: '#ffffff',
                    color: '#111827',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981'
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = formErrors.year ? '#ef4444' : '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {formErrors.year && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', marginBottom: 0 }}>
                    {formErrors.year}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Màu xe *
                </label>
                <input
                  type="text"
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                  placeholder="Đỏ, xanh, trắng, ..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${formErrors.color ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    background: '#ffffff',
                    color: '#111827',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981'
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = formErrors.color ? '#ef4444' : '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {formErrors.color && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', marginBottom: 0 }}>
                    {formErrors.color}
                  </p>
                )}
              </div>
            </div>

            {/* Mileage - Full Width */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Số km hiện tại *
              </label>
              <input
                type="number"
                value={newVehicle.currentMileage}
                onChange={(e) => setNewVehicle({...newVehicle, currentMileage: e.target.value})}
                placeholder="Nhập số km"
                min="0"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `2px solid ${formErrors.currentMileage ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#ffffff',
                  color: '#111827',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981'
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = formErrors.currentMileage ? '#ef4444' : '#e5e7eb'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {formErrors.currentMileage && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', marginBottom: 0 }}>
                  {formErrors.currentMileage}
                </p>
              )}
            </div>

            {/* Create Vehicle Button */}
            <button
              onClick={handleCreateVehicle}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                marginTop: '8px',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Plus size={20} />
              Tạo xe và chọn
            </button>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2rem',
        padding: '0 1rem'
      }}>
        <button
          onClick={onPrev}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
            color: '#475569',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 28px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>

        <button
          onClick={onNext}
          disabled={!isStepValid}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isStepValid ? 'linear-gradient(135deg, #10b981, #059669)' : '#e5e7eb',
            color: isStepValid ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 28px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: isStepValid ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: isStepValid ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
            opacity: isStepValid ? 1 : 0.6
          }}
        >
          Tiếp tục
          <ArrowRight size={16} />
        </button>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @media (max-width: 480px) {
          .vehicle-form-grid {
            grid-template-columns: 1fr !important;
          }
          
          .vehicle-form-container {
            padding: 20px !important;
            margin: 16px !important;
          }
          
          .vehicle-form-title {
            font-size: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default VehicleSelection


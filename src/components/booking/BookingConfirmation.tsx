import React, { useState } from 'react'
import { CheckCircle, Car, Calendar, Clock, MapPin, User, Wrench, CreditCard } from 'lucide-react'
import QRPayment from './QRPayment'
import PaymentMethodSelector from './PaymentMethodSelector'
import './QRPayment.scss'
import './PaymentMethodSelector.scss'
import { Service } from '@/services/serviceManagementService'
import { Vehicle } from '@/services/vehicleService'
import { Center } from '@/services/centerService'
// import { TimeSlotAvailability, TechnicianAvailability } from '@/services/bookingService'
import { PaymentService, PaymentRequest, PaymentMethod } from '@/services/paymentService'

interface BookingConfirmationProps {
  selectedServices: number[]
  services: Service[]
  selectedVehicle: Vehicle | null
  selectedCenter: Center | null
  selectedDate: string
  selectedTimeSlot: any | null
  selectedTechnician: any | null
  notes: string
  onNotesChange: (notes: string) => void
  totalPrice: number
  onConfirm: () => void
  onPrev: () => void
  isSubmitting: boolean
  reservation: any
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  selectedServices,
  services,
  selectedVehicle,
  selectedCenter,
  selectedDate,
  selectedTimeSlot,
  selectedTechnician,
  notes,
  onNotesChange,
  totalPrice,
  onConfirm,
  onPrev,
  isSubmitting,
  reservation
}) => {
  const [showQRPayment, setShowQRPayment] = useState(false)
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const handlePaymentSuccess = async () => {
    setShowQRPayment(false)
    setIsProcessingPayment(true)
    
    try {
      // If we have a reservation with booking ID, we can update payment status
      if (reservation?.bookingId) {
        // Here you could call an API to update booking status to 'PAID'
        // await BookingService.updateBookingStatus(reservation.bookingId, 'PAID')
      }
      
      // Call the original onConfirm to complete the booking process
      onConfirm()
    } catch (error) {
      // Silently handle error
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handlePaymentCancel = () => {
    setShowQRPayment(false)
    setShowPaymentMethods(false)
  }

  const handleShowPaymentMethods = () => {
    // Require booking ID to proceed with payment
    if (!reservation?.bookingId) {
      alert('Không tìm thấy thông tin đặt lịch. Vui lòng thử lại.')
      return
    }
    
    setShowPaymentMethods(true)
  }

  const handleQRPayment = async () => {
    if (!reservation?.bookingId) {
      return
    }

    try {
      setIsProcessingPayment(true)
      
      // Create payment request
      const paymentRequest: PaymentRequest = {
        bookingId: reservation.bookingId,
        amount: totalPrice,
        paymentMethod: 'QR_CODE' as PaymentMethod,
        description: `Thanh toán đặt lịch bảo dưỡng xe điện - ${selectedVehicle?.licensePlate || 'N/A'}`,
        returnUrl: `${window.location.origin}/booking/payment/success`,
        cancelUrl: `${window.location.origin}/booking/payment/cancel`
      }

      // Create payment
      const paymentResponse = await PaymentService.createPayment(paymentRequest)
      
      // Show QR payment modal
      setShowQRPayment(true)
      
    } catch (error) {
      // Silently handle error
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  if (reservation) {
    return (
      <div className="booking-step">
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
          borderRadius: '12px',
          border: '2px solid #10b981'
        }}>
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#10b981', 
            marginBottom: '0.5rem' 
          }}>
            Đặt lịch thành công!
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#059669', 
            marginBottom: '1.5rem' 
          }}>
            Mã đặt lịch: <strong>{reservation.reservationId || reservation.bookingId}</strong>
          </p>
          
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px', 
            padding: '1rem', 
            marginBottom: '1rem',
            border: '1px solid #d1fae5'
          }}>
            <p style={{ margin: 0, color: '#f59e0b', fontSize: '0.9rem', fontWeight: '500' }}>
              ⏰ Vui lòng thanh toán trong 15 phút để giữ chỗ
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              Thanh toán ngay
            </button>
            <button 
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-step">
      <h2 style={{ 
        textAlign: 'center', 
        fontSize: '1.5rem', 
        fontWeight: '700', 
        color: '#1e293b', 
        marginBottom: '2rem' 
      }}>
        Xác nhận đặt lịch
      </h2>
      
      <div style={{ 
        background: '#f8f9fa', 
        borderRadius: '12px', 
        padding: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <h3 style={{ 
          fontSize: '1.2rem', 
          fontWeight: '600', 
          color: '#1e293b', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={20} color="#10b981" />
          Tóm tắt đặt lịch
        </h3>
        
        {/* Services Summary */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Wrench size={16} color="#10b981" />
            Dịch vụ đã chọn
          </h4>
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px', 
            padding: '1rem',
            border: '1px solid #e5e7eb'
          }}>
            {Array.isArray(selectedServices) && selectedServices.map(serviceId => {
              const service = Array.isArray(services) ? services.find(s => s.id === serviceId) : null
              return service ? (
                <div key={serviceId} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1e293b' }}>
                      {service.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {service.description}
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#10b981',
                    fontSize: '0.9rem'
                  }}>
                    {formatPrice(service.price)}
                  </div>
                </div>
              ) : null
            })}
          </div>
        </div>
        
        {/* Vehicle Summary */}
        {selectedVehicle && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Car size={16} color="#10b981" />
              Xe đã chọn
            </h4>
            <div style={{ 
              background: '#fff', 
              borderRadius: '8px', 
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '0.25rem' }}>
                {selectedVehicle.licensePlate}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                VIN: {selectedVehicle.vin} • {new Date(selectedVehicle.purchaseDate).getFullYear()} • {selectedVehicle.currentMileage?.toLocaleString()} km
              </div>
            </div>
          </div>
        )}
        
        {/* Appointment Details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calendar size={16} color="#10b981" />
            Thông tin lịch hẹn
          </h4>
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px', 
            padding: '1rem',
            border: '1px solid #e5e7eb'
          }}>
            {selectedCenter && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <MapPin size={14} color="#64748b" />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                  {selectedCenter.centerName}
                </span>
              </div>
            )}
            
            {selectedDate && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <Calendar size={14} color="#64748b" />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                  {formatDate(selectedDate)}
                </span>
              </div>
            )}
            
            {selectedTimeSlot && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <Clock size={14} color="#64748b" />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                  {selectedTimeSlot.slotTime}
                </span>
              </div>
            )}
            
            {selectedTechnician && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem'
              }}>
                <User size={14} color="#64748b" />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                  {selectedTechnician.name}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Notes */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '0.75rem'
          }}>
            Ghi chú thêm
          </h4>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Nhập ghi chú thêm cho lịch hẹn (tùy chọn)..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.9rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>
        
        {/* Total Price */}
        <div style={{ 
          borderTop: '2px solid #e5e7eb', 
          paddingTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f0fdf4',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #d1fae5'
        }}>
          <span style={{ 
            fontSize: '1.2rem', 
            fontWeight: '700', 
            color: '#10b981'
          }}>
            Tổng cộng:
          </span>
          <span style={{ 
            fontSize: '1.4rem', 
            fontWeight: '800', 
            color: '#10b981'
          }}>
            {formatPrice(totalPrice)}
          </span>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '2rem' 
      }}>
        <button 
          onClick={onPrev}
          style={{
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          Quay lại
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? '#d1d5db' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Xác nhận đặt lịch
              </>
            )}
          </button>
        </div>
      </div>


      {/* QR Payment Modal */}
      {showQRPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowQRPayment(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001
              }}
            >
              ×
            </button>
            <QRPayment
              reservation={{
                id: reservation?.reservationId || reservation?.bookingId || `BK${Date.now()}`,
                vehicle: selectedVehicle,
                services: services.filter(s => selectedServices.includes(s.id)),
                appointmentDate: selectedDate,
                timeSlot: selectedTimeSlot?.slotTime,
                totalAmount: totalPrice,
                center: selectedCenter
              }}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingConfirmation

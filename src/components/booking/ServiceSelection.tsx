import React from 'react'
import { CheckCircle } from 'lucide-react'
import { BaseButton } from '@/components/common'
import { Service } from '@/services/serviceManagementService'

interface ServiceSelectionProps {
  services: Service[]
  selectedServices: number[]
  onToggleService: (id: number) => void
  onNext: () => void
  loading: boolean
  error: string | null
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({
  services,
  selectedServices,
  onToggleService,
  onNext,
  loading,
  error
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
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
        Chọn dịch vụ bảo dưỡng
      </h2>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Đang tải dịch vụ...
        </div>
      )}
      
      {error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
          {error}
        </div>
      )}
      
      {!loading && !error && Array.isArray(services) && services.length > 0 && (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginBottom: '1.5rem'
        }}>
          {services.map((service) => (
            <div 
              key={service.id} 
              className={`service-row ${selectedServices.includes(service.id) ? 'selected' : ''}`} 
              style={{ 
                background: '#fff', 
                borderRadius: '6px', 
                padding: '8px 12px', 
                border: `1px solid ${selectedServices.includes(service.id) ? '#10b981' : '#e5e7eb'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: selectedServices.includes(service.id) 
                  ? '0 1px 6px rgba(16, 185, 129, 0.15)' 
                  : '0 1px 2px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                overflow: 'hidden'
              }} 
              onClick={() => onToggleService(service.id)}
            >
              {/* Background decoration */}
              {selectedServices.includes(service.id) && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '3px',
                  height: '100%',
                  backgroundColor: '#10b981'
                }} />
              )}
              
              {/* Left side - Checkbox + Service Info */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                flex: 1
              }}>
                {/* Custom Checkbox */}
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: `1px solid ${selectedServices.includes(service.id) ? '#10b981' : '#d1d5db'}`,
                  borderRadius: '3px',
                  backgroundColor: selectedServices.includes(service.id) ? '#10b981' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}>
                  {selectedServices.includes(service.id) && (
                    <CheckCircle size={10} color="#fff" />
                  )}
                </div>
                
                {/* Service Details */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    color: '#1e293b', 
                    marginBottom: '1px',
                    lineHeight: '1.2'
                  }}>
                    {service.name}
                  </h3>
                  
                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: '#64748b', 
                    margin: 0,
                    lineHeight: '1.2',
                    maxWidth: '350px'
                  }}>
                    {service.description}
                  </p>
                </div>
              </div>
              
              {/* Right side - Price + Details Button */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                flexShrink: 0
              }}>
                {/* Price */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    color: '#10b981',
                    display: 'block'
                  }}>
                    {formatPrice(service.price)}
                  </span>
                </div>
                
                {/* Details Button */}
                <button
                  type="button"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // TODO: Show service details modal
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && (!Array.isArray(services) || services.length === 0) && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#64748b',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Không có dịch vụ nào
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            Vui lòng thử lại sau hoặc liên hệ hỗ trợ
          </div>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginTop: '2rem' 
      }}>
        <BaseButton 
          onClick={onNext} 
          disabled={selectedServices.length === 0} 
          size="lg"
        >
          Tiếp theo
        </BaseButton>
      </div>
    </div>
  )
}

export default ServiceSelection

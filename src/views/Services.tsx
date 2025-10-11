import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Services() {
  const navigate = useNavigate()
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const mainServices = [
    {
      id: 'basic-maintenance',
      title: 'Bảo dưỡng cơ bản',
      icon: '1',
      price: 150000,
      duration: '30-45 phút',
      description: 'Kiểm tra tổng quát, vệ sinh xe, căn chỉnh cơ bản',
      includes: [
        'Kiểm tra phanh và đèn',
        'Vệ sinh thân xe',
        'Căn chỉnh tay lái',
        'Kiểm tra lốp xe',
        'Tra dầu nhớt'
      ],
      recommended: false
    },
    {
      id: 'advanced-maintenance',
      title: 'Bảo dưỡng nâng cao',
      icon: '2',
      price: 300000,
      duration: '60-90 phút',
      description: 'Bảo dưỡng toàn diện với kiểm tra chi tiết',
      includes: [
        'Tất cả dịch vụ bảo dưỡng cơ bản',
        'Kiểm tra hệ thống điện',
        'Thay dầu nhớt cao cấp',
        'Kiểm tra và căn chỉnh động cơ',
        'Vệ sinh nội thất',
        'Bảo dưỡng xích và nhông'
      ],
      recommended: true
    },
    {
      id: 'premium-maintenance',
      title: 'Bảo dưỡng cao cấp',
      icon: '3',
      price: 500000,
      duration: '90-120 phút',
      description: 'Dịch vụ premium với công nghệ hiện đại nhất',
      includes: [
        'Tất cả dịch vụ bảo dưỡng nâng cao',
        'Chẩn đoán bằng máy tính',
        'Thay phụ tùng chính hãng',
        'Đánh bóng và phủ nano',
        'Kiểm tra an toàn toàn diện',
        'Bảo hành 6 tháng'
      ],
      recommended: false
    }
  ]

  const additionalServices = [
    {
      id: 'battery-check',
      title: 'Kiểm tra pin & sạc',
      icon: 'B',
      price: 100000,
      duration: '20-30 phút',
      description: 'Chẩn đoán tình trạng pin và hệ thống sạc'
    },
    {
      id: 'parts-replacement',
      title: 'Thay thế phụ tùng',
      icon: 'P',
      price: 0,
      duration: 'Tùy theo phụ tùng',
      description: 'Phụ tùng chính hãng với bảo hành chính thức'
    },
    {
      id: 'safety-inspection',
      title: 'Kiểm tra an toàn',
      icon: 'S',
      price: 80000,
      duration: '15-25 phút',
      description: 'Kiểm tra toàn bộ hệ thống an toàn của xe'
    },
    {
      id: 'performance-tuning',
      title: 'Tối ưu hiệu suất',
      icon: 'T',
      price: 250000,
      duration: '45-60 phút',
      description: 'Tối ưu hóa hiệu suất động cơ và hệ thống'
    }
  ]

  const handleBookService = (serviceId: string) => {
    navigate(`/booking?service=${serviceId}`)
  }

  return (
    <div style={{
      background: '#ffffff',
      minHeight: 'calc(100vh - 64px)',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 48px 96px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#000000',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              M
            </div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '600',
              color: '#000000',
              margin: '0'
            }}>
              Dịch vụ Bảo dưỡng
            </h1>
          </div>
          <p style={{
            fontSize: '18px',
            color: '#666666',
            margin: '0',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Chăm sóc xe điện chuyên nghiệp với công nghệ hiện đại và phụ tùng chính hãng
          </p>
        </div>

        {/* Main Services */}
        <div style={{ marginBottom: '64px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            Gói Bảo dưỡng Chính
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {mainServices.map(service => (
              <div key={service.id} style={{
                background: '#ffffff',
                border: '2px solid #000000',
                borderRadius: '8px',
                padding: '32px 24px',
                textAlign: 'center',
                position: 'relative',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
              >
                {/* Recommended Badge */}
                {service.recommended && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#000000',
                    color: '#ffffff',
                    padding: '4px 16px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    PHỔ BIẾN NHẤT
                  </div>
                )}

                {/* Service Icon */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: '#000000',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  margin: '0 auto 16px'
                }}>
                  {service.icon}
                </div>

                {/* Service Info */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#000000',
                  margin: '0 0 8px 0'
                }}>
                  {service.title}
                </h3>

                <p style={{
                  fontSize: '14px',
                  color: '#666666',
                  margin: '0 0 16px 0',
                  lineHeight: '1.5'
                }}>
                  {service.description}
                </p>

                {/* Price & Duration */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  border: '1px solid #000000'
                }}>
                  <div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#000000'
                    }}>
                      {formatPrice(service.price)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666666',
                    fontWeight: '600'
                  }}>
                    {service.duration}
                  </div>
                </div>

                {/* Includes - Show when selected */}
                {selectedService === service.id && (
                  <div style={{
                    marginBottom: '24px',
                    textAlign: 'left'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#000000',
                      margin: '0 0 12px 0'
                    }}>
                      Bao gồm:
                    </h4>
                    <ul style={{
                      margin: '0',
                      padding: '0 0 0 16px',
                      listStyle: 'none'
                    }}>
                      {service.includes.map((item, index) => (
                        <li key={index} style={{
                          fontSize: '12px',
                          color: '#666666',
                          marginBottom: '4px',
                          position: 'relative'
                        }}>
                          <span style={{
                            position: 'absolute',
                            left: '-16px',
                            color: '#000000',
                            fontWeight: 'bold'
                          }}>
                            ✓
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Book Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBookService(service.id)
                  }}
                  style={{
                    width: '100%',
                    background: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none'
                  }}
                >
                  Đặt lịch bảo dưỡng
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Services */}
        <div style={{ marginBottom: '64px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            Dịch vụ Bổ sung
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {additionalServices.map(service => (
              <div key={service.id} style={{
                background: '#ffffff',
                border: '2px solid #000000',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#000000',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0 auto 12px'
                }}>
                  {service.icon}
                </div>

                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000',
                  margin: '0 0 8px 0'
                }}>
                  {service.title}
                </h3>

                <p style={{
                  fontSize: '12px',
                  color: '#666666',
                  margin: '0 0 16px 0',
                  lineHeight: '1.4'
                }}>
                  {service.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  fontSize: '12px'
                }}>
                  <span style={{
                    background: '#000000',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: '600'
                  }}>
                    {service.price === 0 ? 'Báo giá' : formatPrice(service.price)}
                  </span>
                  <span style={{
                    color: '#666666',
                    fontWeight: '600'
                  }}>
                    {service.duration}
                  </span>
                </div>

                <button
                  onClick={() => handleBookService(service.id)}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    color: '#000000',
                    border: '2px solid #000000',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Đặt lịch
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '32px'
          }}>
            Tại sao chọn dịch vụ của chúng tôi?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px'
          }}>
            {[
              {
                icon: 'K',
                title: 'Kỹ thuật viên chuyên nghiệp',
                description: 'Đội ngũ được đào tạo bài bản với chứng chỉ quốc tế'
              },
              {
                icon: 'T',
                title: 'Thiết bị hiện đại',
                description: 'Máy móc và công cụ chuẩn quốc tế, cập nhật liên tục'
              },
              {
                icon: 'W',
                title: 'Bảo hành tin cậy',
                description: 'Cam kết bảo hành lên đến 6 tháng cho dịch vụ'
              },
              {
                icon: 'F',
                title: 'Nhanh chóng',
                description: 'Hoàn thành đúng hẹn, tiết kiệm thời gian quý báu'
              }
            ].map((feature, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#000000',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0 auto 12px'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000',
                  margin: '0 0 8px 0'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#666666',
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

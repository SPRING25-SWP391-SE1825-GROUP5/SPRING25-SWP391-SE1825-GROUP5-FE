import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Calendar, User, Car, Wrench, MapPin, CheckCircle, Clock, Phone, Mail, Hash, DollarSign, FileText, XCircle, ChevronDown } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { TechnicianService } from '@/services/technicianService'
import './BookingDetail.scss'
import toast from 'react-hot-toast'

interface BookingDetailData {
  technicianId: number
  bookingId: number
  status: string
  date: string
  slotTime: string
  technicianSlotId: number
  serviceId: number
  serviceName: string
  serviceDescription: string
  servicePrice: number
  centerId: number
  centerName: string
  centerAddress: string
  centerPhone: string
  customerId: number
  customerName: string
  customerPhone: string
  customerAddress: string
  customerEmail: string
  vehicleId: number
  vehiclePlate: string
  vehicleModel: string | null
  vehicleColor: string
  currentMileage: number
  lastServiceDate: string | null
  maintenanceChecklists: MaintenanceChecklist[]
  specialRequests: string
  createdAt: string
  updatedAt: string
}

interface MaintenanceChecklist {
  checklistId: number
  status: string
  notes: string
  results: ChecklistItem[]
}

interface ChecklistItem {
  resultId: number
  partId: number
  partName: string
  description: string
  result: string | null
  status: string
}

interface BookingDetailProps {
  bookingId: number
  onBack: () => void
}

const BookingDetail: React.FC<BookingDetailProps> = ({ bookingId, onBack }) => {
  const user = useAppSelector(state => state.auth.user)
  const [bookingData, setBookingData] = useState<BookingDetailData | null>(null)
  const [maintenanceChecklist, setMaintenanceChecklist] = useState<MaintenanceChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    customerInfo: true,
    specialRequests: true,
    maintenanceChecklist: true
  })

  const fetchBookingDetail = useCallback(async (bookingId: number) => {
    try {
      setLoading(true)

      // Lấy technicianId từ user info
      const technicianInfo = await TechnicianService.getTechnicianIdByUserId(user?.id || 0)

      if (technicianInfo.success && technicianInfo.data) {
        const response = await TechnicianService.getBookingDetail(technicianInfo.data.technicianId, bookingId)

        if (response.success && response.data) {
          setBookingData(response.data)

          // Maintenance checklist đã có trong response.data.maintenanceChecklists
          if (response.data.maintenanceChecklists && response.data.maintenanceChecklists.length > 0) {
            setMaintenanceChecklist(response.data.maintenanceChecklists[0])
          }
        }
      }

    } catch (error) {
      // Error handled by state
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail(bookingId)
    }
  }, [bookingId, fetchBookingDetail])

  const handleUpdateChecklistItem = async (resultId: number, result: string) => {
    if (!maintenanceChecklist) return

    try {
      setUpdating(true)

      // Tìm partId từ resultId
      const checklistItem = maintenanceChecklist.results.find(item => item.resultId === resultId)
      if (!checklistItem) {
        toast.error('Không tìm thấy item checklist')
        return
      }

      // Gọi API mới với partId
      const response = await TechnicianService.updateMaintenanceChecklistItem(
        bookingId,
        checklistItem.partId,
        result
      )

      if (response.success) {
        // Cập nhật local state
        const updatedResults = maintenanceChecklist.results.map(item =>
          item.resultId === resultId ? {
            ...item,
            result,
            status: result === 'PASS' ? 'completed' : result === 'FAIL' ? 'failed' : 'pending'
          } : item
        )

        setMaintenanceChecklist({
          ...maintenanceChecklist,
          results: updatedResults
        })
        toast.success('Cập nhật trạng thái thành công')
      } else {
        toast.error(response.message || 'Cập nhật trạng thái thất bại')
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái')
    } finally {
      setUpdating(false)
    }
  }

  const canConfirmChecklist = () => {
    if (!maintenanceChecklist) return false

    // Kiểm tra xem tất cả items đã được đánh giá chưa
    return maintenanceChecklist.results.every(item =>
      item.result === 'PASS' || item.result === 'FAIL'
    )
  }

  const handleConfirmChecklist = async () => {
    if (!maintenanceChecklist || !canConfirmChecklist()) {
      toast.error('Vui lòng đánh giá tất cả các phụ tùng trước khi xác nhận')
      return
    }

    try {
      setUpdating(true)

      const response = await TechnicianService.confirmMaintenanceChecklist(bookingId)

      if (response.success) {
        toast.success('Xác nhận hoàn thành kiểm tra thành công')

        // Cập nhật trạng thái checklist
        setMaintenanceChecklist({
          ...maintenanceChecklist,
          status: 'completed'
        })
      } else {
        toast.error(response.message || 'Xác nhận thất bại')
      }
    } catch (error) {
      toast.error('Lỗi khi xác nhận checklist')
    } finally {
      setUpdating(false)
    }
  }

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        background: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#64748B'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #FFD875',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Đang tải thông tin...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div style={{
        padding: '24px',
        background: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#EF4444'
        }}>
          <p style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600' }}>
            Không thể tải thông tin booking
          </p>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#fff',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFF6D1'
              e.currentTarget.style.borderColor = '#FFD875'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.borderColor = 'var(--border-primary)'
            }}
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-detail" style={{
      padding: '24px',
      background: '#fff',
      minHeight: '100vh'
    }}>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="booking-detail__main">
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#fff',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FFF6D1'
                e.currentTarget.style.borderColor = '#FFD875'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = 'var(--border-primary)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <ArrowLeft size={18} />
            Quay lại
          </button>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0,
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Chi tiết đơn đặt lịch #{bookingData.bookingId}
            </h1>
          </div>
        </div>

        {/* Main Content Card */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            padding: '24px',
            background: '#fff',
            borderBottom: '1px solid var(--border-primary)'
          }}>


            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#fff',
              borderRadius: '12px',
              border: '2px solid rgba(59, 130, 246, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0
              }}>
                <User size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {bookingData.customerName}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748B',
                  fontWeight: '500'
                }}>
                  Khách hàng
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#fff',
              borderRadius: '12px',
              border: '2px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0
              }}>
                <Car size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '4px'
                }}>
                  {bookingData.vehiclePlate}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748B',
                  fontWeight: '500'
                }}>
                  Biển số xe
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#fff',
              borderRadius: '12px',
              border: '2px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0
              }}>
                <Wrench size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {bookingData.serviceName}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748B',
                  fontWeight: '500'
                }}>
                  Dịch vụ
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#fff',
              borderRadius: '12px',
              border: '2px solid rgba(249, 115, 22, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0
              }}>
                <Clock size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '4px'
                }}>
                  {bookingData.slotTime.replace(' SA', '').replace(' CH', '')}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748B',
                  fontWeight: '500'
                }}>
                  Thời gian
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#fff',
              borderRadius: '12px',
              border: '2px solid rgba(5, 150, 105, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0
              }}>
                <DollarSign size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '4px'
                }}>
                  {bookingData.servicePrice.toLocaleString('vi-VN')} VNĐ
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748B',
                  fontWeight: '500'
                }}>
                  Giá dịch vụ
                </div>
              </div>
            </div>
          </div>

        {/* Detailed Information */}
          <div style={{ padding: '24px' }}>
          {/* Customer Information */}
            <div style={{
              background: '#fff',
              border: '1px solid var(--border-primary)',
              borderRadius: '12px',
              marginBottom: '20px',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              <div
                onClick={() => toggleSection('customerInfo')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  background: expandedSections.customerInfo ? '#F1F5F9' : '#F8FAFC',
                  borderBottom: expandedSections.customerInfo ? '2px solid var(--border-primary)' : '1px solid var(--border-primary)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!expandedSections.customerInfo) {
                    e.currentTarget.style.background = '#F1F5F9'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!expandedSections.customerInfo) {
                    e.currentTarget.style.background = '#F8FAFC'
                  }
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  flexShrink: 0
                }}>
                  <User size={18} />
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: 0,
                  flex: 1
                }}>
                  Thông tin khách hàng
                </h3>
              <ChevronDown
                size={20}
                  style={{
                    color: 'var(--text-secondary)',
                    transition: 'transform 0.3s ease',
                    transform: expandedSections.customerInfo ? 'rotate(0deg)' : 'rotate(-90deg)'
                  }}
              />
            </div>
            {expandedSections.customerInfo && (
              <div style={{
                padding: '20px',
                animation: 'slideDown 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  overflowX: 'auto',
                  paddingBottom: '8px'
                }}
                onScroll={(e) => {
                  // Smooth scrolling
                }}
                >
                  <div style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid var(--border-primary)',
                    transition: 'all 0.2s ease',
                    minWidth: '180px',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.borderColor = 'var(--primary-500)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC'
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Tên khách hàng
                    </label>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {bookingData.customerName}
                    </span>
                  </div>
                  <div style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid var(--border-primary)',
                    transition: 'all 0.2s ease',
                    minWidth: '180px',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.borderColor = 'var(--primary-500)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC'
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Số điện thoại
                    </label>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {bookingData.customerPhone}
                    </span>
                  </div>
                  <div style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid var(--border-primary)',
                    transition: 'all 0.2s ease',
                    minWidth: '200px',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.borderColor = 'var(--primary-500)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC'
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Email
                    </label>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {bookingData.customerEmail}
                    </span>
                  </div>
                  <div style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid var(--border-primary)',
                    transition: 'all 0.2s ease',
                    minWidth: '250px',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.borderColor = 'var(--primary-500)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC'
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Địa chỉ
                    </label>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {bookingData.customerAddress}
                    </span>
                  </div>
                  <div style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid var(--border-primary)',
                    transition: 'all 0.2s ease',
                    minWidth: '160px',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.borderColor = 'var(--primary-500)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC'
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Số km hiện tại
                    </label>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {bookingData.currentMileage.toLocaleString()} km
                    </span>
              </div>
              </div>
              </div>
              )}
          </div>

            {/* Special Requests */}
            {bookingData.specialRequests && (
              <div style={{
                background: '#fff',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                marginBottom: '20px',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}>
                <div
                  onClick={() => toggleSection('specialRequests')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    background: expandedSections.specialRequests ? '#F1F5F9' : '#F8FAFC',
                    borderBottom: expandedSections.specialRequests ? '2px solid var(--border-primary)' : '1px solid var(--border-primary)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!expandedSections.specialRequests) {
                      e.currentTarget.style.background = '#F1F5F9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!expandedSections.specialRequests) {
                      e.currentTarget.style.background = '#F8FAFC'
                    }
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    flexShrink: 0
                  }}>
                    <FileText size={18} />
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0,
                    flex: 1
                  }}>
                    Yêu cầu đặc biệt
                  </h3>
                  <ChevronDown
                    size={20}
                    style={{
                      color: 'var(--text-secondary)',
                      transition: 'transform 0.3s ease',
                      transform: expandedSections.specialRequests ? 'rotate(0deg)' : 'rotate(-90deg)'
                    }}
                  />
                </div>
                {expandedSections.specialRequests && (
                <div style={{
                  padding: '20px',
                  background: '#F8FAFC',
                  borderLeft: '4px solid var(--primary-500)',
                  animation: 'slideDown 0.3s ease'
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: '1.6',
                    fontWeight: '500'
                  }}>
                    {bookingData.specialRequests}
                  </p>
                </div>
                )}
              </div>
            )}

            {/* Maintenance Checklist */}
            {maintenanceChecklist && (
              <div style={{
                background: '#fff',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                marginBottom: '20px',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}>
                <div
                  onClick={() => toggleSection('maintenanceChecklist')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    background: expandedSections.maintenanceChecklist ? '#F1F5F9' : '#F8FAFC',
                    borderBottom: expandedSections.maintenanceChecklist ? '2px solid var(--border-primary)' : '1px solid var(--border-primary)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!expandedSections.maintenanceChecklist) {
                      e.currentTarget.style.background = '#F1F5F9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!expandedSections.maintenanceChecklist) {
                      e.currentTarget.style.background = '#F8FAFC'
                    }
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    flexShrink: 0
                  }}>
                    <CheckCircle size={18} />
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0,
                    flex: 1
                  }}>
                    Danh sách kiểm tra bảo dưỡng
                  </h3>
                  <ChevronDown
                    size={20}
                    style={{
                      color: 'var(--text-secondary)',
                      transition: 'transform 0.3s ease',
                      transform: expandedSections.maintenanceChecklist ? 'rotate(0deg)' : 'rotate(-90deg)'
                    }}
                  />
                </div>

                {expandedSections.maintenanceChecklist && (
                <div style={{ padding: '20px' }}>
                  {/* Checklist Items - 2 columns */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    {maintenanceChecklist.results.map((item, index) => (
                      <div
                        key={item.resultId}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '16px',
                          background: '#F8FAFC',
                          border: `2px solid ${item.result === 'PASS' ? 'rgba(16, 185, 129, 0.3)' : item.result === 'FAIL' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-primary)'}`,
                          borderRadius: '12px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fff'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F8FAFC'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ flexShrink: 0, paddingTop: '4px' }}>
                          <input
                            type="checkbox"
                            checked={item.result === 'PASS' || item.result === 'FAIL'}
                            readOnly
                            disabled
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'default',
                              accentColor: '#FFD875'
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                          }}>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#FFD875',
                              minWidth: '24px'
                            }}>
                              {index + 1}.
                            </span>
                            <h4 style={{
                              fontSize: '15px',
                              fontWeight: '700',
                              color: 'var(--text-primary)',
                              margin: 0,
                              flex: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.partName}
                            </h4>
                          </div>
                          <p style={{
                            fontSize: '13px',
                            color: '#64748B',
                            margin: '0 0 12px 0',
                            lineHeight: '1.5'
                          }}>
                            {item.description}
                          </p>
                          <div style={{
                            display: 'flex',
                            gap: '8px'
                          }}>
                            <button
                              onClick={() => !updating && handleUpdateChecklistItem(item.resultId, 'PASS')}
                              disabled={updating}
                              style={{
                                padding: '8px 16px',
                                border: `2px solid ${item.result === 'PASS' ? '#10B981' : '#E5E7EB'}`,
                                borderRadius: '8px',
                                background: item.result === 'PASS' ? '#10B981' : '#fff',
                                color: item.result === 'PASS' ? '#fff' : '#64748B',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: updating ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: item.result === 'PASS' ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
                                opacity: updating ? 0.6 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!updating && item.result !== 'PASS') {
                                  e.currentTarget.style.background = '#ECFDF5'
                                  e.currentTarget.style.borderColor = '#10B981'
                                  e.currentTarget.style.color = '#10B981'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!updating && item.result !== 'PASS') {
                                  e.currentTarget.style.background = '#fff'
                                  e.currentTarget.style.borderColor = '#E5E7EB'
                                  e.currentTarget.style.color = '#64748B'
                                }
                              }}
                            >
                              Đạt
                            </button>
                            <button
                              onClick={() => !updating && handleUpdateChecklistItem(item.resultId, 'FAIL')}
                              disabled={updating}
                              style={{
                                padding: '8px 16px',
                                border: `2px solid ${item.result === 'FAIL' ? '#EF4444' : '#E5E7EB'}`,
                                borderRadius: '8px',
                                background: item.result === 'FAIL' ? '#EF4444' : '#fff',
                                color: item.result === 'FAIL' ? '#fff' : '#64748B',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: updating ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: item.result === 'FAIL' ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none',
                                opacity: updating ? 0.6 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!updating && item.result !== 'FAIL') {
                                  e.currentTarget.style.background = '#FEF2F2'
                                  e.currentTarget.style.borderColor = '#EF4444'
                                  e.currentTarget.style.color = '#EF4444'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!updating && item.result !== 'FAIL') {
                                  e.currentTarget.style.background = '#fff'
                                  e.currentTarget.style.borderColor = '#E5E7EB'
                                  e.currentTarget.style.color = '#64748B'
                                }
                              }}
                            >
                              Không
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Confirm Button */}
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '2px solid var(--border-primary)',
                    textAlign: 'right'
                  }}>
                    <button
                      onClick={handleConfirmChecklist}
                      disabled={updating || !canConfirmChecklist()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: (updating || !canConfirmChecklist()) ? '#E5E7EB' : 'linear-gradient(135deg, #FFD875, #FFE9A8)',
                        color: (updating || !canConfirmChecklist()) ? '#9CA3AF' : '#000',
                        border: `2px solid ${(updating || !canConfirmChecklist()) ? '#D1D5DB' : '#FFD875'}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: (updating || !canConfirmChecklist()) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: (updating || !canConfirmChecklist()) ? 'none' : '0 4px 12px rgba(255, 216, 117, 0.4)',
                        opacity: (updating || !canConfirmChecklist()) ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!updating && canConfirmChecklist()) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 216, 117, 0.5)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!updating && canConfirmChecklist()) {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 216, 117, 0.4)'
                        }
                      }}
                    >
                      <CheckCircle size={18} />
                      Xác nhận hoàn thành kiểm tra
                    </button>
                    {!canConfirmChecklist() && (
                      <p style={{
                        marginTop: '12px',
                        fontSize: '13px',
                        color: '#EF4444',
                        fontWeight: '500',
                        margin: '12px 0 0 0',
                        textAlign: 'center'
                      }}>
                        Vui lòng đánh giá tất cả các phụ tùng trước khi xác nhận
                      </p>
                    )}
                  </div>
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingDetail

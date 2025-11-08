import { useEffect, useState } from 'react'
import { Vehicle } from '@/services/vehicleService'
import { BookingService, type CustomerBooking } from '@/services/bookingService'
import { CustomerService } from '@/services/customerService'
import vehicleModelService from '@/services/vehicleModelManagement'
import { useNavigate } from 'react-router-dom'
import { QrCodeIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import MaintenanceDetailsTab from './MaintenanceDetailsTab'
import { WorkOrderPartService } from '@/services/workOrderPartService'

interface VehicleDetailViewProps {
  vehicle: Vehicle
  onClose?: () => void
}

interface MaintenanceHistory {
  bookingId: number
  date: string
  centerName: string
  serviceName: string
  mileage: number
  status: string
  technicianName?: string
  slotTime?: string
  slotLabel?: string
  summary?: {
    checklistCount: number
    partsCount: number
    partsReplaced: number
  }
}

export default function VehicleDetailView({ vehicle, onClose }: VehicleDetailViewProps) {
  const navigate = useNavigate()
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [vehicleModelName, setVehicleModelName] = useState<string>('')
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null)

  // Load customer ID and vehicle model
  useEffect(() => {
    const loadCustomerId = async () => {
      try {
        const response = await CustomerService.getCurrentCustomer()
        if (response.success && response.data) {
          setCustomerId(response.data.customerId)
        }
      } catch (error) {
        console.error('Error loading customer:', error)
      }
    }
    loadCustomerId()
  }, [])

  // Load vehicle model name
  useEffect(() => {
    const loadVehicleModel = async () => {
      if (vehicle.modelId) {
        try {
          const model = await vehicleModelService.getById(vehicle.modelId)
          if (model && model.modelName) {
            setVehicleModelName(model.modelName)
          }
        } catch (error) {
          console.error('Error loading vehicle model:', error)
          setVehicleModelName(vehicle.licensePlate || 'Xe của tôi')
        }
      } else {
        setVehicleModelName(vehicle.licensePlate || 'Xe của tôi')
      }
    }
    loadVehicleModel()
  }, [vehicle.modelId, vehicle.licensePlate])

  // Load maintenance history
  useEffect(() => {
    const loadMaintenanceHistory = async () => {
      if (!customerId) {
        setLoadingHistory(false)
        return
      }

      try {
        setLoadingHistory(true)
        // Get all bookings for customer
        const response = await CustomerService.getCustomerBookings(customerId, { pageNumber: 1, pageSize: 100 })
        
        let bookingsArray: CustomerBooking[] = []
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            bookingsArray = response.data
          } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
            bookingsArray = response.data.bookings
          }
        }

        // Filter bookings for this vehicle (by license plate) and only PAID/COMPLETED
        // Remove duplicates by bookingId first
        const uniqueBookings = bookingsArray.filter((booking, index, self) => 
          index === self.findIndex((b) => b.bookingId === booking.bookingId)
        )
        
        const vehicleBookings = uniqueBookings.filter(booking => {
          const isVehicleMatch = booking.vehiclePlate?.toUpperCase() === vehicle.licensePlate?.toUpperCase()
          const isCompleted = booking.status === 'PAID' || booking.status === 'COMPLETED'
          return isVehicleMatch && isCompleted
        })

        // Get booking details to get mileage and summary
        const historyWithDetails = await Promise.all(
          vehicleBookings.map(async (booking) => {
            try {
              const detail = await BookingService.getBookingDetail(booking.bookingId)
              
              // Get technician name and timeslot from booking detail
              // API returns BookingResponse with TechnicianName directly (PascalCase from C#)
              const detailData = detail?.data as any
              
              // Debug: log to see actual response structure
              if (!detailData?.TechnicianName && !detailData?.technicianName) {
                console.log(`[VehicleDetailView] Booking ${booking.bookingId} detail data:`, detailData)
              }
              
              // Check multiple possible locations for technician name (PascalCase first, then camelCase)
              const technicianName = detailData?.TechnicianName || detailData?.technicianName || detailData?.technicianInfo?.technicianName || detailData?.technicianInfo?.TechnicianName || undefined
              
              // Get slotTime - BookingResponse has SlotTime directly (PascalCase)
              const slotTime = detailData?.SlotTime || detailData?.slotTime || detailData?.timeSlotInfo?.startTime || booking.slotTime || undefined
              // slotLabel might not be in BookingResponse, use from booking if available
              const slotLabel = detailData?.SlotLabel || detailData?.slotLabel || detailData?.timeSlotInfo?.slotLabel || booking.slotLabel || undefined
              
              // Load summary (checklist and parts count)
              let summary = undefined
              try {
                const [checklistResponse, partsList] = await Promise.all([
                  BookingService.getMaintenanceChecklist(booking.bookingId).catch(() => ({ items: [] })),
                  WorkOrderPartService.list(booking.bookingId).catch(() => [])
                ])
                
                let checklistItems: any[] = []
                const responseAny = checklistResponse as any
                if (responseAny?.items && Array.isArray(responseAny.items)) {
                  checklistItems = responseAny.items
                } else if (responseAny?.data?.items && Array.isArray(responseAny.data.items)) {
                  checklistItems = responseAny.data.items
                } else if (responseAny?.data?.results && Array.isArray(responseAny.data.results)) {
                  checklistItems = responseAny.data.results
                } else if (Array.isArray(checklistResponse)) {
                  checklistItems = checklistResponse
                }
                
                const partsReplaced = partsList.filter((p: any) => 
                  (p.status || '').toUpperCase() === 'CONSUMED'
                ).length
                
                summary = {
                  checklistCount: checklistItems.length,
                  partsCount: partsList.length,
                  partsReplaced: partsReplaced
                }
              } catch (error) {
                console.error(`Error loading summary for booking ${booking.bookingId}:`, error)
              }
              
              return {
                bookingId: booking.bookingId,
                date: booking.date,
                centerName: booking.centerName,
                serviceName: booking.serviceName,
                mileage: detail?.data?.currentMileage || vehicle.currentMileage || 0,
                status: booking.status,
                technicianName: technicianName,
                slotTime: slotTime,
                slotLabel: slotLabel,
                summary
              }
            } catch (error) {
              console.error(`Error loading booking detail ${booking.bookingId}:`, error)
              return {
                bookingId: booking.bookingId,
                date: booking.date,
                centerName: booking.centerName,
                serviceName: booking.serviceName,
                mileage: vehicle.currentMileage || 0,
                status: booking.status,
                technicianName: undefined,
                slotTime: booking.slotTime,
                slotLabel: booking.slotLabel
              }
            }
          })
        )

        // Remove duplicates by bookingId (keep the first occurrence)
        const uniqueHistory = historyWithDetails.filter((item, index, self) => 
          index === self.findIndex((t) => t.bookingId === item.bookingId)
        )

        // Sort by date descending (newest first)
        uniqueHistory.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA
        })

        setMaintenanceHistory(uniqueHistory)
      } catch (error) {
        console.error('Error loading maintenance history:', error)
        toast.error('Không thể tải lịch sử bảo dưỡng')
        setMaintenanceHistory([])
      } finally {
        setLoadingHistory(false)
      }
    }

    loadMaintenanceHistory()
  }, [customerId, vehicle.licensePlate])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleBookService = () => {
    // Navigate to booking page with vehicle pre-selected
    navigate('/booking', { state: { vehicleId: vehicle.vehicleId } })
  }

  const handleQRCheckIn = () => {
    // TODO: Implement QR code check-in functionality
    toast('Tính năng QR check-in đang được phát triển', { icon: 'ℹ️' })
  }

  const handleToggleBookingDetail = (bookingId: number) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null)
    } else {
      setExpandedBookingId(bookingId)
    }
  }

  // Vehicle model name is loaded from API in useEffect

  return (
    <div style={{ padding: '20px', background: '#f9fafb', minHeight: '100vh' }}>
      {/* Vehicle Information Card */}
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          margin: '0 0 16px 0',
          color: '#111827'
        }}>
          {vehicleModelName || vehicle.licensePlate?.toUpperCase() || 'Xe của tôi'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Biển số: </span>
            <span style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
              {vehicle.licensePlate?.toUpperCase() || 'N/A'}
            </span>
          </div>
          {vehicle.modelId && (
            <div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Mẫu xe: </span>
              <span style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
                {vehicleModelName}
              </span>
            </div>
          )}
          <div>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Loại xe: </span>
            <span style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
              SCOOTER
            </span>
          </div>
          <div>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Màu sắc: </span>
            <span style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
              {vehicle.color || 'N/A'}
            </span>
          </div>
          {/* Engine displacement - TODO: Get from vehicle model if available */}
          {/* <div>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Dung tích xi lanh: </span>
            <span style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
              125cc
            </span>
          </div> */}
          <div>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Số khung: </span>
            <span style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
              {vehicle.vin || 'N/A'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleBookService}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#FFD875',
              color: '#111827',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFE082'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(255, 216, 117, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFD875'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Đặt dịch vụ
          </button>
        </div>
      </div>

      {/* Maintenance History Card */}
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          margin: '0 0 16px 0',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <WrenchScrewdriverIcon width={20} height={20} style={{ color: '#FFD875' }} />
          Lịch sử sửa chữa
        </h3>

        {loadingHistory ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Đang tải...
          </div>
        ) : maintenanceHistory.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ margin: 0 }}>Chưa có lịch sử bảo dưỡng</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
              Lịch sử các lần bảo dưỡng sẽ được hiển thị tại đây
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {maintenanceHistory.map((history, index) => {
              const isExpanded = expandedBookingId === history.bookingId
              // Tính số thứ tự lần bảo dưỡng (lần mới nhất = 1, lần cũ nhất = length)
              const roundNumber = maintenanceHistory.length - index

              return (
                <div key={history.bookingId}>
                  <div
                    onClick={() => handleToggleBookingDetail(history.bookingId)}
                    style={{
                      padding: '16px',
                      borderBottom: isExpanded ? '1px solid #e5e7eb' : (index < maintenanceHistory.length - 1 ? '1px solid #e5e7eb' : 'none'),
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff'
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: '#FFD875',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: '700',
                      fontSize: '18px',
                      color: '#111827'
                    }}>
                      {roundNumber}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827'
                        }}>
                          Lần {roundNumber}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          fontWeight: '400'
                        }}>
                          {formatDate(history.date)}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', color: '#111827', fontWeight: '500', marginBottom: '6px' }}>
                        {history.serviceName}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          <span style={{ fontWeight: '500' }}>Đại lý:</span> {history.centerName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          <span style={{ fontWeight: '500' }}>Số KM:</span> {history.mileage.toLocaleString('vi-VN')} km
                        </div>
                        {history.slotTime && history.slotTime !== 'N/A' && (
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            <span style={{ fontWeight: '500' }}>Giờ:</span> {history.slotTime}{history.slotLabel && history.slotLabel !== 'N/A' ? ` (${history.slotLabel})` : ''}
                          </div>
                        )}
                        {history.technicianName && history.technicianName !== 'N/A' && (
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            <span style={{ fontWeight: '500' }}>KTV:</span> {history.technicianName}
                          </div>
                        )}
                      </div>
                      {history.summary && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginTop: '8px',
                          marginBottom: '4px'
                        }}>
                          {history.summary.checklistCount > 0 && (
                            <span style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              background: '#ECFDF5',
                              color: '#065F46',
                              borderRadius: '4px',
                              border: '1px solid #10B98133'
                            }}>
                              ✓ Đã kiểm tra {history.summary.checklistCount} hạng mục
                            </span>
                          )}
                          {history.summary.partsReplaced > 0 && (
                            <span style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              background: '#FEF2F2',
                              color: '#991B1B',
                              borderRadius: '4px',
                              border: '1px solid #EF444433'
                            }}>
                              🔧 Đã thay {history.summary.partsReplaced} phụ tùng
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontStyle: 'italic',
                        marginTop: '4px'
                      }}>
                        Nhấn để xem chi tiết danh sách kiểm tra và phụ tùng đã thay thế
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', alignSelf: 'flex-start', marginTop: '4px' }}>
                      {isExpanded ? '▼' : ''}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{
                      padding: '20px',
                      background: '#f9fafb',
                      borderBottom: index < maintenanceHistory.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}>
                      {/* Maintenance Details Tab */}
                      <MaintenanceDetailsTab 
                        bookingId={history.bookingId} 
                        serviceName={history.serviceName}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


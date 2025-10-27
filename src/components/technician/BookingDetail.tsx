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
      console.error('Error fetching booking detail:', error)
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
      <div className="booking-detail">
        <div className="booking-detail__loading">
          <div className="booking-detail__spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="booking-detail">
        <div className="booking-detail__error">
          <p>Không thể tải thông tin booking</p>
          <button onClick={onBack} className="booking-detail__back-btn">
            <ArrowLeft size={16} />
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-detail">
      <div className="booking-detail__main">
        {/* Compact Header */}
        <div className="booking-detail__header">
          <button onClick={onBack} className="booking-detail__back-btn">
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <h1>Chi tiết đơn đặt lịch #{bookingData.bookingId}</h1>
        </div>

        {/* Main Content Card */}
        <div className="booking-detail__main-card">
          {/* Compact Stats Cards */}
          <div className="booking-detail__stats">
            <div className="booking-detail__stats__card">
              <div className="booking-detail__stats__card__icon">
                <Hash size={16} />
              </div>
              <div className="booking-detail__stats__card__content">
                <div className="booking-detail__stats__card__content__value">#{bookingData.bookingId}</div>
                <div className="booking-detail__stats__card__content__label">Mã đơn</div>
              </div>
            </div>
            
            <div className="booking-detail__stats__card">
              <div className="booking-detail__stats__card__icon">
                <User size={16} />
              </div>
              <div className="booking-detail__stats__card__content">
                <div className="booking-detail__stats__card__content__value">{bookingData.customerName}</div>
                <div className="booking-detail__stats__card__content__label">Khách hàng</div>
              </div>
            </div>

            <div className="booking-detail__stats__card">
              <div className="booking-detail__stats__card__icon">
                <Car size={16} />
              </div>
              <div className="booking-detail__stats__card__content">
                <div className="booking-detail__stats__card__content__value">{bookingData.vehiclePlate}</div>
                <div className="booking-detail__stats__card__content__label">Biển số xe</div>
              </div>
            </div>

            <div className="booking-detail__stats__card">
              <div className="booking-detail__stats__card__icon">
                <Wrench size={16} />
              </div>
              <div className="booking-detail__stats__card__content">
                <div className="booking-detail__stats__card__content__value" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bookingData.serviceName}</div>
                <div className="booking-detail__stats__card__content__label">Dịch vụ</div>
              </div>
            </div>

            <div className="booking-detail__stats__card">
              <div className="booking-detail__stats__card__icon">
                <Clock size={16} />
              </div>
              <div className="booking-detail__stats__card__content">
                <div className="booking-detail__stats__card__content__value">{bookingData.slotTime.replace(' SA', '').replace(' CH', '')}</div>
                <div className="booking-detail__stats__card__content__label">Thời gian</div>
              </div>
            </div>

            <div className="booking-detail__stats__card">
              <div className="booking-detail__stats__card__icon">
                <DollarSign size={16} />
              </div>
              <div className="booking-detail__stats__card__content">
                <div className="booking-detail__stats__card__content__value" style={{ fontSize: '0.875rem' }}>{bookingData.servicePrice.toLocaleString('vi-VN')} VNĐ</div>
                <div className="booking-detail__stats__card__content__label">Giá dịch vụ</div>
              </div>
            </div>
          </div>

        {/* Detailed Information */}
        <div className="booking-detail__content">
          {/* Customer Information */}
          <div className="booking-detail__section">
            <div className="booking-detail__section-header" onClick={() => toggleSection('customerInfo')}>
              <User size={16} />
              <h3>Thông tin khách hàng</h3>
              <ChevronDown 
                size={20} 
                className={`booking-detail__section-header__arrow ${!expandedSections.customerInfo ? 'collapsed' : ''}`}
              />
            </div>
            {expandedSections.customerInfo && (
            <div className="booking-detail__info-grid">
              <div className="booking-detail__info-item">
                <label>Tên khách hàng</label>
                <span>{bookingData.customerName}</span>
              </div>
              <div className="booking-detail__info-item">
                <label>Số điện thoại</label>
                <span>{bookingData.customerPhone}</span>
              </div>
              <div className="booking-detail__info-item">
                <label>Email</label>
                <span>{bookingData.customerEmail}</span>
              </div>
              <div className="booking-detail__info-item">
                <label>Địa chỉ</label>
                <span>{bookingData.customerAddress}</span>
              </div>
              <div className="booking-detail__info-item">
                <label>Số km hiện tại</label>
                <span>{bookingData.currentMileage.toLocaleString()} km</span>
              </div>
            </div>
            )}
          </div>

          {/* Special Requests */}
          {bookingData.specialRequests && (
            <div className="booking-detail__section">
              <div className="booking-detail__section-header" onClick={() => toggleSection('specialRequests')}>
                <FileText size={16} />
                <h3>Yêu cầu đặc biệt</h3>
                <ChevronDown 
                  size={20} 
                  className={`booking-detail__section-header__arrow ${!expandedSections.specialRequests ? 'collapsed' : ''}`}
                />
              </div>
              {expandedSections.specialRequests && (
              <div className="booking-detail__special-requests">
                <p>{bookingData.specialRequests}</p>
              </div>
              )}
            </div>
          )}

          {/* Maintenance Checklist */}
          {maintenanceChecklist && (
            <div className="booking-detail__section">
              <div className="booking-detail__section-header" onClick={() => toggleSection('maintenanceChecklist')}>
                <CheckCircle size={16} />
                <h3>Danh sách kiểm tra bảo dưỡng</h3>
                <ChevronDown 
                  size={20} 
                  className={`booking-detail__section-header__arrow ${!expandedSections.maintenanceChecklist ? 'collapsed' : ''}`}
                />
              </div>
              
              {expandedSections.maintenanceChecklist && (
              <>
              {/* Checklist Items - 2 columns */}
              <div className="booking-detail__checklist-list">
                {maintenanceChecklist.results.map((item, index) => (
                  <div key={item.resultId} className="booking-detail__checklist-item">
                    <div className="booking-detail__checklist-checkbox-container">
                      <input
                        type="checkbox"
                        className="booking-detail__checklist-checkbox"
                        checked={item.result === 'PASS' || item.result === 'FAIL'}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="booking-detail__checklist-content">
                      <div className="booking-detail__checklist-title-row">
                        <span className="booking-detail__checklist-index">{index + 1}.</span>
                        <h4 className="booking-detail__checklist-title">{item.partName}</h4>
                      </div>
                      <p className="booking-detail__checklist-description">{item.description}</p>
                    </div>
                    <div className="booking-detail__checklist-actions">
                      <button
                        className={`booking-detail__checklist-action-btn ${item.result === 'PASS' ? 'active' : ''}`}
                        onClick={() => !updating && handleUpdateChecklistItem(item.resultId, 'PASS')}
                        disabled={updating}
                      >
                        Đạt
                      </button>
                      <button
                        className={`booking-detail__checklist-action-btn ${item.result === 'FAIL' ? 'active' : ''}`}
                        onClick={() => !updating && handleUpdateChecklistItem(item.resultId, 'FAIL')}
                        disabled={updating}
                      >
                        Không
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirm Button */}
              <div className="booking-detail__checklist-confirm">
                <button
                  className="booking-detail__checklist-confirm-btn"
                  onClick={handleConfirmChecklist}
                  disabled={updating || !canConfirmChecklist()}
                >
                  <CheckCircle size={16} />
                  Xác nhận hoàn thành kiểm tra
                </button>
                {!canConfirmChecklist() && (
                  <p className="booking-detail__checklist-warning">
                    Vui lòng đánh giá tất cả các phụ tùng trước khi xác nhận
                  </p>
                )}
              </div>
              </>
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
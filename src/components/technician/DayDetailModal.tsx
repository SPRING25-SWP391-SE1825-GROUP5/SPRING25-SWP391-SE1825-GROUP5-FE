import React from 'react'
import { X, Clock, User, Car, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import './DayDetailModal.scss'

interface Appointment {
  id: number
  time: string
  customer: string
  service: string
  vehicle: string
  status: 'confirmed' | 'pending' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  serviceType?: 'repair' | 'maintenance' | 'inspection' | 'replacement' | 'other'
}

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string | null
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onNavigateToVehicleDetails: () => void
}

export default function DayDetailModal({
  isOpen,
  onClose,
  selectedDate,
  appointments,
  onAppointmentClick,
  onNavigateToVehicleDetails
}: DayDetailModalProps) {
  if (!isOpen || !selectedDate) return null

  // Determine service type based on service name
  const getServiceType = (service: string): string => {
    const serviceLower = service.toLowerCase()
    if (serviceLower.includes('sửa chữa') || serviceLower.includes('sửa')) return 'repair'
    if (serviceLower.includes('bảo dưỡng') || serviceLower.includes('maintenance')) return 'maintenance'
    if (serviceLower.includes('kiểm tra') || serviceLower.includes('inspection')) return 'inspection'
    if (serviceLower.includes('thay thế') || serviceLower.includes('replacement')) return 'replacement'
    return 'other'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận'
      case 'pending': return 'Chờ xác nhận'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle
      case 'pending': return Clock
      case 'cancelled': return XCircle
      default: return Clock
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Cao'
      case 'medium': return 'Trung bình'
      case 'low': return 'Thấp'
      default: return priority
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return AlertCircle
      case 'medium': return Clock
      case 'low': return CheckCircle
      default: return Clock
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

  return (
    <div className="day-detail-modal">
      <div className="day-detail-modal__overlay" onClick={onClose} />
      
      <div className="day-detail-modal__content">
        <div className="day-detail-modal__content__header">
          <div className="day-detail-modal__content__header__info">
            <h2 className="day-detail-modal__content__header__info__title">
              Lịch hẹn ngày {formatDate(selectedDate)}
            </h2>
            <p className="day-detail-modal__content__header__info__count">
              {appointments.length} cuộc hẹn
            </p>
          </div>
          <button
            className="day-detail-modal__content__header__close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="day-detail-modal__content__body">
          {appointments.length === 0 ? (
            <div className="day-detail-modal__content__body__empty">
              <div className="day-detail-modal__content__body__empty__icon">
                <Clock size={48} />
              </div>
              <h3 className="day-detail-modal__content__body__empty__title">
                Không có lịch hẹn
              </h3>
              <p className="day-detail-modal__content__body__empty__description">
                Ngày này không có cuộc hẹn nào được lên lịch
              </p>
            </div>
          ) : (
            <div className="day-detail-modal__content__body__appointments">
              {appointments.map((appointment) => {
                const serviceType = appointment.serviceType || getServiceType(appointment.service)
                const StatusIcon = getStatusIcon(appointment.status)
                const PriorityIcon = getPriorityIcon(appointment.priority)

                return (
                  <div
                    key={appointment.id}
                    className={`day-detail-modal__content__body__appointments__item day-detail-modal__content__body__appointments__item--${serviceType}`}
                    onClick={() => onAppointmentClick(appointment)}
                  >
                    <div className="day-detail-modal__content__body__appointments__item__time">
                      <Clock size={16} />
                      {appointment.time}
                    </div>
                    
                    <div className="day-detail-modal__content__body__appointments__item__content">
                      <h4 className="day-detail-modal__content__body__appointments__item__content__service">
                        {appointment.service}
                      </h4>
                      
                      <div className="day-detail-modal__content__body__appointments__item__content__details">
                        <div className="day-detail-modal__content__body__appointments__item__content__details__customer">
                          <User size={14} />
                          {appointment.customer}
                        </div>
                        <div className="day-detail-modal__content__body__appointments__item__content__details__vehicle">
                          <Car size={14} />
                          {appointment.vehicle}
                        </div>
                      </div>

                      <div className="day-detail-modal__content__body__appointments__item__content__badges">
                        <span className="day-detail-modal__content__body__appointments__item__content__badges__priority">
                          <PriorityIcon size={12} />
                          {getPriorityText(appointment.priority)}
                        </span>
                        <span className="day-detail-modal__content__body__appointments__item__content__badges__status">
                          <StatusIcon size={12} />
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                    </div>

                    <div className="day-detail-modal__content__body__appointments__item__actions">
                      <button
                        className="day-detail-modal__content__body__appointments__item__actions__button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigateToVehicleDetails()
                        }}
                      >
                        Chi tiết xe
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

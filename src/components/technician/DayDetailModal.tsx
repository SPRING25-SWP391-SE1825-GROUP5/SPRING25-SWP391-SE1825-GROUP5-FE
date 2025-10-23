import React from 'react'
import { X, Clock, CheckCircle, XCircle } from 'lucide-react'
import { type TimeSlot } from '@/types/technician'
import './DayDetailModal.scss'

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string | null
  timeSlots: TimeSlot[]
  onNavigateToVehicleDetails: () => void
}

export default function DayDetailModal({
  isOpen,
  onClose,
  selectedDate,
  timeSlots,
  onNavigateToVehicleDetails
}: DayDetailModalProps) {
  if (!isOpen || !selectedDate) return null

  const getStatusText = (isAvailable: boolean) => {
    return isAvailable ? 'Khả dụng' : 'Đã được đặt'
  }

  const getStatusIcon = (isAvailable: boolean) => {
    return isAvailable ? CheckCircle : XCircle
  }

  const getStatusClass = (isAvailable: boolean) => {
    return isAvailable ? 'available' : 'booked'
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
              Lịch làm việc ngày {formatDate(selectedDate)}
            </h2>
            <p className="day-detail-modal__content__header__info__count">
              {timeSlots.length} khung giờ
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
          {timeSlots.length === 0 ? (
            <div className="day-detail-modal__content__body__empty">
              <div className="day-detail-modal__content__body__empty__icon">
                <Clock size={48} />
              </div>
              <h3 className="day-detail-modal__content__body__empty__title">
                Không có lịch làm việc
              </h3>
              <p className="day-detail-modal__content__body__empty__description">
                Ngày này không có khung giờ làm việc nào
              </p>
            </div>
          ) : (
            <div className="day-detail-modal__content__body__timeslots">
              {timeSlots.map((timeSlot) => {
                const StatusIcon = getStatusIcon(timeSlot.isAvailable)
                const statusClass = getStatusClass(timeSlot.isAvailable)

                return (
                  <div
                    key={timeSlot.technicianSlotId}
                    className={`day-detail-modal__content__body__timeslots__item day-detail-modal__content__body__timeslots__item--${statusClass}`}
                  >
                    <div className="day-detail-modal__content__body__timeslots__item__time">
                      <Clock size={16} />
                      {timeSlot.slotTime}
                    </div>
                    
                    <div className="day-detail-modal__content__body__timeslots__item__content">
                      <h4 className="day-detail-modal__content__body__timeslots__item__content__title">
                        Khung giờ {timeSlot.slotTime}
                      </h4>
                      
                      {timeSlot.notes && (
                        <p className="day-detail-modal__content__body__timeslots__item__content__notes">
                          {timeSlot.notes}
                        </p>
                      )}

                      <div className="day-detail-modal__content__body__timeslots__item__content__status">
                        <StatusIcon size={16} />
                        <span className={`day-detail-modal__content__body__timeslots__item__content__status__text day-detail-modal__content__body__timeslots__item__content__status__text--${statusClass}`}>
                          {getStatusText(timeSlot.isAvailable)}
                        </span>
                      </div>
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

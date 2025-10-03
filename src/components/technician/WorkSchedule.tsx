import { useState } from 'react'
import { Calendar, Clock, User, Car, FileText } from 'lucide-react'
import './WorkSchedule.scss'

interface ScheduleData {
  id: number
  date: string
  timeSlot: string
  appointments: Array<{
    id: number
    time: string
    customer: string
    service: string
    vehicle: string
    status: string
    priority: string
  }>
  workload: 'light' | 'moderate' | 'heavy'
}

interface WorkScheduleProps {
  onNavigateToLeaveRequest: () => void
  onNavigateToVehicleDetails: () => void
}

export default function WorkSchedule({ onNavigateToLeaveRequest, onNavigateToVehicleDetails }: WorkScheduleProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')

  const scheduleData: ScheduleData[] = [
    {
      id: 1,
      date: '2024-01-18',
      timeSlot: '08:00 - 17:00',
      appointments: [
        {
          id: 1,
          time: '09:00',
          customer: 'Nguyễn Văn An',
          service: 'Sửa chữa động cơ',
          vehicle: 'VF e34 - 30A-12345',
          status: 'confirmed',
          priority: 'high'
        },
        {
          id: 2,
          time: '14:00',
          customer: 'Trần Thị Bình',
          service: 'Bảo dưỡng định kỳ',
          vehicle: 'Newtech - 29B-67890',
          status: 'pending',
          priority: 'medium'
        }
      ],
      workload: 'moderate'
    },
    {
      id: 2,
      date: '2024-01-19',
      timeSlot: '08:00 - 17:00',
      appointments: [
        {
          id: 3,
          time: '08:00',
          customer: 'Lê Hoài Cường',
          service: 'Thay thế pin',
          vehicle: 'Xmen Neo - 51C-11111',
          status: 'confirmed',
          priority: 'high'
        },
        {
          id: 4,
          time: '10:30',
          customer: 'Phạm Thị Dung',
          service: 'Kiểm tra hệ thống điện',
          vehicle: 'VF 5 Plus - 52D-22222',
          status: 'confirmed',
          priority: 'medium'
        },
        {
          id: 5,
          time: '15:00',
          customer: 'Hoàng Văn Em',
          service: 'Sửa chữa phanh',
          vehicle: 'Klara S - 53E-33333',
          status: 'pending',
          priority: 'low'
        }
      ],
      workload: 'heavy'
    },
    {
      id: 3,
      date: '2024-01-20',
      timeSlot: '08:00 - 17:00',
      appointments: [
        {
          id: 6,
          time: '11:00',
          customer: 'Nguyễn Thị Phương',
          service: 'Bảo dưỡng định kỳ',
          vehicle: 'Feliz S - 54F-44444',
          status: 'confirmed',
          priority: 'low'
        }
      ],
      workload: 'light'
    }
  ]

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'light': return '#10b981'
      case 'moderate': return '#f59e0b'
      case 'heavy': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getWorkloadText = (workload: string) => {
    switch (workload) {
      case 'light': return 'Nhẹ'
      case 'moderate': return 'Vừa'
      case 'heavy': return 'Nặng'
      default: return workload
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận'
      case 'pending': return 'Chờ xác nhận'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
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

  return (
    <div className="work-schedule">
      {/* Header */}
      <div className="work-schedule__header">
        <div className="work-schedule__header__info">
          <h1 className="work-schedule__header__info__title">
            <Calendar className="work-schedule__header__info__title__icon" size={32} />
            Lịch làm việc
          </h1>
          <p className="work-schedule__header__info__description">
            Xem lịch trình công việc và cuộc hẹn của bạn
          </p>
        </div>

        <div className="work-schedule__header__actions">
          <div className="work-schedule__header__actions__toggle">
            <button
              className={`work-schedule__header__actions__toggle__btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Tuần
            </button>
            <button
              className={`work-schedule__header__actions__toggle__btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Tháng
            </button>
          </div>

          <button
            className="work-schedule__header__actions__button"
            onClick={onNavigateToLeaveRequest}
          >
            <FileText size={16} />
            Yêu cầu nghỉ phép
          </button>
        </div>
      </div>

      {/* Schedule List */}
      <div className="work-schedule__list">
        {scheduleData.map((schedule) => (
          <div key={schedule.id} className="work-schedule__list__item">
            {/* Date Header */}
            <div className="work-schedule__list__item__header">
              <div className="work-schedule__list__item__header__date">
                <div className="work-schedule__list__item__header__date__day">
                  {new Date(schedule.date).toLocaleDateString('vi-VN', { weekday: 'long' })}
                </div>
                <div className="work-schedule__list__item__header__date__number">
                  {new Date(schedule.date).getDate()}
                </div>
                <div className="work-schedule__list__item__header__date__month">
                  Tháng {new Date(schedule.date).getMonth() + 1}
                </div>
              </div>

              <div className="work-schedule__list__item__header__info">
                <div className="work-schedule__list__item__header__info__time">
                  <Clock size={16} />
                  {schedule.timeSlot}
                </div>
                <div 
                  className="work-schedule__list__item__header__info__workload"
                  style={{ color: getWorkloadColor(schedule.workload) }}
                >
                  Khối lượng: {getWorkloadText(schedule.workload)}
                </div>
                <div className="work-schedule__list__item__header__info__count">
                  {schedule.appointments.length} cuộc hẹn
                </div>
              </div>
            </div>

            {/* Appointments */}
            <div className="work-schedule__list__item__appointments">
              {schedule.appointments.map((appointment) => (
                <div key={appointment.id} className="work-schedule__list__item__appointments__item">
                  <div className="work-schedule__list__item__appointments__item__time">
                    {appointment.time}
                  </div>
                  
                  <div className="work-schedule__list__item__appointments__item__content">
                    <div className="work-schedule__list__item__appointments__item__content__header">
                      <h4 className="work-schedule__list__item__appointments__item__content__header__service">
                        {appointment.service}
                      </h4>
                      <div className="work-schedule__list__item__appointments__item__content__header__badges">
                        <span 
                          className="work-schedule__list__item__appointments__item__content__header__badges__priority"
                          style={{ backgroundColor: getPriorityColor(appointment.priority), color: 'white' }}
                        >
                          {getPriorityText(appointment.priority)}
                        </span>
                        <span 
                          className="work-schedule__list__item__appointments__item__content__header__badges__status"
                          style={{ backgroundColor: getStatusColor(appointment.status), color: 'white' }}
                        >
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                    </div>

                    <div className="work-schedule__list__item__appointments__item__content__details">
                      <div className="work-schedule__list__item__appointments__item__content__details__customer">
                        <User size={14} />
                        {appointment.customer}
                      </div>
                      <div className="work-schedule__list__item__appointments__item__content__details__vehicle">
                        <Car size={14} />
                        {appointment.vehicle}
                      </div>
                    </div>
                  </div>

                  <div className="work-schedule__list__item__appointments__item__actions">
                    <button
                      className="work-schedule__list__item__appointments__item__actions__button"
                      onClick={onNavigateToVehicleDetails}
                    >
                      Chi tiết xe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {scheduleData.length === 0 && (
        <div className="work-schedule__empty">
          <div className="work-schedule__empty__icon">
            <Calendar size={64} />
          </div>
          <h3 className="work-schedule__empty__title">
            Không có lịch làm việc
          </h3>
          <p className="work-schedule__empty__description">
            Chưa có cuộc hẹn nào được lên lịch cho thời gian này
          </p>
        </div>
      )}
    </div>
  )
}
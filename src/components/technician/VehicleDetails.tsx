import { useState } from 'react'
import { Car, Search, User, Package, Eye, Wrench, AlertCircle, CheckCircle, X } from 'lucide-react'
import './VehicleDetails.scss'

interface Vehicle {
  id: number
  licensePlate: string
  owner: {
    name: string
    phone: string
    email: string
  }
  info: {
    brand: string
    model: string
    year: number
    color: string
    mileage: number
  }
  parts: Array<{
    name: string
    condition: 'good' | 'fair' | 'poor' | 'needs_replacement'
    lastChecked: string
    notes?: string
  }>
  serviceHistory: Array<{
    date: string
    service: string
    technician: string
    cost: number
    notes: string
  }>
  lastService: string
  nextService: string
}

interface VehicleDetailModalProps {
  vehicle: Vehicle
  onClose: () => void
}

function VehicleDetailModal({ vehicle, onClose }: VehicleDetailModalProps) {
  return (
    <div className="vehicle-detail-modal">
      <div className="vehicle-detail-modal__content">
        {/* Modal Header */}
        <div className="vehicle-detail-modal__content__header">
          <div className="vehicle-detail-modal__content__header__info">
            <h2 className="vehicle-detail-modal__content__header__info__title">
              {vehicle.licensePlate}
            </h2>
            <p className="vehicle-detail-modal__content__header__info__subtitle">
              {vehicle.info.brand} {vehicle.info.model} ({vehicle.info.year})
            </p>
          </div>
          <button 
            className="vehicle-detail-modal__content__header__close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="vehicle-detail-modal__content__body">
          {/* Vehicle Info */}
          <div className="vehicle-detail-modal__content__body__section">
            <h3 className="vehicle-detail-modal__content__body__section__title">
              Thông tin xe
            </h3>
            <div className="vehicle-detail-modal__content__body__section__grid">
              <div className="vehicle-detail-modal__content__body__section__grid__item">
                <span className="vehicle-detail-modal__content__body__section__grid__item__label">
                  Màu sắc:
                </span>
                <span className="vehicle-detail-modal__content__body__section__grid__item__value">
                  {vehicle.info.color}
                </span>
              </div>
              <div className="vehicle-detail-modal__content__body__section__grid__item">
                <span className="vehicle-detail-modal__content__body__section__grid__item__label">
                  Số km đã chạy:
                </span>
                <span className="vehicle-detail-modal__content__body__section__grid__item__value">
                  {vehicle.info.mileage.toLocaleString()} km
                </span>
              </div>
              <div className="vehicle-detail-modal__content__body__section__grid__item">
                <span className="vehicle-detail-modal__content__body__section__grid__item__label">
                  Bảo dưỡng cuối:
                </span>
                <span className="vehicle-detail-modal__content__body__section__grid__item__value">
                  {vehicle.lastService}
                </span>
              </div>
              <div className="vehicle-detail-modal__content__body__section__grid__item">
                <span className="vehicle-detail-modal__content__body__section__grid__item__label">
                  Bảo dưỡng tiếp theo:
                </span>
                <span className="vehicle-detail-modal__content__body__section__grid__item__value">
                  {vehicle.nextService}
                </span>
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="vehicle-detail-modal__content__body__section">
            <h3 className="vehicle-detail-modal__content__body__section__title">
              Thông tin chủ xe
            </h3>
            <div className="vehicle-detail-modal__content__body__section__owner">
              <div className="vehicle-detail-modal__content__body__section__owner__item">
                <User size={16} />
                {vehicle.owner.name}
              </div>
              <div className="vehicle-detail-modal__content__body__section__owner__item">
                📞 {vehicle.owner.phone}
              </div>
              <div className="vehicle-detail-modal__content__body__section__owner__item">
                ✉️ {vehicle.owner.email}
              </div>
            </div>
          </div>

          {/* Parts Status */}
          <div className="vehicle-detail-modal__content__body__section">
            <h3 className="vehicle-detail-modal__content__body__section__title">
              Tình trạng linh kiện
            </h3>
            <div className="vehicle-detail-modal__content__body__section__parts">
              {vehicle.parts.map((part, index) => (
                <div key={index} className="vehicle-detail-modal__content__body__section__parts__item">
                  <div className="vehicle-detail-modal__content__body__section__parts__item__header">
                    <span className="vehicle-detail-modal__content__body__section__parts__item__header__name">
                      {part.name}
                    </span>
                    <span 
                      className="vehicle-detail-modal__content__body__section__parts__item__header__condition"
                      style={{ 
                        backgroundColor: 
                          part.condition === 'good' ? '#10b981' :
                          part.condition === 'fair' ? '#f59e0b' :
                          part.condition === 'poor' ? '#ef4444' : '#dc2626',
                        color: 'white'
                      }}
                    >
                      {part.condition === 'good' ? 'Tốt' :
                       part.condition === 'fair' ? 'Khá' :
                       part.condition === 'poor' ? 'Kém' : 'Cần thay'}
                    </span>
                  </div>
                  <div className="vehicle-detail-modal__content__body__section__parts__item__details">
                    <span>Kiểm tra cuối: {part.lastChecked}</span>
                    {part.notes && <span>Ghi chú: {part.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service History */}
          <div className="vehicle-detail-modal__content__body__section">
            <h3 className="vehicle-detail-modal__content__body__section__title">
              Lịch sử bảo dưỡng
            </h3>
            <div className="vehicle-detail-modal__content__body__section__history">
              {vehicle.serviceHistory.map((service, index) => (
                <div key={index} className="vehicle-detail-modal__content__body__section__history__item">
                  <div className="vehicle-detail-modal__content__body__section__history__item__header">
                    <span className="vehicle-detail-modal__content__body__section__history__item__header__service">
                      {service.service}
                    </span>
                    <span className="vehicle-detail-modal__content__body__section__history__item__header__date">
                      {service.date}
                    </span>
                  </div>
                  <div className="vehicle-detail-modal__content__body__section__history__item__details">
                    <span>Kỹ thuật viên: {service.technician}</span>
                    <span>Chi phí: {service.cost.toLocaleString()} VND</span>
                  </div>
                  <div className="vehicle-detail-modal__content__body__section__history__item__notes">
                    {service.notes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VehicleDetails() {
  const [search, setSearch] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const [vehicles] = useState<Vehicle[]>([
    {
      id: 1,
      licensePlate: '30A-12345',
      owner: {
        name: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'nguyenvana@email.com'
      },
      info: {
        brand: 'VinFast',
        model: 'VF e34',
        year: 2023,
        color: 'Đỏ',
        mileage: 15000
      },
      parts: [
        {
          name: 'Pin chính',
          condition: 'good',
          lastChecked: '2024-01-15',
          notes: 'Hoạt động bình thường'
        },
        {
          name: 'Động cơ điện',
          condition: 'fair',
          lastChecked: '2024-01-15',
          notes: 'Có tiếng kêu nhỏ, cần theo dõi'
        },
        {
          name: 'Phanh trước',
          condition: 'poor',
          lastChecked: '2024-01-10',
          notes: 'Má phanh mòn, cần thay sớm'
        }
      ],
      serviceHistory: [
        {
          date: '2024-01-15',
          service: 'Bảo dưỡng định kỳ',
          technician: 'Trần Văn B',
          cost: 500000,
          notes: 'Kiểm tra tổng quát, thay dầu nhờn'
        },
        {
          date: '2023-12-10',
          service: 'Thay pin phụ',
          technician: 'Lê Văn C',
          cost: 2000000,
          notes: 'Pin phụ bị hỏng, đã thay mới'
        }
      ],
      lastService: '2024-01-15',
      nextService: '2024-04-15'
    },
    {
      id: 2,
      licensePlate: '29B-67890',
      owner: {
        name: 'Trần Thị Bình',
        phone: '0902345678',
        email: 'tranthib@email.com'
      },
      info: {
        brand: 'Pega',
        model: 'Newtech',
        year: 2022,
        color: 'Xanh',
        mileage: 8500
      },
      parts: [
        {
          name: 'Pin chính',
          condition: 'good',
          lastChecked: '2024-01-12'
        },
        {
          name: 'Hệ thống sạc',
          condition: 'good',
          lastChecked: '2024-01-12'
        },
        {
          name: 'Đèn LED',
          condition: 'needs_replacement',
          lastChecked: '2024-01-12',
          notes: 'Đèn pha bên trái không sáng'
        }
      ],
      serviceHistory: [
        {
          date: '2024-01-12',
          service: 'Kiểm tra định kỳ',
          technician: 'Phạm Văn D',
          cost: 200000,
          notes: 'Kiểm tra tổng quát, phát hiện đèn hỏng'
        }
      ],
      lastService: '2024-01-12',
      nextService: '2024-03-12'
    },
    {
      id: 3,
      licensePlate: '51C-11111',
      owner: {
        name: 'Lê Hoài Cường',
        phone: '0903456789',
        email: 'lehoaicuong@email.com'
      },
      info: {
        brand: 'Yadea',
        model: 'Xmen Neo',
        year: 2023,
        color: 'Đen',
        mileage: 12000
      },
      parts: [
        {
          name: 'Pin Lithium',
          condition: 'fair',
          lastChecked: '2024-01-18',
          notes: 'Dung lượng giảm 15%'
        },
        {
          name: 'Bộ điều khiển',
          condition: 'good',
          lastChecked: '2024-01-18'
        },
        {
          name: 'Lốp xe',
          condition: 'good',
          lastChecked: '2024-01-18'
        }
      ],
      serviceHistory: [
        {
          date: '2024-01-18',
          service: 'Kiểm tra pin và hệ thống điện',
          technician: 'Nguyễn Văn E',
          cost: 300000,
          notes: 'Pin còn tốt nhưng cần theo dõi'
        }
      ],
      lastService: '2024-01-18',
      nextService: '2024-04-18'
    }
  ])

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
    vehicle.owner.name.toLowerCase().includes(search.toLowerCase()) ||
    vehicle.info.brand.toLowerCase().includes(search.toLowerCase()) ||
    vehicle.info.model.toLowerCase().includes(search.toLowerCase())
  )

  const getOverallCondition = (parts: Vehicle['parts']) => {
    const conditions = parts.map(part => part.condition)
    if (conditions.includes('needs_replacement')) return 'needs_replacement'
    if (conditions.includes('poor')) return 'poor'
    if (conditions.includes('fair')) return 'fair'
    return 'good'
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return '#10b981'
      case 'fair': return '#f59e0b'
      case 'poor': return '#ef4444'
      case 'needs_replacement': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'good': return 'Tốt'
      case 'fair': return 'Khá'
      case 'poor': return 'Kém'
      case 'needs_replacement': return 'Cần sửa chữa'
      default: return condition
    }
  }

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'good': return <CheckCircle size={16} />
      case 'fair': return <AlertCircle size={16} />
      case 'poor': return <AlertCircle size={16} />
      case 'needs_replacement': return <Wrench size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  return (
    <div className="vehicle-details">
      {/* Header */}
      <div className="vehicle-details__header">
        <div className="vehicle-details__header__info">
          <h1 className="vehicle-details__header__info__title">
            <Car className="vehicle-details__header__info__title__icon" size={32} />
            Chi tiết xe khách hàng
          </h1>
          <p className="vehicle-details__header__info__description">
            Xem thông tin chi tiết về xe và linh kiện của khách hàng
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="vehicle-details__search">
        <Search className="vehicle-details__search__icon" size={16} />
        <input
          className="vehicle-details__search__input"
          type="text"
          placeholder="Tìm kiếm theo biển số, tên chủ xe, hãng xe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Vehicles List */}
      <div className="vehicle-details__list">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="vehicle-details__list__item">
            {/* Vehicle Header */}
            <div className="vehicle-details__list__item__header">
              <div className="vehicle-details__list__item__header__left">
                <h3 className="vehicle-details__list__item__header__left__plate">
                  {vehicle.licensePlate}
                </h3>
                <div className="vehicle-details__list__item__header__left__info">
                  <span>{vehicle.info.brand} {vehicle.info.model}</span>
                  <span>({vehicle.info.year})</span>
                  <span>{vehicle.info.color}</span>
                </div>
              </div>

              <div className="vehicle-details__list__item__header__right">
                <span 
                  className="vehicle-details__list__item__header__right__condition"
                  style={{ 
                    backgroundColor: getConditionColor(getOverallCondition(vehicle.parts)),
                    color: 'white'
                  }}
                >
                  {getConditionIcon(getOverallCondition(vehicle.parts))}
                  {getConditionText(getOverallCondition(vehicle.parts))}
                </span>
              </div>
            </div>

            {/* Vehicle Body */}
            <div className="vehicle-details__list__item__body">
              <div className="vehicle-details__list__item__body__content">
                {/* Owner Info */}
                <div className="vehicle-details__list__item__body__content__owner">
                  <h4>Thông tin chủ xe:</h4>
                  <div className="vehicle-details__list__item__body__content__owner__details">
                    <span>
                      <User size={14} />
                      {vehicle.owner.name}
                    </span>
                    <span>📞 {vehicle.owner.phone}</span>
                  </div>
                </div>

                {/* Vehicle Stats */}
                <div className="vehicle-details__list__item__body__content__stats">
                  <div className="vehicle-details__list__item__body__content__stats__item">
                    <span className="vehicle-details__list__item__body__content__stats__item__label">
                      Số km:
                    </span>
                    <span className="vehicle-details__list__item__body__content__stats__item__value">
                      {vehicle.info.mileage.toLocaleString()} km
                    </span>
                  </div>
                  <div className="vehicle-details__list__item__body__content__stats__item">
                    <span className="vehicle-details__list__item__body__content__stats__item__label">
                      Bảo dưỡng cuối:
                    </span>
                    <span className="vehicle-details__list__item__body__content__stats__item__value">
                      {vehicle.lastService}
                    </span>
                  </div>
                  <div className="vehicle-details__list__item__body__content__stats__item">
                    <span className="vehicle-details__list__item__body__content__stats__item__label">
                      Bảo dưỡng tiếp theo:
                    </span>
                    <span className="vehicle-details__list__item__body__content__stats__item__value">
                      {vehicle.nextService}
                    </span>
                  </div>
                </div>

                {/* Parts Preview */}
                <div className="vehicle-details__list__item__body__content__parts">
                  <h4>Tình trạng linh kiện:</h4>
                  <div className="vehicle-details__list__item__body__content__parts__list">
                    {vehicle.parts.slice(0, 3).map((part, index) => (
                      <span 
                        key={index}
                        className="vehicle-details__list__item__body__content__parts__list__item"
                        style={{ color: getConditionColor(part.condition) }}
                      >
                        <Package size={12} />
                        {part.name}: {getConditionText(part.condition)}
                      </span>
                    ))}
                    {vehicle.parts.length > 3 && (
                      <span className="vehicle-details__list__item__body__content__parts__list__more">
                        +{vehicle.parts.length - 3} khác
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="vehicle-details__list__item__body__actions">
                <button
                  className="vehicle-details__list__item__body__actions__button"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <Eye size={16} />
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className="vehicle-details__empty">
          <div className="vehicle-details__empty__icon">
            <Car size={64} />
          </div>
          <h3 className="vehicle-details__empty__title">
            Không tìm thấy xe nào
          </h3>
          <p className="vehicle-details__empty__description">
            {search 
              ? 'Không có xe nào phù hợp với từ khóa tìm kiếm'
              : 'Chưa có thông tin xe nào trong hệ thống'
            }
          </p>
        </div>
      )}

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <VehicleDetailModal 
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  )
}
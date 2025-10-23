import { useState, useMemo, useEffect } from 'react'
import { Car, Search, User, Package, Eye, Wrench, AlertCircle, CheckCircle, X, ChevronDown, ChevronUp, Filter, SortAsc, SortDesc, Settings } from 'lucide-react'
import { VehicleService } from '@/services/vehicleService'
import { TechnicianService } from '@/services/technicianService'
import { useAppSelector } from '@/store/hooks'
import toast from 'react-hot-toast'
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
  const [expandedVehicles, setExpandedVehicles] = useState<Set<number>>(new Set())
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status_critical'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // State for vehicles from API
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user and technician info
  const user = useAppSelector((state) => state.auth.user)
  const [technicianId, setTechnicianId] = useState<number | null>(null)

  // Resolve technicianId
  useEffect(() => {
    const resolveTechnicianId = async () => {
      try {
        const cached = localStorage.getItem('technicianId')
        if (cached) {
          const parsed = Number(cached)
          if (Number.isFinite(parsed) && parsed > 0) {
            setTechnicianId(parsed)
            return
          }
        }

        const userId = user?.id
        if (userId && Number.isFinite(Number(userId))) {
          const result = await TechnicianService.getTechnicianIdByUserId(Number(userId))
          if (result?.technicianId) {
            setTechnicianId(result.technicianId)
            localStorage.setItem('technicianId', String(result.technicianId))
          }
        }
      } catch (e) {
        console.error('Could not resolve technicianId', e)
      }
    }

    resolveTechnicianId()
  }, [user])

  // Fetch vehicles from work queue
  useEffect(() => {
    const fetchVehiclesFromWorkQueue = async () => {
      if (!technicianId) return

      setLoading(true)
      setError(null)

      try {
        // Get bookings for today
        const today = new Date().toISOString().split('T')[0]
        const bookingsResponse = await TechnicianService.getTechnicianBookings(technicianId, today)
        
        // Extract unique customer IDs from bookings
        const bookings = bookingsResponse?.data?.bookings || bookingsResponse?.data || []
        const customerIds = [...new Set(bookings.map((b: any) => b.customerId).filter(Boolean))]
        
        if (customerIds.length === 0) {
          setVehicles([])
          setLoading(false)
          return
        }

        // Fetch vehicles for each customer
        const allVehiclePromises = customerIds.map(async (customerId: number) => {
          try {
            const response = await VehicleService.getVehicles({ customerId })
            return response.data?.vehicles || []
          } catch (err) {
            console.error(`Error fetching vehicles for customer ${customerId}:`, err)
            return []
          }
        })

        const vehicleArrays = await Promise.all(allVehiclePromises)
        const allVehicles = vehicleArrays.flat()

        // Transform API data to Vehicle format
        const transformedVehicles: Vehicle[] = allVehicles.map((v: any) => ({
          id: v.vehicleId,
          licensePlate: v.licensePlate || 'N/A',
          owner: {
            name: v.customerName || 'N/A',
            phone: v.customerPhone || 'N/A',
            email: ''
          },
          info: {
            brand: 'VinFast', // Default brand
            model: 'VF e34', // Default model
            year: 2023, // Default year
            color: v.color || 'N/A',
            mileage: v.currentMileage || 0
          },
          parts: [],
          serviceHistory: [],
          lastService: v.lastServiceDate || 'Chưa có',
          nextService: v.nextServiceDue || 'Chưa có'
        }))

        setVehicles(transformedVehicles)
      } catch (err: any) {
        console.error('Error fetching vehicles:', err)
        setError(err.message || 'Không thể tải danh sách xe')
        toast.error('Không thể tải danh sách xe')
      } finally {
        setLoading(false)
      }
    }

    fetchVehiclesFromWorkQueue()
  }, [technicianId])

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

  // Standardized Status System
  const getStandardizedStatus = (condition: string) => {
    switch (condition) {
      case 'good': return 'excellent'
      case 'fair': return 'good'
      case 'poor': return 'warning'
      case 'needs_replacement': return 'critical'
      default: return 'unknown'
    }
  }

  const getStandardizedStatusText = (condition: string) => {
    switch (condition) {
      case 'good': return 'Sẵn sàng'
      case 'fair': return 'Bảo dưỡng'
      case 'poor': return 'Cần sửa'
      case 'needs_replacement': return 'Hỏng nặng'
      default: return 'Không xác định'
    }
  }

  // Accordion Functions - Single expand behavior
  const toggleVehicleExpansion = (vehicleId: number) => {
    setExpandedVehicles(prev => {
      // If clicking on already expanded vehicle, collapse it
      if (prev.has(vehicleId)) {
        return new Set()
      }
      // Otherwise, expand only this vehicle (close others)
      return new Set([vehicleId])
    })
  }

  const isVehicleExpanded = (vehicleId: number) => {
    return expandedVehicles.has(vehicleId)
  }

  // Sorting and Filtering Logic
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = vehicles.filter(vehicle => 
      vehicle.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.owner.name.toLowerCase().includes(search.toLowerCase()) ||
      `${vehicle.info.brand} ${vehicle.info.model}`.toLowerCase().includes(search.toLowerCase())
    )

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.id - a.id // Assuming higher ID = newer
        case 'oldest':
          return a.id - b.id
        case 'status_critical':
          const aCritical = a.parts.some(part => part.condition === 'needs_replacement' || part.condition === 'poor')
          const bCritical = b.parts.some(part => part.condition === 'needs_replacement' || part.condition === 'poor')
          if (aCritical && !bCritical) return -1
          if (!aCritical && bCritical) return 1
          return b.id - a.id
        default:
          return 0
      }
    })

    return filtered
  }, [vehicles, search, sortBy])

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedVehicles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentVehicles = filteredAndSortedVehicles.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="vehicle-details">
      {/* Content Card */}
      <div className="vehicle-details__content-card">
        {/* Page Header with Search */}
        <div className="vehicle-details__header">
          <div className="vehicle-details__header__title">
            <h1 className="vehicle-details__header__title__text">
              Chi tiết xe khách
            </h1>
          </div>
          
          <div className="vehicle-details__header__search">
            <div className="vehicle-details__header__search__input">
              <Search className="vehicle-details__header__search__input__icon" size={16} />
              <input
                className="vehicle-details__header__search__input__field"
                type="text"
                placeholder="Tìm theo biển số, tên chủ xe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="vehicle-details__header__search__filter">
              <Filter className="vehicle-details__header__search__filter__icon" size={16} />
              <select
                className="vehicle-details__header__search__filter__select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'status_critical')}
              >
                <option value="newest">Ngày tạo (Mới nhất)</option>
                <option value="oldest">Ngày tạo (Cũ nhất)</option>
                <option value="status_critical">Trạng thái (Khẩn cấp)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="vehicle-details__list">
        {currentVehicles.map((vehicle) => {
          const isExpanded = isVehicleExpanded(vehicle.id)
          return (
          <div key={vehicle.id} className={`vehicle-details__list__item ${isExpanded ? 'vehicle-details__list__item--expanded' : ''}`}>
            {/* Vehicle Header - Collapsed State */}
            <div 
              className="vehicle-details__list__item__header"
              onClick={() => toggleVehicleExpansion(vehicle.id)}
            >
              {/* Single Row Layout - All info in one horizontal line */}
              <div className="vehicle-details__list__item__header__content">
                {/* License Plate */}
                <div className="vehicle-details__list__item__header__content__plate">
                  <Car className="vehicle-details__list__item__header__content__plate__icon" size={18} />
                  <span className="vehicle-details__list__item__header__content__plate__text">
                    {vehicle.licensePlate}
                  </span>
                </div>

                {/* Vehicle Info */}
                <div className="vehicle-details__list__item__header__content__vehicle">
                  <span className="vehicle-details__list__item__header__content__vehicle__brand">
                    {vehicle.info.brand} {vehicle.info.model}
                  </span>
                </div>

                {/* Owner Info */}
                <div className="vehicle-details__list__item__header__content__owner">
                  <span className="vehicle-details__list__item__header__content__owner__name">
                    {vehicle.owner.name}
                  </span>
                </div>

                {/* Status Badge */}
                <div 
                  className={`vehicle-details__list__item__header__content__status vehicle-details__list__item__header__content__status--${getStandardizedStatus(getOverallCondition(vehicle.parts))}`}
                >
                  <div className="vehicle-details__list__item__header__content__status__dot"></div>
                  <span className="vehicle-details__list__item__header__content__status__text">
                    {getStandardizedStatusText(getOverallCondition(vehicle.parts))}
                  </span>
                </div>

                {/* Toggle Icon */}
                <div className="vehicle-details__list__item__header__content__toggle">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            {/* Vehicle Body - Expanded Content */}
            {isExpanded && (
              <div className="vehicle-details__list__item__body">
              {/* Khu vực 1: Thông tin Chung - Layout 2 cột */}
              <div className="vehicle-details__list__item__body__general-info">
                {/* Cột 1: Thông tin Chủ xe */}
                <div className="vehicle-details__list__item__body__general-info__owner">
                  <div className="vehicle-details__list__item__body__general-info__owner__header">
                    <User className="vehicle-details__list__item__body__general-info__owner__header__icon" size={16} />
                    <span className="vehicle-details__list__item__body__general-info__owner__header__title">Chủ xe</span>
                  </div>
                  <div className="vehicle-details__list__item__body__general-info__owner__details">
                    <div className="vehicle-details__list__item__body__general-info__owner__details__name">
                      {vehicle.owner.name}
                    </div>
                    <div className="vehicle-details__list__item__body__general-info__owner__details__phone">
                      📞 {vehicle.owner.phone}
                    </div>
                  </div>
                </div>

                {/* Cột 2: Thông số Vận hành */}
                <div className="vehicle-details__list__item__body__general-info__vehicle-stats">
                  <div className="vehicle-details__list__item__body__general-info__vehicle-stats__header">
                    <Settings className="vehicle-details__list__item__body__general-info__vehicle-stats__header__icon" size={16} />
                    <span className="vehicle-details__list__item__body__general-info__vehicle-stats__header__title">Thông số xe</span>
                  </div>
                  <div className="vehicle-details__list__item__body__general-info__vehicle-stats__details">
                    <div className="vehicle-details__list__item__body__general-info__vehicle-stats__details__item">
                      <span className="vehicle-details__list__item__body__general-info__vehicle-stats__details__item__label">Số km:</span>
                      <span className="vehicle-details__list__item__body__general-info__vehicle-stats__details__item__value">
                        {vehicle.info.mileage.toLocaleString()} km
                      </span>
                    </div>
                    <div className="vehicle-details__list__item__body__general-info__vehicle-stats__details__item">
                      <span className="vehicle-details__list__item__body__general-info__vehicle-stats__details__item__label">Bảo dưỡng cuối:</span>
                      <span className="vehicle-details__list__item__body__general-info__vehicle-stats__details__item__value">
                        {vehicle.lastService}
                      </span>
                    </div>
                    <div className="vehicle-details__list__item__body__general-info__vehicle-stats__details__item">
                      <span className="vehicle-details__list__item__body__general-info__vehicle-stats__details__item__label">Bảo dưỡng tiếp theo:</span>
                      <span className="vehicle-details__list__item__body__general-info__vehicle-stats__details__item__value">
                        {vehicle.nextService}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phân cách trực quan */}
              <div className="vehicle-details__list__item__body__separator"></div>

              {/* Khu vực 2: Tình trạng Linh kiện */}
              <div className="vehicle-details__list__item__body__parts">
                <div className="vehicle-details__list__item__body__parts__header">
                  <Package className="vehicle-details__list__item__body__parts__header__icon" size={16} />
                  <span className="vehicle-details__list__item__body__parts__header__title">Tình trạng linh kiện</span>
                </div>
                
                <div className="vehicle-details__list__item__body__parts__table">
                  <table className="vehicle-details__list__item__body__parts__table__content">
                    <thead className="vehicle-details__list__item__body__parts__table__content__header">
                      <tr>
                        <th>TÊN LINH KIỆN</th>
                        <th>TRẠNG THÁI</th>
                      </tr>
                    </thead>
                    <tbody className="vehicle-details__list__item__body__parts__table__content__body">
                      {vehicle.parts.map((part, index) => (
                        <tr key={index} className="vehicle-details__list__item__body__parts__table__content__body__row">
                          <td className="vehicle-details__list__item__body__parts__table__content__body__row__name">
                            {part.name}
                          </td>
                          <td className="vehicle-details__list__item__body__parts__table__content__body__row__status">
                            <span className={`vehicle-details__list__item__body__parts__table__content__body__row__status__badge vehicle-details__list__item__body__parts__table__content__body__row__status__badge--${getStandardizedStatus(part.condition)}`}>
                              {getStandardizedStatusText(part.condition)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button */}
              <div className="vehicle-details__list__item__body__actions">
                <button
                  className="vehicle-details__list__item__body__actions__button vehicle-details__list__item__body__actions__button--collapse"
                  onClick={() => toggleVehicleExpansion(vehicle.id)}
                >
                  <ChevronUp className="vehicle-details__list__item__body__actions__button__icon" size={16} />
                  <span className="vehicle-details__list__item__body__actions__button__text">
                    Thu gọn
                  </span>
                </button>
              </div>
            </div>
            )}
          </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="vehicle-details__pagination">
          <button
            className="vehicle-details__pagination__button vehicle-details__pagination__button--prev"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Lùi
          </button>
          
          <div className="vehicle-details__pagination__pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`vehicle-details__pagination__pages__button ${
                  page === currentPage ? 'vehicle-details__pagination__pages__button--active' : ''
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            className="vehicle-details__pagination__button vehicle-details__pagination__button--next"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Tiếp
          </button>
        </div>
      )}

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
      </div>

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
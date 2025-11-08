import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Star, Clock, Wrench, Calendar, ArrowRight, Package, Info } from 'lucide-react'
import { ServiceManagementService, ServicePackage, Service } from '@/services/serviceManagementService'
import ServiceDetailModal from '@/components/common/ServiceDetailModal'
import './services.scss'

export default function Services() {
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch services and service packages on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch services
        const servicesResponse = await ServiceManagementService.getActiveServices({
          pageSize: 50
        })

        setServices(servicesResponse.services)
        
        // Fetch service packages
        const packagesResponse = await ServiceManagementService.getActiveServicePackages({
          pageSize: 50
        })

        setServicePackages(packagesResponse.packages)
      } catch (error) {

        // Set empty arrays on error to prevent crashes
        setServices([])
        setServicePackages([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter and sort services
  const filteredServices = services
    .filter(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  // Filter and sort packages
  const filteredPackages = servicePackages
    .filter(pkg => 
      pkg.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'name':
          return a.packageName.localeCompare(b.packageName)
        default:
          return 0
      }
    })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleViewDetails = (service: Service) => {
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedService(null)
  }

  const handleBookService = (serviceId: number) => {
    navigate('/booking', { state: { serviceId } })
  }

  return (
    <div className="services-page">
      {/* Hero Section */}
      <section className="services-hero">
        <div className="hero-content">
          <h1 className="hero-title">Gói Dịch Vụ VinFast</h1>
          <p className="hero-subtitle">
            Khám phá các gói dịch vụ chuyên nghiệp với giá cả hợp lý và chất lượng đảm bảo
          </p>
          <div className="hero-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/booking')}
            >
              <Calendar className="btn-icon" />
              Đặt Lịch Ngay
            </button>
            <button 
              className="btn-outline text-color-white"
              style={{ color: 'white' }}
              onClick={() => navigate('/contact')}
            >
              Tư Vấn Miễn Phí
            </button>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="services-tabs">
        <div className="tab-container">
          <button 
            className={`tab-button ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Wrench className="tab-icon" />
            Dịch vụ
          </button>
          <button 
            className={`tab-button ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            <Package className="tab-icon" />
            Gói dịch vụ
          </button>
        </div>
      </section>

      {/* Filter Section */}
      <section className="services-filter">
        <div className="filter-container">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder={`Tìm kiếm ${activeTab === 'services' ? 'dịch vụ' : 'gói dịch vụ'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-options">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="maintenance">Bảo dưỡng</option>
              <option value="repair">Sửa chữa</option>
              <option value="inspection">Kiểm tra</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Sắp xếp theo tên</option>
              <option value="price">Sắp xếp theo giá</option>
            </select>
          </div>
        </div>
      </section>

      {/* Services/Service Packages Grid */}
      <section className="services-grid-section">
        <div className="grid-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : activeTab === 'services' ? (
            filteredServices.length === 0 ? (
              <div className="empty-state">
                <Wrench className="empty-icon" />
                <h3>Không tìm thấy dịch vụ</h3>
                <p>Hãy thử tìm kiếm với từ khóa khác</p>
              </div>
            ) : (
              <div className="services-grid">
                {filteredServices.map((service) => (
                  <div key={service.id} className="service-card">
                    <div className="card-header">
                      <div className="service-badge">
                        <Wrench className="badge-icon" />
                        <span>Dịch vụ</span>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <h3 className="package-name">{service.name}</h3>
                      <p className="package-description">
                        {service.description || 'Dịch vụ chuyên nghiệp cho xe VinFast'}
                      </p>

                      <div className="package-pricing">
                        <div className="price-container">
                          <span className="price">{formatPrice(service.price)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button 
                        className="btn-outline btn-full"
                        onClick={() => handleViewDetails(service)}
                      >
                        <Info className="btn-icon" />
                        Xem Chi Tiết
                      </button>
                      <button 
                        className="btn-primary btn-full"
                        onClick={() => navigate('/booking', { state: { serviceId: service.id } })}
                      >
                        Đặt Lịch Ngay
                        <ArrowRight className="btn-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredPackages.length === 0 ? (
              <div className="empty-state">
                <Package className="empty-icon" />
                <h3>Không tìm thấy gói dịch vụ</h3>
                <p>Hãy thử tìm kiếm với từ khóa khác</p>
              </div>
            ) : (
              <div className="services-grid">
                {filteredPackages.map((pkg) => (
                <div key={pkg.packageId} className="service-card">
                  <div className="card-header">
                    <div className="service-badge">
                      <Star className="badge-icon" />
                      <span>Phổ biến</span>
                    </div>
                    <div className="service-category">{pkg.serviceName}</div>
                  </div>
                  
                    <div className="card-content">
                    <h3 className="package-name">{pkg.packageName}</h3>
                    <p className="package-description">
                      {pkg.description || `Gói dịch vụ ${pkg.serviceName} với ${pkg.totalCredits} lần sử dụng`}
                    </p>
                    
                    <div className="package-features">
                      <div className="feature-item">
                        <Package className="feature-icon" />
                        <span>{pkg.totalCredits} lần sử dụng</span>
                      </div>
                    </div>

                    <div className="package-pricing">
                      <div className="price-container">
                        <span className="price">{formatPrice(pkg.price)}</span>
                        {pkg.discountPercent && pkg.discountPercent > 0 && (
                          <span className="discount">-{pkg.discountPercent}%</span>
                        )}
                      </div>
                      {pkg.validFrom && pkg.validTo && (
                        <div className="validity">
                          Áp dụng: {new Date(pkg.validFrom).toLocaleDateString('vi-VN')} - {new Date(pkg.validTo).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card-actions">
                    <button 
                      className="btn-primary btn-full"
                      onClick={() => navigate('/booking', { state: { packageId: pkg.packageId } })}
                    >
                      Chọn Gói
                      <ArrowRight className="btn-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        </div>
      </section>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        service={selectedService}
        onBookService={handleBookService}
      />
    </div>
  )
}

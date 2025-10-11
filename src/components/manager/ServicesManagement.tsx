import { useState, useEffect } from 'react'
import { 
  Wrench,
  ClipboardList,
  DollarSign,
  CheckCircle,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  X
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ServiceManagementService, type Service, type ServiceStats, type ServiceBooking, type ServicePerformance, type ServicePart } from '../../services/serviceManagementService'

export default function ServicesManagement() {
  // State Quản lý Dịch vụ
  const [apiServices, setApiServices] = useState<Service[]>([])
  const [apiServiceStats, setApiServiceStats] = useState<ServiceStats | null>(null)
  const [apiServicePerformance, setApiServicePerformance] = useState<ServicePerformance[]>([])
  const [apiRecentBookings, setApiRecentBookings] = useState<ServiceBooking[]>([])
  const [serviceCategories, setServiceCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Bộ lọc/Phân trang dịch vụ
  const [servicePage, setServicePage] = useState(1)
  const [servicePageSize, setServicePageSize] = useState(10)
  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')
  const [serviceOnlyActive, setServiceOnlyActive] = useState(false)
  
  // Modal chi tiết dịch vụ
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false)
  const [serviceDetailLoading, setServiceDetailLoading] = useState(false)
  const [serviceDetailError, setServiceDetailError] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceParts, setServiceParts] = useState<ServicePart[]>([])
  
  // Modal tạo/cập nhật dịch vụ
  const [serviceFormOpen, setServiceFormOpen] = useState(false)
  const [serviceFormSubmitting, setServiceFormSubmitting] = useState(false)
  const [serviceFormError, setServiceFormError] = useState<string | null>(null)
  const [serviceFormMode, setServiceFormMode] = useState<'create' | 'update'>('create')
  const [serviceFormValues, setServiceFormValues] = useState<{ 
    id?: number; 
    name: string; 
    description: string; 
    price: number; 
    isActive: boolean 
  }>({ 
    name: '', 
    description: '', 
    price: 0, 
    isActive: true 
  })

  // Quản lý phụ tùng dịch vụ
  const [partsModalOpen, setPartsModalOpen] = useState(false)
  const [partsLoading, setPartsLoading] = useState(false)
  const [newPart, setNewPart] = useState<Omit<ServicePart, 'partId'>>({
    partName: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0
  })

  // Hàm API
  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = { 
        pageNumber: servicePage, 
        pageSize: servicePageSize,
        search: serviceSearch
      }
      if (serviceCategory) params.category = serviceCategory
      
      const response = serviceOnlyActive
        ? await ServiceManagementService.getActiveServices(params)
        : await ServiceManagementService.getServices(params)
      setApiServices(response.services)
    } catch (err) {
      setError('Không thể tải danh sách dịch vụ')
      console.error('Lỗi khi tải dịch vụ:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchServiceStats = async () => {
    try {
      const stats = await ServiceManagementService.getServiceStats()
      setApiServiceStats(stats)
    } catch (err) {
      console.error('Lỗi khi tải thống kê dịch vụ:', err)
    }
  }

  const fetchServicePerformance = async () => {
    try {
      const performance = await ServiceManagementService.getServicePerformance()
      setApiServicePerformance(performance)
    } catch (err) {
      console.error('Lỗi khi tải hiệu suất dịch vụ:', err)
    }
  }

  const fetchRecentBookings = async () => {
    try {
      const bookings = await ServiceManagementService.getRecentBookings(10)
      setApiRecentBookings(bookings)
    } catch (err) {
      console.error('Lỗi khi tải đơn đặt gần đây:', err)
    }
  }

  const fetchServiceCategories = async () => {
    try {
      const categories = await ServiceManagementService.getServiceCategories()
      setServiceCategories(categories)
    } catch (err) {
      console.error('Lỗi khi tải danh mục dịch vụ:', err)
    }
  }

  const openServiceDetail = async (id: number) => {
    try {
      setServiceDetailLoading(true)
      setServiceDetailError(null)
      setServiceDetailOpen(true)
      const detail = await ServiceManagementService.getServiceById(id)
      setSelectedService(detail)
      
      // Tải phụ tùng dịch vụ
      const parts = await ServiceManagementService.getServiceParts(id)
      setServiceParts(parts)
    } catch (err) {
      console.error('Lỗi khi tải chi tiết dịch vụ:', err)
      setServiceDetailError('Không thể tải chi tiết dịch vụ')
    } finally {
      setServiceDetailLoading(false)
    }
  }

  const openCreateService = () => {
    setServiceFormMode('create')
    setServiceFormValues({ name: '', description: '', price: 0, isActive: true })
    setServiceFormError(null)
    setServiceFormOpen(true)
  }

  const openEditService = (s: Service) => {
    setServiceFormMode('update')
    setServiceFormValues({ 
      id: s.id, 
      name: s.name, 
      description: s.description, 
      price: s.price, 
      isActive: s.isActive 
    })
    setServiceFormError(null)
    setServiceFormOpen(true)
  }

  const submitServiceForm = async () => {
    try {
      setServiceFormSubmitting(true)
      setServiceFormError(null)
      
      // Validation
      if (!serviceFormValues.name.trim()) {
        setServiceFormError('Tên dịch vụ là bắt buộc')
        return
      }
      if (serviceFormValues.price < 0) {
        setServiceFormError('Giá phải lớn hơn hoặc bằng 0')
        return
      }

      if (serviceFormMode === 'create') {
        await ServiceManagementService.createService({
          name: serviceFormValues.name,
          description: serviceFormValues.description,
          price: serviceFormValues.price,
          isActive: serviceFormValues.isActive,
          createAt: new Date().toISOString()
        } as any)
      } else {
        await ServiceManagementService.updateService(serviceFormValues.id as number, {
          name: serviceFormValues.name,
          description: serviceFormValues.description,
          price: serviceFormValues.price,
          isActive: serviceFormValues.isActive
        })
      }
      setServiceFormOpen(false)
      await fetchServices()
    } catch (err) {
      console.error('Lỗi khi gửi form dịch vụ:', err)
      setServiceFormError('Không thể lưu dịch vụ')
    } finally {
      setServiceFormSubmitting(false)
    }
  }

  const handleDeleteService = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      try {
        await ServiceManagementService.deleteService(id)
        await fetchServices()
      } catch (err) {
        console.error('Lỗi khi xóa dịch vụ:', err)
        alert('Không thể xóa dịch vụ')
      }
    }
  }

  const handleToggleServiceStatus = async (id: number) => {
    try {
      await ServiceManagementService.updateServiceStatus(id)
      await fetchServices()
      // Làm mới chi tiết nếu đang mở
      if (selectedService && selectedService.id === id) {
        const updated = await ServiceManagementService.getServiceById(id)
        setSelectedService(updated)
      }
    } catch (err) {
      console.error('Lỗi khi chuyển trạng thái dịch vụ:', err)
      alert('Không thể cập nhật trạng thái dịch vụ')
    }
  }

  const openPartsManagement = async (serviceId: number) => {
    try {
      setPartsLoading(true)
      const parts = await ServiceManagementService.getServiceParts(serviceId)
      setServiceParts(parts)
      setPartsModalOpen(true)
    } catch (err) {
      console.error('Lỗi khi tải phụ tùng dịch vụ:', err)
      alert('Không thể tải phụ tùng dịch vụ')
    } finally {
      setPartsLoading(false)
    }
  }

  const addServicePart = async () => {
    if (!selectedService || !newPart.partName.trim() || newPart.quantity <= 0 || newPart.unitPrice < 0) {
      alert('Vui lòng điền đầy đủ thông tin phụ tùng')
      return
    }

    try {
      await ServiceManagementService.addServicePart(selectedService.id, {
        ...newPart,
        totalPrice: newPart.quantity * newPart.unitPrice
      })
      // Làm mới danh sách phụ tùng
      const parts = await ServiceManagementService.getServiceParts(selectedService.id)
      setServiceParts(parts)
      setNewPart({ partName: '', quantity: 1, unitPrice: 0, totalPrice: 0 })
    } catch (err) {
      console.error('Lỗi khi thêm phụ tùng:', err)
      alert('Không thể thêm phụ tùng')
    }
  }

  const removeServicePart = async (partId: number) => {
    if (!selectedService) return

    if (window.confirm('Bạn có chắc chắn muốn xóa phụ tùng này?')) {
      try {
        await ServiceManagementService.removeServicePart(selectedService.id, partId)
        // Làm mới danh sách phụ tùng
        const parts = await ServiceManagementService.getServiceParts(selectedService.id)
        setServiceParts(parts)
      } catch (err) {
        console.error('Lỗi khi xóa phụ tùng:', err)
        alert('Không thể xóa phụ tùng')
      }
    }
  }

  // Tải dữ liệu khi component mount
  useEffect(() => {
    // Tải tất cả dữ liệu liên quan đến dịch vụ
    Promise.all([
      fetchServices(),
      fetchServiceStats(),
      fetchServicePerformance(),
      fetchRecentBookings(),
      fetchServiceCategories()
    ]).catch(err => {
      console.error('Lỗi khi tải dữ liệu dịch vụ:', err)
      setError('Không thể tải dữ liệu dịch vụ')
    })
  }, [servicePage, servicePageSize, serviceSearch, serviceCategory, serviceOnlyActive])

  // Chuyển đổi dữ liệu API để hiển thị
  const serviceStatsArray = apiServiceStats ? [
    {
      title: 'Tổng số dịch vụ',
      value: apiServiceStats.totalServices.toString(),
      unit: 'dịch vụ',
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: Wrench,
      color: 'var(--primary-500)'
    },
    {
      title: 'Đơn đặt dịch vụ',
      value: apiServiceStats.serviceBookings.toString(),
      unit: 'đơn đặt',
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: ClipboardList,
      color: 'var(--success-500)'
    },
    {
      title: 'Doanh thu dịch vụ',
      value: (apiServiceStats.serviceRevenue / 1000000).toFixed(1),
      unit: 'triệu VNĐ',
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: DollarSign,
      color: 'var(--info-500)'
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: apiServiceStats.completionRate.toFixed(1),
      unit: '%',
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: CheckCircle,
      color: 'var(--warning-500)'
    }
  ] : []

  // Dữ liệu mẫu cho fallback
  const servicePerformanceData = [
    { service: 'Bảo dưỡng', bookings: 45, revenue: 12000000 },
    { service: 'Sửa chữa', bookings: 38, revenue: 18000000 },
    { service: 'Lốp xe', bookings: 28, revenue: 8000000 },
    { service: 'Điện', bookings: 22, revenue: 6000000 },
    { service: 'Phanh', bookings: 35, revenue: 10000000 }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Quản lý Dịch vụ
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchServices}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--border-primary)',
              background: 'transparent',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Search size={16} />
            Làm mới
          </button>
          
          <input
            placeholder="Tìm kiếm dịch vụ..."
            value={serviceSearch}
            onChange={(e) => { setServicePage(1); setServiceSearch(e.target.value) }}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              width: '200px'
            }}
          />

          <select
            value={serviceCategory}
            onChange={(e) => { setServicePage(1); setServiceCategory(e.target.value) }}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="">Tất cả danh mục</option>
            {serviceCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '14px' }}>
            <input 
              type="checkbox" 
              checked={serviceOnlyActive} 
              onChange={(e) => { setServicePage(1); setServiceOnlyActive(e.target.checked) }} 
            />
            Chỉ hiện hoạt động
          </label>

          <select
            value={servicePageSize}
            onChange={(e) => { setServicePage(1); setServicePageSize(Number(e.target.value)) }}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value={10}>10 mỗi trang</option>
            <option value={20}>20 mỗi trang</option>
            <option value={50}>50 mỗi trang</option>
          </select>

          <button onClick={openCreateService} style={{
            padding: '10px 20px',
            background: 'var(--primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Plus size={16} />
            Thêm dịch vụ
          </button>
        </div>
      </div>
      
      {/* Thống kê Dịch vụ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {apiServiceStats ? serviceStatsArray.map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: stat.color,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={24} />
              </div>
              <div style={{
                padding: '4px 8px',
                borderRadius: '20px',
                background: stat.changeType === 'positive' ? 'var(--success-50)' : 'var(--error-50)',
                color: stat.changeType === 'positive' ? 'var(--success-700)' : 'var(--error-700)',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {stat.change}
              </div>
            </div>
            <h3 style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              margin: '0 0 8px 0',
              fontWeight: '500'
            }}>
              {stat.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'var(--text-primary)'
              }}>
                {stat.value}
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)'
              }}>
                {stat.unit}
              </span>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Đang tải thống kê dịch vụ...
          </div>
        )}
      </div>

      {/* Nội dung Quản lý Dịch vụ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Danh sách Dịch vụ */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Danh sách Dịch vụ ({apiServices.length})
          </h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Đang tải dịch vụ...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error-500)' }}>
                {error}
              </div>
            ) : apiServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Không tìm thấy dịch vụ nào
              </div>
            ) : (
              apiServices.map((service, index) => (
                <div 
                  key={service.id}
                  style={{
                    padding: '16px',
                    borderBottom: index < apiServices.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary-50)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--primary-500)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    <Wrench size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      margin: '0 0 4px 0'
                    }}>
                      {service.name}
                    </p>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
                      margin: '0 0 4px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {service.description}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {new Date(service.createAt).toLocaleDateString()}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: 'var(--success-600)'
                      }}>
                        {(service.price || 0).toLocaleString()} VNĐ
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: service.isActive ? 'var(--success-50)' : 'var(--error-50)',
                      color: service.isActive ? 'var(--success-700)' : 'var(--error-700)',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {service.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </div>
                    <button
                      onClick={async (e) => { e.stopPropagation(); openServiceDetail(service.id) }}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditService(service) }}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      title="Sửa dịch vụ"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={async (e) => { e.stopPropagation(); handleToggleServiceStatus(service.id) }}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      title="Chuyển trạng thái"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={async (e) => { e.stopPropagation(); handleDeleteService(service.id) }}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--error-500)',
                        cursor: 'pointer'
                      }}
                      title="Xóa dịch vụ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)' }}>
            <button
              onClick={() => setServicePage(Math.max(1, servicePage - 1))}
              disabled={servicePage === 1}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-primary)',
                background: 'transparent',
                color: servicePage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                borderRadius: '8px',
                cursor: servicePage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Trước
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Trang {servicePage}</span>
            <button
              onClick={() => setServicePage(servicePage + 1)}
              disabled={apiServices.length < servicePageSize}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-primary)',
                background: 'transparent',
                color: apiServices.length < servicePageSize ? 'var(--text-tertiary)' : 'var(--text-primary)',
                borderRadius: '8px',
                cursor: apiServices.length < servicePageSize ? 'not-allowed' : 'pointer'
              }}
            >
              Tiếp
            </button>
          </div>
        </div>

        {/* Hiệu suất Dịch vụ */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Hiệu suất Dịch vụ
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={apiServicePerformance.length > 0 ? apiServicePerformance : servicePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis 
                dataKey="service" 
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                formatter={(value, name) => [
                  name === 'revenue' ? `${Number(value || 0).toLocaleString()} VNĐ` : value,
                  name === 'revenue' ? 'Doanh thu' : 'Số đơn đặt'
                ]}
              />
              <Legend />
              <Bar dataKey="bookings" fill="var(--primary-500)" name="Số đơn đặt" />
              <Bar dataKey="revenue" fill="var(--success-500)" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Đơn đặt Dịch vụ Gần đây */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            Đơn đặt Dịch vụ Gần đây
          </h3>
          <button style={{
            padding: '8px 16px',
            background: 'var(--primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Xem tất cả
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Mã đơn</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Dịch vụ</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Khách hàng</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Chi nhánh</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Giá</th>
              </tr>
            </thead>
            <tbody>
              {apiRecentBookings.length > 0 ? apiRecentBookings.map((booking, index) => (
                <tr key={booking.id} style={{ borderBottom: index < apiRecentBookings.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                  <td style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>#{booking.id}</td>
                  <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-primary)' }}>{booking.service}</td>
                  <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-primary)' }}>{booking.customer}</td>
                  <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-primary)' }}>{booking.branch}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: 
                        booking.status === 'completed' ? 'var(--success-50)' :
                        booking.status === 'in_progress' ? 'var(--warning-50)' :
                        'var(--primary-50)',
                      color: 
                        booking.status === 'completed' ? 'var(--success-700)' :
                        booking.status === 'in_progress' ? 'var(--warning-700)' :
                        'var(--primary-700)'
                    }}>
                      {booking.status === 'completed' ? 'Hoàn thành' :
                       booking.status === 'in_progress' ? 'Đang thực hiện' : 'Đã lên lịch'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'right' }}>
                    {(booking.price || 0).toLocaleString()} VNĐ
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Không tìm thấy đơn đặt gần đây
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Dịch vụ */}
      {serviceFormOpen && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 2000 
        }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            color: 'var(--text-primary)', 
            borderRadius: '12px',
            border: '1px solid var(--border-primary)', 
            width: '500px', 
            maxWidth: '90vw', 
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                {serviceFormMode === 'create' ? 'Tạo Dịch vụ Mới' : 'Cập nhật Dịch vụ'}
              </h3>
              <button
                onClick={() => setServiceFormOpen(false)}
                style={{ 
                  border: 'none', 
                  background: 'transparent', 
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {serviceFormError && (
              <div style={{ 
                marginBottom: '16px', 
                color: 'var(--error-600)', 
                fontSize: '14px',
                padding: '12px',
                background: 'var(--error-50)',
                borderRadius: '8px',
                border: '1px solid var(--error-200)'
              }}>
                {serviceFormError}
              </div>
            )}
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  Tên dịch vụ *
                </label>
                <input
                  value={serviceFormValues.name}
                  onChange={(e) => setServiceFormValues(v => ({ ...v, name: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '8px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px' 
                  }}
                  placeholder="Nhập tên dịch vụ"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  Mô tả
                </label>
                <textarea
                  value={serviceFormValues.description}
                  onChange={(e) => setServiceFormValues(v => ({ ...v, description: e.target.value }))}
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '8px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px', 
                    resize: 'vertical' 
                  }}
                  placeholder="Nhập mô tả dịch vụ"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  Giá (VNĐ) *
                </label>
                <input
                  type="number"
                  value={serviceFormValues.price}
                  onChange={(e) => setServiceFormValues(v => ({ ...v, price: Number(e.target.value) }))}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '8px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px' 
                  }}
                  min={0}
                  step={1000}
                  placeholder="Nhập giá dịch vụ"
                />
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '14px' }}>
                <input 
                  type="checkbox" 
                  checked={serviceFormValues.isActive} 
                  onChange={(e) => setServiceFormValues(v => ({ ...v, isActive: e.target.checked }))} 
                />
                Dịch vụ đang hoạt động
              </label>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => setServiceFormOpen(false)}
                  style={{ 
                    border: '1px solid var(--border-primary)', 
                    background: 'transparent', 
                    color: 'var(--text-primary)', 
                    borderRadius: '8px', 
                    padding: '10px 20px', 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    fontWeight: 500 
                  }}
                >
                  Hủy
                </button>
                <button
                  disabled={serviceFormSubmitting}
                  onClick={submitServiceForm}
                  style={{ 
                    border: 'none', 
                    background: 'var(--primary-500)', 
                    color: 'white', 
                    borderRadius: '8px', 
                    padding: '10px 20px', 
                    cursor: serviceFormSubmitting ? 'not-allowed' : 'pointer', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    opacity: serviceFormSubmitting ? 0.7 : 1 
                  }}
                >
                  {serviceFormSubmitting ? 'Đang lưu...' : (serviceFormMode === 'create' ? 'Tạo Dịch vụ' : 'Cập nhật Dịch vụ')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Dịch vụ */}
      {serviceDetailOpen && (
        <div style={{
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 2000
        }}>
          <div style={{
            background: 'var(--bg-card)', 
            color: 'var(--text-primary)', 
            borderRadius: '12px',
            border: '1px solid var(--border-primary)', 
            width: '600px', 
            maxWidth: '90vw', 
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Chi tiết Dịch vụ</h3>
              <button
                onClick={() => { setServiceDetailOpen(false); setSelectedService(null); setServiceParts([]); }}
                style={{
                  border: 'none', 
                  background: 'transparent', 
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {serviceDetailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải chi tiết dịch vụ...</div>
            ) : serviceDetailError ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error-500)' }}>{serviceDetailError}</div>
            ) : selectedService ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Tên dịch vụ</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600' }}>{selectedService.name}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Giá</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: 'var(--success-600)' }}>
                      {(selectedService.price || 0).toLocaleString()} VNĐ
                    </p>
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Mô tả</label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', lineHeight: '1.5' }}>{selectedService.description}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Trạng thái</label>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: selectedService.isActive ? 'var(--success-50)' : 'var(--error-50)',
                      color: selectedService.isActive ? 'var(--success-700)' : 'var(--error-700)',
                      fontSize: '12px',
                      fontWeight: '600',
                      width: 'fit-content',
                      marginTop: '4px'
                    }}>
                      {selectedService.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Ngày tạo</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                      {new Date(selectedService.createAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Quản lý Phụ tùng Dịch vụ */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Phụ tùng Dịch vụ</label>
                    <button
                      onClick={() => setPartsModalOpen(true)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--border-primary)',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Quản lý Phụ tùng
                    </button>
                  </div>
                  
                  {serviceParts.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                      Chưa có phụ tùng nào được gán cho dịch vụ này
                    </p>
                  ) : (
                    <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
                      {serviceParts.map((part, index) => (
                        <div key={part.partId} style={{ 
                          padding: '12px', 
                          borderBottom: index < serviceParts.length - 1 ? '1px solid var(--border-primary)' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>{part.partName}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {part.quantity} x {(part.unitPrice || 0).toLocaleString()} VNĐ
                            </p>
                          </div>
                          <p style={{ margin: 0, fontWeight: '600', color: 'var(--success-600)' }}>
                            {(part.totalPrice || 0).toLocaleString()} VNĐ
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={async () => handleToggleServiceStatus(selectedService.id)}
                    style={{
                      padding: '10px 16px',
                      border: '1px solid var(--border-primary)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    {selectedService.isActive ? 'Ngừng hoạt động' : 'Kích hoạt'} Dịch vụ
                  </button>
                  <button
                    onClick={() => openEditService(selectedService)}
                    style={{
                      padding: '10px 16px',
                      border: 'none',
                      background: 'var(--primary-500)',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    Sửa Dịch vụ
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có dữ liệu dịch vụ</div>
            )}
          </div>
        </div>
      )}

      {/* Modal Quản lý Phụ tùng Dịch vụ */}
      {partsModalOpen && selectedService && (
        <div style={{
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 2001
        }}>
          <div style={{
            background: 'var(--bg-card)', 
            color: 'var(--text-primary)', 
            borderRadius: '12px',
            border: '1px solid var(--border-primary)', 
            width: '700px', 
            maxWidth: '90vw', 
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Quản lý Phụ tùng - {selectedService.name}
              </h3>
              <button
                onClick={() => setPartsModalOpen(false)}
                style={{
                  border: 'none', 
                  background: 'transparent', 
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Thêm Phụ tùng Mới */}
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid var(--border-primary)'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Thêm Phụ tùng Mới</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Tên phụ tùng</label>
                  <input
                    value={newPart.partName}
                    onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                    placeholder="Nhập tên phụ tùng"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Số lượng</label>
                  <input
                    type="number"
                    value={newPart.quantity}
                    onChange={(e) => setNewPart({ 
                      ...newPart, 
                      quantity: Number(e.target.value),
                      totalPrice: Number(e.target.value) * newPart.unitPrice
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                    min={1}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Đơn giá</label>
                  <input
                    type="number"
                    value={newPart.unitPrice}
                    onChange={(e) => setNewPart({ 
                      ...newPart, 
                      unitPrice: Number(e.target.value),
                      totalPrice: newPart.quantity * Number(e.target.value)
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                    min={0}
                    step={1000}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Tổng</label>
                  <input
                    value={(newPart.totalPrice || 0).toLocaleString()}
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <button
                  onClick={addServicePart}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    background: 'var(--primary-500)',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    height: 'fit-content'
                  }}
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Danh sách Phụ tùng */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Phụ tùng Hiện tại</h4>
              {partsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Đang tải phụ tùng...</div>
              ) : serviceParts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Chưa có phụ tùng nào được gán cho dịch vụ này
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-primary)',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)'
                  }}>
                    <div>Tên phụ tùng</div>
                    <div>Số lượng</div>
                    <div>Đơn giá</div>
                    <div>Thành tiền</div>
                    <div>Thao tác</div>
                  </div>
                  {serviceParts.map((part) => (
                    <div key={part.partId} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                      padding: '12px',
                      borderBottom: '1px solid var(--border-primary)',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontWeight: '500' }}>{part.partName}</div>
                      <div>{part.quantity}</div>
                      <div>{(part.unitPrice || 0).toLocaleString()} VNĐ</div>
                      <div style={{ fontWeight: '600', color: 'var(--success-600)' }}>{(part.totalPrice || 0).toLocaleString()} VNĐ</div>
                      <div>
                        <button
                          onClick={() => removeServicePart(part.partId)}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid var(--error-200)',
                            background: 'var(--error-50)',
                            color: 'var(--error-600)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}